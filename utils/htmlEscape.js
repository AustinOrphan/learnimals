/**
 * HTML Escape Utility
 * Provides functions for escaping HTML to prevent XSS attacks
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} input - The string to escape
 * @returns {string} - The escaped string safe for HTML interpolation
 */
export function escapeHTML(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Escapes HTML attributes to prevent XSS attacks
 * More aggressive escaping for use in HTML attributes
 * @param {string} input - The string to escape
 * @returns {string} - The escaped string safe for HTML attributes
 */
export function escapeHTMLAttribute(input) {
  if (typeof input !== 'string') return input;

  // First do standard HTML escaping
  const escaped = escapeHTML(input);

  // Additionally escape backticks and equals signs for attributes
  return escaped.replace(/`/g, '&#x60;').replace(/=/g, '&#x3D;');
}

// ES module export
export default { escapeHTML, escapeHTMLAttribute };
