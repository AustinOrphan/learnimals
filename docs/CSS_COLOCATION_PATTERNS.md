# CSS Co-location Patterns Guide

This guide documents the CSS co-location patterns for all component types in the Learnimals project, following the modularization requirements FR-1.1 through FR-1.5.

## Overview

CSS co-location is the practice of placing component-specific CSS files in the same directory as their corresponding JavaScript component files. This approach improves maintainability, reduces coupling, and enables better performance optimization through component-specific loading.

## Directory Structure Guidelines

### Standard Co-location Pattern

All components MUST follow this directory structure:

```
src/components/{category}/{ComponentName}/
├── ComponentName.js          # Component implementation
├── ComponentName.css         # Primary component styles (FR-1.2)
├── component.json           # Component manifest (FR-1.3)
├── ComponentName.test.js    # Component tests
└── [variant files...]       # Optional variant CSS files
```

### Component Categories

Components are organized by functional category:

```
src/components/
├── ui/                      # Interactive UI elements
│   ├── Card/
│   ├── Modal/
│   ├── Button/
│   └── Badge/
├── layout/                  # Structural components
│   ├── Navigation/
│   ├── Header/
│   ├── Sidebar/
│   └── Footer/
├── forms/                   # Form-related components
│   ├── Input/
│   ├── Select/
│   ├── Checkbox/
│   └── FormGroup/
└── games/                   # Game-specific components
    ├── GameBoard/
    ├── ScoreDisplay/
    └── GameControls/
```

## Naming Conventions

### CSS File Naming (FR-1.2)

CSS files MUST follow the naming convention `ComponentName.css`, where `ComponentName` matches the JavaScript class name exactly:

```
✅ Good Examples:
Card.js → Card.css
Modal.js → Modal.css
Navigation.js → Navigation.css
GameBoard.js → GameBoard.css

❌ Bad Examples:
Card.js → card.css           # Wrong case
Card.js → Card-styles.css    # Additional suffix
Card.js → card-component.css # Different format
```

### Variant File Naming

For CSS variants, use descriptive suffixes:

```
ComponentName.css                    # Primary styles
ComponentName.theme-{theme}.css     # Theme variants
ComponentName.size-{size}.css       # Size variants
ComponentName.state-{state}.css     # State variants
ComponentName.responsive-{bp}.css   # Responsive breakpoints
```

Examples:
```
Card.css
Card.theme-ocean.css
Card.theme-forest.css
Card.size-small.css
Card.size-large.css
Card.state-loading.css
Card.responsive-mobile.css
```

## Component Manifest Integration (FR-1.3)

Every co-located component MUST include a `component.json` manifest file that references its CSS files:

### Basic CSS Declaration

```json
{
  "name": "ComponentName",
  "version": "1.0.0",
  "description": "Component description",
  "css": {
    "primary": "ComponentName.css",
    "files": ["ComponentName.css"]
  }
}
```

### Advanced CSS Declaration with Variants

```json
{
  "name": "Card",
  "version": "2.0.0",
  "css": {
    "primary": "Card.css",
    "files": ["Card.css"],
    "variants": {
      "themes": {
        "ocean": {
          "files": ["Card.theme-ocean.css"],
          "description": "Ocean theme with blue tones",
          "tokens": {
            "--card-ocean-background": "var(--ocean-primary)",
            "--card-ocean-border": "var(--ocean-border)"
          }
        }
      },
      "sizes": {
        "small": {
          "files": ["Card.size-small.css"],
          "tokens": {
            "--card-padding": "var(--space-sm)"
          }
        }
      }
    },
    "dependencies": ["../shared/base.css"],
    "scoping": "component",
    "critical": true,
    "performance": {
      "lazy": false,
      "preload": true
    }
  }
}
```

## CSS Co-location Patterns by Component Type

### UI Components

**Purpose**: Interactive elements that users directly engage with

**Characteristics**:
- Rich interaction states (hover, focus, active, disabled)
- Theme variant support
- Multiple size options
- Animation and transition effects

**Example Structure**:
```
src/components/ui/Button/
├── Button.js
├── Button.css                 # Base styles with all states
├── Button.theme-ocean.css     # Optional theme variant
├── Button.size-small.css      # Size variant
├── component.json
└── Button.test.js
```

