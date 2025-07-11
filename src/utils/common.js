// Common utility functions used across the application

/**
 * Format a date in a user-friendly format
 * @param {Date} date - Date to format
 * @param {string} format - Format string (optional)
 * @returns {string} - Formatted date string
 */
export function formatDate(date, format = 'short') {
  if (!date) return '';
  
  switch (format) {
  case 'short':
    return date.toLocaleDateString();
  case 'long':
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  case 'time':
    return date.toLocaleTimeString();
  case 'full':
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  default:
    return date.toLocaleDateString();
  }
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random integer
 */
export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Safely store data in localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} data - Data to store (will be JSON stringified)
 * @returns {boolean} - Success status
 */
export function setLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
}

/**
 * Safely retrieve data from localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if nothing found or error occurs
 * @returns {*} - Retrieved data or default value
 */
export function getLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error retrieving from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Create and dispatch a custom event
 * @param {string} eventName - Name of the event
 * @param {Object} detail - Event details
 */
export function dispatchCustomEvent(eventName, detail = {}) {
  const event = new CustomEvent(eventName, { detail });
  document.dispatchEvent(event);
}

/**
 * Check if the device is a touch device
 * @returns {boolean} - True if touch device
 */
export function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

/**
 * Check if the device is a mobile device based on screen width
 * @returns {boolean} - True if mobile device
 */
export function isMobileDevice() {
  return window.innerWidth < 768;
}

/**
 * Creates an optimized timeout that can be cancelled
 * @param {Function} callback - Function to execute after delay
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} - Object with clear method to cancel timeout
 */
export function createCancellableTimeout(callback, delay) {
  const timeoutId = setTimeout(callback, delay);
  return {
    clear: () => clearTimeout(timeoutId)
  };
}

/**
 * Detects if a point is inside a circle
 * @param {number} x - Point x coordinate
 * @param {number} y - Point y coordinate
 * @param {number} circleX - Circle center x coordinate
 * @param {number} circleY - Circle center y coordinate
 * @param {number} radius - Circle radius
 * @returns {boolean} - True if point is inside circle
 */
export function isPointInCircle(x, y, circleX, circleY, radius) {
  const dx = x - circleX;
  const dy = y - circleY;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Lighten a hex color by a percentage
 * @param {string} color - Hex color string (e.g., '#FF0000')
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} - Lightened hex color
 */
export function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

/**
 * Darken a hex color by a percentage
 * @param {string} color - Hex color string (e.g., '#FF0000')
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string} - Darkened hex color
 */
export function darkenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
    (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
    (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
}

/**
 * Compare two fractions for equality using integer arithmetic
 * @param {number} num1 - First fraction numerator
 * @param {number} den1 - First fraction denominator
 * @param {number} num2 - Second fraction numerator
 * @param {number} den2 - Second fraction denominator
 * @returns {boolean} - True if fractions are equal
 */
export function compareFractions(num1, den1, num2, den2) {
  // Cross multiply to avoid floating point errors: a/b == c/d iff a*d == b*c
  return num1 * den2 === num2 * den1;
}

/**
 * Add two fractions and return the result as a simplified fraction
 * @param {number} num1 - First fraction numerator
 * @param {number} den1 - First fraction denominator
 * @param {number} num2 - Second fraction numerator
 * @param {number} den2 - Second fraction denominator
 * @returns {Object} - Object with numerator and denominator properties
 */
export function addFractions(num1, den1, num2, den2) {
  const numerator = num1 * den2 + num2 * den1;
  const denominator = den1 * den2;
  const gcd = getGCD(numerator, denominator);
  return {
    numerator: numerator / gcd,
    denominator: denominator / gcd
  };
}

/**
 * Calculate the greatest common divisor of two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} - Greatest common divisor
 */
export function getGCD(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}
