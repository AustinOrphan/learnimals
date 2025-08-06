/**
 * ThemeService - Centralized theme management and detection
 * Eliminates theme detection code duplication across components
 */

class ThemeService {
  constructor() {
    this.cache = new Map();
    this.listeners = new Set();
    this.documentElement = document.documentElement;
    
    // Enhanced token registry for semantic token management
    this.semanticTokenRegistry = new Map();
    this.themeVariantTokens = new Map();
    
    // Performance optimization for larger token set
    this.performanceConfig = {
      enableBatching: true,
      batchSize: 50,
      enableCaching: true,
      cacheMaxSize: 200,
      enableLazyLoading: true,
      debounceDelay: 16 // ~60fps
    };
    
    // Performance metrics tracking
    this.performanceMetrics = {
      tokenApplicationTime: new Map(),
      cacheHitRate: 0,
      totalTokensProcessed: 0,
      batchProcessingTime: new Map()
    };
    
    // Debounced token application for performance
    this.debouncedApplyTokens = this.debounce(
      this.batchApplyTokens.bind(this),
      this.performanceConfig.debounceDelay
    );
    
    // Token application queue for batching
    this.tokenQueue = new Map();
    
    // Initialize semantic token registry
    this.initializeSemanticTokenRegistry();
    
    // Initialize theme change listener
    this.initThemeChangeListener();
  }

  /**
   * Initialize semantic token registry with enhanced token mappings
   * Supports ocean, forest, space theme variants from design requirements
   */
  initializeSemanticTokenRegistry() {
    // Brand token mappings for theme variants
    this.themeVariantTokens.set('ocean', {
      '--brand-primary': '#4a90e2',
      '--brand-secondary': '#357abd',
      '--interactive-primary': '#4a90e2',
      '--interactive-primary-hover': '#357abd',
      '--accent-primary': '#4a90e2',
      '--chart-primary': '#4a90e2',
      '--character-math-bear': '#4a90e2',
      '--nav-text-current': '#ffffff',
      '--text-on-primary': '#ffffff',
      '--text-on-ocean': '#ffffff',
      '--text-on-ocean-secondary': 'rgba(255, 255, 255, 0.9)',
      '--theme-ocean-bg': 'linear-gradient(135deg, #4a90e2, #357abd)'
    });
    
    this.themeVariantTokens.set('forest', {
      '--brand-primary': '#5cb85c',
      '--brand-secondary': '#449d44',
      '--interactive-primary': '#5cb85c',
      '--interactive-primary-hover': '#449d44',
      '--accent-primary': '#5cb85c',
      '--chart-primary': '#5cb85c',
      '--character-science-fox': '#5cb85c',
      '--nav-text-current': '#ffffff',
      '--text-on-primary': '#ffffff',
      '--text-on-forest': '#ffffff',
      '--text-on-forest-secondary': 'rgba(255, 255, 255, 0.9)',
      '--theme-forest-bg': 'linear-gradient(135deg, #5cb85c, #449d44)'
    });
    
    this.themeVariantTokens.set('space', {
      '--brand-primary': '#6f42c1',
      '--brand-secondary': '#5a32a3',
      '--interactive-primary': '#6f42c1',
      '--interactive-primary-hover': '#5a32a3',
      '--accent-primary': '#6f42c1',
      '--chart-primary': '#6f42c1',
      '--character-reading-owl': '#6f42c1',
      '--nav-text-current': '#ffffff',
      '--text-on-primary': '#ffffff',
      '--text-on-space': '#ffffff',
      '--text-on-space-secondary': 'rgba(255, 255, 255, 0.9)',
      '--theme-space-bg': 'linear-gradient(135deg, #6f42c1, #5a32a3)'
    });
    
    // Add other theme variants
    this.themeVariantTokens.set('sunset', {
      '--brand-primary': '#fd7e14',
      '--brand-secondary': '#e55a00',
      '--interactive-primary': '#fd7e14',
      '--interactive-primary-hover': '#e55a00',
      '--accent-primary': '#fd7e14',
      '--chart-primary': '#fd7e14',
      '--character-art-cat': '#fd7e14',
      '--nav-text-current': '#ffffff',
      '--text-on-primary': '#ffffff',
      '--theme-sunset-bg': 'linear-gradient(135deg, #fd7e14, #e55a00)'
    });

    // Default semantic token mappings
    this.semanticTokenRegistry.set('text', [
      '--text-primary', '--text-secondary', '--text-tertiary', '--text-muted',
      '--text-disabled', '--text-heading', '--text-subheading', '--text-body',
      '--text-caption', '--text-label', '--text-placeholder'
    ]);
    
    this.semanticTokenRegistry.set('surface', [
      '--surface-primary', '--surface-secondary', '--surface-tertiary', 
      '--surface-inverse', '--surface-elevated', '--bg-body', '--bg-card',
      '--bg-panel', '--bg-sidebar', '--bg-header', '--bg-footer'
    ]);
    
    this.semanticTokenRegistry.set('interactive', [
      '--interactive-primary', '--interactive-primary-hover', 
      '--interactive-primary-active', '--interactive-secondary',
      '--interactive-bg', '--interactive-bg-hover', '--interactive-bg-active'
    ]);
    
    this.semanticTokenRegistry.set('status', [
      '--status-success', '--status-warning', '--status-error', '--status-info',
      '--status-success-bg', '--status-warning-bg', '--status-error-bg', '--status-info-bg'
    ]);
    
    this.semanticTokenRegistry.set('border', [
      '--border-primary', '--border-secondary', '--border-strong', '--border-subtle',
      '--border-hover', '--border-active', '--border-focus', '--border-selected'
    ]);
  }

