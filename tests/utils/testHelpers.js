/**
 * Test Helper Utilities
 * Common utilities for testing Learnimals components and features
 */

import { vi } from 'vitest';

/**
 * Create a mock DOM environment with common elements
 */
export function createMockDOM() {
  document.body.innerHTML = `
    <div id="app">
      <div id="navbar-placeholder"></div>
      <main></main>
      <div id="modal-root"></div>
    </div>
  `;

  return {
    app: document.getElementById('app'),
    navbar: document.getElementById('navbar-placeholder'),
    main: document.querySelector('main'),
    modalRoot: document.getElementById('modal-root')
  };
}

/**
 * Mock a component with default methods
 */
export function createMockComponent(options = {}) {
  return {
    init: vi.fn(),
    destroy: vi.fn(),
    render: vi.fn(),
    attachEventListeners: vi.fn(),
    ...options
  };
}

/**
 * Mock game state for testing games
 */
export function createMockGameState(overrides = {}) {
  return {
    isRunning: false,
    isPaused: false,
    score: 0,
    level: 1,
    lives: 3,
    timeElapsed: 0,
    entities: [],
    ...overrides
  };
}

/**
 * Create a mock canvas for game testing
 */
export function createMockCanvas(width = 800, height = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = global.testUtils.mockCanvasContext();
  canvas.getContext = vi.fn(() => context);

  return { canvas, context };
}

/**
 * Mock theme manager
 */
export function createMockThemeManager() {
  return {
    currentTheme: 'light',
    setTheme: vi.fn(),
    getTheme: vi.fn(() => 'light'),
    getThemeColors: vi.fn(() => ({
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745'
    })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };
}

/**
 * Mock modal options
 */
export function createMockModalOptions(overrides = {}) {
  return {
    id: 'test-modal',
    title: 'Test Modal',
    content: '<p>Test content</p>',
    confirmButtonText: 'OK',
    showClose: true,
    size: 'medium',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    onClose: vi.fn(),
    ...overrides
  };
}

/**
 * Mock subject data
 */
export function createMockSubjectData(subject = 'math') {
  const subjects = {
    math: {
      name: 'Math',
      character: { name: 'Archie', type: 'Owl', role: 'Math Teacher' },
      features: ['Addition', 'Subtraction', 'Multiplication', 'Division']
    },
    science: {
      name: 'Science',
      character: { name: 'Tesla', type: 'Cat', role: 'Science Explorer' },
      features: ['Physics', 'Chemistry', 'Biology', 'Earth Science']
    }
  };

  return subjects[subject] || subjects.math;
}

/**
 * Wait for DOM updates
 */
export async function waitForDOM(timeout = 100) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

/**
 * Trigger an event on an element
 */
export function triggerEvent(element, eventType, eventData = {}) {
  const event = new Event(eventType, { bubbles: true, cancelable: true });
  Object.assign(event, eventData);
  element.dispatchEvent(event);
  return event;
}

/**
 * Create mock browser environment
 */
export function mockBrowserEnvironment() {
  // Mock window properties
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000/src/pages/index.html',
      pathname: '/src/pages/index.html',
      origin: 'http://localhost:3000',
      search: ''
    },
    writable: true
  });

  // Mock navigator
  Object.defineProperty(window, 'navigator', {
    value: {
      userAgent: 'test-agent',
      language: 'en-US'
    },
    writable: true
  });

  // Mock CSS custom properties
  const mockComputedStyle = {
    getPropertyValue: vi.fn((prop) => {
      const mockValues = {
        '--text-primary': '#333333',
        '--bg-primary': '#ffffff',
        '--accent-primary': '#007bff'
      };
      return mockValues[prop] || '';
    })
  };

  window.getComputedStyle = vi.fn(() => mockComputedStyle);
}

/**
 * Mock logger for testing
 */
export function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setLevel: vi.fn(),
    enabled: true
  };
}

/**
 * Assert that an element has specific attributes
 */
export function assertElementAttributes(element, expectedAttributes) {
  Object.entries(expectedAttributes).forEach(([attr, value]) => {
    if (value === null) {
      expect(element.getAttribute(attr)).toBeNull();
    } else {
      expect(element.getAttribute(attr)).toBe(value);
    }
  });
}

/**
 * Create a mock card data object
 */
export function createMockCardData(overrides = {}) {
  return {
    title: 'Test Card',
    content: '<p>Test content</p>',
    linkUrl: '#test',
    linkText: 'Learn More',
    theme: 'default',
    ...overrides
  };
}