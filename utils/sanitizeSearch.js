/**
 * Search Input Sanitization Utility
 *
 * Prevents ReDoS (Regular Expression Denial of Service) attacks and unexpected
 * query behavior by escaping special wildcard characters in ILIKE/LIKE queries.
 *
 * @module utils/sanitizeSearch
 */

/**
 * Sanitizes user input for SQL ILIKE/LIKE queries by escaping wildcard characters.
 *
 * Escapes the following PostgreSQL LIKE wildcards:
 * - % (matches any sequence of characters)
 * - _ (matches any single character)
 * - \ (escape character itself)
 *
 * @param {string} input - The user-provided search string
 * @returns {string} Sanitized string safe for use in ILIKE/LIKE queries
 *
 * @example
 * // Without sanitization (vulnerable):
 * // User input: "test%" would match "test", "testing", "test123", etc.
 *
 * // With sanitization (safe):
 * const sanitized = sanitizeSearchInput("test%");
 * // Returns: "test\\%" which searches for literal "test%" string
 *
 * @example
 * // Usage in model queries:
 * const { sanitizeSearchInput } = require('../utils/sanitizeSearch');
 * const sanitizedSearch = sanitizeSearchInput(filters.search);
 * params.push(`%${sanitizedSearch}%`);
 */
function sanitizeSearchInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Escape special LIKE wildcards: % (any chars), _ (single char), \ (escape)
  // Replace each with backslash-escaped version for PostgreSQL
  return input.replace(/[%_\\]/g, '\\$&');
}

module.exports = {
  sanitizeSearchInput,
};
