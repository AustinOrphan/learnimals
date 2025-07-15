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
  const MockComponent = vi.fn().mockImplementation(function(selector, options = {}) {
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
    mockFunctions[name] = typeof implementation === 'function' 
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
  const MockGame = vi.fn().mockImplementation(function(canvasId, options = {}) {
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
      destroy: vi.fn()
    }))
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
    key: vi.fn()
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
  
  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: { ...localStorageMock },
    writable: true
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
    writable: true
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
    strokeText: vi.fn()
  }));
}

export default {
  createMockModule,
  createMockComponent,
  createMockUtility,
  createMockGame,
  resolveModulePath,
  createMockDependency,
  setupGlobalMocks
};