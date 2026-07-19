/**
 * Accessibility Test Mocks
 *
 * Comprehensive mocking utilities for accessibility testing in JSDOM environment
 * Handles limitations of JSDOM for CSS computed styles, focus management, and ARIA testing
 */

import { vi } from 'vitest';

/**
 * Default computed style values for accessibility testing
 */
const DEFAULT_COMPUTED_STYLES = {
  // Focus indicators
  outline: '2px solid blue',
  outlineColor: 'blue',
  outlineStyle: 'solid',
  outlineWidth: '2px',
  outlineOffset: '0px',

  // Colors and contrast
  color: 'rgb(0, 0, 0)',
  backgroundColor: 'rgb(255, 255, 255)',
  borderColor: 'rgb(0, 0, 0)',

  // Layout and visibility
  display: 'block',
  visibility: 'visible',
  opacity: '1',
  position: 'static',
  zIndex: 'auto',

  // Typography
  fontSize: '16px',
  fontWeight: '400',
  fontFamily: 'Arial, sans-serif',
  lineHeight: '1.5',

  // Spacing
  padding: '0px',
  margin: '0px',
  border: '0px none rgb(0, 0, 0)',
  borderWidth: '0px',
  borderStyle: 'none',

  // Box model
  width: '100px',
  height: '100px',
  minWidth: '0px',
  minHeight: '0px',
  maxWidth: 'none',
  maxHeight: 'none',

  // Animation and motion
  animation: 'none',
  animationDuration: '0s',
  animationName: 'none',
  transition: 'none',
  transitionDuration: '0s',

  // Focus-specific styles (when :focus pseudo-class is applied)
  ':focus': {
    outline: '2px solid blue',
    outlineColor: 'blue',
    outlineStyle: 'solid',
    outlineWidth: '2px',
    backgroundColor: 'rgb(240, 248, 255)', // Light blue background
    borderColor: 'rgb(0, 100, 200)',
  },

  // Interactive element styles
  cursor: 'default',
};

/**
 * Element-specific style overrides for better accessibility testing
 */
const ELEMENT_STYLE_OVERRIDES = {
  button: {
    cursor: 'pointer',
    backgroundColor: 'rgb(240, 240, 240)',
    border: '1px solid rgb(200, 200, 200)',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '14px',
    ':focus': {
      outline: '2px solid rgb(0, 123, 255)',
      outlineOffset: '2px',
      backgroundColor: 'rgb(230, 245, 255)',
    },
  },
  a: {
    color: 'rgb(0, 123, 255)',
    cursor: 'pointer',
    textDecoration: 'underline',
    ':focus': {
      outline: '2px solid rgb(0, 123, 255)',
      outlineOffset: '2px',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
    },
  },
  input: {
    border: '1px solid rgb(200, 200, 200)',
    borderRadius: '4px',
    padding: '8px',
    backgroundColor: 'rgb(255, 255, 255)',
    cursor: 'text',
    ':focus': {
      outline: '2px solid rgb(0, 123, 255)',
      outlineOffset: '0px',
      borderColor: 'rgb(0, 123, 255)',
      backgroundColor: 'rgb(255, 255, 255)',
    },
  },
  select: {
    border: '1px solid rgb(200, 200, 200)',
    borderRadius: '4px',
    padding: '8px',
    backgroundColor: 'rgb(255, 255, 255)',
    cursor: 'pointer',
    ':focus': {
      outline: '2px solid rgb(0, 123, 255)',
      outlineOffset: '0px',
      borderColor: 'rgb(0, 123, 255)',
    },
  },
  textarea: {
    border: '1px solid rgb(200, 200, 200)',
    borderRadius: '4px',
    padding: '8px',
    backgroundColor: 'rgb(255, 255, 255)',
    cursor: 'text',
    resize: 'vertical',
    ':focus': {
      outline: '2px solid rgb(0, 123, 255)',
      outlineOffset: '0px',
      borderColor: 'rgb(0, 123, 255)',
    },
  },
  '[role="button"]': {
    cursor: 'pointer',
    ':focus': {
      outline: '2px solid rgb(0, 123, 255)',
      outlineOffset: '2px',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
    },
  },
};

/**
 * Create comprehensive getComputedStyle mock
 */
