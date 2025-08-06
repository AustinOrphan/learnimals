/**
 * ComponentThemeCustomizer - Simple implementation for Task 7.5
 * Provides component-specific theme customization support
 * 
 * Requirements: FR-2.2 (component-specific theme customization)
 */

class ComponentThemeCustomizer {
  constructor() {
    // Component-specific token registries
    this.componentTokens = new Map(); // component-level tokens
    this.variantTokens = new Map();   // variant-specific tokens  
    this.instanceTokens = new Map();  // instance-level overrides
    
    // Component manifests
    this.manifests = new Map();
    
    // Cache for resolved tokens
    this.tokenCache = new Map();
  }

  /**
   * Register component-specific tokens (FR-2.2)
   * @param {string} componentName - Name of the component
   * @param {Object} tokens - Component-specific tokens
   * @param {Object} options - Registration options
   * @returns {Object} - Registration result
   */
  registerComponentTokens(componentName, tokens, options = {}) {
    const { variant, instance } = options;
    
    const result = {
      componentName,
      tokensRegistered: 0,
      warnings: [],
      errors: []
    };

    try {
      let registry;
      let prefix;

      // Determine which registry and prefix to use
      if (instance) {
        registry = this.instanceTokens;
        prefix = `--instance-${componentName.toLowerCase()}-${instance}-`;
      } else if (variant) {
        registry = this.variantTokens;
        prefix = `--variant-${variant.toLowerCase()}-${componentName.toLowerCase()}-`;
      } else {
        registry = this.componentTokens;
        prefix = `--component-${componentName.toLowerCase()}-`;
      }

      // Register each token with appropriate prefix
      for (const [tokenName, tokenValue] of Object.entries(tokens)) {
        let finalTokenName = tokenName.startsWith('--') ? tokenName : `${prefix}${tokenName}`;
        
        registry.set(finalTokenName, tokenValue);
        result.tokensRegistered++;
      }

      // Clear cache when tokens are registered
      this.tokenCache.clear();
      
    } catch (error) {
      result.errors.push({
        type: 'registration_error',
        message: error.message
      });
    }

    return result;
  }

  /**
   * Apply component theme customization to CSS content
   * @param {string} cssContent - CSS content to process
   * @param {string} componentName - Component name
   * @param {Object} options - Processing options
   * @returns {Object} - Processing results
   */
  applyComponentThemeCustomization(cssContent, componentName, options = {}) {
    const { variant, instance } = options;
    
    const result = {
      originalCss: cssContent,
      processedCss: cssContent,
      tokensProcessed: 0,
      tokensResolved: 0,
      customizations: []
    };

    try {
      // Build inheritance chain (instance > variant > component)
      const inheritanceChain = this.buildInheritanceChain(componentName, { variant, instance });
      
      // Extract CSS variables from content
      const cssVariables = cssContent.match(/var\(--[^)]+\)/g) || [];
      result.tokensProcessed = cssVariables.length;

      let processedCss = cssContent;

      // Process each CSS variable
      for (const cssVar of cssVariables) {
        const tokenMatch = cssVar.match(/var\((--[^,)]+)/);
        if (!tokenMatch) continue;

        const tokenName = tokenMatch[1];
        const resolvedValue = this.resolveToken(tokenName, inheritanceChain);

        if (resolvedValue) {
          processedCss = processedCss.replace(cssVar, resolvedValue);
          result.tokensResolved++;
          result.customizations.push({
            tokenName,
            originalValue: cssVar,
            resolvedValue,
            source: this.getTokenSource(tokenName, inheritanceChain)
          });
        }
      }

      result.processedCss = processedCss;
      
    } catch (error) {
      // Handle errors gracefully
      console.warn('Error applying component theme customization:', error);
    }

