import { filterKeys } from './utils.js';
import { test, describe, expect } from '@jest/globals';

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

    expect(result).toEqual({
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

    expect(result).toEqual({
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

    expect(result).toEqual({
      name: 'My Extension',
      version: '1.0.0',
      'tests:internal_key': 'should not be removed',
      permissions: ['storage'],
    });
  });
});