export function createGetComputedStyleMock() {
  return vi.fn().mockImplementation((element, pseudoElt) => {
    const tagName = element.tagName ? element.tagName.toLowerCase() : 'div';
    const role = element.getAttribute('role');

    // Get base styles
    let styles = { ...DEFAULT_COMPUTED_STYLES };

    // Apply element-specific overrides
    if (ELEMENT_STYLE_OVERRIDES[tagName]) {
      styles = { ...styles, ...ELEMENT_STYLE_OVERRIDES[tagName] };
    }

    // Apply role-specific overrides
    const roleSelector = `[role="${role}"]`;
    if (role && ELEMENT_STYLE_OVERRIDES[roleSelector]) {
      styles = { ...styles, ...ELEMENT_STYLE_OVERRIDES[roleSelector] };
    }

    // Handle pseudo-elements like :focus
    if (pseudoElt === ':focus') {
      const focusStyles =
        ELEMENT_STYLE_OVERRIDES[tagName]?.[':focus'] || DEFAULT_COMPUTED_STYLES[':focus'];
      styles = { ...styles, ...focusStyles };
    }

    // Apply custom styles from style attribute or classes
    const customStyles = getCustomElementStyles(element);
    styles = { ...styles, ...customStyles };

    // Create CSSStyleDeclaration-like object
    const computedStyle = createComputedStyleObject(styles);

    return computedStyle;
  });
}

/**
 * Extract custom styles from element attributes and classes
 */
function getCustomElementStyles(element) {
  const styles = {};

  // Parse inline styles
  if (element.style && typeof element.style === 'object') {
    Object.keys(element.style).forEach(prop => {
      if (element.style[prop]) {
        styles[prop] = element.style[prop];
      }
    });
  }

  // Handle common class-based styling patterns
  if (element.className) {
    const classes = element.className.split(' ');
    classes.forEach(className => {
      switch (className) {
        case 'hidden':
          styles.display = 'none';
          break;
        case 'invisible':
          styles.visibility = 'hidden';
          break;
        case 'sr-only':
        case 'visually-hidden':
          styles.position = 'absolute';
          styles.width = '1px';
          styles.height = '1px';
          styles.padding = '0px';
          styles.margin = '-1px';
          styles.overflow = 'hidden';
          styles.clip = 'rect(0, 0, 0, 0)';
          styles.whiteSpace = 'nowrap';
          styles.border = '0px';
          break;
        case 'focus-visible':
          styles.outline = '2px solid rgb(0, 123, 255)';
          styles.outlineOffset = '2px';
          break;
        case 'no-focus':
          styles.outline = 'none';
          break;
        default:
          // Check for color/theme classes
          if (className.includes('text-')) {
            styles.color = getColorFromClass(className);
          }
          if (className.includes('bg-')) {
            styles.backgroundColor = getColorFromClass(className);
          }
          break;
      }
    });
  }

  // Handle disabled state
  if (element.disabled || element.getAttribute('aria-disabled') === 'true') {
    styles.opacity = '0.6';
    styles.cursor = 'not-allowed';
    styles.color = 'rgb(120, 120, 120)';
  }

  // Handle hidden state
  if (element.getAttribute('aria-hidden') === 'true') {
    styles.visibility = 'hidden';
  }

  return styles;
}

/**
 * Get color value from CSS class name
 */
function getColorFromClass(className) {
  const colorMap = {
    'text-black': 'rgb(0, 0, 0)',
    'text-white': 'rgb(255, 255, 255)',
    'text-gray': 'rgb(120, 120, 120)',
    'text-red': 'rgb(220, 53, 69)',
    'text-blue': 'rgb(0, 123, 255)',
    'text-green': 'rgb(40, 167, 69)',
    'text-yellow': 'rgb(255, 193, 7)',
    'bg-black': 'rgb(0, 0, 0)',
    'bg-white': 'rgb(255, 255, 255)',
    'bg-gray': 'rgb(248, 249, 250)',
    'bg-red': 'rgb(220, 53, 69)',
    'bg-blue': 'rgb(0, 123, 255)',
    'bg-green': 'rgb(40, 167, 69)',
    'bg-yellow': 'rgb(255, 193, 7)',
  };

  return colorMap[className] || 'rgb(0, 0, 0)';
}

/**
 * Create CSSStyleDeclaration-like object
 */
