# Component Template Guide

## Enhanced CSS Architecture Templates

This guide explains how to use the enhanced CSS architecture templates for creating new components with modern patterns based on the proven card.css reference implementation.

## Template Files Overview

### Core Templates
- `component-manifest.template.json` - Complete component manifest template with enhanced CSS schema
- `component-css.template.css` - Generic CSS template with comprehensive modern patterns

### Specialized Component Type Templates
- `ui-component.css.template` - For interactive UI components (buttons, cards, modals, badges)
- `layout-component.css.template` - For structural layout components (navigation, sidebars, grids)
- `form-component.css.template` - For form inputs and validation components (inputs, selects, checkboxes)

### Documentation
- `COMPONENT_TEMPLATE_GUIDE.md` - This comprehensive usage guide

## Enhanced CSS Schema Features

### 1. CSS Variants System

The new schema supports multiple types of CSS variants:

#### Theme Variants
```json
"themes": {
  "ocean": {
    "files": ["ComponentName.theme-ocean.css"],
    "description": "Ocean theme with blue tones",
    "condition": "theme === 'ocean'"
  }
}
```

#### Size Variants
```json
"sizes": {
  "small": {
    "files": ["ComponentName.small.css"],
    "description": "Compact layout",
    "tokens": {
      "--component-padding": "var(--space-sm)"
    }
  }
}
```

#### State Variants
```json
"states": {
  "loading": {
    "files": ["ComponentName.loading.css"],
    "description": "Loading state styling"
  }
}
```

#### Responsive Variants
```json
"responsive": {
  "mobile": {
    "files": ["ComponentName.mobile.css"],
    "media": "(max-width: 768px)",
    "description": "Mobile-optimized layout"
  }
}
```

### 2. CSS Dependencies

Define CSS files that must be loaded before your component:

```json
"dependencies": [
  "../../../styles/tokens/global-tokens.css",
  "../../../styles/tokens/semantic-tokens.css",
  "../../../styles/components/base.css"
]
```

### 3. CSS Scoping Options

Choose the appropriate scoping strategy:

- `"component"` - Scoped to component class (recommended)
- `"global"` - Global CSS (legacy compatibility)
- `"scoped"` - CSS Modules-style scoping
- `"css-modules"` - Full CSS Modules support

### 4. Performance Configuration

Control CSS loading behavior:

```json
"critical": true,    // Load immediately for above-the-fold content
"lazy": false,       // Load on-demand when component is used
"preload": true,     // Preload for performance
"media": null        // Media query for conditional loading
```

### 5. Theme Tokens

Define component-specific CSS custom properties:

```json
"tokens": {
  "--component-background": "var(--bg-surface)",
  "--component-border-color": "var(--border-color)",
  "--component-padding": "var(--space-md)"
}
```

## Creating a New Component

### 1. Choose the Right Template

Select the appropriate CSS template based on your component type:

**UI Components** (interactive elements):
- Cards, Buttons, Modals, Badges, Alerts, Tooltips
- Use: `ui-component.css.template`

**Layout Components** (structural elements):
- Navigation, Headers, Sidebars, Footers, Grids, Containers
- Use: `layout-component.css.template`

**Form Components** (input elements):
- Text Inputs, Selects, Checkboxes, Radios, Textareas
- Use: `form-component.css.template`

**Generic Components** (when unsure):
- Use: `component-css.template.css`

### 2. Copy Template Files

```bash
# Example: Creating a Button component (UI type)
cp src/templates/component-manifest.template.json src/components/ui/Button/component.json
cp src/templates/ui-component.css.template src/components/ui/Button/Button.css

# Example: Creating a Navigation component (Layout type)
cp src/templates/component-manifest.template.json src/components/layout/Navigation/component.json
cp src/templates/layout-component.css.template src/components/layout/Navigation/Navigation.css

# Example: Creating an Input component (Form type)
cp src/templates/component-manifest.template.json src/components/forms/Input/component.json
cp src/templates/form-component.css.template src/components/forms/Input/Input.css
```

### 2. Replace Template Placeholders

Replace these placeholders in both files:

- `{{ComponentName}}` → Your component class name (e.g., "Button")
- `{{component-name}}` → CSS class name (e.g., "button")
- `{{ComponentDescription}}` → Brief description
- `{{component-type}}` → Component category (e.g., "input", "display")
- `{{aria-role}}` → ARIA role if applicable

### 3. Customize CSS Variants

Add or remove variants based on your component needs:

- **Theme variants**: Add if component supports multiple themes
- **Size variants**: Add if component has different sizes (small, medium, large)
- **State variants**: Add for loading, error, disabled states
- **Responsive variants**: Add for mobile/tablet/desktop differences

### 4. Configure Performance Settings

Set appropriate performance flags:

- Set `critical: true` for above-the-fold components
- Set `lazy: true` for components used deep in the page
- Set `preload: true` for frequently used components

## ComponentManifest Integration

The enhanced schema integrates seamlessly with the ComponentManifest system:

