/**
 * Comprehensive Test Helpers and Utilities
 * Provides custom matchers, DOM utilities, and testing helper functions
 */

import { expect } from 'vitest';

// Custom DOM Matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received && document.body.contains(received);

    return {
      pass,
      message: () =>
        pass
          ? 'Expected element not to be in the document'
          : 'Expected element to be in the document',
    };
  },

  toHaveClass(received, className) {
    const pass = received && received.classList && received.classList.contains(className);

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have class "${className}"`
          : `Expected element to have class "${className}"`,
    };
  },

  toHaveStyle(received, styles) {
    if (!received || !received.style) {
      return {
        pass: false,
        message: () => 'Expected element to have style properties',
      };
    }

    const computedStyle = window.getComputedStyle(received);
    const failures = [];

    for (const [property, expectedValue] of Object.entries(styles)) {
      const actualValue = computedStyle.getPropertyValue(property) || received.style[property];
      if (actualValue !== expectedValue) {
        failures.push(`${property}: expected "${expectedValue}", got "${actualValue}"`);
      }
    }

    const pass = failures.length === 0;

    return {
      pass,
      message: () =>
        pass ? 'Expected element not to have styles' : `Style mismatches: ${failures.join(', ')}`,
    };
  },

  toHaveAttribute(received, attribute, expectedValue = undefined) {
    if (!received || !received.hasAttribute) {
      return {
        pass: false,
        message: () => 'Expected element to have attributes',
      };
    }

    const hasAttribute = received.hasAttribute(attribute);

    if (expectedValue === undefined) {
      return {
        pass: hasAttribute,
        message: () =>
          hasAttribute
            ? `Expected element not to have attribute "${attribute}"`
            : `Expected element to have attribute "${attribute}"`,
      };
    }

    const actualValue = received.getAttribute(attribute);
    const pass = hasAttribute && actualValue === expectedValue;

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have attribute "${attribute}" with value "${expectedValue}"`
          : `Expected attribute "${attribute}" to be "${expectedValue}", got "${actualValue}"`,
    };
  },

  toBeVisible(received) {
    if (!received) {
      return {
        pass: false,
        message: () => 'Expected element to exist',
      };
    }

    const style = window.getComputedStyle(received);
    const isVisible =
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      received.offsetWidth > 0 &&
      received.offsetHeight > 0;

    return {
      pass: isVisible,
      message: () =>
        isVisible ? 'Expected element not to be visible' : 'Expected element to be visible',
    };
  },

  toBeFocused(received) {
    const pass = received && document.activeElement === received;

    return {
      pass,
      message: () =>
        pass ? 'Expected element not to be focused' : 'Expected element to be focused',
    };
  },

  toHaveValue(received, expectedValue) {
    const pass = received && received.value === expectedValue;

    return {
      pass,
      message: () =>
        pass
          ? `Expected input not to have value "${expectedValue}"`
          : `Expected input to have value "${expectedValue}", got "${received?.value}"`,
    };
  },

  toHaveTextContent(received, expectedText) {
    const pass = received && received.textContent === expectedText;

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have text content "${expectedText}"`
          : `Expected element to have text content "${expectedText}", got "${received?.textContent}"`,
    };
  },

  toContainText(received, expectedText) {
    const pass = received && received.textContent && received.textContent.includes(expectedText);

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to contain text "${expectedText}"`
          : `Expected element to contain text "${expectedText}", got "${received?.textContent}"`,
    };
  },
});

// Accessibility Testing Helpers
export const AccessibilityHelpers = {
  // Check ARIA attributes
  checkARIA: element => {
    const results = {
      hasRole: element.hasAttribute('role'),
      hasLabel: element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby'),
      hasDescription: element.hasAttribute('aria-describedby'),
      hasLiveRegion: element.hasAttribute('aria-live'),
      isHidden: element.hasAttribute('aria-hidden'),
      errors: [],
    };

    // Check for common ARIA issues
    if (element.tagName === 'BUTTON' && !results.hasLabel && !element.textContent.trim()) {
      results.errors.push('Button missing accessible name');
    }

    if (element.tagName === 'INPUT' && element.type !== 'hidden' && !results.hasLabel) {
      results.errors.push('Input missing label');
    }

    if (element.hasAttribute('aria-labelledby')) {
      const labelId = element.getAttribute('aria-labelledby');
      if (!document.getElementById(labelId)) {
        results.errors.push(`aria-labelledby references non-existent element: ${labelId}`);
      }
    }

    return results;
  },

  // Check color contrast
  checkColorContrast: (element, level = 'AA') => {
    const computedStyle = window.getComputedStyle(element);
    const color = computedStyle.color;
    const backgroundColor = computedStyle.backgroundColor;

    // This is a simplified check - in real testing you'd use a proper contrast library
    const hasGoodContrast = color !== backgroundColor;

    return {
      foreground: color,
      background: backgroundColor,
      ratio: hasGoodContrast ? 4.5 : 1.5, // Mock ratio
      passes: hasGoodContrast,
      level,
    };
  },

  // Check keyboard navigation
  checkKeyboardAccessibility: container => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    return {
      focusableCount: focusableElements.length,
      elements: Array.from(focusableElements),
      hasSkipLinks: container.querySelector('[href="#main"], [href="#content"]') !== null,
      hasFocusTraps: container.querySelector('[aria-modal="true"]') !== null,
    };
  },

  // Simulate screen reader experience
  getScreenReaderText: element => {
    const texts = [];

    // Get role
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    texts.push(role);

    // Get accessible name
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledby = element.getAttribute('aria-labelledby');
    const labelElement = ariaLabelledby ? document.getElementById(ariaLabelledby) : null;

    if (ariaLabel) {
      texts.push(ariaLabel);
    } else if (labelElement) {
      texts.push(labelElement.textContent);
    } else if (element.textContent) {
      texts.push(element.textContent);
    }

    // Get state information
    const ariaExpanded = element.getAttribute('aria-expanded');
    const ariaChecked = element.getAttribute('aria-checked');
    const ariaSelected = element.getAttribute('aria-selected');
    const disabled = element.disabled || element.getAttribute('aria-disabled') === 'true';

    if (disabled) texts.push('disabled');
    if (ariaExpanded === 'true') texts.push('expanded');
    if (ariaExpanded === 'false') texts.push('collapsed');
    if (ariaChecked === 'true') texts.push('checked');
    if (ariaSelected === 'true') texts.push('selected');

    return texts.join(' ');
  },
};

