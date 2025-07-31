/**
 * Enhanced Test Setup
 * 
 * Comprehensive test environment setup for Learnimals application
 * Fixes module compatibility issues and provides robust testing foundation
 */

import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { setupGlobalMocks } from '../helpers/moduleResolver.js';

// Configure test environment
beforeAll(() => {
  // Note: Tests can enable fake timers individually if needed
  // vi.useFakeTimers() is not called globally to allow tests to manage their own timer state
  
  // Setup global mocks for browser APIs
  setupGlobalMocks();
  
  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  };
  
  // Mock window.location (check if already defined to avoid redefinition)
  if (!window.location || typeof window.location.href === 'undefined') {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/',
        origin: 'http://localhost:3000',
        protocol: 'http:',
        hostname: 'localhost',
        port: '3000',
        pathname: '/',
        search: '',
        hash: '',
        assign: vi.fn(),
        reload: vi.fn(),
        replace: vi.fn()
      },
      writable: true,
      configurable: true
    });
  }
  
  // Mock additional browser APIs
  global.scrollTo = vi.fn();
  global.scroll = vi.fn();
  window.scrollTo = vi.fn();
  window.scroll = vi.fn();
  
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn()
  }));
  
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));
  
  // Mock MutationObserver
  global.MutationObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn()
  }));
  
  // Mock PerformanceObserver
  global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn()
  }));
  
  // Mock requestAnimationFrame/cancelAnimationFrame
  global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16);
  });
  global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
  });
  
  // Mock requestIdleCallback
  global.requestIdleCallback = vi.fn((callback) => {
    return setTimeout(callback, 0);
  });
  global.cancelIdleCallback = vi.fn((id) => {
    clearTimeout(id);
  });
  
  // Mock performance APIs
  if (!global.performance) {
    global.performance = {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      timing: {
        navigationStart: Date.now(),
        loadEventEnd: Date.now() + 1000,
        domContentLoadedEventEnd: Date.now() + 500
      },
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 10000000,
        jsHeapSizeLimit: 100000000
      }
    };
  }
  
  // Mock navigator APIs
  Object.defineProperty(navigator, 'connection', {
    value: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    configurable: true
  });
  
  Object.defineProperty(navigator, 'deviceMemory', {
    value: 8,
    configurable: true
  });
  
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    value: 4,
    configurable: true
  });
  
  // Mock screen API
  Object.defineProperty(screen, 'orientation', {
    value: {
      angle: 0,
      type: 'portrait-primary',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    configurable: true
  });
  
  // Mock Image constructor
  global.Image = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onload: null,
    onerror: null,
    src: '',
    width: 0,
    height: 0,
    complete: false
  }));
  
  // Mock Canvas API
  if (!HTMLCanvasElement.prototype.getContext) {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Array(4).fill(0)
      }),
      putImageData: vi.fn(),
      createImageData: vi.fn().mockReturnValue({
        data: new Array(4).fill(0)
      }),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      canvas: {
        width: 300,
        height: 150,
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
      }
    });
  }
  
  if (!HTMLCanvasElement.prototype.toDataURL) {
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
  }
  
  // Mock getBoundingClientRect for all elements
  if (!Element.prototype.getBoundingClientRect) {
    Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      x: 0,
      y: 0
    });
  }
  
  // Setup DOM environment
  document.body.innerHTML = '';
  
  // Mock navigation placeholder functions that tests expect
  global.createNavbarPlaceholder = vi.fn().mockImplementation(() => {
    const placeholder = document.createElement('div');
    placeholder.id = 'navbar-placeholder';
    document.body.appendChild(placeholder);
    return placeholder;
  });

  global.createMockNavbar = vi.fn().mockImplementation(() => {
    return `<nav id="navbar">
      <div id="mobile-menu">
        <button>Menu</button>
      </div>
      <ul id="nav-menu">
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">About</a></li>
      </ul>
    </nav>`;
  });
  
  global.setupNavigationFileMocks = vi.fn().mockImplementation(() => {
    // Mock file content for navigation tests
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('navbar.html')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<nav id="navbar">Mock Navbar</nav>')
        });
      }
      if (url.includes('navigation.js') || url.includes('/src/components/layout/navigation.js')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('// Mock navigation.js content\n// No ES6 imports used here\nconst NavigationComponent = {};\nif (typeof window !== "undefined") window.NavigationComponent = NavigationComponent;')
        });
      }
      if (url.includes('navigationHelper.js') || url.includes('/src/utils/navigationHelper.js')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(`// Navigation Helper for Learnimals
// Provides absolute URL resolution for navigation links

// Use shared logger factory created by navbarLoader.js
// Always use window.logger to avoid redeclaration errors
if (typeof window !== 'undefined' && !window.logger) {
  window.logger = window.createLogger ? window.createLogger('NavigationHelper') : {
    debug: (...args) => {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('[NavigationHelper DEBUG]', ...args);
      }
    },
    error: (...args) => console.error('[NavigationHelper ERROR]', ...args),
    warn: (...args) => console.warn('[NavigationHelper WARN]', ...args),
    info: (...args) => console.info('[NavigationHelper INFO]', ...args)
  };
}

class NavigationHelper {
  // Mock implementation - no ES6 imports
}

// Export for ES6 modules and testing
export default NavigationHelper;

// Make available for dynamic imports and browser compatibility
if (typeof window !== 'undefined') {
  window.NavigationHelper = NavigationHelper;
}`)
        });
      }
      if (url.includes('navbarLoader.js') || url.includes('/src/components/layout/navbarLoader.js')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('// src/components/layout/navbarLoader.js\n// No ES6 imports used here\nconst logger = window.createLogger("NavbarLoader");')
        });
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });
  });
  
  // Set up default fetch mock with better coverage
  global.fetch = vi.fn().mockImplementation((url) => {
    // Mock common file requests
    if (url.includes('navbar.html')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<nav id="navbar">Mock Navbar</nav>'),
        json: () => Promise.resolve({ success: true })
      });
    }
    if (url.includes('navigation.js') || url.includes('/src/components/layout/navigation.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('// Mock navigation.js content\n// No ES6 imports used here\nconst NavigationComponent = {};\nif (typeof window !== "undefined") window.NavigationComponent = NavigationComponent;'),
        json: () => Promise.resolve({ module: 'navigation' })
      });
    }
    if (url.includes('navigationHelper.js') || url.includes('/src/utils/navigationHelper.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`// Navigation Helper for Learnimals
// Provides absolute URL resolution for navigation links

// Use shared logger factory created by navbarLoader.js
// Always use window.logger to avoid redeclaration errors
if (typeof window !== 'undefined' && !window.logger) {
  window.logger = window.createLogger ? window.createLogger('NavigationHelper') : {
    debug: (...args) => {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('[NavigationHelper DEBUG]', ...args);
      }
    },
    error: (...args) => console.error('[NavigationHelper ERROR]', ...args),
    warn: (...args) => console.warn('[NavigationHelper WARN]', ...args),
    info: (...args) => console.info('[NavigationHelper INFO]', ...args)
  };
}

class NavigationHelper {
  // Mock implementation - no ES6 imports
}

// Export for ES6 modules and testing
export default NavigationHelper;

// Make available for dynamic imports and browser compatibility
if (typeof window !== 'undefined') {
  window.NavigationHelper = NavigationHelper;
}`),
        json: () => Promise.resolve({ module: 'navigationHelper' })
      });
    }
    if (url.includes('navbarLoader.js') || url.includes('/src/components/layout/navbarLoader.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`// src/components/layout/navbarLoader.js
// Get the current script's path to determine the correct navbar.html location

// Simple logger fallback for non-module script loading.
// This factory will be reused by other scripts like navigationHelper.js.
if (!window.createLogger) {
  window.createLogger = (prefix) => {
    const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    return {
      debug: (...args) => isDev && console.log(\`[\${prefix} DEBUG]\`, ...args),
      error: (...args) => console.error(\`[\${prefix} ERROR]\`, ...args),
      warn: (...args) => console.warn(\`[\${prefix} WARN]\`, ...args),
      info: (...args) => console.info(\`[\${prefix} INFO]\`, ...args),
    };
  };
}
const logger = window.createLogger('NavbarLoader');
// No ES6 imports used here`),
        json: () => Promise.resolve({ module: 'navbarLoader' })
      });
    }
    if (url.includes('.css')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('/* Mock CSS content */'),
        json: () => Promise.resolve({ styles: true })
      });
    }
    if (url.includes('.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('// Mock JS content'),
        json: () => Promise.resolve({ script: true })
      });
    }
    
    // Default successful response for unmocked URLs
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('Mock response'),
      json: () => Promise.resolve({ mocked: true }),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob())
    });
  });
  
  // Mock module exports for CommonJS/ES6 compatibility
  global.mockModuleExports = vi.fn().mockImplementation((moduleObj, exportValue) => {
    if (typeof moduleObj === 'object' && moduleObj !== null) {
      try {
        // Try to set default export without breaking ES6 modules
        Object.defineProperty(moduleObj, 'default', {
          value: exportValue,
          writable: true,
          configurable: true
        });
      } catch (error) {
        // If we can't set the property, create a wrapper
        return { default: exportValue, ...moduleObj };
      }
    }
    return moduleObj;
  });
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Ensure DOM structure exists
  if (!document.body) {
    document.body = document.createElement('body');
    document.documentElement.appendChild(document.body);
  }
  if (!document.head) {
    document.head = document.createElement('head');
    document.documentElement.appendChild(document.head);
  }
  
  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // Ensure body has required properties
  document.body.id = '';
  document.body.className = '';
  document.body.style = {};
  document.body.classList = {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(() => false),
    toggle: vi.fn()
  };
  
  // Reset localStorage
  window.localStorage.clear();
  window.sessionStorage.clear();
  
  // Reset location safely
  if (window.location) {
    try {
      Object.defineProperty(window.location, 'pathname', { value: '/', writable: true, configurable: true });
      Object.defineProperty(window.location, 'search', { value: '', writable: true, configurable: true });
      Object.defineProperty(window.location, 'hash', { value: '', writable: true, configurable: true });
    } catch (error) {
      // If we can't modify location properties, try to recreate the location object
      try {
        Object.defineProperty(window, 'location', {
          value: {
            href: 'http://localhost:3000/',
            origin: 'http://localhost:3000',
            protocol: 'http:',
            hostname: 'localhost',
            port: '3000',
            pathname: '/',
          search: '',
          hash: '',
          assign: vi.fn(),
          reload: vi.fn(),
          replace: vi.fn()
        },
        writable: true,
        configurable: true
      });
      } catch (nestedError) {
        // If we still can't redefine, just skip location setup
        console.warn('Unable to setup window.location mock:', nestedError.message);
      }
    }
  }
  
  // Create fresh navbar placeholder for each test
  if (document.body && document.createElement) {
    try {
      const navbarPlaceholder = document.createElement('div');
      navbarPlaceholder.id = 'navbar-placeholder';
      document.body.appendChild(navbarPlaceholder);
    } catch (error) {
      // If we can't create the navbar placeholder, continue without it
      console.warn('Unable to create navbar placeholder:', error.message);
    }
  }
  
  // Reset global state
  global.testState = {
    components: new Map(),
    mockData: new Map(),
    eventListeners: []
  };
});

