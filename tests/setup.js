/**
 * Vitest Test Setup
 * Global configuration and utilities for all tests
 */

import { afterEach, beforeAll, vi } from 'vitest';

// Auto cleanup after each test
afterEach(() => {
  // Clear DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Clear local storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset any global state
  if (global.window) {
    delete global.window.LEARNIMALS_LOG_LEVEL;
  }
});

// Global test utilities
global.TestUtils = {
  /**
   * Wait for a condition to be true
   * @param {Function} fn - Function that returns true when condition is met
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @returns {Promise}
   */
  waitFor: (fn, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          const result = fn();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
          } else {
            setTimeout(check, 50);
          }
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(error);
          } else {
            setTimeout(check, 50);
          }
        }
      };
      check();
    });
  },

  /**
   * Create a mock DOM element
   * @param {string} tagName - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string} textContent - Element text content
   * @returns {HTMLElement}
   */
  createElement: (tagName, attributes = {}, textContent = '') => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    if (textContent) {
      element.textContent = textContent;
    }
    return element;
  },

  /**
   * Simulate user interaction events
   * @param {HTMLElement} element - Target element
   * @param {string} eventType - Event type (click, keydown, etc.)
   * @param {Object} eventOptions - Event options
   */
  fireEvent: (element, eventType, eventOptions = {}) => {
    const event = new Event(eventType, {
      bubbles: true,
      cancelable: true,
      ...eventOptions
    });
    element.dispatchEvent(event);
  },

  /**
   * Mock window.location
   * @param {string} hostname - Hostname to mock
   * @param {Object} additional - Additional location properties
   */
  mockLocation: (hostname, additional = {}) => {
    global.window = {
      location: {
        hostname,
        href: `https://${hostname}/`,
        origin: `https://${hostname}`,
        pathname: '/',
        search: '',
        hash: '',
        ...additional
      }
    };
  }
};

// Mock IntersectionObserver (not available in jsdom)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock ResizeObserver (not available in jsdom)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock console methods for testing
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Suppress console output during tests unless explicitly needed
beforeAll(() => {
  // Only suppress in test environment
  if (process.env.NODE_ENV === 'test') {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  }
});

// Mock fetch for API testing
global.fetch = vi.fn();

// Mock localStorage and sessionStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    store: {},
    getItem: vi.fn(function(key) {
      return this.store[key] || null;
    }),
    setItem: vi.fn(function(key, value) {
      this.store[key] = String(value);
    }),
    removeItem: vi.fn(function(key) {
      delete this.store[key];
    }),
    clear: vi.fn(function() {
      this.store = {};
    })
  },
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    store: {},
    getItem: vi.fn(function(key) {
      return this.store[key] || null;
    }),
    setItem: vi.fn(function(key, value) {
      this.store[key] = String(value);
    }),
    removeItem: vi.fn(function(key) {
      delete this.store[key];
    }),
    clear: vi.fn(function() {
      this.store = {};
    })
  },
  writable: true
});

// Mock CSS.supports
global.CSS = {
  supports: vi.fn(() => true)
};

// Set test environment
process.env.NODE_ENV = 'test';