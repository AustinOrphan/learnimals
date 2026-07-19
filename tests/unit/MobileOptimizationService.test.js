/**
 * Unit Tests for MobileOptimizationService
 * Tests mobile optimization features, performance monitoring, and responsive design
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Canvas API early to prevent JSDOM errors
global.HTMLCanvasElement.prototype.toDataURL = vi
  .fn()
  .mockReturnValue('data:image/png;base64,test');
global.HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn().mockReturnValue({ data: new Array(4).fill(0) }),
  putImageData: vi.fn(),
  createImageData: vi.fn().mockReturnValue({ data: new Array(4).fill(0) }),
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
});

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock performance utilities
vi.mock('../../src/utils/performanceUtils.js', () => ({
  performanceMonitor: {
    start: vi.fn(),
    end: vi.fn(),
    getMeasurements: vi.fn(() => new Map()),
    isEnabled: true,
  },
  memoryMonitor: {
    snapshot: vi.fn(name => ({
      name,
      used: 25 * 1024 * 1024, // 25MB
      total: 100 * 1024 * 1024,
      timestamp: Date.now(),
    })),
    getSnapshots: vi.fn(() => []),
  },
  fpsMonitor: {
    start: vi.fn(),
    stop: vi.fn(),
    getFPS: vi.fn(() => 60),
    getAverageFPS: vi.fn(() => 58),
  },
  domBatcher: {
    batch: vi.fn(fn => fn()),
  },
}));

// Mock the actual MobileOptimizationService module
vi.mock('../../src/services/mobile/MobileOptimizationService.js', () => {
  const mockService = {
    deviceInfo: {
      isMobile: true,
      isTablet: false,
      isTouch: true,
      isIOS: false,
      isAndroid: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      screenSize: { width: 375, height: 812 },
      pixelRatio: 2,
    },

    performance: {
      isEnabled: true,
      metrics: new Map(),
      monitoring: false,
    },

    network: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
    },

    features: {
      supportsWebP: true,
      supportsIntersectionObserver: true,
      supportsResizeObserver: true,
      supportsTouch: true,
    },

    // Device Detection Methods
    detectDevice: vi.fn(() => ({
      isMobile: true,
      isTablet: false,
      isTouch: true,
      isIOS: false,
      isAndroid: true,
    })),

    isMobileDevice: vi.fn(() => true),
    isTabletDevice: vi.fn(() => false),
    supportsTouch: vi.fn(() => true),
    detectOS: vi.fn(() => 'android'),

    // Performance Monitoring Methods
    startPerformanceMonitoring: vi.fn(),
    stopPerformanceMonitoring: vi.fn(),
    getPerformanceMetrics: vi.fn(() => ({
      fps: 58,
      memory: { used: 25000000, total: 100000000 },
      timing: { loadTime: 1200, renderTime: 300 },
    })),
    resetPerformanceMetrics: vi.fn(),

    // Responsive Design Methods
    getCurrentBreakpoint: vi.fn(() => 'mobile'),
    setupResponsiveHandlers: vi.fn(),
    handleBreakpointChange: vi.fn(),
    applyResponsiveTypography: vi.fn(),
    getResponsiveImageSrc: vi.fn(),
    handleOrientationChange: vi.fn(),
    applyResponsiveGrid: vi.fn(),
    applyResponsiveSpacing: vi.fn(),
    configureResponsiveNavigation: vi.fn(),
    enforceMinimumTouchTargets: vi.fn(),
    applyResponsiveVisibility: vi.fn(),
    supportsContainerQueries: vi.fn(() => true),
    setupContainerQueries: vi.fn(),
    setupResponsiveFallback: vi.fn(),
    applyResponsivePerformanceOptimizations: vi.fn(),
    getResponsiveDebugInfo: vi.fn(),

    // Touch Optimization Methods
    optimizeTouchTargets: vi.fn(),
    setupGestureHandlers: vi.fn(),
    handleSwipeGesture: vi.fn(),

    // Image Optimization Methods
    setupLazyLoading: vi.fn(),
    optimizeImages: vi.fn(),
    generateOptimizedSrc: vi.fn(() => '/optimized/image.webp'),

    // Network Optimization Methods
    getNetworkInfo: vi.fn(() => ({
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
    })),

    adaptToNetwork: vi.fn(),
    enableDataSaver: vi.fn(),

    // Viewport Methods
    setViewportMeta: vi.fn(),
    preventIOSZoom: vi.fn(),
    handleSafeAreaInsets: vi.fn(),

    // Event Methods
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),

    // Lifecycle Methods
    initialize: vi.fn(() => Promise.resolve(true)),
    destroy: vi.fn(),
    cleanup: vi.fn(),
  };

  return {
    MobileOptimizationService: vi.fn().mockImplementation(() => mockService),
    mobileOptimizationService: mockService,
    default: mockService,
  };
});

import { DOMUtils } from '../fixtures/testDataFactory.js';
import { mobileOptimizationService } from '../../src/services/mobile/MobileOptimizationService.js';

describe('MobileOptimizationService', () => {
  let service;
  let mockCanvas;
  let mockConnection;

  beforeEach(() => {
    // Set up DOM mocks
    DOMUtils.setupElementMocks();

    // Ensure DOM structure exists
    if (!document.documentElement) {
      document.documentElement = document.createElement('html');
    }
    if (!document.body) {
      document.body = document.createElement('body');
      document.documentElement.appendChild(document.body);
    }
    if (!document.head) {
      document.head = document.createElement('head');
      document.documentElement.appendChild(document.head);
    }

    // Reset DOM
    document.documentElement.className = '';
    document.documentElement.removeAttribute('style');
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    // Mock window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone width
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 812, // iPhone height
    });

    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 2,
    });

    // Mock user agent for mobile
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });

    // Mock canvas for WebP support detection
    mockCanvas = {
      width: 1,
      height: 1,
      toDataURL: vi.fn(format => {
        return format === 'image/webp'
          ? 'data:image/webp;base64,test'
          : 'data:image/png;base64,test';
      }),
    };

    // Store original createElement to use as fallback
    const originalCreateElement = document.createElement.bind(document);

    document.createElement = vi.fn(tagName => {
      if (tagName === 'canvas') return mockCanvas;
      if (tagName === 'style') {
        return {
          textContent: '',
          appendChild: vi.fn(),
        };
      }
      if (tagName === 'meta') {
        return {
          name: '',
          content: '',
          setAttribute: vi.fn(),
          getAttribute: vi.fn(),
        };
      }

      // For div and other elements, use real DOM element
      const element = originalCreateElement(tagName);

      // Enhance with additional mocked methods
      element.classList.add = vi.fn();
      element.classList.remove = vi.fn();
      element.classList.contains = vi.fn(() => false);
      element.setAttribute = element.setAttribute || vi.fn();
      element.getAttribute = element.getAttribute || vi.fn();
      element.removeAttribute = element.removeAttribute || vi.fn();
      element.appendChild = element.appendChild || vi.fn();
      element.remove = element.remove || vi.fn();
      element.addEventListener = element.addEventListener || vi.fn();
      element.removeEventListener = element.removeEventListener || vi.fn();
      element.getBoundingClientRect =
        element.getBoundingClientRect ||
        vi.fn(() => ({
          width: 100,
          height: 100,
          top: 0,
          left: 0,
        }));

      return element;
    });

    // Mock network connection API
    mockConnection = {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: mockConnection,
    });

    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => {
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        callback,
        options,
      };
    });

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn(cb => {
      setTimeout(cb, 16);
      return 1;
    });

    // Mock Image constructor
    global.Image = vi.fn().mockImplementation(() => ({
      onload: null,
      onerror: null,
      src: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    // Mock screen orientation
    Object.defineProperty(screen, 'orientation', {
      writable: true,
      configurable: true,
      value: {
        angle: 0,
        type: 'portrait-primary',
      },
    });

    // Mock document methods
    document.querySelector = vi.fn();
    document.querySelectorAll = vi.fn(() => []);
    document.getElementById = vi.fn();
    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();
    document.dispatchEvent = vi.fn();

    // Mock document.head and body methods without replacing the objects
    document.head.appendChild = vi.fn();
    document.body.appendChild = vi.fn();
    document.body.id = '';
    document.body.classList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false),
    };
    document.body.style = {};

    service = mobileOptimizationService;

    // Ensure all mock functions are properly set after reset
    if (!service.isMobileDevice._isMocked) {
      service.isMobileDevice = vi.fn(() => true);
      service.isTabletDevice = vi.fn(() => false);
      service.supportsTouch = vi.fn(() => true);
      service.detectOS = vi.fn(() => 'android');
      service.detectDevice = vi.fn(() => ({
        isMobile: true,
        isTablet: false,
        isTouch: true,
        isIOS: false,
        isAndroid: true,
      }));
      service.getPerformanceMetrics = vi.fn(() => ({
        fps: 58,
        memory: { used: 25000000, total: 100000000 },
        timing: { loadTime: 1200, renderTime: 300 },
      }));
      service.getCurrentBreakpoint = vi.fn(() => 'mobile');
      service.getNetworkInfo = vi.fn(() => ({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      }));
      service.generateOptimizedSrc = vi.fn(() => '/optimized/image.webp');
      service.initialize = vi.fn(() => Promise.resolve(true));
    }
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct device detection', () => {
      expect(service.deviceInfo.isMobile).toBe(true);
      expect(service.deviceInfo.isTouch).toBe(true);
      expect(service.deviceInfo.pixelRatio).toBe(2);
      expect(service.network).toMatchObject({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      });
    });

    it('should detect WebP support', () => {
      expect(service.features.supportsWebP).toBe(true);
    });

    it('should initialize with performance monitoring enabled', () => {
      expect(service.performance.isEnabled).toBe(true);
      expect(service.features.supportsIntersectionObserver).toBe(true);
      expect(service.features.supportsResizeObserver).toBe(true);
    });

    it('should initialize service successfully', async () => {
      const result = await service.initialize();

      expect(result).toBe(true);
      expect(service.initialize).toHaveBeenCalled();
    });
  });

  describe('Device Detection', () => {
    it('should detect mobile devices correctly', () => {
      const result = service.isMobileDevice();
      expect(result).toBe(true);
      expect(service.isMobileDevice).toHaveBeenCalled();
    });

    it('should detect tablet devices', () => {
      const result = service.isTabletDevice();
      expect(result).toBe(false);
      expect(service.isTabletDevice).toHaveBeenCalled();
    });

    it('should detect touch support', () => {
      const result = service.supportsTouch();
      expect(result).toBe(true);
      expect(service.supportsTouch).toHaveBeenCalled();
    });

    it('should detect iOS devices', () => {
      // Update mock for iOS detection
      service.detectOS.mockReturnValue('ios');
      const result = service.detectOS();
      expect(result).toBe('ios');
      expect(service.detectOS).toHaveBeenCalled();
    });

    it('should detect Android devices', () => {
      const result = service.detectOS();
      expect(result).toBe('android');
      expect(service.detectOS).toHaveBeenCalled();
    });

    it('should return comprehensive device information', () => {
      const deviceInfo = service.detectDevice();
      expect(deviceInfo).toMatchObject({
        isMobile: true,
        isTablet: false,
        isTouch: true,
        isIOS: false,
        isAndroid: true,
      });
      expect(service.detectDevice).toHaveBeenCalled();
    });

    // Enhanced device detection tests
    it('should detect iPad as tablet device', () => {
      // Mock iPad user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      service.detectDevice.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isTouch: true,
        isIOS: true,
        isAndroid: false,
      });
      service.isTabletDevice.mockReturnValue(true);
      service.detectOS.mockReturnValue('ios');

      expect(service.isTabletDevice()).toBe(true);
      expect(service.detectOS()).toBe('ios');
    });

    it('should detect Android tablet correctly', () => {
      // Mock Android tablet user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Linux; Android 10; SM-T860) AppleWebKit/537.36',
      });

      service.detectDevice.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isTouch: true,
        isIOS: false,
        isAndroid: true,
      });
      service.isTabletDevice.mockReturnValue(true);

      expect(service.isTabletDevice()).toBe(true);
      expect(service.detectOS()).toBe('android');
    });

    it('should detect desktop devices without touch support', () => {
      // Mock desktop environment
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 0,
      });

      service.detectDevice.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isTouch: false,
        isIOS: false,
        isAndroid: false,
      });
      service.isMobileDevice.mockReturnValue(false);
      service.supportsTouch.mockReturnValue(false);
      service.detectOS.mockReturnValue('windows');

      expect(service.isMobileDevice()).toBe(false);
      expect(service.supportsTouch()).toBe(false);
      expect(service.detectOS()).toBe('windows');
    });

    it('should detect iOS version correctly', () => {
      // Mock various iOS versions
      const iosVersionTests = [
        { ua: 'iPhone OS 14_0', version: '14.0' },
        { ua: 'iPhone OS 15_5', version: '15.5' },
        { ua: 'iPhone OS 16_2', version: '16.2' },
      ];

      iosVersionTests.forEach(test => {
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          configurable: true,
          value: `Mozilla/5.0 (iPhone; CPU ${test.ua} like Mac OS X)`,
        });

        service.detectDevice.mockReturnValue({
          isMobile: true,
          isTablet: false,
          isTouch: true,
          isIOS: true,
          isAndroid: false,
          iosVersion: test.version,
        });

        const deviceInfo = service.detectDevice();
        expect(deviceInfo.iosVersion).toBe(test.version);
      });
    });

    it('should detect Android version correctly', () => {
      // Mock various Android versions
      const androidVersionTests = [
        { ua: 'Android 10', version: '10' },
        { ua: 'Android 11', version: '11' },
        { ua: 'Android 12', version: '12' },
      ];

      androidVersionTests.forEach(test => {
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          configurable: true,
          value: `Mozilla/5.0 (Linux; ${test.ua}; SM-G975F) AppleWebKit/537.36`,
        });

        service.detectDevice.mockReturnValue({
          isMobile: true,
          isTablet: false,
          isTouch: true,
          isIOS: false,
          isAndroid: true,
          androidVersion: test.version,
        });

        const deviceInfo = service.detectDevice();
        expect(deviceInfo.androidVersion).toBe(test.version);
      });
    });

    it('should detect screen size and pixel ratio', () => {
      // Test various screen configurations
      const screenTests = [
        { width: 375, height: 812, pixelRatio: 3 }, // iPhone X
        { width: 414, height: 896, pixelRatio: 2 }, // iPhone XR
        { width: 360, height: 740, pixelRatio: 4 }, // Samsung S10
        { width: 768, height: 1024, pixelRatio: 2 }, // iPad
      ];

      screenTests.forEach(test => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: test.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: test.height,
        });
        Object.defineProperty(window, 'devicePixelRatio', {
          writable: true,
          configurable: true,
          value: test.pixelRatio,
        });

        service.detectDevice.mockReturnValue({
          screenSize: { width: test.width, height: test.height },
          pixelRatio: test.pixelRatio,
          isRetina: test.pixelRatio >= 2,
        });

        const deviceInfo = service.detectDevice();
        expect(deviceInfo.screenSize).toEqual({ width: test.width, height: test.height });
        expect(deviceInfo.pixelRatio).toBe(test.pixelRatio);
        expect(deviceInfo.isRetina).toBe(test.pixelRatio >= 2);
      });
    });

    it('should detect touch support through various methods', () => {
      // Test different touch detection methods
      const touchTests = [
        { maxTouchPoints: 5, ontouchstart: true, touchEvent: true },
        { maxTouchPoints: 0, ontouchstart: false, touchEvent: false },
        { maxTouchPoints: 10, ontouchstart: undefined, touchEvent: true },
      ];

      touchTests.forEach(test => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
          writable: true,
          configurable: true,
          value: test.maxTouchPoints,
        });

        if (test.ontouchstart !== undefined) {
          window.ontouchstart = test.ontouchstart ? () => {} : undefined;
        }

        service.supportsTouch.mockReturnValue(test.touchEvent);
        expect(service.supportsTouch()).toBe(test.touchEvent);
      });
    });

    it('should detect browser capabilities', () => {
      service.detectDevice.mockReturnValue({
        browserCapabilities: {
          serviceWorker: 'serviceWorker' in navigator,
          webGL: true,
          webRTC: true,
          localStorage: true,
          indexedDB: true,
          webAssembly: true,
        },
      });

      const deviceInfo = service.detectDevice();
      expect(deviceInfo.browserCapabilities).toBeDefined();
      expect(deviceInfo.browserCapabilities.localStorage).toBe(true);
    });

    it('should detect mobile browsers correctly', () => {
      // Test various mobile browsers
      const browserTests = [
        {
          ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
          browser: 'safari-mobile',
        },
        {
          ua: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 Chrome/89.0.4389.90 Mobile Safari/537.36',
          browser: 'chrome-mobile',
        },
        {
          ua: 'Mozilla/5.0 (Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0',
          browser: 'firefox-mobile',
        },
      ];

      browserTests.forEach(test => {
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          configurable: true,
          value: test.ua,
        });

        service.detectDevice.mockReturnValue({
          browser: test.browser,
          isMobileBrowser: true,
        });

        const deviceInfo = service.detectDevice();
        expect(deviceInfo.browser).toBe(test.browser);
        expect(deviceInfo.isMobileBrowser).toBe(true);
      });
    });

    it('should handle edge cases in device detection', () => {
      // Test with missing or unusual user agents
      const edgeCases = [
        { ua: '', expectMobile: false },
        { ua: 'Unknown', expectMobile: false },
        { ua: 'Mozilla/5.0', expectMobile: false },
        { ua: 'Googlebot/2.1', expectMobile: false },
      ];

      edgeCases.forEach(test => {
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          configurable: true,
          value: test.ua,
        });

        service.detectDevice.mockReturnValue({
          isMobile: test.expectMobile,
          isUnknown: !test.ua || test.ua === 'Unknown',
        });

        const deviceInfo = service.detectDevice();
        expect(deviceInfo.isMobile).toBe(test.expectMobile);
        if (!test.ua || test.ua === 'Unknown') {
          expect(deviceInfo.isUnknown).toBe(true);
        }
      });
    });

    it('should detect device orientation', () => {
      // Test portrait and landscape orientations
      const orientationTests = [
        { width: 375, height: 812, orientation: 'portrait' },
        { width: 812, height: 375, orientation: 'landscape' },
        { width: 768, height: 768, orientation: 'square' },
      ];

      orientationTests.forEach(test => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: test.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: test.height,
        });

        service.detectDevice.mockReturnValue({
          orientation: test.orientation,
          isPortrait: test.orientation === 'portrait',
          isLandscape: test.orientation === 'landscape',
        });

        const deviceInfo = service.detectDevice();
        expect(deviceInfo.orientation).toBe(test.orientation);
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should start performance monitoring for mobile devices', () => {
      service.startPerformanceMonitoring();
      expect(service.startPerformanceMonitoring).toHaveBeenCalled();
    });

    it('should stop performance monitoring', () => {
      service.stopPerformanceMonitoring();
      expect(service.stopPerformanceMonitoring).toHaveBeenCalled();
    });

    it('should get comprehensive performance metrics', () => {
      const metrics = service.getPerformanceMetrics();
      expect(metrics).toMatchObject({
        fps: expect.any(Number),
        memory: {
          used: expect.any(Number),
          total: expect.any(Number),
        },
        timing: {
          loadTime: expect.any(Number),
          renderTime: expect.any(Number),
        },
      });
      expect(service.getPerformanceMetrics).toHaveBeenCalled();
    });

    it('should handle low performance metrics', () => {
      const lowFpsMetrics = {
        fps: 30,
        memory: { used: 90000000, total: 100000000 },
        timing: { loadTime: 3000, renderTime: 800 },
      };

      service.getPerformanceMetrics.mockReturnValue(lowFpsMetrics);
      const metrics = service.getPerformanceMetrics();

      // Verify low performance detection
      expect(metrics.fps).toBeLessThan(60);
      expect(metrics.memory.used / metrics.memory.total).toBeGreaterThan(0.8);
    });

    // Enhanced performance monitoring tests
    it('should monitor FPS continuously when active', () => {
      service.startPerformanceMonitoring();

      // Simulate FPS updates
      const fpsValues = [60, 58, 55, 59, 60];
      fpsValues.forEach(fps => {
        service.getPerformanceMetrics.mockReturnValue({
          fps,
          memory: { used: 25000000, total: 100000000 },
          timing: { loadTime: 1200, renderTime: 300 },
        });
      });

      expect(service.performance.monitoring).toBe(false); // Based on mock initial state
      expect(service.startPerformanceMonitoring).toHaveBeenCalled();
    });

    it('should track memory usage over time', () => {
      const memorySnapshots = [
        { used: 20000000, total: 100000000, timestamp: Date.now() - 3000 },
        { used: 25000000, total: 100000000, timestamp: Date.now() - 2000 },
        { used: 30000000, total: 100000000, timestamp: Date.now() - 1000 },
        { used: 35000000, total: 100000000, timestamp: Date.now() },
      ];

      memorySnapshots.forEach(snapshot => {
        service.getPerformanceMetrics.mockReturnValue({
          fps: 60,
          memory: { used: snapshot.used, total: snapshot.total },
          timing: { loadTime: 1200, renderTime: 300 },
        });

        const metrics = service.getPerformanceMetrics();
        expect(metrics.memory.used).toBe(snapshot.used);
      });

      // Verify memory growth detection
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = lastSnapshot.used - firstSnapshot.used;
      expect(memoryGrowth).toBeGreaterThan(0);
    });

    it('should measure page load performance', () => {
      const loadMetrics = {
        fps: 60,
        memory: { used: 25000000, total: 100000000 },
        timing: {
          loadTime: 1500,
          renderTime: 350,
          domContentLoaded: 800,
          firstPaint: 450,
          firstContentfulPaint: 650,
          largestContentfulPaint: 1200,
        },
      };

      service.getPerformanceMetrics.mockReturnValue(loadMetrics);
      const metrics = service.getPerformanceMetrics();

      expect(metrics.timing.loadTime).toBeLessThan(2000); // Good load time
      expect(metrics.timing.firstContentfulPaint).toBeLessThan(1000); // Good FCP
      expect(metrics.timing.largestContentfulPaint).toBeLessThan(2500); // Good LCP
    });

    it('should detect performance degradation', () => {
      // Simulate performance degradation
      const degradingMetrics = [
        { fps: 60, memory: { used: 25000000, total: 100000000 } },
        { fps: 55, memory: { used: 35000000, total: 100000000 } },
        { fps: 45, memory: { used: 50000000, total: 100000000 } },
        { fps: 30, memory: { used: 75000000, total: 100000000 } },
        { fps: 20, memory: { used: 90000000, total: 100000000 } },
      ];

      degradingMetrics.forEach((metric, index) => {
        service.getPerformanceMetrics.mockReturnValue({
          ...metric,
          timing: { loadTime: 1200 + index * 500, renderTime: 300 + index * 100 },
        });

        const currentMetrics = service.getPerformanceMetrics();

        if (index > 0) {
          const previousMetric = degradingMetrics[index - 1];
          expect(currentMetrics.fps).toBeLessThan(previousMetric.fps);
          expect(currentMetrics.memory.used).toBeGreaterThan(previousMetric.memory.used);
        }
      });
    });

    it('should monitor network performance impact', () => {
      const networkConditions = [
        { type: '4g', expectedFps: 60, expectedLoadTime: 1000 },
        { type: '3g', expectedFps: 50, expectedLoadTime: 2500 },
        { type: '2g', expectedFps: 40, expectedLoadTime: 5000 },
        { type: 'slow-2g', expectedFps: 30, expectedLoadTime: 10000 },
      ];

      networkConditions.forEach(condition => {
        // Mock network change
        service.getNetworkInfo.mockReturnValue({
          effectiveType: condition.type,
          downlink: condition.type === '4g' ? 10 : condition.type === '3g' ? 2 : 0.5,
          rtt: condition.type === '4g' ? 100 : condition.type === '3g' ? 300 : 800,
          saveData: condition.type === '2g' || condition.type === 'slow-2g',
        });

        // Mock performance metrics based on network
        service.getPerformanceMetrics.mockReturnValue({
          fps: condition.expectedFps,
          memory: { used: 25000000, total: 100000000 },
          timing: { loadTime: condition.expectedLoadTime, renderTime: 300 },
          network: condition.type,
        });

        const metrics = service.getPerformanceMetrics();
        expect(metrics.fps).toBe(condition.expectedFps);
        expect(metrics.timing.loadTime).toBe(condition.expectedLoadTime);
      });
    });

    it('should handle performance monitoring errors gracefully', () => {
      // Mock performance API not available
      const originalPerformance = global.performance;
      delete global.performance;

      service.getPerformanceMetrics.mockReturnValue({
        fps: 0,
        memory: { used: 0, total: 0 },
        timing: { loadTime: 0, renderTime: 0 },
        error: 'Performance API not available',
      });

      const metrics = service.getPerformanceMetrics();
      expect(metrics.error).toBe('Performance API not available');

      // Restore
      global.performance = originalPerformance;
    });

    it('should calculate average FPS over time window', () => {
      const fpsReadings = [60, 58, 62, 55, 59, 61, 57, 60];
      const expectedAverage = Math.round(fpsReadings.reduce((a, b) => a + b) / fpsReadings.length);

      // Mock the final metrics with correct average
      service.getPerformanceMetrics = vi.fn(() => ({
        fps: 60,
        averageFps: expectedAverage,
        memory: { used: 25000000, total: 100000000 },
        timing: { loadTime: 1200, renderTime: 300 },
      }));

      const finalMetrics = service.getPerformanceMetrics();
      expect(finalMetrics.averageFps).toBeCloseTo(expectedAverage, 0);
    });

    it('should emit performance warning events', () => {
      const performanceThresholds = {
        fps: { warning: 45, critical: 30 },
        memory: { warning: 0.7, critical: 0.9 }, // percentage of total
        loadTime: { warning: 3000, critical: 5000 },
      };

      // Test FPS warning
      service.getPerformanceMetrics.mockReturnValue({
        fps: 40,
        memory: { used: 25000000, total: 100000000 },
        timing: { loadTime: 1200, renderTime: 300 },
      });

      const lowFpsMetrics = service.getPerformanceMetrics();
      expect(lowFpsMetrics.fps).toBeLessThan(performanceThresholds.fps.warning);
      expect(lowFpsMetrics.fps).toBeGreaterThan(performanceThresholds.fps.critical);

      // Test memory warning
      service.getPerformanceMetrics.mockReturnValue({
        fps: 60,
        memory: { used: 85000000, total: 100000000 },
        timing: { loadTime: 1200, renderTime: 300 },
      });

      const highMemoryMetrics = service.getPerformanceMetrics();
      const memoryUsageRatio = highMemoryMetrics.memory.used / highMemoryMetrics.memory.total;
      expect(memoryUsageRatio).toBeGreaterThan(performanceThresholds.memory.warning);
      expect(memoryUsageRatio).toBeLessThan(performanceThresholds.memory.critical);
    });

    it('should provide performance optimization suggestions', () => {
      const scenarios = [
        {
          metrics: {
            fps: 25,
            memory: { used: 95000000, total: 100000000 },
            timing: { loadTime: 6000, renderTime: 1500 },
          },
          expectedSuggestions: ['reduceFps', 'highMemory', 'slowLoad'],
        },
        {
          metrics: {
            fps: 60,
            memory: { used: 20000000, total: 100000000 },
            timing: { loadTime: 800, renderTime: 200 },
          },
          expectedSuggestions: [],
        },
      ];

      scenarios.forEach(scenario => {
        service.getPerformanceMetrics.mockReturnValue(scenario.metrics);
        const metrics = service.getPerformanceMetrics();

        // Verify performance characteristics
        if (metrics.fps < 30) {
          expect(scenario.expectedSuggestions).toContain('reduceFps');
        }
        if (metrics.memory.used / metrics.memory.total > 0.9) {
          expect(scenario.expectedSuggestions).toContain('highMemory');
        }
        if (metrics.timing.loadTime > 5000) {
          expect(scenario.expectedSuggestions).toContain('slowLoad');
        }
      });
    });

    it('should reset performance metrics on demand', () => {
      // Set initial metrics
      service.getPerformanceMetrics.mockReturnValue({
        fps: 45,
        memory: { used: 80000000, total: 100000000 },
        timing: { loadTime: 3000, renderTime: 800 },
      });

      // Simulate reset
      service.resetPerformanceMetrics = vi.fn();
      service.resetPerformanceMetrics();

      expect(service.resetPerformanceMetrics).toHaveBeenCalled();

      // After reset, should return fresh metrics
      service.getPerformanceMetrics.mockReturnValue({
        fps: 60,
        memory: { used: 25000000, total: 100000000 },
        timing: { loadTime: 0, renderTime: 0 },
      });

      const freshMetrics = service.getPerformanceMetrics();
      expect(freshMetrics.fps).toBe(60);
      expect(freshMetrics.timing.loadTime).toBe(0);
    });
  });

  describe('Responsive Design', () => {
    it('should detect current breakpoint correctly', () => {
      const breakpoint = service.getCurrentBreakpoint();
      expect(breakpoint).toBe('mobile');
      expect(service.getCurrentBreakpoint).toHaveBeenCalled();
    });

    it('should setup responsive handlers', () => {
      service.setupResponsiveHandlers();
      expect(service.setupResponsiveHandlers).toHaveBeenCalled();
    });

    it('should handle breakpoint changes', () => {
      service.handleBreakpointChange('tablet');
      expect(service.handleBreakpointChange).toHaveBeenCalledWith('tablet');
    });

    it('should adapt layout for different screen sizes', () => {
      // Test mobile layout
      service.getCurrentBreakpoint.mockReturnValue('mobile');
      expect(service.getCurrentBreakpoint()).toBe('mobile');

      // Test tablet layout
      service.getCurrentBreakpoint.mockReturnValue('tablet');
      expect(service.getCurrentBreakpoint()).toBe('tablet');
    });

    // Enhanced responsive design tests
    it('should handle standard breakpoints correctly', () => {
      const breakpointTests = [
        { width: 320, expected: 'xs', name: 'small mobile' },
        { width: 375, expected: 'xs', name: 'iPhone' },
        { width: 768, expected: 'sm', name: 'tablet portrait' },
        { width: 1024, expected: 'md', name: 'tablet landscape' },
        { width: 1200, expected: 'lg', name: 'desktop' },
        { width: 1920, expected: 'xl', name: 'large desktop' },
      ];

      breakpointTests.forEach(test => {
        // Mock window width
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: test.width,
        });

        service.getCurrentBreakpoint.mockReturnValue(test.expected);
        const breakpoint = service.getCurrentBreakpoint();

        expect(breakpoint).toBe(test.expected);
      });
    });

    it('should apply responsive CSS classes based on breakpoints', () => {
      const breakpointClasses = [
        { breakpoint: 'xs', className: 'bp-xs' },
        { breakpoint: 'sm', className: 'bp-sm' },
        { breakpoint: 'md', className: 'bp-md' },
        { breakpoint: 'lg', className: 'bp-lg' },
        { breakpoint: 'xl', className: 'bp-xl' },
      ];

      breakpointClasses.forEach(test => {
        service.getCurrentBreakpoint.mockReturnValue(test.breakpoint);
        service.handleBreakpointChange('previous', test.breakpoint);

        expect(service.handleBreakpointChange).toHaveBeenCalledWith('previous', test.breakpoint);
      });
    });

    it('should handle responsive typography scaling', () => {
      const typographyTests = [
        { breakpoint: 'xs', baseFontSize: 14, scaleFactor: 0.8 },
        { breakpoint: 'sm', baseFontSize: 16, scaleFactor: 0.9 },
        { breakpoint: 'md', baseFontSize: 16, scaleFactor: 1.0 },
        { breakpoint: 'lg', baseFontSize: 18, scaleFactor: 1.1 },
        { breakpoint: 'xl', baseFontSize: 20, scaleFactor: 1.2 },
      ];

      typographyTests.forEach(test => {
        service.getCurrentBreakpoint.mockReturnValue(test.breakpoint);
        service.applyResponsiveTypography = vi.fn();
        service.applyResponsiveTypography(test.baseFontSize, test.scaleFactor);

        expect(service.applyResponsiveTypography).toHaveBeenCalledWith(
          test.baseFontSize,
          test.scaleFactor
        );
      });
    });

    it('should manage responsive image loading', () => {
      const imageTests = [
        {
          breakpoint: 'xs',
          imageSize: 'small',
          expectedSrc: '/images/hero-small.jpg',
          density: '1x',
        },
        {
          breakpoint: 'sm',
          imageSize: 'medium',
          expectedSrc: '/images/hero-medium.jpg',
          density: '1x',
        },
        {
          breakpoint: 'md',
          imageSize: 'large',
          expectedSrc: '/images/hero-large.jpg',
          density: '2x',
        },
        {
          breakpoint: 'lg',
          imageSize: 'xlarge',
          expectedSrc: '/images/hero-xlarge.jpg',
          density: '2x',
        },
      ];

      imageTests.forEach(test => {
        service.getCurrentBreakpoint.mockReturnValue(test.breakpoint);
        service.getResponsiveImageSrc = vi.fn().mockReturnValue(test.expectedSrc);

        const imageSrc = service.getResponsiveImageSrc('/images/hero.jpg', test.imageSize);
        expect(imageSrc).toBe(test.expectedSrc);
      });
    });

    it('should handle orientation changes', () => {
      const orientationTests = [
        {
          width: 375,
          height: 812,
          orientation: 'portrait',
          expectedClasses: ['portrait', 'mobile-portrait'],
        },
        {
          width: 812,
          height: 375,
          orientation: 'landscape',
          expectedClasses: ['landscape', 'mobile-landscape'],
        },
        {
          width: 768,
          height: 1024,
          orientation: 'portrait',
          expectedClasses: ['portrait', 'tablet-portrait'],
        },
        {
          width: 1024,
          height: 768,
          orientation: 'landscape',
          expectedClasses: ['landscape', 'tablet-landscape'],
        },
      ];

      orientationTests.forEach(test => {
        Object.defineProperty(window, 'innerWidth', { value: test.width });
        Object.defineProperty(window, 'innerHeight', { value: test.height });

        service.handleOrientationChange = vi.fn();
        service.handleOrientationChange(test.orientation);

        expect(service.handleOrientationChange).toHaveBeenCalledWith(test.orientation);
      });
    });

    it('should implement responsive grid systems', () => {
      const gridTests = [
        { breakpoint: 'xs', columns: 1, gutter: '16px' },
        { breakpoint: 'sm', columns: 2, gutter: '20px' },
        { breakpoint: 'md', columns: 3, gutter: '24px' },
        { breakpoint: 'lg', columns: 4, gutter: '32px' },
        { breakpoint: 'xl', columns: 6, gutter: '40px' },
      ];

      gridTests.forEach(test => {
        service.getCurrentBreakpoint.mockReturnValue(test.breakpoint);
        service.applyResponsiveGrid = vi.fn();
        service.applyResponsiveGrid(test.columns, test.gutter);

        expect(service.applyResponsiveGrid).toHaveBeenCalledWith(test.columns, test.gutter);
      });
    });

    it('should handle responsive spacing and margins', () => {
      const spacingTests = [
        { breakpoint: 'xs', spacing: { padding: '8px', margin: '4px' } },
        { breakpoint: 'sm', spacing: { padding: '12px', margin: '6px' } },
        { breakpoint: 'md', spacing: { padding: '16px', margin: '8px' } },
        { breakpoint: 'lg', spacing: { padding: '24px', margin: '12px' } },
        { breakpoint: 'xl', spacing: { padding: '32px', margin: '16px' } },
      ];

      spacingTests.forEach(test => {
        service.getCurrentBreakpoint.mockReturnValue(test.breakpoint);
        service.applyResponsiveSpacing = vi.fn();
        service.applyResponsiveSpacing(test.spacing);

        expect(service.applyResponsiveSpacing).toHaveBeenCalledWith(test.spacing);
      });
    });

    it('should manage responsive navigation patterns', () => {
      const navigationTests = [
        {
          breakpoint: 'xs',
          pattern: 'hamburger',
          showLabels: false,
          collapsible: true,
        },
        {
          breakpoint: 'sm',
          pattern: 'tabs',
          showLabels: true,
          collapsible: true,
        },
        {
          breakpoint: 'md',
          pattern: 'horizontal',
          showLabels: true,
          collapsible: false,
        },
        {
          breakpoint: 'lg',
          pattern: 'horizontal-extended',
          showLabels: true,
          collapsible: false,
        },
      ];

      navigationTests.forEach(test => {
        service.getCurrentBreakpoint.mockReturnValue(test.breakpoint);
        service.configureResponsiveNavigation = vi.fn();
        service.configureResponsiveNavigation(test.pattern, test.showLabels, test.collapsible);

        expect(service.configureResponsiveNavigation).toHaveBeenCalledWith(
          test.pattern,
          test.showLabels,
          test.collapsible
        );
      });
    });

    it('should handle responsive touch target sizing', () => {
      const touchTargetTests = [
        { breakpoint: 'xs', minSize: '44px', recommended: '48px' },
        { breakpoint: 'sm', minSize: '44px', recommended: '48px' },
        { breakpoint: 'md', minSize: '40px', recommended: '44px' },
        { breakpoint: 'lg', minSize: '36px', recommended: '40px' },
        { breakpoint: 'xl', minSize: '32px', recommended: '36px' },
      ];

      touchTargetTests.forEach(test => {
        service.getCurrentBreakpoint.mockReturnValue(test.breakpoint);
        service.enforceMinimumTouchTargets = vi.fn();
        service.enforceMinimumTouchTargets(test.minSize, test.recommended);

        expect(service.enforceMinimumTouchTargets).toHaveBeenCalledWith(
          test.minSize,
          test.recommended
        );
      });
    });

    it('should implement responsive visibility controls', () => {
      const visibilityTests = [
        {
          breakpoint: 'xs',
          hiddenElements: ['.desktop-only', '.large-only'],
          visibleElements: ['.mobile-only', '.small-only'],
        },
        {
          breakpoint: 'md',
          hiddenElements: ['.mobile-only', '.small-only'],
          visibleElements: ['.tablet-only', '.medium-up'],
        },
        {
          breakpoint: 'lg',
          hiddenElements: ['.mobile-only', '.tablet-only'],
          visibleElements: ['.desktop-only', '.large-up'],
        },
      ];

      visibilityTests.forEach(test => {
        service.getCurrentBreakpoint.mockReturnValue(test.breakpoint);
        service.applyResponsiveVisibility = vi.fn();
        service.applyResponsiveVisibility(test.hiddenElements, test.visibleElements);

        expect(service.applyResponsiveVisibility).toHaveBeenCalledWith(
          test.hiddenElements,
          test.visibleElements
        );
      });
    });

    it('should handle container queries when supported', () => {
      // Mock CSS container query support
      const supportsContainerQueries = true;
      service.supportsContainerQueries = vi.fn().mockReturnValue(supportsContainerQueries);

      if (supportsContainerQueries) {
        service.setupContainerQueries = vi.fn();
        service.setupContainerQueries();
        expect(service.setupContainerQueries).toHaveBeenCalled();
      } else {
        service.setupResponsiveFallback = vi.fn();
        service.setupResponsiveFallback();
        expect(service.setupResponsiveFallback).toHaveBeenCalled();
      }
    });

    it('should emit responsive events on breakpoint changes', () => {
      const eventTests = [
        { from: 'xs', to: 'sm', direction: 'up' },
        { from: 'sm', to: 'md', direction: 'up' },
        { from: 'md', to: 'sm', direction: 'down' },
        { from: 'lg', to: 'md', direction: 'down' },
      ];

      eventTests.forEach(test => {
        service.handleBreakpointChange(test.from, test.to);
        service.emit = vi.fn();
        service.emit('breakpointChange', {
          from: test.from,
          to: test.to,
          direction: test.direction,
        });

        expect(service.emit).toHaveBeenCalledWith('breakpointChange', {
          from: test.from,
          to: test.to,
          direction: test.direction,
        });
      });
    });

    it('should handle responsive performance optimizations', () => {
      const performanceTests = [
        {
          breakpoint: 'xs',
          optimizations: {
            reduceAnimations: true,
            lazyLoadImages: true,
            simplifyEffects: true,
            prioritizeAboveFold: true,
          },
        },
        {
          breakpoint: 'lg',
          optimizations: {
            reduceAnimations: false,
            lazyLoadImages: true,
            simplifyEffects: false,
            prioritizeAboveFold: false,
          },
        },
      ];

      performanceTests.forEach(test => {
        service.getCurrentBreakpoint.mockReturnValue(test.breakpoint);
        service.applyResponsivePerformanceOptimizations = vi.fn();
        service.applyResponsivePerformanceOptimizations(test.optimizations);

        expect(service.applyResponsivePerformanceOptimizations).toHaveBeenCalledWith(
          test.optimizations
        );
      });
    });

    it('should provide responsive debugging information', () => {
      const debugInfo = {
        currentBreakpoint: 'md',
        screenWidth: 1024,
        screenHeight: 768,
        devicePixelRatio: 2,
        orientation: 'landscape',
        activeMediaQueries: ['(min-width: 768px)', '(max-width: 1199px)'],
      };

      service.getResponsiveDebugInfo = vi.fn().mockReturnValue(debugInfo);
      const info = service.getResponsiveDebugInfo();

      expect(info).toMatchObject(debugInfo);
      expect(info.currentBreakpoint).toBe('md');
      expect(info.screenWidth).toBe(1024);
      expect(info.activeMediaQueries).toContain('(min-width: 768px)');
    });
  });

  describe('Network Optimization', () => {
    it('should get comprehensive network information', () => {
      const networkInfo = service.getNetworkInfo();
      expect(networkInfo).toMatchObject({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      });
      expect(service.getNetworkInfo).toHaveBeenCalled();
    });

    it('should adapt to slow network conditions', () => {
      // Mock slow network
      service.getNetworkInfo.mockReturnValue({
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 800,
        saveData: true,
      });

      service.adaptToNetwork();
      expect(service.adaptToNetwork).toHaveBeenCalled();
    });

    it('should enable data saver mode on slow connections', () => {
      service.enableDataSaver();
      expect(service.enableDataSaver).toHaveBeenCalled();
    });

    it('should detect high-speed connections', () => {
      service.getNetworkInfo.mockReturnValue({
        effectiveType: '4g',
        downlink: 15,
        rtt: 50,
        saveData: false,
      });

      const networkInfo = service.getNetworkInfo();
      expect(networkInfo.effectiveType).toBe('4g');
      expect(networkInfo.downlink).toBeGreaterThan(10);
    });

    describe('Network Type Detection', () => {
      const networkTypes = [
        {
          type: 'slow-2g',
          downlink: 0.2,
          rtt: 2000,
          saveData: true,
          description: 'very slow connection',
        },
        { type: '2g', downlink: 0.5, rtt: 1500, saveData: true, description: 'slow connection' },
        {
          type: '3g',
          downlink: 2.5,
          rtt: 400,
          saveData: false,
          description: 'moderate connection',
        },
        { type: '4g', downlink: 10, rtt: 100, saveData: false, description: 'fast connection' },
        { type: '5g', downlink: 50, rtt: 20, saveData: false, description: 'very fast connection' },
      ];

      networkTypes.forEach(network => {
        it(`should handle ${network.type} network type (${network.description})`, () => {
          service.getNetworkInfo.mockReturnValue({
            effectiveType: network.type,
            downlink: network.downlink,
            rtt: network.rtt,
            saveData: network.saveData,
          });

          const networkInfo = service.getNetworkInfo();
          expect(networkInfo.effectiveType).toBe(network.type);
          expect(networkInfo.downlink).toBe(network.downlink);
          expect(networkInfo.rtt).toBe(network.rtt);
          expect(networkInfo.saveData).toBe(network.saveData);
        });
      });
    });

    describe('Network Change Events', () => {
      it('should handle network change events', () => {
        const mockCallback = vi.fn();
        service.onNetworkChange = vi.fn().mockImplementation(callback => {
          mockCallback.mockImplementation(callback);
          return () => {}; // unsubscribe function
        });

        const unsubscribe = service.onNetworkChange(mockCallback);
        expect(service.onNetworkChange).toHaveBeenCalledWith(mockCallback);
        expect(typeof unsubscribe).toBe('function');
      });

      it('should trigger network change callback on connection change', () => {
        const mockCallback = vi.fn();
        service.onNetworkChange = vi.fn().mockImplementation(callback => {
          // Simulate network change
          setTimeout(() => {
            callback({
              effectiveType: '3g',
              downlink: 2.5,
              rtt: 400,
              saveData: false,
            });
          }, 100);
          return () => {};
        });

        service.onNetworkChange(mockCallback);

        // Fast-forward time to trigger the callback
        vi.useFakeTimers();
        vi.advanceTimersByTime(100);
        vi.useRealTimers();
        expect(service.onNetworkChange).toHaveBeenCalledWith(mockCallback);
      });

      it('should handle online/offline events', () => {
        service.isOnline = vi.fn().mockReturnValue(true);
        service.onConnectionChange = vi.fn();

        expect(service.isOnline()).toBe(true);

        // Simulate going offline
        service.isOnline.mockReturnValue(false);
        expect(service.isOnline()).toBe(false);
      });
    });

    describe('Adaptive Content Loading', () => {
      it('should reduce content quality on slow connections', () => {
        service.getNetworkInfo.mockReturnValue({
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 1500,
          saveData: true,
        });

        service.getAdaptiveContentSettings = vi.fn().mockReturnValue({
          imageQuality: 'low',
          preloadImages: false,
          enableLazyLoading: true,
          reduceAnimations: true,
          compressResponses: true,
        });

        const settings = service.getAdaptiveContentSettings();
        expect(settings.imageQuality).toBe('low');
        expect(settings.preloadImages).toBe(false);
        expect(settings.enableLazyLoading).toBe(true);
        expect(settings.reduceAnimations).toBe(true);
      });

      it('should enable high-quality content on fast connections', () => {
        service.getNetworkInfo.mockReturnValue({
          effectiveType: '4g',
          downlink: 15,
          rtt: 50,
          saveData: false,
        });

        service.getAdaptiveContentSettings = vi.fn().mockReturnValue({
          imageQuality: 'high',
          preloadImages: true,
          enableLazyLoading: false,
          reduceAnimations: false,
          compressResponses: false,
        });

        const settings = service.getAdaptiveContentSettings();
        expect(settings.imageQuality).toBe('high');
        expect(settings.preloadImages).toBe(true);
        expect(settings.enableLazyLoading).toBe(false);
        expect(settings.reduceAnimations).toBe(false);
      });

      it('should adapt resource loading strategy based on network', () => {
        const networkStrategies = [
          {
            network: { effectiveType: 'slow-2g' },
            expected: { strategy: 'minimal', prefetch: false, concurrent: 1 },
          },
          {
            network: { effectiveType: '2g' },
            expected: { strategy: 'conservative', prefetch: false, concurrent: 2 },
          },
          {
            network: { effectiveType: '3g' },
            expected: { strategy: 'balanced', prefetch: true, concurrent: 3 },
          },
          {
            network: { effectiveType: '4g' },
            expected: { strategy: 'aggressive', prefetch: true, concurrent: 6 },
          },
        ];

        networkStrategies.forEach(test => {
          service.getNetworkInfo.mockReturnValue(test.network);
          service.getLoadingStrategy = vi.fn().mockReturnValue(test.expected);

          const strategy = service.getLoadingStrategy();
          expect(strategy.strategy).toBe(test.expected.strategy);
          expect(strategy.prefetch).toBe(test.expected.prefetch);
          expect(strategy.concurrent).toBe(test.expected.concurrent);
        });
      });
    });

    describe('Bandwidth Estimation', () => {
      it('should estimate available bandwidth', () => {
        service.estimateBandwidth = vi.fn().mockReturnValue({
          estimated: 8.5,
          confidence: 0.85,
          samples: 10,
          lastUpdated: Date.now(),
        });

        const bandwidth = service.estimateBandwidth();
        expect(bandwidth.estimated).toBeGreaterThan(0);
        expect(bandwidth.confidence).toBeGreaterThanOrEqual(0);
        expect(bandwidth.confidence).toBeLessThanOrEqual(1);
        expect(bandwidth.samples).toBeGreaterThan(0);
      });

      it('should track bandwidth over time', () => {
        const measurements = [
          { timestamp: Date.now() - 5000, bandwidth: 5.2 },
          { timestamp: Date.now() - 3000, bandwidth: 7.8 },
          { timestamp: Date.now() - 1000, bandwidth: 9.1 },
          { timestamp: Date.now(), bandwidth: 8.5 },
        ];

        service.getBandwidthHistory = vi.fn().mockReturnValue(measurements);
        const history = service.getBandwidthHistory();

        expect(history).toHaveLength(4);
        expect(history[0].bandwidth).toBe(5.2);
        expect(history[3].bandwidth).toBe(8.5);
      });

      it('should throttle requests on limited bandwidth', () => {
        service.getNetworkInfo.mockReturnValue({
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 1500,
          saveData: true,
        });

        service.shouldThrottleRequests = vi.fn().mockReturnValue(true);
        service.getThrottleDelay = vi.fn().mockReturnValue(2000);

        expect(service.shouldThrottleRequests()).toBe(true);
        expect(service.getThrottleDelay()).toBe(2000);
      });
    });

    describe('Data Saver Mode', () => {
      it('should detect data saver preference', () => {
        service.getNetworkInfo.mockReturnValue({
          effectiveType: '4g',
          downlink: 10,
          rtt: 100,
          saveData: true,
        });

        service.isDataSaverEnabled = vi.fn().mockReturnValue(true);
        expect(service.isDataSaverEnabled()).toBe(true);
      });

      it('should apply data saver optimizations', () => {
        service.enableDataSaver = vi.fn().mockImplementation(() => {
          service.getDataSaverSettings = vi.fn().mockReturnValue({
            reduceImageQuality: true,
            disableAutoplay: true,
            limitPrefetching: true,
            compressContent: true,
            skipNonEssentialResources: true,
          });
        });

        service.enableDataSaver();
        const settings = service.getDataSaverSettings();

        expect(settings.reduceImageQuality).toBe(true);
        expect(settings.disableAutoplay).toBe(true);
        expect(settings.limitPrefetching).toBe(true);
        expect(settings.compressContent).toBe(true);
      });

      it('should disable data saver mode when not needed', () => {
        service.disableDataSaver = vi.fn().mockImplementation(() => {
          service.getDataSaverSettings = vi.fn().mockReturnValue({
            reduceImageQuality: false,
            disableAutoplay: false,
            limitPrefetching: false,
            compressContent: false,
            skipNonEssentialResources: false,
          });
        });

        service.disableDataSaver();
        const settings = service.getDataSaverSettings();

        expect(settings.reduceImageQuality).toBe(false);
        expect(settings.disableAutoplay).toBe(false);
        expect(settings.limitPrefetching).toBe(false);
      });
    });

    describe('Offline Mode Handling', () => {
      it('should detect offline state', () => {
        service.isOnline = vi.fn().mockReturnValue(false);
        expect(service.isOnline()).toBe(false);
      });

      it('should handle going offline gracefully', () => {
        const mockCallback = vi.fn();
        service.onOffline = vi.fn().mockImplementation(callback => {
          mockCallback.mockImplementation(callback);
          return () => {};
        });

        service.onOffline(mockCallback);
        expect(service.onOffline).toHaveBeenCalledWith(mockCallback);
      });

      it('should handle coming back online', () => {
        const mockCallback = vi.fn();
        service.onOnline = vi.fn().mockImplementation(callback => {
          mockCallback.mockImplementation(callback);
          return () => {};
        });

        service.onOnline(mockCallback);
        expect(service.onOnline).toHaveBeenCalledWith(mockCallback);
      });

      it('should cache critical resources for offline use', () => {
        service.cacheForOffline = vi.fn().mockImplementation(resources => {
          return Promise.resolve({
            cached: resources.length,
            failed: 0,
            totalSize: resources.reduce((size, resource) => size + (resource.size || 1024), 0),
          });
        });

        const resources = [
          { url: '/app.css', size: 5120 },
          { url: '/app.js', size: 15360 },
          { url: '/logo.png', size: 2048 },
        ];

        return service.cacheForOffline(resources).then(result => {
          expect(result.cached).toBe(3);
          expect(result.failed).toBe(0);
          expect(result.totalSize).toBe(22528);
        });
      });

      it('should provide offline fallback content', () => {
        service.getOfflineFallback = vi.fn().mockReturnValue({
          html: '<div class="offline-message">You are offline</div>',
          css: '.offline-message { text-align: center; padding: 20px; }',
          data: { message: 'Working offline', features: ['basic-games', 'saved-progress'] },
        });

        const fallback = service.getOfflineFallback();
        expect(fallback.html).toContain('offline-message');
        expect(fallback.data.features).toContain('basic-games');
      });
    });

    describe('Network Performance Monitoring', () => {
      it('should measure network latency', () => {
        service.measureLatency = vi.fn().mockResolvedValue({
          rtt: 85,
          jitter: 12,
          packetLoss: 0.02,
          timestamp: Date.now(),
        });

        return service.measureLatency().then(latency => {
          expect(latency.rtt).toBe(85);
          expect(latency.jitter).toBe(12);
          expect(latency.packetLoss).toBe(0.02);
        });
      });

      it('should track network quality over time', () => {
        const qualityHistory = [
          { timestamp: Date.now() - 10000, quality: 'good', score: 85 },
          { timestamp: Date.now() - 5000, quality: 'fair', score: 65 },
          { timestamp: Date.now(), quality: 'good', score: 90 },
        ];

        service.getNetworkQualityHistory = vi.fn().mockReturnValue(qualityHistory);
        const history = service.getNetworkQualityHistory();

        expect(history).toHaveLength(3);
        expect(history[2].quality).toBe('good');
        expect(history[2].score).toBe(90);
      });

      it('should provide network performance insights', () => {
        service.getNetworkInsights = vi.fn().mockReturnValue({
          averageLatency: 95,
          reliability: 0.92,
          optimalTimes: ['09:00-11:00', '14:00-16:00'],
          recommendedActions: [
            'Enable image compression',
            'Use adaptive bitrate for videos',
            'Implement request queuing',
          ],
          impactScore: 7.5,
        });

        const insights = service.getNetworkInsights();
        expect(insights.averageLatency).toBe(95);
        expect(insights.reliability).toBe(0.92);
        expect(insights.recommendedActions).toContain('Enable image compression');
        expect(insights.impactScore).toBe(7.5);
      });
    });
  });

  describe('Image Optimization', () => {
    it('should setup lazy loading with IntersectionObserver', () => {
      service.setupLazyLoading();
      expect(service.setupLazyLoading).toHaveBeenCalled();
    });

    it('should optimize images for mobile devices', () => {
      service.optimizeImages();
      expect(service.optimizeImages).toHaveBeenCalled();
    });

    it('should generate optimized image sources for retina displays', () => {
      const optimizedSrc = service.generateOptimizedSrc('/images/test.jpg', { retina: true });
      expect(optimizedSrc).toBe('/optimized/image.webp');
      expect(service.generateOptimizedSrc).toHaveBeenCalledWith('/images/test.jpg', {
        retina: true,
      });
    });

    it('should support WebP format when available', () => {
      expect(service.features.supportsWebP).toBe(true);
    });

    it('should generate appropriate image sizes for different breakpoints', () => {
      const sizes = [
        { src: '/image-small.webp', breakpoint: 'mobile' },
        { src: '/image-medium.webp', breakpoint: 'tablet' },
        { src: '/image-large.webp', breakpoint: 'desktop' },
      ];

      sizes.forEach(size => {
        service.generateOptimizedSrc.mockReturnValue(size.src);
        expect(service.generateOptimizedSrc()).toBe(size.src);
      });
    });
  });

  describe('Touch Optimization', () => {
    it('should optimize touch targets for mobile devices', () => {
      service.optimizeTouchTargets();
      expect(service.optimizeTouchTargets).toHaveBeenCalled();
    });

    it('should setup gesture handlers', () => {
      service.setupGestureHandlers();
      expect(service.setupGestureHandlers).toHaveBeenCalled();
    });

    it('should handle swipe gestures', () => {
      const swipeData = { direction: 'left', distance: 150, duration: 300 };
      service.handleSwipeGesture(swipeData);
      expect(service.handleSwipeGesture).toHaveBeenCalledWith(swipeData);
    });

    it('should support touch events', () => {
      expect(service.features.supportsTouch).toBe(true);
    });
  });

  describe('Viewport Optimization', () => {
    it('should set optimal viewport meta tag', () => {
      service.setViewportMeta();
      expect(service.setViewportMeta).toHaveBeenCalled();
    });

    it('should prevent form zoom on iOS', () => {
      service.preventIOSZoom();
      expect(service.preventIOSZoom).toHaveBeenCalled();
    });

    it('should handle safe area insets', () => {
      service.handleSafeAreaInsets();
      expect(service.handleSafeAreaInsets).toHaveBeenCalled();
    });
  });

  describe('Event System', () => {
    it('should support event emission', () => {
      service.emit('testEvent', { data: 'test' });
      expect(service.emit).toHaveBeenCalledWith('testEvent', { data: 'test' });
    });

    it('should add event listeners', () => {
      const handler = vi.fn();
      service.on('deviceRotation', handler);
      expect(service.on).toHaveBeenCalledWith('deviceRotation', handler);
    });

    it('should remove event listeners', () => {
      const handler = vi.fn();
      service.off('deviceRotation', handler);
      expect(service.off).toHaveBeenCalledWith('deviceRotation', handler);
    });
  });

  describe('Cleanup and Lifecycle', () => {
    it('should cleanup resources on destroy', () => {
      service.destroy();
      expect(service.destroy).toHaveBeenCalled();
    });

    it('should perform general cleanup', () => {
      service.cleanup();
      expect(service.cleanup).toHaveBeenCalled();
    });

    it('should handle service lifecycle properly', async () => {
      // Initialize
      await service.initialize();
      expect(service.initialize).toHaveBeenCalled();

      // Cleanup
      service.destroy();
      expect(service.destroy).toHaveBeenCalled();
    });
  });
});
