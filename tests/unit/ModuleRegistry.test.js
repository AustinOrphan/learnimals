/**
 * ModuleRegistry Unit Tests
 * Unit tests for the central module registry system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('ModuleRegistry', () => {
  let ModuleRegistry;
  let registry;
  let originalWindow;
  
  beforeEach(async () => {
    // Store original window state
    originalWindow = global.window;
    
    // Mock window environment
    global.window = {
      LearnimalsModuleRegistry: undefined
    };
    
    // Clear module cache and reimport
    vi.resetModules();
    const module = await import('../../src/utils/ModuleRegistry.js');
    ModuleRegistry = module.default;
    
    // Create fresh registry instance
    registry = new ModuleRegistry();
  });
  
  afterEach(() => {
    // Restore original window
    if (originalWindow) {
      global.window = originalWindow;
    } else {
      delete global.window;
    }
  });

  describe('Registry Initialization', () => {
    it('should create registry with default options', () => {
      expect(registry).toBeDefined();
      expect(registry.options.debugMode).toBe(false);
      expect(registry.options.strictMode).toBe(true);
    });
    
    it('should create registry with custom options', () => {
      const customRegistry = new ModuleRegistry({
        debugMode: true,
        strictMode: false,
        maxModules: 500
      });
      
      expect(customRegistry.options.debugMode).toBe(true);
      expect(customRegistry.options.strictMode).toBe(false);
      expect(customRegistry.options.maxModules).toBe(500);
    });
    
    it('should initialize empty modules collection', () => {
      expect(Array.from(registry.list())).toEqual([]);
    });
  });

  describe('Component Registration', () => {
    class TestComponent {
      constructor() {
        this.name = 'TestComponent';
      }
    }
    
    it('should register a component successfully', () => {
      const result = registry.register('TestComponent', TestComponent);
      
      expect(result).toBe(true);
      expect(registry.list().map(mod => mod.name)).toContain('TestComponent');
    });
    
    it('should register component with metadata', () => {
      const options = {
        type: 'component',
        version: '1.0.0',
        dependencies: ['BaseComponent'],
        metadata: {
          author: 'test',
          description: 'Test component'
        }
      };
      
      const result = registry.register('TestComponent', TestComponent, options);
      
      expect(result).toBe(true);
      
      const retrieved = registry.get('TestComponent');
      expect(retrieved.type).toBe('component');
      expect(retrieved.version).toBe('1.0.0');
      expect(retrieved.dependencies).toEqual(['BaseComponent']);
      expect(retrieved.metadata.author).toBe('test');
    });
    
    it('should prevent duplicate registration in strict mode', () => {
      registry.register('TestComponent', TestComponent);
      
      const result = registry.register('TestComponent', TestComponent);
      
      expect(result).toBe(false);
    });
    
    it('should allow duplicate registration in non-strict mode', () => {
      const nonStrictRegistry = new ModuleRegistry({ strictMode: false });
      
      nonStrictRegistry.register('TestComponent', TestComponent);
      const result = nonStrictRegistry.register('TestComponent', TestComponent);
      
      expect(result).toBe(true);
    });
    
    it('should reject invalid module names', () => {
      expect(registry.register('', TestComponent)).toBe(false);
      expect(registry.register(null, TestComponent)).toBe(false);
      expect(registry.register(undefined, TestComponent)).toBe(false);
    });
    
    it('should reject invalid modules', () => {
      expect(registry.register('TestComponent', null)).toBe(false);
      expect(registry.register('TestComponent', undefined)).toBe(false);
    });
  });

  describe('Component Retrieval', () => {
    class TestComponent {
      constructor() {
        this.name = 'TestComponent';
      }
    }
    
    beforeEach(() => {
      registry.register('TestComponent', TestComponent, {
        type: 'component',
        version: '1.0.0'
      });
    });
    
    it('should retrieve registered component', () => {
      const retrieved = registry.get('TestComponent');
      
      expect(retrieved).toBeDefined();
      expect(retrieved.module).toBe(TestComponent);
      expect(retrieved.type).toBe('component');
      expect(retrieved.version).toBe('1.0.0');
    });
    
    it('should return null for non-existent component', () => {
      const retrieved = registry.get('NonExistentComponent');
      
      expect(retrieved).toBeNull();
    });
    
    it('should return null for invalid component names', () => {
      expect(registry.get('')).toBeNull();
      expect(registry.get(null)).toBeNull();
      expect(registry.get(undefined)).toBeNull();
    });
  });

  describe('Dependency Resolution', () => {
    class BaseComponent {}
    class DependentComponent {}
    class CircularComponent1 {}
    class CircularComponent2 {}
    
    beforeEach(() => {
      registry.register('BaseComponent', BaseComponent);
      registry.register('DependentComponent', DependentComponent, {
        dependencies: ['BaseComponent']
      });
    });
    
    it('should resolve valid dependencies', async () => {
      const resolved = await registry.resolveDependencies('DependentComponent');
      
      expect(resolved).toBeDefined();
      expect(resolved.dependencies).toContain('BaseComponent');
      expect(resolved.resolved).toBe(true);
    });
    
    it('should detect missing dependencies', async () => {
      registry.register('ComponentWithMissingDep', DependentComponent, {
        dependencies: ['NonExistentComponent']
      });
      
      const resolved = await registry.resolveDependencies('ComponentWithMissingDep');
      
      expect(resolved.resolved).toBe(false);
      expect(resolved.missingDependencies).toContain('NonExistentComponent');
    });
    
    it('should detect circular dependencies', async () => {
      registry.register('CircularComponent1', CircularComponent1, {
        dependencies: ['CircularComponent2']
      });
      registry.register('CircularComponent2', CircularComponent2, {
        dependencies: ['CircularComponent1']
      });
      
      const resolved = await registry.resolveDependencies('CircularComponent1');
      
      expect(resolved.resolved).toBe(false);
      expect(resolved.circularDependency).toBe(true);
    });
    
    it('should resolve nested dependencies', async () => {
      class NestedComponent {}
      
      registry.register('NestedComponent', NestedComponent, {
        dependencies: ['DependentComponent']
      });
      
      const resolved = await registry.resolveDependencies('NestedComponent');
      
      expect(resolved.resolved).toBe(true);
      expect(resolved.dependencies).toContain('DependentComponent');
    });
  });

  describe('Registry Management', () => {
    class TestComponent1 {}
    class TestComponent2 {}
    
    beforeEach(() => {
      registry.register('TestComponent1', TestComponent1);
      registry.register('TestComponent2', TestComponent2);
    });
    
    it('should list all registered components', () => {
      const components = registry.list().map(mod => mod.name);

      expect(components).toContain('TestComponent1');
      expect(components).toContain('TestComponent2');
      expect(components.length).toBe(2);
    });

    it('should unregister components', () => {
      const result = registry.unregister('TestComponent1');

      expect(result).toBe(true);
      expect(registry.list().map(mod => mod.name)).not.toContain('TestComponent1');
      expect(registry.get('TestComponent1')).toBeNull();
    });
    
    it('should handle unregistering non-existent components', () => {
      const result = registry.unregister('NonExistentComponent');
      
      expect(result).toBe(false);
    });
    
    it('should clear all components', () => {
      registry.clear();
      
      expect(Array.from(registry.list())).toEqual([]);
    });
    
    it('should check if component exists', () => {
      expect(registry.has('TestComponent1')).toBe(true);
      expect(registry.has('NonExistentComponent')).toBe(false);
    });
  });

  describe('Module Validation', () => {
    class ValidComponent {}
    
    it('should validate registered modules', () => {
      registry.register('ValidComponent', ValidComponent, {
        type: 'component',
        dependencies: []
      });
      
      const validation = registry.validate();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
    
    it('should detect validation errors', () => {
      registry.register('ValidComponent', ValidComponent, {
        dependencies: ['NonExistentDependency']
      });
      
      const validation = registry.validate();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
    
    it('should validate specific component', () => {
      registry.register('ValidComponent', ValidComponent);
      
      const validation = registry.validateModule('ValidComponent');
      
      expect(validation.valid).toBe(true);
    });
    
    it('should handle validation of non-existent component', () => {
      const validation = registry.validateModule('NonExistentComponent');
      
      expect(validation).toBeNull();
    });
  });

  describe('Event System', () => {
    let eventCallback;
    
    beforeEach(() => {
      eventCallback = vi.fn();
    });
    
    it('should support event listeners', () => {
      registry.on('moduleRegistered', eventCallback);
      registry.register('TestComponent', class {});
      
      expect(eventCallback).toHaveBeenCalled();
    });
    
    it('should support event emission', () => {
      registry.on('testEvent', eventCallback);
      registry.emit('testEvent', { data: 'test' });
      
      expect(eventCallback).toHaveBeenCalledWith({ data: 'test' });
    });
    
    it('should support removing event listeners', () => {
      registry.on('testEvent', eventCallback);
      registry.off('testEvent', eventCallback);
      registry.emit('testEvent', { data: 'test' });
      
      expect(eventCallback).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle registration errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Try to register with invalid parameters
      const result = registry.register('', null);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    it('should handle dependency resolution errors', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create component with circular dependency
      registry.register('Component1', class {}, { dependencies: ['Component2'] });
      registry.register('Component2', class {}, { dependencies: ['Component1'] });
      
      const resolved = await registry.resolveDependencies('Component1');
      
      expect(resolved.resolved).toBe(false);
      expect(resolved.circularDependency).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Debug Mode', () => {
    let debugRegistry;
    let consoleSpy;
    
    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      debugRegistry = new ModuleRegistry({ debugMode: true });
    });
    
    afterEach(() => {
      consoleSpy.mockRestore();
    });
    
    it('should log debug information when enabled', () => {
      debugRegistry.register('TestComponent', class {});
      
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    it('should not log debug information when disabled', () => {
      registry.register('TestComponent', class {});
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Performance Limits', () => {
    it('should respect module count limits', () => {
      const limitedRegistry = new ModuleRegistry({ maxModules: 2 });
      
      expect(limitedRegistry.register('Component1', class {})).toBe(true);
      expect(limitedRegistry.register('Component2', class {})).toBe(true);
      expect(limitedRegistry.register('Component3', class {})).toBe(false);
    });
    
    it('should have default unlimited modules', () => {
      // Register many components to test default behavior
      for (let i = 0; i < 100; i++) {
        const result = registry.register(`Component${i}`, class {});
        expect(result).toBe(true);
      }
      
      expect(registry.list().length).toBe(100);
    });
  });

  describe('Integration with Global Registry', () => {
    it('should work without global window object', () => {
      delete global.window;
      
      const nodeRegistry = new ModuleRegistry();
      const result = nodeRegistry.register('TestComponent', class {});
      
      expect(result).toBe(true);
    });
    
    it('should integrate with global window registry', () => {
      global.window = {
        LearnimalsModuleRegistry: registry
      };
      
      // Registry should be accessible globally
      expect(global.window.LearnimalsModuleRegistry).toBe(registry);
    });
  });
});