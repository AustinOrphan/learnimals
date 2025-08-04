// Module Registry
// Central registry for ES6 module component registration and dependency injection
// Foundation for the modular component architecture

class ModuleRegistry {
  /**
   * Create a module registry
   * @param {Object} options - Registry options
   * @param {boolean} options.strictMode - Enable strict dependency validation (default: true)
   * @param {boolean} options.debugMode - Enable debug logging (default: false)
   */
  constructor(options = {}) {
    this.options = {
      strictMode: options.strictMode !== false,
      debugMode: options.debugMode || false,
      ...options
    };
    
    // Core storage for registered modules
    this.modules = new Map();
    this.dependencies = new Map();
    this.loadPromises = new Map();
    
    // Track circular dependency detection
    this.resolutionStack = new Set();
    
    // Module type tracking
    this.moduleTypes = {
      component: new Set(),
      game: new Set(),
      theme: new Set(),
      utility: new Set()
    };
    
    this.log('ModuleRegistry initialized', { strictMode: this.options.strictMode });
  }

  /**
   * Register a module in the registry
   * @param {string} name - Module name/identifier
   * @param {Object|Function} module - ES6 module or component class
   * @param {Object} options - Registration options
   * @param {string} options.type - Module type: 'component', 'game', 'theme', 'utility'
   * @param {string[]} options.dependencies - Array of dependency module names
   * @param {string} options.version - Module version
   * @param {Object} options.metadata - Additional module metadata
   * @returns {boolean} - Success status
   */
  register(name, module, options = {}) {
    if (!name || typeof name !== 'string') {
      throw new Error('Module name must be a non-empty string');
    }
    
    if (!module) {
      throw new Error('Module cannot be null or undefined');
    }
    
    // Check for duplicate registration
    if (this.modules.has(name)) {
      if (this.options.strictMode) {
        throw new Error(`Module '${name}' is already registered`);
      } else {
        this.log(`Warning: Overwriting existing module '${name}'`);
      }
    }
    
    // Create module definition
    const moduleDefinition = {
      name,
      type: options.type || 'component',
      module,
      dependencies: options.dependencies || [],
      version: options.version || '1.0.0',
      metadata: options.metadata || {},
      registeredAt: new Date().toISOString()
    };
    
    // Validate dependencies exist (if strict mode)
    if (this.options.strictMode && moduleDefinition.dependencies.length > 0) {
      for (const dep of moduleDefinition.dependencies) {
        if (!this.modules.has(dep)) {
          throw new Error(`Dependency '${dep}' not found for module '${name}'`);
        }
      }
    }
    
    // Register the module
    this.modules.set(name, moduleDefinition);
    this.dependencies.set(name, new Set(moduleDefinition.dependencies));
    
    // Track by type
    if (this.moduleTypes[moduleDefinition.type]) {
      this.moduleTypes[moduleDefinition.type].add(name);
    }
    
    this.log(`Registered module '${name}' of type '${moduleDefinition.type}'`, moduleDefinition);
    return true;
  }

  /**
   * Retrieve a module from the registry
   * @param {string} name - Module name
   * @param {Object} options - Retrieval options
   * @param {boolean} options.withDependencies - Load dependencies recursively
   * @returns {Object|null} - Module definition or null if not found
   */
  get(name, options = {}) {
    if (!this.modules.has(name)) {
      if (this.options.strictMode) {
        throw new Error(`Module '${name}' not found in registry`);
      }
      return null;
    }
    
    const moduleDefinition = this.modules.get(name);
    
    // If dependencies requested, resolve them
    if (options.withDependencies && moduleDefinition.dependencies.length > 0) {
      return this.resolveDependencies(name);
    }
    
    return moduleDefinition;
  }

  /**
   * Resolve module dependencies recursively
   * @param {string} name - Module name
   * @returns {Object} - Module with resolved dependencies
   */
  resolveDependencies(name) {
    // Prevent circular dependencies
    if (this.resolutionStack.has(name)) {
      const stack = Array.from(this.resolutionStack).join(' -> ');
      throw new Error(`Circular dependency detected: ${stack} -> ${name}`);
    }
    
    this.resolutionStack.add(name);
    
    try {
      const moduleDefinition = this.modules.get(name);
      if (!moduleDefinition) {
        throw new Error(`Module '${name}' not found during dependency resolution`);
      }
      
      // Resolve each dependency
      const resolvedDependencies = {};
      for (const depName of moduleDefinition.dependencies) {
        resolvedDependencies[depName] = this.resolveDependencies(depName);
      }
      
      // Return module with resolved dependencies
      return {
        ...moduleDefinition,
        resolvedDependencies
      };
    } finally {
      this.resolutionStack.delete(name);
    }
  }

