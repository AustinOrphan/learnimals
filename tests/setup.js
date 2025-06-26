/**
 * Vitest Test Setup
 * Global setup and configuration for all tests
 */

import { vi } from 'vitest';

// Global test utilities
global.testUtils = {
  // Create a mock DOM element
  createElement: (tag, attributes = {}, textContent = '') => {
    const element = document.createElement(tag);
    Object.assign(element, attributes);
    if (textContent) element.textContent = textContent;
    return element;
  },
  
  // Wait for next tick
  nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Create mock canvas context
  mockCanvasContext: () => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
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
    arc: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 }))
  })
};

// Mock browser APIs
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock console methods for testing
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(() => global.testUtils.mockCanvasContext());

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(callback => setTimeout(callback, 16));
global.cancelAnimationFrame = vi.fn();

// Mock performance.now
global.performance = {
  now: vi.fn(() => Date.now())
};

// Mock URL constructor
global.URL = class URL {
  constructor(url) {
    this.href = url;
    this.pathname = url.split('?')[0];
    this.search = url.includes('?') ? '?' + url.split('?')[1] : '';
  }
};

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();
});