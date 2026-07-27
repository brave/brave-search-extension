import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import JSZip from 'jszip';

import main, { copyDirectory, copyExtensionResources } from './package.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(dirname, '..');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'brave-search-ext-test-'));
}

async function assertMissing(filePath) {
  await assert.rejects(fs.access(filePath));
}

describe('copyDirectory', () => {
  test('copies only files matching the given extensions, recursing into subdirectories', async (t) => {
    const sourceDir = await makeTempDir();
    const destDir = await makeTempDir();
    t.after(() =>
      Promise.all([
        fs.rm(sourceDir, { recursive: true, force: true }),
        fs.rm(destDir, { recursive: true, force: true }),
      ]),
    );

    await fs.writeFile(path.join(sourceDir, 'keep.svg'), 'svg-content');
    await fs.writeFile(path.join(sourceDir, 'skip.png'), 'png-content');
    await fs.mkdir(path.join(sourceDir, 'sub'));
    await fs.writeFile(path.join(sourceDir, 'sub', 'nested.svg'), 'nested-svg');
    await fs.writeFile(path.join(sourceDir, 'sub', 'nested.png'), 'nested-png');

    await copyDirectory(sourceDir, 'assets', destDir, ['.svg']);

    assert.equal(
      await fs.readFile(path.join(destDir, 'assets', 'keep.svg'), 'utf-8'),
      'svg-content',
    );
    assert.equal(
      await fs.readFile(
        path.join(destDir, 'assets', 'sub', 'nested.svg'),
        'utf-8',
      ),
      'nested-svg',
    );
    await assertMissing(path.join(destDir, 'assets', 'skip.png'));
    await assertMissing(path.join(destDir, 'assets', 'sub', 'nested.png'));
  });

  test('copies every file when no extension filter is given', async (t) => {
    const sourceDir = await makeTempDir();
    const destDir = await makeTempDir();
    t.after(() =>
      Promise.all([
        fs.rm(sourceDir, { recursive: true, force: true }),
        fs.rm(destDir, { recursive: true, force: true }),
      ]),
    );

    await fs.writeFile(path.join(sourceDir, 'file.bin'), 'binary-content');

    await copyDirectory(sourceDir, 'assets', destDir);

    assert.equal(
      await fs.readFile(path.join(destDir, 'assets', 'file.bin'), 'utf-8'),
      'binary-content',
    );
  });

  test('applies the same filtering when copying into a JSZip archive', async (t) => {
    const sourceDir = await makeTempDir();
    t.after(() => fs.rm(sourceDir, { recursive: true, force: true }));

    await fs.writeFile(path.join(sourceDir, 'keep.svg'), 'svg-content');
    await fs.writeFile(path.join(sourceDir, 'skip.png'), 'png-content');
    await fs.mkdir(path.join(sourceDir, 'sub'));
    await fs.writeFile(path.join(sourceDir, 'sub', 'nested.svg'), 'nested-svg');

    const archive = new JSZip();
    await copyDirectory(sourceDir, 'assets', archive, ['.svg']);

    assert.equal(
      await archive.file('assets/keep.svg').async('string'),
      'svg-content',
    );
    assert.equal(
      await archive.file('assets/sub/nested.svg').async('string'),
      'nested-svg',
    );
    assert.equal(archive.file('assets/skip.png'), null);
  });
});

describe('copyExtensionResources', () => {
  test("applies each asset directory's own extension rules", async (t) => {
    const sourceDir = await makeTempDir();
    const destDir = await makeTempDir();
    t.after(() =>
      Promise.all([
        fs.rm(sourceDir, { recursive: true, force: true }),
        fs.rm(destDir, { recursive: true, force: true }),
      ]),
    );

    // icons: no extension filter, everything ships
    await fs.mkdir(path.join(sourceDir, 'icons'));
    await fs.writeFile(path.join(sourceDir, 'icons', 'logo.png'), 'png');
    await fs.writeFile(path.join(sourceDir, 'icons', 'logo.svg'), 'svg');

    // newtab: restricted to ntpAssetTypes
    await fs.mkdir(path.join(sourceDir, 'newtab'));
    await fs.writeFile(path.join(sourceDir, 'newtab', 'index.html'), 'html');
    await fs.writeFile(
      path.join(sourceDir, 'newtab', 'design-reference.png'),
      'design-ref',
    );

    // _locales: restricted to .json
    await fs.mkdir(path.join(sourceDir, '_locales', 'en_US'), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(sourceDir, '_locales', 'en_US', 'messages.json'),
      '{}',
    );
    await fs.writeFile(
      path.join(sourceDir, '_locales', 'en_US', 'notes.txt'),
      'notes',
    );

    await copyExtensionResources(sourceDir, destDir);

    await fs.access(path.join(destDir, 'icons', 'logo.png'));
    await fs.access(path.join(destDir, 'icons', 'logo.svg'));

    await fs.access(path.join(destDir, 'newtab', 'index.html'));
    await assertMissing(path.join(destDir, 'newtab', 'design-reference.png'));

    await fs.access(path.join(destDir, '_locales', 'en_US', 'messages.json'));
    await assertMissing(path.join(destDir, '_locales', 'en_US', 'notes.txt'));
  });
});

describe('main (packaging integration)', () => {
  test('builds a manifest and archive for each configured browser', async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'),
    );
    const packageDirectory = path.join(PROJECT_ROOT, 'packages');

    await main();

    const chromiumManifest = JSON.parse(
      await fs.readFile(
        path.join(packageDirectory, 'chromium', 'manifest.json'),
        'utf-8',
      ),
    );
    const firefoxManifest = JSON.parse(
      await fs.readFile(
        path.join(packageDirectory, 'firefox', 'manifest.json'),
        'utf-8',
      ),
    );

    // Version comes from package.json, and unprefixed keys are shared.
    for (const manifest of [chromiumManifest, firefoxManifest]) {
      assert.equal(manifest.version, packageJson.version);
      assert.equal(manifest.manifest_version, 3);
    }

    // Browser-specific keys land only where they belong.
    assert.equal(chromiumManifest.browser_specific_settings, undefined);
    assert.equal(
      firefoxManifest.chrome_settings_overrides.search_provider.favicon_url,
      'icons/brave_64x64.png',
    );
    assert.equal(
      firefoxManifest.browser_specific_settings.gecko.strict_min_version,
      '140.0',
    );

    // Each archive contains the manifest plus every asset directory.
    for (const browser of ['chromium', 'firefox']) {
      const archive = await JSZip.loadAsync(
        await fs.readFile(path.join(packageDirectory, `${browser}.zip`)),
      );

      assert.ok(archive.file('manifest.json'));
      assert.ok(archive.file('icons/brave_128x128.png'));
      assert.ok(archive.file('newtab/index.html'));
      assert.ok(archive.file('_locales/en_US/messages.json'));
    }
  });
});
