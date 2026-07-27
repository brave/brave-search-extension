import { kBrowsers } from './common.js';

/**
 * Recursively filters an object, giving consideration to prefixes if they exist.
 * Plain objects nested inside arrays are also filtered, so a prefixed key can
 * appear at any depth, not just directly under another object.
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

    result[kBase] = filterValue(value, prefix);
  }

  return result;
}

/**
 * Applies filterKeys to plain objects, recurses into arrays to reach any
 * objects they contain, and passes everything else through unchanged.
 *
 * @param {*} value - The value to filter.
 * @param {string} prefix - Which prefixed properties to include.
 * @returns {*} The filtered value.
 */
function filterValue(value, prefix) {
  if (Array.isArray(value)) {
    return value.map((item) => filterValue(item, prefix));
  }

  if (value && typeof value === 'object') {
    return filterKeys(value, prefix);
  }

  return value;
}
