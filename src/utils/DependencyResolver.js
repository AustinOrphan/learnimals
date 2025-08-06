/**
 * DependencyResolver - Automatic component loading and dependency management
 * Provides intelligent component loading with circular dependency detection,
 * caching, and error recovery
 */

import { ComponentManifest, componentRegistry } from './ComponentManifest.js';

/**
 * DependencyResolver class for managing component dependencies
 */
export class DependencyResolver {
  constructor() {
    this.loadingQueue = new Map(); // Track components being loaded
    this.loadedModules = new Map(); // Cache for loaded modules
    this.failedLoads = new Set(); // Track failed loads to prevent retries
    this.loadingPromises = new Map(); // Prevent duplicate loading attempts
    this.circularDependencyChain = new Set(); // Track circular dependency detection
    
    // Configuration
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      enableCaching: true,
      logLevel: 'warn', // 'debug', 'info', 'warn', 'error', 'silent'
    };
  }

  /**
   * Configure the dependency resolver
   * @param {Object} options - Configuration options
   */
  configure(options = {}) {
    Object.assign(this.config, options);
    return this;
  }

  /**
   * Load a component and all its dependencies
   * @param {string} componentName - Name of the component to load
   * @param {Object} options - Loading options
   * @returns {Promise<Function>} - Loaded component constructor
   */
  async loadComponent(componentName, options = {}) {
    const {
      timeout = this.config.timeout,
      enableCache = this.config.enableCaching,
      basePath = '../components/',
    } = options;

    this.log('debug', `Loading component: ${componentName}`);

    // Check cache first
    if (enableCache && this.loadedModules.has(componentName)) {
      this.log('debug', `Component ${componentName} loaded from cache`);
      return this.loadedModules.get(componentName);
    }

    // Check if already loading
    if (this.loadingPromises.has(componentName)) {
      this.log('debug', `Component ${componentName} already loading, waiting...`);
      return this.loadingPromises.get(componentName);
    }

    // Check if previously failed
    if (this.failedLoads.has(componentName)) {
      throw new Error(`Component '${componentName}' previously failed to load`);
    }

    // Create loading promise
    const loadingPromise = this.performLoad(componentName, basePath, timeout);
    this.loadingPromises.set(componentName, loadingPromise);

    try {
      const component = await loadingPromise;
      
      // Cache successful load
      if (enableCache) {
        this.loadedModules.set(componentName, component);
      }
      
      this.loadingPromises.delete(componentName);
      this.log('info', `Component ${componentName} loaded successfully`);
      
      return component;
    } catch (error) {
      this.loadingPromises.delete(componentName);
      this.failedLoads.add(componentName);
      this.log('error', `Failed to load component ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * Load component with all dependencies resolved
   * @param {string} componentName - Name of the component
   * @param {Object} options - Loading options
   * @returns {Promise<Function>} - Loaded component with dependencies
   */
  async loadWithDependencies(componentName, options = {}) {
    this.log('debug', `Loading ${componentName} with dependencies`);
    
    // Clear circular dependency detection for new load chain
    this.circularDependencyChain.clear();
    
    try {
      // Load the component and its dependency tree
      const component = await this.recursiveLoad(componentName, options);
      
      this.log('info', `Component ${componentName} and all dependencies loaded`);
      return component;
    } catch (error) {
      this.log('error', `Failed to load ${componentName} with dependencies:`, error);
      throw error;
    }
  }

  /**
   * Recursively load component and its dependencies
   * @private
   * @param {string} componentName - Component name
   * @param {Object} options - Loading options
   * @returns {Promise<Function>} - Loaded component
   */
  async recursiveLoad(componentName, options = {}) {
    // Check for circular dependencies
    if (this.circularDependencyChain.has(componentName)) {
      const chain = Array.from(this.circularDependencyChain).join(' -> ');
      throw new Error(`Circular dependency detected: ${chain} -> ${componentName}`);
    }

    // Add to circular dependency chain
    this.circularDependencyChain.add(componentName);

    try {
      // Load component manifest first
      const manifest = await this.loadComponentManifest(componentName, options);
      
      // Load dependencies first
      if (manifest && manifest.data.dependencies) {
        for (const depName of manifest.data.dependencies) {
          this.log('debug', `Loading dependency ${depName} for ${componentName}`);
          await this.recursiveLoad(depName, options);
        }
      }

      // Load the actual component
      const component = await this.loadComponent(componentName, options);
      
      // Remove from circular dependency chain
      this.circularDependencyChain.delete(componentName);
      
      return component;
    } catch (error) {
      // Clean up circular dependency chain on error
      this.circularDependencyChain.delete(componentName);
      throw error;
    }
  }

  /**
   * Load component manifest
   * @private
   * @param {string} componentName - Component name
   * @param {Object} options - Loading options
   * @returns {Promise<ComponentManifest|null>} - Loaded manifest
   */
  async loadComponentManifest(componentName, options = {}) {
    const { basePath = '../components/' } = options;
    
    try {
      // Try to load from component directory
      const componentPath = this.resolveComponentPath(componentName, basePath);
      const manifest = await ComponentManifest.loadFromPath(componentPath);
      
      if (manifest && manifest.isValid) {
        // Register in component registry
        componentRegistry.register(componentName, manifest);
        return manifest;
      }
    } catch (error) {
      this.log('debug', `Could not load manifest for ${componentName}:`, error);
    }

    // Check if already registered
    const existing = componentRegistry.get(componentName);
    if (existing) {
      return existing;
    }

    // No manifest found
    this.log('debug', `No manifest found for ${componentName}, proceeding without`);
    return null;
  }

  /**
   * Perform the actual component loading
   * @private
   * @param {string} componentName - Component name
   * @param {string} basePath - Base path for components
   * @param {number} timeout - Loading timeout
   * @returns {Promise<Function>} - Loaded component
   */
  async performLoad(componentName, basePath, timeout) {
    const componentPath = this.resolveComponentPath(componentName, basePath);
    const filePath = `${componentPath}/${componentName}.js`;

    this.log('debug', `Importing from: ${filePath}`);

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Loading timeout for ${componentName}`)), timeout)
    );

    // Import with timeout
    const importPromise = this.dynamicImport(filePath);
    
    const module = await Promise.race([importPromise, timeoutPromise]);
    
    if (!module) {
      throw new Error(`Failed to import component ${componentName}`);
    }

    // Get the component constructor
    const ComponentClass = module.default || module[componentName] || module;
    
    if (typeof ComponentClass !== 'function') {
      throw new Error(`Component ${componentName} does not export a constructor function`);
    }

    return ComponentClass;
  }

  /**
   * Dynamic import with error handling
   * @private
   * @param {string} modulePath - Path to module
   * @returns {Promise<Object>} - Imported module
   */
  async dynamicImport(modulePath) {
    try {
      return await import(modulePath);
    } catch (error) {
      // Try different path variations
      const variations = [
        modulePath,
        modulePath.replace('.js', '/index.js'),
        modulePath.replace('.js', '') + '.mjs',
      ];

      for (const variation of variations) {
        try {
          this.log('debug', `Trying alternative path: ${variation}`);
          return await import(variation);
        } catch (altError) {
          // Continue to next variation
        }
      }

      throw new Error(`Could not import ${modulePath}: ${error.message}`);
    }
  }

  /**
   * Resolve component path from name
   * @private
   * @param {string} componentName - Component name
   * @param {string} basePath - Base path
   * @returns {string} - Resolved path
   */
  resolveComponentPath(componentName, basePath) {
    // Handle different component path patterns
    const pathMappings = {
      'Card': 'ui',
      'Modal': 'ui',
      'Button': 'ui',
      'Form': 'forms',
      'Input': 'forms',
      'Navigation': 'layout',
      'Navbar': 'layout',
    };

    const category = pathMappings[componentName] || 'ui';
    return `${basePath}${category}`;
  }

  /**
   * Preload multiple components
   * @param {string[]} componentNames - Array of component names
   * @param {Object} options - Loading options
   * @returns {Promise<Map<string, Function>>} - Map of loaded components
   */
  async preloadComponents(componentNames, options = {}) {
    this.log('info', `Preloading ${componentNames.length} components`);
    
    const results = new Map();
    const promises = componentNames.map(async (name) => {
      try {
        const component = await this.loadWithDependencies(name, options);
        results.set(name, component);
        return { name, component, success: true };
      } catch (error) {
        this.log('error', `Failed to preload ${name}:`, error);
        return { name, error, success: false };
      }
    });

    const loadResults = await Promise.allSettled(promises);
    
    // Log results
    const successful = loadResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = loadResults.length - successful;
    
    this.log('info', `Preload complete: ${successful} successful, ${failed} failed`);
    
    return results;
  }

  /**
   * Clear caches and reset state
   */
  clearCache() {
    this.loadedModules.clear();
    this.failedLoads.clear();
    this.loadingPromises.clear();
    this.loadingQueue.clear();
    this.circularDependencyChain.clear();
    this.log('info', 'Dependency resolver cache cleared');
  }

  /**
   * Get loading statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    return {
      loaded: this.loadedModules.size,
      failed: this.failedLoads.size,
      loading: this.loadingPromises.size,
      cached: this.config.enableCaching ? this.loadedModules.size : 0,
    };
  }

  /**
   * Check if component is loaded
   * @param {string} componentName - Component name
   * @returns {boolean} - True if loaded
   */
  isLoaded(componentName) {
    return this.loadedModules.has(componentName);
  }

  /**
   * Check if component is currently loading
   * @param {string} componentName - Component name
   * @returns {boolean} - True if loading
   */
  isLoading(componentName) {
    return this.loadingPromises.has(componentName);
  }

  /**
   * Retry failed component loads
   * @param {string[]} componentNames - Components to retry (defaults to all failed)
   * @returns {Promise<Map<string, Function>>} - Retry results
   */
  async retryFailedLoads(componentNames = null) {
    const toRetry = componentNames || Array.from(this.failedLoads);
    
    if (toRetry.length === 0) {
      this.log('info', 'No failed loads to retry');
      return new Map();
    }

    this.log('info', `Retrying ${toRetry.length} failed loads`);
    
    // Clear failed status for retry
    toRetry.forEach(name => this.failedLoads.delete(name));
    
    return this.preloadComponents(toRetry);
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
      logMethod(`[DependencyResolver] ${message}`, ...args);
    }
  }
}

// Create singleton resolver
const dependencyResolver = new DependencyResolver();

// Export both class and singleton
export { dependencyResolver };
export default dependencyResolver;