**CSS Pattern Example** (`Button.css`):
```css
/* Button Component Styles */
.button {
  /* Base button styles using semantic tokens */
  background-color: var(--button-background, var(--interactive-primary));
  border: 1px solid var(--button-border, var(--interactive-primary));
  border-radius: var(--button-radius, var(--radius-md));
  color: var(--button-text, var(--text-on-primary));
  cursor: pointer;
  font-size: var(--button-font-size, var(--font-size-base));
  padding: var(--button-padding, var(--space-sm) var(--space-md));
  transition: all 0.2s ease-in-out;
}

/* Interactive states */
.button:hover {
  background-color: var(--button-hover-background, var(--interactive-hover));
  border-color: var(--button-hover-border, var(--interactive-hover));
  transform: translateY(-1px);
}

.button:active {
  background-color: var(--button-active-background, var(--interactive-active));
  transform: translateY(0);
}

.button:focus {
  box-shadow: 0 0 0 3px var(--button-focus-ring, var(--focus-ring-color));
  outline: none;
}

.button:disabled {
  background-color: var(--button-disabled-background, var(--color-gray-300));
  border-color: var(--button-disabled-border, var(--color-gray-300));
  color: var(--button-disabled-text, var(--color-gray-500));
  cursor: not-allowed;
  opacity: 0.6;
}

/* Size variants (can be in separate files) */
.button--small {
  font-size: var(--font-size-sm);
  padding: var(--space-xs) var(--space-sm);
}

.button--large {
  font-size: var(--font-size-lg);
  padding: var(--space-md) var(--space-lg);
}
```

### Layout Components

**Purpose**: Structural elements that organize page content

**Characteristics**:
- Responsive design patterns
- Z-index management
- Flexbox/Grid layouts
- Responsive breakpoints
- Print considerations

**Example Structure**:
```
src/components/layout/Navigation/
├── Navigation.js
├── Navigation.css                    # Base layout styles
├── Navigation.responsive-mobile.css  # Mobile-specific layout
├── component.json
└── Navigation.test.js
```

**CSS Pattern Example** (`Navigation.css`):
```css
/* Navigation Layout Component */
.navigation {
  /* Layout properties using semantic tokens */
  background-color: var(--nav-background, var(--bg-surface));
  border-bottom: 1px solid var(--nav-border, var(--border-color));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--nav-padding, var(--space-md) var(--space-lg));
  position: var(--nav-position, sticky);
  top: 0;
  z-index: var(--nav-z-index, var(--z-navigation));
  
  /* Responsive base behavior */
  min-height: var(--nav-height, 60px);
}

.navigation__brand {
  font-size: var(--nav-brand-size, var(--font-size-lg));
  font-weight: var(--nav-brand-weight, 600);
  color: var(--nav-brand-color, var(--text-primary));
  text-decoration: none;
}

.navigation__menu {
  display: flex;
  align-items: center;
  gap: var(--nav-menu-gap, var(--space-lg));
  list-style: none;
  margin: 0;
  padding: 0;
}

.navigation__item {
  position: relative;
}

.navigation__link {
  color: var(--nav-link-color, var(--text-secondary));
  padding: var(--nav-link-padding, var(--space-sm) var(--space-md));
  text-decoration: none;
  transition: color 0.2s ease-in-out;
}

.navigation__link:hover,
.navigation__link--active {
  color: var(--nav-link-active-color, var(--interactive-primary));
}

/* Skip navigation link for accessibility */
.navigation__skip {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.navigation__skip:focus {
  position: fixed;
  top: var(--space-sm);
  left: var(--space-sm);
  width: auto;
  height: auto;
  background: var(--bg-surface);
  border: 2px solid var(--interactive-primary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  padding: var(--space-sm) var(--space-md);
  text-decoration: none;
  z-index: var(--z-modal);
}

/* Print styles */
@media print {
  .navigation {
    display: none;
  }
}
```

### Form Components

**Purpose**: Input elements and form controls

**Characteristics**:
- Input validation states
- Label associations
- Error messaging
- WCAG compliance
- Keyboard navigation support

**Example Structure**:
```
src/components/forms/Input/
├── Input.js
├── Input.css                # Base input styles with all states
├── Input.state-error.css    # Error state styles (optional)
├── component.json
└── Input.test.js
```

