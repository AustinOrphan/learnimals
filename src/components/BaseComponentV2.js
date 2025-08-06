/**
 * BaseComponent V2 - Enhanced modular base component
 * Provides modern component architecture with theme service integration,
 * CSS injection, dependency management, and manifest support
 */

import themeService from '../utils/ThemeService.js';
import { ComponentManifest, componentRegistry } from '../utils/ComponentManifest.js';
import dependencyResolver from '../utils/DependencyResolver.js';
import cssManager from '../utils/CSSManager.js';
import cssPathResolver from '../utils/CSSPathResolver.js';

class BaseComponent {
  /**
   * Component static metadata (to be overridden by subclasses)
   */
  static version = '2.0.0';
  static dependencies = [];
  static css = [];
  static themes = ['default'];
  static description = '';

  /**
   * Create a base component
   * @param {Object} options - Component options
   * @param {string} [options.id] - Component ID (auto-generated if not provided)
   * @param {string[]} [options.cssClasses] - Additional CSS classes
   * @param {HTMLElement|string} [options.container] - Container element or selector
   * @param {Object} [options.attributes] - HTML attributes to set on the component
   * @param {boolean} [options.autoRegister] - Auto-register in component registry
   * @param {Object} [options.themeOverrides] - Component-specific theme overrides
   */
  constructor(options = {}) {
    this.options = {
      id: options.id || this.generateId(),
      cssClasses: options.cssClasses || [],
      container: options.container || null,
      attributes: options.attributes || {},
      autoRegister: options.autoRegister !== false,
      themeOverrides: options.themeOverrides || {},
      ...options,
    };

    // Component state
    this.element = null;
    this.isRendered = false;
    this.isInitialized = false;
    this.isDestroyed = false;
    
    // Event and dependency management
    this.eventListeners = new Map();
    this.cssInjected = new Set();
    this.themeUnsubscribe = null;
    this.dependencyInstances = new Map();

    // Component manifest and registration
    this.manifest = null;
    this.componentName = this.constructor.name;

    // CSS Management (FR-1.4, FR-1.5) - Initialize CSSManager instance for all components
    this.cssManager = cssManager;
    this.cssPathResolver = cssPathResolver;

    // Initialize the component
    this.initialize();
  }

  /**
   * Initialize component (lifecycle method)
   * Loads manifest, registers component, and sets up dependencies
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create or load component manifest
      await this.loadManifest();

      // Register component if auto-registration is enabled
      if (this.options.autoRegister && this.manifest) {
        componentRegistry.register(this.componentName, this.manifest);
      }

      // Load dependencies
      await this.loadDependencies();

      // Inject CSS if specified
      await this.injectCSS();

      // Set up theme change listener
      this.setupThemeIntegration();

      this.isInitialized = true;
      this.onInitialized();

    } catch (error) {
      console.error(`Failed to initialize component ${this.componentName}:`, error);
      throw error;
    }
  }

  /**
   * Load component manifest
   * @private
   */
  async loadManifest() {
    // Try to load from component.json first
    const componentPath = this.getComponentPath();
    if (componentPath) {
      this.manifest = await ComponentManifest.loadFromPath(componentPath);
    }

    // Fallback to creating from static properties
    if (!this.manifest || !this.manifest.isValid) {
      this.manifest = ComponentManifest.fromComponent(this.constructor, {
        description: this.constructor.description,
        css: this.constructor.css,
        themes: this.constructor.themes
      });
    }
  }

