/**
 * Lazy Load Manager
 * Advanced lazy loading implementation for images, components, and content
 */

import logger from './logger.js';
import { performanceMonitor, rafThrottle } from './performanceUtils.js';

export class LazyLoadManager {
  constructor(options = {}) {
    this.options = {
      // Image lazy loading
      imageSelector: 'img[data-src], img[loading="lazy"]',
      imageRootMargin: '50px',
      imageThreshold: 0.1,
      
      // Component lazy loading
      componentSelector: '[data-lazy-component]',
      componentRootMargin: '100px',
      componentThreshold: 0.1,
      
      // Content lazy loading
      contentSelector: '[data-lazy-content]',
      contentRootMargin: '200px',
      contentThreshold: 0.1,
      
      // Progressive enhancement
      enableProgressiveLoading: true,
      enableBlurUpEffect: true,
      enableSkeletonLoading: true,
      
      // Performance options
      enablePerformanceMonitoring: true,
      batchSize: 5,
      loadingDelay: 100,
      retryAttempts: 3,
      retryDelay: 1000,
      
      // Network adaptation
      adaptToNetwork: true,
      lowQualityMode: false,
      
      ...options
    };

    this.observers = new Map();
    this.loadingQueue = new Map();
    this.loadedItems = new Set();
    this.failedItems = new Set();
    this.componentCache = new Map();
    this.networkInfo = this.getNetworkInfo();
    
    // Bind methods
    this.handleImageIntersection = this.handleImageIntersection.bind(this);
    this.handleComponentIntersection = this.handleComponentIntersection.bind(this);
    this.handleContentIntersection = this.handleContentIntersection.bind(this);
    this.processLoadingQueue = rafThrottle(this.processLoadingQueue.bind(this));
  }

  /**
   * Initialize lazy loading manager
   */
  async initialize() {
    try {
      logger.info('Initializing lazy load manager...');

      // Check for Intersection Observer support
      if (!this.supportsIntersectionObserver()) {
        logger.warn('IntersectionObserver not supported, using fallback');
        this.initializeFallback();
        return;
      }

      // Set up observers
      this.setupImageLazyLoading();
      this.setupComponentLazyLoading();  
      this.setupContentLazyLoading();

      // Monitor network conditions
      if (this.options.adaptToNetwork) {
        this.monitorNetworkConditions();
      }

      // Start processing queue
      this.startQueueProcessor();

      logger.info('✅ Lazy load manager initialized');

    } catch (error) {
      logger.error('❌ Failed to initialize lazy load manager:', error);
      throw error;
    }
  }

  /**
   * Set up image lazy loading
   */
  setupImageLazyLoading() {
    const options = {
      root: null,
      rootMargin: this.options.imageRootMargin,
      threshold: this.options.imageThreshold
    };

    // eslint-disable-next-line no-undef
    const observer = new IntersectionObserver(this.handleImageIntersection, options);
    
    // Observe all lazy images
    const images = document.querySelectorAll(this.options.imageSelector);
    images.forEach(img => {
      observer.observe(img);
      
      // Add placeholder or skeleton
      if (this.options.enableSkeletonLoading) {
        this.addImageSkeleton(img);
      }
    });

    this.observers.set('images', observer);
    logger.debug(`Observing ${images.length} lazy images`);
  }

