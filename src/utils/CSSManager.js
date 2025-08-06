/**
 * CSSManager - Advanced CSS loading, caching, and injection system
 * Extends patterns from ThemeService.js caching system for component CSS management
 * 
 * Requirements: FR-1.4, FR-1.5, FR-3.4, FR-3.5, NFR-1.1, NFR-1.2
 * - FR-1.4: BaseComponentV2 MUST automatically inject component CSS
 * - FR-1.5: CSS injection MUST prevent duplicate loading
 * - FR-3.4: Build CSS cache invalidation system
 * - FR-3.5: Monitor CSS loading performance
 * - NFR-1.1: CSS loading time MUST not increase by more than 10%
 * - NFR-1.2: Total CSS bundle size MUST be reduced by at least 20%
 * 
 * Task 3.2: Integrated with CSSPerformanceMonitor for comprehensive performance tracking
 */

import { cssPerformanceMonitor } from './CSSPerformanceMonitor.js';
import CSSScopingManager from './CSSScopingManager.js';
import themeTokenProcessor from './ThemeTokenProcessor.js';

class CSSManager {
  constructor() {
    // CSS file cache - similar to ThemeService cache pattern
    this.cache = new Map();
    
    // Loading promises to prevent duplicate requests
    this.loadingPromises = new Map();
    
    // Track injected stylesheets to prevent duplicates
    this.injectedStylesheets = new Set();
    
    // Track CSS usage for cache optimization
    this.usageTracker = new Map();
    
    // Track failed loads to prevent retries (from DependencyResolver pattern)
    this.failedLoads = new Set();
    
    // Performance metrics (legacy - delegated to CSSPerformanceMonitor)
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      loadTimes: new Map(),
      totalSize: 0,
      failedLoads: 0,
      retryAttempts: 0
    };

