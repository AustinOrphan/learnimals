/**
 * CSSScopingManager Usage Examples
 * Demonstrates different scoping strategies and use cases
 */

import CSSScopingManager from './CSSScopingManager.js';

// Example CSS content for a Card component
const cardCSS = `
  .card {
    background: var(--card-background);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .card-header {
    font-size: 1.2em;
    font-weight: bold;
    margin-bottom: 12px;
  }

  .card-content {
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .card-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .button-primary {
    background: var(--accent-primary);
    color: white;
  }

  .button-secondary {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
  }
`;

// Create scoping manager instance
const scopingManager = new CSSScopingManager({
  enableDebugMode: true,
  performanceTracking: true,
  cssModulesEnabled: true
});

console.log('=== CSS Scoping Manager Examples ===\n');

// Example 1: Class-based scoping (default)
console.log('1. Class-based Scoping:');
const classScoped = scopingManager.applyScopingStrategy(cardCSS, 'Card');
console.log('Component Class:', classScoped.componentClass);
console.log('Scoped CSS (excerpt):', classScoped.css.split('\n')[0]);
console.log('Scoped:', classScoped.scoped);
console.log('');

// Example 2: Attribute-based scoping
console.log('2. Attribute-based Scoping:');
const attributeScoped = scopingManager.applyScopingStrategy(cardCSS, 'Card', {
  strategy: 'attribute'
});
console.log('Attribute Name:', attributeScoped.attributeName);
console.log('Attribute Value:', attributeScoped.attributeValue);
console.log('Scoped CSS (excerpt):', attributeScoped.css.split('\n')[0]);
console.log('');

// Example 3: CSS Modules scoping
console.log('3. CSS Modules Scoping:');
const modulesScoped = scopingManager.applyScopingStrategy(cardCSS, 'Card', {
  strategy: 'css-modules'
});
console.log('Class Map:', modulesScoped.classMap);
console.log('Original vs Scoped classes:');
Object.entries(modulesScoped.classMap).forEach(([original, scoped]) => {
  console.log(`  .${original} → .${scoped}`);
});
console.log('');

// Example 4: Custom options
console.log('4. Custom Options:');
const customScoped = scopingManager.applyScopingStrategy(cardCSS, 'Card', {
  strategy: 'class',
  classPrefix: 'learnimals',
  removeComments: false,
  formatOutput: true
});
console.log('Custom Component Class:', customScoped.componentClass);
console.log('');

// Example 5: Error handling
console.log('5. Error Handling:');
const errorResult = scopingManager.applyScopingStrategy(cardCSS, 'Card', {
  strategy: 'invalid-strategy'
});
console.log('Error handled gracefully:');
console.log('  Scoped:', errorResult.scoped);
console.log('  Strategy:', errorResult.strategy);
console.log('  Error:', errorResult.error);
console.log('');

// Example 6: Performance metrics
console.log('6. Performance Metrics:');
const metrics = scopingManager.getPerformanceMetrics();
console.log('Processing stats:', {
  totalComponents: metrics.totalScopedComponents,
  cacheHits: metrics.cacheHits,
  cacheMisses: metrics.cacheMisses,
  cacheHitRate: metrics.cacheHitRate?.toFixed(2) || 'N/A',
  averageTime: metrics.averageProcessingTime?.toFixed(2) || 'N/A'
});
console.log('');

// Example 7: Cache statistics
console.log('7. Cache Statistics:');
const cacheStats = scopingManager.getCacheStats();
console.log('Cache usage:', cacheStats);
console.log('');

// Example 8: Validation
console.log('8. CSS Validation:');
const validationResult = scopingManager.applyScopingStrategy(cardCSS, 'Card', {
  validateOutput: true
});
console.log('Validation passed:', validationResult.validation?.isValid);
if (validationResult.validation?.warnings?.length > 0) {
  console.log('Warnings:', validationResult.validation.warnings);
}
console.log('');

// Example usage in a component context
class Card {
  constructor(options = {}) {
    this.componentName = 'Card';
    this.cssContent = cardCSS;
    this.scopingStrategy = options.scopingStrategy || 'class';
    
    // Initialize CSS scoping
    this.initializeCSS();
  }

  initializeCSS() {
    const scopingManager = new CSSScopingManager();
    
    const result = scopingManager.applyScopingStrategy(
      this.cssContent,
      this.componentName,
      { strategy: this.scopingStrategy }
    );

    if (result.scoped) {
      this.scopedCSS = result.css;
      this.componentClass = result.componentClass || null;
      this.classMap = result.classMap || null;
    } else {
      console.warn(`CSS scoping failed for ${this.componentName}: ${result.error}`);
      this.scopedCSS = this.cssContent; // Fallback to original
    }
  }

  getClassName(originalClass) {
    // For CSS modules, map original class to scoped class
    if (this.classMap && this.classMap[originalClass]) {
      return this.classMap[originalClass];
    }
    
    // For other strategies, return original class (will be scoped by ancestor)
    return originalClass;
  }

  render() {
    const cardClass = this.getClassName('card');
    const headerClass = this.getClassName('card-header');
    const contentClass = this.getClassName('card-content');
    
    return `
      <div class="${cardClass}" ${this.componentClass ? '' : 'data-component="card"'}>
        <div class="${headerClass}">Card Title</div>
        <div class="${contentClass}">Card content goes here...</div>
      </div>
    `;
  }
}

// Example usage
console.log('9. Component Integration Example:');
const cardComponent = new Card({ scopingStrategy: 'class' });
console.log('Card component rendered HTML:');
console.log(cardComponent.render().trim());
console.log('');

console.log('=== Examples Complete ===');

export { scopingManager, Card };