**CSS Pattern Example** (`Input.css`):
```css
/* Input Form Component */
.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--input-group-gap, var(--space-xs));
  margin-bottom: var(--input-group-margin, var(--space-md));
}

.input-label {
  color: var(--input-label-color, var(--text-primary));
  font-size: var(--input-label-size, var(--font-size-sm));
  font-weight: var(--input-label-weight, 500);
  margin-bottom: var(--input-label-margin, var(--space-xs));
}

.input-label--required::after {
  color: var(--color-danger);
  content: " *";
  margin-left: var(--space-xs);
}

.input {
  /* Base input styling */
  background-color: var(--input-background, var(--bg-input));
  border: 1px solid var(--input-border-color, var(--border-color));
  border-radius: var(--input-radius, var(--radius-sm));
  color: var(--input-text-color, var(--text-primary));
  font-size: var(--input-font-size, var(--font-size-base));
  padding: var(--input-padding, var(--space-sm) var(--space-md));
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  width: 100%;
}

.input::placeholder {
  color: var(--input-placeholder-color, var(--text-muted));
  opacity: 1;
}

/* Focus state */
.input:focus {
  border-color: var(--input-focus-border, var(--interactive-primary));
  box-shadow: 0 0 0 3px var(--input-focus-ring, var(--focus-ring-color));
  outline: none;
}

/* Validation states */
.input--valid {
  border-color: var(--input-valid-border, var(--color-success));
}

.input--error {
  border-color: var(--input-error-border, var(--color-danger));
}

.input--error:focus {
  box-shadow: 0 0 0 3px var(--input-error-ring, var(--color-danger-light));
}

/* Disabled state */
.input:disabled {
  background-color: var(--input-disabled-background, var(--bg-disabled));
  border-color: var(--input-disabled-border, var(--border-color-disabled));
  color: var(--input-disabled-text, var(--text-disabled));
  cursor: not-allowed;
  opacity: 0.6;
}

/* Help text and error messages */
.input-help {
  color: var(--input-help-color, var(--text-muted));
  font-size: var(--input-help-size, var(--font-size-sm));
  margin-top: var(--space-xs);
}

.input-error {
  color: var(--input-error-text, var(--color-danger));
  font-size: var(--input-error-size, var(--font-size-sm));
  margin-top: var(--space-xs);
}

.input-error::before {
  content: "⚠ ";
  margin-right: var(--space-xs);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .input {
    border-width: 2px;
  }
  
  .input:focus {
    border-width: 3px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .input {
    transition: none;
  }
}
```

### Game Components

**Purpose**: Interactive game elements and interfaces

**Characteristics**:
- Canvas integration styles
- Performance-optimized animations
- Touch/mouse interaction areas
- Game state visual feedback
- High contrast gaming accessibility

**Example Structure**:
```
src/components/games/GameBoard/
├── GameBoard.js
├── GameBoard.css              # Game-specific styles
├── GameBoard.state-paused.css # Game state styles (optional)
├── component.json
└── GameBoard.test.js
```

**CSS Pattern Example** (`GameBoard.css`):
```css
/* Game Board Component */
.game-board {
  /* Game container styling */
  background-color: var(--game-background, var(--bg-game));
  border: 2px solid var(--game-border, var(--border-color));
  border-radius: var(--game-radius, var(--radius-lg));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  user-select: none; /* Prevent text selection during gameplay */
}

.game-board__header {
  background-color: var(--game-header-background, var(--bg-surface));
  border-bottom: 1px solid var(--game-header-border, var(--border-color));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
}

.game-board__title {
  color: var(--game-title-color, var(--text-primary));
  font-size: var(--game-title-size, var(--font-size-lg));
  font-weight: 600;
  margin: 0;
}

.game-board__canvas {
  /* Canvas container for game rendering */
  background-color: var(--game-canvas-background, transparent);
  display: block;
  height: var(--game-height, 400px);
  width: 100%;
  
  /* Touch optimization */
  touch-action: manipulation;
}

.game-board__controls {
  background-color: var(--game-controls-background, var(--bg-surface));
  border-top: 1px solid var(--game-controls-border, var(--border-color));
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
}

/* Game state indicators */
.game-board--playing {
  border-color: var(--color-primary);
}

.game-board--paused {
  opacity: 0.8;
}

.game-board--paused::after {
  content: "⏸ PAUSED";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--overlay-background);
  color: var(--text-on-overlay);
  font-size: var(--font-size-xl);
  font-weight: 700;
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  z-index: 10;
}

.game-board--finished {
  border-color: var(--color-success);
}

/* Score display */
.game-score {
  background-color: var(--score-background, var(--bg-accent));
  border-radius: var(--score-radius, var(--radius-md));
  color: var(--score-text, var(--text-on-accent));
  font-size: var(--score-size, var(--font-size-lg));
  font-weight: 700;
  padding: var(--space-xs) var(--space-sm);
}

/* Touch target optimization */
.game-button {
  background-color: var(--game-button-background, var(--interactive-primary));
  border: none;
  border-radius: var(--game-button-radius, var(--radius-md));
  color: var(--game-button-text, var(--text-on-primary));
  cursor: pointer;
  font-size: var(--game-button-size, var(--font-size-base));
  min-height: 44px; /* Minimum touch target size */
  min-width: 44px;
  padding: var(--space-sm) var(--space-md);
  transition: transform 0.1s ease-in-out;
}

.game-button:hover {
  transform: scale(1.05);
}

.game-button:active {
  transform: scale(0.95);
}

/* Accessibility for games */
.game-board[aria-label] {
  /* Ensure screen reader support */
  position: relative;
}

/* High contrast gaming */
@media (prefers-contrast: high) {
  .game-board {
    border-width: 3px;
  }
  
  .game-button {
    border: 2px solid var(--text-primary);
  }
}

/* Reduced motion for games */
@media (prefers-reduced-motion: reduce) {
  .game-button {
    transition: none;
  }
  
  .game-button:hover {
    transform: none;
  }
}

/* Focus management for keyboard users */
.game-board:focus-within .game-board__canvas {
  box-shadow: inset 0 0 0 3px var(--focus-ring-color);
}
```

