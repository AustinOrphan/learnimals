/**
 * CSSPathResolver - Component CSS file path resolution with alias support
 * Handles CSS file path resolution for co-located component styles with
 * support for aliases, base paths, and different component categories
 */

/**
 * CSSPathResolver class for resolving component CSS file paths
 * Follows path resolution patterns from DependencyResolver.js
 */
export class CSSPathResolver {
  constructor() {
    // Base paths for different component categories
    this.basePaths = new Map([
      ['ui', '../components/ui/'],
      ['layout', '../components/layout/'],
      ['forms', '../components/forms/'],
      ['feedback', '../components/feedback/'],
      ['games', '../components/games/'],
      ['profile', '../components/profile/'],
      ['examples', '../components/examples/'],
    ]);

    // CSS file aliases for flexible naming
    this.aliases = new Map();

    // Component path mappings (similar to DependencyResolver)
    this.componentPathMappings = new Map([
      ['Card', 'ui'],
      ['CardV2', 'ui'],
      ['Modal', 'ui'],
      ['Button', 'ui'],
      ['PWAInstaller', 'ui'],
      ['PerformanceMonitor', 'ui'],
      ['GameProgressDashboard', 'ui'],
      ['PlaceValueManipulative', 'ui'],
      ['FormComponent', 'forms'],
      ['Input', 'forms'],
      ['Navigation', 'layout'],
      ['Navbar', 'layout'],
      ['FeedbackOverlay', 'feedback'],
      ['FeedbackProgress', 'feedback'],
      ['FeedbackToast', 'feedback'],
      ['ToastManager', 'feedback'],
      ['BaseGame', 'games'],
      ['GameTemplateLoader', 'games'],
      ['Avatar', 'profile'],
      ['AvatarBuilder', 'profile'],
      ['ViteAliasExample', 'examples'],
    ]);

    // Configuration
    this.config = {
      enableCaching: true,
      fallbackToGlobal: true,
      logLevel: 'warn', // 'debug', 'info', 'warn', 'error', 'silent'
    };

    // Cache for resolved paths
    this.resolvedPathCache = new Map();
  }

  /**
   * Configure the CSS path resolver
   * @param {Object} options - Configuration options
   */
  configure(options = {}) {
    Object.assign(this.config, options);
    return this;
  }

  /**
   * Resolve CSS file path for a component
   * @param {string} cssFile - CSS file name or path
   * @param {string} componentPath - Component directory path (optional)
   * @param {string} componentName - Component name for category mapping (optional)
   * @returns {string|null} - Resolved CSS file path
   */
  resolve(cssFile, componentPath = null, componentName = null) {
    // Handle null or empty CSS file
    if (!cssFile) {
      return null;
    }

    // Create cache key
    const cacheKey = `${cssFile}|${componentPath || ''}|${componentName || ''}`;
    
    // Check cache first
    if (this.config.enableCaching && this.resolvedPathCache.has(cacheKey)) {
      this.log('debug', `CSS path resolved from cache: ${cacheKey}`);
      return this.resolvedPathCache.get(cacheKey);
    }

    let resolvedPath = null;

    try {
      // Try different resolution strategies
      resolvedPath = this.tryResolveStrategies(cssFile, componentPath, componentName);
      
      // Cache successful resolution
      if (resolvedPath && this.config.enableCaching) {
        this.resolvedPathCache.set(cacheKey, resolvedPath);
      }

      this.log('debug', `CSS path resolved: ${cssFile} -> ${resolvedPath}`);
      return resolvedPath;
    } catch (error) {
      this.log('error', `Failed to resolve CSS path for ${cssFile}:`, error);
      return null;
    }
  }

  /**
   * Try different resolution strategies
   * @private
   * @param {string} cssFile - CSS file name or path
   * @param {string} componentPath - Component directory path
   * @param {string} componentName - Component name
   * @returns {string|null} - Resolved path
   */
  tryResolveStrategies(cssFile, componentPath, componentName) {
    // Strategy 1: Check if cssFile is already a full path
    if (this.isAbsolutePath(cssFile)) {
      return cssFile;
    }

    // Strategy 2: Check aliases first
    if (this.aliases.has(cssFile)) {
      const aliasPath = this.aliases.get(cssFile);
      this.log('debug', `Using alias: ${cssFile} -> ${aliasPath}`);
      return aliasPath;
    }

    // Strategy 3: Use provided component path
    if (componentPath) {
      const pathWithComponent = `${componentPath}/${cssFile}`;
      if (this.isValidCSSPath(pathWithComponent)) {
        return pathWithComponent;
      }
    }

    // Strategy 4: Use component name to determine category
    if (componentName) {
      const resolvedByCategory = this.resolveByComponentCategory(cssFile, componentName);
      if (resolvedByCategory) {
        return resolvedByCategory;
      }
    }

    // Strategy 5: Try to infer component name from CSS file name
    const inferredComponentName = this.inferComponentNameFromCSSFile(cssFile);
    if (inferredComponentName) {
      const resolvedByInferred = this.resolveByComponentCategory(cssFile, inferredComponentName);
      if (resolvedByInferred) {
        return resolvedByInferred;
      }
    }

    // Strategy 6: Fallback to global CSS if enabled
    if (this.config.fallbackToGlobal) {
      return this.resolveGlobalCSS(cssFile);
    }

    return null;
  }