    return result;
  }

  /**
   * Build inheritance chain for token resolution
   * @private
   * @param {string} componentName - Component name
   * @param {Object} options - Chain options
   * @returns {Array} - Inheritance chain
   */
  buildInheritanceChain(componentName, options = {}) {
    const { variant, instance } = options;
    const chain = [];

    // Component level (lowest priority)
    chain.push({
      level: 'component',
      registry: this.componentTokens,
      filter: (token) => token.includes(`-${componentName.toLowerCase()}-`)
    });

    // Variant level
    if (variant) {
      chain.push({
        level: 'variant',
        registry: this.variantTokens,
        filter: (token) => token.includes(`-${variant.toLowerCase()}-${componentName.toLowerCase()}-`)
      });
    }

    // Instance level (highest priority)
    if (instance) {
      chain.push({
        level: 'instance',
        registry: this.instanceTokens,
        filter: (token) => token.includes(`-${componentName.toLowerCase()}-${instance}-`)
      });
    }

    return chain;
  }

  /**
   * Resolve token value using inheritance chain
   * @private
   * @param {string} tokenName - Token to resolve
   * @param {Array} inheritanceChain - Inheritance chain
   * @returns {string|null} - Resolved value
   */
  resolveToken(tokenName, inheritanceChain) {
    // Check cache first
    const cacheKey = `${tokenName}:${inheritanceChain.map(c => c.level).join('>')}`;
    if (this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey);
    }

    // Resolve through inheritance chain (reverse for highest priority first)
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
      const chainEntry = inheritanceChain[i];
      const { registry, filter } = chainEntry;

      // Check direct match first
      if (registry.has(tokenName)) {
        if (!filter || filter(tokenName)) {
          const value = registry.get(tokenName);
          this.tokenCache.set(cacheKey, value);
          return value;
        }
      }

      // For component-level tokens, also try to match the base token name
      if (chainEntry.level === 'component' && tokenName.startsWith('--component-')) {
        for (const [registeredToken, value] of registry.entries()) {
          if (registeredToken === tokenName || 
              (filter && filter(registeredToken) && registeredToken.endsWith(tokenName.split('-').slice(-1)[0]))) {
            this.tokenCache.set(cacheKey, value);
            return value;
          }
        }
      }

      // For variant tokens, try to resolve to the component equivalent
      if (chainEntry.level === 'variant' && tokenName.startsWith('--component-')) {
        const componentName = tokenName.match(/--component-([^-]+)-/)?.[1];
        if (componentName) {
          const baseTokenName = tokenName.replace(/^--component-[^-]+-/, '');
          for (const [registeredToken, value] of registry.entries()) {
            if (registeredToken.includes(`-${componentName.toLowerCase()}-${baseTokenName}`)) {
              this.tokenCache.set(cacheKey, value);
              return value;
            }
          }
        }
      }

      // Check filtered matches
      if (filter) {
        for (const [registeredToken, value] of registry.entries()) {
          if (filter(registeredToken) && this.tokenMatches(tokenName, registeredToken)) {
            this.tokenCache.set(cacheKey, value);
            return value;
          }
        }
      }
    }

    return null; // Token not found
  }

  /**
   * Check if tokens match for resolution
   * @private
   * @param {string} searchToken - Token being searched
   * @param {string} registeredToken - Registered token
   * @returns {boolean} - True if they match
   */
  tokenMatches(searchToken, registeredToken) {
    return searchToken === registeredToken;
  }

  /**
   * Get source information for a resolved token
   * @private
   * @param {string} tokenName - Token name
   * @param {Array} inheritanceChain - Inheritance chain
   * @returns {Object} - Source information
   */
  getTokenSource(tokenName, inheritanceChain) {
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
      const chainEntry = inheritanceChain[i];
      if (chainEntry.registry.has(tokenName)) {
        return {
          level: chainEntry.level,
          found: true
        };
      }
    }
    return { level: null, found: false };
  }

  /**
   * Integrate with ComponentManifest for theme definitions (FR-2.2)
   * @param {Object} manifest - Component manifest
   * @param {Object} options - Integration options
   * @returns {Object} - Integration results
   */
  integrateComponentManifest(manifest, options = {}) {
    const result = {
      componentName: manifest.name,
      themesProcessed: 0,
      tokensRegistered: 0,
      warnings: [],
      errors: []
    };

    try {
      // Validate manifest
      if (!manifest.name) {
        result.errors.push({
          type: 'invalid_manifest',
          message: 'Component manifest must have a name'
        });
        return result;
      }

      // Store manifest
      this.manifests.set(manifest.name, manifest);

      // Process theme definitions
      const themes = manifest.css?.variants?.themes || {};
      
      for (const [themeName, themeConfig] of Object.entries(themes)) {
        result.themesProcessed++;

        // Register theme tokens
        if (themeConfig.tokens) {
          const registration = this.registerComponentTokens(manifest.name, themeConfig.tokens, {
            variant: themeName
          });
          result.tokensRegistered += registration.tokensRegistered;
          result.warnings.push(...registration.warnings);
          result.errors.push(...registration.errors);
        }

        // Register instance tokens
        if (themeConfig.instances) {
          for (const [instanceId, instanceConfig] of Object.entries(themeConfig.instances)) {
            if (instanceConfig.tokens) {
              const instanceRegistration = this.registerComponentTokens(manifest.name, instanceConfig.tokens, {
                variant: themeName,
                instance: instanceId
              });
              result.tokensRegistered += instanceRegistration.tokensRegistered;
              result.warnings.push(...instanceRegistration.warnings);
              result.errors.push(...instanceRegistration.errors);
            }
          }
        }
      }

    } catch (error) {
      result.errors.push({
        type: 'integration_error',
        message: error.message
      });
    }

    return result;
  }

  /**
   * Get all registered tokens for debugging
   * @returns {Object} - All registered tokens
   */
  getAllTokens() {
    return {
      component: Object.fromEntries(this.componentTokens.entries()),
      variant: Object.fromEntries(this.variantTokens.entries()),
      instance: Object.fromEntries(this.instanceTokens.entries())
    };
  }

  /**
   * Clear all caches and registries
   */
  clear() {
    this.componentTokens.clear();
    this.variantTokens.clear();
    this.instanceTokens.clear();
    this.manifests.clear();
    this.tokenCache.clear();
  }
}

// Create singleton instance
const componentThemeCustomizer = new ComponentThemeCustomizer();

// Export both class and singleton
export { ComponentThemeCustomizer };
export default componentThemeCustomizer;

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.componentThemeCustomizer = componentThemeCustomizer;
}