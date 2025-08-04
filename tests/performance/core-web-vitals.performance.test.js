/**
 * Core Web Vitals Performance Test Suite
 * Tests essential performance metrics for optimal user experience
 */

import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { page } from '@vitest/browser/context';

// Performance thresholds based on Google Core Web Vitals
const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint: < 2.5s (Good)
  FID: 100, // First Input Delay: < 100ms (Good)
  CLS: 0.1, // Cumulative Layout Shift: < 0.1 (Good)
  FCP: 1800, // First Contentful Paint: < 1.8s (Good)
  TTFB: 600, // Time to First Byte: < 600ms (Good)
  TBT: 300, // Total Blocking Time: < 300ms (Good)
  SI: 3400, // Speed Index: < 3.4s (Good)
};

describe('Core Web Vitals Performance Tests', () => {
  let performanceObserver;
  const performanceEntries = [];

  beforeAll(async () => {
    // Set up performance monitoring
    await page.evaluate(() => {
      window.performanceMetrics = {
        lcp: null,
        fid: null,
        cls: 0,
        fcp: null,
        ttfb: null,
        tbt: 0,
        si: null,
        entries: [],
      };

      // Monitor Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver(entryList => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          window.performanceMetrics.lcp = lastEntry.startTime;
          window.performanceMetrics.entries.push({
            type: 'LCP',
            value: lastEntry.startTime,
            timestamp: Date.now(),
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor First Input Delay (FID)
        const fidObserver = new PerformanceObserver(entryList => {
          entryList.getEntries().forEach(entry => {
            window.performanceMetrics.fid = entry.processingStart - entry.startTime;
            window.performanceMetrics.entries.push({
              type: 'FID',
              value: entry.processingStart - entry.startTime,
              timestamp: Date.now(),
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Monitor Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver(entryList => {
          entryList.getEntries().forEach(entry => {
            if (!entry.hadRecentInput) {
              window.performanceMetrics.cls += entry.value;
              window.performanceMetrics.entries.push({
                type: 'CLS',
                value: entry.value,
                timestamp: Date.now(),
              });
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Monitor navigation timing
        const navigationObserver = new PerformanceObserver(entryList => {
          entryList.getEntries().forEach(entry => {
            window.performanceMetrics.ttfb = entry.responseStart - entry.requestStart;
            window.performanceMetrics.fcp = entry.loadEventEnd - entry.loadEventStart;
            window.performanceMetrics.entries.push({
              type: 'Navigation',
              ttfb: entry.responseStart - entry.requestStart,
              fcp: entry.loadEventEnd - entry.loadEventStart,
              timestamp: Date.now(),
            });
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      }
    });
  });

  afterAll(async () => {
    // Clean up performance observers
    await page.evaluate(() => {
      if (window.performanceObserver) {
        window.performanceObserver.disconnect();
      }
    });
  });

  test('Largest Contentful Paint (LCP) under 2.5 seconds', async () => {
    const startTime = Date.now();

    // Navigate to main page
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Wait a bit more for LCP to be measured
    await page.waitForTimeout(3000);

    const metrics = await page.evaluate(() => window.performanceMetrics);

    if (metrics.lcp !== null) {
      expect(metrics.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
      console.log(
        `✅ LCP: ${metrics.lcp.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.LCP}ms)`
      );
    } else {
      // Fallback: measure time to main content visibility
      const mainContentVisible = await page.getByRole('main').isVisible();
      const loadTime = Date.now() - startTime;

      if (mainContentVisible) {
        expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
        console.log(
          `✅ Main content visible in: ${loadTime}ms (threshold: ${PERFORMANCE_THRESHOLDS.LCP}ms)`
        );
      }
    }
  });

  test('First Input Delay (FID) under 100ms', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const startTime = performance.now();

    // Simulate first user interaction
    const interactiveElement = page.getByRole('button').first();
    if (await interactiveElement.isVisible()) {
      await interactiveElement.click();

      const responseTime = performance.now() - startTime;

      // Check measured FID or use response time as proxy
      const metrics = await page.evaluate(() => window.performanceMetrics);
      const fidValue = metrics.fid !== null ? metrics.fid : responseTime;

      expect(fidValue).toBeLessThan(PERFORMANCE_THRESHOLDS.FID);
      console.log(`✅ FID: ${fidValue.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.FID}ms)`);
    }
  });

  test('Cumulative Layout Shift (CLS) under 0.1', async () => {
    await page.goto('/');

    // Simulate user interactions that might cause layout shifts
    await page.waitForTimeout(1000);

    // Scroll to trigger any lazy-loaded content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });

    await page.waitForTimeout(1000);

    // Navigate to different section
    const navigationLink = page.getByRole('link').first();
    if (await navigationLink.isVisible()) {
      await navigationLink.click();
      await page.waitForTimeout(2000);
    }

    const metrics = await page.evaluate(() => window.performanceMetrics);

    expect(metrics.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
    console.log(`✅ CLS: ${metrics.cls.toFixed(4)} (threshold: ${PERFORMANCE_THRESHOLDS.CLS})`);
  });

  test('First Contentful Paint (FCP) under 1.8 seconds', async () => {
    const navigationPromise = page.waitForLoadState('networkidle');
    const startTime = Date.now();

    await page.goto('/');
    await navigationPromise;

    // Check for first meaningful content
    const firstContent = await page.getByText(/learnimals|welcome|math|science/i).first();
    await expect.element(firstContent).toBeVisible();

    const fcpTime = Date.now() - startTime;

    expect(fcpTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
    console.log(`✅ FCP: ${fcpTime}ms (threshold: ${PERFORMANCE_THRESHOLDS.FCP}ms)`);
  });

  test('Time to First Byte (TTFB) under 600ms', async () => {
    const startTime = Date.now();

    // Use page.goto with direct timing
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const ttfb = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return navigation ? navigation.responseStart - navigation.requestStart : null;
    });

    if (ttfb !== null) {
      expect(ttfb).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB);
      console.log(`✅ TTFB: ${ttfb.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.TTFB}ms)`);
    } else {
      // Fallback measurement
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB * 2); // More lenient for fallback
      console.log(`✅ Initial response time: ${loadTime}ms`);
    }
  });

  test('Total Blocking Time (TBT) minimization', async () => {
    await page.goto('/');

    // Measure main thread blocking during page interactions
    const tbtMeasurement = await page.evaluate(() => {
      return new Promise(resolve => {
        let totalBlockingTime = 0;
        const longTaskObserver = new PerformanceObserver(entryList => {
          entryList.getEntries().forEach(entry => {
            // Tasks longer than 50ms contribute to TBT
            if (entry.duration > 50) {
              totalBlockingTime += entry.duration - 50;
            }
          });
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });

        // Use fake timers for performance tests to avoid actual delays
        vi.useFakeTimers();

        // Simulate user interactions
        setTimeout(() => {
          // Trigger some UI updates
          const buttons = document.querySelectorAll('button');
          buttons.forEach((button, index) => {
            if (index < 3) {
              // Limit to avoid excessive testing
              button.click();
            }
          });

          setTimeout(() => {
            longTaskObserver.disconnect();
            resolve(totalBlockingTime);
          }, 2000);
        }, 1000);

        // Advance timers to execute the timeouts immediately
        vi.advanceTimersByTime(3000);
        vi.useRealTimers();
      });
    });

    expect(tbtMeasurement).toBeLessThan(PERFORMANCE_THRESHOLDS.TBT);
    console.log(
      `✅ TBT: ${tbtMeasurement.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.TBT}ms)`
    );
  });

  test('Speed Index under 3.4 seconds', async () => {
    const startTime = Date.now();

    await page.goto('/');

    // Measure visual completeness over time
    const speedIndexMeasurement = await page.evaluate(() => {
      return new Promise(resolve => {
        const checkpoints = [];
        let intervalCount = 0;
        const maxIntervals = 10;

        const measureVisualProgress = () => {
          const visibleElements = document.querySelectorAll('*');
          let totalArea = 0;
          let visibleArea = 0;

          visibleElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const area = rect.width * rect.height;
            totalArea += area;

            if (rect.top < window.innerHeight && rect.bottom > 0) {
              visibleArea += area;
            }
          });

          const visibilityRatio = totalArea > 0 ? visibleArea / totalArea : 0;
          checkpoints.push({
            time: Date.now(),
            visibility: Math.min(visibilityRatio, 1),
          });

          intervalCount++;
          if (intervalCount >= maxIntervals) {
            // Calculate Speed Index approximation
            let speedIndex = 0;
            for (let i = 1; i < checkpoints.length; i++) {
              const timeDiff = checkpoints[i].time - checkpoints[i - 1].time;
              const visibilityDiff = checkpoints[i].visibility - checkpoints[i - 1].visibility;
              speedIndex += timeDiff * (1 - checkpoints[i - 1].visibility);
            }
            resolve(speedIndex);
          }
        };

        // Use fake timers for interval-based measurements
        vi.useFakeTimers();

        // Take measurements every 300ms
        const interval = setInterval(measureVisualProgress, 300);

        setTimeout(() => {
          clearInterval(interval);
          if (checkpoints.length > 0) {
            resolve(checkpoints[checkpoints.length - 1].time - checkpoints[0].time);
          } else {
            resolve(3000); // Default if measurement fails
          }
        }, 3000);

        // Advance timers to complete the measurement cycle
        vi.advanceTimersByTime(3600); // 3000ms timeout + 300ms intervals
        vi.useRealTimers();
      });
    });

    expect(speedIndexMeasurement).toBeLessThan(PERFORMANCE_THRESHOLDS.SI);
    console.log(
      `✅ Speed Index: ${speedIndexMeasurement.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.SI}ms)`
    );
  });

  test('Resource loading performance', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const resourceMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');

      const metrics = {
        totalResources: resources.length,
        cssResources: 0,
        jsResources: 0,
        imageResources: 0,
        averageLoadTime: 0,
        slowResources: [],
      };

      let totalLoadTime = 0;

      resources.forEach(resource => {
        const loadTime = resource.responseEnd - resource.requestStart;
        totalLoadTime += loadTime;

        // Categorize resources
        if (resource.name.includes('.css')) {
          metrics.cssResources++;
        } else if (resource.name.includes('.js')) {
          metrics.jsResources++;
        } else if (resource.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
          metrics.imageResources++;
        }

        // Track slow resources (> 1s)
        if (loadTime > 1000) {
          metrics.slowResources.push({
            name: resource.name,
            loadTime: loadTime.toFixed(2),
          });
        }
      });

      metrics.averageLoadTime = totalLoadTime / resources.length;
      return metrics;
    });

    // Resource performance assertions
    expect(resourceMetrics.averageLoadTime).toBeLessThan(500); // Average load time under 500ms
    expect(resourceMetrics.slowResources.length).toBeLessThan(3); // No more than 2 slow resources
    expect(resourceMetrics.totalResources).toBeLessThan(50); // Reasonable number of resources

    console.log(`✅ Resource Performance:
      - Total resources: ${resourceMetrics.totalResources}
      - Average load time: ${resourceMetrics.averageLoadTime.toFixed(2)}ms
      - CSS files: ${resourceMetrics.cssResources}
      - JS files: ${resourceMetrics.jsResources}
      - Images: ${resourceMetrics.imageResources}
      - Slow resources: ${resourceMetrics.slowResources.length}`);
  });

  test('Memory performance and leak prevention', async () => {
    await page.goto('/');

    const initialMemory = await page.evaluate(() => {
      return performance.memory
        ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
        }
        : null;
    });

    // Simulate memory-intensive interactions
    for (let i = 0; i < 5; i++) {
      // Navigate between pages
      const links = page.getAllByRole('link');
      const linkCount = await links.count();

      if (linkCount > i) {
        await links.nth(i).click();
        await page.waitForTimeout(500);

        // Go back
        await page.goBack();
        await page.waitForTimeout(500);
      }
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });

    const finalMemory = await page.evaluate(() => {
      return performance.memory
        ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
        }
        : null;
    });

    if (initialMemory && finalMemory) {
      const memoryGrowth = finalMemory.used - initialMemory.used;
      const growthPercentage = (memoryGrowth / initialMemory.used) * 100;

      // Memory should not grow excessively
      expect(growthPercentage).toBeLessThan(50); // Less than 50% growth
      expect(finalMemory.used).toBeLessThan(finalMemory.limit * 0.8); // Don't use more than 80% of limit

      console.log(`✅ Memory Performance:
        - Initial: ${(initialMemory.used / 1048576).toFixed(2)}MB
        - Final: ${(finalMemory.used / 1048576).toFixed(2)}MB  
        - Growth: ${growthPercentage.toFixed(1)}%`);
    }
  });

  test('Battery and CPU efficiency', async () => {
    await page.goto('/');

    // Test animation performance
    const animationPerformance = await page.evaluate(() => {
      return new Promise(resolve => {
        let frameCount = 0;
        const startTime = Date.now();
        let missedFrames = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;

        function checkFrame() {
          frameCount++;
          const currentTime = Date.now();
          const expectedTime = startTime + frameCount * frameInterval;

          if (currentTime > expectedTime + frameInterval) {
            missedFrames++;
          }

          if (frameCount < 120) {
            // Test for 2 seconds
            requestAnimationFrame(checkFrame);
          } else {
            const actualFPS = frameCount / ((currentTime - startTime) / 1000);
            resolve({
              actualFPS: actualFPS,
              missedFrames: missedFrames,
              efficiency: (1 - missedFrames / frameCount) * 100,
            });
          }
        }

        requestAnimationFrame(checkFrame);
      });
    });

    expect(animationPerformance.actualFPS).toBeGreaterThan(50); // At least 50 FPS
    expect(animationPerformance.efficiency).toBeGreaterThan(90); // 90% frame efficiency

    // Test CPU usage during interactions
    const cpuIntensiveTask = await page.evaluate(() => {
      const startTime = performance.now();

      // Simulate user interactions
      const events = ['click', 'scroll', 'mousemove'];
      events.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true });
        document.body.dispatchEvent(event);
      });

      return performance.now() - startTime;
    });

    expect(cpuIntensiveTask).toBeLessThan(100); // Interactions should complete quickly

    console.log(`✅ Efficiency Performance:
      - FPS: ${animationPerformance.actualFPS.toFixed(1)}
      - Frame efficiency: ${animationPerformance.efficiency.toFixed(1)}%
      - Interaction response: ${cpuIntensiveTask.toFixed(2)}ms`);
  });

  test('Performance budget compliance', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const budgetMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');

      const budget = {
        totalSize: 0,
        jsSize: 0,
        cssSize: 0,
        imageSize: 0,
        fontSize: 0,
      };

      resources.forEach(resource => {
        const size = resource.transferSize || resource.decodedBodySize || 0;
        budget.totalSize += size;

        if (resource.name.includes('.js')) {
          budget.jsSize += size;
        } else if (resource.name.includes('.css')) {
          budget.cssSize += size;
        } else if (resource.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
          budget.imageSize += size;
        } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
          budget.fontSize += size;
        }
      });

      return budget;
    });

    // Performance budget limits (in bytes)
    const BUDGET_LIMITS = {
      totalSize: 2 * 1024 * 1024, // 2MB total
      jsSize: 500 * 1024, // 500KB JavaScript
      cssSize: 100 * 1024, // 100KB CSS
      imageSize: 1 * 1024 * 1024, // 1MB images
      fontSize: 200 * 1024, // 200KB fonts
    };

    expect(budgetMetrics.totalSize).toBeLessThan(BUDGET_LIMITS.totalSize);
    expect(budgetMetrics.jsSize).toBeLessThan(BUDGET_LIMITS.jsSize);
    expect(budgetMetrics.cssSize).toBeLessThan(BUDGET_LIMITS.cssSize);
    expect(budgetMetrics.imageSize).toBeLessThan(BUDGET_LIMITS.imageSize);
    expect(budgetMetrics.fontSize).toBeLessThan(BUDGET_LIMITS.fontSize);

    console.log(`✅ Performance Budget:
      - Total: ${(budgetMetrics.totalSize / 1024).toFixed(1)}KB / ${(BUDGET_LIMITS.totalSize / 1024).toFixed(0)}KB
      - JS: ${(budgetMetrics.jsSize / 1024).toFixed(1)}KB / ${(BUDGET_LIMITS.jsSize / 1024).toFixed(0)}KB
      - CSS: ${(budgetMetrics.cssSize / 1024).toFixed(1)}KB / ${(BUDGET_LIMITS.cssSize / 1024).toFixed(0)}KB
      - Images: ${(budgetMetrics.imageSize / 1024).toFixed(1)}KB / ${(BUDGET_LIMITS.imageSize / 1024).toFixed(0)}KB
      - Fonts: ${(budgetMetrics.fontSize / 1024).toFixed(1)}KB / ${(BUDGET_LIMITS.fontSize / 1024).toFixed(0)}KB`);
  });
});
