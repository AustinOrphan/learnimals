// Component Loader
// Handles dynamic loading of HTML components and scripts with ModuleRegistry integration

import ModuleRegistry from './ModuleRegistry.js';

class ComponentLoader {
  /**
   * Create a component loader
   * @param {Object} options - Loader options
   * @param {string} options.basePath - Base path for components (default: '')
   */
  constructor(options = {}) {
    this.options = {
      basePath: options.basePath || '',
      enableModuleRegistry: options.enableModuleRegistry !== false,
      debugMode: options.debugMode || false,
      ...options
    };

    this.loadedComponents = new Set();
    this.loadPromises = {};
    this.moduleRegistry = null;
    
    // Initialize module registry integration
    if (this.options.enableModuleRegistry) {
      this.initializeModuleRegistry();
    }
  }

  /**
   * Initialize module registry integration
   */
  initializeModuleRegistry() {
    try {
      // Get or create global module registry
      this.moduleRegistry = this.getModuleRegistry();
      
      // Register this component loader as a service
      if (this.moduleRegistry) {
        this.moduleRegistry.register('ComponentLoader', this, {
          type: 'service',
          version: '1.0.0',
          dependencies: [],
          metadata: {
            className: 'ComponentLoader',
            description: 'Dynamic component loading service with module integration',
            capabilities: ['html-loading', 'script-loading', 'stylesheet-loading', 'module-integration'],
            timestamp: new Date().toISOString()
          }
        });
      }
      
    } catch (error) {
      if (this.options.debugMode) {
        console.warn('Module registry initialization failed for ComponentLoader:', error);
      }
      // Continue without module features rather than failing
    }
  }

  /**
   * Get or create the global module registry
   * @returns {ModuleRegistry} - Module registry instance
   */
  getModuleRegistry() {
    // Try to get existing global registry
    if (typeof window !== 'undefined' && window.LearnimalsModuleRegistry) {
      return window.LearnimalsModuleRegistry;
    }
    
    // Create new registry if none exists
    const registry = new ModuleRegistry({
      debugMode: this.options.debugMode,
      strictMode: false // Allow flexible registration during migration
    });
    
    // Store globally for sharing across components
    if (typeof window !== 'undefined') {
      window.LearnimalsModuleRegistry = registry;
    }
    
    return registry;
  }

  /**
   * Load an HTML component into a container element
   * @param {string} componentPath - Path to the component HTML file
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} [data={}] - Optional data to pass to the component
   * @returns {Promise<HTMLElement>} - Promise resolving to the container element
   */
  async loadComponent(componentPath, container, data = {}) {
    // Determine the full path
    const fullPath = this.resolvePath(componentPath);

    try {
      // Get the container element
      const containerEl =
        typeof container === 'string' ? document.querySelector(container) : container;

      if (!containerEl) {
        console.error(`Container not found: ${container}`);
        return Promise.reject(new Error(`Container not found: ${container}`));
      }

      // Fetch the component HTML
      const response = await fetch(fullPath);
      if (!response.ok) {
        throw new Error(
          `Failed to load component from ${fullPath}: ${response.status} ${response.statusText}`
        );
      }

      let html = await response.text();

      // Simple template replacement
      if (Object.keys(data).length > 0) {
        html = this.processTemplate(html, data);
      }

      // Insert the HTML into the container
      containerEl.innerHTML = html;

      // Track this component as loaded
      this.loadedComponents.add(componentPath);

      // Process any scripts in the component
      this.processComponentScripts(containerEl, componentPath);

      return containerEl;
    } catch (error) {
      console.error(`Error loading component ${componentPath}:`, error);
      return Promise.reject(error);
    }
  }

  /**
   * Load multiple components in parallel
   * @param {Array<{path: string, container: string|HTMLElement, data: Object}>} components
   * @returns {Promise<Array<HTMLElement>>} - Promise resolving to array of container elements
   */
  async loadMultipleComponents(components) {
    const promises = components.map(comp =>
      this.loadComponent(comp.path, comp.container, comp.data || {})
    );
    return Promise.all(promises);
  }

