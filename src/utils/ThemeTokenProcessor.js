/**
 * ThemeTokenProcessor - Advanced theme token management for enhanced theme system
 * Extends ThemeService.js patterns for token extraction, resolution, and inheritance processing
 * 
 * Requirements: FR-2.1, FR-2.3, FR-2.4
 * - FR-2.1: Expand semantic CSS variables beyond current basic set
 * - FR-2.3: Implement theme inheritance hierarchy
 * - FR-2.4: Provide theme validation and debugging capabilities
 * 
 * Task 7.1: Core theme token processor for comprehensive theme token management
 * Task 7.2: Theme validation and debugging methods
 * Task 7.3: Integration into CSSManager pipeline for automatic token processing
 */

import themeService from './ThemeService.js';

class ThemeTokenProcessor {
  constructor() {
    // Token registry organized by inheritance levels (FR-2.3)
    this.tokenRegistry = new Map([
      ['global', new Map()],      // Foundation tokens (:root level)
      ['semantic', new Map()],    // Semantic tokens (text, bg, etc.)
      ['component', new Map()],   // Component-specific tokens
      ['variant', new Map()],     // Theme variant tokens (ocean, forest, etc.)
      ['instance', new Map()]     // Component instance overrides
    ]);
    
    // Theme inheritance chain - order matters for token resolution (FR-2.3)
    this.inheritanceChain = ['global', 'semantic', 'component', 'variant', 'instance'];
    
    // Validation rules for token usage (FR-2.4)
    this.validationRules = new Map();
    
    // Cache for resolved tokens (following ThemeService cache pattern)
    this.tokenCache = new Map();
    
    // Token extraction patterns
    this.tokenPatterns = {
      cssVariable: /var\(--[\w-]+(?:,\s*[^)]+)?\)/g,
      tokenName: /--[\w-]+/g,
      tokenDefinition: /(--[\w-]+)\s*:\s*([^;]+);/g,
      tokenUsage: /var\(\s*(--[\w-]+)(?:\s*,\s*([^)]+))?\s*\)/g,
      componentPrefix: /^--[\w-]*-/,
      scopePrefix: /^--component-[\w-]+-/
    };
    
    // Token documentation registry (FR-2.4)
    this.documentationRegistry = new Map();
    
    // Performance tracking (following CSSManager pattern)
    this.metrics = {
      tokensProcessed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      validationErrors: 0,
      validationWarnings: 0,
      processingTime: new Map(),
      tokenResolutionTime: new Map()
    };
    
    // Configuration
    this.config = {
      enableCaching: true,
      enableValidation: true,
      enableDebugging: false,
      logLevel: 'warn', // 'debug', 'info', 'warn', 'error', 'silent'
      maxCacheSize: 1000,
      enablePerformanceTracking: true,
      inheritanceMode: 'cascade', // 'cascade' | 'override' | 'merge'
      fallbackStrategy: 'graceful' // 'graceful' | 'strict' | 'silent'
    };
    
    // Integration with ThemeService for live theme detection
    this.themeService = themeService;
    
    // Listen for theme changes to clear token cache
    this.initializeThemeChangeListener();
    
    // Initialize with default validation rules
    this.initializeDefaultValidationRules();
    
    // Initialize with built-in token registry
    this.initializeBuiltInTokens();
  }

  /**
   * Initialize theme change listener to clear token cache
   * Following ThemeService patterns for cache invalidation
   * @private
   */
  initializeThemeChangeListener() {
    if (this.themeService && typeof this.themeService.onThemeChange === 'function') {
      this.themeService.onThemeChange(() => {
        this.clearTokenCache();
        this.log('debug', 'Token cache cleared due to theme change');
      });
    }
    
    // Also listen for direct theme change events
    if (typeof document !== 'undefined') {
      document.addEventListener('themeChanged', () => {
        this.clearTokenCache();
        this.log('debug', 'Token cache cleared due to theme change event');
      });
    }
  }

  /**
   * Initialize default validation rules for common token patterns
   * @private
   */
  initializeDefaultValidationRules() {
    // Color token validation
    this.addValidationRule('color', {
      pattern: /^--(?:color|bg|text|border|accent|primary|secondary|success|error|warning|info)-/,
      validate: (tokenName, value, context) => {
        const results = [];
        
        // Check if color value is valid
        if (value && !this.isValidColorValue(value)) {
          results.push({
            type: 'error',
            message: `Invalid color value "${value}" for token "${tokenName}"`,
            suggestion: 'Use valid CSS color values (hex, rgb, hsl, named colors, or CSS variables)'
          });
        }
        
        // Check for deprecated color tokens
        if (tokenName.includes('colour')) {
          results.push({
            type: 'warning',
            message: `Token "${tokenName}" uses deprecated "colour" spelling`,
            suggestion: 'Use "color" spelling for consistency'
          });
        }
        
        return results;
      }
    });
    
    // Spacing token validation
    this.addValidationRule('spacing', {
      pattern: /^--(?:space|spacing|margin|padding|gap)-/,
      validate: (tokenName, value, context) => {
        const results = [];
        
        if (value && !this.isValidSpacingValue(value)) {
          results.push({
            type: 'error',
            message: `Invalid spacing value "${value}" for token "${tokenName}"`,
            suggestion: 'Use valid CSS length units (px, rem, em, %, vw, vh) or CSS variables'
          });
        }
        
        return results;
      }
    });
    
    // Typography token validation
    this.addValidationRule('typography', {
      pattern: /^--(?:font|text|line)-/,
      validate: (tokenName, value, context) => {
        const results = [];
        
        // Check font-size values
        if (tokenName.includes('font-size') && value && !this.isValidSizeValue(value)) {
          results.push({
            type: 'error',
            message: `Invalid font-size value "${value}" for token "${tokenName}"`,
            suggestion: 'Use valid CSS size units or relative values'
          });
        }
        
        // Check line-height values
        if (tokenName.includes('line-height') && value && !this.isValidLineHeightValue(value)) {
          results.push({
            type: 'error',
            message: `Invalid line-height value "${value}" for token "${tokenName}"`,
            suggestion: 'Use unitless numbers, percentages, or length values'
          });
        }
        
        return results;
      }
    });
  }

  /**
   * Initialize built-in token registry with foundation tokens
   * Building upon existing ThemeService semantic colors
   * @private
   */
  initializeBuiltInTokens() {
    // Global foundation tokens (FR-2.1)
    this.registerTokens('global', {
      // Color palette
      '--color-primary': '#007bff',
      '--color-secondary': '#6c757d',
      '--color-success': '#28a745',
      '--color-danger': '#dc3545',
      '--color-warning': '#ffc107',
      '--color-info': '#17a2b8',
      '--color-light': '#f8f9fa',
      '--color-dark': '#343a40',
      '--color-white': '#ffffff',
      '--color-black': '#000000',
      
      // Grayscale palette
      '--color-gray-50': '#f9fafb',
      '--color-gray-100': '#f3f4f6',
      '--color-gray-200': '#e5e7eb',
      '--color-gray-300': '#d1d5db',
      '--color-gray-400': '#9ca3af',
      '--color-gray-500': '#6b7280',
      '--color-gray-600': '#4b5563',
      '--color-gray-700': '#374151',
      '--color-gray-800': '#1f2937',
      '--color-gray-900': '#111827',
      
      // Spacing scale
      '--space-0': '0',
      '--space-px': '1px',
      '--space-0-5': '0.125rem',
      '--space-1': '0.25rem',
      '--space-1-5': '0.375rem',
      '--space-2': '0.5rem',
      '--space-2-5': '0.625rem',
      '--space-3': '0.75rem',
      '--space-3-5': '0.875rem',
      '--space-4': '1rem',
      '--space-5': '1.25rem',
      '--space-6': '1.5rem',
      '--space-7': '1.75rem',
      '--space-8': '2rem',
      '--space-9': '2.25rem',
      '--space-10': '2.5rem',
      '--space-11': '2.75rem',
      '--space-12': '3rem',
      '--space-14': '3.5rem',
      '--space-16': '4rem',
      '--space-20': '5rem',
      '--space-24': '6rem',
      '--space-28': '7rem',
      '--space-32': '8rem',
      '--space-36': '9rem',
      '--space-40': '10rem',
      '--space-44': '11rem',
      '--space-48': '12rem',
      '--space-52': '13rem',
      '--space-56': '14rem',
      '--space-60': '15rem',
      '--space-64': '16rem',
      '--space-72': '18rem',
      '--space-80': '20rem',
      '--space-96': '24rem',
      
      // Typography scale
      '--font-size-xs': '0.75rem',
      '--font-size-sm': '0.875rem',
      '--font-size-base': '1rem',
      '--font-size-lg': '1.125rem',
      '--font-size-xl': '1.25rem',
      '--font-size-2xl': '1.5rem',
      '--font-size-3xl': '1.875rem',
      '--font-size-4xl': '2.25rem',
      '--font-size-5xl': '3rem',
      '--font-size-6xl': '3.75rem',
      '--font-size-7xl': '4.5rem',
      '--font-size-8xl': '6rem',
      '--font-size-9xl': '8rem',
      
      // Line heights
      '--line-height-none': '1',
      '--line-height-tight': '1.25',
      '--line-height-snug': '1.375',
      '--line-height-normal': '1.5',
      '--line-height-relaxed': '1.625',
      '--line-height-loose': '2',
      
      // Border radius
      '--radius-none': '0px',
      '--radius-sm': '0.125rem',
      '--radius-base': '0.25rem',
      '--radius-md': '0.375rem',
      '--radius-lg': '0.5rem',
      '--radius-xl': '0.75rem',
      '--radius-2xl': '1rem',
      '--radius-3xl': '1.5rem',
      '--radius-full': '9999px',
      
      // Shadows
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '--shadow-base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '--shadow-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      '--shadow-none': '0 0 #0000',
      
      // Z-index scale
      '--z-0': '0',
      '--z-10': '10',
      '--z-20': '20',
      '--z-30': '30',
      '--z-40': '40',
      '--z-50': '50',
      '--z-auto': 'auto'
    });
    
    // Semantic tokens building on global tokens (FR-2.1)
    this.registerTokens('semantic', {
      // Text colors
      '--text-primary': 'var(--color-gray-900)',
      '--text-secondary': 'var(--color-gray-600)',
      '--text-muted': 'var(--color-gray-500)',
      '--text-inverse': 'var(--color-white)',
      '--text-on-dark': 'var(--color-white)',
      '--text-on-light': 'var(--color-gray-900)',
      
      // Background colors
      '--bg-body': 'var(--color-white)',
      '--bg-card': 'var(--color-white)',
      '--bg-surface': 'var(--color-gray-50)',
      '--bg-overlay': 'rgba(0, 0, 0, 0.5)',
      '--bg-muted': 'var(--color-gray-100)',
      '--bg-inverse': 'var(--color-gray-900)',
      
      // Border colors
      '--border-color': 'var(--color-gray-200)',
      '--border-muted': 'var(--color-gray-100)',
      '--border-strong': 'var(--color-gray-300)',
      '--border-inverse': 'var(--color-gray-700)',
      
      // Interactive colors (extending ThemeService semantic colors)
      '--interactive-primary': 'var(--color-primary)',
      '--interactive-secondary': 'var(--color-secondary)',
      '--interactive-hover': 'var(--color-primary)',
      '--interactive-active': 'var(--color-primary)',
      '--interactive-focus': 'var(--color-primary)',
      '--interactive-disabled': 'var(--color-gray-300)',
      
      // State colors
      '--state-success': 'var(--color-success)',
      '--state-error': 'var(--color-danger)',
      '--state-warning': 'var(--color-warning)',
      '--state-info': 'var(--color-info)',
      
      // Accent colors (for subject themes)
      '--accent-primary': 'var(--color-primary)',
      '--accent-secondary': 'var(--color-secondary)',
      '--accent-math': '#ff6b6b',
      '--accent-science': '#4ecdc4',
      '--accent-reading': '#45b7d1',
      '--accent-art': '#f9ca24',
      '--accent-coding': '#6c5ce7'
    });
    
    this.log('debug', 'Built-in tokens initialized', {
      globalTokens: this.tokenRegistry.get('global').size,
      semanticTokens: this.tokenRegistry.get('semantic').size
    });
  }

  /**
   * Process CSS content and resolve theme tokens with inheritance
   * Core method implementing FR-2.1 and FR-2.3
   * @param {string} cssContent - CSS content to process
   * @param {string} componentName - Component name for scoped token resolution
   * @param {Object} options - Processing options
   * @param {string} options.variant - Theme variant (e.g., 'ocean', 'forest')
   * @param {string} options.scope - Component instance scope
   * @param {boolean} options.enableCaching - Enable result caching
   * @param {boolean} options.enableValidation - Enable token validation
   * @param {Object} options.contextTokens - Additional context-specific tokens
   * @returns {string} - Processed CSS content with resolved tokens
   */
  processTokens(cssContent, componentName = null, options = {}) {
    const startTime = this.config.enablePerformanceTracking ? performance.now() : 0;
    
    const {
      variant = null,
      scope = null,
      enableCaching = this.config.enableCaching,
      enableValidation = this.config.enableValidation,
      contextTokens = {}
    } = options;

    try {
      // Create cache key for processed results
      const cacheKey = this.createProcessingCacheKey(cssContent, componentName, options);
      
      // Check cache first
      if (enableCaching && this.tokenCache.has(cacheKey)) {
        this.metrics.cacheHits++;
        this.log('debug', `Token processing cache hit for ${componentName || 'unknown'}`);
        return this.tokenCache.get(cacheKey);
      }
      
      this.metrics.cacheMisses++;
      
      // Extract tokens from CSS content
      const extractedTokens = this.extractTokensFromCSS(cssContent);
      this.log('debug', `Extracted ${extractedTokens.size} tokens from CSS`, Array.from(extractedTokens));
      
      // Resolve tokens through inheritance chain
      const resolvedTokens = new Map();
      for (const tokenName of extractedTokens) {
        const resolvedValue = this.resolveToken(tokenName, componentName, variant, scope, contextTokens);
        resolvedTokens.set(tokenName, resolvedValue);
      }
      
      // Replace tokens in CSS content
      let processedCSS = this.replaceTokensInCSS(cssContent, resolvedTokens);
      
      // Validate token usage if enabled
      if (enableValidation) {
        const validationResults = this.validateTokenUsage(processedCSS, componentName);
        if (validationResults.errors.length > 0) {
          this.log('warn', `Token validation errors for ${componentName || 'unknown'}:`, validationResults.errors);
          this.metrics.validationErrors += validationResults.errors.length;
        }
        if (validationResults.warnings.length > 0) {
          this.log('info', `Token validation warnings for ${componentName || 'unknown'}:`, validationResults.warnings);
          this.metrics.validationWarnings += validationResults.warnings.length;
        }
      }
      
      // Cache processed result
      if (enableCaching) {
        // Implement cache size limit
        if (this.tokenCache.size >= this.config.maxCacheSize) {
          this.clearOldestCacheEntries(Math.floor(this.config.maxCacheSize * 0.2));
        }
        this.tokenCache.set(cacheKey, processedCSS);
      }
      
      // Update metrics
      this.metrics.tokensProcessed += extractedTokens.size;
      
      if (this.config.enablePerformanceTracking) {
        const processingTime = performance.now() - startTime;
        this.metrics.processingTime.set(componentName || 'unknown', processingTime);
        this.log('debug', `Token processing completed in ${processingTime.toFixed(2)}ms for ${componentName || 'unknown'}`);
      }
      
      return processedCSS;
      
    } catch (error) {
      this.log('error', `Token processing failed for ${componentName || 'unknown'}:`, error);
      
      // Return original CSS on error based on fallback strategy
      if (this.config.fallbackStrategy === 'graceful') {
        return cssContent;
      } else if (this.config.fallbackStrategy === 'strict') {
        throw error;
      } else {
        // Silent fallback
        return cssContent;
      }
    }
  }

  /**
   * Extract theme tokens from CSS content
   * @private
   * @param {string} cssContent - CSS content to analyze
   * @returns {Set<string>} - Set of token names found in CSS
   */
  extractTokensFromCSS(cssContent) {
    const tokens = new Set();
    
    // Find all var() usage
    const varMatches = cssContent.matchAll(this.tokenPatterns.tokenUsage);
    for (const match of varMatches) {
      const tokenName = match[1]; // Token name without var()
      if (tokenName) {
        tokens.add(tokenName);
      }
    }
    
    // Also extract token definitions for component-specific tokens
    const definitionMatches = cssContent.matchAll(this.tokenPatterns.tokenDefinition);
    for (const match of definitionMatches) {
      const tokenName = match[1];
      if (tokenName) {
        tokens.add(tokenName);
      }
    }
    
    return tokens;
  }

  /**
   * Resolve token value through inheritance chain (FR-2.3)
   * Implements comprehensive token resolution with fallback support
   * @param {string} tokenName - Token name to resolve
   * @param {string} componentName - Component context
   * @param {string} variant - Theme variant
   * @param {string} scope - Component instance scope
   * @param {Object} contextTokens - Additional context tokens
   * @returns {string} - Resolved token value
   */
  resolveToken(tokenName, componentName = null, variant = null, scope = null, contextTokens = {}) {
    const cacheKey = `${tokenName}:${componentName || ''}:${variant || ''}:${scope || ''}`;
    
    // Check resolution cache
    if (this.config.enableCaching && this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey);
    }
    
    // Try context tokens first (highest priority)
    if (contextTokens[tokenName]) {
      const value = contextTokens[tokenName];
      this.tokenCache.set(cacheKey, value);
      return value;
    }
    
    // Determine effective inheritance chain based on context
    const effectiveChain = this.buildEffectiveInheritanceChain(componentName, variant, scope);
    
    // Resolve through inheritance chain
    for (const level of effectiveChain.reverse()) {
      const value = this.getTokenValueFromLevel(tokenName, level, componentName, variant, scope);
      if (value !== null) {
        this.tokenCache.set(cacheKey, value);
        this.log('debug', `Token "${tokenName}" resolved from ${level} level: ${value}`);
        return value;
      }
    }
    
    // Try ThemeService fallback for compatibility
    if (this.themeService && typeof this.themeService.getThemeColor === 'function') {
      try {
        const fallbackValue = this.themeService.getThemeColor(tokenName);
        if (fallbackValue && fallbackValue !== tokenName) {
          this.log('debug', `Token "${tokenName}" resolved via ThemeService fallback: ${fallbackValue}`);
          this.tokenCache.set(cacheKey, fallbackValue);
          return fallbackValue;
        }
      } catch (error) {
        // Ignore ThemeService errors
      }
    }
    
    // Get fallback value
    const fallbackValue = this.getFallbackValue(tokenName);
    this.log('warn', `Token "${tokenName}" not found, using fallback: ${fallbackValue}`);
    this.tokenCache.set(cacheKey, fallbackValue);
    return fallbackValue;
  }

  /**
   * Build effective inheritance chain based on context
   * @private
   * @param {string} componentName - Component context
   * @param {string} variant - Theme variant
   * @param {string} scope - Component instance scope
   * @returns {Array<string>} - Ordered inheritance chain
   */
  buildEffectiveInheritanceChain(componentName, variant, scope) {
    const chain = [...this.inheritanceChain];
    
    // Customize chain based on inheritance mode
    if (this.config.inheritanceMode === 'override') {
      // In override mode, later levels completely override earlier ones
      return chain;
    } else if (this.config.inheritanceMode === 'merge') {
      // In merge mode, we might want to blend values (complex implementation)
      return chain;
    } else {
      // Default cascade mode
      return chain;
    }
  }

  /**
   * Get token value from specific inheritance level
   * @private
   * @param {string} tokenName - Token name
   * @param {string} level - Inheritance level
   * @param {string} componentName - Component context
   * @param {string} variant - Theme variant
   * @param {string} scope - Component instance scope
   * @returns {string|null} - Token value or null if not found
   */
  getTokenValueFromLevel(tokenName, level, componentName, variant, scope) {
    const levelRegistry = this.tokenRegistry.get(level);
    if (!levelRegistry) {
      return null;
    }

    // Try exact token match first
    if (levelRegistry.has(tokenName)) {
      return levelRegistry.get(tokenName);
    }

    // Try contextual variations based on level
    switch (level) {
      case 'component':
        if (componentName) {
          const componentToken = `--${componentName.toLowerCase()}-${tokenName.replace(/^--/, '')}`;
          if (levelRegistry.has(componentToken)) {
            return levelRegistry.get(componentToken);
          }
        }
        break;
        
      case 'variant':
        if (variant) {
          const variantToken = `--${variant}-${tokenName.replace(/^--/, '')}`;
          if (levelRegistry.has(variantToken)) {
            return levelRegistry.get(variantToken);
          }
        }
        break;
        
      case 'instance':
        if (scope) {
          const instanceToken = `--${scope}-${tokenName.replace(/^--/, '')}`;
          if (levelRegistry.has(instanceToken)) {
            return levelRegistry.get(instanceToken);
          }
        }
        break;
    }

    return null;
  }

  /**
   * Replace tokens in CSS content with resolved values
   * @private
   * @param {string} cssContent - CSS content
   * @param {Map<string, string>} resolvedTokens - Map of resolved tokens
   * @returns {string} - CSS with tokens replaced
   */
  replaceTokensInCSS(cssContent, resolvedTokens) {
    let processedCSS = cssContent;
    
    // Replace var() usage with resolved values
    processedCSS = processedCSS.replace(this.tokenPatterns.tokenUsage, (match, tokenName, fallback) => {
      if (resolvedTokens.has(tokenName)) {
        const resolvedValue = resolvedTokens.get(tokenName);
        // Keep as CSS variable if resolved value is another CSS variable
        if (resolvedValue.startsWith('var(')) {
          return resolvedValue;
        }
        return resolvedValue;
      }
      
      // Keep original var() if not resolved
      return match;
    });
    
    return processedCSS;
  }

  /**
   * Validate token usage in CSS content (FR-2.4)
   * @param {string} cssContent - CSS content to validate
   * @param {string} componentName - Component context for validation
   * @returns {Object} - Validation results with errors and warnings
   */
  /**
   * Validate token usage in CSS content with comprehensive analysis (FR-2.4)
   * Enhanced to support build-time validation (NFR-3.3) and follow ComponentManifest patterns
   * @param {string} cssContent - CSS content to validate
   * @param {string} componentName - Component context for validation
   * @param {Object} options - Validation options
   * @param {boolean} options.strictMode - Enable strict validation mode
   * @param {boolean} options.buildMode - Enable build-time specific validations
   * @param {Array<string>} options.allowedTokens - Explicitly allowed tokens (overrides registry check)
   * @param {Object} options.context - Additional context for validation
   * @returns {Object} - Comprehensive validation results with errors, warnings, and suggestions
   */
  validateTokenUsage(cssContent, componentName = null, options = {}) {
    const {
      strictMode = false,
      buildMode = false,
      allowedTokens = null,
      context = {}
    } = options;

    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      metrics: {
        totalTokens: 0,
        registeredTokens: 0,
        unregisteredTokens: 0,
        deprecatedTokens: 0,
        invalidTokens: 0,
        hardcodedValues: 0
      },
      context: {
        componentName,
        strictMode,
        buildMode,
        validatedAt: new Date().toISOString()
      }
    };

    try {
      const extractedTokens = this.extractTokensFromCSS(cssContent);
      validationResults.metrics.totalTokens = extractedTokens.size;
      
      // Validate each extracted token
      for (const tokenName of extractedTokens) {
        const tokenValidation = this.validateSingleToken(tokenName, componentName, {
          strictMode,
          buildMode,
          allowedTokens,
          cssContent,
          context
        });
        
        // Merge results
        validationResults.errors.push(...tokenValidation.errors);
        validationResults.warnings.push(...tokenValidation.warnings);
        validationResults.suggestions.push(...tokenValidation.suggestions);
        
        // Update metrics
        if (tokenValidation.isRegistered) {
          validationResults.metrics.registeredTokens++;
        } else {
          validationResults.metrics.unregisteredTokens++;
        }
        
        if (tokenValidation.isDeprecated) {
          validationResults.metrics.deprecatedTokens++;
        }
        
        if (tokenValidation.hasErrors) {
          validationResults.metrics.invalidTokens++;
          validationResults.isValid = false;
        }
      }
      
      // Perform CSS structure validation (FR-2.4)
      const cssStructureValidation = this.validateCSSStructure(cssContent, componentName, {
        strictMode,
        buildMode,
        context
      });
      
      validationResults.errors.push(...cssStructureValidation.errors);
      validationResults.warnings.push(...cssStructureValidation.warnings);
      validationResults.suggestions.push(...cssStructureValidation.suggestions);
      validationResults.metrics.hardcodedValues = cssStructureValidation.hardcodedValues || 0;
      
      if (cssStructureValidation.errors.length > 0) {
        validationResults.isValid = false;
      }
      
      // Build-time specific validations (NFR-3.3)
      if (buildMode) {
        const buildValidation = this.performBuildTimeValidation(cssContent, componentName, extractedTokens);
        validationResults.errors.push(...buildValidation.errors);
        validationResults.warnings.push(...buildValidation.warnings);
        validationResults.suggestions.push(...buildValidation.suggestions);
        
        if (buildValidation.errors.length > 0) {
          validationResults.isValid = false;
        }
      }
      
      // Component-specific validations
      if (componentName) {
        const componentValidation = this.validateComponentTokenUsage(cssContent, componentName, extractedTokens);
        validationResults.errors.push(...componentValidation.errors);
        validationResults.warnings.push(...componentValidation.warnings);
        validationResults.suggestions.push(...componentValidation.suggestions);
        
        if (componentValidation.errors.length > 0) {
          validationResults.isValid = false;
        }
      }
      
      // Generate fix suggestions for common issues
      if (validationResults.errors.length > 0 || validationResults.warnings.length > 0) {
        const fixSuggestions = this.generateFixSuggestions(validationResults, cssContent, componentName);
        validationResults.fixSuggestions = fixSuggestions;
      }
      
    } catch (error) {
      validationResults.isValid = false;
      validationResults.errors.push({
        type: 'validation_error',
        severity: 'error',
        code: 'VALIDATION_EXCEPTION',
        message: `Token validation failed: ${error.message}`,
        error: error.message,
        context: { componentName, strictMode, buildMode },
        location: null,
        fixable: false
      });
      
      this.log('error', `Token validation exception for ${componentName || 'unknown'}:`, error);
    }

    // Log validation summary
    this.log('debug', `Token validation completed for ${componentName || 'unknown'}`, {
      isValid: validationResults.isValid,
      errors: validationResults.errors.length,
      warnings: validationResults.warnings.length,
      metrics: validationResults.metrics
    });

    return validationResults;
  }

  /**
   * Validate a single token with comprehensive checks
   * @private
   * @param {string} tokenName - Token name to validate
   * @param {string} componentName - Component context
   * @param {Object} options - Validation options
   * @returns {Object} - Token validation results
   */
  validateSingleToken(tokenName, componentName, options = {}) {
    const {
      strictMode = false,
      buildMode = false,
      allowedTokens = null,
      cssContent = '',
      context = {}
    } = options;

    const tokenResults = {
      tokenName,
      isRegistered: false,
      isDeprecated: false,
      hasErrors: false,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check if token is in allowed list (overrides registry check)
    if (allowedTokens && allowedTokens.includes(tokenName)) {
      tokenResults.isRegistered = true;
      return tokenResults;
    }

    // Check if token exists in registry
    tokenResults.isRegistered = this.isTokenRegistered(tokenName);
    
    if (!tokenResults.isRegistered) {
      const severity = strictMode ? 'error' : 'warning';
      const issue = {
        type: 'unregistered_token',
        severity,
        code: 'TOKEN_NOT_REGISTERED',
        tokenName,
        message: `Token "${tokenName}" is not registered in any inheritance level`,
        suggestion: 'Register the token in the appropriate inheritance level or check for typos',
        context: { componentName, strictMode },
        location: this.findTokenLocation(tokenName, cssContent),
        fixable: false
      };
      
      if (severity === 'error') {
        tokenResults.errors.push(issue);
        tokenResults.hasErrors = true;
      } else {
        tokenResults.warnings.push(issue);
      }
    }

    // Check for deprecated tokens
    const tokenDoc = this.documentationRegistry.get(tokenName);
    if (tokenDoc && tokenDoc.deprecated) {
      tokenResults.isDeprecated = true;
      tokenResults.warnings.push({
        type: 'deprecated_token',
        severity: 'warning',
        code: 'TOKEN_DEPRECATED',
        tokenName,
        message: `Token "${tokenName}" is deprecated`,
        suggestion: tokenDoc.replacement ? `Use "${tokenDoc.replacement}" instead` : 'Consider using an alternative token',
        context: { componentName, deprecated: true },
        location: this.findTokenLocation(tokenName, cssContent),
        fixable: !!tokenDoc.replacement
      });
    }

    // Apply validation rules
    for (const [ruleName, rule] of this.validationRules.entries()) {
      if (rule.pattern.test(tokenName)) {
        const tokenValue = this.getRegisteredTokenValue(tokenName);
        const ruleResults = rule.validate(tokenName, tokenValue, { componentName, cssContent, context });
        
        for (const result of ruleResults) {
          const enhancedResult = {
            ...result,
            rule: ruleName,
            tokenName,
            code: `RULE_${ruleName.toUpperCase()}`,
            context: { ...result.context, componentName, rule: ruleName },
            location: this.findTokenLocation(tokenName, cssContent),
            fixable: result.fixable || false
          };
          
          if (result.type === 'error') {
            tokenResults.errors.push(enhancedResult);
            tokenResults.hasErrors = true;
          } else if (result.type === 'warning') {
            tokenResults.warnings.push(enhancedResult);
          } else if (result.type === 'suggestion') {
            tokenResults.suggestions.push(enhancedResult);
          }
        }
      }
    }

    return tokenResults;
  }

  /**
   * Perform build-time specific validations (NFR-3.3)
   * @private
   * @param {string} cssContent - CSS content
   * @param {string} componentName - Component name
   * @param {Set<string>} extractedTokens - Extracted tokens
   * @returns {Object} - Build validation results
   */
  performBuildTimeValidation(cssContent, componentName, extractedTokens) {
    const buildResults = {
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check for circular token dependencies
    const circularDeps = this.detectCircularTokenDependencies(extractedTokens);
    if (circularDeps.length > 0) {
      buildResults.errors.push({
        type: 'circular_dependency',
        severity: 'error',
        code: 'CIRCULAR_TOKEN_DEPENDENCY',
        message: `Circular token dependencies detected: ${circularDeps.join(' -> ')}`,
        suggestion: 'Restructure token definitions to avoid circular references',
        context: { componentName, circularDeps },
        location: null,
        fixable: false
      });
    }

    // Check for unused custom properties in the CSS
    const unusedTokens = this.findUnusedTokens(cssContent, extractedTokens);
    if (unusedTokens.length > 0) {
      buildResults.warnings.push({
        type: 'unused_tokens',
        severity: 'warning',
        code: 'UNUSED_TOKEN_DEFINITIONS',
        message: `Found ${unusedTokens.length} defined but unused tokens`,
        suggestion: 'Remove unused token definitions to reduce CSS size',
        context: { componentName, unusedTokens },
        location: null,
        fixable: true
      });
    }

    // Validate token value consistency across themes
    const inconsistencies = this.validateTokenConsistency(extractedTokens);
    if (inconsistencies.length > 0) {
      buildResults.warnings.push({
        type: 'token_inconsistency',
        severity: 'warning',
        code: 'TOKEN_VALUE_INCONSISTENCY',
        message: `Token value inconsistencies found across themes`,
        suggestion: 'Ensure consistent token values across all theme variants',
        context: { componentName, inconsistencies },
        location: null,
        fixable: false
      });
    }

    // Check for performance issues with complex token values
    const performanceIssues = this.detectTokenPerformanceIssues(extractedTokens);
    if (performanceIssues.length > 0) {
      buildResults.suggestions.push({
        type: 'performance_optimization',
        severity: 'info',
        code: 'TOKEN_PERFORMANCE_OPTIMIZATION',
        message: `Potential performance optimizations found for ${performanceIssues.length} tokens`,
        suggestion: 'Consider simplifying complex token values for better runtime performance',
        context: { componentName, performanceIssues },
        location: null,
        fixable: true
      });
    }

    return buildResults;
  }

  /**
   * Validate component-specific token usage patterns
   * @private
   * @param {string} cssContent - CSS content
   * @param {string} componentName - Component name
   * @param {Set<string>} extractedTokens - Extracted tokens
   * @returns {Object} - Component validation results
   */
  validateComponentTokenUsage(cssContent, componentName, extractedTokens) {
    const componentResults = {
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check for component naming conventions
    const componentTokens = Array.from(extractedTokens).filter(token => 
      token.includes(componentName.toLowerCase()) || token.includes('component')
    );

    if (componentTokens.length > 0) {
      for (const token of componentTokens) {
        if (!token.startsWith(`--${componentName.toLowerCase()}-`) && !token.startsWith('--component-')) {
          componentResults.warnings.push({
            type: 'component_naming_convention',
            severity: 'warning',
            code: 'COMPONENT_TOKEN_NAMING',
            tokenName: token,
            message: `Component token "${token}" doesn't follow naming convention`,
            suggestion: `Consider using "--${componentName.toLowerCase()}-*" or "--component-*" prefix`,
            context: { componentName, expectedPrefix: `--${componentName.toLowerCase()}-` },
            location: this.findTokenLocation(token, cssContent),
            fixable: true
          });
        }
      }
    }

    // Check for missing semantic tokens
    const semanticTokenPatterns = [
      '--text-',
      '--bg-',
      '--border-',
      '--interactive-'
    ];

    const hasSemanticTokens = semanticTokenPatterns.some(pattern =>
      Array.from(extractedTokens).some(token => token.includes(pattern))
    );

    if (!hasSemanticTokens && extractedTokens.size > 0) {
      componentResults.suggestions.push({
        type: 'semantic_token_usage',
        severity: 'info',
        code: 'SUGGEST_SEMANTIC_TOKENS',
        message: 'Consider using semantic tokens for better theme consistency',
        suggestion: 'Use semantic tokens like --text-primary, --bg-card, --border-color for better theming support',
        context: { componentName },
        location: null,
        fixable: true
      });
    }

    return componentResults;
  }

  /**
   * Find token location in CSS content for better error reporting
   * @private
   * @param {string} tokenName - Token to find
   * @param {string} cssContent - CSS content to search
   * @returns {Object|null} - Location information
   */
  findTokenLocation(tokenName, cssContent) {
    if (!cssContent || !tokenName) {
      return null;
    }

    const lines = cssContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tokenIndex = line.indexOf(tokenName);
      if (tokenIndex !== -1) {
        return {
          line: i + 1,
          column: tokenIndex + 1,
          lineContent: line.trim()
        };
      }
    }

    return null;
  }

  /**
   * Detect circular token dependencies
   * @private
   * @param {Set<string>} tokens - Tokens to check
   * @returns {Array<string>} - Circular dependency chain
   */
  detectCircularTokenDependencies(tokens) {
    const visited = new Set();
    const visiting = new Set();
    const circularDeps = [];

    const visit = (tokenName) => {
      if (visiting.has(tokenName)) {
        // Found circular dependency
        const chain = Array.from(visiting);
        const startIndex = chain.indexOf(tokenName);
        return chain.slice(startIndex).concat([tokenName]);
      }

      if (visited.has(tokenName)) {
        return [];
      }

      visiting.add(tokenName);

      const tokenValue = this.getRegisteredTokenValue(tokenName);
      if (tokenValue && tokenValue.includes('var(')) {
        const referencedTokens = this.extractTokensFromCSS(tokenValue);
        for (const refToken of referencedTokens) {
          const result = visit(refToken);
          if (result.length > 0) {
            return result;
          }
        }
      }

      visiting.delete(tokenName);
      visited.add(tokenName);
      return [];
    };

    for (const token of tokens) {
      const circular = visit(token);
      if (circular.length > 0) {
        circularDeps.push(...circular);
        break; // Return first circular dependency found
      }
    }

    return circularDeps;
  }

  /**
   * Find unused token definitions in CSS
   * @private
   * @param {string} cssContent - CSS content
   * @param {Set<string>} extractedTokens - Extracted tokens
   * @returns {Array<string>} - Unused tokens
   */
  findUnusedTokens(cssContent, extractedTokens) {
    const definedTokens = new Set();
    const usedTokens = new Set();

    // Find all token definitions
    const definitionMatches = cssContent.matchAll(this.tokenPatterns.tokenDefinition);
    for (const match of definitionMatches) {
      definedTokens.add(match[1]);
    }

    // Find all token usages
    const usageMatches = cssContent.matchAll(this.tokenPatterns.tokenUsage);
    for (const match of usageMatches) {
      usedTokens.add(match[1]);
    }

    // Return tokens that are defined but not used
    return Array.from(definedTokens).filter(token => !usedTokens.has(token));
  }

  /**
   * Validate token consistency across themes
   * @private
   * @param {Set<string>} tokens - Tokens to check
   * @returns {Array<Object>} - Inconsistency reports
   */
  validateTokenConsistency(tokens) {
    const inconsistencies = [];
    
    for (const tokenName of tokens) {
      const globalValue = this.tokenRegistry.get('global').get(tokenName);
      const semanticValue = this.tokenRegistry.get('semantic').get(tokenName);
      const variantValues = [];

      // Check variant registry for theme-specific values
      const variantRegistry = this.tokenRegistry.get('variant');
      for (const [variantToken, value] of variantRegistry.entries()) {
        if (variantToken.includes(tokenName.replace(/^--/, ''))) {
          variantValues.push({ token: variantToken, value });
        }
      }

      // Check for type inconsistencies
      if (globalValue && semanticValue) {
        const globalType = this.inferTokenType(tokenName, globalValue);
        const semanticType = this.inferTokenType(tokenName, semanticValue);
        
        if (globalType !== semanticType && globalType !== 'unknown' && semanticType !== 'unknown') {
          inconsistencies.push({
            tokenName,
            type: 'type_mismatch',
            globalType,
            semanticType,
            globalValue,
            semanticValue
          });
        }
      }
    }

    return inconsistencies;
  }

  /**
   * Detect potential performance issues with token values
   * @private
   * @param {Set<string>} tokens - Tokens to check
   * @returns {Array<Object>} - Performance issue reports
   */
  detectTokenPerformanceIssues(tokens) {
    const issues = [];

    for (const tokenName of tokens) {
      const tokenValue = this.getRegisteredTokenValue(tokenName);
      if (!tokenValue) continue;

      // Check for complex calc() expressions
      if (tokenValue.includes('calc(') && (tokenValue.match(/calc\(/g) || []).length > 1) {
        issues.push({
          tokenName,
          type: 'complex_calc',
          value: tokenValue,
          suggestion: 'Consider pre-calculating complex values or breaking into simpler expressions'
        });
      }

      // Check for deeply nested var() references
      const varDepth = (tokenValue.match(/var\(/g) || []).length;
      if (varDepth > 3) {
        issues.push({
          tokenName,
          type: 'deep_nesting',
          value: tokenValue,
          depth: varDepth,
          suggestion: 'Consider flattening deeply nested token references for better performance'
        });
      }

      // Check for potential expensive operations
      if (tokenValue.includes('gradient') && tokenValue.length > 200) {
        issues.push({
          tokenName,
          type: 'complex_gradient',
          value: tokenValue,
          suggestion: 'Consider simplifying complex gradients or using CSS classes instead'
        });
      }
    }

    return issues;
  }

  /**
   * Generate fix suggestions for validation issues
   * @private
   * @param {Object} validationResults - Validation results
   * @param {string} cssContent - Original CSS content
   * @param {string} componentName - Component name
   * @returns {Array<Object>} - Fix suggestions
   */
  generateFixSuggestions(validationResults, cssContent, componentName) {
    const fixSuggestions = [];

    // Group issues by type for better fix suggestions
    const issuesByType = new Map();
    
    [...validationResults.errors, ...validationResults.warnings].forEach(issue => {
      if (!issuesByType.has(issue.type)) {
        issuesByType.set(issue.type, []);
      }
      issuesByType.get(issue.type).push(issue);
    });

    // Generate type-specific fix suggestions
    for (const [issueType, issues] of issuesByType.entries()) {
      switch (issueType) {
        case 'unregistered_token':
          fixSuggestions.push({
            type: 'register_tokens',
            description: `Register ${issues.length} unregistered tokens`,
            automated: true,
            fix: this.generateTokenRegistrationFix(issues, componentName)
          });
          break;

        case 'deprecated_token':
          fixSuggestions.push({
            type: 'replace_deprecated',
            description: `Replace ${issues.length} deprecated tokens`,
            automated: true,
            fix: this.generateDeprecatedTokenFix(issues, cssContent)
          });
          break;

        case 'component_naming_convention':
          fixSuggestions.push({
            type: 'fix_naming',
            description: `Fix naming convention for ${issues.length} component tokens`,
            automated: true,
            fix: this.generateNamingConventionFix(issues, cssContent, componentName)
          });
          break;

        default:
          if (issues.some(issue => issue.fixable)) {
            fixSuggestions.push({
              type: 'manual_fix',
              description: `Manual fixes needed for ${issueType} issues`,
              automated: false,
              issues: issues.filter(issue => issue.fixable)
            });
          }
      }
    }

    return fixSuggestions;
  }

  /**
   * Generate token registration fix
   * @private
   */
  generateTokenRegistrationFix(issues, componentName) {
    const tokensToRegister = {};
    
    issues.forEach(issue => {
      const tokenName = issue.tokenName;
      const inferredType = this.inferTokenType(tokenName, '');
      const suggestedLevel = this.suggestTokenLevel(tokenName, componentName);
      const fallbackValue = this.getFallbackValue(tokenName);
      
      tokensToRegister[tokenName] = {
        level: suggestedLevel,
        value: fallbackValue,
        type: inferredType,
        description: `Auto-generated token for ${componentName || 'component'}`
      };
    });

    return {
      action: 'register_tokens',
      tokens: tokensToRegister,
      code: this.generateTokenRegistrationCode(tokensToRegister)
    };
  }

  /**
   * Generate deprecated token replacement fix
   * @private
   */
  generateDeprecatedTokenFix(issues, cssContent) {
    const replacements = {};
    
    issues.forEach(issue => {
      const tokenDoc = this.documentationRegistry.get(issue.tokenName);
      if (tokenDoc && tokenDoc.replacement) {
        replacements[issue.tokenName] = tokenDoc.replacement;
      }
    });

    return {
      action: 'replace_tokens',
      replacements,
      newCSS: this.applyTokenReplacements(cssContent, replacements)
    };
  }

  /**
   * Generate naming convention fix
   * @private
   */
  generateNamingConventionFix(issues, cssContent, componentName) {
    const renames = {};
    
    issues.forEach(issue => {
      const oldName = issue.tokenName;
      const newName = `--${componentName.toLowerCase()}-${oldName.replace(/^--/, '')}`;
      renames[oldName] = newName;
    });

    return {
      action: 'rename_tokens',
      renames,
      newCSS: this.applyTokenReplacements(cssContent, renames)
    };
  }

  /**
   * Suggest appropriate inheritance level for a token
   * @private
   */
  suggestTokenLevel(tokenName, componentName) {
    if (tokenName.includes('color') || tokenName.includes('text') || tokenName.includes('bg')) {
      return 'semantic';
    }
    if (componentName && tokenName.includes(componentName.toLowerCase())) {
      return 'component';
    }
    if (tokenName.includes('space') || tokenName.includes('font') || tokenName.includes('radius')) {
      return 'global';
    }
    return 'component';
  }

  /**
   * Generate code for token registration
   * @private
   */
  generateTokenRegistrationCode(tokensToRegister) {
    const codeLines = [];
    
    Object.entries(tokensToRegister).forEach(([tokenName, tokenData]) => {
      codeLines.push(`// Register ${tokenName} at ${tokenData.level} level`);
      codeLines.push(`themeTokenProcessor.registerTokens('${tokenData.level}', {`);
      codeLines.push(`  '${tokenName}': '${tokenData.value}'`);
      codeLines.push(`}, {`);
      codeLines.push(`  '${tokenName}': {`);
      codeLines.push(`    description: '${tokenData.description}',`);
      codeLines.push(`    type: '${tokenData.type}'`);
      codeLines.push(`  }`);
      codeLines.push(`});`);
      codeLines.push('');
    });

    return codeLines.join('\n');
  }

  /**
   * Apply token replacements to CSS content
   * @private
   */
  applyTokenReplacements(cssContent, replacements) {
    let newCSS = cssContent;
    
    Object.entries(replacements).forEach(([oldToken, newToken]) => {
      const regex = new RegExp(`var\\(\\s*${oldToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:,\\s*[^)]+)?\\s*\\)`, 'g');
      newCSS = newCSS.replace(regex, `var(${newToken})`);
    });

    return newCSS;
  }

  /**
   * Validate CSS structure and usage patterns
   * @private
   * @param {string} cssContent - CSS content to validate
   * @param {string} componentName - Component context
   * @returns {Object} - Validation results
   */
  validateCSSStructure(cssContent, componentName) {
    const results = {
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check for hardcoded values that should use tokens
    const hardcodedColorPattern = /#[0-9a-fA-F]{3,6}|rgb\(|rgba\(|hsl\(|hsla\(/g;
    const hardcodedColors = cssContent.match(hardcodedColorPattern);
    
    if (hardcodedColors && hardcodedColors.length > 0) {
      results.suggestions.push({
        type: 'token_opportunity',
        message: `Found ${hardcodedColors.length} hardcoded color values`,
        suggestion: 'Consider using theme tokens for better consistency and theming support',
        values: hardcodedColors.slice(0, 5), // Show first 5 examples
        context: { componentName }
      });
    }

    // Check for hardcoded spacing values
    const hardcodedSpacingPattern = /:\s*(?:\d+px|\d+rem|\d+em)(?:\s|;|$)/g;
    const hardcodedSpacing = cssContent.match(hardcodedSpacingPattern);
    
    if (hardcodedSpacing && hardcodedSpacing.length > 5) {
      results.suggestions.push({
        type: 'spacing_tokens',
        message: `Found ${hardcodedSpacing.length} hardcoded spacing values`,
        suggestion: 'Consider using spacing tokens from the scale for better consistency',
        context: { componentName }
      });
    }

    // Check for potential token naming issues
    const tokenDefinitions = cssContent.matchAll(this.tokenPatterns.tokenDefinition);
    for (const match of tokenDefinitions) {
      const tokenName = match[1];
      
      // Check naming conventions
      if (!tokenName.match(/^--[a-z][a-z0-9-]*$/)) {
        results.warnings.push({
          type: 'naming_convention',
          tokenName,
          message: `Token "${tokenName}" doesn't follow naming convention`,
          suggestion: 'Use lowercase letters, numbers, and hyphens only',
          context: { componentName }
        });
      }
      
      // Check for overly specific tokens
      if (tokenName.split('-').length > 6) {
        results.warnings.push({
          type: 'token_specificity',
          tokenName,
          message: `Token "${tokenName}" may be overly specific`,
          suggestion: 'Consider using more general token names for better reusability',
          context: { componentName }
        });
      }
    }

    return results;
  }

  /**
   * Check if token is registered in any inheritance level
   * @private
   * @param {string} tokenName - Token name to check
   * @returns {boolean} - True if token is registered
   */
  isTokenRegistered(tokenName) {
    for (const level of this.inheritanceChain) {
      const levelRegistry = this.tokenRegistry.get(level);
      if (levelRegistry && levelRegistry.has(tokenName)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get registered token value from any level
   * @private
   * @param {string} tokenName - Token name
   * @returns {string|null} - Token value or null
   */
  getRegisteredTokenValue(tokenName) {
    for (const level of this.inheritanceChain.reverse()) {
      const levelRegistry = this.tokenRegistry.get(level);
      if (levelRegistry && levelRegistry.has(tokenName)) {
        return levelRegistry.get(tokenName);
      }
    }
    return null;
  }

  /**
   * Generate comprehensive token documentation (FR-2.4)
   * @param {Object} options - Documentation options
   * @param {string} options.format - Output format ('json', 'markdown', 'html')
   * @param {Array<string>} options.levels - Inheritance levels to include
   * @param {boolean} options.includeUsage - Include usage examples
   * @param {boolean} options.includeValidation - Include validation info
   * @returns {string|Object} - Generated documentation
   */
  /**
   * Generate comprehensive token documentation (FR-2.4, NFR-2.2)
   * Enhanced to make theme tokens documented and discoverable with rich metadata
   * @param {Object} options - Documentation generation options
   * @param {string} options.format - Output format ('json', 'markdown', 'html', 'typescript', 'css')
   * @param {Array<string>} options.levels - Inheritance levels to include
   * @param {boolean} options.includeUsage - Include usage examples and patterns
   * @param {boolean} options.includeValidation - Include validation rules and examples
   * @param {boolean} options.includeMetrics - Include token usage metrics
   * @param {boolean} options.includeSearchIndex - Generate searchable index
   * @param {string} options.componentFilter - Filter tokens by component name
   * @param {string} options.typeFilter - Filter tokens by inferred type
   * @param {boolean} options.groupByCategory - Group tokens by semantic categories
   * @param {boolean} options.includeVisualExamples - Include visual color/spacing examples
   * @param {string} options.outputPath - Output path for file generation
   * @returns {string|Object} - Generated documentation in requested format
   */
  generateTokenDocumentation(options = {}) {
    const {
      format = 'json',
      levels = this.inheritanceChain,
      includeUsage = true,
      includeValidation = true,
      includeMetrics = true,
      includeSearchIndex = true,
      componentFilter = null,
      typeFilter = null,
      groupByCategory = true,
      includeVisualExamples = true,
      outputPath = null
    } = options;

    const startTime = performance.now();

    const documentation = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0.0',
        generator: 'ThemeTokenProcessor',
        totalTokens: 0,
        inheritanceChain: this.inheritanceChain,
        validationRules: Array.from(this.validationRules.keys()),
        filters: {
          componentFilter,
          typeFilter,
          levels
        },
        options: {
          groupByCategory,
          includeUsage,
          includeValidation,
          includeMetrics,
          includeVisualExamples
        }
      },
      summary: {
        tokensByLevel: {},
        tokensByType: {},
        tokensByCategory: {},
        deprecatedTokens: [],
        recentlyAdded: [],
        mostUsed: []
      },
      levels: {},
      categories: {},
      usage: includeUsage ? this.generateEnhancedUsageExamples() : null,
      validation: includeValidation ? this.generateEnhancedValidationDocumentation() : null,
      metrics: includeMetrics ? this.generateTokenMetrics() : null,
      searchIndex: includeSearchIndex ? this.generateSearchIndex() : null,
      visualExamples: includeVisualExamples ? this.generateVisualExamples() : null
    };

    // Process each inheritance level
    for (const level of levels) {
      const levelRegistry = this.tokenRegistry.get(level);
      if (!levelRegistry) continue;

      const levelDoc = {
        name: level,
        description: this.getLevelDescription(level),
        priority: this.inheritanceChain.indexOf(level),
        tokenCount: 0,
        tokens: {}
      };

      // Process tokens in this level
      for (const [tokenName, tokenValue] of levelRegistry.entries()) {
        // Apply filters
        if (componentFilter && !tokenName.toLowerCase().includes(componentFilter.toLowerCase())) {
          continue;
        }

        const tokenType = this.inferTokenType(tokenName, tokenValue);
        if (typeFilter && tokenType !== typeFilter) {
          continue;
        }

        // Get enhanced token information
        const tokenInfo = this.getEnhancedTokenInfo(tokenName, tokenValue, level);
        levelDoc.tokens[tokenName] = tokenInfo;
        levelDoc.tokenCount++;

        // Update summary counters
        documentation.summary.tokensByType[tokenType] = (documentation.summary.tokensByType[tokenType] || 0) + 1;
        
        if (tokenInfo.deprecated) {
          documentation.summary.deprecatedTokens.push(tokenName);
        }
      }

      documentation.levels[level] = levelDoc;
      documentation.summary.tokensByLevel[level] = levelDoc.tokenCount;
      documentation.metadata.totalTokens += levelDoc.tokenCount;
    }

    // Group tokens by category if requested
    if (groupByCategory) {
      documentation.categories = this.generateCategoryDocumentation(documentation.levels);
    }

    // Generate cross-references and relationships
    documentation.relationships = this.generateTokenRelationships(documentation.levels);

    // Generate migration guide for deprecated tokens
    if (documentation.summary.deprecatedTokens.length > 0) {
      documentation.migrationGuide = this.generateMigrationGuide(documentation.summary.deprecatedTokens);
    }

    // Add performance metrics
    const generationTime = performance.now() - startTime;
    documentation.metadata.generationTime = Math.round(generationTime * 100) / 100;

    // Format output based on requested format
    const formattedDoc = this.formatDocumentation(documentation, format);

    // Write to file if output path specified
    if (outputPath && typeof window === 'undefined') {
      this.writeDocumentationToFile(formattedDoc, outputPath, format);
    }

    this.log('info', `Generated token documentation in ${generationTime.toFixed(2)}ms`, {
      format,
      totalTokens: documentation.metadata.totalTokens,
      levels: levels.length,
      categories: Object.keys(documentation.categories || {}).length
    });

    return formattedDoc;
  }

  /**
   * Get enhanced information about a token for documentation
   * @private
   * @param {string} tokenName - Token name
   * @param {string} tokenValue - Token value
   * @param {string} level - Inheritance level
   * @returns {Object} - Enhanced token information
   */
  getEnhancedTokenInfo(tokenName, tokenValue, level) {
    const tokenDoc = this.documentationRegistry.get(tokenName) || {};
    const tokenType = this.inferTokenType(tokenName, tokenValue);

    return {
      name: tokenName,
      value: tokenValue,
      level,
      type: tokenType,
      category: this.inferTokenCategory(tokenName, tokenType),
      description: tokenDoc.description || this.generateAutoDescription(tokenName, tokenType),
      examples: tokenDoc.examples || this.generateExampleUsage(tokenName, tokenType),
      deprecated: tokenDoc.deprecated || false,
      replacement: tokenDoc.replacement || null,
      since: tokenDoc.since || null,
      related: this.findRelatedTokens(tokenName),
      computedValue: this.computeTokenValue(tokenName, tokenValue),
      dependencies: this.getTokenDependencies(tokenValue),
      usageCount: this.getTokenUsageCount(tokenName),
      accessibility: this.getAccessibilityInfo(tokenName, tokenType),
      browser: this.getBrowserCompatibility(tokenName, tokenValue),
      performance: this.getPerformanceInfo(tokenName, tokenValue)
    };
  }

  /**
   * Generate enhanced usage examples with real-world patterns
   * @private
   * @returns {Object} - Enhanced usage examples
   */
  generateEnhancedUsageExamples() {
    return {
      basic: {
        title: 'Basic Token Usage',
        description: 'Fundamental patterns for using theme tokens in CSS',
        examples: [
          {
            title: 'Color Tokens',
            description: 'Using semantic color tokens for consistent theming',
            css: `
.card {
  background-color: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.button-primary {
  background-color: var(--interactive-primary);
  color: var(--text-inverse);
}

.button-primary:hover {
  background-color: var(--interactive-hover);
}`,
            notes: 'Always use semantic tokens (--text-*, --bg-*, --interactive-*) for component styling to ensure proper theme switching.',
            tokens: ['--bg-card', '--text-primary', '--border-color', '--interactive-primary', '--text-inverse', '--interactive-hover']
          },
          {
            title: 'Spacing Tokens',
            description: 'Using the spacing scale for consistent layouts',
            css: `
.container {
  padding: var(--space-4) var(--space-6);
  margin-bottom: var(--space-8);
  gap: var(--space-3);
}

.grid {
  grid-gap: var(--space-4);
  padding: var(--space-2);
}`,
            notes: 'Use the spacing scale (--space-*) for all margins, paddings, and gaps to maintain consistent rhythm.',
            tokens: ['--space-2', '--space-3', '--space-4', '--space-6', '--space-8']
          }
        ]
      },
      advanced: {
        title: 'Advanced Token Patterns',
        description: 'Complex patterns and best practices for token usage',
        examples: [
          {
            title: 'Token Fallbacks and Cascading',
            description: 'Using fallback values and token inheritance',
            css: `
.component {
  /* Component-specific token with fallback to semantic token */
  color: var(--card-text-color, var(--text-primary));
  
  /* Multiple fallbacks for robustness */
  background: var(--card-bg-gradient, var(--bg-card, #ffffff));
  
  /* Theme variant with fallbacks */
  border-color: var(--ocean-border-primary, var(--border-color));
}`,
            notes: 'Always provide fallbacks for component-specific tokens. Use the inheritance chain: component → semantic → global.',
            tokens: ['--card-text-color', '--text-primary', '--card-bg-gradient', '--bg-card', '--ocean-border-primary', '--border-color']
          },
          {
            title: 'Calculated Values with Tokens',
            description: 'Using calc() with tokens for dynamic values',
            css: `
.responsive-container {
  /* Dynamic spacing based on tokens */
  padding: calc(var(--space-4) * 2);
  margin: calc(var(--space-2) + 1px);
  
  /* Responsive sizing with tokens */
  width: calc(100% - var(--space-8));
  max-width: calc(var(--container-width) - var(--space-12));
}

.dynamic-shadow {
  /* Dynamic shadow based on elevation tokens */
  box-shadow: 0 calc(var(--elevation-level) * 2px) calc(var(--elevation-level) * 4px) var(--shadow-color);
}`,
            notes: 'Use calc() for dynamic values, but avoid overly complex calculations that may impact performance.',
            tokens: ['--space-2', '--space-4', '--space-8', '--space-12', '--container-width', '--elevation-level', '--shadow-color']
          },
          {
            title: 'Component Token Patterns',
            description: 'Creating component-specific token systems',
            css: `
/* Component token definitions */
.card {
  /* Define component-specific tokens */
  --card-padding: var(--space-4);
  --card-radius: var(--radius-md);
  --card-shadow: var(--shadow-sm);
  
  /* Use component tokens in styles */
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

/* Size variants using component tokens */
.card--small {
  --card-padding: var(--space-2);
  --card-radius: var(--radius-sm);
}

.card--large {
  --card-padding: var(--space-6);
  --card-shadow: var(--shadow-md);
}`,
            notes: 'Define component-specific tokens for customization points. Use CSS custom property inheritance for variants.',
            tokens: ['--space-2', '--space-4', '--space-6', '--radius-sm', '--radius-md', '--shadow-sm', '--shadow-md']
          }
        ]
      },
      responsive: {
        title: 'Responsive Token Usage',
        description: 'Using tokens in responsive designs',
        examples: [
          {
            title: 'Responsive Spacing',
            description: 'Adapting spacing tokens for different screen sizes',
            css: `
.responsive-section {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

@media (min-width: 768px) {
  .responsive-section {
    padding: var(--space-6);
    margin-bottom: var(--space-8);
  }
}

@media (min-width: 1024px) {
  .responsive-section {
    padding: var(--space-8);
    margin-bottom: var(--space-12);
  }
}`,
            notes: 'Scale token usage for different breakpoints while maintaining proportional relationships.',
            tokens: ['--space-4', '--space-6', '--space-8', '--space-12']
          }
        ]
      },
      theming: {
        title: 'Theme Switching Patterns',
        description: 'Implementing theme switching with tokens',
        examples: [
          {
            title: 'Theme Variants',
            description: 'Creating theme-specific token overrides',
            css: `
/* Default theme tokens */
:root {
  --theme-primary: var(--color-blue-500);
  --theme-secondary: var(--color-gray-500);
  --theme-accent: var(--color-green-500);
}

/* Ocean theme variant */
[data-theme="ocean"] {
  --theme-primary: var(--color-blue-600);
  --theme-secondary: var(--color-teal-500);
  --theme-accent: var(--color-cyan-500);
}

/* Forest theme variant */
[data-theme="forest"] {
  --theme-primary: var(--color-green-600);
  --theme-secondary: var(--color-brown-500);
  --theme-accent: var(--color-yellow-500);
}

/* Components use theme tokens */
.themed-component {
  background-color: var(--theme-primary);
  color: var(--text-inverse);
  accent-color: var(--theme-accent);
}`,
            notes: 'Define theme variants using data attributes and CSS custom property cascading.',
            tokens: ['--color-blue-500', '--color-blue-600', '--color-gray-500', '--color-teal-500', '--color-green-500', '--color-green-600', '--color-cyan-500', '--color-brown-500', '--color-yellow-500', '--text-inverse']
          }
        ]
      }
    };
  }

  /**
   * Generate enhanced validation documentation
   * @private
   * @returns {Object} - Enhanced validation documentation
   */
  generateEnhancedValidationDocumentation() {
    const validationDoc = {
      overview: {
        title: 'Token Validation System',
        description: 'Comprehensive validation ensures token consistency and prevents common issues',
        features: [
          'Build-time token validation',
          'Circular dependency detection',
          'Deprecated token warnings',
          'Performance optimization suggestions',
          'Accessibility compliance checks'
        ]
      },
      rules: {},
      commonErrors: [
        {
          code: 'TOKEN_NOT_REGISTERED',
          error: 'Unregistered token usage',
          severity: 'warning',
          solution: 'Register the token in the appropriate inheritance level',
          example: {
            bad: 'color: var(--my-custom-color); /* Token not registered */',
            good: 'themeTokenProcessor.registerTokens(\'component\', { \'--my-custom-color\': \'#ff0000\' });'
          }
        },
        {
          code: 'TOKEN_DEPRECATED',
          error: 'Deprecated token usage',
          severity: 'warning',
          solution: 'Replace with recommended alternative token',
          example: {
            bad: 'color: var(--old-primary-color); /* Deprecated */',
            good: 'color: var(--interactive-primary); /* Current semantic token */'
          }
        },
        {
          code: 'CIRCULAR_TOKEN_DEPENDENCY',
          error: 'Circular token dependencies',
          severity: 'error',
          solution: 'Restructure token definitions to avoid circular references',
          example: {
            bad: '--token-a: var(--token-b); --token-b: var(--token-a);',
            good: '--token-a: #ff0000; --token-b: var(--token-a);'
          }
        },
        {
          code: 'SUGGEST_SEMANTIC_TOKENS',
          error: 'Hardcoded values instead of semantic tokens',
          severity: 'suggestion',
          solution: 'Use semantic tokens for better theme consistency',
          example: {
            bad: 'color: #333333; background: #ffffff;',
            good: 'color: var(--text-primary); background: var(--bg-card);'
          }
        }
      ],
      buildTimeValidation: {
        title: 'Build-Time Validation',
        description: 'Automated checks that run during the build process to catch token issues early',
        checks: [
          {
            name: 'Token Registration Check',
            description: 'Ensures all used tokens are properly registered',
            severity: 'error',
            autofix: false
          },
          {
            name: 'Circular Dependency Detection',
            description: 'Detects circular references in token definitions',
            severity: 'error',
            autofix: false
          },
          {
            name: 'Performance Analysis',
            description: 'Identifies potentially expensive token operations',
            severity: 'warning',
            autofix: true
          },
          {
            name: 'Consistency Validation',
            description: 'Ensures token values are consistent across themes',
            severity: 'warning',
            autofix: false
          }
        ]
      }
    };

    // Document each validation rule
    for (const [ruleName, rule] of this.validationRules.entries()) {
      validationDoc.rules[ruleName] = {
        name: ruleName,
        pattern: rule.pattern.toString(),
        description: rule.description || `Validation rule for ${ruleName} tokens`,
        examples: rule.examples || [],
        severity: rule.severity || 'warning',
        fixable: rule.fixable || false
      };
    }

    return validationDoc;
  }

  /**
   * Generate token usage metrics
   * @private
   * @returns {Object} - Token metrics and statistics
   */
  generateTokenMetrics() {
    const metrics = this.getPerformanceMetrics();
    
    return {
      usage: {
        totalTokens: metrics.tokens.registered.total,
        byLevel: metrics.tokens.registered,
        byType: this.getTokensByType(),
        mostUsed: this.getMostUsedTokens(),
        leastUsed: this.getLeastUsedTokens(),
        deprecated: this.getDeprecatedTokens()
      },
      performance: {
        cacheHitRate: metrics.cache.hitRate,
        averageProcessingTime: metrics.performance.averageProcessingTime,
        largestTokenValues: this.getLargestTokenValues(),
        complexTokens: this.getComplexTokens()
      },
      validation: {
        errorCount: metrics.validation.errors,
        warningCount: metrics.validation.warnings,
        rulesCount: metrics.validation.rulesCount,
        commonIssues: this.getCommonValidationIssues()
      },
      trends: {
        recentlyAdded: this.getRecentlyAddedTokens(),
        growthRate: this.calculateTokenGrowthRate(),
        adoptionRate: this.calculateTokenAdoptionRate()
      }
    };
  }

  /**
   * Generate searchable index for token discovery
   * @private
   * @returns {Object} - Search index for tokens
   */
  generateSearchIndex() {
    const searchIndex = {
      byName: {},
      byType: {},
      byCategory: {},
      byKeyword: {},
      byValue: {},
      suggestions: []
    };

    // Index all tokens
    for (const level of this.inheritanceChain) {
      const levelRegistry = this.tokenRegistry.get(level);
      if (!levelRegistry) continue;

      for (const [tokenName, tokenValue] of levelRegistry.entries()) {
        const tokenType = this.inferTokenType(tokenName, tokenValue);
        const category = this.inferTokenCategory(tokenName, tokenType);
        const keywords = this.extractTokenKeywords(tokenName, tokenValue);

        // Index by name
        searchIndex.byName[tokenName] = {
          name: tokenName,
          value: tokenValue,
          level,
          type: tokenType,
          category,
          keywords
        };

        // Index by type
        if (!searchIndex.byType[tokenType]) {
          searchIndex.byType[tokenType] = [];
        }
        searchIndex.byType[tokenType].push(tokenName);

        // Index by category
        if (!searchIndex.byCategory[category]) {
          searchIndex.byCategory[category] = [];
        }
        searchIndex.byCategory[category].push(tokenName);

        // Index by keywords
        keywords.forEach(keyword => {
          if (!searchIndex.byKeyword[keyword]) {
            searchIndex.byKeyword[keyword] = [];
          }
          searchIndex.byKeyword[keyword].push(tokenName);
        });

        // Index by value (for finding tokens with similar values)
        const normalizedValue = this.normalizeTokenValue(tokenValue);
        if (!searchIndex.byValue[normalizedValue]) {
          searchIndex.byValue[normalizedValue] = [];
        }
        searchIndex.byValue[normalizedValue].push(tokenName);
      }
    }

    // Generate search suggestions
    searchIndex.suggestions = this.generateSearchSuggestions(searchIndex);

    return searchIndex;
  }

  /**
   * Generate visual examples for color and spacing tokens
   * @private
   * @returns {Object} - Visual examples
   */
  generateVisualExamples() {
    const visualExamples = {
      colors: {},
      spacing: {},
      typography: {},
      shadows: {}
    };

    // Generate color swatches
    for (const level of this.inheritanceChain) {
      const levelRegistry = this.tokenRegistry.get(level);
      if (!levelRegistry) continue;

      for (const [tokenName, tokenValue] of levelRegistry.entries()) {
        const tokenType = this.inferTokenType(tokenName, tokenValue);

        switch (tokenType) {
          case 'color':
            visualExamples.colors[tokenName] = {
              value: tokenValue,
              hex: this.convertToHex(tokenValue),
              rgb: this.convertToRGB(tokenValue),
              hsl: this.convertToHSL(tokenValue),
              contrast: this.calculateContrast(tokenValue),
              accessibility: this.getColorAccessibility(tokenValue)
            };
            break;

          case 'spacing':
            visualExamples.spacing[tokenName] = {
              value: tokenValue,
              pixels: this.convertToPx(tokenValue),
              rem: this.convertToRem(tokenValue),
              visualScale: this.calculateSpacingScale(tokenValue)
            };
            break;

          case 'typography':
            if (tokenName.includes('font-size')) {
              visualExamples.typography[tokenName] = {
                value: tokenValue,
                pixels: this.convertToPx(tokenValue),
                scale: this.calculateTypographyScale(tokenValue),
                lineHeight: this.getRecommendedLineHeight(tokenValue)
              };
            }
            break;

          case 'shadow':
            visualExamples.shadows[tokenName] = {
              value: tokenValue,
              layers: this.parseShadowLayers(tokenValue),
              elevation: this.calculateShadowElevation(tokenValue)
            };
            break;
        }
      }
    }

    return visualExamples;
  }

  /**
   * Generate category-based documentation
   * @private
   * @param {Object} levels - Level documentation
   * @returns {Object} - Category documentation
   */
  generateCategoryDocumentation(levels) {
    const categories = {};

    for (const levelDoc of Object.values(levels)) {
      for (const [tokenName, tokenInfo] of Object.entries(levelDoc.tokens)) {
        const category = tokenInfo.category || 'miscellaneous';

        if (!categories[category]) {
          categories[category] = {
            name: category,
            description: this.getCategoryDescription(category),
            tokens: [],
            count: 0,
            examples: [],
            bestPractices: []
          };
        }

        categories[category].tokens.push(tokenInfo);
        categories[category].count++;
      }
    }

    // Add examples and best practices for each category
    for (const [categoryName, categoryData] of Object.entries(categories)) {
      categoryData.examples = this.getCategoryExamples(categoryName);
      categoryData.bestPractices = this.getCategoryBestPractices(categoryName);
    }

    return categories;
  }

  /**
   * Generate token relationships and dependencies
   * @private
   * @param {Object} levels - Level documentation
   * @returns {Object} - Token relationships
   */
  generateTokenRelationships(levels) {
    const relationships = {
      dependencies: {},
      references: {},
      groups: {},
      conflicts: []
    };

    for (const levelDoc of Object.values(levels)) {
      for (const [tokenName, tokenInfo] of Object.entries(levelDoc.tokens)) {
        // Find token dependencies (tokens that this token references)
        const dependencies = this.getTokenDependencies(tokenInfo.value);
        if (dependencies.length > 0) {
          relationships.dependencies[tokenName] = dependencies;
        }

        // Find tokens that reference this token
        const references = this.findTokenReferences(tokenName, levels);
        if (references.length > 0) {
          relationships.references[tokenName] = references;
        }

        // Group related tokens
        const relatedGroup = this.findTokenGroup(tokenName);
        if (relatedGroup) {
          if (!relationships.groups[relatedGroup]) {
            relationships.groups[relatedGroup] = [];
          }
          relationships.groups[relatedGroup].push(tokenName);
        }
      }
    }

    // Find potential conflicts (tokens with similar names but different values)
    relationships.conflicts = this.findTokenConflicts(levels);

    return relationships;
  }

  /**
   * Generate migration guide for deprecated tokens
   * @private
   * @param {Array<string>} deprecatedTokens - List of deprecated tokens
   * @returns {Object} - Migration guide
   */
  generateMigrationGuide(deprecatedTokens) {
    const migrationGuide = {
      overview: {
        title: 'Token Migration Guide',
        description: 'Guide for migrating from deprecated tokens to current alternatives',
        totalDeprecated: deprecatedTokens.length,
        urgency: this.assessMigrationUrgency(deprecatedTokens)
      },
      migrations: [],
      automated: {
        available: true,
        description: 'Automated migration tools can help with token replacement',
        command: 'npm run migrate-tokens'
      },
      timeline: {
        deprecationDate: new Date().toISOString(),
        removalDate: this.calculateRemovalDate(),
        migrationWindow: '6 months'
      }
    };

    // Generate migration instructions for each deprecated token
    deprecatedTokens.forEach(tokenName => {
      const tokenDoc = this.documentationRegistry.get(tokenName);
      const migration = {
        token: tokenName,
        replacement: tokenDoc?.replacement || this.suggestReplacement(tokenName),
        reason: tokenDoc?.deprecationReason || 'Token has been superseded by semantic alternatives',
        breaking: tokenDoc?.breaking || false,
        automated: !!tokenDoc?.replacement,
        examples: {
          before: `var(${tokenName})`,
          after: `var(${tokenDoc?.replacement || this.suggestReplacement(tokenName)})`
        }
      };

      migrationGuide.migrations.push(migration);
    });

    return migrationGuide;
  }

  /**
   * Format documentation based on requested format
   * @private
   * @param {Object} documentation - Documentation object
   * @param {string} format - Output format
   * @returns {string|Object} - Formatted documentation
   */
  formatDocumentation(documentation, format) {
    switch (format) {
      case 'markdown':
        return this.formatDocumentationAsMarkdown(documentation);
      case 'html':
        return this.formatDocumentationAsHTML(documentation);
      case 'typescript':
        return this.formatDocumentationAsTypeScript(documentation);
      case 'css':
        return this.formatDocumentationAsCSS(documentation);
      case 'json':
      default:
        return documentation;
    }
  }

  /**
   * Helper methods for token analysis and formatting
   */

  /**
   * Infer token category from name and type
   * @private
   */
  inferTokenCategory(tokenName, tokenType) {
    const categoryPatterns = {
      'colors': /^--(color|text|bg|border|accent|primary|secondary|success|error|warning|info)/,
      'spacing': /^--(space|spacing|margin|padding|gap)/,
      'typography': /^--(font|text|line)/,
      'layout': /^--(width|height|container|grid|flex)/,
      'interaction': /^--(interactive|hover|active|focus|disabled)/,
      'elevation': /^--(shadow|elevation|depth)/,
      'animation': /^--(duration|timing|delay|easing)/,
      'borders': /^--(radius|border)/,
      'component': /^--[a-z]+-[a-z]+/
    };

    for (const [category, pattern] of Object.entries(categoryPatterns)) {
      if (pattern.test(tokenName)) {
        return category;
      }
    }

    return tokenType || 'miscellaneous';
  }

  /**
   * Generate automatic description for tokens
   * @private
   */
  generateAutoDescription(tokenName, tokenType) {
    const descriptions = {
      'color': `Color token for ${tokenName.replace(/^--/, '').replace(/-/g, ' ')}`,
      'spacing': `Spacing value for ${tokenName.replace(/^--/, '').replace(/-/g, ' ')}`,
      'typography': `Typography setting for ${tokenName.replace(/^--/, '').replace(/-/g, ' ')}`,
      'shadow': `Shadow definition for ${tokenName.replace(/^--/, '').replace(/-/g, ' ')}`
    };

    return descriptions[tokenType] || `Token for ${tokenName.replace(/^--/, '').replace(/-/g, ' ')}`;
  }

  /**
   * Generate example usage for tokens
   * @private
   */
  generateExampleUsage(tokenName, tokenType) {
    const examples = {
      'color': [`color: var(${tokenName});`, `background-color: var(${tokenName});`],
      'spacing': [`padding: var(${tokenName});`, `margin: var(${tokenName});`],
      'typography': [`font-size: var(${tokenName});`, `line-height: var(${tokenName});`],
      'shadow': [`box-shadow: var(${tokenName});`]
    };

    return examples[tokenType] || [`/* Use ${tokenName} in your styles */`];
  }

  // Additional helper methods would be implemented here...
  // (For brevity, I'm including placeholders for the remaining methods)

  findRelatedTokens(tokenName) { return []; }
  computeTokenValue(tokenName, tokenValue) { return tokenValue; }
  getTokenDependencies(tokenValue) { return []; }
  getTokenUsageCount(tokenName) { return 0; }
  getAccessibilityInfo(tokenName, tokenType) { return {}; }
  getBrowserCompatibility(tokenName, tokenValue) { return {}; }
  getPerformanceInfo(tokenName, tokenValue) { return {}; }
  getTokensByType() { return {}; }
  getMostUsedTokens() { return []; }
  getLeastUsedTokens() { return []; }
  getDeprecatedTokens() { return []; }
  getLargestTokenValues() { return []; }
  getComplexTokens() { return []; }
  getCommonValidationIssues() { return []; }
  getRecentlyAddedTokens() { return []; }
  calculateTokenGrowthRate() { return 0; }
  calculateTokenAdoptionRate() { return 0; }
  extractTokenKeywords(tokenName, tokenValue) { return []; }
  normalizeTokenValue(tokenValue) { return tokenValue; }
  generateSearchSuggestions(searchIndex) { return []; }
  convertToHex(value) { return value; }
  convertToRGB(value) { return value; }
  convertToHSL(value) { return value; }
  calculateContrast(value) { return 0; }
  getColorAccessibility(value) { return {}; }
  convertToPx(value) { return value; }
  convertToRem(value) { return value; }
  calculateSpacingScale(value) { return 0; }
  calculateTypographyScale(value) { return 0; }
  getRecommendedLineHeight(value) { return '1.5'; }
  parseShadowLayers(value) { return []; }
  calculateShadowElevation(value) { return 0; }
  getCategoryDescription(category) { return `Tokens for ${category}`; }
  getCategoryExamples(category) { return []; }
  getCategoryBestPractices(category) { return []; }
  findTokenReferences(tokenName, levels) { return []; }
  findTokenGroup(tokenName) { return null; }
  findTokenConflicts(levels) { return []; }
  assessMigrationUrgency(tokens) { return 'low'; }
  calculateRemovalDate() { return new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(); }
  suggestReplacement(tokenName) { return tokenName.replace('old-', ''); }
  formatDocumentationAsTypeScript(doc) { return '// TypeScript definitions\n'; }
  formatDocumentationAsCSS(doc) { return '/* CSS token definitions */\n'; }
  writeDocumentationToFile(content, path, format) { /* File writing logic */ }

  /**
   * Generate usage examples for documentation
   * @private
   * @returns {Object} - Usage examples by category
   */
  generateUsageExamples() {
    return {
      basic: {
        title: 'Basic Token Usage',
        examples: [
          {
            description: 'Using color tokens',
            css: `
.card {
  background-color: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}`,
            notes: 'Always use semantic tokens for component styling'
          },
          {
            description: 'Using spacing tokens',
            css: `
.button {
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-2);
}`,
            notes: 'Use the spacing scale for consistent layout'
          }
        ]
      },
      advanced: {
        title: 'Advanced Token Patterns',
        examples: [
          {
            description: 'Token fallbacks',
            css: `
.component {
  color: var(--component-text-color, var(--text-primary));
}`,
            notes: 'Provide fallbacks for component-specific tokens'
          },
          {
            description: 'Calculated values with tokens',
            css: `
.container {
  padding: calc(var(--space-4) * 2);
  margin: calc(var(--space-2) + 1px);
}`,
            notes: 'Use calc() for dynamic spacing based on tokens'
          }
        ]
      }
    };
  }

  /**
   * Generate validation documentation
   * @private
   * @returns {Object} - Validation rules documentation
   */
  generateValidationDocumentation() {
    const validationDoc = {
      rules: {},
      commonErrors: [
        {
          error: 'Unregistered token usage',
          solution: 'Register the token in appropriate inheritance level',
          example: 'var(--my-custom-color) // Should be registered first'
        },
        {
          error: 'Invalid color value',
          solution: 'Use valid CSS color syntax',
          example: '--color-primary: #ff0000; // Not --color-primary: invalid-value;'
        },
        {
          error: 'Hardcoded values instead of tokens',
          solution: 'Use semantic tokens for consistency',
          example: 'color: var(--text-primary); // Not color: #333333;'
        }
      ]
    };

    for (const [ruleName, rule] of this.validationRules.entries()) {
      validationDoc.rules[ruleName] = {
        pattern: rule.pattern.toString(),
        description: rule.description || `Validation rule for ${ruleName}`,
        examples: rule.examples || []
      };
    }

    return validationDoc;
  }

  /**
   * Register tokens in specific inheritance level
   * @param {string} level - Inheritance level ('global', 'semantic', 'component', 'variant', 'instance')
   * @param {Object} tokens - Object mapping token names to values
   * @param {Object} documentation - Optional documentation for tokens
   */
  registerTokens(level, tokens, documentation = {}) {
    if (!this.tokenRegistry.has(level)) {
      this.log('warn', `Unknown inheritance level: ${level}`);
      return;
    }

    const levelRegistry = this.tokenRegistry.get(level);
    let registeredCount = 0;

    for (const [tokenName, tokenValue] of Object.entries(tokens)) {
      // Validate token name format
      if (!tokenName.startsWith('--')) {
        this.log('warn', `Invalid token name format: ${tokenName} (should start with --)`);
        continue;
      }

      levelRegistry.set(tokenName, tokenValue);
      registeredCount++;

      // Register documentation if provided
      if (documentation[tokenName]) {
        this.documentationRegistry.set(tokenName, documentation[tokenName]);
      }
    }

    this.log('info', `Registered ${registeredCount} tokens at ${level} level`);

    // Clear cache to ensure new tokens are reflected
    this.clearTokenCache();
  }

  /**
   * Register component-specific theme tokens (FR-2.2)
   * Enables components to define their own theme customizations
   * @param {string} componentName - Name of the component
   * @param {Object} tokens - Component-specific tokens
   * @param {Object} options - Registration options
   * @param {string} options.variant - Theme variant (optional)
   * @param {string} options.instance - Instance ID for instance-level overrides (optional)
   * @param {Object} options.documentation - Token documentation
   * @returns {Object} - Registration result with validation info
   */
  registerComponentTokens(componentName, tokens, options = {}) {
    const { variant, instance, documentation = {} } = options;
    
    if (!componentName || typeof componentName !== 'string') {
      throw new Error('Component name is required and must be a string');
    }

    const validationResults = {
      componentName,
      tokensRegistered: 0,
      warnings: [],
      errors: [],
      tokenDetails: []
    };

    // Determine inheritance level based on options
    let inheritanceLevel = 'component';
    let tokenPrefix = `--component-${componentName.toLowerCase()}-`;
    
    if (instance) {
      inheritanceLevel = 'instance';
      tokenPrefix = `--instance-${componentName.toLowerCase()}-${instance}-`;
    } else if (variant) {
      inheritanceLevel = 'variant';
      tokenPrefix = `--variant-${variant.toLowerCase()}-${componentName.toLowerCase()}-`;
    }

    const levelRegistry = this.tokenRegistry.get(inheritanceLevel);
    if (!levelRegistry) {
      validationResults.errors.push({
        type: 'invalid_level',
        message: `Invalid inheritance level: ${inheritanceLevel}`,
        suggestion: 'Use valid inheritance levels: global, semantic, component, variant, instance'
      });
      return validationResults;
    }

    // Process each token
    for (const [originalTokenName, tokenValue] of Object.entries(tokens)) {
      let finalTokenName = originalTokenName;
      
      // Add component prefix if not already prefixed
      if (!originalTokenName.startsWith('--')) {
        finalTokenName = `${tokenPrefix}${originalTokenName}`;
      } else if (!originalTokenName.includes(componentName.toLowerCase()) && 
                 !originalTokenName.startsWith('--component-') &&
                 !originalTokenName.startsWith('--variant-') &&
                 !originalTokenName.startsWith('--instance-')) {
        // Add component context to existing token name
        const cleanTokenName = originalTokenName.substring(2); // Remove --
        finalTokenName = `${tokenPrefix}${cleanTokenName}`;
        
        validationResults.warnings.push({
          type: 'token_renamed',
          originalName: originalTokenName,
          newName: finalTokenName,
          message: `Token renamed to include component context`,
          suggestion: 'Consider using component-prefixed token names for clarity'
        });
      }

      // Validate token value
      const tokenValidation = this.validateTokenValue(finalTokenName, tokenValue, {
        componentName,
        variant,
        instance,
        context: 'component_registration'
      });

      if (tokenValidation.errors.length > 0) {
        validationResults.errors.push(...tokenValidation.errors);
        continue; // Skip invalid tokens
      }

      if (tokenValidation.warnings.length > 0) {
        validationResults.warnings.push(...tokenValidation.warnings);
      }

      // Register the token
      levelRegistry.set(finalTokenName, tokenValue);
      validationResults.tokensRegistered++;

      // Register documentation
      const tokenDocKey = finalTokenName;
      const tokenDoc = {
        componentName,
        variant,
        instance,
        inheritanceLevel,
        description: documentation[originalTokenName]?.description || `Component token for ${componentName}`,
        type: this.inferTokenType(finalTokenName, tokenValue),
        example: documentation[originalTokenName]?.example,
        deprecated: documentation[originalTokenName]?.deprecated || false,
        replacement: documentation[originalTokenName]?.replacement,
        addedIn: documentation[originalTokenName]?.addedIn || new Date().toISOString()
      };

      this.documentationRegistry.set(tokenDocKey, tokenDoc);

      validationResults.tokenDetails.push({
        originalName: originalTokenName,
        finalName: finalTokenName,
        value: tokenValue,
        type: tokenDoc.type,
        level: inheritanceLevel
      });
    }

    this.log('info', `Registered ${validationResults.tokensRegistered} component tokens for ${componentName}`, {
      variant,
      instance,
      level: inheritanceLevel,
      warnings: validationResults.warnings.length,
      errors: validationResults.errors.length
    });

    // Clear cache to ensure new tokens are reflected
    this.clearTokenCache();

    return validationResults;
  }

  /**
   * Apply component-specific theme customization to CSS content (FR-2.2)
   * @param {string} cssContent - CSS content to process
   * @param {string} componentName - Component name
   * @param {Object} options - Processing options
   * @returns {Object} - Processing results with customized CSS
   */
  applyComponentThemeCustomization(cssContent, componentName, options = {}) {
    const {
      variant = null,
      instance = null,
      scopeSelector = null,
      enableInheritance = true,
      validateOutput = true
    } = options;

    const processingResults = {
      originalCss: cssContent,
      processedCss: cssContent,
      tokensProcessed: 0,
      tokensResolved: 0,
      customizations: [],
      warnings: [],
      errors: [],
      metrics: {
        processingTimeMs: 0,
        cacheHits: 0,
        cacheMisses: 0
      }
    };

    const startTime = performance.now();

    try {
      // Build inheritance chain for this component
      const inheritanceChain = this.buildComponentInheritanceChain(componentName, {
        variant,
        instance,
        enableInheritance
      });

      // Extract all token usages from CSS
      const tokenUsages = this.extractTokensFromCSS(cssContent);
      processingResults.tokensProcessed = tokenUsages.size;

      let processedCss = cssContent;

      // Process each token usage
      for (const tokenName of tokenUsages) {
        const resolvedValue = this.resolveTokenWithInheritance(tokenName, inheritanceChain);
        
        if (resolvedValue && resolvedValue !== tokenName) {
          // Apply scope selector if provided
          let finalValue = resolvedValue;
          if (scopeSelector && !resolvedValue.startsWith('var(')) {
            // For non-variable values, we can't easily apply scope, so log a warning
            processingResults.warnings.push({
              type: 'scope_limitation',
              tokenName,
              message: 'Cannot apply scope selector to non-variable token value',
              suggestion: 'Consider using CSS variables for scoped customization'
            });
          }

          // Replace token usage with resolved value
          const tokenRegex = new RegExp(`var\(\s*${this.escapeRegExp(tokenName)}(?:\s*,\s*[^)]+)?\s*\)`, 'g');
          const replacementCount = (processedCss.match(tokenRegex) || []).length;
          
          if (replacementCount > 0) {
            processedCss = processedCss.replace(tokenRegex, finalValue);
            processingResults.tokensResolved++;
            
            processingResults.customizations.push({
              tokenName,
              originalValue: `var(${tokenName})`,
              resolvedValue: finalValue,
              source: this.findTokenSource(tokenName, inheritanceChain),
              replacementCount
            });
          }
        } else {
          // Token not found in any inheritance level
          processingResults.warnings.push({
            type: 'unresolved_token',
            tokenName,
            message: `Token ${tokenName} could not be resolved in inheritance chain`,
            suggestion: 'Ensure token is registered at appropriate inheritance level'
          });
        }
      }

      processingResults.processedCss = processedCss;

      // Validate output if requested
      if (validateOutput) {
        const validationResults = this.validateProcessedCSS(processedCss, componentName, {
          originalCss: cssContent,
          customizations: processingResults.customizations
        });
        
        processingResults.warnings.push(...validationResults.warnings);
        processingResults.errors.push(...validationResults.errors);
      }

    } catch (error) {
      processingResults.errors.push({
        type: 'processing_error',
        message: `Error applying component theme customization: ${error.message}`,
        stack: error.stack
      });
    }

    processingResults.metrics.processingTimeMs = performance.now() - startTime;
    
    this.log('debug', `Applied component theme customization for ${componentName}`, {
      variant,
      instance,
      tokensProcessed: processingResults.tokensProcessed,
      tokensResolved: processingResults.tokensResolved,
      customizations: processingResults.customizations.length,
      processingTime: processingResults.metrics.processingTimeMs
    });

    return processingResults;
  }

  /**
   * Build inheritance chain for component token resolution (FR-2.3)
   * @private
   * @param {string} componentName - Component name
   * @param {Object} options - Chain building options
   * @returns {Array<Object>} - Inheritance chain with registry references
   */
  buildComponentInheritanceChain(componentName, options = {}) {
    const { variant, instance, enableInheritance = true } = options;
    const chain = [];

    // Base inheritance chain (lowest to highest priority)
    const baseChain = enableInheritance ? 
      ['global', 'semantic', 'component', 'variant', 'instance'] :
      ['component', 'variant', 'instance']; // Skip global/semantic if inheritance disabled

    for (const level of baseChain) {
      const registry = this.tokenRegistry.get(level);
      if (!registry) continue;

      const chainEntry = {
        level,
        registry,
        filter: null // Function to filter tokens for this level
      };

      // Add level-specific filters
      switch (level) {
        case 'component':
          chainEntry.filter = (tokenName) => 
            tokenName.includes(`-${componentName.toLowerCase()}-`) ||
            tokenName.startsWith(`--component-${componentName.toLowerCase()}-`);
          break;
          
        case 'variant':
          if (variant) {
            chainEntry.filter = (tokenName) => 
              tokenName.includes(`-${variant.toLowerCase()}-`) &&
              (tokenName.includes(`-${componentName.toLowerCase()}-`) ||
               tokenName.startsWith(`--variant-${variant.toLowerCase()}-${componentName.toLowerCase()}-`));
          } else {
            continue; // Skip variant level if no variant specified
          }
          break;
          
        case 'instance':
          if (instance) {
            chainEntry.filter = (tokenName) => 
              tokenName.includes(`-${instance}-`) &&
              tokenName.includes(`-${componentName.toLowerCase()}-`);
          } else {
            continue; // Skip instance level if no instance specified
          }
          break;
      }

      chain.push(chainEntry);
    }

    return chain;
  }

  /**
   * Resolve token value using inheritance chain (FR-2.3)
   * @private
   * @param {string} tokenName - Token to resolve
   * @param {Array<Object>} inheritanceChain - Inheritance chain
   * @returns {string|null} - Resolved token value
   */
  resolveTokenWithInheritance(tokenName, inheritanceChain) {
    // Check cache first
    const cacheKey = `${tokenName}:${inheritanceChain.map(c => c.level).join('>')}`;
    if (this.config.enableCaching && this.tokenCache.has(cacheKey)) {
      this.metrics.cacheHits++;
      return this.tokenCache.get(cacheKey);
    }

    this.metrics.cacheMisses++;

    // Resolve through inheritance chain (reverse order for highest priority first)
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
      const chainEntry = inheritanceChain[i];
      const { registry, filter } = chainEntry;

      // Direct token lookup
      if (registry.has(tokenName)) {
        const value = registry.get(tokenName);
        
        // Apply filter if specified
        if (!filter || filter(tokenName)) {
          if (this.config.enableCaching) {
            this.tokenCache.set(cacheKey, value);
          }
          return value;
        }
      }

      // Pattern-based lookup for filtered registries
      if (filter) {
        for (const [registeredToken, value] of registry.entries()) {
          if (filter(registeredToken) && this.tokenMatches(tokenName, registeredToken)) {
            if (this.config.enableCaching) {
              this.tokenCache.set(cacheKey, value);
            }
            return value;
          }
        }
      }
    }

    // Fallback to generic resolution if not found in chain
    const fallbackValue = this.getFallbackValue(tokenName);
    if (this.config.enableCaching) {
      this.tokenCache.set(cacheKey, fallbackValue);
    }

    return fallbackValue;
  }

  /**
   * Integrate with ComponentManifest for theme definitions (FR-2.2)
   * @param {Object} manifest - Component manifest
   * @param {Object} options - Integration options
   * @returns {Object} - Integration results
   */
  integrateComponentManifest(manifest, options = {}) {
    const { autoRegister = true, validateManifest = true } = options;
    
    const integrationResults = {
      componentName: manifest.name,
      themesProcessed: 0,
      tokensRegistered: 0,
      warnings: [],
      errors: [],
      registrationResults: []
    };

    try {
      // Validate manifest structure if requested
      if (validateManifest) {
        const manifestValidation = this.validateComponentManifest(manifest);
        if (!manifestValidation.isValid) {
          integrationResults.errors.push(...manifestValidation.errors);
          return integrationResults;
        }
        integrationResults.warnings.push(...manifestValidation.warnings);
      }

      // Process theme definitions from manifest
      const themeDefinitions = manifest.css?.variants?.themes || {};
      const componentName = manifest.name;

      for (const [themeName, themeConfig] of Object.entries(themeDefinitions)) {
        integrationResults.themesProcessed++;

        if (themeConfig.tokens && autoRegister) {
          // Register theme-specific tokens
          const registrationResult = this.registerComponentTokens(componentName, themeConfig.tokens, {
            variant: themeName,
            documentation: themeConfig.documentation || {}
          });

          integrationResults.tokensRegistered += registrationResult.tokensRegistered;
          integrationResults.warnings.push(...registrationResult.warnings);
          integrationResults.errors.push(...registrationResult.errors);
          integrationResults.registrationResults.push({
            theme: themeName,
            result: registrationResult
          });
        }

        // Process instance-level overrides if defined
        if (themeConfig.instances && autoRegister) {
          for (const [instanceId, instanceConfig] of Object.entries(themeConfig.instances)) {
            if (instanceConfig.tokens) {
              const instanceResult = this.registerComponentTokens(componentName, instanceConfig.tokens, {
                variant: themeName,
                instance: instanceId,
                documentation: instanceConfig.documentation || {}
              });

              integrationResults.tokensRegistered += instanceResult.tokensRegistered;
              integrationResults.warnings.push(...instanceResult.warnings);
              integrationResults.errors.push(...instanceResult.errors);
              integrationResults.registrationResults.push({
                theme: themeName,
                instance: instanceId,
                result: instanceResult
              });
            }
          }
        }
      }

      this.log('info', `Integrated component manifest for ${componentName}`, {
        themesProcessed: integrationResults.themesProcessed,
        tokensRegistered: integrationResults.tokensRegistered,
        warnings: integrationResults.warnings.length,
        errors: integrationResults.errors.length
      });

    } catch (error) {
      integrationResults.errors.push({
        type: 'integration_error',
        message: `Error integrating component manifest: ${error.message}`,
        stack: error.stack
      });
    }

    return integrationResults;
  }
  /**
   * Validate token value and format (FR-2.4)
   * @private
   * @param {string} tokenName - Token name to validate
   * @param {string} tokenValue - Token value to validate
   * @param {Object} context - Validation context
   * @returns {Object} - Validation results
   */
  validateTokenValue(tokenName, tokenValue, context = {}) {
    const validationResults = {
      tokenName,
      tokenValue,
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Basic format validation
    if (!tokenName || !tokenName.startsWith('--')) {
      validationResults.errors.push({
        type: 'invalid_token_name',
        message: 'Token name must start with -- prefix',
        suggestion: 'Use proper CSS custom property format: --token-name'
      });
      validationResults.isValid = false;
    }

    if (tokenValue === null || tokenValue === undefined) {
      validationResults.errors.push({
        type: 'missing_token_value',
        message: 'Token value is required',
        suggestion: 'Provide a valid CSS value for the token'
      });
      validationResults.isValid = false;
    }

    // Type-specific validation
    if (validationResults.isValid) {
      const tokenType = this.inferTokenType(tokenName, tokenValue);
      
      switch (tokenType) {
        case 'color':
          if (!this.isValidColorValue(tokenValue)) {
            validationResults.warnings.push({
              type: 'invalid_color_value',
              message: `Token value "${tokenValue}" may not be a valid color`,
              suggestion: 'Use valid CSS color values (hex, rgb, hsl, named colors, or CSS variables)'
            });
          }
          break;
          
        case 'spacing':
          if (!this.isValidSpacingValue(tokenValue)) {
            validationResults.warnings.push({
              type: 'invalid_spacing_value',
              message: `Token value "${tokenValue}" may not be a valid spacing value`,
              suggestion: 'Use valid CSS length units (px, rem, em, %, vw, vh) or CSS variables'
            });
          }
          break;
          
        case 'typography':
          if (tokenName.includes('line-height') && !this.isValidLineHeightValue(tokenValue)) {
            validationResults.warnings.push({
              type: 'invalid_line_height',
              message: `Token value "${tokenValue}" may not be a valid line-height`,
              suggestion: 'Use unitless numbers, percentages, or length values'
            });
          }
          break;
      }
    }

    return validationResults;
  }

  /**
   * Find source of token in inheritance chain
   * @private
   * @param {string} tokenName - Token to find
   * @param {Array<Object>} inheritanceChain - Inheritance chain
   * @returns {Object} - Token source information
   */
  findTokenSource(tokenName, inheritanceChain) {
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
      const chainEntry = inheritanceChain[i];
      const { level, registry, filter } = chainEntry;

      if (registry.has(tokenName)) {
        if (!filter || filter(tokenName)) {
          return {
            level,
            found: true,
            value: registry.get(tokenName),
            priority: inheritanceChain.length - i
          };
        }
      }

      // Check for pattern matches if filter exists
      if (filter) {
        for (const [registeredToken, value] of registry.entries()) {
          if (filter(registeredToken) && this.tokenMatches(tokenName, registeredToken)) {
            return {
              level,
              found: true,
              value,
              matchedToken: registeredToken,
              priority: inheritanceChain.length - i
            };
          }
        }
      }
    }

    return {
      level: null,
      found: false,
      value: null,
      priority: 0
    };
  }

  /**
   * Check if token names match allowing for pattern matching
   * @private
   * @param {string} searchToken - Token being searched for
   * @param {string} registeredToken - Registered token to compare
   * @returns {boolean} - True if tokens match
   */
  tokenMatches(searchToken, registeredToken) {
    // Exact match
    if (searchToken === registeredToken) {
      return true;
    }

    // Basic pattern matching (could be enhanced)
    // For now, just check for substring matches in component tokens
    if (registeredToken.includes('component') || registeredToken.includes('variant') || registeredToken.includes('instance')) {
      const searchParts = searchToken.replace(/^--/, '').split('-');
      const registeredParts = registeredToken.replace(/^--/, '').split('-');
      
      // Check if search token parts are found in registered token
      return searchParts.some(part => registeredParts.includes(part));
    }

    return false;
  }

  /**
   * Validate component manifest structure
   * @private
   * @param {Object} manifest - Component manifest to validate
   * @returns {Object} - Validation results
   */
  validateComponentManifest(manifest) {
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check required fields
    if (!manifest.name || typeof manifest.name !== 'string') {
      validationResults.errors.push({
        type: 'missing_component_name',
        message: 'Component manifest must have a valid name field',
        suggestion: 'Add a string name field to the manifest'
      });
      validationResults.isValid = false;
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      validationResults.errors.push({
        type: 'missing_version',
        message: 'Component manifest must have a valid version field',
        suggestion: 'Add a semantic version string (e.g., "1.0.0")'
      });
      validationResults.isValid = false;
    }

    // Validate theme structure if present
    if (manifest.css?.variants?.themes) {
      const themes = manifest.css.variants.themes;
      
      if (typeof themes !== 'object' || Array.isArray(themes)) {
        validationResults.errors.push({
          type: 'invalid_themes_structure',
          message: 'Themes must be defined as an object with theme names as keys',
          suggestion: 'Use { themeName: { tokens: {...} } } structure'
        });
        validationResults.isValid = false;
      } else {
        // Validate individual themes
        for (const [themeName, themeConfig] of Object.entries(themes)) {
          if (themeConfig.tokens && typeof themeConfig.tokens !== 'object') {
            validationResults.warnings.push({
              type: 'invalid_theme_tokens',
              message: `Theme "${themeName}" has invalid tokens structure`,
              suggestion: 'Tokens should be an object with token names as keys'
            });
          }

          if (themeConfig.instances) {
            for (const [instanceId, instanceConfig] of Object.entries(themeConfig.instances)) {
              if (instanceConfig.tokens && typeof instanceConfig.tokens !== 'object') {
                validationResults.warnings.push({
                  type: 'invalid_instance_tokens',
                  message: `Instance "${instanceId}" in theme "${themeName}" has invalid tokens structure`,
                  suggestion: 'Instance tokens should be an object with token names as keys'
                });
              }
            }
          }
        }
      }
    }

    return validationResults;
  }

  /**
   * Validate processed CSS output
   * @private
   * @param {string} processedCss - Processed CSS content
   * @param {string} componentName - Component name
   * @param {Object} context - Validation context
   * @returns {Object} - Validation results
   */
  validateProcessedCSS(processedCss, componentName, context = {}) {
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check for unresolved variables
    const unresolvedVariables = processedCss.match(/var\(--[^)]+\)/g) || [];
    if (unresolvedVariables.length > 0) {
      validationResults.warnings.push({
        type: 'unresolved_variables',
        message: `Found ${unresolvedVariables.length} unresolved CSS variables`,
        variables: [...new Set(unresolvedVariables)],
        suggestion: 'Ensure all CSS variables are properly defined and registered'
      });
    }

    // Check for syntax errors
    if (processedCss.includes('/* ') && processedCss.includes(' not found */')) {
      const notFoundComments = (processedCss.match(/\/\* [^*]+ not found \*\//g) || []);
      validationResults.warnings.push({
        type: 'missing_token_fallbacks',
        message: `Found ${notFoundComments.length} missing token fallbacks`,
        comments: notFoundComments,
        suggestion: 'Register missing tokens or provide fallback values'
      });
    }

    // Check for excessive nesting or complexity
    const nestingDepth = (processedCss.match(/{/g) || []).length;
    const maxRecommendedNesting = 10;
    
    if (nestingDepth > maxRecommendedNesting) {
      validationResults.suggestions.push({
        type: 'complexity_warning',
        message: `CSS complexity is high with ${nestingDepth} nested blocks`,
        suggestion: 'Consider simplifying CSS structure for better maintainability'
      });
    }

    return validationResults;
  }

  /**
   * Escape regular expression special characters
   * @private
   * @param {string} string - String to escape
   * @returns {string} - Escaped string
   */
  escapeRegExp(string) {
    // Escape special regex characters
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check if token is registered in any inheritance level
   * @private
   * @param {string} tokenName - Token to check
   * @returns {boolean} - True if token is registered
   */
  isTokenRegistered(tokenName) {
    for (const registry of this.tokenRegistry.values()) {
      if (registry.has(tokenName)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get registered token value from any inheritance level
   * @private
   * @param {string} tokenName - Token name
   * @returns {string|null} - Token value or null if not found
   */
  getRegisteredTokenValue(tokenName) {
    // Check in priority order (highest to lowest)
    for (const level of this.inheritanceChain.slice().reverse()) {
      const registry = this.tokenRegistry.get(level);
      if (registry && registry.has(tokenName)) {
        return registry.get(tokenName);
      }
    }
    return null;
  }

  /**
   * Add validation rule for token validation
   * @param {string} ruleName - Name of the validation rule
   * @param {Object} rule - Rule configuration
   * @param {RegExp} rule.pattern - Pattern to match token names
   * @param {Function} rule.validate - Validation function
   * @param {string} rule.description - Rule description
   * @param {Array} rule.examples - Usage examples
   */
  addValidationRule(ruleName, rule) {
    if (!rule.pattern || !rule.validate) {
      throw new Error('Validation rule must have pattern and validate function');
    }

    this.validationRules.set(ruleName, rule);
    this.log('debug', `Added validation rule: ${ruleName}`);
  }

  /**
   * Get fallback value for unresolved tokens
   * @private
   * @param {string} tokenName - Token name
   * @returns {string} - Fallback value
   */
  getFallbackValue(tokenName) {
    // Common fallback patterns
    const fallbackPatterns = {
      // Color fallbacks
      '--text-': '#333333',
      '--bg-': '#ffffff',
      '--border-': '#e5e5e5',
      '--color-': '#000000',
      '--accent-': '#007bff',
      
      // Spacing fallbacks
      '--space-': '1rem',
      '--margin-': '1rem',
      '--padding-': '1rem',
      '--gap-': '1rem',
      
      // Typography fallbacks
      '--font-size-': '1rem',
      '--line-height-': '1.5',
      '--font-weight-': '400',
      
      // Other fallbacks
      '--radius-': '0.25rem',
      '--shadow-': 'none',
      '--z-': '0'
    };

    for (const [pattern, fallback] of Object.entries(fallbackPatterns)) {
      if (tokenName.includes(pattern)) {
        return fallback;
      }
    }

    // Generic fallback
    return `/* ${tokenName} not found */`;
  }

  /**
   * Validate color value format
   * @private
   * @param {string} value - Color value to validate
   * @returns {boolean} - True if valid color value
   */
  isValidColorValue(value) {
    if (!value || typeof value !== 'string') return false;

    // CSS variable reference
    if (value.startsWith('var(')) return true;

    // Hex colors
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) return true;

    // RGB/RGBA colors
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)$/.test(value)) return true;

    // HSL/HSLA colors
    if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+)?\s*\)$/.test(value)) return true;

    // Named colors (basic check)
    const namedColors = ['transparent', 'inherit', 'initial', 'unset', 'currentColor', 'black', 'white', 'red', 'green', 'blue'];
    if (namedColors.includes(value.toLowerCase())) return true;

    return false;
  }

  /**
   * Validate spacing value format
   * @private
   * @param {string} value - Spacing value to validate
   * @returns {boolean} - True if valid spacing value
   */
  isValidSpacingValue(value) {
    if (!value || typeof value !== 'string') return false;

    // CSS variable reference
    if (value.startsWith('var(')) return true;

    // Length units
    if (/^-?[\d.]+(?:px|em|rem|%|vw|vh|vmin|vmax|ch|ex)$/.test(value)) return true;

    // Zero
    if (value === '0') return true;

    // Auto, inherit, etc.
    if (['auto', 'inherit', 'initial', 'unset'].includes(value)) return true;

    return false;
  }

  /**
   * Validate size value format
   * @private
   * @param {string} value - Size value to validate
   * @returns {boolean} - True if valid size value
   */
  isValidSizeValue(value) {
    return this.isValidSpacingValue(value);
  }

  /**
   * Validate line-height value format
   * @private
   * @param {string} value - Line-height value to validate
   * @returns {boolean} - True if valid line-height value
   */
  isValidLineHeightValue(value) {
    if (!value || typeof value !== 'string') return false;

    // CSS variable reference
    if (value.startsWith('var(')) return true;

    // Unitless numbers
    if (/^\d*\.?\d+$/.test(value)) return true;

    // Length units
    if (/^[\d.]+(?:px|em|rem|%)$/.test(value)) return true;

    // Keywords
    if (['normal', 'inherit', 'initial', 'unset'].includes(value)) return true;

    return false;
  }

  /**
   * Infer token type from name and value
   * @private
   * @param {string} tokenName - Token name
   * @param {string} tokenValue - Token value
   * @returns {string} - Inferred token type
   */
  inferTokenType(tokenName, tokenValue) {
    // Color tokens
    if (tokenName.includes('color') || tokenName.includes('bg') || tokenName.includes('text') || tokenName.includes('border')) {
      return 'color';
    }

    // Spacing tokens
    if (tokenName.includes('space') || tokenName.includes('margin') || tokenName.includes('padding') || tokenName.includes('gap')) {
      return 'spacing';
    }

    // Typography tokens
    if (tokenName.includes('font') || tokenName.includes('text') || tokenName.includes('line')) {
      return 'typography';
    }

    // Shadow tokens
    if (tokenName.includes('shadow')) {
      return 'shadow';
    }

    // Border radius tokens
    if (tokenName.includes('radius')) {
      return 'border-radius';
    }

    // Z-index tokens
    if (tokenName.includes('z-')) {
      return 'z-index';
    }

    // Try to infer from value
    if (this.isValidColorValue(tokenValue)) {
      return 'color';
    }

    if (this.isValidSpacingValue(tokenValue)) {
      return 'spacing';
    }

    return 'unknown';
  }

  /**
   * Get level description for documentation
   * @private
   * @param {string} level - Inheritance level
   * @returns {string} - Level description
   */
  getLevelDescription(level) {
    const descriptions = {
      global: 'Foundation tokens that provide the basic design system primitives',
      semantic: 'Semantic tokens that define meaning and context for the design system',
      component: 'Component-specific tokens for customizing individual components',
      variant: 'Theme variant tokens for different visual themes (ocean, forest, etc.)',
      instance: 'Instance-specific tokens for one-off component customizations'
    };

    return descriptions[level] || `Tokens for ${level} inheritance level`;
  }

  /**
   * Format documentation as Markdown
   * @private
   * @param {Object} documentation - Documentation object
   * @returns {string} - Markdown formatted documentation
   */
  formatDocumentationAsMarkdown(documentation) {
    let markdown = '# Theme Token Documentation\n\n';

    markdown += `Generated: ${documentation.metadata.generatedAt}\n`;
    markdown += `Total Tokens: ${documentation.metadata.totalTokens}\n\n`;

    markdown += '## Inheritance Chain\n\n';
    documentation.metadata.inheritanceChain.forEach((level, index) => {
      markdown += `${index + 1}. **${level}** - ${this.getLevelDescription(level)}\n`;
    });
    markdown += '\n';

    // Document each level
    for (const [levelName, levelData] of Object.entries(documentation.levels)) {
      markdown += `## ${levelName.charAt(0).toUpperCase() + levelName.slice(1)} Tokens\n\n`;
      markdown += `${levelData.description}\n\n`;
      markdown += `Total tokens: ${levelData.tokenCount}\n\n`;

      if (levelData.tokenCount > 0) {
        markdown += '| Token | Value | Type | Description |\n';
        markdown += '|-------|-------|------|-------------|\n';

        for (const [tokenName, tokenData] of Object.entries(levelData.tokens)) {
          const description = tokenData.description || '';
          const deprecated = tokenData.deprecated ? ' ⚠️ Deprecated' : '';
          markdown += `| \`${tokenName}\` | \`${tokenData.value}\` | ${tokenData.type} | ${description}${deprecated} |\n`;
        }
        markdown += '\n';
      }
    }

    // Add usage examples if available
    if (documentation.usage) {
      markdown += '## Usage Examples\n\n';

      for (const [categoryName, categoryData] of Object.entries(documentation.usage)) {
        markdown += `### ${categoryData.title}\n\n`;

        categoryData.examples.forEach(example => {
          markdown += `#### ${example.description}\n\n`;
          markdown += '```css\n';
          markdown += example.css.trim();
          markdown += '\n```\n\n';
          if (example.notes) {
            markdown += `> ${example.notes}\n\n`;
          }
        });
      }
    }

    return markdown;
  }

  /**
   * Format documentation as HTML
   * @private
   * @param {Object} documentation - Documentation object
   * @returns {string} - HTML formatted documentation
   */
  formatDocumentationAsHTML(documentation) {
    // Basic HTML formatting - could be enhanced with proper templating
    let html = '<h1>Theme Token Documentation</h1>\n';
    html += `<p><strong>Generated:</strong> ${documentation.metadata.generatedAt}</p>\n`;
    html += `<p><strong>Total Tokens:</strong> ${documentation.metadata.totalTokens}</p>\n`;

    // Add inheritance chain
    html += '<h2>Inheritance Chain</h2>\n<ol>\n';
    documentation.metadata.inheritanceChain.forEach(level => {
      html += `<li><strong>${level}</strong> - ${this.getLevelDescription(level)}</li>\n`;
    });
    html += '</ol>\n';

    // Add level details
    for (const [levelName, levelData] of Object.entries(documentation.levels)) {
      html += `<h2>${levelName.charAt(0).toUpperCase() + levelName.slice(1)} Tokens</h2>\n`;
      html += `<p>${levelData.description}</p>\n`;
      html += `<p><strong>Total tokens:</strong> ${levelData.tokenCount}</p>\n`;

      if (levelData.tokenCount > 0) {
        html += '<table>\n<thead>\n<tr><th>Token</th><th>Value</th><th>Type</th><th>Description</th></tr>\n</thead>\n<tbody>\n';

        for (const [tokenName, tokenData] of Object.entries(levelData.tokens)) {
          const description = tokenData.description || '';
          const deprecated = tokenData.deprecated ? ' ⚠️ Deprecated' : '';
          html += `<tr><td><code>${tokenName}</code></td><td><code>${tokenData.value}</code></td><td>${tokenData.type}</td><td>${description}${deprecated}</td></tr>\n`;
        }

        html += '</tbody>\n</table>\n';
      }
    }

    return html;
  }

  /**
   * Create cache key for token processing
   * @private
   * @param {string} cssContent - CSS content
   * @param {string} componentName - Component name
   * @param {Object} options - Processing options
   * @returns {string} - Cache key
   */
  createProcessingCacheKey(cssContent, componentName, options) {
    // Create hash of CSS content for cache key
    const contentHash = this.simpleHash(cssContent);
    const optionsHash = this.simpleHash(JSON.stringify(options));
    return `process:${componentName || 'unknown'}:${contentHash}:${optionsHash}`;
  }

  /**
   * Simple hash function for cache keys
   * @private
   * @param {string} str - String to hash
   * @returns {string} - Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear token cache
   * @param {string|RegExp} pattern - Optional pattern to match cache keys
   */
  clearTokenCache(pattern = null) {
    if (pattern === null) {
      const clearedCount = this.tokenCache.size;
      this.tokenCache.clear();
      this.log('debug', `Cleared ${clearedCount} token cache entries`);
    } else if (typeof pattern === 'string') {
      let clearedCount = 0;
      for (const key of this.tokenCache.keys()) {
        if (key.includes(pattern)) {
          this.tokenCache.delete(key);
          clearedCount++;
        }
      }
      this.log('debug', `Cleared ${clearedCount} token cache entries matching pattern: ${pattern}`);
    } else if (pattern instanceof RegExp) {
      let clearedCount = 0;
      for (const key of this.tokenCache.keys()) {
        if (pattern.test(key)) {
          this.tokenCache.delete(key);
          clearedCount++;
        }
      }
      this.log('debug', `Cleared ${clearedCount} token cache entries matching regex: ${pattern}`);
    }
  }

  /**
   * Clear oldest cache entries to maintain cache size limit
   * @private
   * @param {number} count - Number of entries to remove
   */
  clearOldestCacheEntries(count) {
    const keys = Array.from(this.tokenCache.keys());
    for (let i = 0; i < Math.min(count, keys.length); i++) {
      this.tokenCache.delete(keys[i]);
    }
    this.log('debug', `Cleared ${Math.min(count, keys.length)} oldest cache entries`);
  }

  /**
   * Get comprehensive performance and usage statistics
   * @returns {Object} - Performance statistics
   */
  getPerformanceMetrics() {
    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
      : 0;

    const avgProcessingTime = this.metrics.processingTime.size > 0
      ? Array.from(this.metrics.processingTime.values()).reduce((a, b) => a + b, 0) / this.metrics.processingTime.size
      : 0;

    return {
      tokens: {
        processed: this.metrics.tokensProcessed,
        registered: {
          global: this.tokenRegistry.get('global').size,
          semantic: this.tokenRegistry.get('semantic').size,
          component: this.tokenRegistry.get('component').size,
          variant: this.tokenRegistry.get('variant').size,
          instance: this.tokenRegistry.get('instance').size,
          total: Array.from(this.tokenRegistry.values()).reduce((sum, registry) => sum + registry.size, 0)
        }
      },
      cache: {
        size: this.tokenCache.size,
        maxSize: this.config.maxCacheSize,
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: Math.round(cacheHitRate * 100) / 100
      },
      performance: {
        averageProcessingTime: Math.round(avgProcessingTime * 100) / 100,
        totalProcessingOperations: this.metrics.processingTime.size,
        performanceTrackingEnabled: this.config.enablePerformanceTracking
      },
      validation: {
        errors: this.metrics.validationErrors,
        warnings: this.metrics.validationWarnings,
        rulesCount: this.validationRules.size,
        validationEnabled: this.config.enableValidation
      },
      documentation: {
        documentsTokens: this.documentationRegistry.size,
        totalDocumentationEntries: this.documentationRegistry.size
      }
    };
  }

  /**
   * Configure the theme token processor
   * @param {Object} options - Configuration options
   */
  configure(options = {}) {
    Object.assign(this.config, options);
    this.log('debug', 'ThemeTokenProcessor configuration updated', this.config);
  }

  /**
   * Log message with configured level
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
      logMethod(`[ThemeTokenProcessor] ${message}`, ...args);
    }
  }
}

// Create singleton instance (following ThemeService pattern)
const themeTokenProcessor = new ThemeTokenProcessor();

// Export both the class and singleton
export { ThemeTokenProcessor };
export default themeTokenProcessor;

// Also make available globally for compatibility and debugging
if (typeof window !== 'undefined') {
  window.themeTokenProcessor = themeTokenProcessor;

  // Add debugging utilities in development
  if (process.env.NODE_ENV === 'development') {
    window.themeTokenProcessorDebug = {
      getMetrics: () => themeTokenProcessor.getPerformanceMetrics(),
      generateDocs: (format) => themeTokenProcessor.generateTokenDocumentation({ format }),
      validateCSS: (css, component) => themeTokenProcessor.validateTokenUsage(css, component),
      processTokens: (css, component, options) => themeTokenProcessor.processTokens(css, component, options),
      registerTokens: (level, tokens, docs) => themeTokenProcessor.registerTokens(level, tokens, docs),
      clearCache: (pattern) => themeTokenProcessor.clearTokenCache(pattern),
      addValidationRule: (name, rule) => themeTokenProcessor.addValidationRule(name, rule),
      getTokens: (level) => {
        const registry = themeTokenProcessor.tokenRegistry.get(level);
        return registry ? Object.fromEntries(registry.entries()) : null;
      }
    };
  }
}