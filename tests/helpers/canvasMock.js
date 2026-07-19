/**
 * Canvas API Mock Helper
 * Provides comprehensive Canvas 2D API mocking for game tests.
 * Adapted from feature/test-coverage-80-percent.
 */

import { vi } from 'vitest';

/**
 * Create a comprehensive Canvas 2D context mock
 * @returns {Object} Mocked 2D context
 */
export function createCanvas2DMock() {
  const mockContext = {
    // Drawing rectangles
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),

    // Drawing text
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(text => ({
      width: text ? text.length * 8 : 0,
      height: 16,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: text ? text.length * 8 : 0,
      actualBoundingBoxAscent: 12,
      actualBoundingBoxDescent: 4,
    })),

    // Drawing paths
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    ellipse: vi.fn(),
    rect: vi.fn(),

    // Filling and stroking
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    isPointInPath: vi.fn(() => false),
    isPointInStroke: vi.fn(() => false),

    // Transformations
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    getTransform: vi.fn(() => ({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0,
      is2D: true,
      isIdentity: true,
    })),

    // Styles
    fillStyle: '#000000',
    strokeStyle: '#000000',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',

    // Line styles
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    lineDashOffset: 0,
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),

    // Text styles
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'ltr',

    // Shadows
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,

    // Image drawing
    drawImage: vi.fn(),

    // Pixel manipulation
    createImageData: vi.fn((width, height) => ({
      data: new Uint8ClampedArray((width || 1) * (height || 1) * 4),
      width: width || 1,
      height: height || 1,
    })),
    getImageData: vi.fn((x, y, width, height) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    })),
    putImageData: vi.fn(),

    // Gradients and patterns
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createConicGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createPattern: vi.fn(() => ({
      setTransform: vi.fn(),
    })),

    // Canvas reference (set by setupCanvasMocking)
    canvas: null,
  };

  return mockContext;
}

/**
 * Setup Canvas element mocking with enhanced properties
 * @param {Object} options - Configuration options (width, height, contextType)
 * @returns {Object} { mockContext, canvasMethods }
 */
export function setupCanvasMocking(options = {}) {
  const { width = 800, height = 600, contextType = '2d' } = options;

  const mockContext = createCanvas2DMock();

  const canvasMethods = {
    getContext: vi.fn(type => {
      if (type === '2d' || type === contextType) {
        mockContext.canvas = canvasMethods;
        return mockContext;
      }
      return null;
    }),

    toDataURL: vi.fn(type => {
      const mimeType = type || 'image/png';
      return `data:${mimeType};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
    }),

    toBlob: vi.fn((callback, type) => {
      const blob = new Blob(['fake-canvas-data'], { type: type || 'image/png' });
      if (callback) {
        setTimeout(() => callback(blob), 0);
      }
      return blob;
    }),

    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0,
    })),

    // Event handling
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),

    // Canvas properties
    width,
    height,
    clientWidth: width,
    clientHeight: height,
    offsetWidth: width,
    offsetHeight: height,
  };

  // Mock HTMLCanvasElement prototype methods
  Object.keys(canvasMethods).forEach(method => {
    if (typeof canvasMethods[method] === 'function') {
      vi.spyOn(HTMLCanvasElement.prototype, method).mockImplementation(canvasMethods[method]);
    }
  });

  // Mock canvas dimension properties
  Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
    get: vi.fn(() => width),
    set: vi.fn(),
    configurable: true,
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
    get: vi.fn(() => height),
    set: vi.fn(),
    configurable: true,
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
    get: vi.fn(() => width),
    configurable: true,
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
    get: vi.fn(() => height),
    configurable: true,
  });

  return { mockContext, canvasMethods };
}

/**
 * Reset all canvas mocks to initial state
 */
export function resetCanvasMocks() {
  Object.getOwnPropertyNames(HTMLCanvasElement.prototype).forEach(prop => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, prop);
    if (descriptor && typeof descriptor.value === 'function' && descriptor.value._isMockFunction) {
      descriptor.value.mockClear();
    }
  });
}

/**
 * Create a game-specific canvas mock with extra helper spies
 * @param {string} gameType - Type of game (e.g., 'ecosystem', 'bubble-pop')
 * @returns {Object} Mocked 2D context with game-specific additions
 */
export function createGameCanvasMock(gameType) {
  const baseMock = createCanvas2DMock();

  switch (gameType) {
    case 'ecosystem':
      baseMock.drawSpecies = vi.fn();
      baseMock.drawGrid = vi.fn();
      baseMock.drawConnections = vi.fn();
      break;

    case 'bubble-pop':
      baseMock.drawBubble = vi.fn();
      baseMock.drawExplosion = vi.fn();
      baseMock.drawParticles = vi.fn();
      break;

    case 'word-scramble':
      baseMock.drawLetterTile = vi.fn();
      baseMock.drawWordSlot = vi.fn();
      break;
  }

  return baseMock;
}

export default {
  createCanvas2DMock,
  setupCanvasMocking,
  resetCanvasMocks,
  createGameCanvasMock,
};