  /**
   * Handle image intersection
   */
  handleImageIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.queueImageLoad(img);
        this.observers.get('images').unobserve(img);
      }
    });
  }

  /**
   * Queue image for loading
   */
  queueImageLoad(img) {
    const priority = this.getImagePriority(img);
    const queueKey = `image-${Date.now()}-${Math.random()}`;
    
    this.loadingQueue.set(queueKey, {
      type: 'image',
      element: img,
      priority,
      attempts: 0,
      timestamp: Date.now()
    });

    this.processLoadingQueue();
  }

  /**
   * Get image loading priority
   */
  getImagePriority(img) {
    // Higher priority for above-the-fold images
    const rect = img.getBoundingClientRect();
    const isAboveTheFold = rect.top < window.innerHeight;
    
    // Higher priority for larger images
    const isLarge = img.dataset.width > 500 || img.dataset.height > 300;
    
    // Higher priority for critical images
    const isCritical = img.classList.contains('critical') || img.dataset.priority === 'high';
    
    if (isCritical) return 1;
    if (isAboveTheFold && isLarge) return 2;
    if (isAboveTheFold) return 3;
    if (isLarge) return 4;
    return 5;
  }

  /**
   * Load image with progressive enhancement
   */
  async loadImage(img) {
    const startTime = performance.now();
    
    try {
      if (this.options.enablePerformanceMonitoring) {
        performanceMonitor.start(`image-load-${img.src || img.dataset.src}`);
      }

      // Get optimal image source
      const src = await this.getOptimalImageSource(img);
      
      // Load image
      await this.loadImageWithFallback(img, src);
      
      // Apply progressive enhancement
      await this.applyImageEnhancements(img);
      
      this.loadedItems.add(img);
      this.emit('imageLoaded', { img, loadTime: performance.now() - startTime });

    } catch (error) {
      logger.error('Failed to load image:', error);
      this.failedItems.add(img);
      this.emit('imageError', { img, error });
      throw error;
    } finally {
      if (this.options.enablePerformanceMonitoring) {
        performanceMonitor.end(`image-load-${img.src || img.dataset.src}`);
      }
    }
  }

  /**
   * Get optimal image source based on device and network
   */
  async getOptimalImageSource(img) {
    const baseSrc = img.dataset.src || img.src;
    if (!baseSrc) throw new Error('No image source found');

    // Check for responsive image sources
    const sources = this.getResponsiveImageSources(img);
    if (sources.length > 0) {
      return this.selectOptimalSource(sources);
    }

    // Apply device pixel ratio optimization
    const devicePixelRatio = window.devicePixelRatio || 1;
    if (devicePixelRatio > 1 && !this.options.lowQualityMode) {
      const retinaVersion = this.getRetinaImageVersion(baseSrc);
      if (await this.imageExists(retinaVersion)) {
        return retinaVersion;
      }
    }

    return baseSrc;
  }

  /**
   * Get responsive image sources
   */
  getResponsiveImageSources(img) {
    const sources = [];
    
    // Check for srcset attribute
    if (img.dataset.srcset) {
      const srcset = img.dataset.srcset.split(',');
      srcset.forEach(source => {
        const [url, descriptor] = source.trim().split(' ');
        sources.push({ url, descriptor });
      });
    }

    // Check for sizes attribute and generate responsive sources
    if (img.dataset.sizes) {
      // This would typically be handled by the browser's srcset logic
      // but we can implement custom logic for advanced use cases
    }

    return sources;
  }

  /**
   * Select optimal source based on current conditions
   */
  selectOptimalSource(sources) {
    const viewportWidth = window.innerWidth;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const effectiveWidth = viewportWidth * devicePixelRatio;

    // Sort sources by width (assuming 'w' descriptors)
    const widthSources = sources
      .filter(source => source.descriptor.endsWith('w'))
      .map(source => ({
        ...source,
        width: parseInt(source.descriptor.replace('w', ''))
      }))
      .sort((a, b) => a.width - b.width);

    if (widthSources.length === 0) {
      return sources[0]?.url || null;
    }

    // Find the smallest source that's larger than the effective width
    const optimalSource = widthSources.find(source => source.width >= effectiveWidth);
    
    // If no source is large enough, use the largest available
    return optimalSource?.url || widthSources[widthSources.length - 1].url;
  }

  /**
   * Load image with fallback and retry logic
   */
  async loadImageWithFallback(img, src) {
    const maxAttempts = this.options.retryAttempts;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.loadImagePromise(img, src);
        return; // Success
      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts) {
          // Wait before retry
          await this.delay(this.options.retryDelay * attempt);
          logger.debug(`Retrying image load (attempt ${attempt + 1}/${maxAttempts}):`, src);
        }
      }
    }

    // All attempts failed, try fallback
    if (img.dataset.fallback) {
      try {
        await this.loadImagePromise(img, img.dataset.fallback);
        return;
      } catch (fallbackError) {
        logger.error('Fallback image also failed:', fallbackError);
      }
    }

    throw lastError;
  }

  /**
   * Load image as Promise
   */
  loadImagePromise(img, src) {
    return new Promise((resolve, reject) => {
      const tempImg = new Image();
      
      tempImg.onload = () => {
        // Use requestAnimationFrame to avoid layout thrashing
        requestAnimationFrame(() => {
          img.src = src;
          img.removeAttribute('data-src');
          resolve(img);
        });
      };
      
      tempImg.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      // Set crossOrigin if needed
      if (img.crossOrigin) {
        tempImg.crossOrigin = img.crossOrigin;
      }
      
      tempImg.src = src;
    });
  }

  /**
   * Apply image enhancements
   */
  async applyImageEnhancements(img) {
    // Remove skeleton loading
    this.removeImageSkeleton(img);
    
    // Add loaded class
    img.classList.add('lazy-loaded');
    
    // Apply blur-up effect
    if (this.options.enableBlurUpEffect && img.dataset.placeholder) {
      await this.applyBlurUpEffect(img);
    }
    
    // Fade in effect
    this.applyFadeInEffect(img);
  }

  /**
   * Apply blur-up effect
   */
  async applyBlurUpEffect(img) {
    if (!img.dataset.placeholder) return;

    // Create low-quality placeholder
    const placeholder = new Image();
    placeholder.src = img.dataset.placeholder;
    placeholder.className = 'lazy-placeholder';
    placeholder.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: blur(5px);
      transition: opacity 0.3s ease;
      z-index: -1;
    `;

    // Insert placeholder behind the image
    img.parentNode.insertBefore(placeholder, img);
    
    // Wait for main image to load, then fade out placeholder
    img.addEventListener('load', () => {
      setTimeout(() => {
        placeholder.style.opacity = '0';
        setTimeout(() => placeholder.remove(), 300);
      }, 100);
    }, { once: true });
  }

  /**
   * Add image skeleton
   */
  addImageSkeleton(img) {
    if (img.classList.contains('has-skeleton')) return;

    const skeleton = document.createElement('div');
    skeleton.className = 'lazy-skeleton';
    skeleton.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: inherit;
    `;

    // Ensure parent is positioned
    const parent = img.parentNode;
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    parent.insertBefore(skeleton, img);
    img.classList.add('has-skeleton');
    img.style.opacity = '0';
  }

  /**
   * Remove image skeleton
   */
  removeImageSkeleton(img) {
    const skeleton = img.parentNode.querySelector('.lazy-skeleton');
    if (skeleton) {
      skeleton.remove();
    }
    img.classList.remove('has-skeleton');
    img.style.opacity = '';
  }

  /**
   * Apply fade in effect
   */
  applyFadeInEffect(img) {
    img.style.transition = 'opacity 0.3s ease';
    img.style.opacity = '0';
    
    requestAnimationFrame(() => {
      img.style.opacity = '1';
    });
  }

  /**
   * Set up component lazy loading
   */
  setupComponentLazyLoading() {
    const options = {
      root: null,
      rootMargin: this.options.componentRootMargin,
      threshold: this.options.componentThreshold
    };

    // eslint-disable-next-line no-undef
    const observer = new IntersectionObserver(this.handleComponentIntersection, options);
    
    const components = document.querySelectorAll(this.options.componentSelector);
    components.forEach(component => {
      observer.observe(component);
    });

    this.observers.set('components', observer);
    logger.debug(`Observing ${components.length} lazy components`);
  }

  /**
   * Handle component intersection
   */
  handleComponentIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const component = entry.target;
        this.queueComponentLoad(component);
        this.observers.get('components').unobserve(component);
      }
    });
  }

  /**
   * Queue component for loading
   */
  queueComponentLoad(component) {
    const priority = this.getComponentPriority(component);
    const queueKey = `component-${Date.now()}-${Math.random()}`;
    
    this.loadingQueue.set(queueKey, {
      type: 'component',
      element: component,
      priority,
      attempts: 0,
      timestamp: Date.now()
    });

    this.processLoadingQueue();
  }

  /**
   * Get component loading priority
   */
  getComponentPriority(component) {
    const priority = component.dataset.priority;
    if (priority === 'high') return 1;
    if (priority === 'medium') return 2;
    return 3;
  }

  /**
   * Load component dynamically
   */
  async loadComponent(component) {
    const componentName = component.dataset.lazyComponent;
    const componentPath = component.dataset.componentPath;
    
    try {
      // Check cache first
      if (this.componentCache.has(componentName)) {
        const ComponentClass = this.componentCache.get(componentName);
        await this.renderComponent(component, ComponentClass);
        this.loadedItems.add(component);
        this.emit('componentLoaded', { component, componentName });
        return;
      }

      // Show loading state
      this.showComponentLoading(component);

      // Dynamic import
      const module = await import(componentPath);
      const ComponentClass = module.default || module[componentName];
      
      if (!ComponentClass) {
        throw new Error(`Component ${componentName} not found in ${componentPath}`);
      }

      // Cache the component
      this.componentCache.set(componentName, ComponentClass);
      
      // Render component
      await this.renderComponent(component, ComponentClass);
      
      this.loadedItems.add(component);
      this.emit('componentLoaded', { component, componentName });

    } catch (error) {
      logger.error(`Failed to load component ${componentName}:`, error);
      this.showComponentError(component, error);
      this.failedItems.add(component);
      this.emit('componentError', { component, error });
    }
  }

  /**
   * Show component loading state
   */
  showComponentLoading(component) {
    component.innerHTML = `
      <div class="component-loading">
        <div class="loading-spinner"></div>
        <p>Loading component...</p>
      </div>
    `;
    component.classList.add('component-loading-state');
  }

  /**
   * Show component error state
   */
  showComponentError(component, _error) {
    component.innerHTML = `
      <div class="component-error">
        <p>Failed to load component</p>
        <button class="retry-btn" onclick="this.closest('[data-lazy-component]').dispatchEvent(new CustomEvent('retry'))">
          Retry
        </button>
      </div>
    `;
    component.classList.add('component-error-state');
  }

  /**
   * Render component
   */
  async renderComponent(container, ComponentClass) {
    const options = this.parseComponentOptions(container);
    const component = new ComponentClass(options);
    
    // Clear loading state
    container.innerHTML = '';
    container.classList.remove('component-loading-state');
    
    // Render component
    await component.render(container);
    
    // Initialize component
    if (component.initialize) {
      await component.initialize();
    }
  }

  /**
   * Parse component options from data attributes
   */
  parseComponentOptions(container) {
    const options = {};
    const dataset = container.dataset;
    
    Object.keys(dataset).forEach(key => {
      if (key.startsWith('option')) {
        const optionName = key.replace('option', '').toLowerCase();
        let value = dataset[key];
        
        // Try to parse JSON values
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if not valid JSON
        }
        
        options[optionName] = value;
      }
    });
    
    return options;
  }

  /**
   * Set up content lazy loading
   */
  setupContentLazyLoading() {
    const options = {
      root: null,
      rootMargin: this.options.contentRootMargin,
      threshold: this.options.contentThreshold
    };

    // eslint-disable-next-line no-undef
    const observer = new IntersectionObserver(this.handleContentIntersection, options);
    
    const contentElements = document.querySelectorAll(this.options.contentSelector);
    contentElements.forEach(element => {
      observer.observe(element);
    });

    this.observers.set('content', observer);
    logger.debug(`Observing ${contentElements.length} lazy content elements`);
  }

  /**
   * Handle content intersection
   */
  handleContentIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        this.queueContentLoad(element);
        this.observers.get('content').unobserve(element);
      }
    });
  }

  /**
   * Queue content for loading
   */
  queueContentLoad(element) {
    const queueKey = `content-${Date.now()}-${Math.random()}`;
    
    this.loadingQueue.set(queueKey, {
      type: 'content',
      element,
      priority: 3,
      attempts: 0,
      timestamp: Date.now()
    });

    this.processLoadingQueue();
  }

  /**
   * Load content dynamically
   */
  async loadContent(element) {
    const contentUrl = element.dataset.lazyContent;
    const contentType = element.dataset.contentType || 'html';
    
    try {
      const response = await fetch(contentUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let content;
      switch (contentType) {
      case 'json':
        content = await response.json();
        await this.renderJsonContent(element, content);
        break;
      case 'text':
        content = await response.text();
        element.textContent = content;
        break;
      default:
        content = await response.text();
        element.innerHTML = content;
      }
      
      element.classList.add('content-loaded');
      this.loadedItems.add(element);
      this.emit('contentLoaded', { element, content });

    } catch (error) {
      logger.error('Failed to load content:', error);
      element.innerHTML = '<p>Failed to load content</p>';
      element.classList.add('content-error');
      this.failedItems.add(element);
      this.emit('contentError', { element, error });
    }
  }

  /**
   * Render JSON content
   */
  async renderJsonContent(element, data) {
    const template = element.dataset.template;
    if (template) {
      // Use template if specified
      const templateFn = this.getTemplate(template);
      element.innerHTML = templateFn(data);
    } else {
      // Simple JSON display
      element.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
  }

  /**
   * Process loading queue
   */
  processLoadingQueue() {
    if (this.loadingQueue.size === 0) return;

    // Sort by priority and timestamp
    const sortedItems = Array.from(this.loadingQueue.entries())
      .sort(([, a], [, b]) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority; // Lower number = higher priority
        }
        return a.timestamp - b.timestamp; // Earlier timestamp first
      });

    // Process items in batches
    const batchSize = this.options.batchSize;
    const batch = sortedItems.slice(0, batchSize);

    batch.forEach(([key, item]) => {
      this.processLoadingItem(key, item);
    });
  }

  /**
   * Process individual loading item
   */
  async processLoadingItem(key, item) {
    try {
      // Add delay for performance
      if (this.options.loadingDelay > 0) {
        await this.delay(this.options.loadingDelay);
      }

      switch (item.type) {
      case 'image':
        await this.loadImage(item.element);
        break;
      case 'component':
        await this.loadComponent(item.element);
        break;
      case 'content':
        await this.loadContent(item.element);
        break;
      }

      // Remove from queue on success
      this.loadingQueue.delete(key);

    } catch (error) {
      item.attempts++;
      
      if (item.attempts >= this.options.retryAttempts) {
        // Max attempts reached, remove from queue
        this.loadingQueue.delete(key);
        logger.error(`Failed to load ${item.type} after ${item.attempts} attempts:`, error);
      } else {
        // Retry later
        setTimeout(() => {
          this.processLoadingQueue();
        }, this.options.retryDelay * item.attempts);
      }
    }
  }

  /**
   * Start queue processor
   */
  startQueueProcessor() {
    // Process queue periodically
    this.queueInterval = setInterval(() => {
      this.processLoadingQueue();
    }, 100);
  }

  /**
   * Monitor network conditions
   */
  monitorNetworkConditions() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const updateNetworkInfo = () => {
        this.networkInfo = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };

        // Adapt loading behavior
        this.adaptToNetworkConditions();
      };

      connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }
  }

  /**
   * Adapt to network conditions
   */
  adaptToNetworkConditions() {
    const { effectiveType, saveData } = this.networkInfo;
    
    // Enable low quality mode on slow connections
    this.options.lowQualityMode = effectiveType === '2g' || saveData;
    
    // Adjust batch size based on connection
    if (effectiveType === '2g') {
      this.options.batchSize = 2;
      this.options.loadingDelay = 500;
    } else if (effectiveType === '3g') {
      this.options.batchSize = 3;
      this.options.loadingDelay = 200;
    } else {
      this.options.batchSize = 5;
      this.options.loadingDelay = 100;
    }

    logger.debug('Adapted to network conditions:', {
      effectiveType,
      saveData,
      lowQualityMode: this.options.lowQualityMode,
      batchSize: this.options.batchSize
    });
  }

  /**
   * Utility methods
   */
  supportsIntersectionObserver() {
    return 'IntersectionObserver' in window;
  }

  getNetworkInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return { effectiveType: '4g', downlink: 10, rtt: 100, saveData: false };
  }

  getRetinaImageVersion(src) {
    const lastDot = src.lastIndexOf('.');
    return src.slice(0, lastDot) + '@2x' + src.slice(lastDot);
  }

  async imageExists(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getTemplate(templateName) {
    // This would integrate with a template system
    // For now, return a simple function
    return (_data) => `<div>Template: ${templateName}</div>`;
  }

  /**
   * Public API methods
   */
  
  /**
   * Load all visible items immediately
   */
  loadVisible() {
    this.processLoadingQueue();
  }

  /**
   * Preload specific items
   */
  preload(selectors = []) {
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element.matches(this.options.imageSelector)) {
          this.queueImageLoad(element);
        } else if (element.matches(this.options.componentSelector)) {
          this.queueComponentLoad(element);
        } else if (element.matches(this.options.contentSelector)) {
          this.queueContentLoad(element);
        }
      });
    });
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      totalQueued: this.loadingQueue.size,
      totalLoaded: this.loadedItems.size,
      totalFailed: this.failedItems.size,
      queueByType: this.getQueueByType(),
      networkInfo: this.networkInfo
    };
  }

  getQueueByType() {
    const stats = { image: 0, component: 0, content: 0 };
    this.loadingQueue.forEach(item => {
      stats[item.type] = (stats[item.type] || 0) + 1;
    });
    return stats;
  }

  /**
   * Event emitter
   */
  emit(eventName, data) {
    const event = new CustomEvent(`lazyLoad:${eventName}`, { detail: data });
    document.dispatchEvent(event);
  }

  on(eventName, callback) {
    document.addEventListener(`lazyLoad:${eventName}`, callback);
  }

  off(eventName, callback) {
    document.removeEventListener(`lazyLoad:${eventName}`, callback);
  }

  /**
   * Initialize fallback for browsers without IntersectionObserver
   */
  initializeFallback() {
    // Simple scroll-based lazy loading
    const handleScroll = rafThrottle(() => {
      const images = document.querySelectorAll(this.options.imageSelector);
      images.forEach(img => {
        if (this.isInViewport(img)) {
          this.queueImageLoad(img);
        }
      });
    });

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Initial check
    handleScroll();
  }

  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top < window.innerHeight + 50 &&
      rect.bottom > -50 &&
      rect.left < window.innerWidth + 50 &&
      rect.right > -50
    );
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear intervals
    if (this.queueInterval) {
      clearInterval(this.queueInterval);
    }

    // Clear queues and caches
    this.loadingQueue.clear();
    this.loadedItems.clear();
    this.failedItems.clear();
    this.componentCache.clear();

    logger.info('Lazy load manager destroyed');
  }
}

// Create default instance
export const lazyLoadManager = new LazyLoadManager();
export default lazyLoadManager;