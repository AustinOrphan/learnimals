/**
 * CSSScopingManager - Component CSS scoping and isolation system
 * Provides multiple scoping strategies to prevent style bleeding between components
 * 
 * Requirements: NFR-2.3, FR-1.1
 * Leverages: CSS processing patterns from theme system
 */

class CSSScopingManager {
  constructor(options = {}) {
    // Configuration options
    this.options = {
      defaultStrategy: options.defaultStrategy || 'class',
      enableDebugMode: options.enableDebugMode || false,
      scopingPrefix: options.scopingPrefix || 'component',
      cssModulesEnabled: options.cssModulesEnabled || false,
      cacheEnabled: options.cacheEnabled !== false,
      performanceTracking: options.performanceTracking || false,
      ...options
    };

    // Scoping strategy implementations
    this.strategies = new Map([
      ['class', this.applyClassScoping.bind(this)],
      ['attribute', this.applyAttributeScoping.bind(this)],
      ['css-modules', this.applyCSSModules.bind(this)]
    ]);

    // Caching system for processed CSS
    this.processedCache = new Map();
    this.scopingCache = new Map();
    
    // Performance tracking
    this.performanceMetrics = {
      totalProcessingTime: 0,
      totalScopedComponents: 0,
      cacheHits: 0,
      cacheMisses: 0,
      processingHistory: []
    };

    // CSS processing utilities (leveraging theme system patterns)
    this.cssProcessor = new CSSProcessor(this.options);
    
    // Initialize validation rules
    this.initializeValidationRules();
  }

  /**
   * Apply scoping strategy to CSS content
   * @param {string} cssContent - Original CSS content
   * @param {string} componentName - Name of the component
   * @param {Object} options - Scoping options
   * @returns {Object} - Processed CSS result
   */
  applyScopingStrategy(cssContent, componentName, options = {}) {
    const startTime = this.options.performanceTracking ? performance.now() : 0;
    
    try {
      // Determine scoping strategy
      const strategy = options.strategy || this.options.defaultStrategy;
      
      // Check cache first
      const cacheKey = this.generateCacheKey(cssContent, componentName, strategy, options);
      if (this.options.cacheEnabled && this.processedCache.has(cacheKey)) {
        this.recordMetrics('cache-hit', startTime);
        return this.processedCache.get(cacheKey);
      }

      // Validate inputs
      const validation = this.validateInputs(cssContent, componentName, strategy);
      if (!validation.isValid) {
        throw new Error(`Invalid inputs: ${validation.errors.join(', ')}`);
      }

      // Pre-process CSS content
      const preprocessed = this.preprocessCSS(cssContent, componentName, options);
      
      // Apply scoping strategy
      const scopingFunction = this.strategies.get(strategy);
      if (!scopingFunction) {
        throw new Error(`Unknown scoping strategy: ${strategy}`);
      }

      const scoped = scopingFunction(preprocessed, componentName, options);
      
      // Post-process results
      const result = this.postprocessCSS(scoped, componentName, strategy, options);
      
      // Cache the result
      if (this.options.cacheEnabled) {
        this.processedCache.set(cacheKey, result);
      }

      // Record performance metrics
      this.recordMetrics('processing-complete', startTime, {
        componentName,
        strategy,
        originalSize: cssContent.length,
        processedSize: result.css.length
      });

      return result;

    } catch (error) {
      this.handleScopingError(error, componentName, options);
      
      // Return fallback result
      return {
        css: cssContent, // Return original CSS as fallback
        scoped: false,
        strategy: 'none',
        error: error.message,
        warnings: [`Scoping failed for ${componentName}, using original CSS`]
      };
    }
  }

  /**
   * Apply class-based scoping (BEM-style)
   * @param {string} cssContent - CSS content to scope
   * @param {string} componentName - Component name
   * @param {Object} options - Scoping options
   * @returns {Object} - Scoped CSS result
   */
  applyClassScoping(cssContent, componentName, options = {}) {
    const componentClass = this.generateComponentClass(componentName, options);
    const scopedCSS = this.wrapSelectorsWithClass(cssContent, componentClass, options);
    
    return {
      css: scopedCSS,
      scoped: true,
      strategy: 'class',
      componentClass,
      metadata: {
        originalSelectors: this.extractSelectors(cssContent),
        scopedSelectors: this.extractSelectors(scopedCSS),
        processingRules: this.getClassScopingRules()
      }
    };
  }