  /**
   * Load component dependencies using the dependency resolver
   * @private
   */
  async loadDependencies() {
    const dependencies = this.manifest?.data.dependencies || this.constructor.dependencies || [];
    
    if (dependencies.length === 0) {
      return;
    }

    try {
      // Use dependency resolver for intelligent loading
      for (const depName of dependencies) {
        if (!dependencyResolver.isLoaded(depName)) {
          const ComponentClass = await dependencyResolver.loadWithDependencies(depName);
          
          // Create instance if needed
          if (ComponentClass && typeof ComponentClass === 'function') {
            const instance = new ComponentClass();
            this.dependencyInstances.set(depName, instance);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load dependencies for ${this.componentName}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced CSS injection using CSSManager with advanced loading and caching features
   * Task 2.2: Enhanced injectCSS() method with CSSManager advanced features
   * @private
   * @param {Object} options - CSS injection options
   * @param {boolean} options.forceReload - Force reload even if already loaded
   * @param {number} options.priority - Loading priority (higher = loads first)
   * @param {boolean} options.preload - Preload CSS files without injection
   * @param {string} options.variant - CSS variant to load (theme, size, etc.)
   * @param {boolean} options.inline - Inject as inline styles
   * @param {Object} options.performance - Performance tracking options
   */
  async injectCSS(options = {}) {
    const {
      forceReload = false,
      priority = 0,
      preload = false,
      variant = null,
      inline = false,
      performance = { trackTiming: true, trackMemory: false }
    } = options;

    // Performance monitoring start (NFR-1.1)
    const perfStart = performance.trackTiming ? performance.now() : 0;
    const injectionStats = {
      filesProcessed: 0,
      filesLoaded: 0,
      filesFromCache: 0,
      totalTime: 0,
      errors: []
    };

    try {
      // Get CSS files with enhanced manifest support
      const cssFiles = this.getCSSFilesWithVariants(variant);
      
      if (cssFiles.length === 0) {
        this.log('debug', `No CSS files to inject for component ${this.componentName}`);
        return injectionStats;
      }

      // Batch processing for performance optimization
      const injectionPromises = cssFiles.map(async (cssFileConfig) => {
        const { file: cssFile, priority: filePriority = priority, scope = null } = cssFileConfig;
        
        try {
          // Resolve CSS path with enhanced path resolution
          const cssPath = this.resolveCSSPath(cssFile);
          if (!cssPath) {
            throw new Error(`Could not resolve CSS path for: ${cssFile}`);
          }

          // Enhanced loading status check with detailed information
          const loadingStatus = this.cssManager.isLoaded(cssPath, scope, true); // Get detailed status
          const injectionKey = `${cssPath}${scope ? `:${scope}` : ''}`;
          
          // Skip if already loaded/injected unless forced reload
          if (!forceReload && (loadingStatus.loaded || this.cssInjected.has(injectionKey))) {
            this.log('debug', `CSS ${cssPath} already loaded (cached: ${loadingStatus.cached}, injected: ${loadingStatus.injected})`);
            injectionStats.filesFromCache++;
            return { success: true, fromCache: true, cssPath };
          }

          // Preload mode - load into cache without DOM injection
          if (preload) {
            await this.cssManager.loadAndCache(cssPath, {
              scope,
              priority: filePriority,
              cache: true,
              timeout: 5000, // Shorter timeout for preload
            });
            
            this.log('debug', `CSS ${cssPath} preloaded into cache`);
            return { success: true, preloaded: true, cssPath };
          }

          // Enhanced CSS injection with advanced options
          const injectionOptions = {
            scope: scope || this.componentName.toLowerCase(),
            priority: filePriority,
            inline,
            media: this.getMediaQueryForVariant(variant),
            cache: true,
            timeout: 8000, // Extended timeout for complex CSS
            // Performance optimization options
            enableCache: true,
            maxRetries: 2
          };

          // Load and inject CSS using CSSManager advanced features
          const injectedElement = await this.cssManager.injectCSS(cssPath, injectionOptions);
          
          // Track successful injection
          this.cssInjected.add(injectionKey);
          injectionStats.filesLoaded++;
          
          // Apply component-specific CSS enhancements
          this.enhanceInjectedCSS(injectedElement, cssFileConfig);
          
          this.log('debug', `CSS ${cssPath} successfully injected with priority ${filePriority}`);
          return { success: true, element: injectedElement, cssPath };
          
        } catch (error) {
          injectionStats.errors.push({ cssFile, error: error.message });
          this.log('error', `Failed to inject CSS ${cssFile} for component ${this.componentName}:`, error);
          return { success: false, cssFile, error };
        }
      });

      // Execute all CSS injections with proper error handling
      const results = await Promise.allSettled(injectionPromises);
      
      // Process results and update statistics
      results.forEach((result, index) => {
        injectionStats.filesProcessed++;
        
        if (result.status === 'fulfilled' && result.value.success) {
          // Success - already counted in filesLoaded or filesFromCache
        } else {
          // Handle promise rejection or injection failure
          const cssFile = cssFiles[index]?.file || `unknown-${index}`;
          const error = result.reason || result.value?.error || 'Unknown error';
          injectionStats.errors.push({ cssFile, error: error.message || error });
        }
      });

      // Performance monitoring end (NFR-1.1)
      if (performance.trackTiming) {
        injectionStats.totalTime = performance.now() - perfStart;
        
        // Check performance threshold (NFR-1.1: must not increase by more than 10%)
        if (injectionStats.totalTime > 100) { // Baseline threshold
          this.log('warn', `CSS injection took ${injectionStats.totalTime.toFixed(2)}ms for ${this.componentName} - consider optimization`);
        }
      }

      // Enhanced logging with detailed statistics
      this.log('info', `CSS injection complete for ${this.componentName}: ` +
        `${injectionStats.filesLoaded} loaded, ${injectionStats.filesFromCache} from cache, ` +
        `${injectionStats.errors.length} errors (${injectionStats.totalTime.toFixed(2)}ms)`);
        
      // Store injection statistics for debugging and monitoring
      this.cssInjectionStats = {
        ...injectionStats,
        timestamp: Date.now(),
        component: this.componentName,
        variant
      };

      return injectionStats;
      
    } catch (error) {
      // Critical error in injection process
      const totalTime = performance.trackTiming ? performance.now() - perfStart : 0;
      
      this.log('error', `Critical error during CSS injection for ${this.componentName}:`, error);
      
      return {
        ...injectionStats,
        totalTime,
        criticalError: error.message,
        success: false
      };
    }
  }

  /**
   * Get CSS files with variant support for enhanced manifest integration
   * Task 2.2: Enhanced CSS file discovery with variants and dependencies
   * @private
   * @param {string} variant - CSS variant to load (theme, size, state, etc.)
   * @returns {Array} - Array of CSS file configuration objects
   */
  getCSSFilesWithVariants(variant = null) {
    // Start with basic CSS files from manifest or static properties
    const baseCSSFiles = this.manifest?.getCSSFiles() || this.constructor.css || [];
    
    // Convert simple strings to configuration objects
    const cssConfigs = baseCSSFiles.map(cssFile => {
      if (typeof cssFile === 'string') {
        return {
          file: cssFile,
          priority: 0,
          scope: null,
          variant: 'primary'
        };
      }
      return cssFile; // Already a configuration object
    });

    // Add variant-specific CSS files if manifest supports enhanced CSS schema
    if (variant && this.manifest?.data?.css?.variants) {
      const variants = this.manifest.data.css.variants;
      
      // Handle different variant types (themes, sizes, states)
      if (variants.themes && variants.themes[variant]) {
        cssConfigs.push({
          file: variants.themes[variant],
          priority: 1, // Higher priority for variants
          scope: null,
          variant: `theme-${variant}`
        });
      }
      
      if (variants.sizes && variants.sizes[variant]) {
        cssConfigs.push({
          file: variants.sizes[variant],
          priority: 1,
          scope: null,
          variant: `size-${variant}`
        });
      }
      
      if (variants.states && variants.states[variant]) {
        cssConfigs.push({
          file: variants.states[variant],
          priority: 2, // Highest priority for state variants
          scope: null,
          variant: `state-${variant}`
        });
      }
    }

    // Add CSS dependencies if specified in manifest
    if (this.manifest?.data?.css?.dependencies) {
      const dependencies = this.manifest.data.css.dependencies;
      dependencies.forEach((depFile) => {
        cssConfigs.unshift({ // Add dependencies at the beginning
          file: depFile,
          priority: -1, // Lower priority to load first
          scope: null,
          variant: 'dependency',
          isDependency: true
        });
      });
    }

    // Sort by priority (higher priority first)
    return cssConfigs.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Get media query for CSS variant
   * Task 2.2: Enhanced CSS variant support with responsive considerations
   * @private
   * @param {string} variant - Variant name
   * @returns {string} - Media query string
   */
  getMediaQueryForVariant(variant) {
    if (!variant) return 'all';
    
    // Map variants to appropriate media queries
    const mediaQueries = {
      'mobile': '(max-width: 768px)',
      'tablet': '(min-width: 769px) and (max-width: 1024px)',
      'desktop': '(min-width: 1025px)',
      'print': 'print',
      'dark': '(prefers-color-scheme: dark)',
      'light': '(prefers-color-scheme: light)',
      'high-contrast': '(prefers-contrast: high)',
      'reduced-motion': '(prefers-reduced-motion: reduce)'
    };
    
    return mediaQueries[variant] || 'all';
  }

  /**
   * Enhance injected CSS element with component-specific features
   * Task 2.2: Post-injection CSS enhancement for better integration
   * @private
   * @param {HTMLElement} cssElement - Injected CSS element (link or style)
   * @param {Object} cssConfig - CSS configuration object
   */
  enhanceInjectedCSS(cssElement, cssConfig) {
    if (!cssElement || !cssConfig) return;
    
    // Add component-specific attributes for debugging and management
    cssElement.setAttribute('data-component', this.componentName);
    cssElement.setAttribute('data-component-id', this.options.id);
    
    if (cssConfig.variant) {
      cssElement.setAttribute('data-css-variant', cssConfig.variant);
    }
    
    if (cssConfig.isDependency) {
      cssElement.setAttribute('data-css-dependency', 'true');
    }

    // Add performance monitoring attributes
    cssElement.setAttribute('data-css-loaded-at', Date.now().toString());
    
    // Set up CSS error handling for link elements
    if (cssElement.tagName === 'LINK') {
      cssElement.addEventListener('error', (_error) => {
        this.log('error', `CSS load error for ${this.componentName}:`, {
          href: cssElement.href,
          variant: cssConfig.variant,
          error: _error
        });
        
        // Emit component event for error handling
        this.emit('css-load-error', {
          cssElement,
          cssConfig,
          error: _error
        });
      });
      
      cssElement.addEventListener('load', () => {
        this.log('debug', `CSS loaded successfully for ${this.componentName}: ${cssElement.href}`);
        
        // Emit success event
        this.emit('css-load-success', {
          cssElement,
          cssConfig
        });
      });
    }
  }

  /**
   * Log message with component context (enhanced logging for Task 2.2)
   * @private
   * @param {string} level - Log level ('debug', 'info', 'warn', 'error')
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  log(level, message, ...args) {
    // Use existing console methods with component context
    const logMethod = console[level] || console.log;
    const componentContext = `[${this.componentName}#${this.options.id}]`;
    
    // Only log if appropriate level (can be configured later)
    if (level === 'debug' && !window.DEBUG_COMPONENTS) {
      return; // Skip debug logs unless explicitly enabled
    }
    
    logMethod(`${componentContext} ${message}`, ...args);
  }

  /**
   * Set up theme integration
   * @private
   */
  setupThemeIntegration() {
    // Listen for theme changes
    this.themeUnsubscribe = themeService.onThemeChange(() => {
      if (this.isRendered) {
        this.onThemeChange();
      }
    });
  }

  /**
   * Generate a unique ID for the component
   * @returns {string} - Generated ID
   */
  generateId() {
    const className = this.constructor.name.toLowerCase();
    return `${className}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate component HTML - to be implemented by subclasses
   * @returns {string} - Component HTML
   */
  generateHTML() {
    throw new Error('generateHTML method must be implemented by subclass');
  }

  /**
   * Render the component to a container
   * @param {HTMLElement|string} [container] - Container element or selector
   * @returns {BaseComponent} - Returns this for chaining
   */
  async render(container) {
    if (this.isDestroyed) {
      throw new Error('Cannot render destroyed component');
    }

    // Ensure component is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    const targetContainer = container || this.options.container;
    const containerEl = typeof targetContainer === 'string'
      ? document.querySelector(targetContainer)
      : targetContainer;

    if (!containerEl) {
      console.error('Container not found:', targetContainer);
      return this;
    }

    try {
      // Call pre-render hook
      this.onBeforeRender();

      // Generate and insert HTML
      const html = this.generateHTML();
      containerEl.innerHTML += html;

      // Store reference to the element
      this.element = document.getElementById(this.options.id);

      if (this.element) {
        this.applyAttributes();
        this.attachEventListeners();
        this.applyTheme();
        this.applyScopedStyles(); // Apply CSS scoping for component isolation
        this.isRendered = true;
        this.onRender();
      }

    } catch (error) {
      console.error(`Error rendering component ${this.componentName}:`, error);
      this.onRenderError(error);
    }

    return this;
  }

  /**
   * Update component with new options
   * @param {Object} newOptions - New options to merge
   * @param {boolean} [rerender=false] - Whether to re-render
   * @returns {BaseComponent} - Returns this for chaining
   */
  update(newOptions, rerender = false) {
    const oldOptions = { ...this.options };
    Object.assign(this.options, newOptions);

    this.onUpdate(oldOptions, this.options);

    if (rerender && this.isRendered) {
      this.rerender();
    }

    return this;
  }

  /**
   * Re-render the component in place
   * @returns {BaseComponent} - Returns this for chaining
   */
  rerender() {
    if (!this.isRendered || !this.element) {
      return this;
    }

    const container = this.element.parentElement;
    const nextSibling = this.element.nextSibling;
    
    this.destroy();
    
    if (nextSibling) {
      container.insertBefore(document.createElement('div'), nextSibling);
      container.removeChild(container.lastChild);
    }
    
    this.render(container);
    return this;
  }

  /**
   * Apply theme to component
   * @private
   */
  applyTheme() {
    if (!this.element) return;

    // Apply theme-specific CSS classes
    const currentTheme = themeService.getCurrentTheme();
    const isDark = themeService.isDarkMode();

    this.element.classList.add(`theme-${currentTheme}`);
    this.element.classList.toggle('theme-dark', isDark);
    this.element.classList.toggle('theme-light', !isDark);

    // Apply component-specific theme overrides
    if (this.options.themeOverrides) {
      for (const [property, value] of Object.entries(this.options.themeOverrides)) {
        this.element.style.setProperty(`--${property}`, value);
      }
    }
  }

  /**
   * Get theme-aware colors
   * @param {string|string[]} variables - CSS variable name(s)
   * @param {string} fallback - Fallback color
   * @returns {string|Object} - Color value or object of colors
   */
  getThemeColors(variables, fallback) {
    if (Array.isArray(variables)) {
      return themeService.getThemeColors(variables, fallback);
    }
    return themeService.getThemeColor(variables, fallback);
  }

  /**
   * Get semantic theme colors
   * @returns {Object} - Object with semantic color names
   */
  getSemanticColors() {
    return themeService.getSemanticColors();
  }

  /**
   * Apply attributes to the component element
   * @private
   */
  applyAttributes() {
    if (!this.element) return;

    Object.entries(this.options.attributes).forEach(([key, value]) => {
      this.element.setAttribute(key, value);
    });
  }

  /**
   * Attach event listeners to the component - to be implemented by subclasses
   */
  attachEventListeners() {
    // Default implementation - override in subclasses
  }

  /**
   * Destroy the component and clean up resources
   */
  destroy() {
    if (this.isDestroyed) return;

    // Call pre-destroy hook
    this.onBeforeDestroy();

    // Remove event listeners
    this.removeEventListeners();

    // Unsubscribe from theme changes
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe();
      this.themeUnsubscribe = null;
    }

    // Clean up injected CSS (if no other components are using it)
    this.cleanupCSS();

    // Destroy dependency instances
    for (const instance of this.dependencyInstances.values()) {
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
    }
    this.dependencyInstances.clear();

    // Remove element from DOM
    if (this.element) {
      try {
        this.element.remove();
      } catch (error) {
        console.warn('Error removing element:', error);
      }
    }

    // Reset state
    this.element = null;
    this.isRendered = false;
    this.isDestroyed = true;

    this.onDestroy();
    return this;
  }

  // ===== Lifecycle Hooks =====

  /**
   * Called after component initialization
   */
  onInitialized() {
    // Override in subclasses
  }

  /**
   * Called before rendering
   */
  onBeforeRender() {
    // Override in subclasses
  }

  /**
   * Called after successful render
   */
  onRender() {
    // Override in subclasses
  }

  /**
   * Called when render fails
   * @param {Error} error - Render error
   */
  onRenderError(_error) {
    // Override in subclasses
  }

  /**
   * Called when component options are updated
   * @param {Object} oldOptions - Previous options
   * @param {Object} newOptions - New options
   */
  onUpdate(_oldOptions, _newOptions) {
    // Override in subclasses
  }

  /**
   * Called when theme changes
   */
  onThemeChange() {
    if (this.isRendered) {
      this.applyTheme();
    }
  }

  /**
   * Called before component destruction
   */
  onBeforeDestroy() {
    // Override in subclasses
  }

  /**
   * Called after component destruction
   */
  onDestroy() {
    // Override in subclasses
  }

  // ===== Event Management =====

  /**
   * Add event listener (alias for addEventListener)
   */
  on(event, handler, selector) {
    return this.addEventListener(event, handler, selector);
  }

  /**
   * Remove event listener (alias for removeEventListener)
   */
  off(event, handler) {
    return this.removeEventListener(event, handler);
  }

  /**
   * Add event listener to component
   */
  addEventListener(event, handler, selector) {
    if (!this.element) return this;

    const wrappedHandler = selector
      ? e => {
        if (e.target.matches(selector)) {
          handler.call(this, e);
        }
      }
      : handler.bind(this);

    wrappedHandler.originalHandler = handler;
    this.element.addEventListener(event, wrappedHandler);

    const key = `${event}-${selector || 'root'}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key).push(wrappedHandler);

    return this;
  }

  /**
   * Remove event listeners
   */
  removeEventListeners(event) {
    if (!this.element) return this;

    if (event) {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.forEach(handler => {
          try {
            this.element.removeEventListener(event.split('-')[0], handler);
          } catch (error) {
            console.warn('Error removing event listener:', error);
          }
        });
        this.eventListeners.delete(event);
      }
    } else {
      this.eventListeners.forEach((handlers, key) => {
        const eventName = key.split('-')[0];
        handlers.forEach(handler => {
          try {
            this.element.removeEventListener(eventName, handler);
          } catch (error) {
            console.warn('Error removing event listener:', error);
          }
        });
      });
      this.eventListeners.clear();
    }

    return this;
  }

  /**
   * Emit custom event
   */
  emit(eventName, detail) {
    if (this.element) {
      const event = new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true,
      });
      this.element.dispatchEvent(event);
    }
    return this;
  }

  // ===== Utility Methods =====

  /**
   * Show component
   */
  show() {
    if (this.element) {
      this.element.style.display = '';
      this.element.removeAttribute('hidden');
    }
    return this;
  }

  /**
   * Hide component
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
    return this;
  }

  /**
   * Toggle component visibility
   */
  toggle() {
    if (this.element) {
      const isHidden = this.element.style.display === 'none' || 
                     this.element.hasAttribute('hidden');
      return isHidden ? this.show() : this.hide();
    }
    return this;
  }

  /**
   * Add CSS classes
   */
  addClass(...classes) {
    if (this.element) {
      this.element.classList.add(...classes);
    }
    return this;
  }

  /**
   * Remove CSS classes
   */
  removeClass(...classes) {
    if (this.element) {
      this.element.classList.remove(...classes);
    }
    return this;
  }

  /**
   * Toggle CSS class
   */
  toggleClass(className, force) {
    if (this.element) {
      return this.element.classList.toggle(className, force);
    }
    return false;
  }

  /**
   * Check if has CSS class
   */
  hasClass(className) {
    return this.element ? this.element.classList.contains(className) : false;
  }

  /**
   * Get comprehensive CSS loading statistics for this component
   * Task 2.2: Enhanced CSS statistics with performance monitoring (NFR-1.1, NFR-1.4)
   * @param {boolean} includeGlobal - Include global CSS manager statistics
   * @returns {Object} - Detailed CSS statistics including performance metrics
   */
  getCSSStats(includeGlobal = false) {
    const stats = {
      // Component-specific information
      componentName: this.componentName,
      componentId: this.options.id,
      injectedFiles: Array.from(this.cssInjected),
      
      // Injection statistics from latest injectCSS call
      lastInjectionStats: this.cssInjectionStats || null,
      
      // Component-level CSS performance metrics
      performance: {
        totalInjectionTime: this.cssInjectionStats?.totalTime || 0,
        averageFileLoadTime: this.getAverageCSSLoadTime(),
        cacheHitRatio: this.getCSSCacheHitRatio(),
        errorCount: this.cssInjectionStats?.errors?.length || 0,
        lastInjectionTimestamp: this.cssInjectionStats?.timestamp || null
      },
      
      // CSS file analysis
      cssFileAnalysis: {
        totalFiles: this.cssInjected.size,
        filesByVariant: this.getCSSFilesByVariant(),
        dependencyFiles: this.getDependencyCSSFiles(),
        loadedFromCache: this.cssInjectionStats?.filesFromCache || 0,
        freshLoads: this.cssInjectionStats?.filesLoaded || 0
      },
      
      // Path resolution statistics
      pathResolverStats: this.cssPathResolver.getStats()
    };
    
    // Include global CSS manager statistics if requested
    if (includeGlobal) {
      stats.globalCSSManagerStats = this.cssManager.getCacheStats();
    }
    
    return stats;
  }

  /**
   * Get average CSS load time for this component
   * @private
   * @returns {number} - Average load time in milliseconds
   */
  getAverageCSSLoadTime() {
    if (!this.cssInjectionStats?.totalTime || !this.cssInjectionStats?.filesLoaded) {
      return 0;
    }
    return this.cssInjectionStats.totalTime / Math.max(this.cssInjectionStats.filesLoaded, 1);
  }

  /**
   * Get CSS cache hit ratio for this component
   * @private
   * @returns {number} - Cache hit ratio as percentage (0-100)
   */
  getCSSCacheHitRatio() {
    if (!this.cssInjectionStats) return 0;
    
    const totalFiles = this.cssInjectionStats.filesFromCache + this.cssInjectionStats.filesLoaded;
    if (totalFiles === 0) return 0;
    
    return Math.round((this.cssInjectionStats.filesFromCache / totalFiles) * 100);
  }

  /**
   * Get CSS files grouped by variant
   * @private
   * @returns {Object} - CSS files grouped by variant type
   */
  getCSSFilesByVariant() {
    const filesByVariant = {
      primary: [],
      themes: [],
      sizes: [],
      states: [],
      dependencies: [],
      other: []
    };
    
    // This would need to be enhanced based on actual injection tracking
    // For now, return basic categorization
    this.cssInjected.forEach(cssPath => {
      if (cssPath.includes('theme')) {
        filesByVariant.themes.push(cssPath);
      } else if (cssPath.includes('size')) {
        filesByVariant.sizes.push(cssPath);
      } else if (cssPath.includes('state')) {
        filesByVariant.states.push(cssPath);
      } else if (cssPath.includes('dependency') || cssPath.includes('shared')) {
        filesByVariant.dependencies.push(cssPath);
      } else {
        filesByVariant.primary.push(cssPath);
      }
    });
    
    return filesByVariant;
  }

  /**
   * Get dependency CSS files
   * @private
   * @returns {Array} - Array of dependency CSS file paths
   */
  getDependencyCSSFiles() {
    return Array.from(this.cssInjected).filter(cssPath => 
      cssPath.includes('dependency') || 
      cssPath.includes('shared') ||
      cssPath.includes('../')
    );
  }

  /**
   * Preload CSS files for performance optimization
   * Task 2.2: Enhanced CSS preloading for better performance (NFR-1.1)
   * @param {Object} options - Preload options
   * @param {string} options.variant - CSS variant to preload
   * @param {Array} options.specificFiles - Specific CSS files to preload
   * @param {boolean} options.includeDependencies - Include dependency CSS files
   * @returns {Promise<Object>} - Preload statistics
   */
  async preloadCSS(options = {}) {
    const {
      variant = null,
      specificFiles = null,
      _includeDependencies = true
    } = options;
    
    const preloadStart = performance.now();
    
    try {
      // Use existing injectCSS method with preload option
      const preloadStats = await this.injectCSS({
        variant,
        preload: true,
        performance: { trackTiming: true }
      });
      
      // If specific files provided, preload those as well
      if (specificFiles && specificFiles.length > 0) {
        const specificPreloadPromises = specificFiles.map(cssFile => {
          const cssPath = this.resolveCSSPath(cssFile);
          return cssPath ? this.cssManager.loadAndCache(cssPath, { cache: true }) : null;
        }).filter(Boolean);
        
        await Promise.allSettled(specificPreloadPromises);
      }
      
      const preloadTime = performance.now() - preloadStart;
      
      return {
        success: true,
        preloadTime,
        filesPreloaded: preloadStats.filesLoaded + preloadStats.filesFromCache,
        variant,
        specificFiles: specificFiles?.length || 0
      };
      
    } catch (error) {
      this.log('error', `CSS preload failed for ${this.componentName}:`, error);
      
      return {
        success: false,
        error: error.message,
        preloadTime: performance.now() - preloadStart
      };
    }
  }

  /**
   * Force reload CSS files (bypass cache)
   * Task 2.2: Enhanced CSS management with forced reload capability
   * @param {Object} options - Reload options
   * @returns {Promise<Object>} - Reload statistics
   */
  async reloadCSS(options = {}) {
    const { variant = null, clearCache = true } = options;
    
    this.log('info', `Force reloading CSS for ${this.componentName}`);
    
    try {
      // Clear component-specific CSS cache if requested
      if (clearCache) {
        this.cssInjected.forEach(cssPath => {
          this.cssManager.invalidateCache(cssPath, null, { clearInjected: false });
        });
        this.cssInjected.clear();
      }
      
      // Inject CSS with force reload
      const reloadStats = await this.injectCSS({
        forceReload: true,
        variant,
        performance: { trackTiming: true }
      });
      
      this.log('info', `CSS reload complete for ${this.componentName}`);
      return reloadStats;
      
    } catch (error) {
      this.log('error', `CSS reload failed for ${this.componentName}:`, error);
      throw error;
    }
  }

  /**
   * Validate CSS performance against requirements
   * Task 2.2: Performance validation for NFR-1.1 compliance
   * @returns {Object} - Performance validation results
   */
  validateCSSPerformance() {
    const stats = this.getCSSStats(false);
    const validation = {
      compliant: true,
      issues: [],
      recommendations: [],
      metrics: {}
    };
    
    // NFR-1.1: CSS loading time must not increase by more than 10%
    const baselineLoadTime = 50; // ms - baseline expectation
    const maxAllowedTime = baselineLoadTime * 1.1; // 10% increase
    
    if (stats.performance.totalInjectionTime > maxAllowedTime) {
      validation.compliant = false;
      validation.issues.push({
        requirement: 'NFR-1.1',
        issue: `CSS injection time (${stats.performance.totalInjectionTime.toFixed(2)}ms) exceeds 10% threshold (${maxAllowedTime}ms)`,
        severity: 'high'
      });
      validation.recommendations.push('Consider CSS preloading or splitting large CSS files');
    }
    
    // NFR-1.4: Cache hit rate must exceed 85%
    if (stats.performance.cacheHitRatio < 85) {
      validation.compliant = false;
      validation.issues.push({
        requirement: 'NFR-1.4',
        issue: `Cache hit ratio (${stats.performance.cacheHitRatio}%) below 85% target`,
        severity: 'medium'
      });
      validation.recommendations.push('Enable CSS preloading or check cache configuration');
    }
    
    // Check for excessive CSS files
    if (stats.cssFileAnalysis.totalFiles > 10) {
      validation.recommendations.push('Consider consolidating CSS files to improve performance');
    }
    
    // Check for errors
    if (stats.performance.errorCount > 0) {
      validation.issues.push({
        requirement: 'General',
        issue: `${stats.performance.errorCount} CSS loading errors detected`,
        severity: 'high'
      });
    }
    
    validation.metrics = {
      loadTime: stats.performance.totalInjectionTime,
      cacheHitRatio: stats.performance.cacheHitRatio,
      fileCount: stats.cssFileAnalysis.totalFiles,
      errorCount: stats.performance.errorCount
    };
    
    return validation;
  }

  // ===== Enhanced CSS Management Methods (Task 2.2) =====
  // The above methods provide advanced CSS management capabilities
  
  // ===== Helper Methods =====

  /**
   * Get component path for manifest loading
   * @private
   */
  getComponentPath() {
    // This would need to be implemented based on the component's location
    // For now, return null to fallback to static properties
    return null;
  }

  /**
   * Resolve CSS file path using CSSPathResolver for enhanced path resolution (FR-1.1, FR-1.2)
   * @private
   */
  resolveCSSPath(cssFile) {
    // Use CSSPathResolver for intelligent path resolution with aliases and category support
    const componentPath = this.getComponentPath();
    return this.cssPathResolver.resolve(cssFile, componentPath, this.componentName);
  }

  /**
   * Load CSS file (legacy method - now uses CSSManager)
   * @private
   * @deprecated Use cssManager.injectCSS() instead for enhanced features
   */
  loadCSS(cssPath) {
    // Delegate to CSSManager for consistency and enhanced features
    return this.cssManager.injectCSS(cssPath, {
      scope: this.componentName.toLowerCase(),
      priority: 0
    }).then(() => {
      // Resolve with void for backward compatibility
      return;
    });
  }

  /**
   * Apply scoped styles to component for CSS isolation (Task 2.3)
   * Implements NFR-2.3: Component CSS MUST not leak styles globally
   * Supports multiple scoping strategies with automatic scope generation
   * @param {Object} options - Scoping options
   * @param {string} [options.strategy] - Scoping strategy ('class', 'attribute', 'css-modules', 'shadow-dom')
   * @param {boolean} [options.isolateGlobal] - Prevent global CSS from affecting component
   * @param {boolean} [options.autoScope] - Automatically scope all CSS rules
   * @param {string} [options.customScope] - Custom scope identifier
   * @param {boolean} [options.deepScoping] - Apply scoping to child elements
   * @param {Array<string>} [options.preserveClasses] - CSS classes to preserve from scoping
   * @param {Object} [options.performance] - Performance monitoring options
   */
  applyScopedStyles(options = {}) {
    if (!this.element) {
      this.log('warn', 'Cannot apply scoped styles: component element not found');
      return;
    }
    
    const {
      strategy = 'class',
      isolateGlobal = true,
      autoScope = true,
      customScope = null,
      deepScoping = false,
      preserveClasses = [],
      performance = { trackTiming: true }
    } = options;

    // Performance monitoring start (NFR-2.3 compliance)
    const perfStart = performance.trackTiming ? performance.now() : 0;
    
    try {
      // Generate component scope identifier
      const componentScope = this.generateScopeIdentifier(customScope);
      
      // Store scope for cleanup and reference
      this.componentScope = componentScope;
      
      // Apply primary scoping strategy
      this.applyScopingStrategy(strategy, componentScope, {
        isolateGlobal,
        preserveClasses,
        deepScoping
      });
      
      // Apply automatic CSS rule scoping if enabled
      if (autoScope) {
        this.applyCSSRuleScoping(componentScope, {
          deepScoping,
          preserveClasses
        });
      }
      
      // Set up scoping attributes for debugging and CSS targeting
      this.setupScopingAttributes(componentScope, strategy);
      
      // Apply isolation techniques to prevent global CSS interference
      if (isolateGlobal) {
        this.applyGlobalIsolation(componentScope);
      }
      
      // Performance monitoring end
      if (performance.trackTiming) {
        const scopingTime = performance.now() - perfStart;
        this.log('debug', `CSS scoping applied in ${scopingTime.toFixed(2)}ms using ${strategy} strategy`);
        
        // Store scoping performance metrics
        this.scopingStats = {
          strategy,
          componentScope,
          scopingTime,
          timestamp: Date.now(),
          elementsScoped: this.countScopedElements()
        };
      }
      
      // Emit scoping complete event
      this.emit('css-scoping-applied', {
        componentScope,
        strategy,
        options
      });
      
    } catch (error) {
      this.log('error', `Failed to apply CSS scoping for ${this.componentName}:`, error);
      
      // Emit error event
      this.emit('css-scoping-error', {
        error,
        options
      });
      
      throw error;
    }
  }

  /**
   * Generate unique scope identifier for component
   * @private
   * @param {string} customScope - Custom scope override
   * @returns {string} - Generated scope identifier
   */
  generateScopeIdentifier(customScope = null) {
    if (customScope) {
      return customScope;
    }
    
    // Generate scope based on component name and instance ID
    const baseName = this.componentName.toLowerCase().replace(/component$/, '');
    const instanceId = this.options.id.split('-').pop(); // Get last part of ID
    
    return `${baseName}-${instanceId}`;
  }

  /**
   * Apply the selected scoping strategy
   * @private
   * @param {string} strategy - Scoping strategy
   * @param {string} componentScope - Scope identifier
   * @param {Object} options - Strategy options
   */
  applyScopingStrategy(strategy, componentScope, options = {}) {
    const { isolateGlobal, preserveClasses, deepScoping } = options;
    
    switch (strategy) {
    case 'class':
      this.applyClassScoping(componentScope, { deepScoping, preserveClasses });
      break;
        
    case 'attribute':
      this.applyAttributeScoping(componentScope, { deepScoping });
      break;
        
    case 'css-modules':
      this.applyCSSModulesScoping(componentScope, { deepScoping, preserveClasses });
      break;
        
    case 'shadow-dom':
      this.applyShadowDOMScoping(componentScope, { isolateGlobal });
      break;
        
    case 'hybrid':
      // Use combination of class and attribute scoping
      this.applyClassScoping(componentScope, { deepScoping, preserveClasses });
      this.applyAttributeScoping(componentScope, { deepScoping });
      break;
        
    default:
      this.log('warn', `Unknown scoping strategy: ${strategy}, falling back to class scoping`);
      this.applyClassScoping(componentScope, { deepScoping, preserveClasses });
    }
  }

  /**
   * Apply class-based CSS scoping
   * @private
   * @param {string} componentScope - Scope identifier
   * @param {Object} options - Scoping options
   */
  applyClassScoping(componentScope, options = {}) {
    const { deepScoping, preserveClasses } = options;
    
    // Add primary scoping class to root element
    this.element.classList.add(componentScope);
    
    // Add component type class for broader CSS targeting
    const componentType = this.componentName.toLowerCase();
    if (!preserveClasses.includes(componentType)) {
      this.element.classList.add(`component-${componentType}`);
    }
    
    // Apply deep scoping to child elements if enabled
    if (deepScoping) {
      const childElements = this.element.querySelectorAll('*');
      childElements.forEach((child, index) => {
        // Add child-specific scoping class
        const childScope = `${componentScope}-child-${index}`;
        child.classList.add(childScope);
        
        // Add semantic scoping based on element type
        const tagName = child.tagName.toLowerCase();
        if (!preserveClasses.includes(`${componentScope}-${tagName}`)) {
          child.classList.add(`${componentScope}-${tagName}`);
        }
      });
    }
  }

  /**
   * Apply attribute-based CSS scoping
   * @private
   * @param {string} componentScope - Scope identifier
   * @param {Object} options - Scoping options
   */
  applyAttributeScoping(componentScope, options = {}) {
    const { deepScoping } = options;
    
    // Add primary scoping attribute to root element
    this.element.setAttribute('data-component-scope', componentScope);
    this.element.setAttribute('data-component-type', this.componentName.toLowerCase());
    
    // Add instance-specific attribute
    this.element.setAttribute('data-component-instance', this.options.id);
    
    // Apply deep scoping to child elements if enabled
    if (deepScoping) {
      const childElements = this.element.querySelectorAll('*');
      childElements.forEach((child, index) => {
        child.setAttribute('data-parent-scope', componentScope);
        child.setAttribute('data-child-index', index.toString());
        
        // Add semantic attributes based on element type
        const tagName = child.tagName.toLowerCase();
        child.setAttribute('data-element-type', tagName);
      });
    }
  }

  /**
   * Apply CSS Modules-style scoping
   * @private
   * @param {string} componentScope - Scope identifier
   * @param {Object} options - Scoping options
   */
  applyCSSModulesScoping(componentScope, options = {}) {
    const { deepScoping, preserveClasses } = options;
    
    // Transform existing classes to scoped versions
    const existingClasses = Array.from(this.element.classList);
    
    existingClasses.forEach(className => {
      if (!preserveClasses.includes(className) && !className.includes('_')) {
        // Transform class to CSS modules format: component_class_hash
        const scopedClass = `${componentScope}_${className}_${this.generateHash(className)}`;
        this.element.classList.remove(className);
        this.element.classList.add(scopedClass);
        
        // Store mapping for CSS rule transformation
        this.classMappings = this.classMappings || new Map();
        this.classMappings.set(className, scopedClass);
      }
    });
    
    // Apply deep scoping with CSS modules pattern
    if (deepScoping) {
      const childElements = this.element.querySelectorAll('*');
      childElements.forEach((child) => {
        const childClasses = Array.from(child.classList);
        childClasses.forEach(className => {
          if (!preserveClasses.includes(className) && !className.includes('_')) {
            const scopedClass = `${componentScope}_${className}_${this.generateHash(className)}`;
            child.classList.remove(className);
            child.classList.add(scopedClass);
            
            this.classMappings.set(className, scopedClass);
          }
        });
      });
    }
  }

  /**
   * Apply Shadow DOM-based scoping (experimental)
   * @private
   * @param {string} componentScope - Scope identifier
   * @param {Object} options - Scoping options
   */
  applyShadowDOMScoping(componentScope, options = {}) {
    const { isolateGlobal } = options;
    
    // Check if Shadow DOM is supported
    if (!this.element.attachShadow) {
      this.log('warn', 'Shadow DOM not supported, falling back to class scoping');
      this.applyClassScoping(componentScope);
      return;
    }
    
    try {
      // Create shadow root with appropriate mode
      const shadowRoot = this.element.attachShadow({ 
        mode: isolateGlobal ? 'closed' : 'open' 
      });
      
      // Move existing content into shadow DOM
      const existingContent = this.element.innerHTML;
      this.element.innerHTML = '';
      shadowRoot.innerHTML = existingContent;
      
      // Store shadow root reference
      this.shadowRoot = shadowRoot;
      
      // Add scoping attributes to shadow host
      this.element.setAttribute('data-shadow-scope', componentScope);
      
      this.log('debug', `Shadow DOM scoping applied for ${componentScope}`);
      
    } catch (error) {
      this.log('error', 'Shadow DOM scoping failed, falling back to class scoping:', error);
      this.applyClassScoping(componentScope);
    }
  }

  /**
   * Apply automatic CSS rule scoping to injected stylesheets
   * @private
   * @param {string} componentScope - Scope identifier
   * @param {Object} options - Scoping options
   */
  applyCSSRuleScoping(componentScope, options = {}) {
    const { deepScoping, preserveClasses } = options;
    
    // Find all CSS rules that might affect this component
    const componentStylesheets = document.querySelectorAll(
      `[data-component="${this.componentName}"], [data-css-scope="${componentScope}"]`
    );
    
    componentStylesheets.forEach(stylesheet => {
      try {
        this.scopeCSSRules(stylesheet, componentScope, {
          deepScoping,
          preserveClasses
        });
      } catch (error) {
        this.log('warn', 'Could not scope CSS rules in stylesheet:', error);
      }
    });
  }

  /**
   * Scope CSS rules within a stylesheet
   * @private
   * @param {HTMLElement} stylesheet - Stylesheet element
   * @param {string} componentScope - Scope identifier
   * @param {Object} options - Scoping options
   */
  scopeCSSRules(stylesheet, componentScope, options = {}) {
    // This would need to access CSS rules and modify selectors
    // For now, we'll use the CSSManager's applyScopeToCSS method
    
    if (stylesheet.sheet && stylesheet.sheet.cssRules) {
      const rules = Array.from(stylesheet.sheet.cssRules);
      let modifiedCSS = '';
      
      rules.forEach(rule => {
        if (rule.type === 1) { // CSSRule.STYLE_RULE = 1
          // Transform selector to be scoped
          const scopedSelector = this.transformSelectorForScoping(
            rule.selectorText, 
            componentScope,
            options
          );
          modifiedCSS += `${scopedSelector} { ${rule.style.cssText} }\n`;
        } else {
          // Preserve other rule types (media queries, keyframes, etc.)
          modifiedCSS += rule.cssText + '\n';
        }
      });
      
      // Replace stylesheet content with scoped version
      if (modifiedCSS && stylesheet.tagName === 'STYLE') {
        stylesheet.textContent = modifiedCSS;
      }
    }
  }

  /**
   * Transform CSS selector for scoping
   * @private
   * @param {string} selector - Original CSS selector
   * @param {string} componentScope - Scope identifier
   * @param {Object} options - Transform options
   * @returns {string} - Scoped selector
   */
  transformSelectorForScoping(selector, componentScope, options = {}) {
    const { preserveClasses } = options;
    
    // Skip pseudo-selectors and special cases
    if (selector.includes(':root') || selector.includes('@')) {
      return selector;
    }
    
    // Split multiple selectors
    return selector.split(',').map(sel => {
      const trimmedSelector = sel.trim();
      
      // Check if this selector should be preserved
      const shouldPreserve = preserveClasses.some(preserved => 
        trimmedSelector.includes(preserved)
      );
      
      if (shouldPreserve) {
        return trimmedSelector;
      }
      
      // Apply scoping based on selector type
      if (trimmedSelector.startsWith('.')) {
        // Class selector - add component scope
        return `.${componentScope} ${trimmedSelector}`;
      } else if (trimmedSelector.startsWith('#')) {
        // ID selector - add component scope
        return `.${componentScope} ${trimmedSelector}`;
      } else if (trimmedSelector.match(/^[a-zA-Z]/)) {
        // Element selector - add component scope
        return `.${componentScope} ${trimmedSelector}`;
      } else {
        // Complex selector - prepend component scope
        return `.${componentScope} ${trimmedSelector}`;
      }
    }).join(', ');
  }

  /**
   * Set up scoping attributes for debugging and CSS targeting
   * @private
   * @param {string} componentScope - Scope identifier
   * @param {string} strategy - Scoping strategy used
   */
  setupScopingAttributes(componentScope, strategy) {
    // Add debugging and development attributes
    this.element.setAttribute('data-css-scoped', 'true');
    this.element.setAttribute('data-css-scope-strategy', strategy);
    this.element.setAttribute('data-css-scope-id', componentScope);
    this.element.setAttribute('data-css-scope-timestamp', Date.now().toString());
    
    // Add component identification
    this.element.setAttribute('data-component-scoped-name', this.componentName);
    this.element.setAttribute('data-component-scoped-version', this.constructor.version || '1.0.0');
  }

  /**
   * Apply global CSS isolation techniques
   * @private
   * @param {string} componentScope - Scope identifier
   */
  applyGlobalIsolation(componentScope) {
    // Add CSS containment for performance and isolation
    try {
      if (typeof window !== 'undefined' && window.CSS && window.CSS.supports('contain', 'layout style paint')) {
        this.element.style.contain = 'layout style paint';
      }
    } catch (error) {
      // CSS.supports not available, skip
    }
    
    // Add isolation context to prevent certain CSS from leaking
    try {
      if (typeof window !== 'undefined' && window.CSS && window.CSS.supports('isolation', 'isolate')) {
        this.element.style.isolation = 'isolate';
      }
    } catch (error) {
      // CSS.supports not available, skip
    }
    
    // Create stacking context to isolate z-index
    if (this.element.style.position !== 'static') {
      this.element.style.zIndex = this.element.style.zIndex || '0';
    }
    
    // Add scope-specific CSS custom properties for theming isolation
    this.element.style.setProperty('--component-scope', componentScope);
    this.element.style.setProperty('--component-name', this.componentName.toLowerCase());
  }

  /**
   * Generate a hash for CSS modules-style class names
   * @private
   * @param {string} input - Input string to hash
   * @returns {string} - Generated hash
   */
  generateHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substr(0, 6);
  }

  /**
   * Count elements that have been scoped
   * @private
   * @returns {number} - Number of scoped elements
   */
  countScopedElements() {
    if (!this.element) return 0;
    
    const scopedElements = this.element.querySelectorAll('[data-css-scoped="true"]');
    return scopedElements.length + (this.element.hasAttribute('data-css-scoped') ? 1 : 0);
  }

  /**
   * Get comprehensive CSS scoping statistics
   * @returns {Object} - Scoping statistics and performance metrics
   */
  getScopingStats() {
    if (!this.scopingStats) {
      return {
        scoped: false,
        message: 'CSS scoping has not been applied to this component'
      };
    }
    
    return {
      scoped: true,
      strategy: this.scopingStats.strategy,
      componentScope: this.scopingStats.componentScope,
      scopingTime: this.scopingStats.scopingTime,
      elementsScoped: this.scopingStats.elementsScoped,
      timestamp: this.scopingStats.timestamp,
      
      // Performance indicators
      performance: {
        scopingTimeUnderThreshold: this.scopingStats.scopingTime < 10, // Target: <10ms
        elementsProcessed: this.scopingStats.elementsScoped,
        averageTimePerElement: this.scopingStats.elementsScoped > 0 
          ? (this.scopingStats.scopingTime / this.scopingStats.elementsScoped).toFixed(2)
          : 0
      },
      
      // Validation
      validation: this.validateScoping()
    };
  }

  /**
   * Validate that CSS scoping is working correctly
   * @private
   * @returns {Object} - Validation results
   */
  validateScoping() {
    if (!this.element) {
      return { valid: false, reason: 'Component element not found' };
    }
    
    const hasScope = this.element.hasAttribute('data-css-scoped');
    const hasScopeId = this.element.hasAttribute('data-css-scope-id');
    const hasStrategy = this.element.hasAttribute('data-css-scope-strategy');
    
    const validation = {
      valid: hasScope && hasScopeId && hasStrategy,
      attributes: {
        hasScope,
        hasScopeId,
        hasStrategy
      },
      scopeId: this.element.getAttribute('data-css-scope-id'),
      strategy: this.element.getAttribute('data-css-scope-strategy')
    };
    
    if (!validation.valid) {
      validation.reason = 'Missing required scoping attributes';
    }
    
    return validation;
  }

  /**
   * Remove CSS scoping from component
   * @param {Object} options - Removal options
   * @param {boolean} options.preserveCustomClasses - Keep custom classes added during scoping
   * @returns {boolean} - True if scoping was removed successfully
   */
  removeScopedStyles(options = {}) {
    if (!this.element || !this.componentScope) {
      return false;
    }
    
    const { preserveCustomClasses = false } = options;
    
    try {
      // Remove scoping classes
      if (!preserveCustomClasses) {
        this.element.classList.remove(this.componentScope);
        this.element.classList.remove(`component-${this.componentName.toLowerCase()}`);
      }
      
      // Remove scoping attributes
      const scopingAttributes = [
        'data-css-scoped',
        'data-css-scope-strategy', 
        'data-css-scope-id',
        'data-css-scope-timestamp',
        'data-component-scope',
        'data-component-type',
        'data-component-instance',
        'data-component-scoped-name',
        'data-component-scoped-version'
      ];
      
      scopingAttributes.forEach(attr => {
        this.element.removeAttribute(attr);
      });
      
      // Remove custom CSS properties
      this.element.style.removeProperty('--component-scope');
      this.element.style.removeProperty('--component-name');
      
      // Clean up CSS containment and isolation
      this.element.style.removeProperty('contain');
      this.element.style.removeProperty('isolation');
      
      // Clean up shadow DOM if used
      if (this.shadowRoot) {
        // Move content back to main element
        const shadowContent = this.shadowRoot.innerHTML;
        this.element.innerHTML = shadowContent;
        this.shadowRoot = null;
      }
      
      // Clear scoping data
      this.componentScope = null;
      this.scopingStats = null;
      this.classMappings = null;
      
      this.log('debug', `CSS scoping removed from ${this.componentName}`);
      
      // Emit removal event
      this.emit('css-scoping-removed', {
        componentName: this.componentName,
        options
      });
      
      return true;
      
    } catch (error) {
      this.log('error', `Failed to remove CSS scoping from ${this.componentName}:`, error);
      return false;
    }
  }

  /**
   * Clean up injected CSS
   * @private
   */
  cleanupCSS() {
    // For now, we don't remove CSS as other components might be using it
    // In a more sophisticated system, we'd track usage counts
    this.cssInjected.clear();
  }


  /**
   * Create element helper
   */
  static createElement(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.className) {
      element.className = options.className;
    }

    if (options.innerHTML) {
      element.innerHTML = options.innerHTML;
    }

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    return element;
  }
}

// Export ES module
export default BaseComponent;

// Also make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.BaseComponentV2 = BaseComponent;
}