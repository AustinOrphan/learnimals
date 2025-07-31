/**
 * Unit Tests for LazyLoadManager
 * Tests lazy loading functionality for images, components, and content
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LazyLoadManager } from '../../src/utils/LazyLoadManager.js';

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
  },
  rafThrottle: vi.fn(fn => fn)
}));

describe('LazyLoadManager', () => {
  let manager;
  let mockIntersectionObserver;
  let observeCallback;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Mock IntersectionObserver
    observeCallback = null;
    mockIntersectionObserver = vi.fn().mockImplementation((callback, options) => {
      observeCallback = callback;
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        callback,
        options
      };
    });
    global.IntersectionObserver = mockIntersectionObserver;

    // Mock window properties
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true });

    // Mock Image constructor
    global.Image = vi.fn().mockImplementation(() => ({
      onload: null,
      onerror: null,
      src: '',
      crossOrigin: null
    }));

    // Mock fetch
    global.fetch = vi.fn();

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn(cb => {
      cb();
      return 1;
    });

    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      },
      writable: true,
      configurable: true
    });

    // Create manager instance
    manager = new LazyLoadManager();
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      expect(manager.options.imageSelector).toBe('img[data-src], img[loading="lazy"]');
      expect(manager.options.imageRootMargin).toBe('50px');
      expect(manager.options.imageThreshold).toBe(0.1);
      expect(manager.options.enableProgressiveLoading).toBe(true);
      expect(manager.options.batchSize).toBe(5);
      expect(manager.options.adaptToNetwork).toBe(true);
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        imageRootMargin: '100px',
        batchSize: 10,
        enableBlurUpEffect: false
      };
      const customManager = new LazyLoadManager(customOptions);
      
      expect(customManager.options.imageRootMargin).toBe('100px');
      expect(customManager.options.batchSize).toBe(10);
      expect(customManager.options.enableBlurUpEffect).toBe(false);
    });

    it('should initialize observers and queues', () => {
      expect(manager.observers).toBeInstanceOf(Map);
      expect(manager.loadingQueue).toBeInstanceOf(Map);
      expect(manager.loadedItems).toBeInstanceOf(Set);
      expect(manager.failedItems).toBeInstanceOf(Set);
      expect(manager.componentCache).toBeInstanceOf(Map);
    });

    it('should detect network information', () => {
      expect(manager.networkInfo).toMatchObject({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false
      });
    });

    it('should initialize successfully with IntersectionObserver support', async () => {
      document.body.innerHTML = `
        <img data-src="test1.jpg" alt="Test 1">
        <img data-src="test2.jpg" alt="Test 2">
        <div data-lazy-component="TestComponent" data-component-path="/components/Test.js"></div>
        <div data-lazy-content="/api/content/1"></div>
      `;

      await manager.initialize();

      expect(mockIntersectionObserver).toHaveBeenCalledTimes(3); // images, components, content
      expect(manager.observers.size).toBe(3);
    });

    it('should fall back when IntersectionObserver is not supported', async () => {
      // Save original IntersectionObserver
      const originalIO = global.IntersectionObserver;
      const originalWindowIO = window.IntersectionObserver;
      
      // Delete properties to simulate absence
      delete global.IntersectionObserver;
      delete window.IntersectionObserver;
      
      // Create new manager instance after removing IntersectionObserver
      const fallbackManager = new LazyLoadManager();
      
      const scrollHandler = vi.fn();
      const originalAddEventListener = window.addEventListener;
      window.addEventListener = vi.fn((event, handler) => {
        if (event === 'scroll') scrollHandler.mockImplementation(handler);
      });

      await fallbackManager.initialize();

      expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      
      // Restore
      global.IntersectionObserver = originalIO;
      window.IntersectionObserver = originalWindowIO;
      window.addEventListener = originalAddEventListener;
      fallbackManager.destroy();
    });
  });

  describe('Image Lazy Loading', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <img data-src="image1.jpg" alt="Image 1">
        <img data-src="image2.jpg" alt="Image 2" class="critical">
        <img data-src="image3.jpg" alt="Image 3" data-width="600" data-height="400">
        <img data-src="image4.jpg" alt="Image 4" data-priority="high">
        <img data-src="image5.jpg" alt="Image 5" data-srcset="small.jpg 400w, medium.jpg 800w, large.jpg 1200w">
      `;
    });

    it('should set up image lazy loading observers', () => {
      manager.setupImageLazyLoading();
      
      const observer = manager.observers.get('images');
      expect(observer).toBeDefined();
      expect(observer.observe).toHaveBeenCalledTimes(5);
    });

    it('should handle image intersection correctly', () => {
      manager.setupImageLazyLoading();
      
      const images = document.querySelectorAll('img');
      const entries = [
        { isIntersecting: true, target: images[0] },
        { isIntersecting: false, target: images[1] },
        { isIntersecting: true, target: images[2] }
      ];

      manager.handleImageIntersection(entries);

      expect(manager.loadingQueue.size).toBe(2); // Only intersecting images
    });

    it('should prioritize images correctly', () => {
      const images = document.querySelectorAll('img');
      
      // Mock getBoundingClientRect for above-the-fold calculation
      images.forEach(img => {
        img.getBoundingClientRect = vi.fn().mockReturnValue({
          top: 100, // Above viewport (768px)
          bottom: 200,
          left: 100,
          right: 200
        });
      });
      
      // Test critical image
      const criticalPriority = manager.getImagePriority(images[1]);
      expect(criticalPriority).toBe(1);

      // Test high priority image
      const highPriority = manager.getImagePriority(images[3]);
      expect(highPriority).toBe(1);

      // Test large image (above fold + large = priority 2)
      const largePriority = manager.getImagePriority(images[2]);
      expect(largePriority).toBe(2);

      // Test regular image (above fold = priority 3)
      const regularPriority = manager.getImagePriority(images[0]);
      expect(regularPriority).toBe(3);
    });

    it('should load image successfully', async () => {
      const img = document.querySelector('img');
      
      global.Image = vi.fn().mockImplementation(() => {
        const mockImage = {
          onload: null,
          onerror: null,
          src: '',
          crossOrigin: null
        };
        setTimeout(() => mockImage.onload && mockImage.onload(), 0);
        return mockImage;
      });

      const loadPromise = manager.loadImage(img);
      
      await loadPromise;
      
      expect(img.src).toContain('image1.jpg'); // Use toContain to handle absolute URLs
      expect(img.hasAttribute('data-src')).toBe(false);
      expect(img.classList.contains('lazy-loaded')).toBe(true);
      expect(manager.loadedItems.has(img)).toBe(true);
    });

    it('should handle image loading errors with retry', async () => {
      const img = document.querySelector('img');
      let attemptCount = 0;
      
      global.Image = vi.fn().mockImplementation(() => {
        const mockImage = {
          onload: null,
          onerror: null,
          src: '',
          crossOrigin: null
        };
        setTimeout(() => {
          attemptCount++;
          if (attemptCount < 3) {
            mockImage.onerror && mockImage.onerror();
          } else {
            mockImage.onload && mockImage.onload();
          }
        }, 0);
        return mockImage;
      });

      manager.options.retryAttempts = 3;
      manager.options.retryDelay = 0;

      await manager.loadImage(img);
      
      expect(attemptCount).toBe(3);
      expect(img.src).toContain('image1.jpg');
      expect(manager.loadedItems.has(img)).toBe(true);
    });

    it('should fall back to fallback image on failure', async () => {
      const img = document.querySelector('img');
      img.dataset.fallback = 'fallback.jpg';
      
      let callCount = 0;
      global.Image = vi.fn().mockImplementation(() => {
        const mockImage = {
          onload: null,
          onerror: null,
          src: '',
          crossOrigin: null
        };
        setTimeout(() => {
          callCount++;
          if (callCount <= manager.options.retryAttempts) {
            mockImage.onerror && mockImage.onerror();
          } else {
            // Success on fallback
            mockImage.onload && mockImage.onload();
          }
        }, 0);
        return mockImage;
      });

      manager.options.retryAttempts = 2;
      manager.options.retryDelay = 0;

      await manager.loadImage(img);
      
      expect(img.src).toContain('fallback.jpg');
      expect(manager.loadedItems.has(img)).toBe(true);
    });

    it('should select optimal image source for responsive images', () => {
      const img = document.querySelectorAll('img')[4]; // Image with srcset
      
      // Test for mobile viewport
      window.innerWidth = 400;
      const sources = manager.getResponsiveImageSources(img);
      expect(sources).toHaveLength(3);
      
      const optimalSource = manager.selectOptimalSource(sources);
      expect(optimalSource).toBe('small.jpg');

      // Test for desktop viewport
      window.innerWidth = 1200;
      window.devicePixelRatio = 2;
      const desktopSource = manager.selectOptimalSource(sources);
      expect(desktopSource).toBe('large.jpg');
    });

    it('should apply blur-up effect when enabled', async () => {
      const img = document.querySelector('img');
      img.dataset.placeholder = 'placeholder.jpg';
      manager.options.enableBlurUpEffect = true;

      global.Image = vi.fn().mockImplementation(() => {
        // Create a real DOM image element instead of a mock object
        const mockImage = document.createElement('img');
        mockImage.onload = null;
        mockImage.onerror = null;
        setTimeout(() => mockImage.onload && mockImage.onload(), 0);
        return mockImage;
      });

      // Mock parent node
      const parent = document.createElement('div');
      parent.appendChild(img);
      document.body.appendChild(parent);

      await manager.applyBlurUpEffect(img);
      
      const placeholder = parent.querySelector('.lazy-placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder.style.filter).toContain('blur');
    });

    it('should add and remove skeleton loading', () => {
      const img = document.querySelector('img');
      const parent = document.createElement('div');
      parent.appendChild(img);
      document.body.appendChild(parent);

      manager.addImageSkeleton(img);
      
      const skeleton = parent.querySelector('.lazy-skeleton');
      expect(skeleton).toBeTruthy();
      expect(img.classList.contains('has-skeleton')).toBe(true);
      
      manager.removeImageSkeleton(img);
      expect(parent.querySelector('.lazy-skeleton')).toBeFalsy();
      expect(img.classList.contains('has-skeleton')).toBe(false);
    });

    it('should handle retina display images', async () => {
      window.devicePixelRatio = 2;
      const img = document.querySelector('img');
      
      // Mock image exists check
      manager.imageExists = vi.fn().mockResolvedValue(true);
      
      const optimalSrc = await manager.getOptimalImageSource(img);
      expect(optimalSrc).toBe('image1@2x.jpg');
    });

    it('should respect low quality mode', async () => {
      manager.options.lowQualityMode = true;
      window.devicePixelRatio = 2;
      const img = document.querySelector('img');
      
      const optimalSrc = await manager.getOptimalImageSource(img);
      expect(optimalSrc).toBe('image1.jpg'); // Should not use retina version
    });
  });

  describe('Component Lazy Loading', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-lazy-component="Card" data-component-path="/components/Card.js"></div>
        <div data-lazy-component="Modal" data-component-path="/components/Modal.js" data-priority="high"></div>
        <div data-lazy-component="List" data-component-path="/components/List.js" 
             data-option-items='[{"id":1,"name":"Item 1"}]' data-option-show-header="true"></div>
      `;
    });

    it('should set up component lazy loading observers', () => {
      manager.setupComponentLazyLoading();
      
      const observer = manager.observers.get('components');
      expect(observer).toBeDefined();
      expect(observer.observe).toHaveBeenCalledTimes(3);
    });

    it('should handle component intersection', () => {
      manager.setupComponentLazyLoading();
      
      const components = document.querySelectorAll('[data-lazy-component]');
      const entries = [
        { isIntersecting: true, target: components[0] },
        { isIntersecting: true, target: components[1] }
      ];

      manager.handleComponentIntersection(entries);
      
      expect(manager.loadingQueue.size).toBe(2);
    });

    it('should prioritize components correctly', () => {
      const components = document.querySelectorAll('[data-lazy-component]');
      
      // High priority component
      expect(manager.getComponentPriority(components[1])).toBe(1);
      
      // Default priority
      expect(manager.getComponentPriority(components[0])).toBe(3);
    });

    it('should load component successfully', async () => {
      const component = document.querySelector('[data-lazy-component]');
      
      // Mock dynamic import
      const MockComponent = vi.fn().mockImplementation((options) => ({
        render: vi.fn().mockImplementation(async (container) => {
          container.innerHTML = '<div>Mock Component</div>';
        }),
        initialize: vi.fn().mockResolvedValue(),
        options
      }));
      
      // Use vi.doMock to mock the dynamic import
      vi.doMock('/components/Card.js', () => ({
        default: MockComponent
      }));

      await manager.loadComponent(component);
      
      expect(manager.componentCache.has('Card')).toBe(true);
      expect(manager.loadedItems.has(component)).toBe(true);
      expect(component.classList.contains('component-loading-state')).toBe(false);
      
      // Clean up
      vi.doUnmock('/components/Card.js');
    });

    it('should use cached component on subsequent loads', async () => {
      const component = document.querySelector('[data-lazy-component]');
      const MockComponent = vi.fn().mockImplementation(() => ({
        render: vi.fn().mockImplementation(async (container) => {
          container.innerHTML = '<div>Cached Component</div>';
        }),
        initialize: vi.fn().mockResolvedValue()
      }));
      
      // Pre-cache the component
      manager.componentCache.set('Card', MockComponent);
      
      await manager.loadComponent(component);
      
      // Should use the cached component
      expect(MockComponent).toHaveBeenCalled();
      expect(manager.loadedItems.has(component)).toBe(true);
    });

    it('should parse component options correctly', () => {
      const component = document.querySelectorAll('[data-lazy-component]')[2];
      const options = manager.parseComponentOptions(component);
      
      expect(options).toMatchObject({
        items: [{ id: 1, name: 'Item 1' }],
        showheader: true // Should be parsed as boolean, not string
      });
    });

    it('should show loading state while loading component', async () => {
      const component = document.querySelector('[data-lazy-component]');
      
      manager.showComponentLoading(component);
      
      expect(component.innerHTML).toContain('loading-spinner');
      expect(component.classList.contains('component-loading-state')).toBe(true);
    });

    it('should handle component loading errors', async () => {
      const component = document.querySelector('[data-lazy-component]');
      
      const originalImport = global.import;
      global.import = vi.fn().mockRejectedValue(new Error('Module not found'));

      await manager.loadComponent(component);
      
      expect(component.innerHTML).toContain('Failed to load component');
      expect(component.classList.contains('component-error-state')).toBe(true);
      expect(manager.failedItems.has(component)).toBe(true);
      
      // Restore original import
      global.import = originalImport;
    });

    it('should emit component events', async () => {
      const component = document.querySelector('[data-lazy-component]');
      const loadedHandler = vi.fn();
      const errorHandler = vi.fn();
      
      manager.on('componentLoaded', loadedHandler);
      manager.on('componentError', errorHandler);
      
      // Success case
      const MockComponent = vi.fn().mockImplementation(() => ({
        render: vi.fn().mockImplementation(async (container) => {
          container.innerHTML = '<div>Mock Component</div>';
        }),
        initialize: vi.fn().mockResolvedValue()
      }));
      
      vi.doMock('/components/Card.js', () => ({
        default: MockComponent
      }));
      
      await manager.loadComponent(component);
      
      expect(loadedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            component,
            componentName: 'Card'
          })
        })
      );
      
      // Clean up
      vi.doUnmock('/components/Card.js');
    });
  });

  describe('Content Lazy Loading', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-lazy-content="/api/content/1" data-content-type="html"></div>
        <div data-lazy-content="/api/content/2" data-content-type="json" data-template="card"></div>
        <div data-lazy-content="/api/content/3" data-content-type="text"></div>
      `;
    });

    it('should set up content lazy loading observers', () => {
      manager.setupContentLazyLoading();
      
      const observer = manager.observers.get('content');
      expect(observer).toBeDefined();
      expect(observer.observe).toHaveBeenCalledTimes(3);
    });

    it('should load HTML content successfully', async () => {
      const element = document.querySelector('[data-lazy-content]');
      const mockContent = '<h1>Test Content</h1>';
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(mockContent)
      });

      await manager.loadContent(element);
      
      expect(fetch).toHaveBeenCalledWith('/api/content/1');
      expect(element.innerHTML).toBe(mockContent);
      expect(element.classList.contains('content-loaded')).toBe(true);
      expect(manager.loadedItems.has(element)).toBe(true);
    });

    it('should load JSON content successfully', async () => {
      const element = document.querySelectorAll('[data-lazy-content]')[1];
      const mockData = { title: 'Test', description: 'Test description' };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData)
      });

      await manager.loadContent(element);
      
      expect(element.innerHTML).toContain('Template: card');
    });

    it('should load text content successfully', async () => {
      const element = document.querySelectorAll('[data-lazy-content]')[2];
      const mockText = 'Plain text content';
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(mockText)
      });

      await manager.loadContent(element);
      
      expect(element.textContent).toBe(mockText);
    });

    it('should handle content loading errors', async () => {
      const element = document.querySelector('[data-lazy-content]');
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await manager.loadContent(element);
      
      expect(element.innerHTML).toContain('Failed to load content');
      expect(element.classList.contains('content-error')).toBe(true);
      expect(manager.failedItems.has(element)).toBe(true);
    });

    it('should handle network errors', async () => {
      const element = document.querySelector('[data-lazy-content]');
      
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await manager.loadContent(element);
      
      expect(element.innerHTML).toContain('Failed to load content');
      expect(manager.failedItems.has(element)).toBe(true);
    });
  });

  describe('Queue Processing', () => {
    it('should process loading queue in priority order', () => {
      // Add items with different priorities
      manager.loadingQueue.set('item1', {
        type: 'image',
        element: document.createElement('img'),
        priority: 3,
        attempts: 0,
        timestamp: Date.now()
      });
      
      manager.loadingQueue.set('item2', {
        type: 'component',
        element: document.createElement('div'),
        priority: 1,
        attempts: 0,
        timestamp: Date.now() + 100
      });
      
      manager.loadingQueue.set('item3', {
        type: 'image',
        element: document.createElement('img'),
        priority: 2,
        attempts: 0,
        timestamp: Date.now() + 200
      });

      // Mock processing
      manager.processLoadingItem = vi.fn();
      manager.processLoadingQueue();
      
      // Should process in priority order (1, 2, 3)
      expect(manager.processLoadingItem).toHaveBeenCalledTimes(3);
      const calls = manager.processLoadingItem.mock.calls;
      expect(calls[0][1].priority).toBe(1);
      expect(calls[1][1].priority).toBe(2);
      expect(calls[2][1].priority).toBe(3);
    });

    it('should respect batch size', () => {
      manager.options.batchSize = 2;
      
      // Add 5 items
      for (let i = 0; i < 5; i++) {
        manager.loadingQueue.set(`item${i}`, {
          type: 'image',
          element: document.createElement('img'),
          priority: 1,
          attempts: 0,
          timestamp: Date.now() + i
        });
      }

      manager.processLoadingItem = vi.fn();
      manager.processLoadingQueue();
      
      // Should only process batch size (2)
      expect(manager.processLoadingItem).toHaveBeenCalledTimes(2);
    });

    it('should retry failed items', async () => {
      const item = {
        type: 'image',
        element: document.createElement('img'),
        priority: 1,
        attempts: 0,
        timestamp: Date.now()
      };
      
      manager.loadingQueue.set('item1', item);
      manager.options.retryAttempts = 3;
      manager.options.retryDelay = 0;
      
      // Mock loadImage to fail
      manager.loadImage = vi.fn().mockRejectedValue(new Error('Load failed'));
      
      await manager.processLoadingItem('item1', item);
      
      expect(item.attempts).toBe(1);
      expect(manager.loadingQueue.has('item1')).toBe(true);
    });

    it('should remove items after max retry attempts', async () => {
      const item = {
        type: 'image',
        element: document.createElement('img'),
        priority: 1,
        attempts: 2, // Already at max - 1
        timestamp: Date.now()
      };
      
      manager.loadingQueue.set('item1', item);
      manager.options.retryAttempts = 3;
      
      manager.loadImage = vi.fn().mockRejectedValue(new Error('Load failed'));
      
      await manager.processLoadingItem('item1', item);
      
      expect(item.attempts).toBe(3);
      expect(manager.loadingQueue.has('item1')).toBe(false);
    });

    it('should apply loading delay', async () => {
      manager.options.loadingDelay = 100;
      const startTime = performance.now();
      
      const item = {
        type: 'image',
        element: document.createElement('img'),
        priority: 1,
        attempts: 0,
        timestamp: Date.now()
      };
      
      manager.loadImage = vi.fn().mockResolvedValue();
      
      await manager.processLoadingItem('item1', item);
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Network Adaptation', () => {
    it('should monitor network conditions when enabled', () => {
      manager.options.adaptToNetwork = true;
      manager.monitorNetworkConditions();
      
      expect(navigator.connection.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should adapt to slow network conditions', () => {
      manager.networkInfo = {
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 800,
        saveData: true
      };
      
      manager.adaptToNetworkConditions();
      
      expect(manager.options.lowQualityMode).toBe(true);
      expect(manager.options.batchSize).toBe(2);
      expect(manager.options.loadingDelay).toBe(500);
    });

    it('should adapt to 3G network', () => {
      manager.networkInfo = {
        effectiveType: '3g',
        downlink: 2,
        rtt: 300,
        saveData: false
      };
      
      manager.adaptToNetworkConditions();
      
      expect(manager.options.lowQualityMode).toBe(false);
      expect(manager.options.batchSize).toBe(3);
      expect(manager.options.loadingDelay).toBe(200);
    });

    it('should adapt to fast network', () => {
      manager.networkInfo = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false
      };
      
      manager.adaptToNetworkConditions();
      
      expect(manager.options.lowQualityMode).toBe(false);
      expect(manager.options.batchSize).toBe(5);
      expect(manager.options.loadingDelay).toBe(100);
    });

    it('should enable low quality mode when data saver is on', () => {
      manager.networkInfo = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: true
      };
      
      manager.adaptToNetworkConditions();
      
      expect(manager.options.lowQualityMode).toBe(true);
    });
  });

  describe('Public API', () => {
    it('should load all visible items on demand', () => {
      manager.processLoadingQueue = vi.fn();
      
      manager.loadVisible();
      
      expect(manager.processLoadingQueue).toHaveBeenCalled();
    });

    it('should preload specific selectors', () => {
      document.body.innerHTML = `
        <img data-src="preload1.jpg" class="preload-me">
        <div data-lazy-component="Preload" class="preload-me"></div>
        <div data-lazy-content="/preload" class="preload-me"></div>
      `;
      
      manager.queueImageLoad = vi.fn();
      manager.queueComponentLoad = vi.fn();
      manager.queueContentLoad = vi.fn();
      
      manager.preload(['.preload-me']);
      
      expect(manager.queueImageLoad).toHaveBeenCalledTimes(1);
      expect(manager.queueComponentLoad).toHaveBeenCalledTimes(1);
      expect(manager.queueContentLoad).toHaveBeenCalledTimes(1);
    });

    it('should provide loading statistics', () => {
      // Add some items to different sets/maps
      manager.loadingQueue.set('q1', { type: 'image' });
      manager.loadingQueue.set('q2', { type: 'component' });
      manager.loadingQueue.set('q3', { type: 'image' });
      
      manager.loadedItems.add('loaded1');
      manager.loadedItems.add('loaded2');
      
      manager.failedItems.add('failed1');
      
      const stats = manager.getStats();
      
      expect(stats).toMatchObject({
        totalQueued: 3,
        totalLoaded: 2,
        totalFailed: 1,
        queueByType: {
          image: 2,
          component: 1,
          content: 0
        },
        networkInfo: expect.any(Object)
      });
    });
  });

  describe('Event System', () => {
    it('should emit and handle events', () => {
      const handler = vi.fn();
      
      manager.on('imageLoaded', handler);
      manager.emit('imageLoaded', { img: 'test' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { img: 'test' }
        })
      );
    });

    it('should remove event listeners', () => {
      const handler = vi.fn();
      
      manager.on('imageLoaded', handler);
      manager.off('imageLoaded', handler);
      manager.emit('imageLoaded', { img: 'test' });
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should check IntersectionObserver support', () => {
      expect(manager.supportsIntersectionObserver()).toBe(true);
      
      // Save original and test undefined case
      const originalIO = global.IntersectionObserver;
      const originalWindowIO = window.IntersectionObserver;
      
      // Delete properties to simulate absence
      delete global.IntersectionObserver;
      delete window.IntersectionObserver;
      
      const testManager = new LazyLoadManager();
      expect(testManager.supportsIntersectionObserver()).toBe(false);
      
      // Restore
      global.IntersectionObserver = originalIO;
      window.IntersectionObserver = originalWindowIO;
    });

    it('should get network info with fallback', () => {
      const info = manager.getNetworkInfo();
      expect(info).toMatchObject({
        effectiveType: expect.any(String),
        downlink: expect.any(Number),
        rtt: expect.any(Number),
        saveData: expect.any(Boolean)
      });
      
      // Test fallback
      delete navigator.connection;
      const fallbackInfo = manager.getNetworkInfo();
      expect(fallbackInfo).toMatchObject({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false
      });
    });

    it('should generate retina image version', () => {
      expect(manager.getRetinaImageVersion('image.jpg')).toBe('image@2x.jpg');
      expect(manager.getRetinaImageVersion('path/to/image.png')).toBe('path/to/image@2x.png');
      expect(manager.getRetinaImageVersion('image.min.jpg')).toBe('image.min@2x.jpg');
    });

    it('should check if image exists', async () => {
      const mockImage = {
        onload: null,
        onerror: null,
        src: ''
      };
      
      global.Image = vi.fn().mockImplementation(() => {
        setTimeout(() => mockImage.onload && mockImage.onload(), 0);
        return mockImage;
      });
      
      const exists = await manager.imageExists('test.jpg');
      expect(exists).toBe(true);
      
      // Test non-existent image
      global.Image = vi.fn().mockImplementation(() => {
        const errorImage = { ...mockImage };
        setTimeout(() => errorImage.onerror && errorImage.onerror(), 0);
        return errorImage;
      });
      
      const notExists = await manager.imageExists('not-found.jpg');
      expect(notExists).toBe(false);
    });

    it('should check if element is in viewport', () => {
      const element = document.createElement('div');
      element.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 100,
        bottom: 200,
        left: 100,
        right: 200
      });
      
      expect(manager.isInViewport(element)).toBe(true);
      
      // Test element below viewport
      element.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 1000,
        bottom: 1100,
        left: 100,
        right: 200
      });
      
      expect(manager.isInViewport(element)).toBe(false);
    });
  });

  describe('Progressive Enhancement', () => {
    it('should apply fade-in effect', () => {
      const img = document.createElement('img');
      
      // Mock requestAnimationFrame to not execute immediately
      global.requestAnimationFrame = vi.fn();
      
      manager.applyFadeInEffect(img);
      
      expect(img.style.transition).toContain('opacity');
      expect(img.style.opacity).toBe('0');
      
      // After RAF
      expect(requestAnimationFrame).toHaveBeenCalled();
      
      // Restore original RAF
      global.requestAnimationFrame = vi.fn(cb => {
        cb();
        return 1;
      });
    });

    it('should add skeleton loading with proper styling', () => {
      const img = document.createElement('img');
      const parent = document.createElement('div');
      parent.appendChild(img);
      document.body.appendChild(parent);
      
      manager.options.enableSkeletonLoading = true;
      manager.addImageSkeleton(img);
      
      const skeleton = parent.querySelector('.lazy-skeleton');
      expect(skeleton).toBeTruthy();
      expect(skeleton.style.background).toContain('linear-gradient');
      expect(skeleton.style.animation).toContain('skeleton-loading');
    });
  });

  describe('Cleanup', () => {
    it('should properly destroy and clean up', () => {
      // Set up some state
      manager.observers.set('test', { disconnect: vi.fn() });
      manager.loadingQueue.set('item1', {});
      manager.loadedItems.add('item1');
      manager.failedItems.add('item2');
      manager.componentCache.set('Component', {});
      manager.queueInterval = setInterval(() => {}, 1000);
      
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      manager.destroy();
      
      expect(manager.observers.size).toBe(0);
      expect(manager.loadingQueue.size).toBe(0);
      expect(manager.loadedItems.size).toBe(0);
      expect(manager.failedItems.size).toBe(0);
      expect(manager.componentCache.size).toBe(0);
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle images without src or data-src', async () => {
      const img = document.createElement('img');
      
      await expect(manager.loadImage(img)).rejects.toThrow('No image source found');
    });

    it('should handle missing component module', async () => {
      const component = document.createElement('div');
      component.dataset.lazyComponent = 'Missing';
      component.dataset.componentPath = '/missing.js';
      
      const originalImport = global.import;
      global.import = vi.fn().mockResolvedValue({});
      
      await manager.loadComponent(component);
      
      expect(component.innerHTML).toContain('Failed to load component');
      expect(manager.failedItems.has(component)).toBe(true);
      
      // Restore original import
      global.import = originalImport;
    });

    it('should handle empty responsive sources', () => {
      const sources = [];
      const result = manager.selectOptimalSource(sources);
      expect(result).toBe(null);
    });

    it('should handle queue processing with empty queue', () => {
      manager.loadingQueue.clear();
      
      // Should not throw
      expect(() => manager.processLoadingQueue()).not.toThrow();
    });

    it('should handle network info when connection API changes', () => {
      // Simulate connection change
      const changeHandler = navigator.connection.addEventListener.mock.calls[0]?.[1];
      if (changeHandler) {
        navigator.connection.effectiveType = '3g';
        changeHandler();
        
        expect(manager.networkInfo.effectiveType).toBe('3g');
      }
    });
  });
});