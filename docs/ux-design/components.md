# Learnimals Component Library

The Learnimals component library provides a consistent set of reusable UI components that follow established patterns and maintain visual consistency across the application.

## Architecture

### Base Component

All components extend from `BaseComponent`, which provides:

- **Consistent API**: Common methods for rendering, updating, and managing components
- **Event Management**: Standardized event handling with automatic cleanup
- **Lifecycle Methods**: Hooks for initialization, rendering, and destruction
- **Utility Methods**: Common DOM manipulation and styling helpers

### Component Categories

Components are organized into logical categories:

- **`ui/`**: Basic UI elements (Card, Modal, etc.)
- **`forms/`**: Form-related components and validation
- **`layout/`**: Layout and navigation components

## Core Components

### BaseComponent

The foundation class that all components extend.

```javascript
import { BaseComponent } from '../components/index.js';

class MyComponent extends BaseComponent {
  generateHTML() {
    return `<div id="${this.options.id}">My Component</div>`;
  }

  attachEventListeners() {
    this.addEventListener('click', this.handleClick);
  }

  handleClick(event) {
    console.log('Component clicked');
  }
}
```

**Key Features:**

- Auto-generated unique IDs
- Consistent render lifecycle
- Event listener management with cleanup
- Common utility methods (show/hide, addClass/removeClass, etc.)
- Custom event emission

### Card Component

Creates consistent card layouts with support for images, content, and actions.

```javascript
import { Card } from '../components/index.js';

const card = new Card({
  title: 'Math Games',
  content: 'Practice addition and subtraction with fun games!',
  imageUrl: '/images/math-icon.png',
  imageAlt: 'Math games icon',
  linkUrl: '/math.html',
  linkText: 'Start Learning',
  theme: 'default',
  cssClasses: ['subject-card'],
});

card.render('#card-container');
```

**Options:**

- `title`: Card title text
- `content`: Card content (supports HTML)
- `imageUrl`: Optional image URL
- `imageAlt`: Image alt text for accessibility
- `linkUrl`: Optional link URL
- `linkText`: Link button text
- `theme`: Visual theme (`default`, `alt`)
- `cssClasses`: Additional CSS classes

### Modal Component

Accessible modal dialogs with customizable content and actions.

```javascript
import { Modal } from '../components/index.js';

const modal = new Modal({
  title: 'Confirm Action',
  content: 'Are you sure you want to delete this item?',
  confirmButtonText: 'Delete',
  cancelButtonText: 'Cancel',
  showConfirmButton: true,
  showCancelButton: true,
  onConfirm: () => {
    console.log('Item deleted');
  },
  onCancel: () => {
    console.log('Action cancelled');
  },
});

modal.create().open();
```

**Features:**

- Accessible ARIA attributes
- Keyboard navigation (Escape to close)
- Click-outside-to-close
- Customizable buttons and callbacks
- Multiple sizes (`small`, `medium`, `large`)

### FormComponent

Comprehensive form builder with validation and local storage support.

```javascript
import { FormComponent } from '../components/index.js';

const form = new FormComponent({
  fields: [
    {
      name: 'username',
      type: 'text',
      label: 'Username',
      required: true,
      validate: value => {
        return value.length >= 3 || 'Username must be at least 3 characters';
      },
    },
    {
      name: 'age',
      type: 'number',
      label: 'Age',
      min: 1,
      max: 120,
      required: true,
    },
    {
      name: 'subject',
      type: 'select',
      label: 'Favorite Subject',
      options: [
        { value: 'math', label: 'Math' },
        { value: 'science', label: 'Science' },
        { value: 'reading', label: 'Reading' },
      ],
    },
  ],
  useLocalStorage: true,
  onSubmit: data => {
    console.log('Form submitted:', data);
  },
});

form.render('#form-container');
```

**Field Types:**

- `text`, `email`, `password`, `number`, `tel`, `url`
- `textarea`
- `select`
- `radio`, `checkbox`