    // Configuration (following DependencyResolver pattern)
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      enableCaching: true,
      logLevel: 'warn', // 'debug', 'info', 'warn', 'error', 'silent'
      enablePerformanceMonitoring: true, // Task 3.2: Enable integrated performance monitoring
    };

    // Task 3.2: Integrate CSSPerformanceMonitor for comprehensive performance tracking
    this.performanceMonitor = cssPerformanceMonitor;
    
    // Track active performance monitoring operations
    this.activeOperations = new Map(); // operationId -> operation metadata

    // Task 7.3: Integrate ThemeTokenProcessor for automatic token processing during CSS loading
    this.themeTokenProcessor = themeTokenProcessor;
    
    // Track theme token processing operations for performance monitoring
    this.tokenProcessingOperations = new Map(); // operationId -> { cssPath, startTime, componentName }

    // Task 6.2: Initialize CSS Scoping Manager for automatic scoping pipeline integration
    this.scopingManager = new CSSScopingManager({
      defaultStrategy: 'class',
      enableDebugMode: false,
      scopingPrefix: 'component',
      cacheEnabled: true,
      performanceTracking: true
    });
    
    // CSS scoping configuration
    this.scopingConfig = {
      enableAutoScoping: true, // NFR-2.3: Enable automatic CSS scoping
      defaultScopingStrategy: 'class',
      scopingMode: 'injection', // 'injection' | 'processing' | 'both'
      preserveGlobalSelectors: [':root', 'html', 'body', '@keyframes'],
      componentScopeCache: new Map() // Cache component scope identifiers
    };

    // Task 7.3: Theme token processing configuration (FR-2.1, FR-2.3, NFR-1.3)
    this.tokenProcessingConfig = {
      enableAutoTokenProcessing: true, // FR-2.1: Enable automatic theme token processing
      processingMode: 'loading', // 'loading' | 'injection' | 'both' - when to process tokens
      enableTokenCache: true, // Cache processed token results
      maxProcessingTime: 200, // NFR-1.3: Theme switching within 200ms target
      enablePerformanceTracking: true, // Track token processing performance
      fallbackOnError: true, // FR-2.1: Graceful fallback if token processing fails
      validateTokenUsage: false, // FR-2.4: Enable token validation (disabled by default for performance)
      componentContext: {
        extractFromPath: true, // Extract component name from CSS path
        inheritanceMode: 'cascade', // Token inheritance strategy
        enableComponentScoping: true // Scope tokens to components
      },
      tokenCache: new Map() // Cache for processed CSS with tokens resolved
    };

    // Initialize performance monitoring
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring for cache metrics and CSSPerformanceMonitor integration
   * Task 3.2: Enhanced performance monitoring with CSSPerformanceMonitor integration
   * @private
   */
  initializePerformanceMonitoring() {
    // Track cache performance similar to ThemeService pattern
    this.originalCacheHas = this.cache.has.bind(this.cache);
    this.originalCacheGet = this.cache.get.bind(this.cache);
    
    this.cache.has = (key) => {
      const result = this.originalCacheHas(key);
      
      // Update legacy metrics for backward compatibility
      if (result) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
      }
      
      // Task 3.2: Integrate with CSSPerformanceMonitor for comprehensive tracking
      if (this.config.enablePerformanceMonitoring && this.performanceMonitor) {
        // Extract CSS path from cache key (format: css:path or css:path:scope)
        const cssPath = this.extractCSSPathFromCacheKey(key);
        if (cssPath) {
          if (result) {
            this.performanceMonitor.recordCacheHit(cssPath);
          } else {
            this.performanceMonitor.recordCacheMiss(cssPath);
          }
        }
      }
      
      return result;
    };
  }

  /**
   * Extract CSS path from cache key for performance monitoring
   * Task 3.2: Helper method for performance tracking integration
   * @private
   * @param {string} cacheKey - Cache key in format css:path or css:path:scope
   * @returns {string|null} - Extracted CSS path or null if invalid format
   */
  extractCSSPathFromCacheKey(cacheKey) {
    if (typeof cacheKey !== 'string' || !cacheKey.startsWith('css:')) {
      return null;
    }
    
    // Remove 'css:' prefix and extract path (before any scope suffix)
    const pathPart = cacheKey.substring(4); // Remove 'css:'
    const colonIndex = pathPart.indexOf(':');
    
    // Return path without scope suffix
    return colonIndex !== -1 ? pathPart.substring(0, colonIndex) : pathPart;
  }

  /**
   * Configure the CSS manager (following DependencyResolver pattern)
   * @param {Object} options - Configuration options
   * @returns {CSSManager} - Returns this for chaining
   */
  configure(options = {}) {
    Object.assign(this.config, options);
    
    // Task 6.2: Configure CSS scoping settings if provided
    if (options.scoping) {
      Object.assign(this.scopingConfig, options.scoping);
    }
    
    // Update scoping manager configuration
    if (options.scoping && this.scopingManager) {
      this.scopingManager.options = {
        ...this.scopingManager.options,
        ...options.scoping
      };
    }
    
    // Task 7.3: Configure theme token processing settings if provided
    if (options.tokenProcessing) {
      Object.assign(this.tokenProcessingConfig, options.tokenProcessing);
      
      // Update ThemeTokenProcessor configuration if needed
      if (this.themeTokenProcessor && options.tokenProcessing.processorConfig) {
        this.themeTokenProcessor.configure(options.tokenProcessing.processorConfig);
      }
    }
    
    return this;
  }

  /**
   * Configure CSS scoping behavior for automatic scoping during injection
   * Task 6.2: CSS scoping configuration method for NFR-2.3 compliance
   * @param {Object} scopingOptions - Scoping configuration options
   * @param {boolean} scopingOptions.enableAutoScoping - Enable automatic CSS scoping
   * @param {string} scopingOptions.defaultScopingStrategy - Default scoping strategy ('class', 'attribute', 'css-modules')
   * @param {string} scopingOptions.scopingMode - When to apply scoping ('injection', 'processing', 'both')
   * @param {Array<string>} scopingOptions.preserveGlobalSelectors - Selectors to preserve from scoping
   * @param {string} scopingOptions.scopingPrefix - Prefix for generated scope identifiers
   * @returns {CSSManager} - Returns this for chaining
   */
  configureCSSScoping(scopingOptions = {}) {
    // Update scoping configuration
    Object.assign(this.scopingConfig, scopingOptions);
    
    // Update scoping manager options
    if (this.scopingManager) {
      const managerOptions = {
        defaultStrategy: scopingOptions.defaultScopingStrategy || this.scopingConfig.defaultScopingStrategy,
        scopingPrefix: scopingOptions.scopingPrefix || this.scopingManager.options.scopingPrefix,
        enableDebugMode: scopingOptions.enableDebugMode || this.scopingManager.options.enableDebugMode,
        cacheEnabled: scopingOptions.cacheEnabled !== false,
        performanceTracking: scopingOptions.performanceTracking !== false
      };
      
      Object.assign(this.scopingManager.options, managerOptions);
    }
    
    this.log('debug', 'CSS scoping configuration updated', this.scopingConfig);
    return this;
  }

  /**
   * Load and cache CSS file with duplicate prevention and enhanced error handling
   * Enhanced with DependencyResolver patterns: timeout, retry, improved error handling
   * Task 3.2: Integrated with CSSPerformanceMonitor for comprehensive timing and cache metrics
   * @param {string} cssPath - Path to CSS file
   * @param {Object} options - Loading options
   * @param {boolean} options.cache - Whether to cache the CSS content (default: true)
   * @param {string} options.scope - Scoping identifier for the CSS
   * @param {number} options.priority - Loading priority (higher = earlier, default: 0)
   * @param {number} options.timeout - Loading timeout (default: from config)
   * @param {number} options.maxRetries - Max retry attempts (default: from config)
   * @param {boolean} options.enableCache - Enable caching (default: from config)
   * @param {boolean} options.isCritical - Whether this is critical CSS for performance tracking
   * @returns {Promise<string>} - Promise resolving to CSS content
   */
  async loadAndCache(cssPath, options = {}) {
    const {
      cache = this.config.enableCaching,
      scope = null,
      priority = 0,
      timeout = this.config.timeout,
      maxRetries = this.config.maxRetries,
      enableCache = this.config.enableCaching,
      isCritical = false // Task 3.2: Track critical CSS for performance monitoring
    } = options;

    const cacheKey = `css:${cssPath}${scope ? `:${scope}` : ''}`;
    
    // Task 3.2: Start performance monitoring for this CSS load operation
    let performanceOperationId = null;
    if (this.config.enablePerformanceMonitoring && this.performanceMonitor) {
      performanceOperationId = this.performanceMonitor.startLoadTracking(cssPath, {
        isCritical,
        scope,
        priority
      });
      
      // Store operation metadata for later reference
      if (performanceOperationId) {
        this.activeOperations.set(performanceOperationId, {
          cssPath,
          cacheKey,
          startTime: performance.now(),
          options: { ...options }
        });
      }
    }
    
    this.log('debug', `Loading CSS: ${cssPath}${scope ? ` (scope: ${scope})` : ''}`);
    
    // Check cache first (prevents duplicate loading - FR-1.5)
    if (cache && enableCache && this.cache.has(cacheKey)) {
      this.log('debug', `CSS ${cssPath} loaded from cache`);
      this.updateUsageTracker(cssPath);
      
      // Task 3.2: End performance monitoring for cache hit
      if (performanceOperationId && this.performanceMonitor) {
        const cachedContent = this.cache.get(cacheKey);
        this.performanceMonitor.endLoadTracking(performanceOperationId, {
          success: true,
          fromCache: true,
          size: cachedContent ? cachedContent.length : 0
        });
        this.activeOperations.delete(performanceOperationId);
      }
      
      return this.cache.get(cacheKey);
    }

    // Check if already loading to prevent duplicate requests
    if (this.loadingPromises.has(cacheKey)) {
      this.log('debug', `CSS ${cssPath} already loading, waiting...`);
      return this.loadingPromises.get(cacheKey);
    }

    // Check if previously failed (following DependencyResolver pattern)
    if (this.failedLoads.has(cssPath)) {
      throw new Error(`CSS '${cssPath}' previously failed to load`);
    }

    // Create loading promise with enhanced error handling
    const loadingPromise = this.performLoadWithRetry(cssPath, {
      ...options,
      timeout,
      maxRetries,
      scope
    });
    
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const startTime = performance.now();
      const cssContent = await loadingPromise;
      const loadTime = performance.now() - startTime;

      // Cache the content if caching is enabled
      if (cache && enableCache) {
        this.cache.set(cacheKey, cssContent);
        this.metrics.loadTimes.set(cssPath, loadTime);
        this.metrics.totalSize += cssContent.length;
      }

      this.updateUsageTracker(cssPath);
      this.log('info', `CSS ${cssPath} loaded successfully (${loadTime.toFixed(2)}ms)`);
      
      // Task 3.2: End performance monitoring for successful load
      if (performanceOperationId && this.performanceMonitor) {
        this.performanceMonitor.endLoadTracking(performanceOperationId, {
          success: true,
          fromCache: false,
          size: cssContent.length
        });
        this.activeOperations.delete(performanceOperationId);
      }
      
      return cssContent;

    } catch (error) {
      this.failedLoads.add(cssPath);
      this.metrics.failedLoads++;
      this.log('error', `Failed to load CSS ${cssPath}:`, error);
      
      // Task 3.2: End performance monitoring for failed load
      if (performanceOperationId && this.performanceMonitor) {
        this.performanceMonitor.endLoadTracking(performanceOperationId, {
          success: false,
          error: error.message
        });
        this.activeOperations.delete(performanceOperationId);
      }
      
      throw error;
    } finally {
      // Clean up loading promise
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Perform CSS load with retry mechanism (following DependencyResolver pattern)
   * @private
   * @param {string} cssPath - CSS file path
   * @param {Object} options - Loading options
   * @returns {Promise<string>} - CSS content
   */
  async performLoadWithRetry(cssPath, options = {}) {
    const { maxRetries = this.config.maxRetries, timeout = this.config.timeout } = options;
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.metrics.retryAttempts++;
          this.log('debug', `Retry attempt ${attempt} for CSS ${cssPath}`);
          
          // Add delay before retry (following DependencyResolver pattern)
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        }
        
        return await this.loadCSSContent(cssPath, { ...options, timeout });
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain types of errors
        if (error.name === 'AbortError' || error.status === 404) {
          break;
        }
        
        this.log('warn', `CSS load attempt ${attempt + 1} failed for ${cssPath}:`, error.message);
      }
    }
    
    throw new Error(`Failed to load CSS ${cssPath} after ${maxRetries + 1} attempts: ${lastError.message}`);
  }

  /**
   * Load CSS content from file with timeout and enhanced error handling
   * Enhanced with DependencyResolver fetch patterns and Task 6.2 CSS scoping integration
   * @private
   * @param {string} cssPath - Path to CSS file
   * @param {Object} options - Loading options
   * @param {number} options.timeout - Request timeout
   * @param {string} options.scope - Component scope for CSS scoping
   * @param {string} options.componentName - Component name for scoping
   * @param {string} options.scopingStrategy - Scoping strategy override
   * @param {boolean} options.enableScoping - Enable CSS scoping for this load
   * @returns {Promise<string>} - Promise resolving to CSS content (potentially scoped)
   */
  async loadCSSContent(cssPath, options = {}) {
    const { 
      timeout = this.config.timeout, 
      scope,
      componentName = null,
      scopingStrategy = null,
      enableScoping = null // null = use global config, true/false = override
    } = options;
    
    // Create timeout ID for cleanup tracking
    let timeoutId = null;
    
    // Create timeout promise (following DependencyResolver pattern)
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`CSS loading timeout for ${cssPath} (${timeout}ms)`));
      }, timeout);
    });

    // Create fetch promise with AbortController for cleanup
    const controller = new AbortController();
    const fetchPromise = this.fetchWithVariations(cssPath, controller.signal);

    try {
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Clear timeout if fetch wins
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (!response.ok) {
        const error = new Error(`Failed to load CSS: ${response.status} ${response.statusText}`);
        error.status = response.status;
        error.statusText = response.statusText;
        throw error;
      }

      let cssContent = await response.text();

      // Task 7.3: Apply theme token processing during loading pipeline (FR-2.1, FR-2.3, NFR-1.3)
      cssContent = await this.processThemeTokens(cssContent, {
        cssPath,
        scope,
        componentName,
        enableTokenProcessing: options.enableTokenProcessing
      });

      // Task 6.2: Apply CSS scoping during loading pipeline (NFR-2.3)
      cssContent = await this.processCSSScoping(cssContent, {
        cssPath,
        scope,
        componentName,
        scopingStrategy,
        enableScoping
      });

      return cssContent;

    } catch (error) {
      // Abort the fetch if it's still pending
      controller.abort();
      
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // Enhance error with more context
      if (error.name === 'AbortError') {
        throw new Error(`CSS loading aborted for ${cssPath}`);
      }
      
      this.log('error', `Error loading CSS file ${cssPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch CSS with path variations (following DependencyResolver pattern)
   * @private
   * @param {string} cssPath - CSS file path
   * @param {AbortSignal} signal - Abort signal
   * @returns {Promise<Response>} - Fetch response
   */
  async fetchWithVariations(cssPath, signal) {
    // Try different path variations (similar to DependencyResolver)
    const variations = [
      cssPath,
      cssPath.replace('.css', '/index.css'),
      cssPath.includes('.css') ? cssPath : `${cssPath}.css`,
      cssPath.replace(/\/([^/]+)$/, '/$1/$1.css') // Try component directory pattern
    ];

    let lastError;
    
    for (const variation of variations) {
      try {
        this.log('debug', `Trying CSS path: ${variation}`);
        const response = await fetch(variation, { signal });
        
        if (response.ok) {
          return response;
        }
        
        // If it's a 404, try next variation
        if (response.status === 404) {
          continue;
        }
        
        // For other errors, return the response to let caller handle
        return response;
        
      } catch (error) {
        lastError = error;
        
        // If aborted, don't try more variations
        if (error.name === 'AbortError') {
          throw error;
        }
        
        // Continue to next variation for network errors
        continue;
      }
    }

    // If all variations failed, throw the last error
    throw lastError || new Error(`Could not load CSS from any path variation: ${cssPath}`);
  }

  /**
   * Check if CSS file is already loaded (enhanced with detailed status)
   * @param {string} cssPath - Path to CSS file
   * @param {string} scope - Optional scope identifier
   * @returns {boolean|Object} - True if loaded, or detailed status object if requested
   */
  isLoaded(cssPath, scope = null) {
    const cacheKey = `css:${cssPath}${scope ? `:${scope}` : ''}`;
    const injectionKey = `${cssPath}${scope ? `:${scope}` : ''}`;
    
    const isCached = this.cache.has(cacheKey);
    const isInjected = this.injectedStylesheets.has(injectionKey);
    const isLoading = this.loadingPromises.has(cacheKey);
    const hasFailed = this.failedLoads.has(cssPath);
    
    // Return simple boolean for backward compatibility
    if (arguments.length <= 2) {
      return isCached || isInjected;
    }
    
    // Enhanced status information (following DependencyResolver pattern)
    return {
      loaded: isCached || isInjected,
      cached: isCached,
      injected: isInjected,
      loading: isLoading,
      failed: hasFailed,
      usageCount: this.usageTracker.get(cssPath) || 0
    };
  }

  /**
   * Check if CSS file is currently loading (following DependencyResolver pattern)
   * @param {string} cssPath - CSS file path
   * @param {string} scope - Optional scope identifier
   * @returns {boolean} - True if loading
   */
  isLoading(cssPath, scope = null) {
    const cacheKey = `css:${cssPath}${scope ? `:${scope}` : ''}`;
    return this.loadingPromises.has(cacheKey);
  }

  /**
   * Inject CSS into the document head
   * @param {string} cssPath - Path to CSS file or CSS content
   * @param {Object} options - Injection options
   * @param {boolean} options.inline - Whether to inject as inline styles (default: false)
   * @param {string} options.scope - Scoping identifier
   * @param {string} options.media - Media query for the stylesheet
   * @param {number} options.priority - Insertion priority (higher = earlier in head)
   * @returns {Promise<HTMLElement>} - Promise resolving to created element
   */
  async injectCSS(cssPath, options = {}) {
    const {
      inline = false,
      scope = null,
      media = 'all',
      priority = 0
    } = options;

    // Prevent duplicate injection (FR-1.5)
    const injectionKey = `${cssPath}${scope ? `:${scope}` : ''}`;
    if (this.injectedStylesheets.has(injectionKey)) {
      const existingElement = document.querySelector(
        `[data-css-path="${cssPath}"]${scope ? `[data-css-scope="${scope}"]` : ''}`
      );
      return existingElement;
    }

    let element;

    if (inline || cssPath.includes('\n') || cssPath.includes('{')) {
      // Inject as inline style element
      element = document.createElement('style');
      element.type = 'text/css';
      element.media = media;
      
      // If cssPath contains CSS content, use it directly
      const cssContent = cssPath.includes('{') ? cssPath : await this.loadAndCache(cssPath, options);
      element.textContent = cssContent;
      
    } else {
      // Inject as link element
      element = document.createElement('link');
      element.rel = 'stylesheet';
      element.type = 'text/css';
      element.href = cssPath;
      element.media = media;
    }

    // Add tracking attributes
    element.setAttribute('data-css-path', cssPath);
    if (scope) {
      element.setAttribute('data-css-scope', scope);
    }
    element.setAttribute('data-css-priority', priority.toString());

    // Insert with priority consideration
    this.insertWithPriority(element, priority);

    // Track injection
    this.injectedStylesheets.add(injectionKey);
    this.updateUsageTracker(cssPath);

    return element;
  }

  /**
   * Insert element into head with priority consideration
   * @private
   * @param {HTMLElement} element - Element to insert
   * @param {number} priority - Priority level
   */
  insertWithPriority(element, priority) {
    const head = document.head;
    const existingStylesheets = Array.from(head.querySelectorAll('link[rel="stylesheet"], style'));
    
    let insertBefore = null;
    
    // Find insertion point based on priority
    for (const stylesheet of existingStylesheets) {
      const stylesheetPriority = parseInt(stylesheet.getAttribute('data-css-priority') || '0', 10);
      if (priority > stylesheetPriority) {
        insertBefore = stylesheet;
        break;
      }
    }

    if (insertBefore) {
      head.insertBefore(element, insertBefore);
    } else {
      head.appendChild(element);
    }
  }

  /**
   * Process CSS scoping during loading pipeline
   * Task 6.2: Advanced CSS scoping integration with CSSScopingManager
   * @private
   * @param {string} cssContent - CSS content to process
   * @param {Object} scopingOptions - Scoping options
   * @param {string} scopingOptions.cssPath - CSS file path
   * @param {string} scopingOptions.scope - Component scope identifier
   * @param {string} scopingOptions.componentName - Component name
   * @param {string} scopingOptions.scopingStrategy - Scoping strategy override
   * @param {boolean} scopingOptions.enableScoping - Enable scoping override
   * @returns {Promise<string>} - Promise resolving to processed CSS content
   */
  async processCSSScoping(cssContent, scopingOptions = {}) {
    const {
      cssPath,
      scope,
      componentName,
      scopingStrategy,
      enableScoping
    } = scopingOptions;

    // Determine if scoping should be applied
    const shouldApplyScoping = enableScoping !== null 
      ? enableScoping 
      : this.scopingConfig.enableAutoScoping;

    if (!shouldApplyScoping || !this.scopingManager) {
      // Legacy scoping fallback if CSSScopingManager not available
      if (scope) {
        return this.applyScopeToCSS(cssContent, scope);
      }
      return cssContent;
    }

    // Determine component name for scoping
    const effectiveComponentName = componentName || this.extractComponentNameFromPath(cssPath) || scope || 'component';
    
    // Get or generate component scope identifier
    const componentScope = this.getOrGenerateComponentScope(effectiveComponentName, scope);
    
    // Determine scoping strategy
    const strategy = scopingStrategy || this.scopingConfig.defaultScopingStrategy;

    try {
      // Task 6.2: Use CSSScopingManager for advanced scoping
      const scopingResult = this.scopingManager.applyScopingStrategy(
        cssContent,
        effectiveComponentName,
        {
          strategy,
          scope: componentScope,
          skipPatterns: this.scopingConfig.preserveGlobalSelectors.map(selector => new RegExp(`^${selector.replace('*', '.*')}`)),
          enableCache: true,
          processThemeTokens: true // Integrate with theme system
        }
      );

      // Log scoping results for debugging
      if (scopingResult.scoped) {
        this.log('debug', `CSS scoped for ${effectiveComponentName} using ${strategy} strategy:`, {
          cssPath,
          componentScope,
          originalSize: cssContent.length,
          scopedSize: scopingResult.css.length,
          metadata: scopingResult.metadata
        });
      }

      // Handle scoping warnings
      if (scopingResult.warnings && scopingResult.warnings.length > 0) {
        this.log('warn', `CSS scoping warnings for ${effectiveComponentName}:`, scopingResult.warnings);
      }

      return scopingResult.css;

    } catch (error) {
      this.log('error', `CSS scoping failed for ${effectiveComponentName}, using fallback:`, error);
      
      // Fallback to simple scoping if CSSScopingManager fails
      if (scope) {
        return this.applyScopeToCSS(cssContent, scope);
      }
      
      // Return original CSS if all scoping fails
      return cssContent;
    }
  }

  /**
   * Process theme tokens in CSS content during loading pipeline
   * Task 7.3: Integration of ThemeTokenProcessor into CSSManager for automatic token processing
   * @private
   * @param {string} cssContent - CSS content to process
   * @param {Object} tokenOptions - Token processing options
   * @param {string} tokenOptions.cssPath - CSS file path
   * @param {string} tokenOptions.scope - Component scope identifier
   * @param {string} tokenOptions.componentName - Component name
   * @param {boolean} tokenOptions.enableTokenProcessing - Enable token processing override
   * @returns {Promise<string>} - Promise resolving to processed CSS content with tokens resolved
   */
  async processThemeTokens(cssContent, tokenOptions = {}) {
    const {
      cssPath,
      scope,
      componentName,
      enableTokenProcessing
    } = tokenOptions;

    // Determine if token processing should be applied
    const shouldProcessTokens = enableTokenProcessing !== null 
      ? enableTokenProcessing 
      : this.tokenProcessingConfig.enableAutoTokenProcessing;

    if (!shouldProcessTokens || !this.themeTokenProcessor) {
      // Return original CSS if token processing is disabled or processor unavailable
      return cssContent;
    }

    // Start performance tracking for NFR-1.3 compliance (<200ms)
    const startTime = performance.now();
    let performanceOperationId = null;

    try {
      // Task 7.3: Performance tracking for token processing (NFR-1.3)
      if (this.tokenProcessingConfig.enablePerformanceTracking) {
        performanceOperationId = this.generateTokenProcessingOperationId();
        this.tokenProcessingOperations.set(performanceOperationId, {
          cssPath,
          componentName: componentName || this.extractComponentNameFromPath(cssPath),
          startTime,
          scope
        });
      }

      // Check cache first if enabled
      const cacheKey = this.generateTokenCacheKey(cssContent, cssPath, componentName, scope);
      if (this.tokenProcessingConfig.enableTokenCache && this.tokenProcessingConfig.tokenCache.has(cacheKey)) {
        const cachedResult = this.tokenProcessingConfig.tokenCache.get(cacheKey);
        
        // Check if processing time is within target (NFR-1.3)
        const processingTime = performance.now() - startTime;
        if (processingTime < this.tokenProcessingConfig.maxProcessingTime) {
          this.log('debug', `Theme tokens loaded from cache for ${cssPath} (${processingTime.toFixed(2)}ms)`);
          
          // End performance tracking
          if (performanceOperationId) {
            this.endTokenProcessingOperation(performanceOperationId, true, processingTime);
          }
          
          return cachedResult;
        }
      }

      // Determine effective component name for token processing
      const effectiveComponentName = componentName || this.extractComponentNameFromPath(cssPath) || 'component';
      
      // Extract variant information from CSS path if available
      const variant = this.extractVariantFromPath(cssPath);

      // Process tokens using ThemeTokenProcessor (FR-2.1, FR-2.3)
      const processedCSS = await this.themeTokenProcessor.processTokens(
        cssContent, 
        effectiveComponentName, 
        variant,
        {
          // Pass additional context for advanced token processing
          scope,
          cssPath,
          inheritanceMode: this.tokenProcessingConfig.componentContext.inheritanceMode,
          enableValidation: this.tokenProcessingConfig.validateTokenUsage,
          componentScoping: this.tokenProcessingConfig.componentContext.enableComponentScoping
        }
      );

      const processingTime = performance.now() - startTime;

      // Validate performance target (NFR-1.3: <200ms)
      if (processingTime > this.tokenProcessingConfig.maxProcessingTime) {
        this.log('warn', `Theme token processing for ${cssPath} exceeded target time: ${processingTime.toFixed(2)}ms > ${this.tokenProcessingConfig.maxProcessingTime}ms`);
      }

      // Cache the result if caching is enabled and processing was successful
      if (this.tokenProcessingConfig.enableTokenCache && processedCSS !== cssContent) {
        this.tokenProcessingConfig.tokenCache.set(cacheKey, processedCSS);
        
        // Implement cache size limit to prevent memory issues
        if (this.tokenProcessingConfig.tokenCache.size > 100) { // Reasonable limit
          const firstKey = this.tokenProcessingConfig.tokenCache.keys().next().value;
          this.tokenProcessingConfig.tokenCache.delete(firstKey);
        }
      }

      // Log successful processing
      this.log('debug', `Theme tokens processed for ${effectiveComponentName} (${processingTime.toFixed(2)}ms)`);

      // End performance tracking
      if (performanceOperationId) {
        this.endTokenProcessingOperation(performanceOperationId, true, processingTime);
      }

      return processedCSS;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      
      this.log('error', `Theme token processing failed for ${cssPath}:`, error);

      // End performance tracking with error
      if (performanceOperationId) {
        this.endTokenProcessingOperation(performanceOperationId, false, processingTime, error);
      }

      // Apply fallback strategy (FR-2.1)
      if (this.tokenProcessingConfig.fallbackOnError) {
        this.log('warn', `Using fallback CSS for ${cssPath} due to token processing error`);
        return cssContent; // Return original CSS content
      } else {
        // Re-throw error if strict mode
        throw new Error(`Theme token processing failed for ${cssPath}: ${error.message}`);
      }
    }
  }

  /**
   * Generate unique operation ID for token processing performance tracking
   * @private
   * @returns {string} - Unique operation identifier
   */
  generateTokenProcessingOperationId() {
    return `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate cache key for processed token results
   * @private
   * @param {string} cssContent - Original CSS content
   * @param {string} cssPath - CSS file path
   * @param {string} componentName - Component name
   * @param {string} scope - Component scope
   * @returns {string} - Cache key
   */
  generateTokenCacheKey(cssContent, cssPath, componentName, scope) {
    // Create a simple hash-like key based on content and context
    const contextString = `${cssPath}:${componentName || 'unknown'}:${scope || 'none'}`;
    const contentHash = cssContent.length + cssContent.substring(0, 100).replace(/\s/g, '').length;
    return `tokens:${contextString}:${contentHash}`;
  }

  /**
   * Extract theme variant from CSS file path
   * @private
   * @param {string} cssPath - CSS file path
   * @returns {string|null} - Extracted variant name
   */
  extractVariantFromPath(cssPath) {
    if (!cssPath || typeof cssPath !== 'string') {
      return null;
    }

    // Look for variant patterns like .theme-ocean.css, .size-large.css, .state-loading.css
    const variantPatterns = [
      /\.theme-([^.]+)\.css$/,
      /\.size-([^.]+)\.css$/,
      /\.state-([^.]+)\.css$/,
      /\.variant-([^.]+)\.css$/
    ];

    for (const pattern of variantPatterns) {
      const match = cssPath.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * End token processing operation and record metrics
   * @private
   * @param {string} operationId - Operation identifier
   * @param {boolean} success - Whether operation succeeded
   * @param {number} processingTime - Processing time in milliseconds
   * @param {Error} error - Error object if failed
   */
  endTokenProcessingOperation(operationId, success, processingTime, error = null) {
    const operation = this.tokenProcessingOperations.get(operationId);
    if (!operation) {
      return;
    }

    // Record metrics for performance monitoring
    const operationResult = {
      ...operation,
      endTime: performance.now(),
      processingTime,
      success,
      error: error ? error.message : null,
      meetsPerformanceTarget: processingTime < this.tokenProcessingConfig.maxProcessingTime
    };

    // Log performance metrics
    if (!operationResult.meetsPerformanceTarget) {
      this.log('warn', `Token processing performance target missed for ${operation.cssPath}: ${processingTime.toFixed(2)}ms`);
    }

    // Clean up operation tracking
    this.tokenProcessingOperations.delete(operationId);

    // Integrate with CSSPerformanceMonitor if available (Task 3.2 integration)
    if (this.config.enablePerformanceMonitoring && this.performanceMonitor) {
      // Record token processing metrics in the performance monitor
      try {
        if (typeof this.performanceMonitor.recordCustomMetric === 'function') {
          this.performanceMonitor.recordCustomMetric('token_processing', {
            cssPath: operation.cssPath,
            componentName: operation.componentName,
            processingTime,
            success,
            performanceTarget: this.tokenProcessingConfig.maxProcessingTime
          });
        }
      } catch (perfError) {
        this.log('debug', 'Failed to record token processing metrics:', perfError);
      }
    }
  }

  /**
   * Extract component name from CSS file path
   * @private
   * @param {string} cssPath - CSS file path
   * @returns {string|null} - Extracted component name
   */
  extractComponentNameFromPath(cssPath) {
    if (!cssPath || typeof cssPath !== 'string') {
      return null;
    }

    // Extract filename from path
    const filename = cssPath.split('/').pop() || cssPath;
    
    // Remove .css extension and variants
    const baseName = filename
      .replace(/\.css$/, '')
      .replace(/\.(theme|size|state|variant)-[^.]+$/, '')
      .replace(/\.(small|large|mini|compact)$/, '')
      .replace(/\.(dark|light)$/, '');

    return baseName || null;
  }

  /**
   * Get or generate component scope identifier with caching
   * @private
   * @param {string} componentName - Component name
   * @param {string} providedScope - Provided scope identifier
   * @returns {string} - Component scope identifier
   */
  getOrGenerateComponentScope(componentName, providedScope = null) {
    // Use provided scope if available
    if (providedScope) {
      this.scopingConfig.componentScopeCache.set(componentName, providedScope);
      return providedScope;
    }

    // Check cache first
    if (this.scopingConfig.componentScopeCache.has(componentName)) {
      return this.scopingConfig.componentScopeCache.get(componentName);
    }

    // Generate new scope identifier
    const prefix = this.scopingManager?.options?.scopingPrefix || 'component';
    const normalizedName = componentName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
      .replace(/component$/, '');
    
    const scopeId = `${prefix}-${normalizedName}`;
    
    // Cache the generated scope
    this.scopingConfig.componentScopeCache.set(componentName, scopeId);
    
    return scopeId;
  }

  /**
   * Apply CSS scoping to content (Legacy method - kept for backward compatibility)
   * @private
   * @param {string} cssContent - CSS content to scope
   * @param {string} scope - Scope identifier
   * @returns {string} - Scoped CSS content
   */
  applyScopeToCSS(cssContent, scope) {
    // Basic CSS scoping - prefix selectors with scope
    // This is a simplified implementation - could be enhanced with proper CSS parsing
    return cssContent.replace(/([^{}]+){/g, (match, selector) => {
      // Skip @rules and keyframes
      if (selector.trim().startsWith('@') || selector.includes('@keyframes')) {
        return match;
      }
      
      // Add scope prefix to selectors
      const scopedSelector = selector
        .split(',')
        .map(s => `.${scope} ${s.trim()}`)
        .join(', ');
      
      return `${scopedSelector} {`;
    });
  }

  /**
   * Update usage tracking for cache optimization
   * @private
   * @param {string} cssPath - CSS file path
   */
  updateUsageTracker(cssPath) {
    const currentCount = this.usageTracker.get(cssPath) || 0;
    this.usageTracker.set(cssPath, currentCount + 1);
  }

  /**
   * Invalidate cache for specific CSS file or pattern-based invalidation
   * Enhanced with pattern matching and selective invalidation (FR-3.4)
   * @param {string|RegExp} [pattern] - CSS file path, pattern, or null for all
   * @param {string} [scope] - Specific scope to invalidate
   * @param {Object} [options] - Invalidation options
   * @param {boolean} [options.clearFailures] - Clear failed load tracking (default: false)
   * @param {boolean} [options.clearUsage] - Clear usage tracking (default: false)
   * @param {boolean} [options.clearInjected] - Clear injection tracking (default: false)
   * @returns {number} - Number of entries invalidated
   */
  invalidateCache(pattern = null, scope = null, options = {}) {
    const {
      clearFailures = false,
      clearUsage = false,
      clearInjected = false
    } = options;
    
    let invalidatedCount = 0;
    
    if (pattern === null) {
      // Clear entire cache (similar to ThemeService clearCache)
      invalidatedCount = this.cache.size;
      this.cache.clear();
      this.loadingPromises.clear();
      this.metrics.loadTimes.clear();
      this.metrics.totalSize = 0;
      this.metrics.cacheHits = 0;
      this.metrics.cacheMisses = 0;
      
      if (clearFailures) {
        this.failedLoads.clear();
        this.metrics.failedLoads = 0;
      }
      
      if (clearUsage) {
        this.usageTracker.clear();
      }
      
      if (clearInjected) {
        this.injectedStylesheets.clear();
      }
      
      this.log('info', `CSS cache completely cleared (${invalidatedCount} entries)`);
      
    } else if (typeof pattern === 'string') {
      // Invalidate specific file or files matching string pattern
      const cssPath = pattern;
      
      if (scope) {
        // Remove specific scoped version
        const cacheKey = `css:${cssPath}:${scope}`;
        if (this.cache.has(cacheKey)) {
          this.cache.delete(cacheKey);
          invalidatedCount++;
        }
        
        // Remove from loading promises
        this.loadingPromises.delete(cacheKey);
        
        // Clear injection tracking if requested
        if (clearInjected) {
          const injectionKey = `${cssPath}:${scope}`;
          this.injectedStylesheets.delete(injectionKey);
        }
        
      } else {
        // Remove all versions of this CSS file
        for (const key of this.cache.keys()) {
          if (key.startsWith(`css:${cssPath}`)) {
            this.cache.delete(key);
            invalidatedCount++;
          }
        }
        
        // Remove from loading promises
        for (const key of this.loadingPromises.keys()) {
          if (key.startsWith(`css:${cssPath}`)) {
            this.loadingPromises.delete(key);
          }
        }
        
        // Clear related tracking
        this.metrics.loadTimes.delete(cssPath);
        
        if (clearFailures) {
          this.failedLoads.delete(cssPath);
        }
        
        if (clearUsage) {
          this.usageTracker.delete(cssPath);
        }
        
        if (clearInjected) {
          // Remove all injection keys for this CSS file
          for (const injectionKey of this.injectedStylesheets) {
            if (injectionKey.startsWith(cssPath)) {
              this.injectedStylesheets.delete(injectionKey);
            }
          }
        }
      }
      
    } else if (pattern instanceof RegExp) {
      // Pattern-based invalidation using RegExp
      const keysToDelete = [];
      
      for (const key of this.cache.keys()) {
        // Extract CSS path from cache key (format: css:path or css:path:scope)
        const cssPath = key.replace(/^css:/, '').split(':')[0];
        if (pattern.test(cssPath)) {
          keysToDelete.push(key);
        }
      }
      
      // Delete matched keys
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        invalidatedCount++;
      });
      
      // Clear related tracking for matched paths
      if (clearFailures || clearUsage || clearInjected) {
        const matchedPaths = new Set();
        keysToDelete.forEach(key => {
          const cssPath = key.replace(/^css:/, '').split(':')[0];
          matchedPaths.add(cssPath);
        });
        
        matchedPaths.forEach(cssPath => {
          if (clearFailures) {
            this.failedLoads.delete(cssPath);
          }
          if (clearUsage) {
            this.usageTracker.delete(cssPath);
          }
          this.metrics.loadTimes.delete(cssPath);
        });
        
        if (clearInjected) {
          for (const injectionKey of this.injectedStylesheets) {
            const cssPath = injectionKey.split(':')[0];
            if (pattern.test(cssPath)) {
              this.injectedStylesheets.delete(injectionKey);
            }
          }
        }
      }
    }
    
    if (invalidatedCount > 0) {
      this.log('info', `Invalidated ${invalidatedCount} CSS cache entries`);
    }
    
    return invalidatedCount;
  }

  /**
   * Retry failed CSS loads (following DependencyResolver pattern)
   * @param {string[]} cssPaths - CSS files to retry (defaults to all failed)
   * @param {Object} options - Retry options
   * @returns {Promise<Map<string, string>>} - Map of successful loads
   */
  async retryFailedLoads(cssPaths = null, options = {}) {
    const toRetry = cssPaths || Array.from(this.failedLoads);
    
    if (toRetry.length === 0) {
      this.log('info', 'No failed CSS loads to retry');
      return new Map();
    }

    this.log('info', `Retrying ${toRetry.length} failed CSS loads`);
    
    // Clear failed status for retry
    toRetry.forEach(cssPath => this.failedLoads.delete(cssPath));
    
    const results = new Map();
    const promises = toRetry.map(async (cssPath) => {
      try {
        const cssContent = await this.loadAndCache(cssPath, options);
        results.set(cssPath, cssContent);
        return { cssPath, cssContent, success: true };
      } catch (error) {
        this.log('error', `Failed to retry CSS load ${cssPath}:`, error);
        return { cssPath, error, success: false };
      }
    });

    const loadResults = await Promise.allSettled(promises);
    
    // Log results
    const successful = loadResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = loadResults.length - successful;
    
    this.log('info', `CSS retry complete: ${successful} successful, ${failed} failed`);
    
    return results;
  }

  /**
   * Get comprehensive cache and loading statistics (enhanced for NFR-1.4)
   * Task 3.2: Enhanced with CSSPerformanceMonitor integration for comprehensive metrics
   * Task 6.2: Enhanced with CSS scoping statistics and performance tracking
   * @param {boolean} includeDetailedMetrics - Include detailed performance monitor metrics
   * @param {boolean} includeScopingStats - Include CSS scoping statistics
   * @param {boolean} includeTokenProcessingStats - Include theme token processing statistics
   * @returns {Object} - Detailed performance metrics including CSSPerformanceMonitor, scoping, and token processing data
   */
  getCacheStats(includeDetailedMetrics = false, includeScopingStats = false, includeTokenProcessingStats = false) {
    const hitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0 
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 
      : 0;

    // Task 3.2: Get comprehensive performance metrics from CSSPerformanceMonitor
    const performanceStats = this.config.enablePerformanceMonitoring && this.performanceMonitor 
      ? this.performanceMonitor.getStats() 
      : null;

    const baseStats = {
      // Cache metrics
      cacheSize: this.cache.size,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100,
      
      // Loading metrics
      totalLoadedSize: this.metrics.totalSize,
      averageLoadTime: this.getAverageLoadTime(),
      failedLoads: this.metrics.failedLoads,
      retryAttempts: this.metrics.retryAttempts,
      
      // State tracking
      currentlyLoading: this.loadingPromises.size,
      injectedStylesheets: this.injectedStylesheets.size,
      trackedUsage: this.usageTracker.size,
      activeOperations: this.activeOperations.size, // Task 3.2: Track active performance operations
      
      // Analysis
      mostUsedFiles: this.getMostUsedFiles(5),
      loadTimeDistribution: this.getLoadTimeDistribution(),
      
      // Performance indicators (NFR-1.4 compliance)
      meetsPerformanceTarget: hitRate >= 85, // NFR-1.4: cache hit rate > 85%
      averageLoadUnderThreshold: this.getAverageLoadTime() < 50, // Target: <50ms average
      
      // Task 3.2: Performance monitoring integration status
      performanceMonitoringEnabled: this.config.enablePerformanceMonitoring,
      hasPerformanceMonitor: !!this.performanceMonitor,
      
      // Task 6.2: CSS scoping integration status
      scopingEnabled: this.scopingConfig.enableAutoScoping,
      hasScopingManager: !!this.scopingManager,
      scopingStrategy: this.scopingConfig.defaultScopingStrategy,
      componentScopeCacheSize: this.scopingConfig.componentScopeCache.size,
      
      // Task 7.3: Theme token processing integration status
      tokenProcessingEnabled: this.tokenProcessingConfig.enableAutoTokenProcessing,
      hasThemeTokenProcessor: !!this.themeTokenProcessor,
      tokenProcessingMode: this.tokenProcessingConfig.processingMode,
      tokenCacheSize: this.tokenProcessingConfig.tokenCache.size,
      activeTokenOperations: this.tokenProcessingOperations.size,
      tokenProcessingPerformanceTarget: this.tokenProcessingConfig.maxProcessingTime,
      tokenCacheEnabled: this.tokenProcessingConfig.enableTokenCache,
      tokenValidationEnabled: this.tokenProcessingConfig.validateTokenUsage
    };

    // Task 3.2: Include detailed performance metrics if requested and available
    if (includeDetailedMetrics && performanceStats) {
      baseStats.detailedPerformanceMetrics = {
        ...performanceStats,
        summary: this.performanceMonitor.getPerformanceSummary(),
        trends: performanceStats.recentTrends || null,
        baselineComparison: performanceStats.baselineComparison || null
      };
      
      // Cross-validate metrics between CSSManager and CSSPerformanceMonitor
      baseStats.metricsValidation = this.validateMetricsConsistency(performanceStats);
    }

    // Task 6.2: Include CSS scoping statistics if requested
    if (includeScopingStats) {
      baseStats.scopingStatistics = this.getScopingStatistics();
    }

    // Task 7.3: Include theme token processing statistics if requested
    if (includeTokenProcessingStats) {
      baseStats.tokenProcessingStatistics = this.getTokenProcessingStatistics();
    }

    return baseStats;
  }

  /**
   * Get load time distribution for performance analysis
   * @private
   * @returns {Object} - Load time statistics
   */
  getLoadTimeDistribution() {
    const times = Array.from(this.metrics.loadTimes.values());
    if (times.length === 0) {
      return { fast: 0, medium: 0, slow: 0 };
    }
    
    const fast = times.filter(t => t < 50).length;
    const medium = times.filter(t => t >= 50 && t < 200).length;
    const slow = times.filter(t => t >= 200).length;
    
    return {
      fast: Math.round((fast / times.length) * 100),
      medium: Math.round((medium / times.length) * 100),
      slow: Math.round((slow / times.length) * 100)
    };
  }

  /**
   * Get average CSS load time
   * @private
   * @returns {number} - Average load time in milliseconds
   */
  getAverageLoadTime() {
    const times = Array.from(this.metrics.loadTimes.values());
    if (times.length === 0) return 0;
    
    const total = times.reduce((sum, time) => sum + time, 0);
    return Math.round((total / times.length) * 100) / 100;
  }

  /**
   * Get most frequently used CSS files
   * @private
   * @param {number} count - Number of files to return
   * @returns {Array} - Array of {path, usage} objects
   */
  getMostUsedFiles(count = 5) {
    return Array.from(this.usageTracker.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([path, usage]) => ({ path, usage }));
  }

  /**
   * Remove injected CSS from document
   * @param {string} cssPath - Path to CSS file to remove
   * @param {string} scope - Optional scope identifier
   * @returns {boolean} - True if CSS was removed
   */
  removeCSS(cssPath, scope = null) {
    const selector = `[data-css-path="${cssPath}"]${scope ? `[data-css-scope="${scope}"]` : ''}`;
    const elements = document.querySelectorAll(selector);
    
    let removed = false;
    elements.forEach(element => {
      element.remove();
      removed = true;
    });

    // Update tracking
    const injectionKey = `${cssPath}${scope ? `:${scope}` : ''}`;
    this.injectedStylesheets.delete(injectionKey);

    return removed;
  }

  /**
   * Preload CSS files for performance optimization
   * @param {string[]} cssPaths - Array of CSS file paths to preload
   * @param {Object} options - Preload options
   * @returns {Promise<void>} - Promise resolving when all files are preloaded
   */
  async preloadCSS(cssPaths, options = {}) {
    const promises = cssPaths.map(cssPath => {
      return this.loadAndCache(cssPath, { ...options, cache: true });
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn('Some CSS files failed to preload:', error);
    }
  }

  /**
   * Clean up unused CSS from cache based on usage tracking (enhanced)
   * @param {number} threshold - Minimum usage count to keep (default: 1)
   * @param {Object} options - Cleanup options
   * @param {boolean} options.aggressive - More aggressive cleanup (default: false)
   * @param {number} options.maxAge - Max age in milliseconds (default: no limit)
   * @returns {Object} - Cleanup statistics
   */
  cleanupUnusedCSS(threshold = 1, options = {}) {
    const { aggressive = false, maxAge = null } = options;
    
    let cleanedCount = 0;
    let sizeFreed = 0;
    const cleanedFiles = [];
    
    for (const [cssPath, usage] of this.usageTracker.entries()) {
      let shouldClean = usage < threshold;
      
      // Additional cleanup criteria for aggressive mode
      if (aggressive && maxAge) {
        const loadTime = this.metrics.loadTimes.get(cssPath);
        if (loadTime && (Date.now() - loadTime) > maxAge) {
          shouldClean = true;
        }
      }
      
      if (shouldClean) {
        // Calculate size before removal
        for (const key of this.cache.keys()) {
          if (key.startsWith(`css:${cssPath}`)) {
            const content = this.cache.get(key);
            if (content) {
              sizeFreed += content.length;
            }
            this.cache.delete(key);
            cleanedCount++;
          }
        }
        
        // Remove from usage tracker
        this.usageTracker.delete(cssPath);
        
        // Update metrics
        this.metrics.loadTimes.delete(cssPath);
        this.metrics.totalSize -= sizeFreed;
        
        cleanedFiles.push(cssPath);
      }
    }

    const result = {
      filesRemoved: cleanedFiles.length,
      entriesRemoved: cleanedCount,
      sizeFreed: sizeFreed,
      cleanedFiles: cleanedFiles
    };

    if (cleanedCount > 0) {
      this.log('info', `CSS cleanup: removed ${cleanedCount} entries, freed ${sizeFreed} bytes`);
    }

    return result;
  }

  /**
   * Validate consistency between CSSManager and CSSPerformanceMonitor metrics
   * Task 3.2: Cross-validation for metric accuracy and debugging
   * @private
   * @param {Object} performanceStats - Stats from CSSPerformanceMonitor
   * @returns {Object} - Validation results
   */
  validateMetricsConsistency(performanceStats) {
    const validation = {
      consistent: true,
      discrepancies: [],
      recommendations: []
    };

    // Compare cache hit/miss counts
    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const perfTotalRequests = performanceStats.cacheHits + performanceStats.cacheMisses;
    
    if (Math.abs(totalCacheRequests - perfTotalRequests) > 5) { // Allow small variance
      validation.consistent = false;
      validation.discrepancies.push({
        metric: 'total_cache_requests',
        cssManager: totalCacheRequests,
        performanceMonitor: perfTotalRequests,
        difference: Math.abs(totalCacheRequests - perfTotalRequests)
      });
      validation.recommendations.push('Consider resetting one or both metric systems');
    }

    // Compare average load times if both have data
    const cssManagerAvgTime = this.getAverageLoadTime();
    const perfMonitorAvgTime = performanceStats.averageLoadTime || 0;
    
    if (cssManagerAvgTime > 0 && perfMonitorAvgTime > 0) {
      const timeDifference = Math.abs(cssManagerAvgTime - perfMonitorAvgTime);
      if (timeDifference > 10) { // More than 10ms difference
        validation.consistent = false;
        validation.discrepancies.push({
          metric: 'average_load_time',
          cssManager: `${cssManagerAvgTime.toFixed(2)}ms`,
          performanceMonitor: `${perfMonitorAvgTime.toFixed(2)}ms`,
          difference: `${timeDifference.toFixed(2)}ms`
        });
        validation.recommendations.push('Check timing calculation methods for consistency');
      }
    }

    // Check for reasonable performance indicators
    if (performanceStats.performanceIndicators) {
      const indicators = performanceStats.performanceIndicators;
      
      if (!indicators.cacheHitRateHealthy && this.cache.size > 10) {
        validation.recommendations.push('Cache hit rate below target - consider preloading frequently used CSS');
      }
      
      if (!indicators.loadTimeHealthy) {
        validation.recommendations.push('Load times above threshold - consider CSS optimization or bundling');
      }
    }

    return validation;
  }

  /**
   * Get comprehensive performance summary including CSSPerformanceMonitor data
   * Task 3.2: Unified performance summary for monitoring and debugging
   * @returns {Object} - Comprehensive performance summary
   */
  getPerformanceSummary() {
    const cacheStats = this.getCacheStats(true);
    const activeOps = Array.from(this.activeOperations.entries()).map(([id, metadata]) => ({
      operationId: id,
      cssPath: metadata.cssPath,
      duration: performance.now() - metadata.startTime,
      options: metadata.options
    }));

    return {
      timestamp: Date.now(),
      summary: {
        totalOperations: cacheStats.cacheHits + cacheStats.cacheMisses + cacheStats.failedLoads,
        successRate: cacheStats.totalLoadedSize > 0 
          ? ((cacheStats.cacheHits + cacheStats.cacheMisses - cacheStats.failedLoads) / (cacheStats.cacheHits + cacheStats.cacheMisses)) * 100
          : 100,
        averageLoadTime: cacheStats.averageLoadTime,
        cacheEfficiency: cacheStats.hitRate,
        currentLoad: {
          activeOperations: activeOps.length,
          pendingLoads: cacheStats.currentlyLoading,
          injectedStylesheets: cacheStats.injectedStylesheets
        }
      },
      performance: cacheStats.detailedPerformanceMetrics || null,
      validation: cacheStats.metricsValidation || null,
      activeOperations: activeOps,
      recommendations: this.generatePerformanceRecommendations(cacheStats)
    };
  }

  /**
   * Generate performance recommendations based on current metrics
   * Task 3.2: Intelligent performance optimization suggestions
   * Task 6.2: Enhanced with CSS scoping recommendations
   * @private
   * @param {Object} stats - Current performance statistics
   * @returns {Array} - Array of recommendation objects
   */
  generatePerformanceRecommendations(stats) {
    const recommendations = [];

    // Cache hit rate recommendations (NFR-1.4)
    if (stats.hitRate < 85) {
      recommendations.push({
        priority: 'high',
        category: 'caching',
        issue: `Cache hit rate (${stats.hitRate.toFixed(1)}%) below NFR-1.4 target (85%)`,
        suggestion: 'Implement CSS preloading for frequently used components',
        impact: 'performance'
      });
    }

    // Load time recommendations (NFR-1.1)
    if (stats.averageLoadTime > 55) { // 10% over 50ms baseline
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        issue: `Average load time (${stats.averageLoadTime.toFixed(2)}ms) exceeds NFR-1.1 threshold`,
        suggestion: 'Consider CSS bundling or file size optimization',
        impact: 'user_experience'
      });
    }

    // Bundle size recommendations (NFR-1.2)
    if (stats.totalLoadedSize > 500000) { // 500KB threshold
      recommendations.push({
        priority: 'medium',
        category: 'bundle_size',
        issue: `Total CSS size (${(stats.totalLoadedSize / 1024).toFixed(2)}KB) may be excessive`,
        suggestion: 'Implement CSS tree shaking and remove unused styles',
        impact: 'performance'
      });
    }

    // Failed loads recommendations
    if (stats.failedLoads > 0) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        issue: `${stats.failedLoads} CSS files failed to load`,
        suggestion: 'Check file paths and implement better error recovery',
        impact: 'functionality'
      });
    }

    // Active operations recommendations
    if (stats.activeOperations > 10) {
      recommendations.push({
        priority: 'low',
        category: 'concurrency',
        issue: `High number of concurrent operations (${stats.activeOperations})`,
        suggestion: 'Consider implementing request queuing or throttling',
        impact: 'resource_usage'
      });
    }

    // Task 6.2: CSS scoping recommendations (NFR-2.3)
    if (!stats.scopingEnabled) {
      recommendations.push({
        priority: 'medium',
        category: 'css_scoping',
        issue: 'Automatic CSS scoping is disabled',
        suggestion: 'Enable CSS scoping to prevent style bleeding between components (NFR-2.3)',
        impact: 'maintainability'
      });
    }

    if (stats.scopingEnabled && !stats.hasScopingManager) {
      recommendations.push({
        priority: 'high',
        category: 'css_scoping',
        issue: 'CSS scoping enabled but CSSScopingManager not available',
        suggestion: 'Check CSSScopingManager initialization and imports',
        impact: 'functionality'
      });
    }

    // Component scope cache recommendations
    if (stats.componentScopeCacheSize > 100) {
      recommendations.push({
        priority: 'low',
        category: 'css_scoping',
        issue: `Large component scope cache (${stats.componentScopeCacheSize} entries)`,
        suggestion: 'Consider periodic cache cleanup for long-running applications',
        impact: 'memory_usage'
      });
    }

    return recommendations;
  }

  /**
   * Log message with configured level (following DependencyResolver pattern)
   * Task 3.2: Enhanced logging with performance context
   * @private
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  log(level, message, ...args) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };
    const configLevel = levels[this.config.logLevel] || 2;
    const messageLevel = levels[level] || 1;

    if (messageLevel >= configLevel) {
      const logMethod = console[level] || console.log;
      
      // Task 3.2: Add performance context to logs when available
      const perfContext = this.config.enablePerformanceMonitoring && this.performanceMonitor 
        ? ` [Cache: ${this.performanceMonitor.getCacheHitRate().toFixed(1)}%, Active: ${this.activeOperations.size}]`
        : '';
        
      logMethod(`[CSSManager${perfContext}] ${message}`, ...args);
    }
  }

  /**
   * Get CSS scoping statistics and performance metrics
   * Task 6.2: CSS scoping statistics for monitoring and debugging
   * @returns {Object} - CSS scoping statistics
   */
  getScopingStatistics() {
    if (!this.scopingManager) {
      return {
        enabled: false,
        reason: 'CSSScopingManager not initialized'
      };
    }

    const scopingManagerStats = this.scopingManager.getPerformanceMetrics();
    const scopingCacheStats = this.scopingManager.getCacheStats();

    return {
      enabled: this.scopingConfig.enableAutoScoping,
      strategy: this.scopingConfig.defaultScopingStrategy,
      mode: this.scopingConfig.scopingMode,
      
      // Performance metrics from CSSScopingManager
      performance: {
        totalProcessingTime: scopingManagerStats.totalProcessingTime || 0,
        totalScopedComponents: scopingManagerStats.totalScopedComponents || 0,
        averageProcessingTime: scopingManagerStats.averageProcessingTime || 0,
        cacheHitRate: scopingManagerStats.cacheHitRate || 0,
        processingHistory: (scopingManagerStats.processingHistory || []).slice(-10) // Last 10 operations
      },
      
      // Cache statistics
      cache: {
        processedCacheSize: scopingCacheStats.processedCacheSize || 0,
        scopingCacheSize: scopingCacheStats.scopingCacheSize || 0,
        totalCacheSize: scopingCacheStats.totalCacheSize || 0,
        componentScopeCache: this.scopingConfig.componentScopeCache.size
      },
      
      // Configuration
      configuration: {
        preserveGlobalSelectors: this.scopingConfig.preserveGlobalSelectors,
        scopingPrefix: this.scopingManager.options.scopingPrefix,
        enableDebugMode: this.scopingManager.options.enableDebugMode,
        performanceTracking: this.scopingManager.options.performanceTracking
      },
      
      // Component scope mappings (for debugging)
      componentScopes: Array.from(this.scopingConfig.componentScopeCache.entries()).reduce((acc, [component, scope]) => {
        acc[component] = scope;
        return acc;
      }, {}),
      
      // Health indicators
      health: {
        scopingManagerAvailable: !!this.scopingManager,
        performanceTrackingEnabled: this.scopingManager.options.performanceTracking,
        cacheEnabled: this.scopingManager.options.cacheEnabled,
        averageProcessingTimeHealthy: (scopingManagerStats.averageProcessingTime || 0) < 10 // Target: <10ms
      }
    };
  }

  /**
   * Get comprehensive theme token processing statistics and performance metrics
   * Task 7.3: Theme token processing statistics for monitoring and debugging
   * @returns {Object} - Theme token processing statistics
   */
  getTokenProcessingStatistics() {
    if (!this.themeTokenProcessor) {
      return {
        enabled: false,
        reason: 'ThemeTokenProcessor not initialized'
      };
    }

    // Get token processor statistics if available
    const processorStats = this.themeTokenProcessor.getStats ? this.themeTokenProcessor.getStats() : {};
    
    // Calculate active operations summary
    const activeOperations = Array.from(this.tokenProcessingOperations.entries()).map(([id, operation]) => ({
      operationId: id,
      cssPath: operation.cssPath,
      componentName: operation.componentName,
      duration: performance.now() - operation.startTime,
      scope: operation.scope
    }));

    // Calculate performance metrics
    const recentOperations = activeOperations.slice(-20); // Last 20 operations
    const averageProcessingTime = recentOperations.length > 0 
      ? recentOperations.reduce((sum, op) => sum + op.duration, 0) / recentOperations.length 
      : 0;

    return {
      enabled: this.tokenProcessingConfig.enableAutoTokenProcessing,
      processingMode: this.tokenProcessingConfig.processingMode,
      
      // Performance metrics (NFR-1.3 compliance tracking)
      performance: {
        activeOperations: activeOperations.length,
        totalProcessedFiles: processorStats.tokensProcessed || 0,
        averageProcessingTime: averageProcessingTime,
        performanceTarget: this.tokenProcessingConfig.maxProcessingTime,
        performanceTargetMet: averageProcessingTime < this.tokenProcessingConfig.maxProcessingTime,
        cacheHitRate: this.tokenProcessingConfig.tokenCache.size > 0 
          ? ((processorStats.cacheHits || 0) / (this.tokenProcessingConfig.tokenCache.size + (processorStats.cacheMisses || 0))) * 100 
          : 0,
        recentOperations: recentOperations.slice(-5) // Last 5 operations for debugging
      },
      
      // Cache statistics
      cache: {
        tokenCacheSize: this.tokenProcessingConfig.tokenCache.size,
        cacheEnabled: this.tokenProcessingConfig.enableTokenCache,
        maxCacheSize: 100, // Current hardcoded limit
        cacheUtilization: (this.tokenProcessingConfig.tokenCache.size / 100) * 100 // Percentage
      },
      
      // Configuration
      configuration: {
        enablePerformanceTracking: this.tokenProcessingConfig.enablePerformanceTracking,
        fallbackOnError: this.tokenProcessingConfig.fallbackOnError,
        validateTokenUsage: this.tokenProcessingConfig.validateTokenUsage,
        componentContext: this.tokenProcessingConfig.componentContext
      },
      
      // ThemeTokenProcessor integration
      processor: {
        available: !!this.themeTokenProcessor,
        processorStats: processorStats,
        validationRules: processorStats.validationRulesCount || 0,
        tokenRegistry: processorStats.tokenRegistrySize || 0,
        documentationRegistry: processorStats.documentationRegistrySize || 0
      },
      
      // Health indicators
      health: {
        processorAvailable: !!this.themeTokenProcessor,
        performanceTrackingEnabled: this.tokenProcessingConfig.enablePerformanceTracking,
        performanceTargetHealthy: averageProcessingTime < this.tokenProcessingConfig.maxProcessingTime,
        cacheHealthy: this.tokenProcessingConfig.tokenCache.size < 90, // Less than 90% of max
        noActiveErrors: activeOperations.every(op => !op.error),
        integrationHealthy: this.tokenProcessingConfig.enableAutoTokenProcessing && !!this.themeTokenProcessor
      },
      
      // Integration status with other systems
      integration: {
        cssManagerIntegrated: true, // This method being called proves integration
        performanceMonitorIntegrated: this.config.enablePerformanceMonitoring && !!this.performanceMonitor,
        scopingManagerIntegrated: !!this.scopingManager,
        themeServiceIntegrated: !!this.themeTokenProcessor.themeService
      }
    };
  }

  /**
   * Clear CSS scoping caches and reset statistics
   * Task 6.2: CSS scoping cache management
   * @param {Object} options - Clear options
   * @param {boolean} options.clearComponentScopes - Clear component scope cache
   * @param {boolean} options.clearScopingManager - Clear CSSScopingManager caches
   * @param {boolean} options.resetPerformanceMetrics - Reset scoping performance metrics
   * @returns {Object} - Clear operation results
   */
  clearScopingCaches(options = {}) {
    const {
      clearComponentScopes = true,
      clearScopingManager = true,
      resetPerformanceMetrics = false
    } = options;

    const results = {
      componentScopesCleared: 0,
      scopingManagerCachesCleared: 0,
      performanceMetricsReset: false
    };

    try {
      // Clear component scope cache
      if (clearComponentScopes) {
        results.componentScopesCleared = this.scopingConfig.componentScopeCache.size;
        this.scopingConfig.componentScopeCache.clear();
      }

      // Clear CSSScopingManager caches
      if (clearScopingManager && this.scopingManager) {
        const beforeSize = this.scopingManager.getCacheStats().totalCacheSize;
        this.scopingManager.clearCache();
        results.scopingManagerCachesCleared = beforeSize;
      }

      // Reset performance metrics
      if (resetPerformanceMetrics && this.scopingManager) {
        // Reset performance metrics in scopingManager if supported
        if (typeof this.scopingManager.resetPerformanceMetrics === 'function') {
          this.scopingManager.resetPerformanceMetrics();
          results.performanceMetricsReset = true;
        }
      }

      this.log('info', `CSS scoping caches cleared:`, results);
      return results;

    } catch (error) {
      this.log('error', 'Failed to clear CSS scoping caches:', error);
      return {
        ...results,
        error: error.message
      };
    }
  }
}

