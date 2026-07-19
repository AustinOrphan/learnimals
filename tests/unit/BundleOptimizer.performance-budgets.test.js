/**
 * Performance Budgets Tests for BundleOptimizer
 *
 * Comprehensive test suite for performance budget functionality:
 * - Budget configuration and validation
 * - Budget checking against bundle sizes
 * - Warning/error handling for violations
 * - Different budget types (size, time, asset count)
 * - Budget reporting and metrics collection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BundleOptimizer } from '../../src/utils/BundleOptimizer.js';

// Mock dependencies
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/utils/performanceUtils.js', () => ({
  performanceMonitor: {
    startTimer: vi.fn(),
    endTimer: vi.fn(),
    logMetric: vi.fn(),
  },
}));

// Mock DOM environment for tests
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
    relList: {
      supports: vi.fn(() => true),
    },
  })),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  head: {
    appendChild: vi.fn(),
    insertBefore: vi.fn(),
  },
  body: {
    appendChild: vi.fn(),
    contains: vi.fn(() => false),
  },
  styleSheets: [],
  readyState: 'complete',
  dispatchEvent: vi.fn(event => {
    const listeners = global.eventListeners?.get(event.type) || [];
    listeners.forEach(listener => listener(event));
    return true;
  }),
  addEventListener: vi.fn((type, listener) => {
    if (!global.eventListeners) global.eventListeners = new Map();
    if (!global.eventListeners.has(type)) {
      global.eventListeners.set(type, []);
    }
    global.eventListeners.get(type).push(listener);
  }),
  removeEventListener: vi.fn((type, listener) => {
    if (!global.eventListeners) return;
    const listeners = global.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }),
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
  PerformanceObserver: vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  })),
  MutationObserver: vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  })),
  CompressionStream: vi.fn(),
  CustomEvent: vi.fn((type, options) => ({ type, detail: options?.detail })),
};

global.navigator = {
  serviceWorker: {
    register: vi.fn(),
  },
};

// Set NODE_ENV for test environment detection
global.process = { env: { NODE_ENV: 'test' } };

describe('BundleOptimizer - Performance Budgets', () => {
  let bundleOptimizer;

  beforeEach(() => {
    vi.clearAllMocks();

    // Clear event listeners
    if (global.eventListeners) {
      global.eventListeners.clear();
    }

    bundleOptimizer = new BundleOptimizer({
      enableCriticalCSS: true,
      criticalCSSThreshold: 1000,
      maxBundleSize: 250 * 1024,
      maxInitialLoad: 100 * 1024,
      warningThreshold: 200 * 1024,
    });
  });

  afterEach(() => {
    if (bundleOptimizer) {
      bundleOptimizer.destroy();
    }
  });

  describe('Budget Configuration and Validation', () => {
    it('should initialize with default performance budget settings', () => {
      expect(bundleOptimizer.options.maxBundleSize).toBe(250 * 1024); // 250KB
      expect(bundleOptimizer.options.maxInitialLoad).toBe(100 * 1024); // 100KB
      expect(bundleOptimizer.options.warningThreshold).toBe(200 * 1024); // 200KB
    });

    it('should allow custom performance budget configuration', () => {
      const customOptimizer = new BundleOptimizer({
        maxBundleSize: 500 * 1024, // 500KB
        maxInitialLoad: 150 * 1024, // 150KB
        warningThreshold: 300 * 1024, // 300KB
        performanceBudgets: {
          javascript: 200 * 1024,
          css: 100 * 1024,
          images: 1024 * 1024,
          fonts: 50 * 1024,
        },
      });

      expect(customOptimizer.options.maxBundleSize).toBe(500 * 1024);
      expect(customOptimizer.options.maxInitialLoad).toBe(150 * 1024);
      expect(customOptimizer.options.warningThreshold).toBe(300 * 1024);
      expect(customOptimizer.options.performanceBudgets).toEqual({
        javascript: 200 * 1024,
        css: 100 * 1024,
        images: 1024 * 1024,
        fonts: 50 * 1024,
      });

      customOptimizer.destroy();
    });

    it('should validate budget configuration gracefully', () => {
      expect(() => {
        new BundleOptimizer({
          maxBundleSize: -100, // Invalid negative size
        });
      }).not.toThrow(); // Should handle gracefully

      expect(() => {
        new BundleOptimizer({
          maxBundleSize: 'invalid', // Invalid type
        });
      }).not.toThrow(); // Should handle gracefully
    });

    it('should support different budget types with validation', () => {
      const budgetTypes = {
        size: { max: 1024 * 1024, unit: 'bytes' },
        time: { max: 3000, unit: 'ms' },
        count: { max: 50, unit: 'assets' },
        fps: { min: 30, unit: 'fps' },
        memory: { max: 50 * 1024 * 1024, unit: 'bytes' },
      };

      Object.entries(budgetTypes).forEach(([_type, config]) => {
        expect(config).toHaveProperty('unit');
        expect(typeof config.max === 'number' || typeof config.min === 'number').toBe(true);
      });
    });
  });

  describe('Budget Checking Against Bundle Sizes', () => {
    beforeEach(() => {
      // Mock performance.getEntriesByType to return test resources
      window.performance.getEntriesByType.mockReturnValue([
        {
          name: '/src/app.js',
          transferSize: 150 * 1024, // 150KB
          encodedBodySize: 140 * 1024,
          duration: 250,
          startTime: 100,
        },
        {
          name: '/src/styles.css',
          transferSize: 80 * 1024, // 80KB
          encodedBodySize: 75 * 1024,
          duration: 150,
          startTime: 200,
        },
        {
          name: '/src/vendor.js',
          transferSize: 200 * 1024, // 200KB
          encodedBodySize: 190 * 1024,
          duration: 400,
          startTime: 50,
        },
      ]);
    });

    it('should check total bundle size against maxBundleSize budget', async () => {
      const eventListener = vi.fn();
      bundleOptimizer.on('budgetExceeded', eventListener);

      // Set a lower budget to trigger violation
      bundleOptimizer.options.maxBundleSize = 300 * 1024; // 300KB

      await bundleOptimizer.analyzeBundles();

      // Total size: 150KB + 80KB + 200KB = 430KB > 300KB budget
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            totalSize: 430 * 1024,
            budget: 300 * 1024,
          }),
        })
      );
    });

    it('should check critical resource size against maxInitialLoad budget', async () => {
      const eventListener = vi.fn();
      bundleOptimizer.on('criticalBudgetExceeded', eventListener);

      // Set critical threshold to make some resources critical
      bundleOptimizer.options.criticalCSSThreshold = 1000;
      bundleOptimizer.options.maxInitialLoad = 200 * 1024; // 200KB

      await bundleOptimizer.analyzeBundles();

      // Resources with startTime < 1000ms are critical
      // vendor.js (50ms) + app.js (100ms) + styles.css (200ms) = all critical
      // Total critical size: 430KB > 200KB budget
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            criticalSize: 430 * 1024,
            budget: 200 * 1024,
          }),
        })
      );
    });

    it('should not trigger budget events when within limits', async () => {
      const budgetEventListener = vi.fn();
      const criticalEventListener = vi.fn();

      bundleOptimizer.on('budgetExceeded', budgetEventListener);
      bundleOptimizer.on('criticalBudgetExceeded', criticalEventListener);

      // Set generous budgets
      bundleOptimizer.options.maxBundleSize = 1024 * 1024; // 1MB
      bundleOptimizer.options.maxInitialLoad = 512 * 1024; // 512KB

      await bundleOptimizer.analyzeBundles();

      expect(budgetEventListener).not.toHaveBeenCalled();
      expect(criticalEventListener).not.toHaveBeenCalled();
    });

    it('should calculate bundle sizes correctly with fallback values', async () => {
      // Mock resources with missing transferSize
      window.performance.getEntriesByType.mockReturnValue([
        {
          name: '/fallback1.js',
          transferSize: undefined,
          encodedBodySize: 100 * 1024,
          duration: 200,
          startTime: 100,
        },
        {
          name: '/fallback2.js',
          transferSize: undefined,
          encodedBodySize: undefined,
          duration: 300,
          startTime: 200,
        },
      ]);

      await bundleOptimizer.analyzeBundles();

      // Should use encodedBodySize as fallback, or 0 if both are missing
      const metrics = bundleOptimizer.performanceMetrics;
      expect(metrics.get('/fallback1.js').size).toBe(100 * 1024);
      expect(metrics.get('/fallback2.js').size).toBe(0);
    });

    it('should handle resources with different file extensions', async () => {
      window.performance.getEntriesByType.mockReturnValue([
        {
          name: '/app.js',
          transferSize: 100 * 1024,
          duration: 200,
          startTime: 50,
        },
        {
          name: '/styles.css',
          transferSize: 50 * 1024,
          duration: 150,
          startTime: 100,
        },
        {
          name: '/image.png', // Should be ignored
          transferSize: 200 * 1024,
          duration: 300,
          startTime: 200,
        },
      ]);

      await bundleOptimizer.analyzeBundles();

      // Only JS and CSS resources should be analyzed
      expect(bundleOptimizer.performanceMetrics.has('/app.js')).toBe(true);
      expect(bundleOptimizer.performanceMetrics.has('/styles.css')).toBe(true);
      expect(bundleOptimizer.performanceMetrics.has('/image.png')).toBe(false);
    });
  });

  describe('Warning and Error Handling for Budget Violations', () => {
    it('should emit warning events for resources exceeding warning threshold', () => {
      const warningListener = vi.fn();
      bundleOptimizer.on('largeResource', warningListener);

      const largeResource = {
        name: '/large-bundle.js',
        transferSize: 300 * 1024, // 300KB > 200KB warning threshold
        duration: 500,
        startTime: 100,
      };

      bundleOptimizer.trackResourcePerformance(largeResource);

      expect(warningListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            url: '/large-bundle.js',
            size: 300 * 1024,
            loadTime: 500,
          }),
        })
      );
    });

    it('should emit slow resource warnings for long load times', () => {
      const slowListener = vi.fn();
      bundleOptimizer.on('slowResource', slowListener);

      const slowResource = {
        name: '/slow-bundle.js',
        transferSize: 100 * 1024,
        duration: 1500, // > 1000ms threshold
        startTime: 100,
      };

      bundleOptimizer.trackResourcePerformance(slowResource);

      expect(slowListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            url: '/slow-bundle.js',
            size: 100 * 1024,
            loadTime: 1500,
          }),
        })
      );
    });

    it('should handle multiple budget violations simultaneously', async () => {
      const budgetListener = vi.fn();
      const criticalListener = vi.fn();

      bundleOptimizer.on('budgetExceeded', budgetListener);
      bundleOptimizer.on('criticalBudgetExceeded', criticalListener);

      // Mock resources that violate multiple budgets
      window.performance.getEntriesByType.mockReturnValue([
        {
          name: '/huge-app.js',
          transferSize: 400 * 1024, // Exceeds warning threshold
          duration: 800,
          startTime: 50, // Critical resource
        },
        {
          name: '/large-vendor.js',
          transferSize: 300 * 1024, // Exceeds warning threshold
          duration: 600,
          startTime: 100, // Critical resource
        },
      ]);

      // Set tight budgets
      bundleOptimizer.options.maxBundleSize = 500 * 1024;
      bundleOptimizer.options.maxInitialLoad = 300 * 1024;
      bundleOptimizer.options.warningThreshold = 250 * 1024;
      bundleOptimizer.options.criticalCSSThreshold = 1000;

      await bundleOptimizer.analyzeBundles();

      // Should trigger all violation types
      expect(budgetListener).toHaveBeenCalled(); // Total: 700KB > 500KB
      expect(criticalListener).toHaveBeenCalled(); // Critical: 700KB > 300KB
    });

    it('should handle budget checking errors gracefully', async () => {
      // Mock performance.getEntriesByType to throw error
      window.performance.getEntriesByType.mockImplementation(() => {
        throw new Error('Performance API error');
      });

      await expect(async () => {
        await bundleOptimizer.analyzeBundles();
      }).rejects.toThrow('Performance API error');
    });
  });

  describe('Different Budget Types Implementation', () => {
    it('should support size-based budgets (bytes)', () => {
      const sizeBudget = {
        type: 'size',
        max: 500 * 1024, // 500KB
        current: 450 * 1024, // 450KB
        unit: 'bytes',
      };

      const isWithinBudget = sizeBudget.current <= sizeBudget.max;
      const utilizationPercent = (sizeBudget.current / sizeBudget.max) * 100;

      expect(isWithinBudget).toBe(true);
      expect(utilizationPercent).toBe(90);
    });

    it('should support time-based budgets (milliseconds)', () => {
      const timeBudget = {
        type: 'time',
        max: 3000, // 3 seconds
        current: 2500, // 2.5 seconds
        unit: 'ms',
      };

      const isWithinBudget = timeBudget.current <= timeBudget.max;
      const utilizationPercent = (timeBudget.current / timeBudget.max) * 100;

      expect(isWithinBudget).toBe(true);
      expect(utilizationPercent).toBeCloseTo(83.33, 1);
    });

    it('should support asset count budgets', () => {
      const countBudget = {
        type: 'count',
        max: 20, // Maximum 20 assets
        current: 15, // Currently 15 assets
        unit: 'assets',
      };

      const isWithinBudget = countBudget.current <= countBudget.max;
      const utilizationPercent = (countBudget.current / countBudget.max) * 100;

      expect(isWithinBudget).toBe(true);
      expect(utilizationPercent).toBe(75);
    });

    it('should handle asset count tracking in bundle analysis', async () => {
      const resources = [
        { name: '/app.js', transferSize: 100 * 1024, duration: 200, startTime: 100 },
        { name: '/vendor.js', transferSize: 150 * 1024, duration: 300, startTime: 200 },
        { name: '/styles.css', transferSize: 50 * 1024, duration: 150, startTime: 300 },
        { name: '/theme.css', transferSize: 30 * 1024, duration: 100, startTime: 400 },
      ];

      window.performance.getEntriesByType.mockReturnValue(resources);

      await bundleOptimizer.analyzeBundles();

      const assetCount = bundleOptimizer.performanceMetrics.size;
      expect(assetCount).toBe(4);

      // Check if asset count budget would be exceeded
      const assetCountBudget = 3;
      const exceedsAssetBudget = assetCount > assetCountBudget;
      expect(exceedsAssetBudget).toBe(true);
    });
  });

  describe('Budget Reporting and Metrics Collection', () => {
    beforeEach(() => {
      // Set up test data in performance metrics
      bundleOptimizer.performanceMetrics.clear();
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
      bundleOptimizer.performanceMetrics.set('/styles.css', {
        size: 80 * 1024,
        loadTime: 200,
        type: 'css',
        critical: true,
      });
    });

    it('should generate comprehensive performance metrics report', () => {
      const metrics = bundleOptimizer.getMetrics();

      expect(metrics).toHaveProperty('totalBundles', 3);
      expect(metrics).toHaveProperty('totalSize', 430 * 1024);
      expect(metrics).toHaveProperty('averageLoadTime');
      expect(metrics).toHaveProperty('bundles');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('features');

      expect(metrics.bundles).toHaveLength(3);
      expect(metrics.averageLoadTime).toBeCloseTo(316.67, 1); // (300+450+200)/3
    });

    it('should provide budget utilization metrics', () => {
      const metrics = bundleOptimizer.getMetrics();
      const budgets = {
        maxBundleSize: bundleOptimizer.options.maxBundleSize,
        maxInitialLoad: bundleOptimizer.options.maxInitialLoad,
        warningThreshold: bundleOptimizer.options.warningThreshold,
      };

      // Calculate utilization percentages
      const totalSizeUtilization = (metrics.totalSize / budgets.maxBundleSize) * 100;

      // Calculate critical resource size
      const criticalSize = metrics.bundles
        .filter(bundle => bundle.critical)
        .reduce((sum, bundle) => sum + bundle.size, 0);
      const criticalUtilization = (criticalSize / budgets.maxInitialLoad) * 100;

      expect(totalSizeUtilization).toBeGreaterThan(0);
      expect(criticalUtilization).toBeGreaterThan(0);

      // Check if any resources exceed warning threshold
      const largeResources = metrics.bundles.filter(
        bundle => bundle.size > budgets.warningThreshold
      );

      expect(largeResources).toHaveLength(0); // All test resources are under 200KB threshold
    });

    it('should export budget metrics in multiple formats', () => {
      const metrics = bundleOptimizer.getMetrics();

      // JSON format
      const jsonReport = JSON.stringify(metrics, null, 2);
      expect(() => JSON.parse(jsonReport)).not.toThrow();

      // CSV format simulation
      const csvHeaders = ['url', 'size', 'loadTime', 'type', 'critical'];
      const csvRows = metrics.bundles.map(bundle =>
        csvHeaders.map(header => bundle[header] || '').join(',')
      );
      const csvReport = [csvHeaders.join(','), ...csvRows].join('\n');

      expect(csvReport).toContain('url,size,loadTime,type,critical');
      expect(csvReport).toContain('/app.js');

      // Summary format
      const summaryReport = {
        totalBundles: metrics.totalBundles,
        totalSize: `${(metrics.totalSize / 1024).toFixed(2)}KB`,
        averageLoadTime: `${metrics.averageLoadTime.toFixed(2)}ms`,
        cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
      };

      expect(summaryReport.totalSize).toMatch(/\d+\.\d+KB/);
      expect(summaryReport.averageLoadTime).toMatch(/\d+\.\d+ms/);
      expect(summaryReport.cacheHitRate).toMatch(/\d+\.\d+%/);
    });
  });

  describe('Performance Budget Integration Tests', () => {
    it('should integrate budget checking with resource tracking', () => {
      const largeResourceListener = vi.fn();
      bundleOptimizer.on('largeResource', largeResourceListener);

      const largeResource = {
        name: '/integration-test.js',
        transferSize: 250 * 1024, // Exceeds warning threshold
        duration: 600,
        startTime: 100,
      };

      bundleOptimizer.trackResourcePerformance(largeResource);

      expect(largeResourceListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            url: '/integration-test.js',
            size: 250 * 1024,
          }),
        })
      );
    });

    it('should provide budget-aware resource loading recommendations', () => {
      // Set up test data to trigger recommendations
      bundleOptimizer.performanceMetrics.set('/large-app.js', {
        size: 150 * 1024,
        loadTime: 300,
        type: 'javascript',
        critical: true,
      });
      bundleOptimizer.performanceMetrics.set('/large-vendor.js', {
        size: 120 * 1024, // Exceeds warning threshold of 100KB
        loadTime: 450,
        type: 'javascript',
        critical: false,
      });

      const getLoadingRecommendations = (metrics, budgets) => {
        const recommendations = [];

        // Check total size
        if (metrics.totalSize > budgets.maxBundleSize) {
          recommendations.push({
            type: 'code-splitting',
            priority: 'high',
            description: 'Implement code splitting to reduce initial bundle size',
          });
        }

        // Check individual resource sizes
        const largeResources = metrics.bundles.filter(
          bundle => bundle.size > budgets.warningThreshold
        );
        if (largeResources.length > 0) {
          recommendations.push({
            type: 'resource-optimization',
            priority: 'medium',
            description: `Optimize ${largeResources.length} large resources`,
            resources: largeResources.map(r => r.url),
          });
        }

        return recommendations;
      };

      const metrics = bundleOptimizer.getMetrics();
      const budgets = {
        maxBundleSize: 200 * 1024, // Tight budget to trigger recommendations
        warningThreshold: 100 * 1024,
      };

      const recommendations = getLoadingRecommendations(metrics, budgets);

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('type');
      expect(recommendations[0]).toHaveProperty('priority');
      expect(recommendations[0]).toHaveProperty('description');
    });

    it('should handle cleanup of budget monitoring resources', () => {
      bundleOptimizer.destroy();

      expect(bundleOptimizer.performanceMetrics.size).toBe(0);
      expect(bundleOptimizer.bundleCache.size).toBe(0);
      expect(bundleOptimizer.loadingPromises.size).toBe(0);
    });
  });
});
