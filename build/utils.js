import { kBrowsers } from './common.js';

/**
 * Recursively filters an object, giving consideration to prefixes if they exist.
 *
 * @param {Object} obj - The object to filter.
 * @param {string} prefix - Which prefixed properties to include.
 * @returns {Object} The filtered object.
 */
export function filterKeys(obj, prefix) {
  const result = {};

  // Normalize prefix once for reuse
  const normalizedPrefix = prefix.toLowerCase();

  // Iterate over each key-value pair in the object
  for (const [key, value] of Object.entries(obj)) {
    let kPrefix = null;
    let kBase = key;

    // Attempt to split keys like "chromium:someKey"
    const parts = key.split(':');

    // If there's a prefix and it's a known browser, split it out
    if (parts.length === 2 && kBrowsers.includes(parts[0].toLowerCase())) {
      [kPrefix, kBase] = parts;
    }

    // Skip if the prefix is a browser but doesn't match the desired one
    if (kPrefix && kBrowsers.includes(kPrefix.toLowerCase())) {
      if (kPrefix.toLowerCase() !== normalizedPrefix) continue;
    }

    // Recursively process plain objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[kBase] = filterKeys(value, prefix);
    } else {
      result[kBase] = value;
    }
  }

  return result;
}
