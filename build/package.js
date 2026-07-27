// nodejs dependencies
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// third-party dependencies
import JSZip from 'jszip';
import stripJSONComments from 'strip-json-comments';

// local dependencies
import { filterKeys } from './utils.js';
import { kBrowsers } from './common.js';

// Runtime file types under src/newtab to bundle. Excludes things like
// design-reference screenshots that live alongside the source for
// convenience but shouldn't ship in the packaged extension.
export const ntpAssetTypes = ['.html', '.css', '.js', '.svg'];

// get the directory name of the current file
const dirname = path.dirname(fileURLToPath(import.meta.url));

// path to the package directory
const PACKAGE_DIRECTORY = path.join(dirname, '..', 'packages');

// path to the base manifest
const BASE_MANIFEST_PATH = path.join(dirname, '..', 'src', 'manifest.jsonc');

// path to package.json
const PACKAGE_JSON_PATH = path.join(dirname, '..', 'package.json');

export default async function main() {
  // Ensure the package directory exists and is empty
  await fs.rm(PACKAGE_DIRECTORY, { recursive: true, force: true });
  await fs.mkdir(PACKAGE_DIRECTORY, { recursive: true });

  // Read version from package.json
  const packageJsonContent = await fs.readFile(PACKAGE_JSON_PATH, 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);
  const version = packageJson.version;

  if (!version) {
    throw new Error('No version found in package.json');
  }

  console.log(`Building extension version ${version} from package.json`);

  // Get the base manifest without comments
  const basePath = path.dirname(BASE_MANIFEST_PATH);
  const baseManifest = await fs.readFile(BASE_MANIFEST_PATH, 'utf-8');
  const parsedBaseManifest = JSON.parse(stripJSONComments(baseManifest));

  // Inject version from package.json into the manifest
  parsedBaseManifest.version = version;

  // Generate all browser-specific extensions
  for (const browser of kBrowsers) {
    // Build the browser extension directory
    const browserDirectory = path.join(PACKAGE_DIRECTORY, browser);
    await fs.mkdir(browserDirectory, { recursive: true });

    // Build the browser manifest from the base manifest
    const manifest = filterKeys(parsedBaseManifest, browser);
    const manifestPath = path.join(browserDirectory, 'manifest.json');
    const manifestContent = JSON.stringify(manifest, null, 4);

    // Write the manifest to the extension directory and copy resources
    await fs.writeFile(manifestPath, manifestContent);
    await copyExtensionResources(basePath, browserDirectory);

    // Create the archive
    const archive = new JSZip();
    const archivePath = path.join(PACKAGE_DIRECTORY, `${browser}.zip`);

    // Add the manifest and resources to the archive
    archive.file('manifest.json', manifestContent);
    await copyExtensionResources(basePath, archive);

    // Write the archive to disk
    const archiveContent = await archive.generateAsync({ type: 'nodebuffer' });
    await fs.writeFile(archivePath, archiveContent);
  }

  console.log(`Successfully built extension packages for version ${version}`);
}

export async function copyExtensionResources(source, destination) {
  await copyDirectory(path.join(source, 'icons'), 'icons', destination);
  await copyDirectory(
    path.join(source, 'newtab'),
    'newtab',
    destination,
    ntpAssetTypes,
  );
  await copyDirectory(path.join(source, '_locales'), '_locales', destination, [
    '.json',
  ]);
}

/**
 * Recursively copies files in a directory to the specified destination.
 * Used for the asset directories (icons, newtab, _locales) that make up
 * everything a packaged extension needs beyond manifest.json itself.
 *
 * @param {string} sourceDir - The directory to copy files from.
 * @param {string} destPrefix - The path prefix to use at the destination.
 * @param {JSZip|string} destEntity - The destination entity, which can be a JSZip instance or a directory path.
 * @param {string[]|null} [extensions] - If provided, only files ending in one of these extensions are copied (e.g. to exclude design-reference images that live alongside runtime files but shouldn't ship).
 * @returns {Promise<void>} A promise that resolves when the files have been copied.
 */
export async function copyDirectory(
  sourceDir,
  destPrefix,
  destEntity,
  extensions = null,
) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const source = path.join(sourceDir, entry.name);
    const resourcePath = path.join(destPrefix, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(source, resourcePath, destEntity, extensions);
      continue;
    }

    if (!entry.isFile()) continue;
    if (extensions && !extensions.some((ext) => entry.name.endsWith(ext)))
      continue;

    if (destEntity instanceof JSZip) {
      destEntity.file(
        resourcePath.replace(/\\/g, '/'),
        await fs.readFile(source),
      );
      continue;
    }

    const destination = path.join(destEntity, resourcePath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  }
}