**Features:**

- Real-time validation
- Custom validation functions
- Local storage integration
- Accessible form structure
- Error handling and display

## Component Guidelines

### Creating New Components

1. **Extend BaseComponent**: All new components should extend the base class
2. **Implement Required Methods**: Override `generateHTML()` and `attachEventListeners()`
3. **Follow Naming Conventions**: Use PascalCase for class names, camelCase for methods
4. **Use Semantic HTML**: Ensure proper accessibility and semantic structure
5. **Support Theming**: Use CSS custom properties for theming support

```javascript
class NewComponent extends BaseComponent {
  constructor(options) {
    super({
      // Default options
      type: 'default',
      ...options,
    });
  }

  generateHTML() {
    const { id, type } = this.options;
    return `
      <div id="${id}" class="new-component new-component--${type}">
        <!-- Component HTML -->
      </div>
    `;
  }

  attachEventListeners() {
    // Add event listeners
    this.addEventListener('click', this.handleClick);
  }

  handleClick(event) {
    // Handle interactions
    this.emit('newComponentClick', { event });
  }
}
```

### Styling Guidelines

1. **Use BEM Methodology**: Follow Block-Element-Modifier naming
2. **CSS Custom Properties**: Use semantic variables for theming
3. **Component Isolation**: Scope styles to component classes
4. **Responsive Design**: Ensure components work across devices

```css
/* Component styles */
.new-component {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
}

.new-component--primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
}

.new-component__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
}
```

### Accessibility Standards

All components must meet WCAG 2.1 AA standards:

1. **Semantic HTML**: Use appropriate HTML elements
2. **Keyboard Navigation**: Support Tab, Enter, Escape, Arrow keys
3. **ARIA Attributes**: Include proper labels, roles, and states
4. **Focus Management**: Visible focus indicators and logical tab order
5. **Screen Reader Support**: Meaningful text for assistive technologies

## Usage Examples

### Basic Component Usage

```javascript
// Import components
import { Card, Modal, FormComponent } from './components/index.js';

// Create and render components
const card = new Card({
  title: 'Welcome',
  content: 'Get started with Learnimals!',
}).render('#main-content');

// Chain methods for fluent API
card.addClass('featured').show();
```

### Advanced Integration

```javascript
// Custom component extending BaseComponent
class GameComponent extends BaseComponent {
  constructor(options) {
    super({
      gameType: 'memory',
      difficulty: 'easy',
      ...options,
    });
  }

  generateHTML() {
    return `
      <div id="${this.options.id}" class="game-component">
        <h2>Game: ${this.options.gameType}</h2>
        <div class="game-board"></div>
        <button class="game-start">Start Game</button>
      </div>
    `;
  }

  attachEventListeners() {
    this.addEventListener('click', this.startGame, '.game-start');
  }

  startGame() {
    this.emit('gameStarted', {
      type: this.options.gameType,
      difficulty: this.options.difficulty,
    });
  }
}

// Use the custom component
const game = new GameComponent({
  gameType: 'math-quiz',
  difficulty: 'medium',
});

game.render('#game-container');
game.addEventListener('gameStarted', e => {
  console.log('Game started:', e.detail);
});
```

## Best Practices

1. **Component Composition**: Build complex components from simpler ones
2. **Event-Driven Architecture**: Use custom events for component communication
3. **Performance**: Clean up event listeners and references when destroying components
4. **Testing**: Components should be easily testable in isolation
5. **Documentation**: Document component APIs and provide usage examples

## Migration Guide

For existing components not yet following the new standards:

1. **Extend BaseComponent**: Inherit from the base class
2. **Standardize Options**: Use consistent option patterns
3. **Event Management**: Use the built-in event system
4. **Error Handling**: Add proper error handling and logging
5. **Accessibility**: Ensure components meet accessibility standards

The component library provides a solid foundation for building consistent, accessible, and maintainable UI components throughout the Learnimals application.
