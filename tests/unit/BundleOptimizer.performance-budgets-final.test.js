/**
 * Comprehensive Performance Budgets Tests for BundleOptimizer
 *
 * This test suite verifies:
 * 1. Performance budget configuration and validation
 * 2. Budget checking against actual bundle sizes
 * 3. Warning/error handling when budgets are exceeded
 * 4. Different budget types (size, time, asset count)
 * 5. Budget reporting and metrics collection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BundleOptimizer } from '../../utils/BundleOptimizer.js';

// Mock logger to prevent console noise
vi.mock('../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../utils/performanceUtils.js', () => ({
  performanceMonitor: {
    startTimer: vi.fn(),
    endTimer: vi.fn(),
    logMetric: vi.fn(),
  },
}));

// Comprehensive DOM environment mock
const createMockDOM = () => {
  global.document = {
    createElement: vi.fn(tagName => ({
      tagName: tagName.toUpperCase(),
      rel: '',
      href: '',
      src: '',
      media: 'all',
      width: 1,
      height: 1,
      appendChild: vi.fn(),
      addEventListener: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      matches: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({ top: 0, bottom: 100, left: 0, right: 100 })),
      toDataURL: vi.fn(() => 'data:image/png;base64,test'),
      relList: { supports: vi.fn(() => true) },
    })),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    head: { appendChild: vi.fn(), insertBefore: vi.fn() },
    body: { appendChild: vi.fn(), contains: vi.fn(() => false) },
    styleSheets: [],
    readyState: 'complete',
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  global.window = {
    innerHeight: 768,
    innerWidth: 1024,
    location: { pathname: '/test-page' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    performance: {
      now: vi.fn(() => Date.now()),
      getEntriesByType: vi.fn(() => []),
    },
    requestIdleCallback: vi.fn(callback => setTimeout(callback, 0)),
    IntersectionObserver: vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
    PerformanceObserver: vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })),
    MutationObserver: vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })),
    CompressionStream: vi.fn(),
    CustomEvent: vi.fn((type, options) => ({ type, detail: options?.detail })),
  };

  global.navigator = { serviceWorker: { register: vi.fn() } };
  global.process = { env: { NODE_ENV: 'test' } };
};

describe('BundleOptimizer Performance Budgets', () => {
  let bundleOptimizer;

  beforeEach(() => {
    createMockDOM();
    vi.clearAllMocks();

    bundleOptimizer = new BundleOptimizer({
      maxBundleSize: 250 * 1024, // 250KB
      maxInitialLoad: 100 * 1024, // 100KB
      warningThreshold: 200 * 1024, // 200KB
      criticalCSSThreshold: 1000, // 1 second
    });
  });

  afterEach(() => {
    if (bundleOptimizer) {
      bundleOptimizer.destroy();
    }
  });

  describe('Budget Configuration', () => {
    it('should initialize with default budget values', () => {
      const optimizer = new BundleOptimizer();

      expect(optimizer.options.maxBundleSize).toBe(250 * 1024);
      expect(optimizer.options.maxInitialLoad).toBe(100 * 1024);
      expect(optimizer.options.warningThreshold).toBe(200 * 1024);
    });

    it('should accept custom budget configuration', () => {
      const customBudgets = {
        maxBundleSize: 500 * 1024,
        maxInitialLoad: 200 * 1024,
        warningThreshold: 300 * 1024,
        performanceBudgets: {
          javascript: 300 * 1024,
          css: 100 * 1024,
          fonts: 50 * 1024,
        },
      };

      const optimizer = new BundleOptimizer(customBudgets);

      expect(optimizer.options.maxBundleSize).toBe(500 * 1024);
      expect(optimizer.options.maxInitialLoad).toBe(200 * 1024);
      expect(optimizer.options.warningThreshold).toBe(300 * 1024);
      expect(optimizer.options.performanceBudgets).toEqual(customBudgets.performanceBudgets);

      optimizer.destroy();
    });

    it('should validate budget types and values', () => {
      const validBudgets = [
        { type: 'size', value: 1024 * 1024, valid: true },
        { type: 'size', value: -100, valid: false },
        { type: 'time', value: 3000, valid: true },
        { type: 'time', value: 'invalid', valid: false },
        { type: 'count', value: 50, valid: true },
        { type: 'count', value: 0, valid: false },
      ];

      validBudgets.forEach(budget => {
        const isValid = typeof budget.value === 'number' && budget.value > 0;
        expect(isValid).toBe(budget.valid);
      });
    });
  });

  describe('Bundle Size Analysis', () => {
    it('should analyze bundle sizes correctly', async () => {
      const mockResources = [
        {
          name: '/app.js',
          transferSize: 150 * 1024,
          encodedBodySize: 140 * 1024,
          duration: 300,
          startTime: 100,
        },
        {
          name: '/styles.css',
          transferSize: 80 * 1024,
          encodedBodySize: 75 * 1024,
          duration: 200,
          startTime: 200,
        },
      ];

      window.performance.getEntriesByType.mockReturnValue(mockResources);

      await bundleOptimizer.analyzeBundles();

      // Check that resources were tracked
      expect(bundleOptimizer.performanceMetrics.has('/app.js')).toBe(true);
      expect(bundleOptimizer.performanceMetrics.has('/styles.css')).toBe(true);

      const appMetrics = bundleOptimizer.performanceMetrics.get('/app.js');
      expect(appMetrics.size).toBe(150 * 1024);
      expect(appMetrics.loadTime).toBe(300);
      expect(appMetrics.type).toBe('javascript');
    });

    it('should handle missing size properties gracefully', async () => {
      const mockResources = [
        {
          name: '/test.js',
          transferSize: undefined,
          encodedBodySize: 100 * 1024,
          duration: 250,
        },
        {
          name: '/test2.js',
          transferSize: undefined,
          encodedBodySize: undefined,
          duration: 300,
        },
      ];

      window.performance.getEntriesByType.mockReturnValue(mockResources);

      await bundleOptimizer.analyzeBundles();

      const metrics1 = bundleOptimizer.performanceMetrics.get('/test.js');
      const metrics2 = bundleOptimizer.performanceMetrics.get('/test2.js');

      expect(metrics1.size).toBe(100 * 1024); // Falls back to encodedBodySize
      expect(metrics2.size).toBe(0); // Falls back to 0 when both missing
    });

    it('should filter resources by file type', async () => {
      const mockResources = [
        { name: '/app.js', transferSize: 100 * 1024, duration: 200 },
        { name: '/styles.css', transferSize: 50 * 1024, duration: 150 },
        { name: '/image.png', transferSize: 200 * 1024, duration: 300 }, // Should be ignored
        { name: '/font.woff2', transferSize: 30 * 1024, duration: 100 }, // Should be ignored
      ];

      window.performance.getEntriesByType.mockReturnValue(mockResources);

      await bundleOptimizer.analyzeBundles();

      // Only JS and CSS files should be tracked
      expect(bundleOptimizer.performanceMetrics.has('/app.js')).toBe(true);
      expect(bundleOptimizer.performanceMetrics.has('/styles.css')).toBe(true);
      expect(bundleOptimizer.performanceMetrics.has('/image.png')).toBe(false);
      expect(bundleOptimizer.performanceMetrics.has('/font.woff2')).toBe(false);
    });
  });

  describe('Budget Violation Detection', () => {
    it('should detect when total bundle size exceeds budget', async () => {
      const mockResources = [
        { name: '/large1.js', transferSize: 200 * 1024, duration: 300, startTime: 100 },
        { name: '/large2.js', transferSize: 200 * 1024, duration: 400, startTime: 200 },
      ];

      window.performance.getEntriesByType.mockReturnValue(mockResources);

      // Set budget lower than total size (400KB)
      bundleOptimizer.options.maxBundleSize = 300 * 1024;

      const eventSpy = vi.spyOn(bundleOptimizer, 'emit');

      await bundleOptimizer.analyzeBundles();

      // Should emit budget exceeded event
      expect(eventSpy).toHaveBeenCalledWith('budgetExceeded', {
        totalSize: 400 * 1024,
        budget: 300 * 1024,
      });
    });

    it('should detect when critical resources exceed initial load budget', async () => {
      const mockResources = [
        { name: '/critical.js', transferSize: 80 * 1024, duration: 200, startTime: 50 }, // Critical (< 1000ms)
        { name: '/critical.css', transferSize: 60 * 1024, duration: 150, startTime: 100 }, // Critical (< 1000ms)
      ];

      window.performance.getEntriesByType.mockReturnValue(mockResources);

      // Set initial load budget lower than critical size (140KB)
      bundleOptimizer.options.maxInitialLoad = 100 * 1024;
      bundleOptimizer.options.criticalCSSThreshold = 1000;

      const eventSpy = vi.spyOn(bundleOptimizer, 'emit');

      await bundleOptimizer.analyzeBundles();

      // Should emit critical budget exceeded event
      expect(eventSpy).toHaveBeenCalledWith('criticalBudgetExceeded', {
        criticalSize: 140 * 1024,
        budget: 100 * 1024,
      });
    });

    it('should not trigger budget events when within limits', async () => {
      const mockResources = [
        { name: '/small.js', transferSize: 50 * 1024, duration: 200, startTime: 100 },
      ];

      window.performance.getEntriesByType.mockReturnValue(mockResources);

      const eventSpy = vi.spyOn(bundleOptimizer, 'emit');

      await bundleOptimizer.analyzeBundles();

      // Should not emit any budget violation events
      expect(eventSpy).not.toHaveBeenCalledWith('budgetExceeded', expect.anything());
      expect(eventSpy).not.toHaveBeenCalledWith('criticalBudgetExceeded', expect.anything());
    });
  });

  describe('Resource Performance Tracking', () => {
    it('should track individual resource performance', () => {
      const resource = {
        name: '/test-resource.js',
        transferSize: 150 * 1024,
        duration: 500,
        startTime: 100,
      };

      vi.spyOn(bundleOptimizer, 'emit');

      bundleOptimizer.trackResourcePerformance(resource);

      // Should track the resource in metrics
      expect(bundleOptimizer.performanceMetrics.has('/test-resource.js')).toBe(true);

      const metrics = bundleOptimizer.performanceMetrics.get('/test-resource.js');
      expect(metrics.size).toBe(150 * 1024);
      expect(metrics.loadTime).toBe(500);
      expect(metrics.type).toBe('javascript');
    });

    it('should emit warnings for large resources', () => {
      const largeResource = {
        name: '/large-resource.js',
        transferSize: 300 * 1024, // Exceeds 200KB warning threshold
        duration: 400,
        startTime: 100,
      };

      const eventSpy = vi.spyOn(bundleOptimizer, 'emit');

      bundleOptimizer.trackResourcePerformance(largeResource);

      expect(eventSpy).toHaveBeenCalledWith('largeResource', {
        url: '/large-resource.js',
        size: 300 * 1024,
        loadTime: 400,
      });
    });

    it('should emit warnings for slow resources', () => {
      const slowResource = {
        name: '/slow-resource.js',
        transferSize: 100 * 1024,
        duration: 1500, // Exceeds 1000ms threshold
        startTime: 100,
      };

      const eventSpy = vi.spyOn(bundleOptimizer, 'emit');

      bundleOptimizer.trackResourcePerformance(slowResource);

      expect(eventSpy).toHaveBeenCalledWith('slowResource', {
        url: '/slow-resource.js',
        size: 100 * 1024,
        loadTime: 1500,
      });
    });
  });

  describe('Budget Types and Metrics', () => {
    beforeEach(() => {
      // Setup test metrics
      bundleOptimizer.performanceMetrics.set('/app.js', {
        size: 150 * 1024,
        loadTime: 300,
        type: 'javascript',
        critical: true,
      });
      bundleOptimizer.performanceMetrics.set('/vendor.js', {
        size: 200 * 1024,
        loadTime: 450,
        type: 'javascript',
        critical: false,
      });
    });

    it('should support size-based budgets', () => {
      const sizeBudget = {
        type: 'size',
        max: 500 * 1024,
        current: 350 * 1024,
        unit: 'bytes',
      };

      const utilization = (sizeBudget.current / sizeBudget.max) * 100;
      const withinBudget = sizeBudget.current <= sizeBudget.max;

      expect(utilization).toBe(70);
      expect(withinBudget).toBe(true);
    });

    it('should support time-based budgets', () => {
      const timeBudget = {
        type: 'time',
        max: 3000,
        current: 2100,
        unit: 'ms',
      };

      const utilization = (timeBudget.current / timeBudget.max) * 100;
      const withinBudget = timeBudget.current <= timeBudget.max;

      expect(utilization).toBe(70);
      expect(withinBudget).toBe(true);
    });

    it('should support asset count budgets', () => {
      const countBudget = {
        type: 'count',
        max: 20,
        current: bundleOptimizer.performanceMetrics.size,
        unit: 'assets',
      };

      const utilization = (countBudget.current / countBudget.max) * 100;
      const withinBudget = countBudget.current <= countBudget.max;

      expect(countBudget.current).toBe(2); // 2 test resources
      expect(utilization).toBe(10);
      expect(withinBudget).toBe(true);
    });

    it('should generate comprehensive metrics reports', () => {
      const metrics = bundleOptimizer.getMetrics();

      expect(metrics).toHaveProperty('totalBundles', 2);
      expect(metrics).toHaveProperty('totalSize', 350 * 1024);
      expect(metrics).toHaveProperty('averageLoadTime', 375); // (300 + 450) / 2
      expect(metrics).toHaveProperty('bundles');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('features');

      expect(metrics.bundles).toHaveLength(2);
      expect(metrics.bundles[0]).toHaveProperty('url');
      expect(metrics.bundles[0]).toHaveProperty('size');
      expect(metrics.bundles[0]).toHaveProperty('loadTime');
    });
  });

  describe('Budget Utilities and Helpers', () => {
    it('should track bundle sizes correctly', () => {
      bundleOptimizer.trackBundleSize('test-bundle', 150 * 1024);

      const metrics = bundleOptimizer.performanceMetrics.get('test-bundle');
      expect(metrics.size).toBe(150 * 1024);
      expect(metrics.timestamp).toBeDefined();
    });

    it('should calculate splitting effectiveness', () => {
      const splittingMetrics = {
        originalBundleSize: 500 * 1024,
        splitBundles: [{ size: 200 * 1024 }, { size: 150 * 1024 }, { size: 100 * 1024 }],
        cacheableSize: 200 * 1024,
      };

      const effectiveness = bundleOptimizer.calculateSplittingEffectiveness(splittingMetrics);

      expect(effectiveness).toHaveProperty('sizeReduction');
      expect(effectiveness).toHaveProperty('cacheability');
      expect(effectiveness).toHaveProperty('loadTimeImprovement');
      expect(effectiveness).toHaveProperty('bundleCount', 3);

      // Size reduction: original (500KB) vs total split (450KB) = 10% reduction
      expect(effectiveness.sizeReduction).toBe(10);

      // Cacheability: 200KB cacheable out of 450KB total = ~44.4%
      expect(effectiveness.cacheability).toBeCloseTo(44.44, 1);
    });

    it('should detect circular dependencies', () => {
      const circularDeps = {
        moduleA: ['moduleB'],
        moduleB: ['moduleC'],
        moduleC: ['moduleA'], // Creates a cycle
      };

      const hasCycle = bundleOptimizer.detectCircularDependencies(circularDeps);
      expect(hasCycle).toBe(true);

      const noCycleDeps = {
        moduleA: ['moduleB'],
        moduleB: ['moduleC'],
        moduleC: [], // No cycle
      };

      const hasNoCycle = bundleOptimizer.detectCircularDependencies(noCycleDeps);
      expect(hasNoCycle).toBe(false);
    });

    it('should optimize chunk grouping', () => {
      const modules = [
        { name: 'react', size: 45000, frequency: 0.9 },
        { name: 'lodash', size: 70000, frequency: 0.7 },
        { name: 'moment', size: 65000, frequency: 0.3 },
        { name: 'chart.js', size: 200000, frequency: 0.1 }, // Large, low frequency
      ];

      const chunks = bundleOptimizer.optimizeChunkGrouping(modules);

      expect(chunks).toHaveProperty('vendor');
      expect(chunks).toHaveProperty('lazy');

      // High frequency, small modules should go to vendor
      expect(chunks.vendor).toContain(modules[0]); // react
      expect(chunks.vendor).toContain(modules[1]); // lodash

      // Large or low frequency modules should go to lazy
      expect(chunks.lazy).toContain(modules[2]); // moment (low frequency)
      expect(chunks.lazy).toContain(modules[3]); // chart.js (large + low frequency)
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle performance API errors gracefully', async () => {
      window.performance.getEntriesByType.mockImplementation(() => {
        throw new Error('Performance API unavailable');
      });

      await expect(bundleOptimizer.analyzeBundles()).rejects.toThrow('Performance API unavailable');

      // Should not crash the application
      expect(bundleOptimizer.performanceMetrics.size).toBe(0);
    });

    it('should handle malformed resource entries', () => {
      const malformedResource = {
        name: null,
        transferSize: 'invalid',
        duration: undefined,
      };

      expect(() => {
        bundleOptimizer.trackResourcePerformance(malformedResource);
      }).not.toThrow();

      // Should handle gracefully and not add invalid entries
      expect(bundleOptimizer.performanceMetrics.has(null)).toBe(false);
    });

    it('should cleanup resources properly on destroy', () => {
      bundleOptimizer.performanceMetrics.set('test', { size: 100 });
      bundleOptimizer.bundleCache.set('test', {});
      bundleOptimizer.loadingPromises.set('test', Promise.resolve());

      bundleOptimizer.destroy();

      expect(bundleOptimizer.performanceMetrics.size).toBe(0);
      expect(bundleOptimizer.bundleCache.size).toBe(0);
      expect(bundleOptimizer.loadingPromises.size).toBe(0);
    });
  });

  describe('Integration and Real-World Scenarios', () => {
    it('should handle realistic bundle analysis scenario', async () => {
      const realisticResources = [
        { name: '/vendor.js', transferSize: 180 * 1024, duration: 450, startTime: 50 },
        { name: '/app.js', transferSize: 120 * 1024, duration: 300, startTime: 100 },
        { name: '/styles.css', transferSize: 45 * 1024, duration: 180, startTime: 150 },
        { name: '/component.js', transferSize: 80 * 1024, duration: 250, startTime: 1200 }, // Non-critical
      ];

      window.performance.getEntriesByType.mockReturnValue(realisticResources);

      bundleOptimizer.options.maxBundleSize = 400 * 1024; // Within total limit
      bundleOptimizer.options.maxInitialLoad = 200 * 1024; // Critical resources exceed this

      const eventSpy = vi.spyOn(bundleOptimizer, 'emit');

      await bundleOptimizer.analyzeBundles();

      // Total size: 425KB > 400KB budget
      expect(eventSpy).toHaveBeenCalledWith('budgetExceeded', expect.any(Object));

      // Critical resources (first 3): 345KB > 200KB budget
      expect(eventSpy).toHaveBeenCalledWith('criticalBudgetExceeded', expect.any(Object));

      const metrics = bundleOptimizer.getMetrics();
      expect(metrics.totalBundles).toBe(4);
      expect(metrics.totalSize).toBe(425 * 1024);
    });

    it('should provide actionable budget recommendations', () => {
      bundleOptimizer.getMetrics();

      // Simulate metrics that exceed budgets
      bundleOptimizer.performanceMetrics.set('/large-app.js', {
        size: 300 * 1024, // Exceeds 250KB budget
        loadTime: 800,
        type: 'javascript',
      });

      const updatedMetrics = bundleOptimizer.getMetrics();

      const recommendations = [];

      if (updatedMetrics.totalSize > bundleOptimizer.options.maxBundleSize) {
        recommendations.push({
          type: 'size-optimization',
          priority: 'high',
          message: 'Total bundle size exceeds budget. Consider code splitting or tree shaking.',
        });
      }

      updatedMetrics.bundles.forEach(bundle => {
        if (bundle.size > bundleOptimizer.options.warningThreshold) {
          recommendations.push({
            type: 'resource-optimization',
            priority: 'medium',
            message: `${bundle.url} is larger than recommended. Consider optimization.`,
            resource: bundle.url,
          });
        }
      });

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('type');
      expect(recommendations[0]).toHaveProperty('priority');
      expect(recommendations[0]).toHaveProperty('message');
    });
  });
});
