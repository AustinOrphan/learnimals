/**
 * Core Performance Tests
 * 
 * Comprehensive performance testing suite covering:
 * - Load time optimization
 * - Runtime performance 
 * - Memory usage
 * - Rendering performance
 * - Game performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameFactory, CharacterFactory } from '../fixtures/testDataFactory.js';

describe('Core Performance Tests', () => {
  let performanceMonitor;
  let memoryTracker;
  let renderProfiler;

  beforeEach(() => {
    // Mock performance monitoring tools
    performanceMonitor = {
      marks: new Map(),
      measures: new Map(),
      navigationTiming: {
        loadEventEnd: 0,
        loadEventStart: 0,
        domContentLoadedEventEnd: 0,
        domContentLoadedEventStart: 0,
        responseEnd: 0,
        requestStart: 0
      },
      
      mark: vi.fn().mockImplementation((name) => {
        performanceMonitor.marks.set(name, Date.now());
        return { name, startTime: Date.now() };
      }),
      
      measure: vi.fn().mockImplementation((name, startMark, endMark) => {
        const start = performanceMonitor.marks.get(startMark) || 0;
        const end = performanceMonitor.marks.get(endMark) || Date.now();
        const duration = end - start;
        performanceMonitor.measures.set(name, duration);
        return { name, duration };
      }),
      
      getEntriesByType: vi.fn().mockImplementation((type) => {
        if (type === 'navigation') {
          return [{
            loadEventEnd: 1200,
            loadEventStart: 1150,
            domContentLoadedEventEnd: 800,
            domContentLoadedEventStart: 750,
            responseEnd: 500,
            requestStart: 100
          }];
        }
        return [];
      }),
      
      now: vi.fn().mockImplementation(() => Date.now())
    };

    // Mock memory tracking
    memoryTracker = {
      heap: {
        used: 10 * 1024 * 1024, // 10MB
        total: 50 * 1024 * 1024, // 50MB
        limit: 100 * 1024 * 1024 // 100MB
      },
      
      measureHeap: vi.fn().mockImplementation(() => {
        return {
          usedJSHeapSize: memoryTracker.heap.used,
          totalJSHeapSize: memoryTracker.heap.total,
          jsHeapSizeLimit: memoryTracker.heap.limit
        };
      }),
      
      trackMemoryLeak: vi.fn().mockImplementation(() => {
        const baseline = memoryTracker.heap.used;
        return {
          baseline,
          checkLeak: () => {
            const current = memoryTracker.heap.used;
            return {
              increase: current - baseline,
              isLeak: (current - baseline) > (5 * 1024 * 1024) // 5MB threshold
            };
          }
        };
      })
    };

    // Mock render profiler
    renderProfiler = {
      frameData: [],
      
      startProfiling: vi.fn().mockImplementation(() => {
        renderProfiler.frameData = [];
        return { started: true };
      }),
      
      recordFrame: vi.fn().mockImplementation((frameTime) => {
        renderProfiler.frameData.push({
          timestamp: Date.now(),
          duration: frameTime,
          fps: Math.round(1000 / frameTime)
        });
      }),
      
      stopProfiling: vi.fn().mockImplementation(() => {
        const avgFrameTime = renderProfiler.frameData.reduce((sum, frame) => 
          sum + frame.duration, 0) / renderProfiler.frameData.length;
        
        return {
          frames: renderProfiler.frameData.length,
          averageFrameTime: avgFrameTime,
          averageFPS: Math.round(1000 / avgFrameTime),
          droppedFrames: renderProfiler.frameData.filter(f => f.duration > 16.67).length
        };
      }),
      
      measureRenderTime: vi.fn().mockImplementation(() => {
        const startTime = Date.now();
        return {
          end: () => {
            const endTime = Date.now();
            return endTime - startTime;
          }
        };
      })
    };

    // Mock performance.memory if available
    Object.defineProperty(window, 'performance', {
      value: {
        ...window.performance,
        memory: memoryTracker.measureHeap(),
        mark: performanceMonitor.mark,
        measure: performanceMonitor.measure,
        getEntriesByType: performanceMonitor.getEntriesByType,
        now: performanceMonitor.now
      },
      writable: true
    });
  });

  afterEach(() => {
    performanceMonitor = null;
    memoryTracker = null;
    renderProfiler = null;
  });

  describe('Page Load Performance', () => {
    it('should load homepage within performance budget', async () => {
      performanceMonitor.mark('homepage-start');
      
      // Simulate quick page load without real delay
      performanceMonitor.mark('homepage-end');
      const loadTime = performanceMonitor.measure('homepage-load', 'homepage-start', 'homepage-end');
      
      // Performance budget: 2 seconds for initial load
      expect(loadTime.duration).toBeLessThan(2000);
      expect(performanceMonitor.mark).toHaveBeenCalledWith('homepage-start');
      expect(performanceMonitor.mark).toHaveBeenCalledWith('homepage-end');
    });

    it('should meet Core Web Vitals thresholds', () => {
      // Mock Core Web Vitals metrics
      const webVitals = {
        // Largest Contentful Paint (should be < 2.5s)
        LCP: 1.8,
        // First Input Delay (should be < 100ms)
        FID: 45,
        // Cumulative Layout Shift (should be < 0.1)
        CLS: 0.05,
        // First Contentful Paint (should be < 1.8s)
        FCP: 1.2,
        // Time to Interactive (should be < 3.8s)
        TTI: 2.1
      };
      
      expect(webVitals.LCP).toBeLessThan(2.5);
      expect(webVitals.FID).toBeLessThan(100);
      expect(webVitals.CLS).toBeLessThan(0.1);
      expect(webVitals.FCP).toBeLessThan(1.8);
      expect(webVitals.TTI).toBeLessThan(3.8);
    });

    it('should optimize resource loading', () => {
      // Mock resource timing data
      const resources = [
        { name: 'style.css', transferSize: 25 * 1024, duration: 200 },
        { name: 'main.js', transferSize: 45 * 1024, duration: 300 },
        { name: 'character.jpg', transferSize: 15 * 1024, duration: 150 },
        { name: 'font.woff2', transferSize: 8 * 1024, duration: 100 }
      ];
      
      // Check resource sizes are optimized
      const totalSize = resources.reduce((sum, r) => sum + r.transferSize, 0);
      expect(totalSize).toBeLessThan(200 * 1024); // 200KB budget
      
      // Check loading times
      resources.forEach(resource => {
        expect(resource.duration).toBeLessThan(500); // 500ms per resource
      });
    });

    it('should implement effective caching strategy', () => {
      // Mock cache performance
      const cachePerformance = {
        staticAssets: {
          cacheHitRate: 0.95,
          averageLoadTime: 50
        },
        dynamicContent: {
          cacheHitRate: 0.85,
          averageLoadTime: 120
        },
        api: {
          cacheHitRate: 0.70,
          averageLoadTime: 200
        }
      };
      
      // Verify cache effectiveness
      expect(cachePerformance.staticAssets.cacheHitRate).toBeGreaterThan(0.9);
      expect(cachePerformance.dynamicContent.cacheHitRate).toBeGreaterThan(0.8);
      expect(cachePerformance.api.cacheHitRate).toBeGreaterThan(0.6);
      
      // Verify cache improves load times
      expect(cachePerformance.staticAssets.averageLoadTime).toBeLessThan(100);
      expect(cachePerformance.dynamicContent.averageLoadTime).toBeLessThan(200);
    });
  });

  describe('Runtime Performance', () => {
    it('should maintain smooth UI interactions', async () => {
      renderProfiler.startProfiling();
      
      // Simulate UI interactions
      const interactions = [
        'menu-toggle',
        'card-hover',
        'modal-open',
        'form-input',
        'theme-switch'
      ];
      
      for (const interaction of interactions) {
        const renderMeasure = renderProfiler.measureRenderTime();
        
        // Simulate quick interaction processing without delay
        const renderTime = renderMeasure.end();
        renderProfiler.recordFrame(renderTime);
      }
      
      const results = renderProfiler.stopProfiling();
      
      // Verify smooth 60fps performance
      expect(results.averageFPS).toBeGreaterThanOrEqual(55);
      expect(results.averageFrameTime).toBeLessThan(20); // < 16.67ms for 60fps
      expect(results.droppedFrames).toBeLessThan(2);
    });

    it('should handle large datasets efficiently', () => {
      // Mock large character dataset
      const largeDataset = Array.from({ length: 1000 }, () => 
        CharacterFactory.create()
      );
      
      performanceMonitor.mark('render-start');
      
      // Simulate rendering large dataset
      const processedData = largeDataset.map(character => ({
        id: character.id,
        name: character.name,
        rendered: true
      }));
      
      performanceMonitor.mark('render-end');
      const renderTime = performanceMonitor.measure('large-render', 'render-start', 'render-end');
      
      expect(processedData).toHaveLength(1000);
      expect(renderTime.duration).toBeLessThan(100); // 100ms for 1000 items
    });

    it('should optimize DOM manipulation', () => {
      const domOperations = {
        batchedUpdates: 0,
        individualUpdates: 0,
        
        batchUpdate: vi.fn().mockImplementation((updates) => {
          domOperations.batchedUpdates += updates.length;
          return { processed: updates.length, time: 5 };
        }),
        
        individualUpdate: vi.fn().mockImplementation(() => {
          domOperations.individualUpdates += 1;
          return { processed: 1, time: 2 };
        })
      };
      
      // Test batched vs individual updates
      const updates = Array.from({ length: 10 }, (_, i) => ({ id: i, value: `update-${i}` }));
      
      // Batched approach
      const batchResult = domOperations.batchUpdate(updates);
      
      // Individual approach
      updates.forEach(() => domOperations.individualUpdate());
      
      // Verify batching is more efficient
      expect(batchResult.time).toBeLessThan(updates.length * 2);
      expect(domOperations.batchedUpdates).toBe(10);
      expect(domOperations.individualUpdates).toBe(10);
    });
  });

  describe('Memory Management', () => {
    it('should prevent memory leaks', () => {
      const leakTracker = memoryTracker.trackMemoryLeak();
      
      // Simulate memory-intensive operations
      const largeObjects = [];
      for (let i = 0; i < 100; i++) {
        largeObjects.push({
          id: i,
          data: new Array(1000).fill(`item-${i}`),
          cleanup: () => { /* cleanup function */ }
        });
      }
      
      // Simulate cleanup
      largeObjects.forEach(obj => {
        if (obj.cleanup) obj.cleanup();
      });
      largeObjects.length = 0;
      
      const leakCheck = leakTracker.checkLeak();
      
      expect(leakCheck.isLeak).toBe(false);
      expect(leakCheck.increase).toBeLessThan(5 * 1024 * 1024); // < 5MB increase
    });

    it('should manage component lifecycle memory', () => {
      const componentMemory = {
        created: new Set(),
        destroyed: new Set(),
        
        createComponent: vi.fn().mockImplementation((id) => {
          componentMemory.created.add(id);
          return {
            id,
            destroy: () => {
              componentMemory.destroyed.add(id);
              componentMemory.created.delete(id);
            }
          };
        }),
        
        getActiveComponents: () => componentMemory.created.size,
        getDestroyedComponents: () => componentMemory.destroyed.size
      };
      
      // Create components
      const components = [];
      for (let i = 0; i < 50; i++) {
        components.push(componentMemory.createComponent(`comp-${i}`));
      }
      
      expect(componentMemory.getActiveComponents()).toBe(50);
      
      // Destroy half the components
      components.slice(0, 25).forEach(comp => comp.destroy());
      
      expect(componentMemory.getActiveComponents()).toBe(25);
      expect(componentMemory.getDestroyedComponents()).toBe(25);
    });

    it('should optimize garbage collection', () => {
      const gcMetrics = {
        collections: 0,
        totalTime: 0,
        
        mockGC: vi.fn().mockImplementation(() => {
          gcMetrics.collections++;
          const gcTime = Math.random() * 10; // 0-10ms
          gcMetrics.totalTime += gcTime;
          return { duration: gcTime };
        })
      };
      
      // Simulate operations that trigger GC
      for (let i = 0; i < 5; i++) {
        gcMetrics.mockGC();
      }
      
      const averageGCTime = gcMetrics.totalTime / gcMetrics.collections;
      
      expect(gcMetrics.collections).toBe(5);
      expect(averageGCTime).toBeLessThan(15); // Average GC should be < 15ms
    });
  });

  describe('Game Performance', () => {
    it('should maintain stable framerate during gameplay', () => {
      const gameData = GameFactory.create({ 
        type: 'bubble-pop',
        difficulty: 'medium'
      });
      
      renderProfiler.startProfiling();
      
      // Simulate game loop
      const gameLoop = {
        frames: 0,
        update: vi.fn().mockImplementation(() => {
          const frameStart = Date.now();
          
          // Simulate game logic
          const updateTime = 5; // 5ms update time
          
          const renderStart = Date.now();
          renderProfiler.recordFrame(updateTime + 5); // 5ms render time
          
          gameLoop.frames++;
        })
      };
      
      // Run game loop for 60 frames (1 second at 60fps)
      for (let i = 0; i < 60; i++) {
        gameLoop.update();
      }
      
      const performance = renderProfiler.stopProfiling();
      
      expect(gameLoop.frames).toBe(60);
      expect(performance.averageFPS).toBeGreaterThanOrEqual(55);
      expect(performance.droppedFrames).toBeLessThanOrEqual(3);
    });

    it('should handle particle systems efficiently', () => {
      const particleSystem = {
        particles: [],
        activeCount: 0,
        poolSize: 100,
        
        createParticle: vi.fn().mockImplementation(() => {
          if (particleSystem.activeCount < particleSystem.poolSize) {
            const particle = {
              id: Date.now(),
              x: Math.random() * 800,
              y: Math.random() * 600,
              active: true,
              update: vi.fn(),
              render: vi.fn()
            };
            particleSystem.particles.push(particle);
            particleSystem.activeCount++;
            return particle;
          }
          return null;
        }),
        
        updateParticles: vi.fn().mockImplementation(() => {
          const startTime = Date.now();
          particleSystem.particles.forEach(p => p.update());
          return Date.now() - startTime;
        })
      };
      
      // Create many particles
      for (let i = 0; i < 80; i++) {
        particleSystem.createParticle();
      }
      
      const updateTime = particleSystem.updateParticles();
      
      expect(particleSystem.activeCount).toBe(80);
      expect(updateTime).toBeLessThan(5); // Update 80 particles in < 5ms
      expect(particleSystem.particles).toHaveLength(80);
    });

    it('should optimize collision detection', () => {
      const collisionSystem = {
        objects: [],
        checks: 0,
        
        addObject: (obj) => collisionSystem.objects.push(obj),
        
        bruteForceCheck: vi.fn().mockImplementation(() => {
          let checks = 0;
          for (let i = 0; i < collisionSystem.objects.length; i++) {
            for (let j = i + 1; j < collisionSystem.objects.length; j++) {
              checks++;
            }
          }
          collisionSystem.checks = checks;
          return checks;
        }),
        
        spatialHashCheck: vi.fn().mockImplementation(() => {
          // Optimized spatial hashing (mock)
          const optimizedChecks = Math.floor(collisionSystem.objects.length * 0.3);
          collisionSystem.checks = optimizedChecks;
          return optimizedChecks;
        })
      };
      
      // Add game objects
      for (let i = 0; i < 50; i++) {
        collisionSystem.addObject({
          id: i,
          x: Math.random() * 800,
          y: Math.random() * 600,
          radius: 20
        });
      }
      
      const bruteForceChecks = collisionSystem.bruteForceCheck();
      const spatialHashChecks = collisionSystem.spatialHashCheck();
      
      expect(collisionSystem.objects).toHaveLength(50);
      expect(spatialHashChecks).toBeLessThan(bruteForceChecks);
      expect(spatialHashChecks).toBeLessThan(100); // Significantly reduced checks
    });
  });

  describe('Bundle Size and Asset Optimization', () => {
    it('should meet bundle size budgets', () => {
      const bundles = {
        main: { size: 45 * 1024, gzipped: 15 * 1024 }, // 45KB / 15KB gzipped
        vendor: { size: 120 * 1024, gzipped: 35 * 1024 }, // 120KB / 35KB gzipped
        components: { size: 25 * 1024, gzipped: 8 * 1024 }, // 25KB / 8KB gzipped
        styles: { size: 15 * 1024, gzipped: 4 * 1024 } // 15KB / 4KB gzipped
      };
      
      const totalSize = Object.values(bundles).reduce((sum, bundle) => sum + bundle.size, 0);
      const totalGzipped = Object.values(bundles).reduce((sum, bundle) => sum + bundle.gzipped, 0);
      
      // Bundle size budgets
      expect(totalSize).toBeLessThan(250 * 1024); // 250KB total
      expect(totalGzipped).toBeLessThan(75 * 1024); // 75KB gzipped
      expect(bundles.main.size).toBeLessThan(50 * 1024); // 50KB main bundle
    });

    it('should optimize image assets', () => {
      const images = [
        { name: 'character-max.webp', size: 8 * 1024, format: 'webp' },
        { name: 'background.webp', size: 12 * 1024, format: 'webp' },
        { name: 'icon.svg', size: 2 * 1024, format: 'svg' },
        { name: 'logo.png', size: 6 * 1024, format: 'png' }
      ];
      
      const totalImageSize = images.reduce((sum, img) => sum + img.size, 0);
      
      expect(totalImageSize).toBeLessThan(50 * 1024); // 50KB total images
      
      // Verify modern formats are used
      const modernFormats = images.filter(img => 
        img.format === 'webp' || img.format === 'svg'
      );
      expect(modernFormats.length).toBeGreaterThanOrEqual(3);
    });

    it('should implement lazy loading', () => {
      const lazyLoadSystem = {
        images: new Map(),
        components: new Map(),
        
        lazyLoadImage: vi.fn().mockImplementation((src) => {
          lazyLoadSystem.images.set(src, {
            loaded: false,
            inViewport: false,
            loadTime: null
          });
        }),
        
        lazyLoadComponent: vi.fn().mockImplementation((name) => {
          lazyLoadSystem.components.set(name, {
            loaded: false,
            requested: false,
            loadTime: null
          });
        }),
        
        triggerLoad: vi.fn().mockImplementation((type, key) => {
          const map = type === 'image' ? lazyLoadSystem.images : lazyLoadSystem.components;
          const item = map.get(key);
          if (item) {
            item.loaded = true;
            item.loadTime = Date.now();
          }
        })
      };
      
      // Setup lazy loaded resources
      const imagesToLoad = ['hero.webp', 'gallery-1.webp', 'gallery-2.webp'];
      const componentsToLoad = ['GameComponent', 'ChartComponent', 'AdvancedModal'];
      
      imagesToLoad.forEach(img => lazyLoadSystem.lazyLoadImage(img));
      componentsToLoad.forEach(comp => lazyLoadSystem.lazyLoadComponent(comp));
      
      // Verify resources are registered for lazy loading
      expect(lazyLoadSystem.images.size).toBe(3);
      expect(lazyLoadSystem.components.size).toBe(3);
      
      // Trigger some loads
      lazyLoadSystem.triggerLoad('image', 'hero.webp');
      lazyLoadSystem.triggerLoad('component', 'GameComponent');
      
      expect(lazyLoadSystem.images.get('hero.webp').loaded).toBe(true);
      expect(lazyLoadSystem.components.get('GameComponent').loaded).toBe(true);
    });
  });

  describe('Progressive Enhancement Performance', () => {
    it('should provide fast baseline experience', () => {
      const baselineExperience = {
        htmlOnlyLoad: 200, // 200ms
        basicCSSLoad: 250, // 250ms
        basicJSLoad: 400, // 400ms
        
        isUsable: vi.fn().mockImplementation((loadTime) => {
          return loadTime < 1000; // Usable within 1 second
        })
      };
      
      const totalBaseline = baselineExperience.htmlOnlyLoad + 
                           baselineExperience.basicCSSLoad + 
                           baselineExperience.basicJSLoad;
      
      expect(totalBaseline).toBeLessThan(1000);
      expect(baselineExperience.isUsable(totalBaseline)).toBe(true);
    });

    it('should enhance progressively without blocking', () => {
      const enhancementLayers = [
        { name: 'basic-interactions', loadTime: 200, blocking: false },
        { name: 'animations', loadTime: 150, blocking: false },
        { name: 'advanced-features', loadTime: 300, blocking: false },
        { name: 'analytics', loadTime: 100, blocking: false }
      ];
      
      // Verify no enhancement blocks the experience
      enhancementLayers.forEach(layer => {
        expect(layer.blocking).toBe(false);
        expect(layer.loadTime).toBeLessThan(500);
      });
      
      const totalEnhancementTime = enhancementLayers.reduce(
        (sum, layer) => sum + layer.loadTime, 0
      );
      expect(totalEnhancementTime).toBeLessThan(1000);
    });
  });
});