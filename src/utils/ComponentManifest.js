/**
 * ComponentManifest - Schema and utilities for component manifest system
 * Enables explicit dependency declaration and component metadata
 */

/**
 * Component manifest schema definition
 */
export const MANIFEST_SCHEMA = {
  name: {
    type: 'string',
    required: true,
    description: 'Component name (should match class name)'
  },
  version: {
    type: 'string',
    required: true,
    pattern: /^\d+\.\d+\.\d+$/,
    description: 'Semantic version (e.g., "1.0.0")'
  },
  description: {
    type: 'string',
    required: false,
    description: 'Brief component description'
  },
  dependencies: {
    type: 'array',
    required: false,
    default: [],
    description: 'Array of required component names'
  },
  css: {
    type: 'object',
    required: false,
    default: {
      files: [],
      variants: {},
      dependencies: [],
      scoping: 'component'
    },
    description: 'Enhanced CSS configuration with variants, dependencies, and scoping',
    schema: {
      files: {
        type: 'array',
        default: [],
        description: 'Array of CSS file paths relative to component'
      },
      variants: {
        type: 'object',
        default: {},
        description: 'CSS variants for themes, sizes, states, etc.',
        schema: {
          themes: {
            type: 'object',
            default: {},
            description: 'Theme-specific CSS overrides'
          },
          sizes: {
            type: 'object',
            default: {},
            description: 'Size variant CSS (small, medium, large, etc.)'
          },
          states: {
            type: 'object',
            default: {},
            description: 'State-specific CSS (hover, active, disabled, etc.)'
          },
          responsive: {
            type: 'object',
            default: {},
            description: 'Responsive breakpoint CSS variants'
          }
        }
      },
      dependencies: {
        type: 'array',
        default: [],
        description: 'CSS dependencies that must be loaded before this component'
      },
      scoping: {
        type: 'string',
        default: 'component',
        enum: ['global', 'component', 'scoped', 'css-modules'],
        description: 'CSS scoping strategy for this component'
      },
      critical: {
        type: 'boolean',
        default: false,
        description: 'Whether this CSS is critical and should be loaded immediately'
      },
      lazy: {
        type: 'boolean',
        default: false,
        description: 'Whether this CSS should be loaded on demand'
      },
      media: {
        type: 'string',
        required: false,
        description: 'Media query for conditional CSS loading'
      },
      preload: {
        type: 'boolean',
        default: false,
        description: 'Whether to preload this CSS for performance'
      }
    }
  },
  themes: {
    type: 'array',
    required: false,
    default: ['default'],
    description: 'Supported theme names'
  },
  api: {
    type: 'object',
    required: false,
    description: 'Component API definition'
  },
  examples: {
    type: 'array',
    required: false,
    default: [],
    description: 'Array of usage example file paths'
  },
  tags: {
    type: 'array',
    required: false,
    default: [],
    description: 'Component category tags'
  },
  browser: {
    type: 'object',
    required: false,
    description: 'Browser compatibility requirements'
  },
  accessibility: {
    type: 'object',
    required: false,
    description: 'Accessibility compliance information'
  }
};

/**
 * ComponentManifest class for loading and validating component manifests
 */
export class ComponentManifest {
  constructor(manifestData = {}) {
    this.data = manifestData;
    this.isValid = false;
    this.errors = [];
    
    if (Object.keys(manifestData).length > 0) {
      this.validate();
    }
  }

