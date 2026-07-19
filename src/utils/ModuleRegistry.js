// Module Registry
// Central registry for ES6 module component registration and dependency injection
// Foundation for the modular component architecture

class ModuleRegistry {
  /**
   * Create a module registry
   * @param {Object} options - Registry options
   * @param {boolean} options.strictMode - Enable strict duplicate/dependent validation (default: true)
   * @param {boolean} options.debugMode - Enable debug logging (default: false)
   * @param {number} options.maxModules - Maximum number of registered modules (default: unlimited)
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

    // Event listeners: eventName -> Set of callbacks
    this.listeners = new Map();

    // Track circular dependency detection
    this.resolutionStack = new Set();

    // Module type tracking
    this.moduleTypes = {
      component: new Set(),
      game: new Set(),
      theme: new Set(),
      utility: new Set()
    };
  }

  /**
   * Register a module in the registry.
   * Never throws: invalid input, duplicates in strict mode, and capacity
   * overflows return false (with a console warning) instead. Dependency
   * existence is checked at resolution time, not registration time, so
   * modules can be registered in any order.
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
      console.warn('[ModuleRegistry] Registration rejected: module name must be a non-empty string');
      return false;
    }

    if (!module) {
      console.warn(`[ModuleRegistry] Registration rejected for '${name}': module cannot be null or undefined`);
      return false;
    }

    // Check for duplicate registration
    const isDuplicate = this.modules.has(name);
    if (isDuplicate) {
      if (this.options.strictMode) {
        console.warn(`[ModuleRegistry] Registration rejected: module '${name}' is already registered`);
        return false;
      }
      this.log(`Warning: Overwriting existing module '${name}'`);
    }

    // Enforce module count limit for new registrations
    if (
      !isDuplicate &&
      typeof this.options.maxModules === 'number' &&
      this.modules.size >= this.options.maxModules
    ) {
      console.warn(
        `[ModuleRegistry] Registration rejected for '${name}': module limit of ${this.options.maxModules} reached`
      );
      return false;
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

    // Missing dependencies are surfaced by resolveDependencies()/validate();
    // note them in debug mode only.
    for (const dep of moduleDefinition.dependencies) {
      if (!this.modules.has(dep)) {
        this.log(`Module '${name}' registered with unresolved dependency '${dep}'`);
      }
    }

    // When overwriting, drop stale type tracking for the old definition
    if (isDuplicate) {
      const previous = this.modules.get(name);
      if (this.moduleTypes[previous.type]) {
        this.moduleTypes[previous.type].delete(name);
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

    this.emit('moduleRegistered', {
      moduleName: name,
      name,
      module,
      options: { ...options, type: moduleDefinition.type },
      definition: moduleDefinition
    });

    return true;
  }

  /**
   * Retrieve a module from the registry.
   * Never throws: returns null for invalid names and unknown modules.
   * @param {string} name - Module name
   * @param {Object} options - Retrieval options
   * @param {boolean} options.withDependencies - Resolve dependencies recursively
   * @returns {Object|null} - Module definition or null if not found
   */
  get(name, options = {}) {
    if (!name || typeof name !== 'string' || !this.modules.has(name)) {
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
   * Check whether a module is registered
   * @param {string} name - Module name
   * @returns {boolean} - True if the module is registered
   */
  has(name) {
    return this.modules.has(name);
  }

  /**
   * Resolve module dependencies recursively.
   * Never throws: missing and circular dependencies are reported in the
   * returned result object instead.
   * @param {string} name - Module name
   * @returns {Object} - Module definition extended with resolution results:
   *   resolved (boolean), missingDependencies (string[]),
   *   circularDependency (boolean), resolvedDependencies (Object)
   */
  resolveDependencies(name) {
    const moduleDefinition = this.modules.get(name);
    if (!moduleDefinition) {
      return {
        name,
        resolved: false,
        missingDependencies: [name],
        circularDependency: false,
        resolvedDependencies: {}
      };
    }

    // A module already on the resolution stack means a dependency cycle
    if (this.resolutionStack.has(name)) {
      return {
        ...moduleDefinition,
        resolved: false,
        missingDependencies: [],
        circularDependency: true,
        resolvedDependencies: {}
      };
    }

    this.resolutionStack.add(name);

    try {
      const missingDependencies = [];
      const resolvedDependencies = {};
      let circularDependency = false;

      for (const depName of moduleDefinition.dependencies) {
        if (!this.modules.has(depName)) {
          missingDependencies.push(depName);
          continue;
        }

        const depResult = this.resolveDependencies(depName);
        resolvedDependencies[depName] = depResult;

        if (!depResult.resolved) {
          if (depResult.circularDependency) {
            circularDependency = true;
          }
          missingDependencies.push(...(depResult.missingDependencies || []));
        }
      }

      return {
        ...moduleDefinition,
        resolved: missingDependencies.length === 0 && !circularDependency,
        missingDependencies,
        circularDependency,
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

    this.emit('moduleUnregistered', {
      moduleName: name,
      name,
      definition: moduleDefinition
    });

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
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Listener callback
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      return;
    }
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Listener callback to remove
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit an event to registered listeners
   * @param {string} event - Event name
   * @param {*} payload - Event payload passed to listeners
   */
  emit(event, payload) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) {
      return;
    }
    for (const callback of callbacks) {
      try {
        callback(payload);
      } catch (error) {
        console.warn(`[ModuleRegistry] Listener error for event '${event}':`, error);
      }
    }
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
    for (const name of this.modules.keys()) {
      this.resolutionStack.clear();
      const resolution = this.resolveDependencies(name);
      if (resolution.circularDependency) {
        results.errors.push(`Circular dependency detected involving module '${name}'`);
        results.valid = false;
      }
    }

    return results;
  }

  /**
   * Validate a single registered module
   * @param {string} name - Module name
   * @returns {Object|null} - Validation results, or null if the module is not registered
   */
  validateModule(name) {
    if (!name || typeof name !== 'string' || !this.modules.has(name)) {
      return null;
    }

    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    const moduleDefinition = this.modules.get(name);

    for (const dep of moduleDefinition.dependencies) {
      if (!this.modules.has(dep)) {
        results.errors.push(`Module '${name}' has missing dependency '${dep}'`);
        results.valid = false;
      }
    }

    this.resolutionStack.clear();
    const resolution = this.resolveDependencies(name);
    if (resolution.circularDependency) {
      results.errors.push(`Circular dependency detected involving module '${name}'`);
      results.valid = false;
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
