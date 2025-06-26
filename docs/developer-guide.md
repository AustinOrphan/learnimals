# Learnimals Developer Guide

This guide provides comprehensive information for developers working with the Learnimals codebase, including architecture overview, component usage patterns, and development best practices.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Component System](#component-system)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Code Quality Standards](#code-quality-standards)
- [Performance Guidelines](#performance-guidelines)
- [Accessibility Requirements](#accessibility-requirements)
- [Deployment Process](#deployment-process)

---

## Architecture Overview

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI elements (Modal, Card, etc.)
│   ├── layout/         # Layout components (navbar, navigation)
│   ├── forms/          # Form components
│   └── games/          # Game-specific components
├── features/           # Feature-based organization
│   ├── subjects/       # Subject-specific functionality
│   ├── games/          # Game features
│   └── user/           # User-related functionality
├── styles/             # Modern CSS organization
│   ├── base/           # Foundation styles
│   ├── components/     # Component-specific styles
│   └── themes/         # Theme-related styles
├── utils/              # Utility functions and helpers
├── templates/          # HTML templates
└── pages/              # Main application pages
```

### Key Architectural Principles

1. **Component-Based Design**: Reusable, self-contained components
2. **Feature-Based Organization**: Related functionality grouped together
3. **Separation of Concerns**: Clear boundaries between UI, logic, and data
4. **Progressive Enhancement**: Works without JavaScript, enhanced with it
5. **Mobile-First**: Responsive design starting from mobile devices

### Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Build System**: Static files (no build process by default)
- **Testing**: Vitest with happy-dom
- **Code Quality**: ESLint, Prettier, JSDoc
- **PWA**: Service Worker, Web App Manifest

---

## Component System

### BaseComponent Foundation

All UI components extend from `BaseComponent`, which provides:

- DOM management and lifecycle
- Event handling utilities
- Consistent API patterns
- Memory leak prevention

```javascript
// Example component extending BaseComponent
class MyComponent extends BaseComponent {
  constructor(options) {
    super(options);
    // Component-specific initialization
  }
  
  generateHTML() {
    // Return component HTML structure
    return `<div class="my-component">${this.options.content}</div>`;
  }
  
  attachEventListeners() {
    // Set up event handlers
    this.addEventListener('click', this.handleClick, '.my-button');
  }
  
  handleClick(event) {
    // Handle user interactions
    this.emit('myComponentClick', { event });
  }
}
```

### Component Categories

#### 1. UI Components (`src/components/ui/`)
- **Modal**: Dialog boxes and overlays
- **Card**: Content cards with consistent styling
- **PWAInstaller**: Progressive Web App installation

#### 2. Layout Components (`src/components/layout/`)
- **Navbar**: Site navigation
- **ThemeSwitcher**: Theme selection interface
- **MobileMenuHandler**: Mobile navigation

#### 3. Game Components (`src/components/games/`)
- **BaseGame**: Foundation for all games
- **GameTemplateLoader**: Game initialization system

#### 4. Form Components (`src/components/forms/`)
- **FormComponent**: Form validation and handling

### Component Usage Patterns

#### 1. Simple Component Usage
```javascript
// Create and render a basic component
const modal = new Modal({
  id: 'my-modal',
  title: 'Hello World',
  content: '<p>Modal content here</p>'
});
modal.create().open();
```

#### 2. Component with Event Handling
```javascript
// Component with custom event listeners
const card = new Card({
  title: 'Interactive Card',
  content: '<p>Click me!</p>',
  linkUrl: '/destination'
});

document.addEventListener('cardClick', (event) => {
  console.log('Card clicked:', event.detail);
});

card.render('#container');
```

#### 3. Game Component Pattern
```javascript
// Game extending BaseGame
class MyGame extends BaseGame {
  constructor(canvasId) {
    super(canvasId, {
      onScoreUpdate: (score) => updateUI(score)
    });
  }
  
  update(deltaTime) {
    // Game logic
  }
  
  render() {
    super.render(); // Clear canvas
    // Custom rendering
  }
}
```

---

## Development Workflow

### Setting Up Development Environment

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd learnimals
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   # Use any local server
   python -m http.server 8000
   # or
   npx serve
   # or use VS Code Live Server
   ```

4. **Run Tests**
   ```bash
   npm test              # Run all tests
   npm run test:watch    # Watch mode
   npm run test:coverage # With coverage
   ```

5. **Code Quality Checks**
   ```bash
   npm run lint          # Check code quality
   npm run lint:fix      # Auto-fix issues
   npm run format        # Format code
   ```

### Development Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/ scripts/ tests/ --ext .js",
    "lint:fix": "eslint src/ scripts/ tests/ --ext .js --fix",
    "format": "prettier --write \"**/*.{js,json,md,css,html}\"",
    "generate-subjects": "node scripts/generateSubjects.js"
  }
}
```

### Creating New Components

1. **Choose Component Location**
   - UI components: `src/components/ui/`
   - Layout components: `src/components/layout/`
   - Game components: `src/components/games/`

2. **Component Template**
   ```javascript
   /**
    * @fileoverview MyComponent - Brief description
    */
   import BaseComponent from '../BaseComponent.js';
   
   class MyComponent extends BaseComponent {
     constructor(options) {
       super({
         // Default options
         ...options
       });
     }
     
     generateHTML() {
       return `<div class="my-component">${this.options.content}</div>`;
     }
     
     attachEventListeners() {
       // Event handling
     }
   }
   
   // Export for both CommonJS and browser
   if (typeof module !== 'undefined' && module.exports) {
     module.exports = MyComponent;
   } else {
     window.MyComponent = MyComponent;
   }
   ```

3. **Create Tests**
   ```javascript
   // tests/components/MyComponent.test.js
   import { describe, it, expect, beforeEach } from 'vitest';
   import MyComponent from '../../src/components/ui/MyComponent.js';
   
   describe('MyComponent', () => {
     let component;
     
     beforeEach(() => {
       component = new MyComponent({
         content: 'Test content'
       });
     });
     
     it('should create component with default options', () => {
       expect(component.options.content).toBe('Test content');
     });
   });
   ```

4. **Add Documentation**
   - JSDoc comments for all public methods
   - Usage examples in component file
   - Update component documentation

### Subject Creation Workflow

Use the automated subject generator for creating new educational subjects:

```bash
# Generate specific subjects
npm run generate-subjects -- --subjects=music,geography

# List available templates
npm run list-templates

# Generate from batch file
npm run generate-subjects -- --batch-file=subjects.json
```

---

## Testing Strategy

### Test Structure

```
tests/
├── unit/               # Unit tests for utilities and isolated functions
├── components/         # Component-specific tests
├── integration/        # Feature integration tests
├── fixtures/           # Test data and fixtures
├── mocks/              # Mock implementations
└── utils/              # Test utilities and helpers
```

### Testing Patterns

#### 1. Component Testing
```javascript
describe('Modal Component', () => {
  it('should open and close properly', () => {
    const modal = new Modal({
      id: 'test-modal',
      title: 'Test',
      content: 'Content'
    });
    
    modal.create();
    expect(modal.isOpen).toBe(false);
    
    modal.open();
    expect(modal.isOpen).toBe(true);
    
    modal.close();
    expect(modal.isOpen).toBe(false);
  });
});
```

#### 2. Game Testing
```javascript
describe('BaseGame', () => {
  let game;
  
  beforeEach(() => {
    // Setup canvas element
    const canvas = testUtils.createElement('canvas', { id: 'test-canvas' });
    document.body.appendChild(canvas);
    
    game = new BaseGame('test-canvas');
  });
  
  it('should manage game state correctly', () => {
    expect(game.state).toBe('ready');
    
    game.start();
    expect(game.state).toBe('playing');
    
    game.pause();
    expect(game.state).toBe('paused');
  });
});
```

#### 3. Integration Testing
```javascript
describe('Game Flow Integration', () => {
  it('should complete full game lifecycle', async () => {
    // Test complete user journey
    const game = new BubblePopGame('canvas');
    
    // Start game
    game.start();
    expect(game.state).toBe('playing');
    
    // Simulate gameplay
    game.handleClick({ x: 100, y: 100 });
    expect(game.score).toBeGreaterThan(0);
    
    // End game
    game.gameOver();
    expect(game.state).toBe('game-over');
  });
});
```

### Test Configuration

Each test type has its own Vitest configuration:

- `vitest.config.js` - Main configuration
- `vitest.config.unit.js` - Unit tests with Node environment
- `vitest.config.components.js` - Component tests with happy-dom
- `vitest.config.integration.js` - Integration tests

### Coverage Requirements

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

---

## Code Quality Standards

### ESLint Configuration

The project uses a comprehensive ESLint setup with:

- **Error Prevention**: Catch undefined variables, unreachable code
- **Code Quality**: Complexity limits, naming conventions
- **Modern JavaScript**: ES6+ features, best practices
- **Security**: Detect potential vulnerabilities
- **Accessibility**: ARIA and semantic HTML rules

### Key Rules

```javascript
// .eslintrc.js
rules: {
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'complexity': ['warn', 10],
  'max-depth': ['warn', 4],
  'max-lines-per-function': ['warn', 50],
  'prefer-const': 'error',
  'no-var': 'error'
}
```

### File-Specific Overrides

- **Test Files**: Allow magic numbers, longer functions
- **Config Files**: Allow console usage, CommonJS
- **Game Files**: Higher complexity limits
- **Components**: Stricter documentation requirements

### Prettier Configuration

Consistent code formatting with:

```javascript
// .prettierrc.js
{
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2
}
```

### JSDoc Standards

All public APIs must include:

- **File-level documentation**: Module description, requirements
- **Class documentation**: Purpose, examples, inheritance
- **Method documentation**: Parameters, return values, examples
- **Type annotations**: Use TypeScript-style type definitions

Example:
```javascript
/**
 * @fileoverview Component description
 * @module ComponentName
 * @requires BaseComponent
 */

/**
 * Component class description
 * @class ComponentName
 * @extends BaseComponent
 * @example
 * const component = new ComponentName(options);
 */
class ComponentName extends BaseComponent {
  /**
   * Method description
   * @param {string} param - Parameter description
   * @returns {boolean} Return value description
   * @example
   * component.method('value'); // Returns true
   */
  method(param) {
    // Implementation
  }
}
```

---

## Performance Guidelines

### General Performance Principles

1. **Minimize DOM Manipulation**
   - Batch DOM updates
   - Use DocumentFragment for multiple insertions
   - Cache DOM queries

2. **Efficient Event Handling**
   - Use event delegation
   - Remove event listeners on cleanup
   - Debounce high-frequency events

3. **Memory Management**
   - Clear references in destroy methods
   - Remove event listeners
   - Cancel pending requests/timers

4. **Asset Optimization**
   - Lazy load images with `loading="lazy"`
   - Use appropriate image formats
   - Minimize JavaScript bundle size

### Game Performance

#### Canvas Optimization
```javascript
// Good: Batch canvas operations
ctx.save();
ctx.fillStyle = 'red';
objects.forEach(obj => {
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
});
ctx.restore();

// Avoid: Setting style for each object
objects.forEach(obj => {
  ctx.fillStyle = obj.color; // Expensive state change
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
});
```

#### Game Loop Optimization
```javascript
// Use requestAnimationFrame properly
gameLoop(timestamp) {
  if (!this.gameLoopRunning) return;
  
  const deltaTime = timestamp - this.lastFrameTime;
  this.lastFrameTime = timestamp;
  
  // Update game logic
  this.update(deltaTime);
  
  // Render only if needed
  if (this.needsRender) {
    this.render();
    this.needsRender = false;
  }
  
  this.gameLoopId = requestAnimationFrame(ts => this.gameLoop(ts));
}
```

### Performance Monitoring

The BaseGame class includes built-in performance monitoring:

```javascript
// FPS tracking
getAverageFPS() {
  return this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
}

// Performance warnings
if (avgFps < 30) {
  logger.perf('Low FPS detected:', avgFps);
}
```

---

## Accessibility Requirements

### ARIA Standards

1. **Semantic HTML**: Use appropriate HTML elements
2. **ARIA Attributes**: Add when semantic HTML isn't sufficient
3. **Keyboard Navigation**: All interactive elements must be keyboard accessible
4. **Screen Reader Support**: Provide descriptive text and labels

### Implementation Examples

#### Modal Accessibility
```javascript
generateHTML() {
  return `
    <div class="modal-overlay" aria-hidden="true">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 id="modal-title">${this.options.title}</h3>
        <div class="modal-content">${this.options.content}</div>
        <button aria-label="Close dialog">&times;</button>
      </div>
    </div>
  `;
}
```

#### Card Accessibility
```javascript
generateHTML() {
  return `
    <div class="card" role="article">
      <h3 class="card-title">${this.options.title}</h3>
      <div class="card-content">${this.options.content}</div>
      <a href="${this.options.linkUrl}" 
         class="card-link"
         aria-describedby="card-title">
        ${this.options.linkText}
      </a>
    </div>
  `;
}
```

### Testing Accessibility

1. **Automated Tools**: Use axe-core for automated testing
2. **Keyboard Testing**: Tab through all interactive elements
3. **Screen Reader Testing**: Test with NVDA, JAWS, or VoiceOver
4. **Color Contrast**: Ensure 4.5:1 contrast ratio minimum

---

## Deployment Process

### Pre-Deployment Checklist

1. **Code Quality**
   ```bash
   npm run lint:check     # Zero warnings allowed
   npm run format:check   # Code properly formatted
   npm run test:coverage  # 80%+ test coverage
   ```

2. **Performance Testing**
   - Run Lighthouse audit
   - Check loading times
   - Verify mobile responsiveness

3. **Accessibility Testing**
   - Run axe-core accessibility scan
   - Test keyboard navigation
   - Verify screen reader compatibility

4. **Cross-Browser Testing**
   - Chrome (latest 2 versions)
   - Firefox (latest 2 versions)
   - Safari (latest 2 versions)
   - Mobile browsers

### Static Deployment

Since this is a static site, deployment is straightforward:

1. **Copy Files**
   ```bash
   # Copy all files to web server
   rsync -av --exclude=node_modules --exclude=tests --exclude=.git ./ server:/var/www/learnimals/
   ```

2. **Update Service Worker**
   - Increment version number in serviceWorker.js
   - Update cache names for new versions

3. **CDN Configuration**
   - Set appropriate cache headers
   - Enable gzip compression
   - Configure HTTPS redirects

### Environment Configuration

#### Development
- Local file serving
- Debug logging enabled
- No asset minification

#### Production
- CDN asset delivery
- Production logging level
- Asset optimization
- HTTPS enforcement

### Monitoring

1. **Error Tracking**
   - Browser console errors
   - Service Worker errors
   - Performance issues

2. **Analytics**
   - Page views and user engagement
   - Game completion rates
   - Feature usage statistics

3. **Performance Monitoring**
   - Core Web Vitals
   - Loading times
   - Error rates

---

## Best Practices Summary

### Code Organization
- Keep components small and focused
- Use feature-based organization
- Maintain clear separation of concerns
- Follow consistent naming conventions

### Development Process
- Write tests before implementing features
- Use type hints in JSDoc comments
- Follow the Boy Scout Rule (leave code cleaner)
- Document public APIs thoroughly

### Performance
- Optimize for mobile-first
- Use lazy loading for assets
- Minimize DOM manipulation
- Implement proper memory management

### Accessibility
- Use semantic HTML elements
- Provide keyboard navigation
- Include ARIA attributes when needed
- Test with assistive technologies

### Quality Assurance
- Maintain high test coverage
- Use automated code quality tools
- Follow accessibility guidelines
- Perform cross-browser testing

This developer guide provides the foundation for building high-quality, maintainable code in the Learnimals project. For specific component APIs and usage examples, refer to the [Component API Reference](component-api-reference.md) and [Component Examples](component-examples.html).