afterEach(() => {
  // Clean up any remaining timers - only if fake timers are active
  try {
    // Check if fake timers are enabled by attempting to run pending timers
    // If not enabled, this will throw an error which we catch
    vi.runOnlyPendingTimers();
    vi.clearAllTimers();
  } catch (error) {
    // If timers are not mocked, that's fine - the test is managing its own timers
    // Do nothing here
  }
  
  // Clean up event listeners
  if (global.testState && global.testState.eventListeners) {
    global.testState.eventListeners.forEach(({ element, type, listener }) => {
      element.removeEventListener(type, listener);
    });
  }
  
  // Reset test state
  global.testState = null;
});

afterAll(() => {
  // Final cleanup
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/**
 * Custom test utilities
 */
global.testUtils = {
  /**
   * Wait for element to appear in DOM
   */
  waitForElement: async (selector, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  },
  
  /**
   * Simulate user interaction
   */
  simulateEvent: (element, eventType, options = {}) => {
    const event = new Event(eventType, { bubbles: true, cancelable: true, ...options });
    element.dispatchEvent(event);
    return event;
  },
  
  /**
   * Create test container
   */
  createTestContainer: (id = 'test-container') => {
    const container = document.createElement('div');
    container.id = id;
    document.body.appendChild(container);
    return container;
  },
  
  /**
   * Mock component module with proper ES6/CommonJS compatibility
   */
  mockComponent: (componentPath, mockImplementation) => {
    return vi.doMock(componentPath, () => {
      const mock = typeof mockImplementation === 'function' 
        ? mockImplementation 
        : () => mockImplementation;
      
      return {
        default: mock,
        [componentPath.split('/').pop().replace('.js', '')]: mock
      };
    });
  },
  
  /**
   * Advance timers and flush promises
   */
  tick: async (ms = 0) => {
    if (ms > 0) {
      vi.advanceTimersByTime(ms);
    }
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};

/**
 * Custom matchers
 */
expect.extend({
  toBeInDOM(received) {
    const pass = document.body.contains(received) || document.head.contains(received);
    return {
      pass,
      message: () => pass 
        ? `Expected element not to be in DOM`
        : `Expected element to be in DOM`
    };
  },
  
  toHaveClass(received, className) {
    const pass = received.classList.contains(className);
    return {
      pass,
      message: () => pass
        ? `Expected element not to have class "${className}"`
        : `Expected element to have class "${className}"`
    };
  },
  
  toBeVisible(received) {
    const style = window.getComputedStyle(received);
    const pass = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    return {
      pass,
      message: () => pass
        ? `Expected element not to be visible`
        : `Expected element to be visible`
    };
  }
});

// Mock specific modules that commonly cause issues
vi.mock('../../src/features/progress/AchievementSystem.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    unlock: vi.fn(),
    check: vi.fn(),
    getAchievements: vi.fn().mockReturnValue([])
  }))
}));

vi.mock('../../src/features/progress/ProgressTracker.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    track: vi.fn(),
    getProgress: vi.fn().mockReturnValue({}),
    save: vi.fn()
  }))
}));

vi.mock('../../src/utils/logger.js', () => ({
  default: {
    level: 2, // INFO level
    enabled: true,
    getLogLevel: vi.fn().mockReturnValue(2),
    setLevel: vi.fn(),
    setEnabled: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    shouldLog: vi.fn().mockReturnValue(true),
    formatMessage: vi.fn().mockImplementation((level, message, args) => {
      const timestamp = new Date().toISOString().slice(11, 23);
      return [`[${timestamp}] ${level}:`, message, ...args];
    }),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    game: vi.fn(),
    user: vi.fn(),
    perf: vi.fn()
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
}));

// Export commonly used testing utilities
export {
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll
};