  /**
   * Load manifest from component directory
   * @param {string} componentPath - Path to component directory
   * @returns {Promise<ComponentManifest>} - Loaded manifest
   */
  static async loadFromPath(componentPath) {
    try {
      const manifestPath = `${componentPath}/component.json`;
      const response = await fetch(manifestPath);
      
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.status}`);
      }
      
      const manifestData = await response.json();
      return new ComponentManifest(manifestData);
    } catch (error) {
      console.warn(`Could not load manifest from ${componentPath}:`, error);
      return new ComponentManifest();
    }
  }

  /**
   * Create manifest from component class
   * @param {Function} ComponentClass - Component constructor
   * @param {Object} options - Additional manifest options
   * @returns {ComponentManifest} - Generated manifest
   */
  static fromComponent(ComponentClass, options = {}) {
    // Handle CSS field - normalize to new format if needed
    let cssConfig = ComponentClass.css || [];
    
    // If it's an array (old format), convert to new object format
    if (Array.isArray(cssConfig)) {
      cssConfig = {
        files: cssConfig,
        variants: {},
        dependencies: [],
        scoping: 'component'
      };
    }

    const manifestData = {
      name: ComponentClass.name,
      version: ComponentClass.version || '1.0.0',
      description: ComponentClass.description || '',
      dependencies: ComponentClass.dependencies || [],
      css: cssConfig,
      themes: ComponentClass.themes || ['default'],
      api: ComponentClass.api || {},
      ...options
    };

    return new ComponentManifest(manifestData);
  }

  /**
   * Validate manifest data against schema
   * @returns {boolean} - True if valid
   */
  validate() {
    this.errors = [];
    this.isValid = true;

    // Handle backward compatibility for CSS field
    this.normalizeCSSField();

    for (const [key, schema] of Object.entries(MANIFEST_SCHEMA)) {
      const value = this.data[key];

      // Check required fields
      if (schema.required && (value === undefined || value === null)) {
        this.addError(`Required field '${key}' is missing`);
        continue;
      }

      // Skip validation if field is not present and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (!this.validateType(value, schema.type)) {
        this.addError(`Field '${key}' must be of type ${schema.type}`);
        continue;
      }

      // Pattern validation
      if (schema.pattern && typeof value === 'string' && !schema.pattern.test(value)) {
        this.addError(`Field '${key}' does not match required pattern`);
      }

      // Enum validation
      if (schema.enum && !schema.enum.includes(value)) {
        this.addError(`Field '${key}' must be one of: ${schema.enum.join(', ')}`);
      }

      // Array item validation
      if (schema.type === 'array' && schema.itemType) {
        for (let i = 0; i < value.length; i++) {
          if (!this.validateType(value[i], schema.itemType)) {
            this.addError(`Array item ${i} in '${key}' must be of type ${schema.itemType}`);
          }
        }
      }

      // Nested schema validation
      if (schema.schema && schema.type === 'object') {
        this.validateNestedSchema(value, schema.schema, key);
      }
    }

    return this.isValid;
  }

  /**
   * Get all component dependencies (including transitive)
   * @param {Map<string, ComponentManifest>} manifestRegistry - Registry of all manifests
   * @returns {Set<string>} - Set of all dependency names
   */
  getAllDependencies(manifestRegistry) {
    const allDeps = new Set();
    const visited = new Set();

    const collectDeps = (componentName) => {
      if (visited.has(componentName)) {
        return; // Prevent circular dependencies
      }
      visited.add(componentName);

      const manifest = manifestRegistry.get(componentName);
      if (!manifest) {
        console.warn(`Dependency '${componentName}' not found in registry`);
        return;
      }

      for (const dep of manifest.data.dependencies || []) {
        allDeps.add(dep);
        collectDeps(dep);
      }
    };

    collectDeps(this.data.name);
    return allDeps;
  }

  /**
   * Check compatibility with another component version
   * @param {string} version - Version to check against
   * @returns {boolean} - True if compatible
   */
  isCompatibleWith(version) {
    if (!this.data.version || !version) {
      return false;
    }

    const [ourMajor, ourMinor] = this.data.version.split('.').map(Number);
    const [theirMajor, theirMinor] = version.split('.').map(Number);

    // Major version must match, minor version can be higher
    return ourMajor === theirMajor && ourMinor >= theirMinor;
  }

  /**
   * Get CSS files that need to be loaded
   * @param {Object} options - Options for CSS file retrieval
   * @param {string} options.variant - Specific variant to get CSS for
   * @param {string} options.theme - Theme to get CSS for
   * @param {string} options.size - Size variant to get CSS for
   * @param {string} options.state - State to get CSS for
   * @param {boolean} options.includeVariants - Whether to include variant CSS
   * @returns {string[]} - Array of CSS file paths
   */
  getCSSFiles(options = {}) {
    const css = this.data.css || {};
    
    // Handle backward compatibility - if css is array, return it directly
    if (Array.isArray(css)) {
      return css;
    }

    const files = [...(css.files || [])];
    
    if (options.includeVariants !== false) {
      // Add variant-specific CSS files
      const variants = css.variants || {};
      
      if (options.theme && variants.themes && variants.themes[options.theme]) {
        files.push(...(variants.themes[options.theme].files || []));
      }
      
      if (options.size && variants.sizes && variants.sizes[options.size]) {
        files.push(...(variants.sizes[options.size].files || []));
      }
      
      if (options.state && variants.states && variants.states[options.state]) {
        files.push(...(variants.states[options.state].files || []));
      }
      
      if (options.variant && variants[options.variant]) {
        files.push(...(variants[options.variant].files || []));
      }
    }
    
    return files;
  }

  /**
   * Get CSS variants for a specific category
   * @param {string} category - Variant category (themes, sizes, states, responsive)
   * @returns {Object} - Variant definitions
   */
  getCSSVariants(category = null) {
    const css = this.data.css || {};
    
    // Handle backward compatibility
    if (Array.isArray(css)) {
      return {};
    }

    const variants = css.variants || {};
    
    if (category) {
      return variants[category] || {};
    }
    
    return variants;
  }

  /**
   * Get CSS dependencies that must be loaded before this component
   * @returns {string[]} - Array of CSS dependency paths or component names
   */
  getCSSdependencies() {
    const css = this.data.css || {};
    
    // Handle backward compatibility
    if (Array.isArray(css)) {
      return [];
    }

    return css.dependencies || [];
  }

  /**
   * Get CSS scoping strategy for this component
   * @returns {string} - Scoping strategy (global, component, scoped, css-modules)
   */
  getCSSScoping() {
    const css = this.data.css || {};
    
    // Handle backward compatibility
    if (Array.isArray(css)) {
      return 'global';
    }

    return css.scoping || 'component';
  }

  /**
   * Check if CSS should be loaded critically (immediately)
   * @returns {boolean} - True if critical
   */
  isCSSCritical() {
    const css = this.data.css || {};
    
    // Handle backward compatibility
    if (Array.isArray(css)) {
      return false;
    }

    return css.critical || false;
  }

  /**
   * Check if CSS should be loaded lazily (on demand)
   * @returns {boolean} - True if lazy loading
   */
  isCSSLazy() {
    const css = this.data.css || {};
    
    // Handle backward compatibility
    if (Array.isArray(css)) {
      return false;
    }

    return css.lazy || false;
  }

  /**
   * Get media query for conditional CSS loading
   * @returns {string|null} - Media query string or null
   */
  getCSSMedia() {
    const css = this.data.css || {};
    
    // Handle backward compatibility
    if (Array.isArray(css)) {
      return null;
    }

    return css.media || null;
  }

  /**
   * Check if CSS should be preloaded for performance
   * @returns {boolean} - True if should preload
   */
  shouldPreloadCSS() {
    const css = this.data.css || {};
    
    // Handle backward compatibility
    if (Array.isArray(css)) {
      return false;
    }

    return css.preload || false;
  }

  /**
   * Check if component supports a theme
   * @param {string} themeName - Theme name to check
   * @returns {boolean} - True if theme is supported
   */
  supportsTheme(themeName) {
    const themes = this.data.themes || ['default'];
    return themes.includes(themeName) || themes.includes('*');
  }

  /**
   * Get component API definition
   * @returns {Object} - API definition object
   */
  getAPI() {
    return this.data.api || {};
  }

  /**
   * Convert manifest to JSON string
   * @returns {string} - JSON representation
   */
  toJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Create a copy of the manifest
   * @returns {ComponentManifest} - Cloned manifest
   */
  clone() {
    return new ComponentManifest({ ...this.data });
  }

  /**
   * Validate value type
   * @private
   * @param {*} value - Value to validate
   * @param {string} expectedType - Expected type
   * @returns {boolean} - True if valid
   */
  validateType(value, expectedType) {
    switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return true;
    }
  }

  /**
   * Add validation error
   * @private
   * @param {string} message - Error message
   */
  addError(message) {
    this.errors.push(message);
    this.isValid = false;
  }

  /**
   * Normalize CSS field for backward compatibility
   * @private
   */
  normalizeCSSField() {
    if (!this.data.css) {
      return;
    }

    // If CSS is already an array (old format), convert to new object format
    if (Array.isArray(this.data.css)) {
      this.data.css = {
        files: this.data.css,
        variants: {},
        dependencies: [],
        scoping: 'global' // Maintain backward compatibility with existing global styles
      };
    }
  }

  /**
   * Validate nested schema
   * @private
   * @param {Object} value - Value to validate
   * @param {Object} nestedSchema - Schema for nested validation
   * @param {string} parentKey - Parent key for error reporting
   */
  validateNestedSchema(value, nestedSchema, parentKey) {
    for (const [nestedKey, nestedField] of Object.entries(nestedSchema)) {
      const nestedValue = value[nestedKey];
      const fieldPath = `${parentKey}.${nestedKey}`;

      // Check required fields
      if (nestedField.required && (nestedValue === undefined || nestedValue === null)) {
        this.addError(`Required field '${fieldPath}' is missing`);
        continue;
      }

      // Skip validation if field is not present and not required
      if (nestedValue === undefined || nestedValue === null) {
        continue;
      }

      // Type validation
      if (!this.validateType(nestedValue, nestedField.type)) {
        this.addError(`Field '${fieldPath}' must be of type ${nestedField.type}`);
        continue;
      }

      // Enum validation
      if (nestedField.enum && !nestedField.enum.includes(nestedValue)) {
        this.addError(`Field '${fieldPath}' must be one of: ${nestedField.enum.join(', ')}`);
      }

      // Pattern validation
      if (nestedField.pattern && typeof nestedValue === 'string' && !nestedField.pattern.test(nestedValue)) {
        this.addError(`Field '${fieldPath}' does not match required pattern`);
      }

      // Recursive schema validation
      if (nestedField.schema && nestedField.type === 'object') {
        this.validateNestedSchema(nestedValue, nestedField.schema, fieldPath);
      }

      // Array item validation
      if (nestedField.type === 'array' && nestedField.itemType) {
        for (let i = 0; i < nestedValue.length; i++) {
          if (!this.validateType(nestedValue[i], nestedField.itemType)) {
            this.addError(`Array item ${i} in '${fieldPath}' must be of type ${nestedField.itemType}`);
          }
        }
      }
    }
  }
}

/**
 * ComponentRegistry - Manages component manifests and dependencies
 */
export class ComponentRegistry {
  constructor() {
    this.manifests = new Map();
    this.loadedComponents = new Set();
    this.loadingPromises = new Map();
  }

  /**
   * Register a component manifest
   * @param {string} name - Component name
   * @param {ComponentManifest} manifest - Component manifest
   * @returns {boolean} - True if registered successfully
   */
  register(name, manifest) {
    if (!(manifest instanceof ComponentManifest)) {
      console.error(`Invalid manifest for component '${name}'`);
      return false;
    }

    if (!manifest.isValid) {
      console.error(`Invalid manifest for component '${name}':`, manifest.errors);
      return false;
    }

    this.manifests.set(name, manifest);
    return true;
  }

  /**
   * Get component manifest
   * @param {string} name - Component name
   * @returns {ComponentManifest|null} - Component manifest or null
   */
  get(name) {
    return this.manifests.get(name) || null;
  }

  /**
   * Check if component is registered
   * @param {string} name - Component name
   * @returns {boolean} - True if registered
   */
  has(name) {
    return this.manifests.has(name);
  }

  /**
   * Get all registered component names
   * @returns {string[]} - Array of component names
   */
  getAll() {
    return Array.from(this.manifests.keys());
  }

  /**
   * Resolve dependency tree for a component
   * @param {string} componentName - Component name
   * @returns {string[]} - Ordered array of dependencies to load
   */
  resolveDependencies(componentName) {
    const manifest = this.get(componentName);
    if (!manifest) {
      throw new Error(`Component '${componentName}' not found in registry`);
    }

    const resolved = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (name) => {
      if (visited.has(name)) {
        return;
      }

      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }

      visiting.add(name);

      const compManifest = this.get(name);
      if (compManifest) {
        for (const dep of compManifest.data.dependencies || []) {
          visit(dep);
        }
      }

      visiting.delete(name);
      visited.add(name);
      resolved.push(name);
    };

    visit(componentName);
    return resolved;
  }

  /**
   * Clear all registered manifests
   */
  clear() {
    this.manifests.clear();
    this.loadedComponents.clear();
    this.loadingPromises.clear();
  }
}

// Create singleton registry
const componentRegistry = new ComponentRegistry();

export { componentRegistry };
export default ComponentManifest;