// Performance Testing Helpers
export const PerformanceHelpers = {
  // Measure function execution time
  measureExecutionTime: async (fn, iterations = 1) => {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    return {
      times,
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
    };
  },

  // Memory usage testing
  measureMemoryUsage: fn => {
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    const result = fn();

    const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const memoryUsed = finalMemory - initialMemory;

    return {
      result,
      memoryUsed,
      initialMemory,
      finalMemory,
      efficiency: memoryUsed > 0 ? (memoryUsed / 1024 / 1024).toFixed(2) + ' MB' : 'No increase',
    };
  },

  // Frame rate monitoring
  monitorFrameRate: (duration = 1000) => {
    return new Promise(resolve => {
      let frameCount = 0;
      const startTime = performance.now();
      let lastTime = startTime;
      const frames = [];

      const countFrame = currentTime => {
        frameCount++;
        const frameDuration = currentTime - lastTime;
        frames.push(frameDuration);
        lastTime = currentTime;

        if (currentTime - startTime < duration) {
          requestAnimationFrame(countFrame);
        } else {
          const fps = frameCount / (duration / 1000);
          const avgFrameTime = frames.reduce((sum, time) => sum + time, 0) / frames.length;

          resolve({
            fps: Math.round(fps),
            frameCount,
            avgFrameTime: Math.round(avgFrameTime),
            droppedFrames: frames.filter(time => time > 16.67).length, // 60fps = 16.67ms per frame
          });
        }
      };

      requestAnimationFrame(countFrame);
    });
  },

  // Network performance simulation
  simulateNetworkConditions: (condition = 'fast') => {
    const conditions = {
      'slow-2g': { latency: 2000, downloadSpeed: 250, uploadSpeed: 250 },
      '2g': { latency: 600, downloadSpeed: 250, uploadSpeed: 250 },
      '3g': { latency: 200, downloadSpeed: 1500, uploadSpeed: 750 },
      '4g': { latency: 20, downloadSpeed: 9000, uploadSpeed: 9000 },
      fast: { latency: 5, downloadSpeed: 50000, uploadSpeed: 50000 },
    };

    return conditions[condition] || conditions.fast;
  },
};

// DOM Testing Utilities
export const DOMHelpers = {
  // Create test DOM structure
  createTestDOM: html => {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    return container;
  },

  // Clean up test DOM
  cleanupTestDOM: container => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  },

  // Wait for element to appear
  waitForElement: (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(mutations => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  },

  // Simulate user interactions
  simulateClick: element => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(event);
  },

  simulateKeypress: (element, key, options = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    element.dispatchEvent(event);
  },

  simulateInput: (element, value) => {
    element.value = value;
    const event = new Event('input', {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
  },

  // Form testing helpers
  fillForm: (form, data) => {
    Object.entries(data).forEach(([name, value]) => {
      const field = form.querySelector(`[name="${name}"]`);
      if (field) {
        if (field.type === 'checkbox' || field.type === 'radio') {
          field.checked = Boolean(value);
        } else {
          field.value = value;
        }
        DOMHelpers.simulateInput(field, value);
      }
    });
  },

  submitForm: form => {
    const event = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });
    form.dispatchEvent(event);
  },
};