  /**
   * Apply attribute-based scoping
   * @param {string} cssContent - CSS content to scope
   * @param {string} componentName - Component name
   * @param {Object} options - Scoping options
   * @returns {Object} - Scoped CSS result
   */
  applyAttributeScoping(cssContent, componentName, options = {}) {
    const attributeName = options.attributeName || 'data-component';
    const attributeValue = this.generateAttributeValue(componentName, options);
    const scopedCSS = this.wrapSelectorsWithAttribute(cssContent, attributeName, attributeValue, options);
    
    return {
      css: scopedCSS,
      scoped: true,
      strategy: 'attribute',
      attributeName,
      attributeValue,
      metadata: {
        originalSelectors: this.extractSelectors(cssContent),
        scopedSelectors: this.extractSelectors(scopedCSS),
        processingRules: this.getAttributeScopingRules()
      }
    };
  }

  /**
   * Apply CSS Modules scoping (generates unique class names)
   * @param {string} cssContent - CSS content to scope
   * @param {string} componentName - Component name
   * @param {Object} options - Scoping options
   * @returns {Object} - Scoped CSS result
   */
  applyCSSModules(cssContent, componentName, options = {}) {
    if (!this.options.cssModulesEnabled) {
      throw new Error('CSS Modules scoping is not enabled. Set cssModulesEnabled: true in options.');
    }

    const classMap = new Map();
    const scopedCSS = this.generateUniqueClassNames(cssContent, componentName, classMap, options);
    
    return {
      css: scopedCSS,
      scoped: true,
      strategy: 'css-modules',
      classMap: Object.fromEntries(classMap),
      metadata: {
        originalSelectors: this.extractSelectors(cssContent),
        scopedSelectors: this.extractSelectors(scopedCSS),
        processingRules: this.getCSSModulesRules()
      }
    };
  }

  /**
   * Generate component class name
   * @param {string} componentName - Component name
   * @param {Object} options - Options
   * @returns {string} - Generated class name
   */
  generateComponentClass(componentName, options = {}) {
    const prefix = options.classPrefix || this.options.scopingPrefix;
    const normalized = componentName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    
    return `${prefix}-${normalized}`;
  }

  /**
   * Generate attribute value for attribute scoping
   * @param {string} componentName - Component name
   * @param {Object} options - Options
   * @returns {string} - Generated attribute value
   */
  generateAttributeValue(componentName, options = {}) {
    return options.attributeValue || componentName.toLowerCase();
  }

  /**
   * Wrap CSS selectors with component class
   * @param {string} cssContent - CSS content
   * @param {string} componentClass - Component class name
   * @param {Object} options - Options
   * @returns {string} - Wrapped CSS
   */
  wrapSelectorsWithClass(cssContent, componentClass, options = {}) {
    const rules = this.parseCSSRules(cssContent);
    const scopedRules = [];

    for (const rule of rules) {
      if (rule.type === 'rule') {
        const scopedSelectors = rule.selectors.map(selector => {
          // Skip selectors that are already scoped or are global
          if (this.shouldSkipScoping(selector, options)) {
            return selector;
          }
          
          // Apply class scoping
          return this.scopeSelectorWithClass(selector, componentClass);
        });
        
        scopedRules.push({
          ...rule,
          selectors: scopedSelectors
        });
      } else {
        // Keep non-rule content as-is (comments, at-rules, etc.)
        scopedRules.push(rule);
      }
    }

    return this.reconstructCSS(scopedRules);
  }

  /**
   * Wrap CSS selectors with component attribute
   * @param {string} cssContent - CSS content
   * @param {string} attributeName - Attribute name
   * @param {string} attributeValue - Attribute value
   * @param {Object} options - Options
   * @returns {string} - Wrapped CSS
   */
  wrapSelectorsWithAttribute(cssContent, attributeName, attributeValue, options = {}) {
    const rules = this.parseCSSRules(cssContent);
    const scopedRules = [];
    const attributeSelector = `[${attributeName}="${attributeValue}"]`;

    for (const rule of rules) {
      if (rule.type === 'rule') {
        const scopedSelectors = rule.selectors.map(selector => {
          if (this.shouldSkipScoping(selector, options)) {
            return selector;
          }
          
          return this.scopeSelectorWithAttribute(selector, attributeSelector);
        });
        
        scopedRules.push({
          ...rule,
          selectors: scopedSelectors
        });
      } else {
        scopedRules.push(rule);
      }
    }

    return this.reconstructCSS(scopedRules);
  }

