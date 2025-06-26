// Common utility functions used across the application

/**
 * Format a date in a user-friendly format
 * @param {Date} date - Date to format
 * @param {string} format - Format string (optional)
 * @returns {string} - Formatted date string
 */
export function formatDate(date, format = 'short') {
  if (!date) {return '';}

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
