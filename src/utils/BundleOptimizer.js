/**
 * Bundle Optimizer
 * Utilities for optimizing JavaScript and CSS bundle loading and performance
 */

import logger from './logger.js';
// import { performanceMonitor } from './performanceUtils.js';

export class BundleOptimizer {
  constructor(options = {}) {
    this.options = {
      // Module loading
      enableModulePrefetch: true,
      enableModulePreload: true,
      enableModuleBundle: true,

      // CSS optimization
      enableCriticalCSS: true,
      enableCSSPreload: true,
      criticalCSSThreshold: 1000, // ms

      // JavaScript optimization
      enableJSCodeSplitting: true,
      enableTreeShaking: true,
      enableMinification: true,

      // Loading strategy
      loadingStrategy: 'eager', // 'eager', 'lazy', 'auto'
      priorityHints: true,

      // Performance budgets
      maxBundleSize: 250 * 1024, // 250KB
      maxInitialLoad: 100 * 1024, // 100KB
      warningThreshold: 200 * 1024, // 200KB

      // Caching
      enableServiceWorker: true,
      cacheStrategy: 'networkFirst', // 'cacheFirst', 'networkFirst', 'staleWhileRevalidate'

      ...options,
    };

    this.loadedModules = new Set();
    this.prefetchedModules = new Set();
    this.criticalResources = new Set();
    this.bundleCache = new Map();
    this.loadingPromises = new Map();
    this.performanceMetrics = new Map();

    // Feature detection
    this.features = {
      modulePreload: this.supportsModulePreload(),
      linkPrefetch: this.supportsLinkPrefetch(),
      intersectionObserver: 'IntersectionObserver' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webp: this.supportsWebP(),
      brotli: this.supportsBrotli(),
    };
  }

  /**
   * Initialize bundle optimizer
   */
  async initialize() {
    try {
      logger.info('Initializing bundle optimizer...');

      // Analyze current bundles
      await this.analyzeBundles();

      // Set up critical resource loading
      this.setupCriticalResourceLoading();

      // Initialize prefetching
      this.initializePrefetching();

      // Set up code splitting
      this.setupCodeSplitting();

      // Initialize service worker
      if (this.options.enableServiceWorker) {
        await this.initializeServiceWorker();
      }

      // Monitor bundle performance
      this.monitorBundlePerformance();

      logger.info('✅ Bundle optimizer initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize bundle optimizer:', error);
      throw error;
    }
  }

  /**
   * Analyze current bundles
   */
  async analyzeBundles() {
    const startTime = window.performance.now();

    try {
      // Analyze loaded resources
      const resources = window.performance.getEntriesByType('resource');
      const bundles = resources.filter(
        resource => resource.name.endsWith('.js') || resource.name.endsWith('.css')
      );

      let totalSize = 0;
      let criticalSize = 0;

      bundles.forEach(bundle => {
        const size = bundle.transferSize || bundle.encodedBodySize || 0;
        totalSize += size;

        // Mark as critical if loaded early
        if (bundle.startTime < this.options.criticalCSSThreshold) {
          criticalSize += size;
          this.criticalResources.add(bundle.name);
        }

        this.performanceMetrics.set(bundle.name, {
          size,
          loadTime: bundle.duration,
          type: bundle.name.endsWith('.js') ? 'javascript' : 'css',
          critical: bundle.startTime < this.options.criticalCSSThreshold,
        });
      });

      // Check against performance budget
      if (totalSize > this.options.maxBundleSize) {
        logger.warn(
          `Bundle size (${(totalSize / 1024).toFixed(2)}KB) exceeds budget (${(this.options.maxBundleSize / 1024).toFixed(2)}KB)`
        );
        this.emit('budgetExceeded', { totalSize, budget: this.options.maxBundleSize });
      }

      if (criticalSize > this.options.maxInitialLoad) {
        logger.warn(
          `Critical resource size (${(criticalSize / 1024).toFixed(2)}KB) exceeds initial load budget`
        );
        this.emit('criticalBudgetExceeded', { criticalSize, budget: this.options.maxInitialLoad });
      }

      const analysisTime = window.performance.now() - startTime;
      logger.debug(`Bundle analysis completed in ${analysisTime.toFixed(2)}ms`, {
        totalBundles: bundles.length,
        totalSize: `${(totalSize / 1024).toFixed(2)}KB`,
        criticalSize: `${(criticalSize / 1024).toFixed(2)}KB`,
      });
    } catch (error) {
      logger.error('Bundle analysis failed:', error);
      throw error;
    }
  }