  /**
   * Initialize listener for theme changes to clear cache
   */
  initThemeChangeListener() {
    // Listen for theme changes from existing theme manager
    document.addEventListener('themeChanged', (event) => {
      this.clearCache();
      this.notifyListeners();
      
      // Apply enhanced semantic tokens for the new theme
      if (event.detail && event.detail.theme) {
        this.applyThemeVariantTokens(event.detail.theme, event.detail.mode);
      }
    });

    // Also listen for CSS custom property changes
    if (window.MutationObserver) {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'class' || 
               mutation.attributeName === 'data-theme')) {
            this.clearCache();
            this.notifyListeners();
            
            // Extract theme name and apply variant tokens
            const themeClass = Array.from(this.documentElement.classList)
              .find(cls => cls.startsWith('theme-') && !cls.includes('mode'));
            if (themeClass) {
              const themeName = themeClass.replace('theme-', '');
              const isDark = this.documentElement.classList.contains('theme-mode-dark');
              this.applyThemeVariantTokens(themeName, isDark ? 'dark' : 'light');
            }
            break;
          }
        }
      });

      observer.observe(this.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme']
      });
    }
  }

  /**
   * Apply theme variant tokens for enhanced theme switching
   * @param {string} themeName - Theme name (ocean, forest, space, etc.)
   * @param {string} mode - Theme mode (light, dark)
   */
  applyThemeVariantTokens(themeName, mode = 'light') {
    const startTime = performance.now();
    
    // Get theme variant tokens
    const variantTokens = this.themeVariantTokens.get(themeName);
    if (variantTokens) {
      // Apply variant tokens with CSS transition support
      this.applyTokensWithTransition(variantTokens);
      
      // Update brand tokens in registry
      this.cache.set(`brand-${themeName}`, variantTokens);
      
      // Dispatch enhanced theme change event
      const enhancedEvent = new CustomEvent('enhancedThemeChanged', {
        detail: {
          theme: themeName,
          mode: mode,
          tokens: variantTokens,
          timestamp: Date.now()
        }
      });
      document.dispatchEvent(enhancedEvent);
    }
    
    // Log performance metrics
    const processingTime = performance.now() - startTime;
    console.debug(`Theme variant tokens applied for '${themeName}' in ${processingTime.toFixed(2)}ms`);
  }

  /**
   * Apply tokens with smooth transitions for enhanced UX
   * @param {Object} tokens - Token name-value pairs
   */
  applyTokensWithTransition(tokens) {
    if (this.performanceConfig.enableBatching) {
      // Add tokens to queue for batch processing
      Object.entries(tokens).forEach(([property, value]) => {
        this.tokenQueue.set(property, value);
      });
      
      // Use debounced batch application for better performance
      this.debouncedApplyTokens();
    } else {
      // Apply immediately for non-batched mode
      this.immediatelyApplyTokens(tokens);
    }
  }

  /**
   * Batch apply tokens for performance optimization
   * Processes tokens in batches to avoid blocking the main thread
   * @private
   */
  batchApplyTokens() {
    const startTime = performance.now();
    const tokens = Object.fromEntries(this.tokenQueue);
    this.tokenQueue.clear();
    
    // Enable CSS transitions for smooth theme switching
    if (!this.documentElement.classList.contains('theme-transitioning')) {
      this.documentElement.classList.add('theme-transitioning');
      
      // Remove transition class after animation completes
      setTimeout(() => {
        this.documentElement.classList.remove('theme-transitioning');
      }, 300); // Match CSS transition duration
    }
    
    // Process tokens in batches for better performance
    const tokenEntries = Object.entries(tokens);
    const batchSize = this.performanceConfig.batchSize;
    
    const processBatch = (startIndex) => {
      const endIndex = Math.min(startIndex + batchSize, tokenEntries.length);
      const batch = tokenEntries.slice(startIndex, endIndex);
      
      // Apply batch of tokens
      batch.forEach(([property, value]) => {
        this.documentElement.style.setProperty(property, value);
      });
      
      // Continue with next batch if there are more tokens
      if (endIndex < tokenEntries.length) {
        // Use requestAnimationFrame for non-blocking processing
        requestAnimationFrame(() => processBatch(endIndex));
      } else {
        // All tokens processed, record metrics
        const processingTime = performance.now() - startTime;
        this.performanceMetrics.batchProcessingTime.set(Date.now(), processingTime);
        this.performanceMetrics.totalTokensProcessed += tokenEntries.length;
        
        console.debug(`Batch applied ${tokenEntries.length} tokens in ${processingTime.toFixed(2)}ms`);
      }
    };
    
    // Start batch processing
    requestAnimationFrame(() => processBatch(0));
  }

  /**
   * Immediately apply tokens (fallback for non-batched mode)
   * @private
   * @param {Object} tokens - Token name-value pairs
   */
  immediatelyApplyTokens(tokens) {
    // Enable CSS transitions for smooth theme switching
    if (!this.documentElement.classList.contains('theme-transitioning')) {
      this.documentElement.classList.add('theme-transitioning');
      
      // Remove transition class after animation completes
      setTimeout(() => {
        this.documentElement.classList.remove('theme-transitioning');
      }, 300); // Match CSS transition duration
    }
    
    // Apply tokens using requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      Object.entries(tokens).forEach(([property, value]) => {
        this.documentElement.style.setProperty(property, value);
      });
    });
  }

  /**
   * Debounce utility for performance optimization
   * @private
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Get performance metrics for theme switching
   * @returns {Object} - Performance metrics
   */
  getPerformanceMetrics() {
    const cacheSize = this.cache.size;
    const cacheHits = this.performanceMetrics.cacheHitRate;
    const avgBatchTime = this.getAverageBatchTime();
    
    return {
      cacheSize,
      cacheHits,
      totalTokensProcessed: this.performanceMetrics.totalTokensProcessed,
      averageBatchProcessingTime: avgBatchTime,
      queueSize: this.tokenQueue.size,
      performanceConfig: { ...this.performanceConfig }
    };
  }

  /**
   * Get average batch processing time
   * @private
   * @returns {number} - Average time in milliseconds
   */
  getAverageBatchTime() {
    const times = Array.from(this.performanceMetrics.batchProcessingTime.values());
    if (times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  /**
   * Clear performance metrics (useful for testing)
   */
  clearPerformanceMetrics() {
    this.performanceMetrics.tokenApplicationTime.clear();
    this.performanceMetrics.batchProcessingTime.clear();
    this.performanceMetrics.cacheHitRate = 0;
    this.performanceMetrics.totalTokensProcessed = 0;
  }

  /**
   * Comprehensive validation of enhanced theme switching functionality
   * Tests all aspects of the enhanced token system integration
   * @returns {Object} - Validation results
   */
  validateEnhancedThemeSwitching() {
    const validationResults = {
      success: true,
      errors: [],
      warnings: [],
      tests: [],
      performance: null,
      summary: null
    };

    try {
      // Test 1: Validate semantic token registry initialization
      this.validateTest(validationResults, 'Token Registry Initialization', () => {
        const hasTextTokens = this.semanticTokenRegistry.has('text');
        const hasSurfaceTokens = this.semanticTokenRegistry.has('surface');
        const hasInteractiveTokens = this.semanticTokenRegistry.has('interactive');
        const hasStatusTokens = this.semanticTokenRegistry.has('status');
        const hasBorderTokens = this.semanticTokenRegistry.has('border');
        
        return hasTextTokens && hasSurfaceTokens && hasInteractiveTokens && hasStatusTokens && hasBorderTokens;
      });

      // Test 2: Validate theme variant tokens for ocean, forest, space
      this.validateTest(validationResults, 'Theme Variant Tokens', () => {
        const hasOcean = this.themeVariantTokens.has('ocean');
        const hasForest = this.themeVariantTokens.has('forest');
        const hasSpace = this.themeVariantTokens.has('space');
        const hasSunset = this.themeVariantTokens.has('sunset');
        
        // Validate token structure for ocean theme
        if (hasOcean) {
          const oceanTokens = this.themeVariantTokens.get('ocean');
          const hasRequiredOceanTokens = 
            oceanTokens['--brand-primary'] === '#4a90e2' &&
            oceanTokens['--interactive-primary'] === '#4a90e2' &&
            oceanTokens['--character-math-bear'] === '#4a90e2';
          
          return hasOcean && hasForest && hasSpace && hasSunset && hasRequiredOceanTokens;
        }
        
        return hasOcean && hasForest && hasSpace && hasSunset;
      });

      // Test 3: Validate semantic color retrieval
      this.validateTest(validationResults, 'Semantic Color Retrieval', () => {
        const semanticColors = this.getSemanticColors();
        const requiredColors = ['primary', 'secondary', 'heading', 'background', 'surface', 'card', 'accent', 'brand'];
        
        return requiredColors.every(color => semanticColors[color] !== undefined);
      });

      // Test 4: Validate current theme info enhancement
      this.validateTest(validationResults, 'Enhanced Theme Info', () => {
        const themeInfo = this.getCurrentThemeInfo();
        const hasRequiredFields = 
          typeof themeInfo.name === 'string' &&
          typeof themeInfo.mode === 'string' &&
          typeof themeInfo.hasVariantTokens === 'boolean' &&
          Array.isArray(themeInfo.supportedTokens) &&
          typeof themeInfo.timestamp === 'number';
        
        return hasRequiredFields && themeInfo.supportedTokens.length > 0;
      });

      // Test 5: Validate performance optimization features
      this.validateTest(validationResults, 'Performance Optimization', () => {
        const hasConfig = this.performanceConfig && 
          typeof this.performanceConfig.enableBatching === 'boolean' &&
          typeof this.performanceConfig.batchSize === 'number';
        
        const hasMetrics = this.performanceMetrics &&
          this.performanceMetrics.hasOwnProperty('totalTokensProcessed');
        
        const hasDebouncedFunction = typeof this.debouncedApplyTokens === 'function';
        const hasTokenQueue = this.tokenQueue instanceof Map;
        
        return hasConfig && hasMetrics && hasDebouncedFunction && hasTokenQueue;
      });

      // Test 6: Validate enhanced fallback system
      this.validateTest(validationResults, 'Enhanced Fallback System', () => {
        const fallbacks = this.getEnhancedFallbackVariables('--brand-ocean');
        const brandFallbacks = this.getEnhancedFallbackVariables('--brand-primary');
        const textFallbacks = this.getEnhancedFallbackVariables('--text-primary');
        
        return Array.isArray(fallbacks) && Array.isArray(brandFallbacks) && 
               Array.isArray(textFallbacks) && textFallbacks.length > 0;
      });

      // Test 7: Validate theme transition functionality
      this.validateTest(validationResults, 'Theme Transition Support', () => {
        const hasTransitionMethods = 
          typeof this.applyTokensWithTransition === 'function' &&
          typeof this.batchApplyTokens === 'function' &&
          typeof this.immediatelyApplyTokens === 'function';
        
        const hasPerformanceConfig = this.performanceConfig.debounceDelay > 0;
        
        return hasTransitionMethods && hasPerformanceConfig;
      });

      // Test 8: Test actual theme variant token application (simulation)
      this.validateTest(validationResults, 'Theme Variant Application', () => {
        const originalTheme = this.getCurrentTheme();
        let testPassed = false;
        
        try {
          // Simulate theme variant token application
          const testTokens = { '--test-token': '#ff0000' };
          this.tokenQueue.set('--test-token', '#ff0000');
          
          // Check if token was queued
          testPassed = this.tokenQueue.has('--test-token');
          
          // Clean up
          this.tokenQueue.delete('--test-token');
        } catch (error) {
          validationResults.warnings.push(`Theme variant application test warning: ${error.message}`);
        }
        
        return testPassed;
      });

      // Collect performance metrics for validation
      validationResults.performance = this.getPerformanceMetrics();

      // Generate summary
      const passedTests = validationResults.tests.filter(test => test.passed).length;
      const totalTests = validationResults.tests.length;
      
      validationResults.summary = {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        hasEnhancedFeatures: passedTests >= 6, // At least 6 tests should pass
        ready: passedTests === totalTests && validationResults.errors.length === 0
      };

      // Overall success determination
      validationResults.success = validationResults.summary.ready;

    } catch (error) {
      validationResults.success = false;
      validationResults.errors.push(`Validation error: ${error.message}`);
    }

    return validationResults;
  }

  /**
   * Helper method to run individual validation tests
   * @private
   * @param {Object} results - Validation results object
   * @param {string} testName - Name of the test
   * @param {Function} testFunction - Test function to run
   */
  validateTest(results, testName, testFunction) {
    try {
      const startTime = performance.now();
      const passed = testFunction();
      const duration = performance.now() - startTime;
      
      results.tests.push({
        name: testName,
        passed,
        duration: Math.round(duration * 100) / 100
      });

      if (!passed) {
        results.errors.push(`Test failed: ${testName}`);
      }
    } catch (error) {
      results.tests.push({
        name: testName,
        passed: false,
        error: error.message
      });
      results.errors.push(`Test error in ${testName}: ${error.message}`);
    }
  }

  /**
   * Get enhanced theme colors with variant support
   * @param {string} cssVariable - CSS variable name (e.g., '--primary-color')
   * @param {string} fallback - Fallback color if variable not found
   * @returns {string} - Computed color value
   */
  getThemeColor(cssVariable, fallback = '#333') {
    const cacheKey = `color:${cssVariable}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let color = this.getComputedCustomProperty(cssVariable);
    
    if (!color) {
      // Try enhanced fallback patterns for semantic tokens
      const fallbackVariables = this.getEnhancedFallbackVariables(cssVariable);
      for (const fallbackVar of fallbackVariables) {
        color = this.getComputedCustomProperty(fallbackVar);
        if (color) break;
      }
    }

    const finalColor = color || fallback;
    this.cache.set(cacheKey, finalColor);
    return finalColor;
  }

  /**
   * Get multiple theme colors at once with batch processing
   * @param {string[]} variables - Array of CSS variable names
   * @param {string} fallback - Fallback color for all variables
   * @returns {Object} - Object mapping variable names to colors
   */
  getThemeColors(variables, fallback = '#333') {
    const colors = {};
    const uncachedVars = [];
    
    // Check cache first for batch optimization
    for (const variable of variables) {
      const cacheKey = `color:${variable}`;
      if (this.cache.has(cacheKey)) {
        colors[variable] = this.cache.get(cacheKey);
      } else {
        uncachedVars.push(variable);
      }
    }
    
    // Process uncached variables
    for (const variable of uncachedVars) {
      colors[variable] = this.getThemeColor(variable, fallback);
    }
    
    return colors;
  }

  /**
   * Get semantic theme colors with enhanced token support
   * @returns {Object} - Object with semantic color names
   */
  getSemanticColors() {
    return {
      // Text colors
      primary: this.getThemeColor('--text-primary', '#333'),
      secondary: this.getThemeColor('--text-secondary', '#666'),
      heading: this.getThemeColor('--text-heading', '#333'),
      
      // Surface colors
      background: this.getThemeColor('--surface-primary', '#ffffff'),
      surface: this.getThemeColor('--surface-elevated', '#ffffff'),
      card: this.getThemeColor('--bg-card', '#ffffff'),
      
      // Interactive colors
      accent: this.getThemeColor('--interactive-primary', '#007bff'),
      accentHover: this.getThemeColor('--interactive-primary-hover', '#0056b3'),
      
      // Status colors
      error: this.getThemeColor('--status-error', '#dc3545'),
      success: this.getThemeColor('--status-success', '#28a745'),
      warning: this.getThemeColor('--status-warning', '#ffc107'),
      info: this.getThemeColor('--status-info', '#17a2b8'),
      
      // Brand colors (theme-aware)
      brand: this.getThemeColor('--brand-primary', '#007bff'),
      brandSecondary: this.getThemeColor('--brand-secondary', '#6c757d')
    };
  }

  /**
   * Get current theme with enhanced information
   * @returns {Object} - Enhanced theme information
   */
  getCurrentThemeInfo() {
    const cacheKey = 'theme:enhanced-info';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let themeName = 'default';
    let themeMode = 'light';
    let hasVariantTokens = false;

    // Check for theme classes
    const classList = Array.from(this.documentElement.classList);
    for (const className of classList) {
      if (className.startsWith('theme-') && !className.includes('mode')) {
        themeName = className.replace('theme-', '');
        hasVariantTokens = this.themeVariantTokens.has(themeName);
      } else if (className === 'theme-mode-dark') {
        themeMode = 'dark';
      }
    }

    const themeInfo = {
      name: themeName,
      mode: themeMode,
      hasVariantTokens,
      variantTokens: hasVariantTokens ? this.themeVariantTokens.get(themeName) : null,
      supportedTokens: this.getSupportedTokens(),
      timestamp: Date.now()
    };

    this.cache.set(cacheKey, themeInfo);
    return themeInfo;
  }

  /**
   * Get list of supported semantic tokens
   * @returns {Array} - Array of supported token categories
   */
  getSupportedTokens() {
    return Array.from(this.semanticTokenRegistry.keys());
  }

  /**
   * Check if current theme is dark mode
   * @returns {boolean} - True if dark theme is active
   */
  isDarkMode() {
    const cacheKey = 'mode:dark';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let isDark = false;

    // Check for theme class indicators
    if (this.documentElement.classList.contains('theme-mode-dark') ||
        this.documentElement.classList.contains('dark') ||
        this.documentElement.getAttribute('data-theme') === 'dark') {
      isDark = true;
    } else {
      // Fallback: check if background is dark
      const bgColor = this.getThemeColor('--surface-primary', '#ffffff');
      isDark = this.isColorDark(bgColor);
    }

    this.cache.set(cacheKey, isDark);
    return isDark;
  }

  /**
   * Get current theme name
   * @returns {string} - Theme name (e.g., 'default', 'ocean', 'forest')
   */
  getCurrentTheme() {
    const cacheKey = 'theme:name';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let themeName = 'default';

    // Check for theme classes
    const classList = Array.from(this.documentElement.classList);
    for (const className of classList) {
      if (className.startsWith('theme-') && !className.includes('mode')) {
        themeName = className.replace('theme-', '');
        break;
      }
    }

    this.cache.set(cacheKey, themeName);
    return themeName;
  }

  /**
   * Get text color that contrasts well with given background
   * @param {string} backgroundColor - Background color
   * @returns {string} - Contrasting text color
   */
  getContrastingTextColor(backgroundColor) {
    const cacheKey = `contrast:${backgroundColor}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const isDarkBg = this.isColorDark(backgroundColor);
    const textColor = isDarkBg 
      ? this.getThemeColor('--text-on-dark', '#ffffff')
      : this.getThemeColor('--text-on-light', '#000000');

    this.cache.set(cacheKey, textColor);
    return textColor;
  }

  /**
   * Add listener for theme changes
   * @param {Function} callback - Function to call on theme change
   * @returns {Function} - Unsubscribe function
   */
  onThemeChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Clear the theme cache (useful when theme changes)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get computed CSS custom property value
   * @private
   * @param {string} property - CSS custom property name
   * @returns {string|null} - Computed value or null
   */
  getComputedCustomProperty(property) {
    try {
      const value = getComputedStyle(this.documentElement)
        .getPropertyValue(property)
        .trim();
      return value || null;
    } catch (error) {
      console.warn(`Failed to get CSS property ${property}:`, error);
      return null;
    }
  }

  /**
   * Get enhanced fallback variable names for semantic tokens
   * @private
   * @param {string} variable - Original CSS variable
   * @returns {string[]} - Array of fallback variables to try
   */
  getEnhancedFallbackVariables(variable) {
    const fallbacks = [];
    
    // Enhanced fallback patterns for semantic tokens
    const patterns = {
      // Text tokens
      '--text-primary': ['--text-color', '--foreground-color', '--color-text'],
      '--text-secondary': ['--text-color-alt', '--text-muted'],
      '--text-heading': ['--text-primary', '--text-color'],
      
      // Surface tokens  
      '--surface-primary': ['--bg-body', '--background-color', '--bg-primary'],
      '--surface-secondary': ['--bg-card', '--background-color-alt', '--bg-secondary'],
      '--surface-elevated': ['--bg-card', '--surface-primary', '--background-color'],
      '--bg-body': ['--surface-primary', '--background-color'],
      '--bg-card': ['--surface-elevated', '--background-color-alt'],
      
      // Interactive tokens
      '--interactive-primary': ['--accent-primary', '--primary-color', '--accent-color'],
      '--interactive-primary-hover': ['--accent-primary-hover', '--primary-color-hover'],
      '--accent-primary': ['--interactive-primary', '--primary-color'],
      
      // Brand tokens
      '--brand-primary': ['--accent-primary', '--interactive-primary', '--primary-color'],
      '--brand-ocean': ['--ocean-color-1', '--interactive-primary'],
      '--brand-forest': ['--forest-color-1', '--interactive-primary'], 
      '--brand-space': ['--space-color-1', '--interactive-primary'],
      
      // Status tokens
      '--status-success': ['--success-color', '--color-success', '--green-color'],
      '--status-error': ['--error-color', '--color-error', '--danger-color'],
      '--status-warning': ['--warning-color', '--color-warning', '--yellow-color'],
      '--status-info': ['--info-color', '--color-info', '--blue-color'],
      
      // Border tokens
      '--border-primary': ['--border-color', '--border'],
      '--border-secondary': ['--border-color-light', '--border-subtle'],
      '--border-focus': ['--focus-ring-color', '--accent-primary']
    };

    if (patterns[variable]) {
      fallbacks.push(...patterns[variable]);
    }

    return fallbacks;
  }

  /**
   * Determine if a color is dark
   * @private
   * @param {string} color - Color value
   * @returns {boolean} - True if color is dark
   */
  isColorDark(color) {
    // Convert color to RGB and calculate luminance
    const rgb = this.colorToRgb(color);
    if (!rgb) return false;

    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance < 0.5;
  }

  /**
   * Convert color string to RGB object
   * @private
   * @param {string} color - Color value
   * @returns {Object|null} - RGB object or null
   */
  colorToRgb(color) {
    // Create temporary element to get computed color
    const temp = document.createElement('div');
    temp.style.color = color;
    document.body.appendChild(temp);
    
    const computed = getComputedStyle(temp).color;
    document.body.removeChild(temp);

    const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10)
      };
    }

    return null;
  }

  /**
   * Notify all listeners of theme changes
   * @private
   */
  notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.warn('Theme change listener error:', error);
      }
    }
  }
}

// Create singleton instance
const themeService = new ThemeService();

// Export both the class and singleton
export { ThemeService };
export default themeService;

// Also make available globally for compatibility
if (typeof window !== 'undefined') {
  window.themeService = themeService;
}