## Component CSS Loading Integration

### BaseComponentV2 Integration (FR-1.4, FR-1.5)

Components automatically load their co-located CSS through BaseComponentV2:

```javascript
class Card extends BaseComponent {
  static css = ['Card.css']; // Declares CSS files for loading
  
  constructor(options = {}) {
    super(options);
    // CSS is automatically loaded through BaseComponentV2.injectCSS()
  }
  
  getComponentPath() {
    // Returns the component directory path for CSS resolution
    return import.meta.url.replace(/\/[^/]+\.js$/, '/');
  }
}
```

### CSS Loading Flow

1. Component instantiation triggers BaseComponentV2 constructor
2. Constructor calls `injectCSS()` method
3. `injectCSS()` discovers CSS files from:
   - `static css` property array
   - `component.json` manifest CSS declarations
4. CSSPathResolver resolves relative paths to component CSS files
5. CSSManager loads and caches CSS with deduplication
6. CSS is injected into document head with proper scoping

## Migration from Global CSS

### Step-by-Step Migration Process

1. **Identify Component Styles**
   ```bash
   # Find styles that belong to a specific component
   grep -n "\.card" src/styles/components/ui.css
   ```

2. **Extract Component CSS**
   ```css
   /* Before: In global CSS file */
   .card { ... }
   .card__header { ... }
   .card__body { ... }
   
   /* After: In src/components/ui/Card/Card.css */
   .card { ... }
   .card__header { ... }
   .card__body { ... }
   ```

3. **Convert to Theme Tokens**
   ```css
   /* Before: Hard-coded values */
   .card {
     background-color: #ffffff;
     border: 1px solid #e0e0e0;
     padding: 16px;
   }
   
   /* After: Theme tokens */
   .card {
     background-color: var(--card-background, var(--bg-card));
     border: 1px solid var(--card-border, var(--border-color));
     padding: var(--card-padding, var(--space-md));
   }
   ```

4. **Update Component Manifest**
   ```json
   {
     "name": "Card",
     "css": {
       "primary": "Card.css",
       "files": ["Card.css"]
     }
   }
   ```

5. **Remove from Global CSS**
   - Delete extracted styles from global CSS files
   - Update any imports or references

### Migration Validation Checklist

- [ ] Visual appearance matches exactly before and after migration
- [ ] All interactive states work correctly (hover, focus, active, disabled)
- [ ] Theme switching continues to work properly
- [ ] Responsive behavior is maintained
- [ ] Accessibility features are preserved
- [ ] Performance hasn't degraded

## Performance Considerations

### CSS Loading Optimization

1. **Critical CSS**: Mark essential above-the-fold components as critical
   ```json
   {
     "css": {
       "critical": true,
       "preload": true
     }
   }
   ```

2. **Lazy Loading**: Non-critical components load CSS on demand
   ```json
   {
     "css": {
       "lazy": true,
       "performance": {
         "priority": "low"
       }
     }
   }
   ```