  /**
   * Set up critical resource loading
   */
  setupCriticalResourceLoading() {
    // Identify and preload critical resources
    this.preloadCriticalResources();

    // Extract and inline critical CSS
    if (this.options.enableCriticalCSS) {
      this.extractCriticalCSS();
    }

    // Defer non-critical resources
    this.deferNonCriticalResources();
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources() {
    const criticalResources = [
      // Core CSS
      '/src/styles/base/styles.css',
      '/src/styles/base/responsive.css',

      // Core JavaScript
      '/src/components/BaseComponent.js',
      '/src/utils/logger.js',
    ];

    criticalResources.forEach(resource => {
      this.preloadResource(resource, 'high');
    });
  }

  /**
   * Preload resource with priority hint
   */
  preloadResource(href, priority = 'medium') {
    if (this.prefetchedModules.has(href)) return;

    const link = document.createElement('link');
    link.rel = href.endsWith('.js') ? 'modulepreload' : 'preload';
    link.href = href;

    if (priority && this.options.priorityHints) {
      link.fetchPriority = priority;
    }

    if (href.endsWith('.css')) {
      link.as = 'style';
    } else if (href.endsWith('.js')) {
      link.as = 'script';
    }

    // Add integrity if available
    const integrity = this.getResourceIntegrity(href);
    if (integrity) {
      link.integrity = integrity;
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
    this.prefetchedModules.add(href);

    logger.debug(`Preloaded resource: ${href} (priority: ${priority})`);
  }

  /**
   * Extract critical CSS
   */
  extractCriticalCSS() {
    // This would typically be done at build time
    // Here we'll implement runtime critical CSS extraction for above-the-fold content

    const criticalElements = this.getAboveTheFoldElements();
    const criticalStyles = this.extractStylesForElements(criticalElements);

    if (criticalStyles.length > 0) {
      this.inlineCriticalStyles(criticalStyles);
    }
  }

  /**
   * Get above-the-fold elements
   */
  getAboveTheFoldElements() {
    const viewportHeight = window.innerHeight;
    const elements = document.querySelectorAll('*');
    const criticalElements = [];

    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.top < viewportHeight && rect.bottom > 0) {
        criticalElements.push(element);
      }
    });

