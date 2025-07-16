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
  if (global.window.HTMLCanvasElement) {
    global.window.HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
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

  // Mock window.scrollTo (jsdom doesn't implement it)
  global.window.scrollTo = vi.fn();
  global.window.scroll = vi.fn();
  global.window.scrollBy = vi.fn();
  
  // Mock window.getComputedStyle for better DOM testing
  global.window.getComputedStyle = vi.fn().mockReturnValue({
    getPropertyValue: vi.fn().mockReturnValue(''),
    display: 'block',
    visibility: 'visible',
    opacity: '1'
  });
  
  // Mock window.IntersectionObserver
  global.window.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));
  
  // Mock window.ResizeObserver
  global.window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));
  
  // Mock window.MutationObserver
  global.window.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn().mockReturnValue([])
  }));
  
  // Mock window.performance.now for timing functions (handle read-only)
  try {
    global.window.performance = {
      ...global.window.performance,
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn().mockReturnValue([]),
      getEntriesByType: vi.fn().mockReturnValue([])
    };
  } catch (e) {
    // If performance is read-only, use defineProperty
    Object.defineProperty(global.window, 'performance', {
      value: {
        now: vi.fn(() => Date.now()),
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByName: vi.fn().mockReturnValue([]),
        getEntriesByType: vi.fn().mockReturnValue([]),
        timing: {},
        navigation: {}
      },
      writable: true,
      configurable: true
    });
  }
  
  // Mock window.URL for URL operations
  global.window.URL = {
    createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
    revokeObjectURL: vi.fn()
  };
  
  // Mock window.Blob for file operations
  global.window.Blob = vi.fn().mockImplementation(() => ({
    size: 0,
    type: 'text/plain'
  }));
  
  // Mock window.FileReader for file handling
  global.window.FileReader = vi.fn().mockImplementation(() => ({
    readAsText: vi.fn(),
    readAsDataURL: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    result: null,
    error: null
  }));
  
  // Mock window.history for navigation testing (handle read-only)
  try {
    global.window.history = {
      pushState: vi.fn(),
      replaceState: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      go: vi.fn(),
      length: 1,
      state: null
    };
  } catch (e) {
    // If history is read-only, use defineProperty
    Object.defineProperty(global.window, 'history', {
      value: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        go: vi.fn(),
        length: 1,
        state: null
      },
      writable: true,
      configurable: true
    });
  }
  
  // Mock window.screen for screen info
  global.window.screen = {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1080,
    colorDepth: 24,
    pixelDepth: 24,
    orientation: {
      angle: 0,
      type: 'landscape-primary',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  };
  
  // Mock window.devicePixelRatio
  global.window.devicePixelRatio = 1;
  
  // Mock window.pageXOffset and pageYOffset
  global.window.pageXOffset = 0;
  global.window.pageYOffset = 0;
  global.window.scrollX = 0;
  global.window.scrollY = 0;
  
  // Mock window.innerWidth and innerHeight
  global.window.innerWidth = 1920;
  global.window.innerHeight = 1080;
  global.window.outerWidth = 1920;
  global.window.outerHeight = 1080;
  
  // Mock document.elementFromPoint
  global.document.elementFromPoint = vi.fn().mockReturnValue(null);
  global.document.elementsFromPoint = vi.fn().mockReturnValue([]);
  
  // Mock document.createRange
  global.document.createRange = vi.fn().mockReturnValue({
    setStart: vi.fn(),
    setEnd: vi.fn(),
    collapse: vi.fn(),
    selectNode: vi.fn(),
    selectNodeContents: vi.fn(),
    deleteContents: vi.fn(),
    extractContents: vi.fn(),
    cloneContents: vi.fn(),
    insertNode: vi.fn(),
    surroundContents: vi.fn(),
    cloneRange: vi.fn(),
    toString: vi.fn().mockReturnValue(''),
    getBoundingClientRect: vi.fn().mockReturnValue({
      x: 0, y: 0, width: 0, height: 0,
      top: 0, right: 0, bottom: 0, left: 0
    })
  });
  
  // Mock document.getSelection
  global.document.getSelection = vi.fn().mockReturnValue({
    getRangeAt: vi.fn().mockReturnValue({
      setStart: vi.fn(),
      setEnd: vi.fn()
    }),
    addRange: vi.fn(),
    removeAllRanges: vi.fn(),
    toString: vi.fn().mockReturnValue('')
  });
  
  // Mock document.execCommand
  global.document.execCommand = vi.fn().mockReturnValue(true);
  
  // Mock document.hidden and visibilityState
  Object.defineProperty(global.document, 'hidden', {
    value: false,
    writable: true
  });
  
  Object.defineProperty(global.document, 'visibilityState', {
    value: 'visible',
    writable: true
  });
  
  // Mock document.fullscreenElement
  Object.defineProperty(global.document, 'fullscreenElement', {
    value: null,
    writable: true
  });
  
  // Mock document.exitFullscreen
  global.document.exitFullscreen = vi.fn().mockResolvedValue();
  
  // Mock Audio API
  global.window.Audio = vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(),
    pause: vi.fn(),
    load: vi.fn(),
    volume: 1,
    muted: false,
    duration: 0,
    currentTime: 0,
    paused: true,
    ended: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
  
  // Mock AudioContext
  global.window.AudioContext = vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { setValueAtTime: vi.fn() },
      type: 'sine'
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
    })),
    destination: {},
    currentTime: 0.5
  }));
  
  global.window.webkitAudioContext = global.window.AudioContext;
  
  // Mock navigator.vibrate
  global.navigator.vibrate = vi.fn();
  
  // Mock navigator.mediaDevices
  global.navigator.mediaDevices = {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([])
    }),
    getDisplayMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([])
    })
  };
  
  // Mock navigator.geolocation
  global.navigator.geolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn()
  };
  
  // Mock navigator.permissions
  global.navigator.permissions = {
    query: vi.fn().mockResolvedValue({ state: 'granted' })
  };
  
  // Mock navigator.clipboard
  global.navigator.clipboard = {
    writeText: vi.fn().mockResolvedValue(),
    readText: vi.fn().mockResolvedValue(''),
    write: vi.fn().mockResolvedValue(),
    read: vi.fn().mockResolvedValue([])
  };
  
  // Mock window.crypto (handling read-only property)
  try {
    global.window.crypto = {
      getRandomValues: vi.fn().mockImplementation((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
      subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(16)),
        decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(16))
      }
    };
  } catch (e) {
    // If crypto is read-only, use defineProperty
    Object.defineProperty(global.window, 'crypto', {
      value: {
        getRandomValues: vi.fn().mockImplementation((arr) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        }),
        subtle: {
          digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
          encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(16)),
          decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(16))
        }
      },
      writable: true,
      configurable: true
    });
  }
  
  // Mock window.requestIdleCallback
  global.window.requestIdleCallback = vi.fn((cb) => setTimeout(cb, 1));
  global.window.cancelIdleCallback = vi.fn();
  
  // Mock window.Image
  global.window.Image = vi.fn().mockImplementation(() => ({
    src: '',
    onload: null,
    onerror: null,
    width: 0,
    height: 0,
    complete: true
  }));
  
  // Mock form validation APIs
  if (global.window.HTMLFormElement) {
    global.window.HTMLFormElement.prototype.checkValidity = vi.fn().mockReturnValue(true);
    global.window.HTMLFormElement.prototype.reportValidity = vi.fn().mockReturnValue(true);
  }
  
  // Mock element.getBoundingClientRect
  if (global.window.Element) {
    global.window.Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      x: 0, y: 0, width: 0, height: 0,
      top: 0, right: 0, bottom: 0, left: 0
    });
    
    // Mock element.scrollIntoView
    global.window.Element.prototype.scrollIntoView = vi.fn();
    
    // Mock element.animate
    global.window.Element.prototype.animate = vi.fn().mockReturnValue({
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      finish: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
    
    // Mock element.requestFullscreen
    global.window.Element.prototype.requestFullscreen = vi.fn().mockResolvedValue();
  }
  
  // Mock WebGL context
  global.window.WebGLRenderingContext = vi.fn();
  global.window.WebGL2RenderingContext = vi.fn();
  
  // Mock CSS Object Model
  global.window.CSS = {
    supports: vi.fn().mockReturnValue(true),
    escape: vi.fn().mockImplementation(str => str),
    paintWorklet: {
      addModule: vi.fn().mockResolvedValue()
    }
  };
  
  // Mock Fetch API (enhanced)
  global.window.fetch = vi.fn().mockImplementation((url) => {
    // Provide default responses for common requests
    if (url.includes('navbar.html')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<nav id="navbar">Mock Navbar</nav>'),
        json: () => Promise.resolve({}),
        blob: () => Promise.resolve(new Blob())
      });
    }
    
    // Mock navigation JavaScript files
    if (url.includes('navigationHelper.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('// Mock navigationHelper.js content\nclass NavigationHelper { constructor() {} }'),
        json: () => Promise.resolve({}),
        blob: () => Promise.resolve(new Blob())
      });
    }
    
    if (url.includes('navbarLoader.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('// Mock navbarLoader.js content'),
        json: () => Promise.resolve({}),
        blob: () => Promise.resolve(new Blob())
      });
    }
    
    if (url.includes('navigation.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('// Mock navigation.js content'),
        json: () => Promise.resolve({}),
        blob: () => Promise.resolve(new Blob())
      });
    }
    
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(''),
      json: () => Promise.resolve({}),
      blob: () => Promise.resolve(new Blob())
    });
  });
  
  // Mock WebSocket
  global.window.WebSocket = vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  }));
  
  // Mock EventSource
  global.window.EventSource = vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSED: 2
  }));
  
  // Mock Worker
  global.window.Worker = vi.fn().mockImplementation(() => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
  
  // Mock SharedWorker
  global.window.SharedWorker = vi.fn().mockImplementation(() => ({
    port: {
      postMessage: vi.fn(),
      start: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  }));
  
  // Mock ServiceWorker
  global.navigator.serviceWorker = {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({}),
    controller: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };
  
  // Mock IndexedDB
  global.window.indexedDB = {
    open: vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }),
    deleteDatabase: vi.fn(),
    cmp: vi.fn().mockReturnValue(0)
  };
  
  // Mock Notification API
  global.window.Notification = vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
  
  global.window.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
  global.window.Notification.permission = 'granted';
  
  // Mock Touch APIs
  global.window.TouchEvent = vi.fn().mockImplementation((type, options) => ({
    type,
    ...options,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    touches: [],
    changedTouches: []
  }));
  
  global.window.Touch = vi.fn().mockImplementation(() => ({
    identifier: 0,
    target: null,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    screenX: 0,
    screenY: 0
  }));
  
  // Mock KeyboardEvent with proper inheritance
  global.window.KeyboardEvent = vi.fn().mockImplementation(function(type, options = {}) {
    // Create event with proper prototype and inheritance
    const event = Object.create(Event.prototype);
    
    // Define properties with proper descriptors to handle read-only properties
    Object.defineProperty(event, 'type', { value: type, writable: false, configurable: true });
    Object.defineProperty(event, 'key', { value: options.key || '', writable: false, configurable: true });
    Object.defineProperty(event, 'code', { value: options.code || '', writable: false, configurable: true });
    Object.defineProperty(event, 'shiftKey', { value: options.shiftKey || false, writable: false, configurable: true });
    Object.defineProperty(event, 'ctrlKey', { value: options.ctrlKey || false, writable: false, configurable: true });
    Object.defineProperty(event, 'altKey', { value: options.altKey || false, writable: false, configurable: true });
    Object.defineProperty(event, 'metaKey', { value: options.metaKey || false, writable: false, configurable: true });
    Object.defineProperty(event, 'bubbles', { value: options.bubbles || false, writable: false, configurable: true });
    Object.defineProperty(event, 'cancelable', { value: options.cancelable || false, writable: false, configurable: true });
    Object.defineProperty(event, 'target', { value: null, writable: true, configurable: true });
    Object.defineProperty(event, 'currentTarget', { value: null, writable: true, configurable: true });
    Object.defineProperty(event, 'eventPhase', { value: 0, writable: true, configurable: true });
    Object.defineProperty(event, 'isTrusted', { value: false, writable: false, configurable: true });
    Object.defineProperty(event, 'timeStamp', { value: Date.now(), writable: false, configurable: true });
    
    event.preventDefault = vi.fn();
    event.stopPropagation = vi.fn();
    event.stopImmediatePropagation = vi.fn();
    
    return event;
  });
  
  // Mock MouseEvent with proper inheritance
  global.window.MouseEvent = vi.fn().mockImplementation(function(type, options = {}) {
    const event = Object.create(Event.prototype);
    
    // Define properties with proper descriptors to handle read-only properties
    Object.defineProperty(event, 'type', { value: type, writable: false, configurable: true });
    Object.defineProperty(event, 'clientX', { value: options.clientX || 0, writable: false, configurable: true });
    Object.defineProperty(event, 'clientY', { value: options.clientY || 0, writable: false, configurable: true });
    Object.defineProperty(event, 'button', { value: options.button || 0, writable: false, configurable: true });
    Object.defineProperty(event, 'buttons', { value: options.buttons || 0, writable: false, configurable: true });
    Object.defineProperty(event, 'bubbles', { value: options.bubbles || false, writable: false, configurable: true });
    Object.defineProperty(event, 'cancelable', { value: options.cancelable || false, writable: false, configurable: true });
    Object.defineProperty(event, 'target', { value: null, writable: true, configurable: true });
    Object.defineProperty(event, 'currentTarget', { value: null, writable: true, configurable: true });
    Object.defineProperty(event, 'eventPhase', { value: 0, writable: true, configurable: true });
    Object.defineProperty(event, 'isTrusted', { value: false, writable: false, configurable: true });
    Object.defineProperty(event, 'timeStamp', { value: Date.now(), writable: false, configurable: true });
    
    event.preventDefault = vi.fn();
    event.stopPropagation = vi.fn();
    event.stopImmediatePropagation = vi.fn();
    
    return event;
  });
  
  // Mock CustomEvent with proper inheritance
  global.window.CustomEvent = vi.fn().mockImplementation(function(type, options = {}) {
    const event = Object.create(Event.prototype);
    
    // Define properties with proper descriptors to handle read-only properties
    Object.defineProperty(event, 'type', { value: type, writable: false, configurable: true });
    Object.defineProperty(event, 'detail', { value: options.detail || null, writable: false, configurable: true });
    Object.defineProperty(event, 'bubbles', { value: options.bubbles || false, writable: false, configurable: true });
    Object.defineProperty(event, 'cancelable', { value: options.cancelable || false, writable: false, configurable: true });
    Object.defineProperty(event, 'target', { value: null, writable: true, configurable: true });
    Object.defineProperty(event, 'currentTarget', { value: null, writable: true, configurable: true });
    Object.defineProperty(event, 'eventPhase', { value: 0, writable: true, configurable: true });
    Object.defineProperty(event, 'isTrusted', { value: false, writable: false, configurable: true });
    Object.defineProperty(event, 'timeStamp', { value: Date.now(), writable: false, configurable: true });
    
    event.preventDefault = vi.fn();
    event.stopPropagation = vi.fn();
    event.stopImmediatePropagation = vi.fn();
    
    return event;
  });
  
  // Mock Event constructor with proper prototype
  global.window.Event = vi.fn().mockImplementation(function(type, options = {}) {
    const event = Object.create(Event.prototype);
    
    // Define properties with proper descriptors to handle read-only properties
    Object.defineProperty(event, 'type', { value: type, writable: false, configurable: true });
    Object.defineProperty(event, 'bubbles', { value: options.bubbles || false, writable: false, configurable: true });
    Object.defineProperty(event, 'cancelable', { value: options.cancelable || false, writable: false, configurable: true });
    Object.defineProperty(event, 'target', { value: null, writable: true, configurable: true });
    Object.defineProperty(event, 'currentTarget', { value: null, writable: true, configurable: true });
    Object.defineProperty(event, 'eventPhase', { value: 0, writable: true, configurable: true });
    Object.defineProperty(event, 'isTrusted', { value: false, writable: false, configurable: true });
    Object.defineProperty(event, 'timeStamp', { value: Date.now(), writable: false, configurable: true });
    
    event.preventDefault = vi.fn();
    event.stopPropagation = vi.fn();
    event.stopImmediatePropagation = vi.fn();
    
    return event;
  });
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