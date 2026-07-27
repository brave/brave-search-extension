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
});
