/**
 * Module Resolver for Test Environment
 *
 * Handles ES6/CommonJS compatibility issues in the test environment
 * Provides utilities for mocking and module resolution
 */

import { vi } from 'vitest';

/**
 * Creates a mock module with both default and named exports
 * @param {Object} exports - The exports to provide
 * @returns {Object} Mock module with proper export structure
 */
export function createMockModule(exports = {}) {
  const mockModule = { ...exports };

  // Add default export if not provided
  if (!mockModule.default && Object.keys(exports).length === 1) {
    const [singleExport] = Object.values(exports);
    mockModule.default = singleExport;
  }

  return mockModule;
}

/**
 * Creates a comprehensive mock for component classes
 * @param {string} componentName - Name of the component
 * @param {Object} methods - Methods to mock
 * @returns {Object} Mock component class
 */
export function createMockComponent(componentName, methods = {}) {
  const MockComponent = vi.fn().mockImplementation(function (selector, options = {}) {
    this.selector = selector;
    this.options = options;
    this.element = null;

    // Add default methods
    this.render = vi.fn().mockReturnValue(this);
    this.destroy = vi.fn().mockReturnValue(this);
    this.update = vi.fn().mockReturnValue(this);

    // Add custom methods
    Object.assign(this, methods);

    return this;
  });

  MockComponent.displayName = componentName;

  return createMockModule({ default: MockComponent });
}

/**
 * Creates a mock for utility functions
 * @param {Object} functions - Functions to mock
 * @returns {Object} Mock utility module
 */
export function createMockUtility(functions = {}) {
  const mockFunctions = {};

  Object.entries(functions).forEach(([name, implementation]) => {
    mockFunctions[name] =
      typeof implementation === 'function'
        ? vi.fn(implementation)
        : vi.fn().mockReturnValue(implementation);
  });

  return createMockModule(mockFunctions);
}

/**
 * Creates a mock for game classes
 * @param {string} gameName - Name of the game
 * @param {Object} methods - Game methods to mock
 * @returns {Object} Mock game class
 */
export function createMockGame(gameName, methods = {}) {
  const MockGame = vi.fn().mockImplementation(function (canvasId, options = {}) {
    this.canvasId = canvasId;
    this.options = options;
    this.isRunning = false;
    this.score = 0;

    // Default game methods
    this.start = vi.fn().mockImplementation(() => {
      this.isRunning = true;
      return this;
    });

    this.stop = vi.fn().mockImplementation(() => {
      this.isRunning = false;
      return this;
    });

    this.pause = vi.fn().mockReturnValue(this);
    this.resume = vi.fn().mockReturnValue(this);
    this.reset = vi.fn().mockReturnValue(this);
    this.getScore = vi.fn().mockReturnValue(this.score);

    // Add custom methods
    Object.assign(this, methods);

    return this;
  });

  MockGame.displayName = gameName;

  return createMockModule({ default: MockGame });
}

/**
 * Resolves module path conflicts in test environment
 * @param {string} modulePath - Original module path
 * @returns {string} Resolved module path
 */
export function resolveModulePath(modulePath) {
  // Handle relative paths
  if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
    return modulePath;
  }

  // Handle absolute paths from src
  if (modulePath.startsWith('/src/')) {
    return modulePath;
  }

  // Handle bare module names
  return modulePath;
}

/**
 * Creates a mock for missing dependencies
 * @param {string} dependencyName - Name of the missing dependency
 * @returns {Object} Mock dependency
 */
export function createMockDependency(dependencyName) {
  console.warn(`Creating mock for missing dependency: ${dependencyName}`);

  return createMockModule({
    default: vi.fn().mockImplementation(() => ({
      [dependencyName.toLowerCase()]: vi.fn(),
      initialize: vi.fn(),
      destroy: vi.fn(),
    })),
  });
}

/**
 * Setup global mocks for common browser APIs
 */
export function setupGlobalMocks() {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: { ...localStorageMock },
    writable: true,
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    writable: true,
  });

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn().mockImplementation(cb => {
    return setTimeout(cb, 16);
  });

  global.cancelAnimationFrame = vi.fn().mockImplementation(id => {
    clearTimeout(id);
  });

  // Mock Canvas API
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    arc: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 100 }),
    fillText: vi.fn(),
    strokeText: vi.fn(),
  }));

  // Mock accessibility-related APIs
  setupAccessibilityMocks();
}

/**
 * Setup comprehensive accessibility API mocks for JSDOM
 */