// Create singleton instance (following ThemeService pattern)
const cssManager = new CSSManager();

// Task 3.2: Initialize performance monitoring integration on creation
if (typeof window !== 'undefined' && window.performance) {
  // Set up performance monitoring baseline when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      cssManager.log('debug', 'CSS Manager initialized with performance monitoring');
    });
  } else {
    cssManager.log('debug', 'CSS Manager initialized with performance monitoring');
  }
}

// Export both the class and singleton
export { CSSManager };
export default cssManager;

// Also make available globally for compatibility
if (typeof window !== 'undefined') {
  window.cssManager = cssManager;
  
  // Task 3.2: Expose performance methods globally for debugging
  // Task 6.2: Enhanced with CSS scoping debugging capabilities
  // Task 7.3: Enhanced with theme token processing debugging capabilities
  if (process.env.NODE_ENV === 'development') {
    window.cssManagerPerformance = {
      getStats: () => cssManager.getCacheStats(true, true, true), // Include scoping and token processing stats
      getSummary: () => cssManager.getPerformanceSummary(),
      getScopingStats: () => cssManager.getScopingStatistics(),
      getTokenProcessingStats: () => cssManager.getTokenProcessingStatistics(), // Task 7.3: Token processing debug access
      resetMonitoring: () => {
        if (cssManager.performanceMonitor) {
          cssManager.performanceMonitor.reset();
        }
        cssManager.log('info', 'Performance monitoring reset');
      },
      clearScopingCaches: (options) => cssManager.clearScopingCaches(options),
      configureCSSScoping: (options) => cssManager.configureCSSScoping(options),
      configureTokenProcessing: (options) => cssManager.configure({ tokenProcessing: options }), // Task 7.3: Token processing configuration
      testScoping: (cssContent, componentName, options) => {
        if (cssManager.scopingManager) {
          return cssManager.scopingManager.applyScopingStrategy(cssContent, componentName, options);
        }
        return { error: 'CSSScopingManager not available' };
      },
      testTokenProcessing: async (cssContent, componentName, variant, options) => { // Task 7.3: Token processing testing
        if (cssManager.themeTokenProcessor) {
          try {
            return await cssManager.themeTokenProcessor.processTokens(cssContent, componentName, variant, options);
          } catch (error) {
            return { error: error.message, cssContent };
          }
        }
        return { error: 'ThemeTokenProcessor not available', cssContent };
      },
      clearTokenCache: () => { // Task 7.3: Token cache management
        const clearedCount = cssManager.tokenProcessingConfig.tokenCache.size;
        cssManager.tokenProcessingConfig.tokenCache.clear();
        cssManager.log('info', `Cleared ${clearedCount} token cache entries`);
        return { clearedCount };
      }
    };
  }
}