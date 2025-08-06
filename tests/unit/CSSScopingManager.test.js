/**
 * CSSScopingManager Tests
 * Comprehensive test suite for CSS scoping functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CSSScopingManager from '../../src/utils/CSSScopingManager.js';

describe('CSSScopingManager', () => {
  let scopingManager;
  let mockPerformance;

  beforeEach(() => {
    // Mock performance API
    mockPerformance = {
      now: vi.fn(() => 1000)
    };
    global.performance = mockPerformance;

    scopingManager = new CSSScopingManager({
      enableDebugMode: true,
      performanceTracking: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const manager = new CSSScopingManager();
      expect(manager.options.defaultStrategy).toBe('class');
      expect(manager.options.enableDebugMode).toBe(false);
      expect(manager.options.scopingPrefix).toBe('component');
    });

    it('should initialize with custom options', () => {
      const options = {
        defaultStrategy: 'attribute',
        enableDebugMode: true,
        scopingPrefix: 'custom'
      };
      const manager = new CSSScopingManager(options);
      expect(manager.options.defaultStrategy).toBe('attribute');
      expect(manager.options.enableDebugMode).toBe(true);
      expect(manager.options.scopingPrefix).toBe('custom');
    });

    it('should initialize scoping strategies', () => {
      expect(scopingManager.strategies.has('class')).toBe(true);
      expect(scopingManager.strategies.has('attribute')).toBe(true);
      expect(scopingManager.strategies.has('css-modules')).toBe(true);
    });
  });

  describe('Class-based Scoping', () => {
    it('should apply class scoping to simple CSS', () => {
      const css = '.button { color: blue; } .icon { size: 16px; }';
      const result = scopingManager.applyScopingStrategy(css, 'Card', { strategy: 'class' });

      expect(result.scoped).toBe(true);
      expect(result.strategy).toBe('class');
      expect(result.componentClass).toBe('component-card');
      expect(result.css).toContain('.component-card .button');
      expect(result.css).toContain('.component-card .icon');
    });

    it('should skip global selectors in class scoping', () => {
      const css = ':root { --color: blue; } html { margin: 0; } .local { color: red; }';
      const result = scopingManager.applyScopingStrategy(css, 'Card', { strategy: 'class' });

      expect(result.css).toContain(':root { --color: blue; }');
      expect(result.css).toContain('html { margin: 0; }');
      expect(result.css).toContain('.component-card .local');
    });

    it('should generate proper component class names', () => {
      expect(scopingManager.generateComponentClass('Card')).toBe('component-card');
      expect(scopingManager.generateComponentClass('CustomButton')).toBe('component-custom-button');
      expect(scopingManager.generateComponentClass('XMLParser')).toBe('component-x-m-l-parser');
    });

    it('should handle custom class prefix', () => {
      const result = scopingManager.applyScopingStrategy(
        '.button { color: blue; }',
        'Card',
        { strategy: 'class', classPrefix: 'my-prefix' }
      );

      expect(result.css).toContain('my-prefix-card .button');
    });
  });

  describe('Attribute-based Scoping', () => {
    it('should apply attribute scoping to CSS', () => {
      const css = '.button { color: blue; } .icon { size: 16px; }';
      const result = scopingManager.applyScopingStrategy(css, 'Card', { strategy: 'attribute' });

      expect(result.scoped).toBe(true);
      expect(result.strategy).toBe('attribute');
      expect(result.attributeName).toBe('data-component');
      expect(result.attributeValue).toBe('card');
      expect(result.css).toContain('[data-component="card"] .button');
      expect(result.css).toContain('[data-component="card"] .icon');
    });

    it('should use custom attribute name and value', () => {
      const result = scopingManager.applyScopingStrategy(
        '.button { color: blue; }',
        'Card',
        {
          strategy: 'attribute',
          attributeName: 'data-scope',
          attributeValue: 'custom-card'
        }
      );

      expect(result.attributeName).toBe('data-scope');
      expect(result.attributeValue).toBe('custom-card');
      expect(result.css).toContain('[data-scope="custom-card"] .button');
    });

    it('should skip global selectors in attribute scoping', () => {
      const css = ':root { --color: blue; } body { margin: 0; } .local { color: red; }';
      const result = scopingManager.applyScopingStrategy(css, 'Card', { strategy: 'attribute' });

      expect(result.css).toContain(':root { --color: blue; }');
      expect(result.css).toContain('body { margin: 0; }');
      expect(result.css).toContain('[data-component="card"] .local');
    });
  });

  describe('CSS Modules Scoping', () => {
    beforeEach(() => {
      scopingManager = new CSSScopingManager({
        cssModulesEnabled: true,
        enableDebugMode: true
      });
    });

    it('should apply CSS modules scoping', () => {
      const css = '.button { color: blue; } .icon { size: 16px; }';
      const result = scopingManager.applyScopingStrategy(css, 'Card', { strategy: 'css-modules' });

      expect(result.scoped).toBe(true);
      expect(result.strategy).toBe('css-modules');
      expect(result.classMap).toBeDefined();
      expect(result.classMap.button).toMatch(/button_Card_[a-z0-9]+/);
      expect(result.classMap.icon).toMatch(/icon_Card_[a-z0-9]+/);
    });

    it('should return error when CSS modules not enabled', () => {
      const manager = new CSSScopingManager({ cssModulesEnabled: false });
      
      const result = manager.applyScopingStrategy('.button { color: blue; }', 'Card', { strategy: 'css-modules' });
      
      expect(result.scoped).toBe(false);
      expect(result.strategy).toBe('none');
      expect(result.error).toContain('CSS Modules scoping is not enabled');
    });

    it('should generate consistent hashes for same input', () => {
      const css = '.button { color: blue; }';
      const result1 = scopingManager.applyScopingStrategy(css, 'Card', { strategy: 'css-modules' });
      const result2 = scopingManager.applyScopingStrategy(css, 'Card', { strategy: 'css-modules' });

      expect(result1.classMap.button).toBe(result2.classMap.button);
    });
  });

  describe('Caching System', () => {
    it('should cache processed CSS results', () => {
      const css = '.button { color: blue; }';
      
      // First call should miss cache
      const result1 = scopingManager.applyScopingStrategy(css, 'Card');
      expect(scopingManager.performanceMetrics.cacheMisses).toBe(1);
      expect(scopingManager.performanceMetrics.cacheHits).toBe(0);

      // Second call should hit cache
      const result2 = scopingManager.applyScopingStrategy(css, 'Card');
      expect(scopingManager.performanceMetrics.cacheHits).toBe(1);
      expect(result1.css).toBe(result2.css);
    });

    it('should generate different cache keys for different inputs', () => {
      const key1 = scopingManager.generateCacheKey('.button { color: blue; }', 'Card', 'class', {});
      const key2 = scopingManager.generateCacheKey('.button { color: red; }', 'Card', 'class', {});
      const key3 = scopingManager.generateCacheKey('.button { color: blue; }', 'Modal', 'class', {});

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });

    it('should clear cache when requested', () => {
      scopingManager.applyScopingStrategy('.button { color: blue; }', 'Card');
      expect(scopingManager.getCacheStats().processedCacheSize).toBe(1);

      scopingManager.clearCache();
      expect(scopingManager.getCacheStats().processedCacheSize).toBe(0);
    });
  });

  describe('CSS Parsing and Reconstruction', () => {
    it('should parse CSS rules correctly', () => {
      const css = '.button { color: blue; margin: 10px; } .icon { width: 16px; }';
      const rules = scopingManager.parseCSSRules(css);

      expect(rules).toHaveLength(2);
      expect(rules[0].selectors).toEqual(['.button']);
      expect(rules[0].declarations).toContain('color: blue');
      expect(rules[1].selectors).toEqual(['.icon']);
    });

    it('should handle multiple selectors in one rule', () => {
      const css = '.button, .btn, .action { color: blue; }';
      const rules = scopingManager.parseCSSRules(css);

      expect(rules).toHaveLength(1);
      expect(rules[0].selectors).toEqual(['.button', '.btn', '.action']);
    });

    it('should reconstruct CSS from parsed rules', () => {
      const rules = [
        {
          type: 'rule',
          selectors: ['.button'],
          declarations: 'color: blue; margin: 10px;'
        }
      ];

      const css = scopingManager.reconstructCSS(rules);
      expect(css).toContain('.button { color: blue; margin: 10px; }');
    });

    it('should extract selectors from CSS', () => {
      const css = '.button { color: blue; } .icon, .image { width: 16px; }';
      const selectors = scopingManager.extractSelectors(css);

      expect(selectors).toEqual(['.button', '.icon', '.image']);
    });
  });

  describe('Validation', () => {
    it('should validate inputs correctly', () => {
      const validResult = scopingManager.validateInputs('.button { color: blue; }', 'Card', 'class');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = scopingManager.validateInputs('', '', 'invalid');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('should validate scoped CSS output', () => {
      const scopedCSS = '.component-card .button { color: blue; }';
      const result = scopingManager.validateScopedCSS(scopedCSS, 'Card', 'class');

      expect(result.isValid).toBe(true);
    });

    it('should detect improperly scoped selectors', () => {
      const componentClass = scopingManager.generateComponentClass('Card');
      
      expect(scopingManager.isSelectorProperlyScoped(`.${componentClass} .button`, 'Card', 'class')).toBe(true);
      expect(scopingManager.isSelectorProperlyScoped('.button', 'Card', 'class')).toBe(false);
      expect(scopingManager.isSelectorProperlyScoped(':root', 'Card', 'class')).toBe(true); // Global selector
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid strategy gracefully', () => {
      const result = scopingManager.applyScopingStrategy(
        '.button { color: blue; }',
        'Card',
        { strategy: 'invalid' }
      );

      expect(result.scoped).toBe(false);
      expect(result.strategy).toBe('none');
      expect(result.error).toBeDefined();
      expect(result.css).toBe('.button { color: blue; }'); // Fallback to original
    });

    it('should handle malformed CSS gracefully', () => {
      const result = scopingManager.applyScopingStrategy(
        '.button { color: blue',  // Missing closing brace
        'Card'
      );

      // Should still process what it can
      expect(result.css).toBeDefined();
    });

    it('should emit error events when enabled', () => {
      const mockDispatchEvent = vi.fn();
      global.window = { dispatchEvent: mockDispatchEvent };

      scopingManager.applyScopingStrategy('', 'Card', { strategy: 'invalid' });
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cssScopingError'
        })
      );
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics when enabled', () => {
      scopingManager.applyScopingStrategy('.button { color: blue; }', 'Card');

      const metrics = scopingManager.getPerformanceMetrics();
      expect(metrics.totalScopedComponents).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.processingHistory).toHaveLength(1);
    });

    it('should not track performance when disabled', () => {
      const manager = new CSSScopingManager({ performanceTracking: false });
      manager.applyScopingStrategy('.button { color: blue; }', 'Card');

      const metrics = manager.getPerformanceMetrics();
      expect(metrics.totalScopedComponents).toBe(0);
    });

    it('should calculate average processing time', () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1050);
      scopingManager.applyScopingStrategy('.button { color: blue; }', 'Card');

      mockPerformance.now.mockReturnValueOnce(2000).mockReturnValueOnce(2100);
      scopingManager.applyScopingStrategy('.icon { size: 16px; }', 'Modal');

      const metrics = scopingManager.getPerformanceMetrics();
      expect(metrics.averageProcessingTime).toBe(75); // (50 + 100) / 2
    });
  });

  describe('Pre and Post Processing', () => {
    it('should preprocess CSS content', () => {
      const css = '/* Comment */ .button   {   color:   blue;   }   ';
      const processed = scopingManager.preprocessCSS(css, 'Card');

      expect(processed).not.toContain('/* Comment */');
      expect(processed).toBe('.button { color: blue; }');
    });

    it('should preserve comments when requested', () => {
      const css = '/* Important comment */ .button { color: blue; }';
      const processed = scopingManager.preprocessCSS(css, 'Card', { removeComments: false });

      expect(processed).toContain('/* Important comment */');
    });

    it('should add metadata to post-processed results', () => {
      const result = scopingManager.applyScopingStrategy('.button { color: blue; }', 'Card');

      expect(result.metadata).toBeDefined();
      expect(result.metadata.componentName).toBe('Card');
      expect(result.metadata.strategy).toBe('class');
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should format CSS when requested', () => {
      const result = scopingManager.applyScopingStrategy(
        '.button{color:blue;margin:10px}',
        'Card',
        { formatOutput: true }
      );

      expect(result.css).toContain('{\n');
      expect(result.css).toContain(';\n');
    });
  });

  describe('Integration with Theme System', () => {
    it('should process theme tokens when available', () => {
      // Mock CSS processor
      const mockProcessor = {
        processThemeTokens: vi.fn((css) => css.replace('var(--primary)', 'blue'))
      };
      scopingManager.cssProcessor = mockProcessor;

      const css = '.button { color: var(--primary); }';
      const result = scopingManager.applyScopingStrategy(css, 'Card');

      expect(mockProcessor.processThemeTokens).toHaveBeenCalledWith(css, 'Card');
    });
  });

  describe('Hash Generation', () => {
    it('should generate consistent hashes', () => {
      const content = '.button { color: blue; }';
      const hash1 = scopingManager.generateHash(content);
      const hash2 = scopingManager.generateHash(content);

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = scopingManager.generateHash('.button { color: blue; }');
      const hash2 = scopingManager.generateHash('.button { color: red; }');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Skip Patterns', () => {
    it('should identify selectors to skip', () => {
      expect(scopingManager.shouldSkipScoping(':root')).toBe(true);
      expect(scopingManager.shouldSkipScoping('html')).toBe(true);
      expect(scopingManager.shouldSkipScoping('body')).toBe(true);
      expect(scopingManager.shouldSkipScoping('@media')).toBe(true);
      expect(scopingManager.shouldSkipScoping('*')).toBe(true);
      expect(scopingManager.shouldSkipScoping('.button')).toBe(false);
    });

    it('should respect custom skip patterns', () => {
      const customPatterns = [/\.global-/];
      expect(scopingManager.shouldSkipScoping('.global-header', { skipPatterns: customPatterns })).toBe(true);
      expect(scopingManager.shouldSkipScoping('.local-button', { skipPatterns: customPatterns })).toBe(false);
    });
  });
});