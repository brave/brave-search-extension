// nodejs dependencies
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// third-party dependencies
import JSZip from 'jszip';
import stripJSONComments from 'strip-json-comments';

// local dependencies
import { filterKeys } from './utils.js';
import { kBrowsers, kCopyableResourceExtensions } from './common.js';

// path to the package directory
const PACKAGE_DIRECTORY = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'packages',
);

// path to the base manifest
const BASE_MANIFEST_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'manifest.jsonc',
);

// path to package.json
const PACKAGE_JSON_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'package.json',
);

export default async function main() {
  // Create the package directory exists and is empty
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
    const extDirectory = await fs.mkdir(path.join(PACKAGE_DIRECTORY, browser), {
      recursive: true,
    });

    // Build the browser manifest from the base manifest
    const manifest = await filterKeys(parsedBaseManifest, browser);
    const manifestPath = path.join(extDirectory, 'manifest.json');
    const manifestString = JSON.stringify(manifest, null, 4);

    // Write the manifest to the extension directory and copy resources
    await fs.writeFile(manifestPath, manifestString);
    await copyManifestResourcesToDestination(manifest, basePath, extDirectory);

    // Create the zip file
    const zip = new JSZip();
    const zipName = `${browser}.zip`;

    // Add the manifest and resources to the zip file
    zip.file('manifest.json', manifestString);
    await copyManifestResourcesToDestination(manifest, basePath, zip);

    // Write the zip file to disk
    await fs.writeFile(
      path.join(PACKAGE_DIRECTORY, zipName),
      await zip.generateAsync({ type: 'nodebuffer' }),
    );
  }

  console.log(`Successfully built extension packages for version ${version}`);
}

function getManifestResources(manifest) {
  const resources = [];

  for (const value of Object.values(manifest)) {
    if (typeof value === 'string' && isRelativeResourcePath(value)) {
      resources.push(value);
    } else if (typeof value === 'object') {
      resources.push(...getManifestResources(value));
    }
  }

  return resources;
}

function isRelativeResourcePath(value) {
  // Don't include URLs to otherwise copyable resource types.
  if (['http:', 'https:'].some((protocol) => value.startsWith(protocol))) {
    return false;
  }

  // Try to determine if the value is a resource path of some sort.
  return kCopyableResourceExtensions.some((ext) => value.endsWith(ext));
}

/**
 * Copies manifest resources to the specified destination.
 *
 * @param {Object} manifest - The manifest object containing resource information.
 * @param {string} sourceDir - The source directory where the resources are located.
 * @param {JSZip|string} destEntity - The destination entity, which can be a JSZip instance or a directory path.
 * @returns {Promise<void>} A promise that resolves when the resources have been copied.
 */
async function copyManifestResourcesToDestination(
  manifest,
  sourceDir,
  destEntity,
) {
  // We may be adding to a JSZip file, or a directory.
  for (const resourcePath of getManifestResources(manifest)) {
    const source = path.join(sourceDir, resourcePath);

    // Maybe write to the zip file
    if (destEntity instanceof JSZip) {
      const normalizedPath = resourcePath.replace(/\\/g, '/');
      destEntity.file(normalizedPath, await fs.readFile(source));
      continue;
    }

    // Make sure the destination directory exists
    const destination = path.join(destEntity, resourcePath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  }
}