  /**
   * Resolve a component path
   * @param {string} path - Component path
   * @returns {string} - Full path
   */
  resolvePath(path) {
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
      return path;
    }
    return `${this.options.basePath}/${path}`;
  }

  /**
   * Process template strings in HTML
   * @param {string} html - HTML template
   * @param {Object} data - Data for template
   * @returns {string} - Processed HTML
   */
  processTemplate(html, data) {
    return html.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      return data[trimmedKey] !== undefined ? data[trimmedKey] : match;
    });
  }

  /**
   * Process scripts within a loaded component
   * @param {HTMLElement} container - Container element
   * @param {string} componentPath - Path to the component
   */
  processComponentScripts(container, _componentPath) {
    // Find all scripts in the component
    const scripts = container.querySelectorAll('script');

    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');

      // Copy attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // Special handling for src scripts
      if (oldScript.src) {
        // Add a cache-busting parameter to force reload if needed
        const scriptPath = oldScript.src;
        if (!this.loadedComponents.has(scriptPath)) {
          newScript.src =
            scriptPath + (scriptPath.includes('?') ? '&' : '?') + '_c=' + new Date().getTime();
          this.loadedComponents.add(scriptPath);
        } else {
          newScript.src = scriptPath;
        }
      } else {
        // For inline scripts
        newScript.textContent = oldScript.textContent;
      }

      // Replace the old script with the new one
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  /**
   * Load a stylesheet
   * @param {string} path - Path to the CSS file
   * @returns {Promise<HTMLLinkElement>} - Promise resolving to the link element
   */
  loadStylesheet(path) {
    return new Promise((resolve, reject) => {
      const fullPath = this.resolvePath(path);

      // Check if this stylesheet is already loaded
      const existingLink = document.querySelector(`link[href="${fullPath}"]`);
      if (existingLink) {
        resolve(existingLink);
        return;
      }

      // Create a new link element
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fullPath;

      link.onload = () => resolve(link);
      link.onerror = _err => reject(new Error(`Failed to load stylesheet: ${fullPath}`));

      document.head.appendChild(link);
    });
  }

  /**
   * Load a JavaScript module
   * @param {string} path - Path to the JS file
   * @returns {Promise<any>} - Promise resolving to the imported module
   */
  async loadScript(path) {
    const fullPath = this.resolvePath(path);

    // Check if we're already loading this script
    if (this.loadPromises[fullPath]) {
      return this.loadPromises[fullPath];
    }

    // For ES modules
    if (path.endsWith('.mjs') || path.includes('type=module')) {
      try {
        this.loadPromises[fullPath] = import(fullPath);
        const module = await this.loadPromises[fullPath];
        
        // Register module in registry if available
        if (this.moduleRegistry && module.default) {
          const moduleName = path.split('/').pop().replace(/\.(m)?js$/, '');
          this.moduleRegistry.register(moduleName, module.default, {
            type: 'dynamically-loaded',
            source: 'ComponentLoader',
            path: fullPath,
            timestamp: new Date().toISOString()
          });
        }
        
        return module;
      } catch (error) {
        console.error(`Error importing module ${path}:`, error);
        throw error;
      }
    }
    // For traditional scripts
    else {
      this.loadPromises[fullPath] = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = fullPath;

        script.onload = () => resolve(script);
        script.onerror = () => reject(new Error(`Failed to load script: ${fullPath}`));

        document.head.appendChild(script);
      });

      return this.loadPromises[fullPath];
    }
  }

  /**
   * Load component from module registry
   * @param {string} componentName - Component name in registry
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} [options={}] - Component options
   * @returns {Promise<*>} - Promise resolving to component instance
   */
  async loadFromRegistry(componentName, container, options = {}) {
    if (!this.moduleRegistry) {
      throw new Error('Module registry not available');
    }
    
    const componentInfo = this.moduleRegistry.get(componentName);
    if (!componentInfo) {
      throw new Error(`Component '${componentName}' not found in registry`);
    }
    
    const ComponentClass = componentInfo.module;
    
    // Create and render component instance
    const instance = new ComponentClass(options);
    
    if (typeof instance.render === 'function') {
      await instance.render(container);
    }
    
    return instance;
  }

  /**
   * Get module registry instance
   * @returns {ModuleRegistry|null} - Module registry or null
   */
  getRegistry() {
    return this.moduleRegistry;
  }
}

// ES module export
export default ComponentLoader;
