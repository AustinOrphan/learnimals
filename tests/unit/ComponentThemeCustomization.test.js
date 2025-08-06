/**
 * @fileoverview Tests for component-specific theme customization (Task 7.5)
 * Validates that components can define their own theme tokens with proper inheritance
 * 
 * Requirements tested:
 * - FR-2.2: Component-specific theme customization support
 * - Component token registration with proper prefixes
 * - Variant-specific customization (ocean, forest themes)
 * - Instance-level overrides for individual components
 * - Inheritance chain resolution
 * - ComponentManifest integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentThemeCustomizer } from '../../src/utils/ComponentThemeCustomizer.js';

describe('Component-Specific Theme Customization', () => {
  let customizer;

  beforeEach(() => {
    customizer = new ComponentThemeCustomizer();
    customizer.clear(); // Reset all registries and caches
  });

  describe('Component Token Registration', () => {
    it('should register component-specific tokens with proper prefixes', () => {
      const cardTokens = {
        'background-color': '#ffffff',
        'border-radius': '8px',
        'padding': '16px',
        'shadow': '0 2px 4px rgba(0,0,0,0.1)'
      };

      const result = customizer.registerComponentTokens('Card', cardTokens);

      expect(result.componentName).toBe('Card');
      expect(result.tokensRegistered).toBe(4);
      expect(result.errors).toHaveLength(0);
      
      // Check that tokens are properly prefixed and registered
      const allTokens = customizer.getAllTokens();
      expect(allTokens.component['--component-card-background-color']).toBe('#ffffff');
      expect(allTokens.component['--component-card-border-radius']).toBe('8px');
      expect(allTokens.component['--component-card-padding']).toBe('16px');
      expect(allTokens.component['--component-card-shadow']).toBe('0 2px 4px rgba(0,0,0,0.1)');
    });

    it('should handle pre-prefixed tokens correctly', () => {
      const tokens = {
        '--card-background': '#f8f9fa',
        'border-color': '#dee2e6'
      };

      const result = customizer.registerComponentTokens('Card', tokens);

      expect(result.tokensRegistered).toBe(2);
      expect(result.errors).toHaveLength(0);
      
      const allTokens = customizer.getAllTokens();
      expect(allTokens.component['--card-background']).toBe('#f8f9fa'); // Pre-prefixed tokens kept as-is
      expect(allTokens.component['--component-card-border-color']).toBe('#dee2e6');
    });

    it('should register tokens without validation', () => {
      const tokens = {
        'background-color': 'any-value',
        'padding': 'any-spacing-value'
      };

      const result = customizer.registerComponentTokens('Card', tokens);

      expect(result.tokensRegistered).toBe(2);
      expect(result.errors).toHaveLength(0);
      
      const allTokens = customizer.getAllTokens();
      expect(allTokens.component['--component-card-background-color']).toBe('any-value');
      expect(allTokens.component['--component-card-padding']).toBe('any-spacing-value');
    });
  });

  describe('Variant-Specific Customization', () => {
    beforeEach(() => {
      // Register base component tokens
      customizer.registerComponentTokens('Card', {
        'background': '#ffffff',
        'text-color': '#333333'
      });
    });

    it('should register variant-specific tokens', () => {
      const oceanVariant = {
        'background': '#e6f3ff',
        'text-color': '#0066cc',
        'accent': '#007bff'
      };

      const result = customizer.registerComponentTokens('Card', oceanVariant, {
        variant: 'ocean'
      });

      expect(result.tokensRegistered).toBe(3);
      
      const allTokens = customizer.getAllTokens();
      expect(allTokens.variant['--variant-ocean-card-background']).toBe('#e6f3ff');
      expect(allTokens.variant['--variant-ocean-card-text-color']).toBe('#0066cc');
      expect(allTokens.variant['--variant-ocean-card-accent']).toBe('#007bff');
    });

    it('should register multiple theme variants', () => {
      const oceanVariant = { 'background': '#e6f3ff' };
      const forestVariant = { 'background': '#e6ffe6' };

      customizer.registerComponentTokens('Card', oceanVariant, { variant: 'ocean' });
      customizer.registerComponentTokens('Card', forestVariant, { variant: 'forest' });

      const allTokens = customizer.getAllTokens();
      expect(allTokens.variant['--variant-ocean-card-background']).toBe('#e6f3ff');
      expect(allTokens.variant['--variant-forest-card-background']).toBe('#e6ffe6');
    });
  });

  describe('Instance-Level Overrides', () => {
    beforeEach(() => {
      customizer.registerComponentTokens('Card', {
        'background': '#ffffff'
      });
      
      customizer.registerComponentTokens('Card', {
        'background': '#e6f3ff'
      }, { variant: 'ocean' });
    });

    it('should register instance-specific tokens', () => {
      const instanceTokens = {
        'background': '#ffeeee',
        'special-border': '2px solid red'
      };

      const result = customizer.registerComponentTokens('Card', instanceTokens, {
        variant: 'ocean',
        instance: 'hero-card'
      });

      expect(result.tokensRegistered).toBe(2);
      
      const allTokens = customizer.getAllTokens();
      expect(allTokens.instance['--instance-card-hero-card-background']).toBe('#ffeeee');
      expect(allTokens.instance['--instance-card-hero-card-special-border']).toBe('2px solid red');
    });
  });

  describe('Inheritance Chain Resolution', () => {
    beforeEach(() => {
      // Set up complete inheritance chain
      customizer.registerComponentTokens('Card', {
        'background': '#ffffff',
        'text-color': '#333333'
      });
      
      customizer.registerComponentTokens('Card', {
        'background': '#e6f3ff'
      }, { variant: 'ocean' });
      
      customizer.registerComponentTokens('Card', {
        'background': '#ffeeee'
      }, { variant: 'ocean', instance: 'special' });
    });

    it('should build correct inheritance chain', () => {
      const chain = customizer.buildInheritanceChain('Card', {
        variant: 'ocean',
        instance: 'special'
      });

      expect(chain).toHaveLength(3); // component, variant, instance
      expect(chain.map(c => c.level)).toEqual(['component', 'variant', 'instance']);
    });

    it('should resolve tokens with proper priority', () => {
      const chain = customizer.buildInheritanceChain('Card', {
        variant: 'ocean',
        instance: 'special'
      });

      // Instance level should have highest priority
      const resolved = customizer.resolveToken('--instance-card-special-background', chain);
      expect(resolved).toBe('#ffeeee'); // Instance value should win

      // Fallback to variant level
      const variantChain = customizer.buildInheritanceChain('Card', {
        variant: 'ocean'
      });
      const variantResolved = customizer.resolveToken('--variant-ocean-card-background', variantChain);
      expect(variantResolved).toBe('#e6f3ff'); // Variant value should be used
    });
  });

  describe('CSS Processing with Component Customization', () => {
    beforeEach(() => {
      customizer.registerComponentTokens('Button', {
        'background': '#007bff',
        'text-color': '#ffffff',
        'border-radius': '4px'
      });
      
      customizer.registerComponentTokens('Button', {
        'background': '#28a745'
      }, { variant: 'success' });
    });

    it('should apply component theme customization to CSS', () => {
      const css = `
        .button {
          background: var(--component-button-background);
          color: var(--component-button-text-color);
          border-radius: var(--component-button-border-radius);
        }
      `;

      const result = customizer.applyComponentThemeCustomization(css, 'Button');

      expect(result.tokensProcessed).toBe(3);
      expect(result.tokensResolved).toBe(3);
      expect(result.processedCss).toContain('background: #007bff');
      expect(result.processedCss).toContain('color: #ffffff');
      expect(result.processedCss).toContain('border-radius: 4px');
    });

    it('should apply variant-specific customization', () => {
      const css = `
        .button {
          background: var(--component-button-background);
        }
      `;

      const result = customizer.applyComponentThemeCustomization(css, 'Button', {
        variant: 'success'
      });

      expect(result.processedCss).toContain('background: #28a745'); // Success variant
      expect(result.customizations).toHaveLength(1);
      expect(result.customizations[0].source.level).toBe('variant');
    });
  });

  describe('ComponentManifest Integration', () => {
    it('should integrate theme definitions from component manifest', () => {
      const manifest = {
        name: 'Card',
        version: '1.0.0',
        css: {
          variants: {
            themes: {
              ocean: {
                tokens: {
                  'background': '#e6f3ff',
                  'border-color': '#0066cc'
                },
                documentation: {
                  'background': { description: 'Ocean theme background color' }
                }
              },
              forest: {
                tokens: {
                  'background': '#e6ffe6',
                  'border-color': '#228b22'
                },
                instances: {
                  'hero': {
                    tokens: {
                      'background': '#ccffcc',
                      'special-effect': 'glow'
                    }
                  }
                }
              }
            }
          }
        }
      };

      const result = customizer.integrateComponentManifest(manifest);

      expect(result.componentName).toBe('Card');
      expect(result.themesProcessed).toBe(2);
      expect(result.tokensRegistered).toBe(6); // 2 ocean + 2 forest + 2 forest hero instance
      expect(result.errors).toHaveLength(0);
      
      // Check variant tokens are registered
      const allTokens = customizer.getAllTokens();
      expect(allTokens.variant['--variant-ocean-card-background']).toBe('#e6f3ff');
      expect(allTokens.variant['--variant-forest-card-background']).toBe('#e6ffe6');
      
      // Check instance tokens are registered
      expect(allTokens.instance['--instance-card-hero-background']).toBe('#ccffcc');
      expect(allTokens.instance['--instance-card-hero-special-effect']).toBe('glow');
    });

    it('should validate manifest structure', () => {
      const invalidManifest = {
        // Missing required fields
        css: {
          variants: {
            themes: 'invalid-structure' // Should be object
          }
        }
      };

      const result = customizer.integrateComponentManifest(invalidManifest);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === 'invalid_manifest')).toBe(true);
    });
  });

  describe('Token Source Information', () => {
    it('should provide token source information', () => {
      customizer.registerComponentTokens('Card', { 'background': '#ffffff' });
      customizer.registerComponentTokens('Card', { 'background': '#e6f3ff' }, { variant: 'ocean' });
      
      const chain = customizer.buildInheritanceChain('Card', { variant: 'ocean' });
      const source = customizer.getTokenSource('--component-card-background', chain);
      
      expect(source.found).toBe(true);
      expect(source.level).toBe('component');
      
      // Variant-specific token source
      const variantSource = customizer.getTokenSource('--variant-ocean-card-background', chain);
      expect(variantSource.found).toBe(true);
      expect(variantSource.level).toBe('variant');
    });
  });
});