    return criticalElements;
  }

  /**
   * Extract styles for specific elements
   */
  extractStylesForElements(elements) {
    const criticalRules = new Set();
    const sheets = Array.from(document.styleSheets);

    sheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);

        rules.forEach(rule => {
          // eslint-disable-next-line no-undef
          if (rule.type === CSSRule.STYLE_RULE) {
            // Check if rule applies to any critical element
            elements.forEach(element => {
              try {
                if (element.matches(rule.selectorText)) {
                  criticalRules.add(rule.cssText);
                }
              } catch (e) {
                // Invalid selector, skip
              }
            });
          }
        });
      } catch (e) {
        // Cross-origin stylesheet, skip
        logger.debug('Cannot access stylesheet rules (cross-origin):', sheet.href);
      }
    });

    return Array.from(criticalRules);
  }

  /**
   * Inline critical styles
   */
  inlineCriticalStyles(styles) {
    const criticalCSS = styles.join('\n');

    // Create style element for critical CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = criticalCSS;
    styleElement.setAttribute('data-critical', 'true');

    // Insert before first stylesheet
    const firstStylesheet = document.querySelector('link[rel="stylesheet"]');
    if (firstStylesheet) {
      document.head.insertBefore(styleElement, firstStylesheet);
    } else {
      document.head.appendChild(styleElement);
    }

    logger.debug(`Inlined ${(criticalCSS.length / 1024).toFixed(2)}KB of critical CSS`);
  }

  /**
   * Defer non-critical resources
   */
  deferNonCriticalResources() {
    // Defer non-critical stylesheets
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach(link => {
      if (!this.criticalResources.has(link.href)) {
        this.deferStylesheet(link);
      }
    });

    // Defer non-critical scripts
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      if (!this.criticalResources.has(script.src)) {
        this.deferScript(script);
      }
    });
  }

  /**
   * Defer stylesheet loading
   */
  deferStylesheet(link) {
    // Use media attribute trick to defer loading
    const originalMedia = link.media || 'all';
    link.media = 'print';

    link.addEventListener(
      'load',
      () => {
        link.media = originalMedia;
      },
      { once: true }
    );

    // Fallback timeout
    setTimeout(() => {
      if (link.media !== originalMedia) {
        link.media = originalMedia;
      }
    }, 3000);
  }

  /**
   * Defer script loading
   */
  deferScript(script) {
    script.defer = true;
  }

  /**
   * Initialize prefetching
   */
  initializePrefetching() {
    // Set up intersection observer for link prefetching
    if (this.features.intersectionObserver) {
      this.setupLinkPrefetching();
    }

    // Set up idle prefetching
    this.setupIdlePrefetching();

    // Set up route-based prefetching (handled in setupRouteSplitting)
    // this.setupRoutePrefetching(); // This method doesn't exist
  }

  /**
   * Set up link prefetching
   */
  setupLinkPrefetching() {
    // eslint-disable-next-line no-undef
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target;
            this.prefetchLink(link);
            observer.unobserve(link);
          }
        });
      },
      {
        rootMargin: '200px',
      }
    );

    // Observe all internal links
    const links = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
    links.forEach(link => observer.observe(link));

    logger.debug(`Set up prefetching for ${links.length} internal links`);
  }

  /**
   * Prefetch link resources
   */
  prefetchLink(link) {
    const href = link.href;
    if (this.prefetchedModules.has(href)) return;

    // Create prefetch link
    const prefetchLink = document.createElement('link');
    prefetchLink.rel = 'prefetch';
    prefetchLink.href = href;

    document.head.appendChild(prefetchLink);
    this.prefetchedModules.add(href);

    logger.debug(`Prefetched link: ${href}`);
  }

  /**
   * Set up idle prefetching
   */
  setupIdlePrefetching() {
    if ('requestIdleCallback' in window) {
      const prefetchWhenIdle = () => {
        // eslint-disable-next-line no-undef
        requestIdleCallback(() => {
          this.prefetchIdleResources();
        });
      };

      // Start prefetching after initial load
      if (document.readyState === 'complete') {
        prefetchWhenIdle();
      } else {
        window.addEventListener('load', prefetchWhenIdle, { once: true });
      }
    }
  }

  /**
   * Prefetch resources during idle time
   */
  prefetchIdleResources() {
    const idleResources = [
      // Components that might be used later
      '/src/components/ui/Modal.js',
      '/src/components/ui/Toast.js',
      '/src/features/games/bubble-pop/BubblePopGame.js',

      // Utility modules
      '/src/utils/AnimationManager.js',
      '/src/utils/EventDelegation.js',
    ];

    idleResources.forEach(resource => {
      if (!this.prefetchedModules.has(resource)) {
        this.preloadResource(resource, 'low');
      }
    });
  }

  /**
   * Set up code splitting
   */
  setupCodeSplitting() {
    // Create dynamic import wrapper
    this.createDynamicImportWrapper();

    // Set up route-based splitting
    this.setupRouteSplitting();

    // Set up component-based splitting
    this.setupComponentSplitting();
  }

  /**
   * Create dynamic import wrapper with caching and error handling
   */
  createDynamicImportWrapper() {
    window.lazyImport = async (modulePath, options = {}) => {
      const { timeout = 10000, fallback = null, cache = true } = options;

      // Check cache first
      if (cache && this.bundleCache.has(modulePath)) {
        return this.bundleCache.get(modulePath);
      }

      // Check if already loading
      if (this.loadingPromises.has(modulePath)) {
        return this.loadingPromises.get(modulePath);
      }

      const startTime = performance.now();

      const loadPromise = Promise.race([
        this.importWithRetry(modulePath),
        this.createTimeoutPromise(timeout),
      ])
        .then(module => {
          const loadTime = performance.now() - startTime;

          // Cache successful import
          if (cache) {
            this.bundleCache.set(modulePath, module);
          }

          // Track performance
          this.performanceMetrics.set(modulePath, {
            loadTime,
            type: 'dynamic-import',
            cached: false,
          });

          logger.debug(`Dynamic import completed: ${modulePath} (${loadTime.toFixed(2)}ms)`);
          return module;
        })
        .catch(error => {
          logger.error(`Failed to import module: ${modulePath}`, error);

          if (fallback) {
            logger.debug(`Using fallback for: ${modulePath}`);
            return fallback;
          }

          throw error;
        })
        .finally(() => {
          this.loadingPromises.delete(modulePath);
        });

      this.loadingPromises.set(modulePath, loadPromise);
      return loadPromise;
    };
  }

  /**
   * Perform a dynamic module import.
   * Kept as an instance method so tests and callers can inject a custom importer.
   */
  importModule(modulePath) {
    return import(/* @vite-ignore */ modulePath);
  }

  /**
   * Import with retry logic
   */
  async importWithRetry(modulePath, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.importModule(modulePath);
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          logger.debug(`Import attempt ${attempt} failed, retrying in ${delay}ms:`, modulePath);
          await this.delay(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Create timeout promise
   */
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Module import timeout: ${timeout}ms exceeded`));
      }, timeout);
    });
  }

  /**
   * Set up route-based splitting
   */
  setupRouteSplitting() {
    // This would integrate with a router
    // For now, set up basic page-based splitting

    const routeMap = {
      // eslint-disable-next-line no-undef
      '/games/bubble-pop': () => lazyImport('/src/features/games/bubble-pop/BubblePopGame.js'),
      '/games/word-scramble': () =>
        // eslint-disable-next-line no-undef
        lazyImport('/src/features/games/word-scramble/WordScrambleGame.js'),
      // eslint-disable-next-line no-undef
      '/profile': () => lazyImport('/src/features/user/Profile.js'),
      // eslint-disable-next-line no-undef
      '/settings': () => lazyImport('/src/features/user/Settings.js'),
    };

    // Pre-split routes based on current path
    const currentPath = window.location.pathname;
    if (routeMap[currentPath]) {
      // Prefetch current route module
      routeMap[currentPath]().catch(error => {
        logger.error('Failed to load route module:', error);
      });
    }

    // Prefetch likely next routes
    this.prefetchLikelyRoutes(routeMap);
  }

  /**
   * Prefetch likely routes based on user behavior
   */
  prefetchLikelyRoutes(routeMap) {
    // Simple heuristic: prefetch routes linked from current page
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (routeMap[href]) {
        // Prefetch on hover
        link.addEventListener(
          'mouseenter',
          () => {
            routeMap[href]();
          },
          { once: true }
        );
      }
    });
  }

  /**
   * Set up component-based splitting
   */
  setupComponentSplitting() {
    // Register lazy components
    this.registerLazyComponent('Modal', '/src/components/ui/Modal.js');
    this.registerLazyComponent('Toast', '/src/components/ui/Toast.js');
    this.registerLazyComponent('CharacterCustomizer', '/src/components/ui/CharacterCustomizer.js');
  }

  /**
   * Register lazy component
   */
  registerLazyComponent(name, path) {
    window[`Lazy${name}`] = async (container, options) => {
      try {
        // eslint-disable-next-line no-undef
        const module = await lazyImport(path);
        const ComponentClass = module.default || module[name];

        const component = new ComponentClass(options);
        await component.render(container);

        return component;
      } catch (error) {
        logger.error(`Failed to load lazy component ${name}:`, error);
        throw error;
      }
    };
  }

  /**
   * Initialize service worker
   */
  async initializeServiceWorker() {
    if (!this.features.serviceWorker) {
      logger.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/serviceWorker.js');

      registration.addEventListener('updatefound', () => {
        logger.info('Service Worker update found');
        this.emit('serviceWorkerUpdate', { registration });
      });

      logger.info('Service Worker registered successfully');
      this.emit('serviceWorkerRegistered', { registration });
    } catch (error) {
      logger.error('Service Worker registration failed:', error);
      this.emit('serviceWorkerError', { error });
    }
  }

  /**
   * Monitor bundle performance
   */
  monitorBundlePerformance() {
    // Monitor resource loading. Both constructing the observer and calling
    // observe() can throw in older browsers, so guard the whole setup.
    try {
      // eslint-disable-next-line no-undef
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.name.endsWith('.js') || entry.name.endsWith('.css')) {
            this.trackResourcePerformance(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // Fallback for older browsers
      this.monitorPerformanceFallback();
    }
  }

  /**
   * Track resource performance
   */
  trackResourcePerformance(entry) {
    // Ignore malformed entries (e.g. missing or non-string name)
    if (!entry || typeof entry.name !== 'string') {
      logger.warn('Ignoring malformed resource entry:', entry);
      return;
    }

    const size = entry.transferSize || entry.encodedBodySize || 0;
    const loadTime = entry.duration;

    // Check against performance budgets
    if (size > this.options.warningThreshold) {
      logger.warn(`Large resource detected: ${entry.name} (${(size / 1024).toFixed(2)}KB)`);
      this.emit('largeResource', { url: entry.name, size, loadTime });
    }

    // Track slow loading resources
    if (loadTime > 1000) {
      logger.warn(`Slow resource detected: ${entry.name} (${loadTime.toFixed(2)}ms)`);
      this.emit('slowResource', { url: entry.name, size, loadTime });
    }

    // Update metrics
    this.performanceMetrics.set(entry.name, {
      size,
      loadTime,
      type: entry.name.endsWith('.js') ? 'javascript' : 'css',
      timestamp: entry.startTime,
    });
  }

  /**
   * Monitor performance fallback for older browsers
   */
  monitorPerformanceFallback() {
    // Use MutationObserver to watch for new script/link elements
    // eslint-disable-next-line no-undef
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'SCRIPT' || node.nodeName === 'LINK') {
            this.trackElementLoad(node);
          }
        });
      });
    });

    observer.observe(document.head, { childList: true });
  }

  /**
   * Track element load time
   */
  trackElementLoad(element) {
    const startTime = performance.now();

    element.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      const url = element.src || element.href;

      this.performanceMetrics.set(url, {
        loadTime,
        type: element.nodeName.toLowerCase(),
        timestamp: startTime,
      });
    });

    element.addEventListener('error', () => {
      const url = element.src || element.href;
      logger.error(`Failed to load resource: ${url}`);
      this.emit('resourceError', { url, element });
    });
  }

  /**
   * Feature detection methods
   */
  supportsModulePreload() {
    const link = document.createElement('link');
    return 'relList' in link && link.relList.supports('modulepreload');
  }

  supportsLinkPrefetch() {
    const link = document.createElement('link');
    return 'relList' in link && link.relList.supports('prefetch');
  }

  supportsWebP() {
    try {
      // Check if we're in a test environment
      // eslint-disable-next-line no-undef
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
        return false; // Default to false in test environment
      }

      const canvas = document.createElement('canvas');
      if (!canvas || typeof canvas.toDataURL !== 'function') {
        return false;
      }

      canvas.width = 1;
      canvas.height = 1;
      const dataUrl = canvas.toDataURL('image/webp');
      return dataUrl && dataUrl.indexOf('data:image/webp') === 0;
    } catch (error) {
      // Fallback for test environments or browsers without WebP support
      return false;
    }
  }

  supportsBrotli() {
    return 'CompressionStream' in window;
  }

  /**
   * Utility methods
   */
  getResourceIntegrity(_url) {
    // This would typically come from a build manifest
    // For now, return null (no integrity checking)
    return null;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Public API methods
   */

  /**
   * Get bundle performance metrics
   */
  getMetrics() {
    const metrics = Array.from(this.performanceMetrics.entries()).map(([url, data]) => ({
      url,
      ...data,
    }));

    return {
      totalBundles: metrics.length,
      totalSize: metrics.reduce((sum, m) => sum + (m.size || 0), 0),
      averageLoadTime: metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length,
      bundles: metrics,
      cacheHitRate: this.bundleCache.size / Math.max(this.loadedModules.size, 1),
      features: this.features,
    };
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.bundleCache.clear();
    this.prefetchedModules.clear();
    this.loadingPromises.clear();
    logger.info('Bundle caches cleared');
  }

  /**
   * Preload specific resources
   */
  preloadResources(resources = []) {
    resources.forEach(resource => {
      if (typeof resource === 'string') {
        this.preloadResource(resource);
      } else {
        this.preloadResource(resource.url, resource.priority);
      }
    });
  }

  /**
   * Get loading statistics
   */
  getLoadingStats() {
    return {
      loadedModules: this.loadedModules.size,
      prefetchedModules: this.prefetchedModules.size,
      cachedModules: this.bundleCache.size,
      activeLoading: this.loadingPromises.size,
      criticalResources: this.criticalResources.size,
    };
  }

  /**
   * Event emitter methods
   */
  emit(eventName, data) {
    const event = new CustomEvent(`bundleOptimizer:${eventName}`, { detail: data });
    document.dispatchEvent(event);
  }

  on(eventName, callback) {
    document.addEventListener(`bundleOptimizer:${eventName}`, callback);
  }

  off(eventName, callback) {
    document.removeEventListener(`bundleOptimizer:${eventName}`, callback);
  }

  /**
   * Track bundle size for performance budget analysis
   */
  trackBundleSize(bundleName, size) {
    this.performanceMetrics.set(bundleName, {
      ...(this.performanceMetrics.get(bundleName) || {}),
      size,
      timestamp: performance.now(),
    });
  }

  /**
   * Calculate code splitting effectiveness
   */
  calculateSplittingEffectiveness(splittingMetrics) {
    const { originalBundleSize, splitBundles, cacheableSize } = splittingMetrics;
    const totalSplitSize = splitBundles.reduce((sum, bundle) => sum + bundle.size, 0);

    return {
      sizeReduction: ((originalBundleSize - totalSplitSize) / originalBundleSize) * 100,
      cacheability: (cacheableSize / totalSplitSize) * 100,
      loadTimeImprovement: this.estimateLoadTimeImprovement(splitBundles),
      bundleCount: splitBundles.length,
    };
  }

  /**
   * Estimate load time improvement from splitting
   */
  estimateLoadTimeImprovement(splitBundles) {
    // Simplified estimation - parallel loading reduces total time
    const parallelLoadTime = Math.max(
      ...splitBundles.map(bundle => this.estimateLoadTime(bundle.size))
    );
    const sequentialLoadTime = splitBundles.reduce(
      (sum, bundle) => sum + this.estimateLoadTime(bundle.size),
      0
    );

    return ((sequentialLoadTime - parallelLoadTime) / sequentialLoadTime) * 100;
  }

  /**
   * Estimate load time based on size
   */
  estimateLoadTime(size) {
    // Simple estimation: ~1ms per KB on average connection
    return (size / 1024) * 1;
  }

  /**
   * Detect circular dependencies in modules
   */
  detectCircularDependencies(dependencyMap) {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = node => {
      if (recursionStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const dependencies = dependencyMap[node] || [];
      for (const dep of dependencies) {
        if (hasCycle(dep)) return true;
      }

      recursionStack.delete(node);
      return false;
    };

    return Object.keys(dependencyMap).some(hasCycle);
  }

  /**
   * Optimize chunk grouping based on usage patterns
   */
  optimizeChunkGrouping(modules) {
    // Group modules by frequency and size
    const highFrequency = modules.filter(m => m.frequency > 0.5);
    const lowFrequency = modules.filter(m => m.frequency <= 0.5);

    return {
      vendor: highFrequency.filter(m => m.size < 100000), // < 100KB high frequency
      lazy: lowFrequency.concat(highFrequency.filter(m => m.size >= 100000)),
    };
  }

  /**
   * Parse webpack-style magic comments
   */
  parseMagicComments(importString) {
    const chunkNameMatch = importString.match(/webpackChunkName:\s*["']([^"']+)["']/);
    const prefetchMatch = importString.match(/webpackPrefetch:\s*(true|false)/);
    const preloadMatch = importString.match(/webpackPreload:\s*(true|false)/);

    return {
      chunkName: chunkNameMatch ? chunkNameMatch[1] : null,
      prefetch: prefetchMatch ? prefetchMatch[1] === 'true' : false,
      preload: preloadMatch ? preloadMatch[1] === 'true' : false,
    };
  }

  /**
   * Prefetch chunk with priority
   */
  prefetchChunk(chunkName, priority = 'medium') {
    const chunkUrl = this.resolveChunkUrl(chunkName);
    if (chunkUrl) {
      this.preloadResource(chunkUrl, priority);
    }
  }

  /**
   * Resolve chunk URL from chunk name
   */
  resolveChunkUrl(chunkName) {
    // Simple mapping - in real implementation would use webpack manifest
    const chunkMap = {
      'critical-chunk': '/chunks/critical.js',
      'secondary-chunk': '/chunks/secondary.js',
      'optional-chunk': '/chunks/optional.js',
    };
    return chunkMap[chunkName];
  }

  /**
   * Determine if resource should be split
   */
  shouldSplitResource(resourceUrl) {
    // Split JavaScript files by default
    return (
      resourceUrl.endsWith('.js') &&
      !resourceUrl.includes('critical') &&
      !resourceUrl.includes('inline')
    );
  }

  /**
   * Apply loading strategy to resource
   */
  applyLoadingStrategy(resourceUrl) {
    const strategy = this.options.loadingStrategy;

    switch (strategy) {
      case 'eager':
        this.preloadResource(resourceUrl);
        break;
      case 'lazy':
        // Don't preload, load on demand
        break;
      case 'auto':
        if (this.criticalResources.has(resourceUrl)) {
          this.preloadResource(resourceUrl);
        }
        break;
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Clear all caches
    this.clearCache();

    // Clear performance metrics
    this.performanceMetrics.clear();

    // Remove global functions
    if (window.lazyImport) {
      delete window.lazyImport;
    }

    logger.info('Bundle optimizer destroyed');
  }
}

// Create and export singleton instance
export const bundleOptimizer = new BundleOptimizer();
export default bundleOptimizer;