// Animation Testing Helpers
export const AnimationHelpers = {
  // Wait for CSS animation to complete
  waitForAnimation: (element, animationName) => {
    return new Promise(resolve => {
      const handleAnimationEnd = event => {
        if (event.animationName === animationName) {
          element.removeEventListener('animationend', handleAnimationEnd);
          resolve();
        }
      };

      element.addEventListener('animationend', handleAnimationEnd);
    });
  },

  // Wait for CSS transition to complete
  waitForTransition: (element, property) => {
    return new Promise(resolve => {
      const handleTransitionEnd = event => {
        if (event.propertyName === property) {
          element.removeEventListener('transitionend', handleTransitionEnd);
          resolve();
        }
      };

      element.addEventListener('transitionend', handleTransitionEnd);
    });
  },

  // Check if element is animating
  isAnimating: element => {
    const computedStyle = window.getComputedStyle(element);
    const animationName = computedStyle.getPropertyValue('animation-name');
    const animationDuration = computedStyle.getPropertyValue('animation-duration');

    return animationName !== 'none' && parseFloat(animationDuration) > 0;
  },
};

// Canvas Testing Helpers
export const CanvasHelpers = {
  // Create mock canvas context
  createMockContext: () => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    createImageData: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
  }),

  // Verify canvas operations
  verifyCanvasOperations: (mockCtx, expectedOperations) => {
    const results = {};

    expectedOperations.forEach(operation => {
      const mock = mockCtx[operation];
      results[operation] = {
        called: mock.mock.calls.length > 0,
        callCount: mock.mock.calls.length,
        lastCall: mock.mock.calls[mock.mock.calls.length - 1],
      };
    });

    return results;
  },
};

// Game Testing Utilities
export const GameTestHelpers = {
  // Mock game loop
  createGameLoop: (callback, fps = 60) => {
    const interval = 1000 / fps;
    let lastTime = 0;
    let running = false;

    const loop = currentTime => {
      if (!running) return;

      if (currentTime - lastTime >= interval) {
        callback(currentTime - lastTime);
        lastTime = currentTime;
      }

      requestAnimationFrame(loop);
    };

    return {
      start: () => {
        running = true;
        requestAnimationFrame(loop);
      },
      stop: () => {
        running = false;
      },
      isRunning: () => running,
    };
  },

  // Simulate game events
  simulateGameEvent: (type, data = {}) => {
    return {
      type,
      timestamp: Date.now(),
      data,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };
  },

  // Mock collision detection
  mockCollisionDetection: (object1, object2) => {
    const rect1 = { x: object1.x, y: object1.y, width: object1.width, height: object1.height };
    const rect2 = { x: object2.x, y: object2.y, width: object2.width, height: object2.height };

    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  },
};

// Async Testing Helpers
export const AsyncHelpers = {
  // Wait for condition to be true
  waitFor: (condition, timeout = 5000, interval = 100) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime >= timeout) {
          reject(new Error(`Condition not met within ${timeout}ms`));
        } else {
          setTimeout(check, interval);
        }
      };

      check();
    });
  },

  // Wait for multiple promises with individual timeouts
  waitForAll: (promises, timeout = 5000) => {
    const promisesWithTimeout = promises.map(promise =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Individual promise timeout')), timeout)
        ),
      ])
    );

    return Promise.all(promisesWithTimeout);
  },

  // Retry async operation
  retry: async (fn, maxAttempts = 3, delay = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  },
};

// Security Testing Helpers
export const SecurityHelpers = {
  // XSS testing
  createXSSPayloads: () => [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(\'XSS\')" />',
    'javascript:alert("XSS")',
    '<svg onload="alert(1)">',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<div onclick="alert(\'XSS\')">Click me</div>',
  ],

  // SQL injection testing
  createSQLInjectionPayloads: () => [
    '\'; DROP TABLE users; --',
    '1\' OR \'1\'=\'1',
    '\'; UNION SELECT * FROM sensitive_data; --',
    '1\'; UPDATE users SET password=\'hacked\' WHERE id=1; --',
  ],

  // Test input sanitization
  testInputSanitization: (sanitizeFunction, maliciousInputs) => {
    return maliciousInputs.map(input => {
      const sanitized = sanitizeFunction(input);
      return {
        input,
        sanitized,
        safe: !sanitized.includes('<script') && !sanitized.includes('javascript:'),
      };
    });
  },
};

// Test Data Management
export const TestDataManager = {
  // Create isolated test environment
  createTestEnvironment: () => {
    const originalLocalStorage = window.localStorage;
    const originalSessionStorage = window.sessionStorage;
    const testStorage = new Map();

    // Mock storage
    const mockStorage = {
      getItem: key => testStorage.get(key) || null,
      setItem: (key, value) => testStorage.set(key, value),
      removeItem: key => testStorage.delete(key),
      clear: () => testStorage.clear(),
      length: testStorage.size,
      key: index => Array.from(testStorage.keys())[index] || null,
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage,
      writable: true,
    });

    return {
      cleanup: () => {
        Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
        });
        Object.defineProperty(window, 'sessionStorage', {
          value: originalSessionStorage,
          writable: true,
        });
      },
    };
  },

  // Seed test data
  seedTestData: (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // Clear test data
  clearTestData: (keys = []) => {
    if (keys.length === 0) {
      localStorage.clear();
      sessionStorage.clear();
    } else {
      keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    }
  },
};

export default {
  AccessibilityHelpers,
  PerformanceHelpers,
  DOMHelpers,
  AnimationHelpers,
  CanvasHelpers,
  GameTestHelpers,
  AsyncHelpers,
  SecurityHelpers,
  TestDataManager,
};
