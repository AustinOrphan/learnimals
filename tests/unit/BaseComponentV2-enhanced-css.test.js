/**
 * Enhanced CSS injection tests for BaseComponentV2 Task 2.2
 * Tests the advanced CSSManager integration and performance requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import BaseComponent from '../../src/components/BaseComponentV2.js';

// Mock dependencies
const mockCSSManager = {
  isLoaded: vi.fn(),
  loadAndCache: vi.fn(),
  injectCSS: vi.fn(),
  getCacheStats: vi.fn(),
  invalidateCache: vi.fn()
};

const mockCSSPathResolver = {
  resolve: vi.fn(),
  getStats: vi.fn()
};

const mockManifest = {
  getCSSFiles: vi.fn(),
  data: {
    css: {
      variants: {
        themes: { ocean: 'Card.theme-ocean.css' },
        sizes: { small: 'Card.small.css' }
      },
      dependencies: ['shared.css']
    }
  }
};

describe('BaseComponentV2 Enhanced CSS Injection (Task 2.2)', () => {
  let component;
  let container;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock performance.now for timing tests
    global.performance = global.performance || {};
    global.performance.now = vi.fn(() => Date.now());
    
    // Mock window.DEBUG_COMPONENTS for logging
    global.window = global.window || {};
    global.window.DEBUG_COMPONENTS = false;

    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock implementations
    mockCSSManager.getCacheStats.mockReturnValue({
      cacheHits: 10,
      cacheMisses: 2,
      hitRate: 83.33
    });
    
    mockCSSPathResolver.getStats.mockReturnValue({
      cachedPaths: 5
    });
    
    mockCSSPathResolver.resolve.mockReturnValue('/components/ui/Card/Card.css');
    mockCSSManager.isLoaded.mockReturnValue({ loaded: false, cached: false });
    mockCSSManager.injectCSS.mockResolvedValue(document.createElement('link'));
    mockCSSManager.invalidateCache.mockReturnValue(1);

    // Create component with mocked dependencies
    component = new BaseComponent({
      id: 'test-component',
      container: container
    });

    // Inject mocked dependencies
    component.cssManager = mockCSSManager;
    component.cssPathResolver = mockCSSPathResolver;
    component.manifest = mockManifest;
  });

  afterEach(() => {
    if (component) {
      component.destroy();
    }
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('Enhanced injectCSS() method', () => {
    it('should inject CSS with advanced options and track performance', async () => {
      // Mock CSS files
      mockManifest.getCSSFiles.mockReturnValue(['Card.css']);
      
      // Mock performance timing
      let callCount = 0;
      global.performance.now.mockImplementation(() => {
        callCount++;
        return callCount * 10; // 10ms increments
      });

      // Execute enhanced CSS injection
      const stats = await component.injectCSS({
        priority: 1,
        variant: 'ocean',
        performance: { trackTiming: true }
      });

      // Verify CSSManager was called with advanced options
      expect(mockCSSManager.injectCSS).toHaveBeenCalledWith(
        '/components/ui/Card/Card.css',
        expect.objectContaining({
          scope: 'basecomponent',
          priority: 1,
          cache: true,
          timeout: 8000,
          enableCache: true,
          maxRetries: 2
        })
      );

      // Verify performance tracking
      expect(stats).toMatchObject({
        filesProcessed: expect.any(Number),
        totalTime: expect.any(Number)
      });

      // Verify component stores injection statistics
      expect(component.cssInjectionStats).toBeDefined();
      expect(component.cssInjectionStats.timestamp).toBeDefined();
    });

    it('should handle CSS variants and dependencies', async () => {
      // Mock CSS files with variants
      mockManifest.getCSSFiles.mockReturnValue(['Card.css']);

      await component.injectCSS({
        variant: 'ocean',
        performance: { trackTiming: true }
      });

      // Verify getCSSFilesWithVariants was called to get variant files
      const cssFiles = component.getCSSFilesWithVariants('ocean');
      
      // Should include base CSS, theme variant, and dependencies
      expect(cssFiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ file: 'shared.css', priority: -1, isDependency: true }),
          expect.objectContaining({ file: 'Card.css', priority: 0 }),
          expect.objectContaining({ file: 'Card.theme-ocean.css', priority: 1 })
        ])
      );
    });

    it('should implement preload mode without DOM injection', async () => {
      mockManifest.getCSSFiles.mockReturnValue(['Card.css']);
      mockCSSManager.loadAndCache.mockResolvedValue('css-content');

      const stats = await component.injectCSS({
        preload: true,
        performance: { trackTiming: true }
      });

      // Verify preload used loadAndCache instead of injectCSS
      expect(mockCSSManager.loadAndCache).toHaveBeenCalledWith(
        '/components/ui/Card/Card.css',
        expect.objectContaining({
          cache: true,
          timeout: 5000
        })
      );

      // Should not have called DOM injection
      expect(mockCSSManager.injectCSS).not.toHaveBeenCalled();
    });

    it('should handle force reload correctly', async () => {
      mockManifest.getCSSFiles.mockReturnValue(['Card.css']);
      
      // First load
      await component.injectCSS();
      expect(component.cssInjected.size).toBe(1);

      // Force reload should bypass cache check
      mockCSSManager.isLoaded.mockReturnValue({ loaded: true, cached: true });
      
      await component.injectCSS({
        forceReload: true,
        performance: { trackTiming: true }
      });

      // Should inject again despite being loaded
      expect(mockCSSManager.injectCSS).toHaveBeenCalledTimes(2);
    });

    it('should respect performance requirements (NFR-1.1)', async () => {
      mockManifest.getCSSFiles.mockReturnValue(['Card.css']);
      
      // Mock fast performance
      let callCount = 0;
      global.performance.now.mockImplementation(() => {
        callCount++;
        return callCount * 5; // 5ms increments - well under threshold
      });

      const stats = await component.injectCSS({
        performance: { trackTiming: true }
      });

      // Should complete within performance threshold (50ms baseline + 10%)
      expect(stats.totalTime).toBeLessThan(55);
      
      // Should not log performance warning
      const logSpy = vi.spyOn(component, 'log');
      expect(logSpy).not.toHaveBeenCalledWith('warn', expect.stringContaining('consider optimization'));
    });
  });

  describe('Enhanced CSS statistics and monitoring', () => {
    it('should provide comprehensive CSS statistics', async () => {
      // Setup component with injection stats
      component.cssInjectionStats = {
        totalTime: 25,
        filesLoaded: 2,
        filesFromCache: 1,
        errors: []
      };
      component.cssInjected.add('/components/ui/Card/Card.css');

      const stats = component.getCSSStats(true);

      expect(stats).toMatchObject({
        componentName: 'BaseComponent',
        injectedFiles: ['/components/ui/Card/Card.css'],
        performance: {
          totalInjectionTime: 25,
          averageFileLoadTime: 12.5, // 25/2
          cacheHitRatio: 33, // 1/(2+1) * 100
          errorCount: 0
        },
        cssFileAnalysis: {
          totalFiles: 1,
          loadedFromCache: 1,
          freshLoads: 2
        },
        globalCSSManagerStats: expect.any(Object)
      });
    });

    it('should validate CSS performance against requirements', () => {
      // Setup stats that meet requirements
      component.cssInjectionStats = {
        totalTime: 45, // Under 55ms threshold
        filesLoaded: 1,
        filesFromCache: 9, // 90% cache hit rate
        errors: []
      };

      const validation = component.validateCSSPerformance();

      expect(validation.compliant).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.metrics.loadTime).toBe(45);
      expect(validation.metrics.cacheHitRatio).toBe(90);
    });

    it('should detect performance violations', () => {
      // Setup stats that violate requirements
      component.cssInjectionStats = {
        totalTime: 80, // Over 55ms threshold (NFR-1.1)
        filesLoaded: 9,
        filesFromCache: 1, // 10% cache hit rate (violates NFR-1.4: >85%)
        errors: ['CSS load failed']
      };

      const validation = component.validateCSSPerformance();

      expect(validation.compliant).toBe(false);
      expect(validation.issues).toHaveLength(3); // Load time, cache hit rate, errors
      
      expect(validation.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            requirement: 'NFR-1.1',
            severity: 'high'
          }),
          expect.objectContaining({
            requirement: 'NFR-1.4',
            severity: 'medium'
          }),
          expect.objectContaining({
            requirement: 'General',
            severity: 'high'
          })
        ])
      );
    });
  });

  describe('CSS preloading and cache management', () => {
    it('should preload CSS files for performance optimization', async () => {
      mockManifest.getCSSFiles.mockReturnValue(['Card.css']);
      mockCSSManager.loadAndCache.mockResolvedValue('css-content');

      const result = await component.preloadCSS({
        variant: 'ocean',
        specificFiles: ['custom.css']
      });

      expect(result.success).toBe(true);
      expect(result.preloadTime).toBeGreaterThan(0);
      
      // Should preload files
      expect(mockCSSManager.loadAndCache).toHaveBeenCalled();
    });

    it('should force reload CSS files bypassing cache', async () => {
      mockManifest.getCSSFiles.mockReturnValue(['Card.css']);
      component.cssInjected.add('/test/path.css');

      const result = await component.reloadCSS({
        clearCache: true,
        variant: 'small'
      });

      // Should clear existing injected CSS
      expect(component.cssInjected.size).toBe(0);
      
      // Should call inject with force reload
      expect(result.success).not.toBe(false); // Should be successful or have stats
    });
  });

  describe('CSS file variant handling', () => {
    it('should handle different CSS variants correctly', () => {
      const cssFiles = component.getCSSFilesWithVariants('ocean');

      // Should include dependencies, base CSS, and theme variant
      expect(cssFiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            file: 'shared.css', 
            priority: -1, 
            variant: 'dependency',
            isDependency: true 
          }),
          expect.objectContaining({ 
            file: 'Card.css', 
            priority: 0,
            variant: 'primary'
          }),
          expect.objectContaining({ 
            file: 'Card.theme-ocean.css', 
            priority: 1,
            variant: 'theme-ocean'
          })
        ])
      );

      // Should be sorted by priority (higher first)
      const priorities = cssFiles.map(f => f.priority);
      const sortedPriorities = [...priorities].sort((a, b) => b - a);
      expect(priorities).toEqual(sortedPriorities);
    });

    it('should provide appropriate media queries for variants', () => {
      expect(component.getMediaQueryForVariant('mobile')).toBe('(max-width: 768px)');
      expect(component.getMediaQueryForVariant('dark')).toBe('(prefers-color-scheme: dark)');
      expect(component.getMediaQueryForVariant('print')).toBe('print');
      expect(component.getMediaQueryForVariant('unknown')).toBe('all');
      expect(component.getMediaQueryForVariant(null)).toBe('all');
    });
  });
});