import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { filterKeys } from './utils.js';

describe('filterKeys (real kBrowsers)', () => {
  const sampleInput = {
    name: 'My Extension',
    version: '1.0.0',
    'firefox:browser_specific_settings': {
      gecko: {
        id: 'addon@example.com',
      },
    },
    'chromium:externally_connectable': {
      matches: ['*://*.example.com/*'],
    },
    'tests:internal_key': 'should not be removed',
    permissions: ['storage'],
  };

  test('includes only firefox-specific keys for firefox', () => {
    const result = filterKeys(sampleInput, 'firefox');

    assert.deepStrictEqual(result, {
      name: 'My Extension',
      version: '1.0.0',
      browser_specific_settings: {
        gecko: {
          id: 'addon@example.com',
        },
      },
      'tests:internal_key': 'should not be removed',
      permissions: ['storage'],
    });
  });

  test('includes only chromium-specific keys for chromium', () => {
    const result = filterKeys(sampleInput, 'chromium');

    assert.deepStrictEqual(result, {
      name: 'My Extension',
      version: '1.0.0',
      externally_connectable: {
        matches: ['*://*.example.com/*'],
      },
      'tests:internal_key': 'should not be removed',
      permissions: ['storage'],
    });
  });

  test('excludes all browser-prefixed keys if prefix is unknown', () => {
    const result = filterKeys(sampleInput, 'opera');

    assert.deepStrictEqual(result, {
      name: 'My Extension',
      version: '1.0.0',
      'tests:internal_key': 'should not be removed',
      permissions: ['storage'],
    });
  });

  test('is case-insensitive when matching the requested prefix', () => {
    const result = filterKeys(sampleInput, 'FIREFOX');

    assert.deepStrictEqual(result, {
      name: 'My Extension',
      version: '1.0.0',
      browser_specific_settings: {
        gecko: {
          id: 'addon@example.com',
        },
      },
      'tests:internal_key': 'should not be removed',
      permissions: ['storage'],
    });
  });
});

describe('filterKeys (nested and array values)', () => {
  // Mirrors the real manifest shape, where a plain (unprefixed) object
  // contains browser-prefixed leaf keys - e.g. chrome_settings_overrides.
  const nestedInput = {
    search_provider: {
      'chromium:favicon_url': 'https://example.com/chromium-icon.png',
      'firefox:favicon_url': 'icons/firefox-icon.png',
      name: 'Example',
    },
  };

  test('recursively filters prefixed keys nested inside a plain object', () => {
    const result = filterKeys(nestedInput, 'firefox');

    assert.deepStrictEqual(result, {
      search_provider: {
        favicon_url: 'icons/firefox-icon.png',
        name: 'Example',
      },
    });
  });

  test('recursively filters prefixed keys on objects nested inside arrays', () => {
    const arrayInput = {
      engines: [
        {
          'chromium:favicon_url': 'https://example.com/chromium-icon.png',
          'firefox:favicon_url': 'icons/firefox-icon.png',
          name: 'Example',
        },
        'plain string entry',
      ],
    };

    const result = filterKeys(arrayInput, 'chromium');

    assert.deepStrictEqual(result, {
      engines: [
        {
          favicon_url: 'https://example.com/chromium-icon.png',
          name: 'Example',
        },
        'plain string entry',
      ],
    });
  });
});