  /**
   * Generate unique class names for CSS Modules
   * @param {string} cssContent - CSS content
   * @param {string} componentName - Component name
   * @param {Map} classMap - Map to store original -> unique class mappings
   * @param {Object} options - Options
   * @returns {string} - CSS with unique class names
   */
  generateUniqueClassNames(cssContent, componentName, classMap, options = {}) {
    const rules = this.parseCSSRules(cssContent);
    const scopedRules = [];
    const hashSuffix = this.generateHash(componentName + cssContent).slice(0, 8);

    for (const rule of rules) {
      if (rule.type === 'rule') {
        const scopedSelectors = rule.selectors.map(selector => {
          return this.transformSelectorForCSSModules(selector, componentName, hashSuffix, classMap);
        });
        
        scopedRules.push({
          ...rule,
          selectors: scopedSelectors
        });
      } else {
        scopedRules.push(rule);
      }
    }

    return this.reconstructCSS(scopedRules);
  }

  /**
   * Scope individual selector with class
   * @param {string} selector - CSS selector
   * @param {string} componentClass - Component class
   * @returns {string} - Scoped selector
   */
  scopeSelectorWithClass(selector, componentClass) {
    // Handle special cases
    if (selector.startsWith(':root') || selector.startsWith('html') || selector.startsWith('body')) {
      return selector;
    }
    
    // Add component class as ancestor
    return `.${componentClass} ${selector}`;
  }

  /**
   * Scope individual selector with attribute
   * @param {string} selector - CSS selector
   * @param {string} attributeSelector - Attribute selector
   * @returns {string} - Scoped selector
   */
  scopeSelectorWithAttribute(selector, attributeSelector) {
    // Handle special cases
    if (selector.startsWith(':root') || selector.startsWith('html') || selector.startsWith('body')) {
      return selector;
    }
    
    // Add attribute selector as ancestor
    return `${attributeSelector} ${selector}`;
  }

  /**
   * Transform selector for CSS Modules
   * @param {string} selector - Original selector
   * @param {string} componentName - Component name
   * @param {string} hashSuffix - Hash suffix for uniqueness
   * @param {Map} classMap - Class mapping
   * @returns {string} - Transformed selector
   */
  transformSelectorForCSSModules(selector, componentName, hashSuffix, classMap) {
    // Extract class names from selector
    const classNames = selector.match(/\.[a-zA-Z][\w-]*/g) || [];
    
    let transformedSelector = selector;
    
    for (const className of classNames) {
      const originalClass = className.slice(1); // Remove the dot
      const uniqueClass = `${originalClass}_${componentName}_${hashSuffix}`;
      
      // Store mapping
      classMap.set(originalClass, uniqueClass);
      
      // Replace in selector
      transformedSelector = transformedSelector.replace(className, `.${uniqueClass}`);
    }
    
    return transformedSelector;
  }

  /**
   * Check if selector should skip scoping
   * @param {string} selector - CSS selector
   * @param {Object} options - Options
   * @returns {boolean} - Whether to skip scoping
   */
  shouldSkipScoping(selector, options = {}) {
    const skipPatterns = [
      /^:root/,
      /^html/,
      /^body/,
      /^@/,        // At-rules
      /^\*/,       // Universal selector
      ...(options.skipPatterns || [])
    ];

    // Check against skip patterns
    return skipPatterns.some(pattern => pattern.test(selector.trim()));
  }