export function setupAccessibilityMocks() {
  // Mock screen reader APIs
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
      pending: false,
      speaking: false,
      paused: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    writable: true,
  });

  // Mock focus management APIs with better JSDOM compatibility
  const originalFocus = HTMLElement.prototype.focus;
  const originalBlur = HTMLElement.prototype.blur;

  HTMLElement.prototype.focus = vi.fn().mockImplementation(function () {
    // Set as active element
    Object.defineProperty(document, 'activeElement', {
      value: this,
      writable: true,
      configurable: true,
    });

    // Trigger focus event
    const focusEvent = new FocusEvent('focus', { bubbles: true, cancelable: true });
    this.dispatchEvent(focusEvent);

    // Call original if it exists
    if (originalFocus && typeof originalFocus === 'function') {
      try {
        originalFocus.call(this);
      } catch (e) {
        // Ignore JSDOM focus errors
      }
    }
  });

  HTMLElement.prototype.blur = vi.fn().mockImplementation(function () {
    // Remove as active element if it's currently active
    if (document.activeElement === this) {
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
    }

    // Trigger blur event
    const blurEvent = new FocusEvent('blur', { bubbles: true, cancelable: true });
    this.dispatchEvent(blurEvent);

    // Call original if it exists
    if (originalBlur && typeof originalBlur === 'function') {
      try {
        originalBlur.call(this);
      } catch (e) {
        // Ignore JSDOM blur errors
      }
    }
  });

  // Mock element.getBoundingClientRect for visibility checks
  if (!Element.prototype.getBoundingClientRect) {
    Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    });
  }

  // Mock element.matches for CSS selector matching
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.msMatchesSelector ||
      Element.prototype.webkitMatchesSelector ||
      vi.fn().mockImplementation(function (selector) {
        // Basic mock implementation
        return (
          this.tagName.toLowerCase() === selector.toLowerCase() ||
          this.className.includes(selector.replace('.', '')) ||
          this.id === selector.replace('#', '')
        );
      });
  }

  // Mock closest method for accessibility helpers
  if (!Element.prototype.closest) {
    Element.prototype.closest = vi.fn().mockImplementation(function (selector) {
      let element = this;
      while (element && element.nodeType === 1) {
        if (element.matches && element.matches(selector)) {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    });
  }

  // Mock ARIA live region announcements
  global.announceToScreenReader = vi.fn().mockImplementation((message, priority = 'polite') => {
    const liveRegion =
      document.querySelector(`[aria-live="${priority}"]`) ||
      document.getElementById('aria-live-region');

    if (liveRegion) {
      liveRegion.textContent = message;
    } else {
      // Create temporary live region
      const tempRegion = document.createElement('div');
      tempRegion.setAttribute('aria-live', priority);
      tempRegion.setAttribute('aria-atomic', 'true');
      tempRegion.style.cssText =
        'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
      tempRegion.textContent = message;
      document.body.appendChild(tempRegion);

      // Clean up after announcement
      setTimeout(() => {
        if (tempRegion.parentNode) {
          tempRegion.parentNode.removeChild(tempRegion);
        }
      }, 100);
    }
  });

  // Mock keyboard event simulation helpers
  global.simulateKeyboardEvent = vi
    .fn()
    .mockImplementation((element, eventType, keyOptions = {}) => {
      const event = new KeyboardEvent(eventType, {
        key: keyOptions.key || 'Enter',
        code: keyOptions.code || `Key${keyOptions.key || 'Enter'}`,
        keyCode: keyOptions.keyCode || 13,
        which: keyOptions.which || keyOptions.keyCode || 13,
        shiftKey: keyOptions.shiftKey || false,
        ctrlKey: keyOptions.ctrlKey || false,
        altKey: keyOptions.altKey || false,
        metaKey: keyOptions.metaKey || false,
        bubbles: true,
        cancelable: true,
        ...keyOptions,
      });

      element.dispatchEvent(event);
      return event;
    });

  // Mock focus trap helpers
  global.getFocusableElements = vi.fn().mockImplementation(container => {
    if (!container) return [];

    const focusableSelectors = [
      'button:not([disabled]):not([aria-hidden="true"])',
      'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
      'select:not([disabled]):not([aria-hidden="true"])',
      'textarea:not([disabled]):not([aria-hidden="true"])',
      'a[href]:not([aria-hidden="true"])',
      '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
      '[contenteditable="true"]:not([aria-hidden="true"])',
    ];

    const elements = Array.from(container.querySelectorAll(focusableSelectors.join(', ')));
    return elements.filter(element => {
      // Basic visibility check for JSDOM
      return element.offsetWidth > 0 || element.offsetHeight > 0;
    });
  });

  // Mock ARIA attribute helpers
  global.setAriaAttributes = vi.fn().mockImplementation((element, attributes) => {
    Object.entries(attributes).forEach(([key, value]) => {
      const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`;
      if (value === null || value === undefined) {
        element.removeAttribute(ariaKey);
      } else {
        element.setAttribute(ariaKey, String(value));
      }
    });
  });

  // Mock element visibility checks for accessibility
  global.isElementVisible = vi.fn().mockImplementation(element => {
    if (!element || !element.isConnected) return false;

    // Simplified visibility check for JSDOM
    return element.offsetWidth > 0 && element.offsetHeight > 0;
  });

  // Enhanced matchMedia mock for accessibility features
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = vi.fn().mockImplementation(query => {
    const isHighContrast = query.includes('prefers-contrast: high');
    const isReducedMotion = query.includes('prefers-reduced-motion: reduce');
    const isDarkMode = query.includes('prefers-color-scheme: dark');

    return {
      matches: isHighContrast ? false : isReducedMotion ? false : isDarkMode ? false : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
}

export default {
  createMockModule,
  createMockComponent,
  createMockUtility,
  createMockGame,
  resolveModulePath,
  createMockDependency,
  setupGlobalMocks,
  setupAccessibilityMocks,
};
