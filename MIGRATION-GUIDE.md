# Component Migration Guide

This guide demonstrates how to migrate components from the original BaseComponent to BaseComponentV2 for enhanced modularity and plug-and-play architecture.

## Overview

The migration to BaseComponentV2 provides:
- **Centralized theme management** via ThemeService
- **Automatic CSS injection** for co-located stylesheets
- **Component manifest system** for explicit dependency declaration
- **Enhanced lifecycle methods** for better control
- **Unified import/export patterns** for consistency

## Migration Steps

### 1. Update Import Pattern

**Before (BaseComponent):**
```javascript
// Problematic global dependency pattern
const BaseComponent = (function() {
  if (typeof window !== 'undefined' && window.BaseComponent) {
    return window.BaseComponent;
  }
  throw new Error('BaseComponent is not available...');
})();
```

**After (BaseComponentV2):**
```javascript
// Clean ES module import
import BaseComponent from '../BaseComponentV2.js';
```

### 2. Add Component Metadata

Add static properties to your component class:

```javascript
class MyComponent extends BaseComponent {
  // Component metadata
  static version = '2.0.0';
  static description = 'Brief component description';
  static dependencies = []; // Array of required component names
  static css = ['my-component.css']; // Co-located CSS files
  static themes = ['default', 'alt']; // Supported theme variants
}
```

### 3. Update Constructor

**Before:**
```javascript
constructor(options) {
  super({
    title: options.title || '',
    // ... other options
    ...options,
  });
}
```

**After:**
```javascript
constructor(options = {}) {
  // Merge component-specific defaults
  const componentOptions = {
    title: options.title || '',
    // ... other options with better defaults
    ...options,
  };

  super(componentOptions);
}
```

### 4. Add Lifecycle Hooks

Take advantage of enhanced lifecycle methods:

```javascript
/**
 * Called after component initialization
 */
onInitialized() {
  console.debug(`${this.constructor.name} initialized`);
}

/**
 * Called when theme changes
 */
onThemeChange() {
  super.onThemeChange(); // Apply base theme changes
  
  // Component-specific theme updates
  const currentTheme = this.getCurrentTheme();
  // Update theme-dependent content
}
```

### 5. Use Theme Service Integration

**Before:**
```javascript
// Manual theme detection (duplicated across components)
const isDark = document.documentElement.classList.contains('theme-mode-dark');
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--text-primary');
```

**After:**
```javascript
// Centralized theme service
const isDark = this.isDarkMode();
const colors = this.getSemanticColors();
const primaryColor = this.getThemeColors('--text-primary', '#333');
```

### 6. Update Event Handling

Enhanced event handling with better error handling:

```javascript
attachEventListeners() {
  if (!this.element) return;

  // Use the improved event system
  this.addEventListener('click', this.handleClick, '.my-selector');
  this.addEventListener('mouseenter', this.handleHover);
}

handleClick(event) {
  // Emit custom events for external handling
  this.emit('mycomponent:click', {
    timestamp: Date.now(),
    data: this.getComponentData(),
  });
}
```

### 7. Create Component Manifest

Create a `component.json` file alongside your component:

```json
{
  "name": "MyComponent",
  "version": "2.0.0",
  "description": "Component description",
  "dependencies": [],
  "css": ["my-component.css"],
  "themes": ["default", "alt"],
  "api": {
    "constructor": {
      "description": "Create a new component",
      "parameters": {
        "title": {
          "type": "string",
          "required": false,
          "description": "Component title"
        }
      }
    }
  }
}
```

### 8. Co-locate CSS

Move component styles from the global CSS file to a component-specific file:

**Before:** Styles in `src/styles/components/components.css`

**After:** Create `src/components/ui/my-component.css`:

```css
/* Component-specific styles using semantic theme variables */
.my-component {
  background-color: var(--bg-card, #ffffff);
  color: var(--text-primary, #333333);
  border: 1px solid var(--border-color, #e1e5e9);
}

/* Theme variants */
.my-component--alt {
  background-color: var(--bg-card-alt, #f8f9fa);
}

/* Dark theme support */
.theme-dark .my-component {
  background-color: var(--bg-card-dark, #2d3748);
  color: var(--text-primary-dark, #f7fafc);
}
```

### 9. Update Export Pattern

Use consistent ES module exports:

```javascript
// Export ES module
export default MyComponent;

// Also make available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.MyComponentV2 = MyComponent;
}
```

## Complete Migration Example

See `CardV2.js` for a complete migration example that demonstrates:
- ✅ ES module imports
- ✅ Component metadata
- ✅ Enhanced lifecycle methods
- ✅ Theme service integration
- ✅ Co-located CSS
- ✅ Component manifest
- ✅ Improved event handling
- ✅ Accessibility features

## Benefits After Migration

### Developer Experience
- **Cleaner imports**: No more global dependency checks
- **Explicit dependencies**: Clear component relationships
- **Better debugging**: Enhanced logging and error handling
- **Type awareness**: Better IDE support with JSDoc

### Performance
- **Automatic CSS injection**: Only load styles when components are used
- **Theme caching**: Faster theme color lookups
- **Dependency management**: Efficient component loading

### Maintainability
- **Co-located styles**: Styles stay with components
- **Version management**: Track component versions
- **API documentation**: Self-documenting component APIs
- **Theme consistency**: Centralized theme management

### Accessibility
- **Better focus management**: Enhanced keyboard navigation
- **Screen reader support**: Improved semantic HTML
- **Theme support**: Better dark mode and high contrast support

## Migration Checklist

For each component migration:

- [ ] Update import to use ES modules
- [ ] Add static component metadata
- [ ] Update constructor with better defaults
- [ ] Add lifecycle hooks (onInitialized, onThemeChange)
- [ ] Replace manual theme detection with ThemeService
- [ ] Improve event handling and emit custom events
- [ ] Create component.json manifest
- [ ] Move CSS to co-located file with semantic variables
- [ ] Update export pattern for consistency
- [ ] Test theme switching and accessibility
- [ ] Update documentation and examples

## Backward Compatibility

The migration maintains backward compatibility by:
- Keeping global window exports for existing code
- Maintaining the same public API surface
- Supporting both old and new import patterns during transition
- Preserving existing CSS class names and structure

## Next Steps

After migrating components:
1. **Update references** in existing code to use new imports
2. **Test thoroughly** with all theme variants
3. **Update documentation** and examples
4. **Consider removing** old component versions after verification
5. **Monitor performance** and user experience impacts