3. **CSS Bundling**: Production builds can bundle component CSS
   ```javascript
   // Build process can combine related CSS files
   // Card.css + Card.theme-ocean.css = Card.bundle.css
   ```

### Caching Strategy

- CSS files are cached by CSSManager to prevent duplicate loading
- Cache invalidation based on file modification timestamps
- Development mode bypasses cache for hot reloading
- Production mode uses aggressive caching with versioned URLs

## Best Practices

### CSS Organization within Files

1. **Use logical property order**:
   ```css
   .component {
     /* Display & positioning */
     display: flex;
     position: relative;
     
     /* Box model */
     width: 100%;
     margin: 0;
     padding: var(--space-md);
     border: 1px solid var(--border-color);
     
     /* Typography */
     font-size: var(--font-size-base);
     line-height: var(--line-height-base);
     
     /* Visual */
     background-color: var(--bg-surface);
     color: var(--text-primary);
     
     /* Animation */
     transition: all 0.2s ease-in-out;
   }
   ```

2. **Group related selectors**:
   ```css
   /* Base component */
   .card { }
   
   /* Component parts */
   .card__header { }
   .card__body { }
   .card__footer { }
   
   /* Modifiers */
   .card--elevated { }
   .card--compact { }
   
   /* States */
   .card:hover { }
   .card:focus { }
   .card[aria-expanded="true"] { }
   
   /* Media queries */
   @media (max-width: 768px) {
     .card { }
   }
   ```

3. **Use consistent commenting**:
   ```css
   /* =============================================================================
      Card Component
      ============================================================================= */
   
   /* Base card styles */
   .card {
     /* ... */
   }
   
   /* Card header with title and actions */
   .card__header {
     /* ... */
   }
   
   /* Interactive states */
   .card:hover {
     /* ... */
   }
   ```

### Theme Token Usage

1. **Always provide fallbacks**:
   ```css
   .component {
     color: var(--component-text, var(--text-primary, #333333));
   }
   ```

2. **Use semantic token names**:
   ```css
   /* Good: Semantic meaning */
   background-color: var(--card-background);
   
   /* Bad: Hard-coded values */
   background-color: var(--color-blue-100);
   ```

3. **Component-specific tokens for customization**:
   ```css
   .card {
     /* Allow component-level customization */
     --card-padding: var(--space-md);
     --card-radius: var(--radius-md);
     
     padding: var(--card-padding);
     border-radius: var(--card-radius);
   }
   ```

## Troubleshooting

### Common Issues and Solutions

1. **CSS Not Loading**
   - Check that CSS file name matches component name exactly
   - Verify component.json manifest includes CSS file
   - Ensure CSSPathResolver can find the CSS file
   - Check browser developer tools for 404 errors

2. **Style Conflicts**
   - Verify CSS scoping is applied correctly
   - Check for global CSS that might override component styles
   - Use more specific selectors if needed
   - Consider using CSS custom properties for easier overrides

3. **Theme Tokens Not Resolving**
   - Ensure theme tokens are defined in token files
   - Check token inheritance chain
   - Verify ThemeService is loaded before component
   - Use fallback values for undefined tokens

4. **Performance Issues**
   - Check if CSS files are being loaded multiple times
   - Verify caching is working correctly
   - Consider marking non-critical CSS as lazy-loaded
   - Review CSS bundle size in production builds

### Debug Tools

1. **CSS Loading Inspector**:
   ```javascript
   // Development mode debug helper
   window.CSSDebugger = {
     listLoadedCSS: () => CSSManager.getLoadedFiles(),
     inspectComponent: (name) => CSSManager.getComponentCSS(name),
     validateTokens: (cssContent) => ThemeTokenProcessor.validate(cssContent)
   };
   ```

2. **Component CSS Validator**:
   ```javascript
   // Check if component CSS follows conventions
   ComponentManifest.validate('./src/components/ui/Card');
   ```

## Conclusion

CSS co-location provides a robust foundation for component-based development in the Learnimals project. By following these patterns and guidelines, developers can create maintainable, performant, and accessible components that integrate seamlessly with the overall design system.

The co-location approach, combined with the enhanced theme token system and automatic CSS loading through BaseComponentV2, creates a developer-friendly environment that promotes consistency while allowing for necessary customization and optimization.

For additional help or questions about CSS co-location patterns, refer to the component templates in `src/templates/` or consult the component manifest documentation.