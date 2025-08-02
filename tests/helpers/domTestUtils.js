/**
 * DOM Test Utilities
 *
 * Provides common utilities for setting up and managing DOM in tests
 */

import { vi } from 'vitest';

/**
 * Create a mock focus method that updates document.activeElement
 */
export function createMockFocus() {
  return vi.fn(function () {
    Object.defineProperty(document, 'activeElement', {
      value: this,
      writable: true,
      configurable: true,
    });
  });
}

/**
 * Create a mock click method that dispatches a proper click event
 */
export function createMockClick() {
  return vi.fn(function () {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    this.dispatchEvent(event);
  });
}

/**
 * Enhance a DOM element with mock methods for testing
 * @param {HTMLElement} element - Element to enhance
 * @returns {HTMLElement} Enhanced element
 */
export function enhanceElement(element) {
  if (element && !element._enhanced) {
    element.focus = createMockFocus().bind(element);
    element.click = createMockClick().bind(element);
    element._enhanced = true;
  }
  return element;
}

/**
 * Setup DOM environment for modal testing
 * @returns {Object} References to created elements for cleanup
 */
export function setupModalTestDOM() {
  // Create app container structure
  const appContainer = document.createElement('div');
  appContainer.id = 'app';
  appContainer.innerHTML = `
    <main id="main-content">
      <div id="game-container"></div>
    </main>
  `;
  document.body.appendChild(appContainer);

  // Create modal-specific styles
  const style = document.createElement('style');
  style.textContent = `
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }
    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      z-index: 1001;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      min-width: 300px;
    }
    .modal.modal-small { max-width: 300px; }
    .modal.modal-medium { max-width: 500px; }
    .modal.modal-large { max-width: 800px; }
    .modal.modal-fullscreen { 
      max-width: 100%; 
      width: 100%;
      height: 100%;
      transform: none;
      top: 0;
      left: 0;
    }
    .modal.show,
    .modal-backdrop.show {
      opacity: 1;
      transition: opacity 0.3s ease;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .modal-title {
      margin: 0;
      font-size: 1.5em;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-close:hover {
      opacity: 0.7;
    }
    .modal-body {
      margin: 10px 0;
    }
    .modal-footer {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    body.modal-open {
      overflow: hidden;
    }
    /* Button styles for modal */
    .btn {
      padding: 8px 16px;
      border: 1px solid #ccc;
      background: #fff;
      cursor: pointer;
      border-radius: 4px;
    }
    .btn-primary {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }
    .btn-secondary {
      background: #6c757d;
      color: white;
      border-color: #6c757d;
    }
  `;
  document.head.appendChild(style);

  return {
    appContainer,
    style,
  };
}

/**
 * Clean up DOM test environment
 * @param {Object} refs - References returned by setupModalTestDOM
 */
export function cleanupModalTestDOM(refs) {
  if (refs.appContainer) {
    refs.appContainer.remove();
  }
  if (refs.style) {
    refs.style.remove();
  }

  // Reset body state
  document.body.style.overflow = '';
  document.body.className = '';

  // Reset activeElement
  Object.defineProperty(document, 'activeElement', {
    value: document.body,
    writable: true,
    configurable: true,
  });
}

/**
 * Create enhanced query selector methods
 * @returns {Object} Object with enhanced querySelector methods
 */
export function createEnhancedQuerySelectors() {
  const originalQuerySelector = document.querySelector;
  const originalQuerySelectorAll = document.querySelectorAll;
  const originalGetElementById = document.getElementById;

  return {
    querySelector: vi.fn(selector => {
      try {
        const element = originalQuerySelector.call(document, selector);
        return element ? enhanceElement(element) : null;
      } catch (error) {
        console.warn(`querySelector failed for selector: ${selector}`, error);
        return null;
      }
    }),

    querySelectorAll: vi.fn(selector => {
      try {
        const elements = originalQuerySelectorAll.call(document, selector);
        elements.forEach(el => enhanceElement(el));
        return elements;
      } catch (error) {
        console.warn(`querySelectorAll failed for selector: ${selector}`, error);
        return [];
      }
    }),

    getElementById: vi.fn(id => {
      try {
        const element = originalGetElementById.call(document, id);
        return element ? enhanceElement(element) : null;
      } catch (error) {
        console.warn(`getElementById failed for id: ${id}`, error);
        return null;
      }
    }),

    // Store originals for restoration
    _originals: {
      querySelector: originalQuerySelector,
      querySelectorAll: originalQuerySelectorAll,
      getElementById: originalGetElementById,
    },
  };
}