function createComputedStyleObject(styles) {
  const computedStyle = {};

  // Add all style properties
  Object.keys(styles).forEach(prop => {
    if (prop.startsWith(':')) return; // Skip pseudo-element styles

    computedStyle[prop] = styles[prop];

    // Add camelCase version for JavaScript access
    const camelCaseProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (camelCaseProp !== prop) {
      computedStyle[camelCaseProp] = styles[prop];
    }
  });

  // Add getPropertyValue method
  computedStyle.getPropertyValue = vi.fn().mockImplementation(property => {
    const kebabCase = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    return computedStyle[property] || computedStyle[kebabCase] || '';
  });

  // Add setProperty method (for testing purposes)
  computedStyle.setProperty = vi.fn().mockImplementation((property, value) => {
    computedStyle[property] = value;
    const camelCase = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    computedStyle[camelCase] = value;
  });

  // Add length property for iteration
  const keys = Object.keys(computedStyle).filter(key => typeof computedStyle[key] === 'string');
  Object.defineProperty(computedStyle, 'length', {
    value: keys.length,
    enumerable: false,
  });

  // Add indexed access
  keys.forEach((key, index) => {
    computedStyle[index] = key;
  });

  return computedStyle;
}

/**
 * Mock focus management for accessibility testing
 */
export function setupFocusMocks() {
  let currentFocusedElement = null;

  // Mock focus method
  const originalFocus = Element.prototype.focus;
  Element.prototype.focus = vi.fn(function () {
    // Call original if it exists and we're not in test environment
    if (originalFocus && typeof originalFocus === 'function' && !vi.isMockFunction(originalFocus)) {
      try {
        originalFocus.call(this);
      } catch (e) {
        // Ignore errors in test environment
      }
    }

    // Update activeElement
    Object.defineProperty(document, 'activeElement', {
      value: this,
      configurable: true,
    });

    currentFocusedElement = this;

    // Dispatch focus event
    const focusEvent = new Event('focus', { bubbles: true });
    this.dispatchEvent(focusEvent);
  });

  // Mock blur method
  const originalBlur = Element.prototype.blur;
  Element.prototype.blur = vi.fn(function () {
    // Call original if it exists and we're not in test environment
    if (originalBlur && typeof originalBlur === 'function' && !vi.isMockFunction(originalBlur)) {
      try {
        originalBlur.call(this);
      } catch (e) {
        // Ignore errors in test environment
      }
    }

    if (currentFocusedElement === this) {
      currentFocusedElement = document.body;

      // Update activeElement
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true,
      });
    }

    // Dispatch blur event
    const blurEvent = new Event('blur', { bubbles: true });
    this.dispatchEvent(blurEvent);
  });

  // Mock tabIndex behavior
  Object.defineProperty(HTMLElement.prototype, 'tabIndex', {
    get() {
      const tabIndex = this.getAttribute('tabindex');
      if (tabIndex === null) {
        // Default tabIndex for naturally focusable elements
        const naturallyFocusable = ['a', 'button', 'input', 'select', 'textarea'];
        return naturallyFocusable.includes(this.tagName.toLowerCase()) ? 0 : -1;
      }
      return parseInt(tabIndex, 10);
    },
    set(value) {
      this.setAttribute('tabindex', value.toString());
    },
    configurable: true,
  });

  return {
    getCurrentFocusedElement: () => currentFocusedElement,
    setCurrentFocusedElement: element => {
      currentFocusedElement = element;
      Object.defineProperty(document, 'activeElement', {
        value: element || document.body,
        configurable: true,
      });
    },
  };
}

/**
 * Mock screen reader announcement system
 */
export function setupScreenReaderMocks() {
  const announcements = [];

  // Mock live region announcements
  const mockAnnounce = vi.fn((message, priority = 'polite') => {
    announcements.push({ message, priority, timestamp: Date.now() });
  });

  // Set up global screen reader interface
  global.screenReader = {
    announce: mockAnnounce,
    getAnnouncements: () => [...announcements],
    clearAnnouncements: () => (announcements.length = 0),
  };

  // Mock ARIA live region behavior
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = vi.fn(function (name, value) {
    originalSetAttribute.call(this, name, value);

    // Simulate screen reader announcement for aria-live regions
    if (name === 'aria-live' && value !== 'off') {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const text = this.textContent.trim();
            if (text) {
              mockAnnounce(text, value);
            }
          }
        });
      });

      observer.observe(this, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  });

  return {
    getAnnouncements: () => [...announcements],
    clearAnnouncements: () => (announcements.length = 0),
    getLastAnnouncement: () => announcements[announcements.length - 1] || null,
  };
}

/**
 * Mock keyboard event simulation
 */