  /**
   * List all registered modules
   * @param {Object} options - List options
   * @param {string} options.type - Filter by module type
   * @param {boolean} options.includeMetadata - Include full metadata
   * @returns {Array} - Array of module information
   */
  list(options = {}) {
    let modules = Array.from(this.modules.values());
    
    // Filter by type if specified
    if (options.type && this.moduleTypes[options.type]) {
      modules = modules.filter(mod => mod.type === options.type);
    }
    
    // Return simplified or full data
    if (options.includeMetadata) {
      return modules;
    } else {
      return modules.map(mod => ({
        name: mod.name,
        type: mod.type,
        version: mod.version,
        dependencies: mod.dependencies
      }));
    }
  }

  /**
   * Remove a module from the registry
   * @param {string} name - Module name
   * @returns {boolean} - Success status
   */
  unregister(name) {
    if (!this.modules.has(name)) {
      return false;
    }
    
    const moduleDefinition = this.modules.get(name);
    
    // Check if other modules depend on this one
    const dependents = this.findDependents(name);
    if (dependents.length > 0 && this.options.strictMode) {
      throw new Error(`Cannot unregister '${name}': modules depend on it: ${dependents.join(', ')}`);
    }
    
    // Remove from all tracking structures
    this.modules.delete(name);
    this.dependencies.delete(name);
    this.loadPromises.delete(name);
    
    // Remove from type tracking
    if (this.moduleTypes[moduleDefinition.type]) {
      this.moduleTypes[moduleDefinition.type].delete(name);
    }
    
    this.log(`Unregistered module '${name}'`);
    return true;
  }

  /**
   * Find modules that depend on the given module
   * @param {string} name - Module name
   * @returns {string[]} - Array of dependent module names
   */
  findDependents(name) {
    const dependents = [];
    for (const [moduleName, deps] of this.dependencies) {
      if (deps.has(name)) {
        dependents.push(moduleName);
      }
    }
    return dependents;
  }

  /**
   * Clear all registered modules
   * @param {Object} options - Clear options
   * @param {string} options.type - Only clear modules of specific type
   */
  clear(options = {}) {
    if (options.type) {
      // Clear only specific type
      const modulesToClear = Array.from(this.moduleTypes[options.type] || []);
      for (const name of modulesToClear) {
        this.unregister(name);
      }
    } else {
      // Clear everything
      this.modules.clear();
      this.dependencies.clear();
      this.loadPromises.clear();
      
      // Clear type tracking
      for (const typeSet of Object.values(this.moduleTypes)) {
        typeSet.clear();
      }
    }
    
    this.log('Registry cleared', options);
  }

  /**
   * Get registry statistics
   * @returns {Object} - Registry statistics
   */
  getStats() {
    const stats = {
      totalModules: this.modules.size,
      modulesByType: {},
      averageDependencies: 0,
      maxDependencies: 0,
      modulesWithNoDependencies: 0
    };
    
    // Calculate type distribution
    for (const [type, modules] of Object.entries(this.moduleTypes)) {
      stats.modulesByType[type] = modules.size;
    }
    
    // Calculate dependency statistics
    let totalDeps = 0;
    let maxDeps = 0;
    let noDeps = 0;
    
    for (const deps of this.dependencies.values()) {
      const depCount = deps.size;
      totalDeps += depCount;
      maxDeps = Math.max(maxDeps, depCount);
      if (depCount === 0) noDeps++;
    }
    
    stats.averageDependencies = this.modules.size > 0 ? totalDeps / this.modules.size : 0;
    stats.maxDependencies = maxDeps;
    stats.modulesWithNoDependencies = noDeps;
    
    return stats;
  }

  /**
   * Validate registry integrity
   * @returns {Object} - Validation results
   */
  validate() {
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check for missing dependencies
    for (const [name, deps] of this.dependencies) {
      for (const dep of deps) {
        if (!this.modules.has(dep)) {
          results.errors.push(`Module '${name}' has missing dependency '${dep}'`);
          results.valid = false;
        }
      }
    }
    
    // Check for circular dependencies
    try {
      for (const name of this.modules.keys()) {
        this.resolutionStack.clear();
        this.resolveDependencies(name);
      }
    } catch (error) {
      if (error.message.includes('Circular dependency')) {
        results.errors.push(error.message);
        results.valid = false;
      }
    }
    
    return results;
  }

  /**
   * Debug logging utility
   * @param {string} message - Log message
   * @param {Object} data - Optional data to log
   */
  log(message, data) {
    if (this.options.debugMode) {
      console.log(`[ModuleRegistry] ${message}`, data || '');
    }
  }
}

export default ModuleRegistry;