```javascript
import { ComponentManifest } from './src/utils/ComponentManifest.js';

// Load and validate manifest
const manifest = await ComponentManifest.loadFromPath('./src/components/ui/MyComponent');

// Get CSS files for specific variants
const cssFiles = manifest.getCSSFiles({
  theme: 'ocean',
  size: 'large',
  includeVariants: true
});

// Get variant information
const themeVariants = manifest.getCSSVariants('themes');
const dependencies = manifest.getCSSdependencies();
const scoping = manifest.getCSSScoping();
```

## Template-Specific Features

### UI Component Template Features
- Enhanced interactive states (hover, active, focus)
- Rich theme variants with gradient backgrounds (ocean, forest, space)
- Loading, success, and error state animations
- Touch-optimized interactions for mobile
- Advanced button integration patterns
- Icon and badge support
- Comprehensive size variants (xs, small, large, xl)

### Layout Component Template Features
- Flexible layout systems (flexbox, grid)
- Responsive breakpoint handling
- Position management (fixed, sticky, relative)
- Z-index layering for layout hierarchy
- Container and spacing utilities
- Navigation-specific patterns (sidebar, header, footer)
- State management for collapsible layouts
- Skip links for accessibility

### Form Component Template Features
- Comprehensive form input states (valid, invalid, disabled)
- Custom checkbox and radio styling
- Input group and addon support
- Form validation animations
- Placeholder and help text styling
- File input customization
- WCAG-compliant focus management
- High contrast mode support

## Best Practices by Component Type

### For UI Components
1. **Interactive feedback**: Always provide hover, focus, and active states
2. **Loading states**: Include loading animations for async operations
3. **Theme integration**: Use rich gradient theme variants when appropriate
4. **Touch targets**: Ensure minimum 44px touch targets on mobile
5. **Animation**: Use entrance animations for dynamic content

### For Layout Components
1. **Responsive first**: Design for mobile-first responsive behavior
2. **Z-index management**: Use semantic z-index values for layering
3. **Flexbox/Grid**: Leverage modern layout techniques
4. **Skip navigation**: Include skip links for accessibility
5. **Print considerations**: Hide non-essential layout elements in print

### For Form Components
1. **Validation feedback**: Provide clear visual feedback for form states
2. **Label association**: Ensure labels are properly associated with inputs
3. **Error handling**: Use animations to draw attention to validation errors
4. **Keyboard navigation**: Support full keyboard interaction
5. **Screen readers**: Include appropriate ARIA attributes

### General Best Practices
1. **Use semantic tokens**: Always use CSS custom properties from the token system
2. **Component scoping**: Use `"scoping": "component"` for new components
3. **Performance consideration**: Mark critical components appropriately
4. **Responsive design**: Use responsive variants instead of media queries in base CSS
5. **Theme consistency**: Follow established theme patterns based on card.css
6. **Accessibility**: Include focus, high-contrast, and reduced-motion styles

## Migration from Legacy Schema

If you have an existing component with the old CSS array format:

```json
// Old format
"css": ["component.css"]

// New format
"css": {
  "files": ["component.css"],
  "scoping": "global"  // Maintains backward compatibility
}
```

The ComponentManifest system automatically handles backward compatibility, but updating to the new format provides enhanced features.

## Template Validation

### CSS Template Validation
Each template includes:
- ✅ ComponentName.css naming convention (FR-1.2)
- ✅ BEM methodology for component structure
- ✅ Semantic theme token usage with fallbacks
- ✅ Comprehensive accessibility features
- ✅ Responsive design patterns
- ✅ Performance optimizations
- ✅ Browser compatibility considerations

### Manifest Template Validation
The enhanced manifest template includes:
- ✅ Comprehensive API documentation
- ✅ Event system specification
- ✅ Static method definitions
- ✅ Accessibility compliance information
- ✅ Browser compatibility matrix
- ✅ Performance configuration options

## Template Customization

### Removing Unused Sections
Each template is modular. You can safely remove:
- Theme variants you don't need
- Size variants not applicable to your component
- Animation keyframes for unused states
- Component structure elements (e.g., `__image` for non-visual components)

### Adding Custom Patterns
When extending templates:
1. Follow the established CSS custom property naming: `--{{component-name}}-property`
2. Use semantic token references with fallbacks: `var(--semantic-token, fallback)`
3. Include accessibility considerations for new interactive patterns
4. Add responsive behavior for new layout additions

## Examples by Component Type

### UI Component Example (Button)
```css
/* Specialized for interactive elements */
.button {
  /* Interactive UI patterns from ui-component.css.template */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

### Layout Component Example (Sidebar)
```css
/* Specialized for structural elements */
.sidebar {
  /* Layout patterns from layout-component.css.template */
  position: fixed;
  height: 100vh;
  transform: translateX(var(--sidebar-translate, 0));
}
```

### Form Component Example (Input)
```css
/* Specialized for form elements */
.input {
  /* Form patterns from form-component.css.template */
  border: 1px solid var(--border-color-input);
}

.input:focus {
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
```