  /**
   * Resolve CSS path by component category
   * @private
   * @param {string} cssFile - CSS file name
   * @param {string} componentName - Component name
   * @returns {string|null} - Resolved path
   */
  resolveByComponentCategory(cssFile, componentName) {
    const category = this.componentPathMappings.get(componentName);
    if (!category) {
      this.log('debug', `No category mapping found for component: ${componentName}`);
      return null;
    }

    const basePath = this.basePaths.get(category);
    if (!basePath) {
      this.log('debug', `No base path found for category: ${category}`);
      return null;
    }

    // Try different path combinations
    const pathVariations = [
      `${basePath}${componentName}/${cssFile}`,
      `${basePath}${cssFile}`,
      `${basePath}${componentName}.css`,
    ];

    for (const path of pathVariations) {
      if (this.isValidCSSPath(path)) {
        this.log('debug', `Resolved by category: ${componentName} (${category}) -> ${path}`);
        return path;
      }
    }

    return null;
  }

  /**
   * Infer component name from CSS file name
   * @private
   * @param {string} cssFile - CSS file name
   * @returns {string|null} - Inferred component name
   */
  inferComponentNameFromCSSFile(cssFile) {
    // Handle ComponentName.css pattern (FR-1.2)
    const match = cssFile.match(/^([A-Z][a-zA-Z0-9]*)(\.css)?$/);
    if (match) {
      return match[1];
    }

    // Handle component-name.css pattern
    const kebabMatch = cssFile.match(/^([a-z][a-z0-9-]*)(\.css)?$/);
    if (kebabMatch) {
      // Convert kebab-case to PascalCase
      return kebabMatch[1]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    }

    return null;
  }

  /**
   * Resolve global CSS fallback
   * @private
   * @param {string} cssFile - CSS file name
   * @returns {string} - Global CSS path
   */
  resolveGlobalCSS(cssFile) {
    // Try common global CSS locations
    const globalPaths = [
      `../styles/components/${cssFile}`,
      `../styles/${cssFile}`,
      `./styles/components/${cssFile}`,
      `./styles/${cssFile}`,
    ];

    for (const path of globalPaths) {
      if (this.isValidCSSPath(path)) {
        this.log('debug', `Fallback to global CSS: ${cssFile} -> ${path}`);
        return path;
      }
    }

    // Return the most likely global path even if we can't validate
    this.log('debug', `Using unvalidated global fallback: ${cssFile}`);
    return `../styles/components/${cssFile}`;
  }

  /**
   * Check if path is absolute
   * @private
   * @param {string} path - Path to check
   * @returns {boolean} - True if absolute path
   */
  isAbsolutePath(path) {
    return path.startsWith('/') || 
           path.startsWith('http://') || 
           path.startsWith('https://') ||
           path.includes('://');
  }

  /**
   * Validate CSS path (basic check for development)
   * @private
   * @param {string} path - Path to validate
   * @returns {boolean} - True if likely valid
   */
  isValidCSSPath(path) {
    // Basic validation - in a real implementation you might check file existence
    return path.endsWith('.css') && path.length > 4;
  }

  /**
   * Add CSS file alias
   * @param {string} alias - Alias name
   * @param {string} path - Actual path
   */
  addAlias(alias, path) {
    this.aliases.set(alias, path);
    this.log('debug', `Added CSS alias: ${alias} -> ${path}`);
    return this;
  }

  /**
   * Remove CSS file alias
   * @param {string} alias - Alias name to remove
   */
  removeAlias(alias) {
    const removed = this.aliases.delete(alias);
    if (removed) {
      this.log('debug', `Removed CSS alias: ${alias}`);
    }
    return this;
  }

  /**
   * Set base path for component category
   * @param {string} category - Component category
   * @param {string} path - Base path
   */
  setBasePath(category, path) {
    this.basePaths.set(category, path);
    this.log('debug', `Set base path for ${category}: ${path}`);
    return this;
  }

  /**
   * Add component to category mapping
   * @param {string} componentName - Component name
   * @param {string} category - Component category
   */
  addComponentMapping(componentName, category) {
    this.componentPathMappings.set(componentName, category);
    this.log('debug', `Added component mapping: ${componentName} -> ${category}`);
    return this;
  }

  /**
   * Get all aliases
   * @returns {Map<string, string>} - Map of aliases
   */
  getAliases() {
    return new Map(this.aliases);
  }

  /**
   * Get all base paths
   * @returns {Map<string, string>} - Map of base paths
   */
  getBasePaths() {
    return new Map(this.basePaths);
  }

  /**
   * Get component category for a component name
   * @param {string} componentName - Component name
   * @returns {string|null} - Component category
   */
  getComponentCategory(componentName) {
    return this.componentPathMappings.get(componentName) || null;
  }

  /**
   * Clear resolution cache
   */
  clearCache() {
    this.resolvedPathCache.clear();
    this.log('info', 'CSS path resolution cache cleared');
    return this;
  }

  /**
   * Get resolution statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    return {
      cachedPaths: this.resolvedPathCache.size,
      aliases: this.aliases.size,
      basePaths: this.basePaths.size,
      componentMappings: this.componentPathMappings.size,
    };
  }

  /**
   * Resolve multiple CSS files at once
   * @param {string[]} cssFiles - Array of CSS file names
   * @param {string} componentPath - Component directory path (optional)
   * @param {string} componentName - Component name (optional)
   * @returns {Map<string, string|null>} - Map of CSS files to resolved paths
   */
  resolveMultiple(cssFiles, componentPath = null, componentName = null) {
    const results = new Map();
    
    for (const cssFile of cssFiles) {
      const resolvedPath = this.resolve(cssFile, componentPath, componentName);
      results.set(cssFile, resolvedPath);
    }

    return results;
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
      logMethod(`[CSSPathResolver] ${message}`, ...args);
    }
  }
}

// Create singleton resolver
const cssPathResolver = new CSSPathResolver();

// Export both class and singleton
export { cssPathResolver };
export default cssPathResolver;