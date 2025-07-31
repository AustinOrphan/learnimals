/**
 * Unit Tests for BundleOptimizer
 * Tests bundle optimization, code splitting, and performance monitoring
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BundleOptimizer } from '../../src/utils/BundleOptimizer.js';

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock performance utilities
vi.mock('../../src/utils/performanceUtils.js', () => ({
  performanceMonitor: {
    start: vi.fn(),
    end: vi.fn()
  }
}));

describe('BundleOptimizer', () => {
  let optimizer;
  let mockPerformanceObserver;
  let mockMutationObserver;

  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    
    // Mock performance API
    global.performance = {
      now: vi.fn(() => Date.now()),
      getEntriesByType: vi.fn(() => []),
      ...global.performance
    };

    // Mock PerformanceObserver
    mockPerformanceObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      callback
    }));
    global.PerformanceObserver = mockPerformanceObserver;

    // Mock MutationObserver
    mockMutationObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      callback
    }));
    global.MutationObserver = mockMutationObserver;

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      callback
    }));

    // Mock navigator
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue({
          addEventListener: vi.fn()
        })
      },
      writable: true,
      configurable: true
    });

    // Mock window properties
    Object.defineProperty(window, 'requestIdleCallback', {
      value: vi.fn(cb => setTimeout(cb, 0)),
      writable: true
    });

    // Mock canvas for WebP detection
    const mockCanvas = {
      width: 1,
      height: 1,
      toDataURL: vi.fn(() => 'data:image/webp;base64,test')
    };
    global.HTMLCanvasElement.prototype.toDataURL = mockCanvas.toDataURL;
    global.document.createElement = vi.fn((tagName) => {
      if (tagName === 'canvas') return mockCanvas;
      return document.createElement(tagName);
    });

    // Mock CompressionStream for Brotli detection
    global.CompressionStream = vi.fn();

    // Mock dynamic import
    vi.stubGlobal('import', vi.fn());

    // Create optimizer instance
    optimizer = new BundleOptimizer();
  });

  afterEach(() => {
    if (optimizer) {
      optimizer.destroy();
    }
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      expect(optimizer.options.enableModulePrefetch).toBe(true);
      expect(optimizer.options.enableCriticalCSS).toBe(true);
      expect(optimizer.options.maxBundleSize).toBe(250 * 1024);
      expect(optimizer.options.maxInitialLoad).toBe(100 * 1024);
      expect(optimizer.options.loadingStrategy).toBe('eager');
      expect(optimizer.options.cacheStrategy).toBe('networkFirst');
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        maxBundleSize: 500 * 1024,
        loadingStrategy: 'lazy',
        enableServiceWorker: false
      };
      const customOptimizer = new BundleOptimizer(customOptions);
      
      expect(customOptimizer.options.maxBundleSize).toBe(500 * 1024);
      expect(customOptimizer.options.loadingStrategy).toBe('lazy');
      expect(customOptimizer.options.enableServiceWorker).toBe(false);
    });

    it('should initialize data structures', () => {
      expect(optimizer.loadedModules).toBeInstanceOf(Set);
      expect(optimizer.prefetchedModules).toBeInstanceOf(Set);
      expect(optimizer.criticalResources).toBeInstanceOf(Set);
      expect(optimizer.bundleCache).toBeInstanceOf(Map);
      expect(optimizer.loadingPromises).toBeInstanceOf(Map);
      expect(optimizer.performanceMetrics).toBeInstanceOf(Map);
    });

    it('should detect browser features', () => {
      expect(optimizer.features).toMatchObject({
        modulePreload: expect.any(Boolean),
        linkPrefetch: expect.any(Boolean),
        intersectionObserver: true,
        serviceWorker: true,
        webp: true,
        brotli: true
      });
    });

    it('should initialize successfully', async () => {
      global.performance.getEntriesByType = vi.fn(() => [
        {
          name: 'test.js',
          transferSize: 50000,
          duration: 100,
          startTime: 50
        }
      ]);

      await optimizer.initialize();

      expect(mockPerformanceObserver).toHaveBeenCalled();
      expect(optimizer.performanceMetrics.size).toBeGreaterThan(0);
    });
  });

  describe('Bundle Analysis', () => {
    it('should analyze bundles correctly', async () => {
      const mockResources = [
        {
          name: 'app.js',
          transferSize: 100000,
          encodedBodySize: 95000,
          duration: 200,
          startTime: 100
        },
        {
          name: 'styles.css',
          transferSize: 50000,
          duration: 150,
          startTime: 50
        },
        {
          name: 'vendor.js',
          transferSize: 200000,
          duration: 300,
          startTime: 500 // Not critical
        }
      ];

      global.performance.getEntriesByType = vi.fn(() => mockResources);
      
      const emitSpy = vi.spyOn(optimizer, 'emit');
      await optimizer.analyzeBundles();

      expect(optimizer.performanceMetrics.size).toBe(3);
      expect(optimizer.criticalResources.size).toBe(2); // Only first two are critical
      expect(emitSpy).toHaveBeenCalledWith('budgetExceeded', expect.any(Object));
    });

    it('should identify critical resources based on load time', async () => {
      const earlyResource = {
        name: 'critical.css',
        transferSize: 30000,
        duration: 100,
        startTime: 50
      };

      const lateResource = {
        name: 'late.js',
        transferSize: 40000,
        duration: 100,
        startTime: 2000
      };

      global.performance.getEntriesByType = vi.fn(() => [earlyResource, lateResource]);
      
      await optimizer.analyzeBundles();

      expect(optimizer.criticalResources.has('critical.css')).toBe(true);
      expect(optimizer.criticalResources.has('late.js')).toBe(false);
    });

    it('should warn about budget violations', async () => {
      const largeBundles = [
        {
          name: 'huge.js',
          transferSize: 300000, // Exceeds budget
          duration: 500,
          startTime: 100
        }
      ];

      global.performance.getEntriesByType = vi.fn(() => largeBundles);
      const emitSpy = vi.spyOn(optimizer, 'emit');
      
      await optimizer.analyzeBundles();

      expect(emitSpy).toHaveBeenCalledWith('budgetExceeded', {
        totalSize: 300000,
        budget: optimizer.options.maxBundleSize
      });
    });
  });

  describe('Resource Preloading', () => {
    it('should preload critical resources', () => {
      optimizer.preloadCriticalResources();

      const preloadLinks = document.querySelectorAll('link[rel="modulepreload"], link[rel="preload"]');
      expect(preloadLinks.length).toBeGreaterThan(0);
      
      const firstLink = preloadLinks[0];
      expect(firstLink.fetchPriority).toBe('high');
    });

    it('should preload resource with correct attributes', () => {
      optimizer.preloadResource('/test.js', 'high');

      const link = document.querySelector('link[href="/test.js"]');
      expect(link).toBeTruthy();
      expect(link.rel).toBe('modulepreload');
      expect(link.fetchPriority).toBe('high');
      expect(link.as).toBe('script');
    });

    it('should preload CSS with correct attributes', () => {
      optimizer.preloadResource('/test.css', 'medium');

      const link = document.querySelector('link[href="/test.css"]');
      expect(link).toBeTruthy();
      expect(link.rel).toBe('preload');
      expect(link.as).toBe('style');
      expect(link.fetchPriority).toBe('medium');
    });

    it('should not preload the same resource twice', () => {
      optimizer.preloadResource('/duplicate.js');
      optimizer.preloadResource('/duplicate.js');

      const links = document.querySelectorAll('link[href="/duplicate.js"]');
      expect(links.length).toBe(1);
    });

    it('should add integrity if available', () => {
      optimizer.getResourceIntegrity = vi.fn(() => 'sha384-test');
      
      optimizer.preloadResource('/secure.js');

      const link = document.querySelector('link[href="/secure.js"]');
      expect(link.integrity).toBe('sha384-test');
      expect(link.crossOrigin).toBe('anonymous');
    });
  });

  describe('Critical CSS Extraction', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div style="position: absolute; top: 0; height: 100px;">Above fold</div>
        <div style="position: absolute; top: 1000px; height: 100px;">Below fold</div>
      `;
      
      // Mock window dimensions
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    });

    it('should identify above-the-fold elements', () => {
      const elements = optimizer.getAboveTheFoldElements();
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should extract styles for critical elements', () => {
      // Mock stylesheet
      const mockRule = {
        type: CSSRule.STYLE_RULE,
        selectorText: 'div',
        cssText: 'div { color: red; }'
      };

      const mockSheet = {
        cssRules: [mockRule]
      };

      Object.defineProperty(document, 'styleSheets', {
        value: [mockSheet],
        writable: true
      });

      const criticalElements = [document.querySelector('div')];
      const styles = optimizer.extractStylesForElements(criticalElements);
      
      expect(styles).toContain('div { color: red; }');
    });

    it('should inline critical styles', () => {
      const styles = ['body { margin: 0; }', 'h1 { font-size: 2em; }'];
      
      optimizer.inlineCriticalStyles(styles);
      
      const inlinedStyle = document.querySelector('style[data-critical="true"]');
      expect(inlinedStyle).toBeTruthy();
      expect(inlinedStyle.textContent).toContain('body { margin: 0; }');
      expect(inlinedStyle.textContent).toContain('h1 { font-size: 2em; }');
    });

    it('should handle cross-origin stylesheets gracefully', () => {
      const mockSheet = {
        get cssRules() {
          throw new DOMException('Cross-origin');
        }
      };

      Object.defineProperty(document, 'styleSheets', {
        value: [mockSheet],
        writable: true
      });

      const elements = [document.createElement('div')];
      const styles = optimizer.extractStylesForElements(elements);
      
      expect(styles).toEqual([]);
    });
  });

  describe('Resource Deferring', () => {
    beforeEach(() => {
      document.head.innerHTML = `
        <link rel="stylesheet" href="/critical.css">
        <link rel="stylesheet" href="/non-critical.css">
        <script src="/critical.js"></script>
        <script src="/non-critical.js"></script>
      `;
    });

    it('should defer non-critical stylesheets', () => {
      optimizer.criticalResources.add('/critical.css');
      
      optimizer.deferNonCriticalResources();
      
      const criticalLink = document.querySelector('link[href="/critical.css"]');
      const nonCriticalLink = document.querySelector('link[href="/non-critical.css"]');
      
      expect(criticalLink.media).not.toBe('print');
      expect(nonCriticalLink.media).toBe('print');
    });

    it('should restore stylesheet media on load', (done) => {
      const link = document.querySelector('link[href="/non-critical.css"]');
      link.media = 'screen';
      
      optimizer.deferStylesheet(link);
      
      // Simulate load event
      link.dispatchEvent(new Event('load'));
      
      setTimeout(() => {
        expect(link.media).toBe('screen');
        done();
      }, 0);
    });

    it('should defer non-critical scripts', () => {
      optimizer.criticalResources.add('/critical.js');
      
      optimizer.deferNonCriticalResources();
      
      const criticalScript = document.querySelector('script[src="/critical.js"]');
      const nonCriticalScript = document.querySelector('script[src="/non-critical.js"]');
      
      expect(criticalScript.defer).toBeFalsy();
      expect(nonCriticalScript.defer).toBe(true);
    });
  });

  describe('Link Prefetching', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <a href="/page1">Page 1</a>
        <a href="/page2">Page 2</a>
        <a href="https://external.com">External</a>
        <a href="./relative">Relative</a>
      `;
    });

    it('should set up link prefetching with intersection observer', () => {
      optimizer.setupLinkPrefetching();

      const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
      expect(IntersectionObserver).toHaveBeenCalled();
      
      const observerInstance = IntersectionObserver.mock.results[0].value;
      expect(observerInstance.observe).toHaveBeenCalledTimes(internalLinks.length);
    });

    it('should prefetch link when it becomes visible', () => {
      optimizer.setupLinkPrefetching();
      
      const link = document.querySelector('a[href="/page1"]');
      const observerCallback = IntersectionObserver.mock.calls[0][0];
      
      // Simulate intersection
      observerCallback([{ isIntersecting: true, target: link }]);
      
      const prefetchLink = document.querySelector('link[rel="prefetch"][href="/page1"]');
      expect(prefetchLink).toBeTruthy();
    });

    it('should not prefetch external links', () => {
      optimizer.setupLinkPrefetching();
      
      const externalLink = document.querySelector('a[href="https://external.com"]');
      const observerInstance = IntersectionObserver.mock.results[0].value;
      
      expect(observerInstance.observe).not.toHaveBeenCalledWith(externalLink);
    });
  });

  describe('Idle Prefetching', () => {
    it('should prefetch idle resources when page is complete', () => {
      Object.defineProperty(document, 'readyState', { value: 'complete' });
      
      optimizer.setupIdlePrefetching();
      
      expect(requestIdleCallback).toHaveBeenCalled();
    });

    it('should wait for load event if page not ready', () => {
      Object.defineProperty(document, 'readyState', { value: 'loading' });
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      optimizer.setupIdlePrefetching();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function), { once: true });
    });

    it('should prefetch idle resources', () => {
      optimizer.preloadResource = vi.fn();
      
      optimizer.prefetchIdleResources();
      
      expect(optimizer.preloadResource).toHaveBeenCalledTimes(5); // Based on implementation
      expect(optimizer.preloadResource).toHaveBeenCalledWith(expect.any(String), 'low');
    });
  });

  describe('Code Splitting', () => {
    it('should create dynamic import wrapper', () => {
      optimizer.createDynamicImportWrapper();
      
      expect(window.lazyImport).toBeInstanceOf(Function);
    });

    it('should handle successful dynamic import', async () => {
      const mockModule = { default: class TestComponent {} };
      global.import = vi.fn().mockResolvedValue(mockModule);
      
      optimizer.createDynamicImportWrapper();
      
      const result = await window.lazyImport('/test-module.js');
      expect(result).toBe(mockModule);
      expect(optimizer.bundleCache.has('/test-module.js')).toBe(true);
    });

    it('should cache successful imports', async () => {
      const mockModule = { TestClass: class {} };
      global.import = vi.fn().mockResolvedValue(mockModule);
      
      optimizer.createDynamicImportWrapper();
      
      // First import
      await window.lazyImport('/cached-module.js');
      // Second import (should use cache)
      await window.lazyImport('/cached-module.js');
      
      expect(global.import).toHaveBeenCalledTimes(1);
    });

    it('should handle import timeout', async () => {
      global.import = vi.fn(() => new Promise(() => {})); // Never resolves
      
      optimizer.createDynamicImportWrapper();
      
      await expect(
        window.lazyImport('/slow-module.js', { timeout: 100 })
      ).rejects.toThrow('Module import timeout');
    });

    it('should retry failed imports', async () => {
      let attempts = 0;
      global.import = vi.fn(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ default: {} });
      });
      
      optimizer.createDynamicImportWrapper();
      
      const result = await window.lazyImport('/flaky-module.js');
      expect(result).toBeTruthy();
      expect(attempts).toBe(3);
    });

    it('should use fallback on import failure', async () => {
      const fallback = { fallback: true };
      global.import = vi.fn().mockRejectedValue(new Error('Module not found'));
      
      optimizer.createDynamicImportWrapper();
      
      const result = await window.lazyImport('/missing-module.js', { fallback });
      expect(result).toBe(fallback);
    });
  });

  describe('Route-based Splitting', () => {
    it('should set up route splitting', () => {
      optimizer.prefetchLikelyRoutes = vi.fn();
      
      optimizer.setupRouteSplitting();
      
      expect(optimizer.prefetchLikelyRoutes).toHaveBeenCalled();
    });

    it('should prefetch current route module', async () => {
      Object.defineProperty(window.location, 'pathname', { value: '/games/bubble-pop' });
      global.lazyImport = vi.fn().mockResolvedValue({});
      
      optimizer.setupRouteSplitting();
      
      expect(global.lazyImport).toHaveBeenCalledWith('/src/features/games/bubble-pop/BubblePopGame.js');
    });

    it('should prefetch routes on hover', () => {
      document.body.innerHTML = '<a href="/games/word-scramble">Word Scramble</a>';
      global.lazyImport = vi.fn();
      
      optimizer.setupRouteSplitting();
      
      const link = document.querySelector('a');
      link.dispatchEvent(new Event('mouseenter'));
      
      expect(global.lazyImport).toHaveBeenCalledWith('/src/features/games/word-scramble/WordScrambleGame.js');
    });
  });

  describe('Component-based Splitting', () => {
    it('should register lazy components', () => {
      optimizer.setupComponentSplitting();
      
      expect(window.LazyModal).toBeInstanceOf(Function);
      expect(window.LazyToast).toBeInstanceOf(Function);
      expect(window.LazyCharacterCustomizer).toBeInstanceOf(Function);
    });

    it('should load lazy component successfully', async () => {
      const MockComponent = vi.fn().mockImplementation(() => ({
        render: vi.fn().mockResolvedValue()
      }));
      
      global.lazyImport = vi.fn().mockResolvedValue({ default: MockComponent });
      
      optimizer.setupComponentSplitting();
      
      const container = document.createElement('div');
      const component = await window.LazyModal(container, { title: 'Test' });
      
      expect(MockComponent).toHaveBeenCalledWith({ title: 'Test' });
      expect(component.render).toHaveBeenCalledWith(container);
    });
  });

  describe('Service Worker', () => {
    it('should register service worker successfully', async () => {
      const mockRegistration = {
        addEventListener: vi.fn()
      };
      navigator.serviceWorker.register.mockResolvedValue(mockRegistration);
      
      const emitSpy = vi.spyOn(optimizer, 'emit');
      
      await optimizer.initializeServiceWorker();
      
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/serviceWorker.js');
      expect(emitSpy).toHaveBeenCalledWith('serviceWorkerRegistered', { registration: mockRegistration });
    });

    it('should handle service worker registration failure', async () => {
      const error = new Error('Registration failed');
      navigator.serviceWorker.register.mockRejectedValue(error);
      
      const emitSpy = vi.spyOn(optimizer, 'emit');
      
      await optimizer.initializeServiceWorker();
      
      expect(emitSpy).toHaveBeenCalledWith('serviceWorkerError', { error });
    });

    it('should handle service worker updates', async () => {
      const mockRegistration = {
        addEventListener: vi.fn()
      };
      navigator.serviceWorker.register.mockResolvedValue(mockRegistration);
      
      const emitSpy = vi.spyOn(optimizer, 'emit');
      
      await optimizer.initializeServiceWorker();
      
      // Simulate update event
      const updateHandler = mockRegistration.addEventListener.mock.calls
        .find(([event]) => event === 'updatefound')[1];
      updateHandler();
      
      expect(emitSpy).toHaveBeenCalledWith('serviceWorkerUpdate', { registration: mockRegistration });
    });

    it('should skip service worker if not supported', async () => {
      optimizer.features.serviceWorker = false;
      
      await optimizer.initializeServiceWorker();
      
      expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    it('should monitor bundle performance with PerformanceObserver', () => {
      optimizer.monitorBundlePerformance();
      
      expect(PerformanceObserver).toHaveBeenCalled();
      const observerInstance = PerformanceObserver.mock.results[0].value;
      expect(observerInstance.observe).toHaveBeenCalledWith({ entryTypes: ['resource'] });
    });

    it('should track resource performance', () => {
      const entry = {
        name: 'large-bundle.js',
        transferSize: 300000,
        duration: 2000,
        startTime: 100
      };
      
      const emitSpy = vi.spyOn(optimizer, 'emit');
      
      optimizer.trackResourcePerformance(entry);
      
      expect(emitSpy).toHaveBeenCalledWith('largeResource', {
        url: 'large-bundle.js',
        size: 300000,
        loadTime: 2000
      });
      
      expect(emitSpy).toHaveBeenCalledWith('slowResource', {
        url: 'large-bundle.js',
        size: 300000,
        loadTime: 2000
      });
    });

    it('should fall back to MutationObserver if PerformanceObserver fails', () => {
      PerformanceObserver.mockImplementation(() => {
        throw new Error('Not supported');
      });
      
      optimizer.monitorBundlePerformance();
      
      expect(MutationObserver).toHaveBeenCalled();
    });

    it('should track element load time with fallback', () => {
      const script = document.createElement('script');
      script.src = '/test.js';
      
      optimizer.trackElementLoad(script);
      
      // Simulate load event
      script.dispatchEvent(new Event('load'));
      
      expect(optimizer.performanceMetrics.has('/test.js')).toBe(true);
    });

    it('should handle resource errors', () => {
      const script = document.createElement('script');
      script.src = '/missing.js';
      
      const emitSpy = vi.spyOn(optimizer, 'emit');
      
      optimizer.trackElementLoad(script);
      script.dispatchEvent(new Event('error'));
      
      expect(emitSpy).toHaveBeenCalledWith('resourceError', {
        url: '/missing.js',
        element: script
      });
    });
  });

  describe('Feature Detection', () => {
    it('should detect module preload support', () => {
      const mockLink = {
        relList: {
          supports: vi.fn(rel => rel === 'modulepreload')
        }
      };
      
      document.createElement = vi.fn(() => mockLink);
      
      expect(optimizer.supportsModulePreload()).toBe(true);
      expect(mockLink.relList.supports).toHaveBeenCalledWith('modulepreload');
    });

    it('should detect prefetch support', () => {
      const mockLink = {
        relList: {
          supports: vi.fn(rel => rel === 'prefetch')
        }
      };
      
      document.createElement = vi.fn(() => mockLink);
      
      expect(optimizer.supportsLinkPrefetch()).toBe(true);
    });

    it('should detect WebP support', () => {
      expect(optimizer.supportsWebP()).toBe(true);
    });

    it('should handle WebP detection in test environment', () => {
      const originalEnv = process.env;
      process.env = { NODE_ENV: 'test' };
      
      expect(optimizer.supportsWebP()).toBe(false);
      
      process.env = originalEnv;
    });

    it('should detect Brotli support', () => {
      expect(optimizer.supportsBrotli()).toBe(true);
      
      delete window.CompressionStream;
      expect(optimizer.supportsBrotli()).toBe(false);
    });
  });

  describe('Public API', () => {
    it('should get performance metrics', () => {
      optimizer.performanceMetrics.set('test.js', {
        size: 50000,
        loadTime: 100,
        type: 'javascript'
      });
      
      optimizer.loadedModules.add('module1');
      optimizer.bundleCache.set('cached', {});
      
      const metrics = optimizer.getMetrics();
      
      expect(metrics).toMatchObject({
        totalBundles: 1,
        totalSize: 50000,
        averageLoadTime: 100,
        bundles: [
          {
            url: 'test.js',
            size: 50000,
            loadTime: 100,
            type: 'javascript'
          }
        ],
        cacheHitRate: 1,
        features: optimizer.features
      });
    });

    it('should clear caches', () => {
      optimizer.bundleCache.set('test', {});
      optimizer.prefetchedModules.add('test');
      optimizer.loadingPromises.set('test', Promise.resolve());
      
      optimizer.clearCache();
      
      expect(optimizer.bundleCache.size).toBe(0);
      expect(optimizer.prefetchedModules.size).toBe(0);
      expect(optimizer.loadingPromises.size).toBe(0);
    });

    it('should preload specific resources', () => {
      optimizer.preloadResource = vi.fn();
      
      const resources = [
        '/style.css',
        { url: '/script.js', priority: 'high' }
      ];
      
      optimizer.preloadResources(resources);
      
      expect(optimizer.preloadResource).toHaveBeenCalledWith('/style.css');
      expect(optimizer.preloadResource).toHaveBeenCalledWith('/script.js', 'high');
    });

    it('should get loading statistics', () => {
      optimizer.loadedModules.add('loaded1');
      optimizer.prefetchedModules.add('prefetched1');
      optimizer.bundleCache.set('cached1', {});
      optimizer.loadingPromises.set('loading1', Promise.resolve());
      optimizer.criticalResources.add('critical1');
      
      const stats = optimizer.getLoadingStats();
      
      expect(stats).toEqual({
        loadedModules: 1,
        prefetchedModules: 1,
        cachedModules: 1,
        activeLoading: 1,
        criticalResources: 1
      });
    });
  });

  describe('Advanced Optimization Features', () => {
    it('should calculate splitting effectiveness', () => {
      const splittingMetrics = {
        originalBundleSize: 1000000,
        splitBundles: [
          { size: 300000 },
          { size: 200000 },
          { size: 100000 }
        ],
        cacheableSize: 400000
      };
      
      const result = optimizer.calculateSplittingEffectiveness(splittingMetrics);
      
      expect(result.bundleCount).toBe(3);
      expect(result.sizeReduction).toBe(40); // (1000000 - 600000) / 1000000 * 100
      expect(result.cacheability).toBe(66.67); // 400000 / 600000 * 100 (rounded)
    });

    it('should detect circular dependencies', () => {
      const dependencyMap = {
        'A': ['B'],
        'B': ['C'],
        'C': ['A'] // Circular dependency
      };
      
      expect(optimizer.detectCircularDependencies(dependencyMap)).toBe(true);
      
      const noCycleDeps = {
        'A': ['B'],
        'B': ['C'],
        'C': []
      };
      
      expect(optimizer.detectCircularDependencies(noCycleDeps)).toBe(false);
    });

    it('should optimize chunk grouping', () => {
      const modules = [
        { frequency: 0.8, size: 50000 },  // High frequency, small
        { frequency: 0.6, size: 150000 }, // High frequency, large
        { frequency: 0.3, size: 30000 },  // Low frequency, small
        { frequency: 0.1, size: 200000 }  // Low frequency, large
      ];
      
      const result = optimizer.optimizeChunkGrouping(modules);
      
      expect(result.vendor).toHaveLength(1); // Only small high-frequency module
      expect(result.lazy).toHaveLength(3);   // Rest go to lazy
    });

    it('should parse webpack magic comments', () => {
      const importString = `import(/* webpackChunkName: "my-chunk", webpackPrefetch: true, webpackPreload: false */ "./module.js")`;
      
      const result = optimizer.parseMagicComments(importString);
      
      expect(result).toEqual({
        chunkName: 'my-chunk',
        prefetch: true,
        preload: false
      });
    });

    it('should prefetch chunk by name', () => {
      optimizer.preloadResource = vi.fn();
      
      optimizer.prefetchChunk('critical-chunk', 'high');
      
      expect(optimizer.preloadResource).toHaveBeenCalledWith('/chunks/critical.js', 'high');
    });

    it('should determine if resource should be split', () => {
      expect(optimizer.shouldSplitResource('/app.js')).toBe(true);
      expect(optimizer.shouldSplitResource('/critical.js')).toBe(false);
      expect(optimizer.shouldSplitResource('/inline.js')).toBe(false);
      expect(optimizer.shouldSplitResource('/styles.css')).toBe(false);
    });

    it('should apply loading strategy', () => {
      optimizer.preloadResource = vi.fn();
      
      // Test eager strategy
      optimizer.options.loadingStrategy = 'eager';
      optimizer.applyLoadingStrategy('/test.js');
      expect(optimizer.preloadResource).toHaveBeenCalledWith('/test.js');
      
      // Test lazy strategy
      optimizer.preloadResource.mockClear();
      optimizer.options.loadingStrategy = 'lazy';
      optimizer.applyLoadingStrategy('/test2.js');
      expect(optimizer.preloadResource).not.toHaveBeenCalled();
      
      // Test auto strategy with critical resource
      optimizer.preloadResource.mockClear();
      optimizer.options.loadingStrategy = 'auto';
      optimizer.criticalResources.add('/critical.js');
      optimizer.applyLoadingStrategy('/critical.js');
      expect(optimizer.preloadResource).toHaveBeenCalledWith('/critical.js');
    });
  });

  describe('Event System', () => {
    it('should emit events', () => {
      const handler = vi.fn();
      document.addEventListener('bundleOptimizer:test', handler);
      
      optimizer.emit('test', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { data: 'test' }
        })
      );
    });

    it('should add and remove event listeners', () => {
      const handler = vi.fn();
      
      optimizer.on('test', handler);
      optimizer.emit('test', {});
      expect(handler).toHaveBeenCalled();
      
      handler.mockClear();
      optimizer.off('test', handler);
      optimizer.emit('test', {});
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should destroy and clean up properly', () => {
      optimizer.bundleCache.set('test', {});
      optimizer.performanceMetrics.set('test', {});
      window.lazyImport = vi.fn();
      
      optimizer.destroy();
      
      expect(optimizer.bundleCache.size).toBe(0);
      expect(optimizer.performanceMetrics.size).toBe(0);
      expect(window.lazyImport).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing performance API gracefully', async () => {
      global.performance.getEntriesByType = undefined;
      
      await expect(optimizer.analyzeBundles()).rejects.toThrow();
    });

    it('should handle empty resource list', async () => {
      global.performance.getEntriesByType = vi.fn(() => []);
      
      await optimizer.analyzeBundles();
      
      expect(optimizer.performanceMetrics.size).toBe(0);
    });

    it('should handle malformed import statements', () => {
      const result = optimizer.parseMagicComments('invalid import statement');
      
      expect(result).toEqual({
        chunkName: null,
        prefetch: false,
        preload: false
      });
    });

    it('should handle missing chunk URLs', () => {
      optimizer.preloadResource = vi.fn();
      
      optimizer.prefetchChunk('non-existent-chunk');
      
      expect(optimizer.preloadResource).not.toHaveBeenCalled();
    });
  });
});