export function createKeyboardEventMock() {
  return {
    simulateKeyPress: (element, key, options = {}) => {
      const keydownEvent = new KeyboardEvent('keydown', {
        key,
        code: `Key${key.toUpperCase()}`,
        bubbles: true,
        cancelable: true,
        ...options,
      });

      const keyupEvent = new KeyboardEvent('keyup', {
        key,
        code: `Key${key.toUpperCase()}`,
        bubbles: true,
        cancelable: true,
        ...options,
      });

      element.dispatchEvent(keydownEvent);

      // Simulate default browser behavior for common keys
      if (!keydownEvent.defaultPrevented) {
        switch (key) {
          case 'Tab': {
            // Focus next/previous element
            const focusableElements = document.querySelectorAll(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            const currentIndex = Array.from(focusableElements).indexOf(element);
            const nextIndex = options.shiftKey ? currentIndex - 1 : currentIndex + 1;
            const nextElement = focusableElements[nextIndex];
            if (nextElement) {
              nextElement.focus();
            }
            break;
          }
          case 'Enter':
          case ' ':
            // Activate element
            if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
              element.click();
            }
            break;
          case 'Escape': {
            // Close modals, clear focus traps, etc.
            const modal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
            if (modal) {
              modal.style.display = 'none';
              modal.setAttribute('aria-hidden', 'true');
            }
            break;
          }
        }
      }

      element.dispatchEvent(keyupEvent);

      return { keydownEvent, keyupEvent };
    },

    simulateTabSequence: (startElement, steps = 5) => {
      let currentElement = startElement;
      const sequence = [currentElement];

      for (let i = 0; i < steps; i++) {
        const { keydownEvent } = createKeyboardEventMock().simulateKeyPress(currentElement, 'Tab');
        if (!keydownEvent.defaultPrevented) {
          currentElement = document.activeElement;
          sequence.push(currentElement);
        }
      }

      return sequence;
    },
  };
}

/**
 * Setup all accessibility test mocks
 */
export function setupAccessibilityTestMocks() {
  // Mock getComputedStyle
  const getComputedStyleMock = createGetComputedStyleMock();
  Object.defineProperty(window, 'getComputedStyle', {
    value: getComputedStyleMock,
    configurable: true,
    writable: true,
  });

  // Setup focus management
  const focusMocks = setupFocusMocks();

  // Setup screen reader mocks
  const screenReaderMocks = setupScreenReaderMocks();

  // Setup keyboard event simulation
  const keyboardMocks = createKeyboardEventMock();

  // Mock additional browser APIs for accessibility testing
  global.speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockReturnValue([]),
    speaking: false,
    pending: false,
    paused: false,
  };

  // Mock media query for reduced motion
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion') ? false : true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      configurable: true,
    });
  }

  return {
    getComputedStyle: getComputedStyleMock,
    focus: focusMocks,
    screenReader: screenReaderMocks,
    keyboard: keyboardMocks,

    // Cleanup function
    cleanup: () => {
      vi.clearAllMocks();
      if (global.screenReader) {
        global.screenReader.clearAnnouncements();
      }
    },
  };
}

/**
 * Accessibility test utilities
 */
export const accessibilityTestUtils = {
  /**
   * Check if element meets WCAG color contrast requirements
   */
  checkColorContrast: (foreground, background, large = false) => {
    const ratio = calculateContrastRatio(foreground, background);
    const minRatio = large ? 3.0 : 4.5;
    return {
      ratio,
      passes: ratio >= minRatio,
      level: ratio >= 7.0 ? 'AAA' : ratio >= minRatio ? 'AA' : 'FAIL',
    };
  },

  /**
   * Get all focusable elements in container
   */
  getFocusableElements: (container = document) => {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(selector));
  },

  /**
   * Check if element has proper focus indicator
   */
  hasFocusIndicator: element => {
    const styles = window.getComputedStyle(element, ':focus');
    return styles.outline !== 'none' && styles.outline !== '0px';
  },

  /**
   * Check if element has accessible name
   */
  hasAccessibleName: element => {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent.trim() ||
      element.title ||
      (element.tagName === 'INPUT' && element.labels?.length > 0)
    );
  },
};

// Helper function for color contrast calculation
function calculateContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getLuminance(color) {
  const rgb = parseColor(color);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseColor(color) {
  // Handle rgb() format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  }

  // Handle rgba() format
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
  if (rgbaMatch) {
    return [parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3])];
  }

  // Handle hex format
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return [parseInt(hexMatch[1], 16), parseInt(hexMatch[2], 16), parseInt(hexMatch[3], 16)];
  }

  return null;
}