/**
 * Apply enhanced query selectors to document
 * @param {Object} enhanced - Enhanced selectors from createEnhancedQuerySelectors
 */
export function applyEnhancedQuerySelectors(enhanced) {
  document.querySelector = enhanced.querySelector;
  document.querySelectorAll = enhanced.querySelectorAll;
  document.getElementById = enhanced.getElementById;

  // Store originals on document for cleanup
  document._originalQuerySelector = enhanced._originals.querySelector;
  document._originalQuerySelectorAll = enhanced._originals.querySelectorAll;
  document._originalGetElementById = enhanced._originals.getElementById;
}

/**
 * Restore original query selectors
 */
export function restoreOriginalQuerySelectors() {
  if (document._originalQuerySelector) {
    document.querySelector = document._originalQuerySelector;
    delete document._originalQuerySelector;
  }
  if (document._originalQuerySelectorAll) {
    document.querySelectorAll = document._originalQuerySelectorAll;
    delete document._originalQuerySelectorAll;
  }
  if (document._originalGetElementById) {
    document.getElementById = document._originalGetElementById;
    delete document._originalGetElementById;
  }
}

/**
 * Override createElement to automatically enhance new elements
 * @returns {Function} Original createElement for restoration
 */
export function overrideCreateElement() {
  const originalCreateElement = document.createElement;

  document.createElement = function (tagName) {
    const element = originalCreateElement.call(document, tagName);
    return enhanceElement(element);
  };

  document._originalCreateElement = originalCreateElement;

  return originalCreateElement;
}

/**
 * Restore original createElement
 */
export function restoreOriginalCreateElement() {
  if (document._originalCreateElement) {
    document.createElement = document._originalCreateElement;
    delete document._originalCreateElement;
  }
}

/**
 * Create a focusable element for testing
 * @param {string} type - Element type (button, input, etc.)
 * @param {Object} attributes - Attributes to set
 * @returns {HTMLElement} Created element
 */
export function createFocusableElement(type = 'button', attributes = {}) {
  const element = document.createElement(type);

  // Set default attributes for focusability
  if (type === 'button' && !attributes.type) {
    element.type = 'button';
  }

  // Apply provided attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  });

  return enhanceElement(element);
}

/**
 * Wait for animation/transition to complete
 * @param {number} duration - Duration in milliseconds
 * @returns {Promise} Promise that resolves after duration
 */
export function waitForAnimation(duration = 300) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

/**
 * Trigger keyboard event on element or document
 * @param {string} key - Key to press
 * @param {Object} options - Additional event options
 * @param {HTMLElement} target - Target element (defaults to document)
 */
export function triggerKeyboardEvent(key, options = {}, target = document) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });

  target.dispatchEvent(event);
  return event;
}

/**
 * Create a mock for modal animations
 * @returns {Object} Mock functions for animation control
 */
export function createAnimationMocks() {
  const originalRAF = global.requestAnimationFrame;
  const originalSetTimeout = global.setTimeout;

  return {
    requestAnimationFrame: vi.fn(cb => setTimeout(cb, 0)),
    setTimeout: vi.fn((cb, delay) => {
      if (delay === 0 || delay === undefined) {
        return cb();
      }
      // Cap delays for faster tests
      return originalSetTimeout(cb, Math.min(delay, 50));
    }),
    restore: () => {
      global.requestAnimationFrame = originalRAF;
      global.setTimeout = originalSetTimeout;
    },
  };
}
