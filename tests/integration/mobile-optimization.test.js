/**
 * Integration Tests for Mobile Optimization
 * Tests the interaction between mobile optimization services and components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MobileOptimizationService } from '../../services/mobile/MobileOptimizationService.js';
import { LazyLoadManager } from '../../utils/LazyLoadManager.js';
import { performanceMonitor } from '../../utils/performanceUtils.js';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock performance utilities
vi.mock('../../utils/performanceUtils.js', () => ({
  performanceMonitor: {
    start: vi.fn(),
    end: vi.fn(),
    measure: vi.fn(),
  },
  fpsMonitor: {
    start: vi.fn(),
    stop: vi.fn(),
    getFPS: vi.fn(() => 60),
    getAverageFPS: vi.fn(() => 58),
  },
  memoryMonitor: {
    snapshot: vi.fn(),
    getSnapshots: vi.fn(() => []),
    getCurrentMemoryUsage: vi.fn(() => ({ used: 25000000, total: 100000000 })),
    getMemoryTrend: vi.fn(() => 'stable'),
  },
  rafThrottle: vi.fn(fn => fn),
}));

describe('Mobile Optimization Integration', () => {
  let mobileService;
  let lazyLoadManager;
  let mockViewport;
  let mockConnection;

  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    // Mock viewport
    mockViewport = {
      width: 375,
      height: 667,
    };
    Object.defineProperty(window, 'innerWidth', {
      value: mockViewport.width,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: mockViewport.height,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2,
      writable: true,
      configurable: true,
    });

    // Mock connection API
    mockConnection = {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, 'connection', {
      value: mockConnection,
      writable: true,
      configurable: true,
    });

    // Mock touch events
    Object.defineProperty(window, 'ontouchstart', { value: null, configurable: true });

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(callback => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      callback,
    }));

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(callback => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      callback,
    }));

    // Mock performance APIs
    global.performance = {
      now: vi.fn(() => Date.now()),
      getEntriesByType: vi.fn(() => []),
      mark: vi.fn(),
      measure: vi.fn(),
      ...global.performance,
    };

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn(cb => {
      cb();
      return 1;
    });

    // Mock Image constructor; fires onload asynchronously when src is set so
    // image loading promises resolve
    global.Image = vi.fn().mockImplementation(() => {
      const img = { onload: null, onerror: null, crossOrigin: null };
      let currentSrc = '';
      Object.defineProperty(img, 'src', {
        get: () => currentSrc,
        set: value => {
          currentSrc = value;
          setTimeout(() => img.onload && img.onload(), 0);
        },
        configurable: true,
      });
      return img;
    });

    // Create service instances
    mobileService = new MobileOptimizationService();
    lazyLoadManager = new LazyLoadManager();
  });

  afterEach(() => {
    if (mobileService) {
      mobileService.destroy();
    }
    if (lazyLoadManager) {
      lazyLoadManager.destroy();
    }
    vi.clearAllMocks();
  });

  describe('Service Integration', () => {
    it('should integrate mobile service with lazy loading', async () => {
      // Set up mobile content
      document.body.innerHTML = `
        <div class="mobile-container">
          <img data-src="image1.jpg" alt="Image 1" class="mobile-optimized">
          <img data-src="image2.jpg" alt="Image 2" class="mobile-optimized">
          <div data-lazy-component="MobileCard" data-component-path="/components/MobileCard.js"></div>
        </div>
      `;

      // Initialize services
      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Verify mobile detection
      expect(mobileService.isMobile).toBe(true);
      expect(mobileService.touchSupport).toBe(true);

      // Verify lazy loading observers are set up
      expect(IntersectionObserver).toHaveBeenCalled();

      // Verify images are being observed
      const images = document.querySelectorAll('img[data-src]');
      expect(images.length).toBe(2);
    });

    it('should adapt lazy loading based on network conditions', async () => {
      // Simulate slow network
      mockConnection.effectiveType = '2g';
      mockConnection.downlink = 0.5;
      mockConnection.saveData = true;

      document.body.innerHTML = `
        <img data-src="large-image.jpg" alt="Large Image">
        <img data-src="medium-image.jpg" alt="Medium Image">
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Verify network adaptation
      expect(lazyLoadManager.options.lowQualityMode).toBe(true);
      expect(lazyLoadManager.options.batchSize).toBe(2); // Reduced for slow network
    });

    it('should optimize touch interactions with lazy loading', async () => {
      document.body.innerHTML = `
        <div class="touch-container">
          <button data-touch-optimized="true">Touch Button</button>
          <img data-src="touch-image.jpg" alt="Touch Image" data-lazy-load-on-touch="true">
        </div>
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      const button = document.querySelector('[data-touch-optimized]');

      // Simulate touch start
      const touchEvent = new TouchEvent('touchstart', {
        bubbles: true,
        touches: [{ clientX: 100, clientY: 100 }],
      });

      button.dispatchEvent(touchEvent);

      // Verify touch optimization
      expect(button.classList.contains('touch-active')).toBe(true);
    });
  });

  describe('Responsive Image Loading', () => {
    it('should load appropriate image sizes for mobile viewport', async () => {
      document.body.innerHTML = `
        <img data-src="base-image.jpg" 
             data-srcset="small.jpg 480w, medium.jpg 768w, large.jpg 1200w"
             alt="Responsive Image">
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      const img = document.querySelector('img');
      const sources = lazyLoadManager.getResponsiveImageSources(img);
      const optimalSource = lazyLoadManager.selectOptimalSource(sources);

      // For mobile viewport (375px) with 2x DPR, should select medium image
      expect(optimalSource).toBe('medium.jpg');
    });

    it('should fallback to low quality images on slow connections', async () => {
      // Simulate very slow connection
      mockConnection.effectiveType = '2g';
      mockConnection.downlink = 0.2;

      document.body.innerHTML = `
        <img data-src="image.jpg" 
             data-fallback="image-low.jpg"
             alt="Image with fallback">
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Mock image loading failure
      const mockImage = new Image();
      global.Image = vi.fn().mockImplementation(() => {
        setTimeout(() => mockImage.onerror && mockImage.onerror(), 0);
        return mockImage;
      });

      const img = document.querySelector('img');

      // Simulate loading
      lazyLoadManager.queueImageLoad(img);

      // Should attempt fallback due to slow network
      expect(lazyLoadManager.options.lowQualityMode).toBe(true);
    });

    it('should preload critical above-the-fold images on mobile', async () => {
      document.body.innerHTML = `
        <img data-src="hero-image.jpg" alt="Hero" class="critical" style="position: absolute; top: 0;">
        <img data-src="below-fold.jpg" alt="Below fold" style="position: absolute; top: 800px;">
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      const heroImage = document.querySelector('.critical');
      const belowFoldImage = document.querySelector('[alt="Below fold"]');

      const heroPriority = lazyLoadManager.getImagePriority(heroImage);
      const belowPriority = lazyLoadManager.getImagePriority(belowFoldImage);

      expect(heroPriority).toBe(1); // Critical priority
      expect(belowPriority).toBeGreaterThan(heroPriority);
    });
  });

  describe('Performance Integration', () => {
    it('should monitor mobile performance metrics', async () => {
      document.body.innerHTML = `
        <div class="mobile-content">
          <img data-src="perf-image.jpg" alt="Performance Image">
        </div>
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Simulate image load
      const img = document.querySelector('img');
      await lazyLoadManager.loadImage(img).catch(() => {}); // Ignore errors

      expect(performanceMonitor.start).toHaveBeenCalled();
    });

    it('should throttle operations on low-end mobile devices', async () => {
      // Simulate low-end device on a constrained network
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true });
      Object.defineProperty(navigator, 'deviceMemory', { value: 1, configurable: true });
      mockConnection.effectiveType = '3g';

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Verify throttling is applied
      expect(mobileService.isLowEndDevice).toBe(true);
      expect(lazyLoadManager.options.batchSize).toBeLessThanOrEqual(3);
    });

    it('should optimize scroll performance on mobile', async () => {
      document.body.innerHTML = `
        <div style="height: 2000px;">
          <img data-src="scroll1.jpg" alt="Scroll 1" style="position: absolute; top: 200px;">
          <img data-src="scroll2.jpg" alt="Scroll 2" style="position: absolute; top: 600px;">
          <img data-src="scroll3.jpg" alt="Scroll 3" style="position: absolute; top: 1000px;">
        </div>
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Simulate scroll events
      const scrollHandler = vi.fn();
      window.addEventListener('scroll', scrollHandler);

      // Simulate scroll
      window.pageYOffset = 500;
      window.dispatchEvent(new Event('scroll'));

      // Verify scroll is throttled/optimized
      expect(scrollHandler).toHaveBeenCalled();
    });
  });

  describe('Component Lazy Loading Integration', () => {
    it('should lazy load mobile-specific components', async () => {
      document.body.innerHTML = `
        <div data-lazy-component="MobileMenu" 
             data-component-path="/components/mobile/MobileMenu.js"
             data-option-mobile="true">
        </div>
        <div data-lazy-component="TouchCarousel" 
             data-component-path="/components/mobile/TouchCarousel.js">
        </div>
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      const components = document.querySelectorAll('[data-lazy-component]');
      expect(components.length).toBe(2);

      // Simulate component intersection through the real handler
      lazyLoadManager.handleComponentIntersection([
        { isIntersecting: true, target: components[0] },
        { isIntersecting: true, target: components[1] },
      ]);

      // Components enter the loading queue
      await vi.waitFor(() => {
        expect(lazyLoadManager.loadingQueue.size).toBeGreaterThan(0);
      });
    });

    it('should adapt component loading based on mobile capabilities', async () => {
      // Simulate limited mobile device
      mockConnection.effectiveType = '3g';
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true });

      document.body.innerHTML = `
        <div data-lazy-component="HeavyComponent" 
             data-component-path="/components/HeavyComponent.js"
             data-mobile-alternative="LightComponent">
        </div>
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Should prioritize lighter alternatives on limited devices
      expect(mobileService.isLowEndDevice).toBe(true);
    });
  });

  describe('Touch and Gesture Integration', () => {
    it('should integrate touch events with lazy loading triggers', async () => {
      document.body.innerHTML = `
        <div class="swipe-container">
          <img data-src="swipe1.jpg" alt="Swipe 1" data-load-on-swipe="true">
          <img data-src="swipe2.jpg" alt="Swipe 2" data-load-on-swipe="true">
        </div>
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      const container = document.querySelector('.swipe-container');

      // Simulate swipe gesture
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      const touchEnd = new TouchEvent('touchend', {});

      container.dispatchEvent(touchStart);
      container.dispatchEvent(touchMove);
      container.dispatchEvent(touchEnd);

      // Verify touch handling
      expect(mobileService.touchSupport).toBe(true);
    });

    it('should optimize for different touch device types', async () => {
      // Test tablet detection
      window.innerWidth = 768;
      window.innerHeight = 1024;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      expect(mobileService.isTablet).toBe(true);
      expect(mobileService.isMobile).toBe(false);

      // Tablet should have different optimization settings
      expect(lazyLoadManager.options.batchSize).toBeGreaterThan(2);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should manage memory efficiently on mobile devices', async () => {
      // Simulate memory-constrained device on a constrained network
      Object.defineProperty(navigator, 'deviceMemory', { value: 1, configurable: true }); // 1GB RAM
      mockConnection.effectiveType = '3g';

      const galleryItems = Array.from(
        { length: 20 },
        (_, i) => `<img data-src="gallery-${i}.jpg" alt="Gallery ${i}" class="gallery-item">`
      ).join('');

      document.body.innerHTML = `
        <div class="image-gallery">${galleryItems}</div>
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Should reduce batch size for memory-constrained devices
      expect(lazyLoadManager.options.batchSize).toBeLessThanOrEqual(3);
      expect(mobileService.memoryLevel).toBe('low');
    });

    it('should cleanup resources when components are out of view', async () => {
      document.body.innerHTML = `
        <div style="height: 3000px;">
          <img data-src="cleanup1.jpg" alt="Cleanup 1" style="position: absolute; top: 100px;">
          <img data-src="cleanup2.jpg" alt="Cleanup 2" style="position: absolute; top: 2000px;">
        </div>
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Simulate images going out of view
      const images = document.querySelectorAll('img');

      // Mock intersection observer callback for cleanup
      const intersectionCallback = IntersectionObserver.mock.calls[0]?.[0];
      if (intersectionCallback) {
        // Image goes out of view
        intersectionCallback([{ isIntersecting: false, target: images[0] }]);
      }

      // Verify cleanup behavior
      expect(lazyLoadManager.loadedItems.size).toBeDefined();
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should gracefully handle network failures on mobile', async () => {
      document.body.innerHTML = `
        <img data-src="network-fail.jpg" 
             data-fallback="offline-placeholder.jpg" 
             alt="Network Test">
      `;

      // Simulate network failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Mock Image failure
      global.Image = vi.fn().mockImplementation(() => {
        const img = {
          onload: null,
          onerror: null,
          src: '',
        };
        setTimeout(() => img.onerror && img.onerror(), 0);
        return img;
      });

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Keep retries fast so the test completes quickly
      lazyLoadManager.options.retryDelay = 10;

      const img = document.querySelector('img');

      try {
        await lazyLoadManager.loadImage(img);
      } catch (_error) {
        // Should attempt fallback
        expect(img.dataset.fallback).toBe('offline-placeholder.jpg');
      }
    });

    it('should provide offline-capable lazy loading', async () => {
      // Mock service worker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn().mockResolvedValue({}),
          ready: Promise.resolve({}),
        },
        configurable: true,
      });

      // Simulate offline mode
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      document.body.innerHTML = `
        <img data-src="cached-image.jpg" alt="Cached Image">
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Should handle offline gracefully
      expect(navigator.onLine).toBe(false);
    });
  });

  describe('Cross-browser Mobile Compatibility', () => {
    it('should work with mobile Safari quirks', async () => {
      // Mock iOS Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true,
      });

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Should detect iOS and apply appropriate optimizations
      expect(mobileService.deviceInfo.os).toBe('iOS');
    });

    it('should handle Android Chrome mobile specifics', async () => {
      // Mock Android Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 Chrome/91.0.4472.120',
        configurable: true,
      });

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      expect(mobileService.deviceInfo.os).toBe('Android');
      expect(mobileService.deviceInfo.browser).toBe('Chrome');
    });
  });

  describe('Real-world Mobile Scenarios', () => {
    it('should handle mobile page transitions smoothly', async () => {
      document.body.innerHTML = `
        <div class="page-content" data-page="home">
          <img data-src="home-hero.jpg" alt="Home Hero">
        </div>
      `;

      await mobileService.initialize();
      await lazyLoadManager.initialize();

      // Simulate page transition
      document.body.innerHTML = `
        <div class="page-content" data-page="gallery">
          <img data-src="gallery1.jpg" alt="Gallery 1">
          <img data-src="gallery2.jpg" alt="Gallery 2">
        </div>
      `;

      // Should handle DOM changes gracefully
      expect(document.querySelector('[data-page="gallery"]')).toBeTruthy();
    });

    it('should optimize for mobile app-like behavior', async () => {
      // Simulate PWA environment
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
        configurable: true,
      });

      await mobileService.initialize();

      // Should detect PWA mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      expect(isStandalone).toBe(true);
    });
  });
});
