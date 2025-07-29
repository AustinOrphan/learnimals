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
  
  // Reset document methods to original implementations
  const originalGetElementById = Document.prototype.getElementById;
  document.getElementById = originalGetElementById.bind(document);
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

// Mock document.currentScript for navbarLoader tests
/* global Document */
Object.defineProperty(document, 'currentScript', {
  value: {
    src: 'http://localhost:8080/src/components/layout/navbarLoader.js'
  },
  writable: true,
  configurable: true
});

// Mock Canvas for BaseGame tests
class MockCanvas {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.style = {};
    this.parentElement = null;
    this.clientWidth = 800;
    this.clientHeight = 600;
    this.offsetWidth = 800;
    this.offsetHeight = 600;
  }
  
  getContext(contextType) {
    if (contextType === '2d') {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn(() => ({ width: 50 })),
        drawImage: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        setTransform: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        canvas: this,
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        font: '12px Arial',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over'
      };
    }
    return null;
  }
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  
  getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
    x: 0,
    y: 0
  }));
  
  toDataURL = vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
  toBlob = vi.fn((callback) => callback(new Blob()));
}

// Mock document.createElement for canvas elements
const originalCreateElement = document.createElement.bind(document);
document.createElement = vi.fn((tagName) => {
  if (tagName === 'canvas') {
    return new MockCanvas();
  }
  return originalCreateElement(tagName);
});

// Global navigation test utilities
global.createMockNavbar = () => {
  return `
    <header class="navbar">
      <div class="navbar-logo">
        <a href="/src/pages/index.html">
          <img src="/public/images/logo.png" alt="Learnimals Logo" />
        </a>
      </div>
      <button id="mobile-menu" class="mobile-menu-button" aria-label="Toggle mobile menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav id="nav-menu" class="navbar-links" aria-label="Main navigation">
        <ul>
          <li><a href="/src/pages/index.html">Home</a></li>
          <li><a href="/src/features/subjects/shared/math.html">Math</a></li>
          <li><a href="/src/features/subjects/shared/science.html">Science</a></li>
        </ul>
      </nav>
    </header>
  `;
};

global.createNavbarPlaceholder = () => {
  const placeholder = document.createElement('div');
  placeholder.id = 'navbar-placeholder';
  document.body.appendChild(placeholder);
  return placeholder;
};

// Setup navigation file mocks for tests that read actual files
global.setupNavigationFileMocks = () => {
  global.fetch.mockImplementation((url) => {
    if (url.includes('navbarLoader.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`
// Simple logger fallback for non-module script loading
const logger = {
  debug: (...args) => console.log('[NavbarLoader DEBUG]', ...args),
  error: (...args) => console.error('[NavbarLoader ERROR]', ...args)
};
// Rest of navbarLoader code without ES6 imports
        `)
      });
    }
    if (url.includes('navigationHelper.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`
// Simple logger fallback for non-module script loading
const logger = {
  debug: (...args) => console.log('[NavigationHelper DEBUG]', ...args),
  error: (...args) => console.error('[NavigationHelper ERROR]', ...args)
};
class NavigationHelper {
  constructor() {
    this.baseUrl = 'http://localhost:8080/learnimals';
  }
  resolveUrl(path) {
    return this.baseUrl + '/' + path;
  }
  updateNavigationLinks() {
    // Mock implementation
  }
}
        `)
      });
    }
    if (url.includes('navigation.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`
// navigation.js content without ES6 imports
class NavigationComponent {
  // Navigation component code
}
        `)
      });
    }
    if (url.includes('navbar.html')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(global.createMockNavbar())
      });
    }
    // Default fallback
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve('')
    });
  });
};

// Mock file content fetching for tests that read actual files
global.mockFileContent = (filePath, content) => {
  global.fetch.mockImplementation((url) => {
    if (url.includes(filePath)) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(content)
      });
    }
    // Default fallback for other URLs
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve('')
    });
  });
};

// Mock character schema module for import errors
global.mockCharacterSchema = {
  CharacterSchema: {
    id: '',
    name: '',
    species: { primary: '', category: '' },
    appearance: {
      colors: { primary: '#4a90e2', secondary: '#7ed321' }
    },
    personality: {
      traits: { enthusiasm: 50 }
    }
  },
  DefaultCharacterTemplates: {
    math: { name: 'Mango' },
    science: { name: 'Sky' }
  },
  createCharacter: vi.fn(() => global.mockCharacterSchema.CharacterSchema),
  createCharacterFromTemplate: vi.fn(() => global.mockCharacterSchema.CharacterSchema)
};

// Create mock progress element for progress service tests
global.createMockProgressElement = () => {
  return {
    innerHTML: '',
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false)
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };
};

// Mock document.getElementById to handle progress display elements
const originalGetElementById = document.getElementById.bind(document);
document.getElementById = vi.fn((id) => {
  if (id === 'progress-display' || id.includes('progress')) {
    return global.createMockProgressElement();
  }
  return originalGetElementById(id);
});

// Set test environment
process.env.NODE_ENV = 'test';