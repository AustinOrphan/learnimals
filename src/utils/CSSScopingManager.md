# CSSScopingManager

A comprehensive CSS scoping and isolation system for component-based web applications. Provides multiple scoping strategies to prevent style bleeding between components while maintaining performance and developer experience.

## Features

- **Multiple Scoping Strategies**: Class-based, attribute-based, and CSS Modules
- **Performance Optimized**: Built-in caching and performance tracking
- **Theme Integration**: Leverages existing theme system patterns
- **Error Handling**: Graceful fallbacks when scoping fails
- **Validation**: Built-in CSS validation and debugging tools
- **Extensible**: Plugin architecture for custom scoping strategies

## Scoping Strategies

### 1. Class-Based Scoping (Default)
Wraps CSS selectors with a component-specific class name.

```css
/* Original */
.button { color: blue; }

/* Scoped */
.component-card .button { color: blue; }
```

### 2. Attribute-Based Scoping
Wraps CSS selectors with a component-specific attribute selector.

```css
/* Original */
.button { color: blue; }

/* Scoped */
[data-component="card"] .button { color: blue; }
```

### 3. CSS Modules Scoping
Generates unique class names with hash suffixes.

```css
/* Original */
.button { color: blue; }

/* Scoped */
.button_Card_w5zdik { color: blue; }
```

## Basic Usage

```javascript
import CSSScopingManager from './CSSScopingManager.js';

const scopingManager = new CSSScopingManager({
  defaultStrategy: 'class',
  enableDebugMode: true,
  performanceTracking: true
});

const css = '.button { color: blue; }';
const result = scopingManager.applyScopingStrategy(css, 'Card');

console.log(result.css); // Scoped CSS
console.log(result.componentClass); // Generated class name
```

## Configuration Options

```javascript
const options = {
  defaultStrategy: 'class',        // 'class' | 'attribute' | 'css-modules'
  enableDebugMode: false,          // Enable debug logging
  scopingPrefix: 'component',      // Prefix for generated class names
  cssModulesEnabled: false,        // Enable CSS modules strategy
  cacheEnabled: true,              // Enable result caching
  performanceTracking: false       // Track performance metrics
};
```

## Scoping Options

### Class-Based Options
```javascript
const result = scopingManager.applyScopingStrategy(css, 'Card', {
  strategy: 'class',
  classPrefix: 'my-app',         // Custom prefix
  skipPatterns: [/\.global-/]    // Custom skip patterns
});
```

### Attribute-Based Options
```javascript
const result = scopingManager.applyScopingStrategy(css, 'Card', {
  strategy: 'attribute',
  attributeName: 'data-scope',   // Custom attribute name
  attributeValue: 'card-comp'    // Custom attribute value
});
```

### CSS Modules Options
```javascript
const result = scopingManager.applyScopingStrategy(css, 'Card', {
  strategy: 'css-modules'
});

// Access class mappings
console.log(result.classMap.button); // 'button_Card_w5zdik'
```

## Processing Options

```javascript
const result = scopingManager.applyScopingStrategy(css, 'Card', {
  removeComments: true,          // Remove CSS comments
  normalizeWhitespace: true,     // Normalize whitespace
  processThemeTokens: true,      // Process theme tokens
  validateOutput: true,          // Validate scoped CSS
  formatOutput: false            // Format CSS output
});
```

## Result Object

```javascript
{
  css: string,                   // Scoped CSS content
  scoped: boolean,              // Whether scoping was successful
  strategy: string,             // Strategy used
  componentClass?: string,      // Generated component class (class strategy)
  attributeName?: string,       // Attribute name (attribute strategy)
  attributeValue?: string,      // Attribute value (attribute strategy)
  classMap?: object,            // Class mappings (CSS modules)
  metadata: {
    componentName: string,
    strategy: string,
    timestamp: string,
    originalSelectors: string[],
    scopedSelectors: string[]
  },
  validation?: {
    isValid: boolean,
    errors: string[],
    warnings: string[]
  },
  error?: string,               // Error message if scoping failed
  warnings?: string[]           // Warning messages
}
```

## Performance Monitoring

```javascript
// Enable performance tracking
const manager = new CSSScopingManager({ performanceTracking: true });

// Get performance metrics
const metrics = manager.getPerformanceMetrics();
console.log(metrics.averageProcessingTime);
console.log(metrics.cacheHitRate);

// Get cache statistics
const cacheStats = manager.getCacheStats();
console.log(cacheStats.processedCacheSize);
```

## Error Handling

The CSSScopingManager handles errors gracefully and always returns a valid result object:

```javascript
const result = manager.applyScopingStrategy(malformedCSS, 'Card');

if (!result.scoped) {
  console.warn('Scoping failed:', result.error);
  // result.css contains the original CSS as fallback
}
```

## Integration with Components

```javascript
class Card extends BaseComponent {
  constructor(options = {}) {
    super(options);
    this.scopingManager = new CSSScopingManager();
    this.initializeCSS();
  }

  initializeCSS() {
    const result = this.scopingManager.applyScopingStrategy(
      this.cssContent,
      this.componentName,
      { strategy: 'class' }
    );

    if (result.scoped) {
      this.injectScopedCSS(result.css);
      this.element.classList.add(result.componentClass.split('-').pop());
    }
  }
}
```

## Requirements Fulfilled

- **NFR-2.3**: Component CSS isolation prevents global style leaking
- **FR-1.1**: Supports co-located CSS files with automatic processing
- **Performance**: Caching and optimization for production use
- **Developer Experience**: Clear APIs, error handling, and debugging tools

## Browser Compatibility

- Modern browsers supporting ES6+ features
- CSS custom properties support recommended
- Graceful degradation for older browsers

## See Also

- `CSSScopingManager.example.js` - Comprehensive usage examples
- `CSSScopingManager.test.js` - Test suite and validation
- Theme system integration documentation