  /**
   * Pre-process CSS content before scoping
   * @param {string} cssContent - CSS content
   * @param {string} componentName - Component name
   * @param {Object} options - Options
   * @returns {string} - Pre-processed CSS
   */
  preprocessCSS(cssContent, componentName, options = {}) {
    let processed = cssContent;

    // Remove comments if requested
    if (options.removeComments !== false) {
      processed = processed.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    // Normalize whitespace
    if (options.normalizeWhitespace !== false) {
      processed = processed.replace(/\s+/g, ' ').trim();
    }

    // Process theme tokens if available (leveraging theme system patterns)
    if (options.processThemeTokens !== false) {
      processed = this.cssProcessor.processThemeTokens(processed, componentName);
    }

    return processed;
  }

  /**
   * Post-process CSS results after scoping
   * @param {Object} scopedResult - Scoped CSS result
   * @param {string} componentName - Component name
   * @param {string} strategy - Scoping strategy used
   * @param {Object} options - Options
   * @returns {Object} - Post-processed result
   */
  postprocessCSS(scopedResult, componentName, strategy, options = {}) {
    const result = { ...scopedResult };

    // Add metadata
    result.metadata = {
      ...result.metadata,
      componentName,
      strategy,
      timestamp: new Date().toISOString(),
      options: { ...options }
    };

    // Validate scoped CSS
    if (options.validateOutput !== false) {
      const validation = this.validateScopedCSS(result.css, componentName, strategy);
      result.validation = validation;
      
      if (!validation.isValid) {
        result.warnings = result.warnings || [];
        result.warnings.push(...validation.errors);
      }
    }

    // Format CSS if requested
    if (options.formatOutput) {
      result.css = this.formatCSS(result.css);
    }

    return result;
  }

  /**
   * Simple CSS rule parser
   * @param {string} cssContent - CSS content
   * @returns {Array} - Parsed CSS rules
   */
  parseCSSRules(cssContent) {
    const rules = [];
    const ruleRegex = /([^{]+)\{([^}]*)\}/g;
    let match;

    while ((match = ruleRegex.exec(cssContent)) !== null) {
      const selectorsText = match[1].trim();
      const declarations = match[2].trim();
      
      if (selectorsText && declarations) {
        rules.push({
          type: 'rule',
          selectors: selectorsText.split(',').map(s => s.trim()),
          declarations,
          raw: match[0]
        });
      }
    }

    return rules;
  }

  /**
   * Extract selectors from CSS content
   * @param {string} cssContent - CSS content
   * @returns {Array} - Array of selectors
   */
  extractSelectors(cssContent) {
    const rules = this.parseCSSRules(cssContent);
    return rules.reduce((selectors, rule) => {
      if (rule.type === 'rule') {
        selectors.push(...rule.selectors);
      }
      return selectors;
    }, []);
  }

  /**
   * Reconstruct CSS from parsed rules
   * @param {Array} rules - Parsed CSS rules
   * @returns {string} - Reconstructed CSS
   */
  reconstructCSS(rules) {
    return rules.map(rule => {
      if (rule.type === 'rule') {
        const selectors = rule.selectors.join(', ');
        return `${selectors} { ${rule.declarations} }`;
      }
      return rule.raw || '';
    }).join('\n');
  }

  /**
   * Generate cache key for processed CSS
   * @param {string} cssContent - CSS content
   * @param {string} componentName - Component name
   * @param {string} strategy - Scoping strategy
   * @param {Object} options - Options
   * @returns {string} - Cache key
   */
  generateCacheKey(cssContent, componentName, strategy, options) {
    const contentHash = this.generateHash(cssContent);
    const optionsHash = this.generateHash(JSON.stringify(options));
    return `${componentName}:${strategy}:${contentHash}:${optionsHash}`;
  }

  /**
   * Generate hash for content
   * @param {string} content - Content to hash
   * @returns {string} - Hash string
   */
  generateHash(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate inputs
   * @param {string} cssContent - CSS content
   * @param {string} componentName - Component name
   * @param {string} strategy - Scoping strategy
   * @returns {Object} - Validation result
   */
  validateInputs(cssContent, componentName, strategy) {
    const errors = [];

    if (!cssContent || typeof cssContent !== 'string') {
      errors.push('CSS content must be a non-empty string');
    }

    if (!componentName || typeof componentName !== 'string') {
      errors.push('Component name must be a non-empty string');
    }

    if (!this.strategies.has(strategy)) {
      errors.push(`Unknown scoping strategy: ${strategy}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate scoped CSS output
   * @param {string} scopedCSS - Scoped CSS
   * @param {string} componentName - Component name
   * @param {string} strategy - Strategy used
   * @returns {Object} - Validation result
   */
  validateScopedCSS(scopedCSS, componentName, strategy) {
    const errors = [];
    const warnings = [];

    // Check for syntax errors
    try {
      this.parseCSSRules(scopedCSS);
    } catch (error) {
      errors.push(`CSS syntax error: ${error.message}`);
    }

    // Check for proper scoping based on strategy
    const selectors = this.extractSelectors(scopedCSS);
    const unscopedSelectors = selectors.filter(selector => {
      return !this.isSelectorProperlyScoped(selector, componentName, strategy);
    });

    if (unscopedSelectors.length > 0) {
      warnings.push(`Some selectors may not be properly scoped: ${unscopedSelectors.slice(0, 3).join(', ')}${unscopedSelectors.length > 3 ? '...' : ''}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if selector is properly scoped
   * @param {string} selector - CSS selector
   * @param {string} componentName - Component name
   * @param {string} strategy - Scoping strategy
   * @returns {boolean} - Whether selector is properly scoped
   */
  isSelectorProperlyScoped(selector, componentName, strategy) {
    // Skip global selectors
    if (this.shouldSkipScoping(selector)) {
      return true;
    }

    switch (strategy) {
      case 'class':
        const componentClass = this.generateComponentClass(componentName);
        return selector.includes(componentClass);
      
      case 'attribute':
        const attributeValue = this.generateAttributeValue(componentName);
        return selector.includes(`data-component="${attributeValue}"`);
      
      case 'css-modules':
        // CSS modules should have hash-based class names
        return /[a-zA-Z][\w-]*_[a-zA-Z][\w-]*_[a-z0-9]+/.test(selector);
      
      default:
        return false;
    }
  }

  /**
   * Initialize validation rules
   * @private
   */
  initializeValidationRules() {
    this.validationRules = {
      class: this.getClassScopingRules(),
      attribute: this.getAttributeScopingRules(),
      'css-modules': this.getCSSModulesRules()
    };
  }

  /**
   * Get class scoping rules
   * @returns {Object} - Scoping rules
   */
  getClassScopingRules() {
    return {
      description: 'Class-based scoping wraps selectors with component class',
      skipPatterns: [':root', 'html', 'body', '@'],
      wrapStrategy: 'ancestor-class',
      preserveGlobals: true
    };
  }

  /**
   * Get attribute scoping rules
   * @returns {Object} - Scoping rules
   */
  getAttributeScopingRules() {
    return {
      description: 'Attribute-based scoping wraps selectors with component attribute',
      skipPatterns: [':root', 'html', 'body', '@'],
      wrapStrategy: 'ancestor-attribute',
      preserveGlobals: true
    };
  }

  /**
   * Get CSS modules rules
   * @returns {Object} - Scoping rules
   */
  getCSSModulesRules() {
    return {
      description: 'CSS Modules generates unique class names with hash suffixes',
      skipPatterns: [':root', 'html', 'body', '@'],
      wrapStrategy: 'unique-classes',
      preserveGlobals: false
    };
  }

  /**
   * Record performance metrics
   * @param {string} event - Event type
   * @param {number} startTime - Start time
   * @param {Object} metadata - Additional metadata
   */
  recordMetrics(event, startTime, metadata = {}) {
    if (!this.options.performanceTracking) return;

    const endTime = performance.now();
    const duration = startTime ? endTime - startTime : 0;

    switch (event) {
      case 'cache-hit':
        this.performanceMetrics.cacheHits++;
        break;
      
      case 'processing-complete':
        this.performanceMetrics.cacheMisses++;
        this.performanceMetrics.totalProcessingTime += duration;
        this.performanceMetrics.totalScopedComponents++;
        this.performanceMetrics.processingHistory.push({
          timestamp: new Date().toISOString(),
          duration,
          ...metadata
        });
        break;
    }
  }

  /**
   * Handle scoping errors
   * @param {Error} error - Error object
   * @param {string} componentName - Component name
   * @param {Object} options - Options
   */
  handleScopingError(error, componentName, options) {
    if (this.options.enableDebugMode) {
      console.error(`CSS scoping error for component ${componentName}:`, error);
      console.debug('Scoping options:', options);
    }

    // Could emit error event for external monitoring
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const errorEvent = new CustomEvent('cssScopingError', {
        detail: {
          componentName,
          error: error.message,
          options
        }
      });
      window.dispatchEvent(errorEvent);
    }
  }

  /**
   * Format CSS (basic formatting)
   * @param {string} css - CSS content
   * @returns {string} - Formatted CSS
   */
  formatCSS(css) {
    return css
      .replace(/\{/g, ' {\n  ')
      .replace(/\}/g, '\n}\n')
      .replace(/;/g, ';\n  ')
      .replace(/,/g, ',\n')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Get performance metrics
   * @returns {Object} - Performance metrics
   */
  getPerformanceMetrics() {
    const metrics = { ...this.performanceMetrics };
    
    if (metrics.totalScopedComponents > 0) {
      metrics.averageProcessingTime = metrics.totalProcessingTime / metrics.totalScopedComponents;
      metrics.cacheHitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);
    }

    return metrics;
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.processedCache.clear();
    this.scopingCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    return {
      processedCacheSize: this.processedCache.size,
      scopingCacheSize: this.scopingCache.size,
      totalCacheSize: this.processedCache.size + this.scopingCache.size
    };
  }
}

/**
 * CSS Processor utility class
 * Handles CSS processing patterns similar to theme system
 */
class CSSProcessor {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Process theme tokens in CSS (leveraging theme system patterns)
   * @param {string} cssContent - CSS content
   * @param {string} componentName - Component name
   * @returns {string} - Processed CSS
   */
  processThemeTokens(cssContent, componentName) {
    // This would integrate with the theme system to process CSS custom properties
    // For now, return as-is, but this is where theme token processing would happen
    return cssContent;
  }
}

// Export the class
export default CSSScopingManager;

// Also export named export for convenience
export { CSSScopingManager };

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.CSSScopingManager = CSSScopingManager;
}