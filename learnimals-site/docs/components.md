# Learnimals Component Library Documentation

This document provides guidelines for using the reusable components created to reduce technical debt and code duplication in the Learnimals project.

## Table of Contents

1. [Introduction](#introduction)
2. [Card Component](#card-component)
3. [Modal Component](#modal-component)
4. [Form Component](#form-component)
5. [Theme Management](#theme-management)
6. [UI Utilities](#ui-utilities)
7. [Component Loading System](#component-loading-system)

## Introduction

The Learnimals component library aims to:

- Reduce code duplication
- Ensure consistent UI behavior and appearance
- Improve code maintainability
- Simplify development of new features

## Card Component

The Card component creates consistent card layouts throughout the application.

### Usage

```javascript
// Create a basic card
const card = new Card({
  title: 'Math Tools',
  content: 'Try out fun math helpers!',
  imageUrl: '/assets/images/math-shark.png',
  imageAlt: 'Mango the Shark',
  linkUrl: '/subjects/math.html',
  linkText: 'Start Learning'
});

// Render the card
card.render('#card-container');

// Create a linked card with alternate styling
const linkedCardHTML = Card.createLinkedCard({
  title: 'Science',
  content: 'Learn about animals and nature!',
  imageUrl: '/assets/images/science-parrot.png',
  imageAlt: 'Sky the Parrot',
  theme: 'alt'
}, '/subjects/science.html');

// Insert the linked card HTML
document.querySelector('#linked-card-container').innerHTML = linkedCardHTML;
```

## Modal Component

The Modal component creates consistent dialog boxes throughout the application.

### Usage

```javascript
// Create a basic modal
const modal = new Modal({
  id: 'example-modal',
  title: 'Welcome to Learnimals',
  content: '<p>Let\'s start learning!</p>',
  confirmButtonText: 'Get Started',
  onConfirm: () => {
    console.log('User confirmed');
  }
});

// Create and show the modal
modal.create().open();

// Create a modal with custom options
const customModal = new Modal({
  title: 'Choose a Theme',
  content: '<div id="theme-picker"></div>',
  showCancelButton: true,
  cancelButtonText: 'Cancel',
  confirmButtonText: 'Apply',
  onCancel: () => console.log('User cancelled'),
  onConfirm: () => console.log('User confirmed'),
  size: 'large'
});

// Show the modal
customModal.create().open();

// Update modal content
customModal.update({
  title: 'New Title',
  content: 'Updated content'
});
```

## Form Component

The Form component creates consistent, validated forms throughout the application.

### Usage

```javascript
// Define form fields
const fields = [
  {
    name: 'name',
    type: 'text',
    label: 'Your Name',
    placeholder: 'Enter your name',
    required: true
  },
  {
    name: 'age',
    type: 'number',
    label: 'Age',
    min: 5,
    max: 12,
    helpText: 'Must be between 5 and 12'
  },
  {
    name: 'favoriteSubject',
    type: 'select',
    label: 'Favorite Subject',
    options: [
      { value: 'math', label: 'Math' },
      { value: 'science', label: 'Science' },
      { value: 'reading', label: 'Reading' },
      { value: 'art', label: 'Art' }
    ],
    required: true
  },
  {
    name: 'message',
    type: 'textarea',
    label: 'Tell us about yourself',
    placeholder: 'I like to...'
  }
];

// Create form
const form = new FormComponent({
  id: 'profile-form',
  fields: fields,
  submitButtonText: 'Save Profile',
  useLocalStorage: true,
  storageKey: 'learnimals-profile',
  onSubmit: (data) => {
    console.log('Form submitted with data:', data);
    // Save data or perform other actions
  }
});

// Render form
form.render('#form-container');
```

## Theme Management

The Theme Management system consists of several files that work together:

- `themeRegistry.js` - Central theme definitions and color sets for all themes
- `themeManager.js` - Core theme application logic for switching themes
- `themeSwitcher.js` - UI component for theme selection
- `themeManagerUtils.js` - Shared utility functions for theming
- `themeInitializer.js` - Early theme initialization to prevent FOUC (Flash of Unstyled Content)

### Theme Registry

The theme registry provides a centralized repository for theme definitions:

```javascript
import { COMMON_COLORS, THEME_BASE_COLORS, THEME_DEFINITIONS } from './utils/themeRegistry.js';

// Available color themes
const themes = THEME_DEFINITIONS.map(theme => theme.title); // ['Default Theme', 'Ocean Theme', etc.]
```

### Theme Manager

The Theme Manager provides an API for theme control:

```javascript
// Set a specific theme
window.themeManager.setTheme('ocean');

// Toggle between light and dark modes
window.themeManager.toggleMode();

// Set specific mode
window.themeManager.setMode('dark');

// Get current theme
const currentTheme = window.themeManager.getCurrentTheme();
```

### Semantic Variables

The theming system provides semantic variables that components should use instead of direct color values:

```css
/* Text colors */
--text-primary
--text-secondary
--text-on-accent
--text-heading

/* Background colors */
--bg-body
--bg-card
--bg-card-alt
--bg-highlight

/* Accent colors */
--accent-primary
--accent-secondary
--accent-tertiary

/* Interactive states */
--accent-primary-hover
--accent-secondary-hover

/* Border colors */
--border-color
--border-color-accent

/* Shadow */
--shadow-color
--shadow-color-strong

/* Focus */
--focus-ring-color
```

### Theme Usage in Components

When building new components, follow these guidelines:

1. **Use semantic variables**: Always use the semantic variables rather than direct theme color variables.

```css
/* ✅ GOOD: Using semantic variables */
.myComponent {
  background-color: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

/* ❌ BAD: Using theme-specific variables directly */
.myComponent {
  background-color: var(--ocean-color-light);
  color: var(--ocean-color-dark);
}
```

2. **Respect dark mode**: Test components in both light and dark modes to ensure visibility.

3. **Use contrasting colors appropriately**: For text on colored backgrounds, use `--text-on-accent`.

```css
.button {
  background-color: var(--accent-primary);
  color: var(--text-on-accent);
}
```

4. **Hover states**: Use the hover variants of colors for interactive elements.

```css
.button:hover {
  background-color: var(--accent-primary-hover);
}
```

## UI Utilities

The UI Utilities file provides common UI patterns and helpers.

### Usage

```javascript
import { showToast, toggleElement, formatDate, createTabs } from './utils/uiUtils.js';

// Show a toast notification
showToast({
  message: 'Great job completing the lesson!',
  type: 'success',
  duration: 5000
});

// Toggle element visibility
toggleElement('#help-section', true); // Show
toggleElement('#help-section', false); // Hide
toggleElement('#help-section'); // Toggle

// Format a date
const formattedDate = formatDate(new Date(), { format: 'long' });

// Create tabbed interface
const tabs = createTabs('#tab-container', {
  onTabChange: (index, tab, panel) => {
    console.log(`Switched to tab: ${tab.textContent}`);
  }
});

// Programmatically control tabs
tabs.activateTab(2); // Activate the third tab
```

## Component Loading System

The Component Loader provides a way to dynamically load HTML components.

### Usage

```javascript
// Create a loader
const loader = new ComponentLoader({
  basePath: '/learnimals-site/components'
});

// Load a single component
loader.loadComponent('navbar.html', '#navbar-placeholder')
  .then(() => console.log('Navbar loaded'))
  .catch(err => console.error('Failed to load navbar', err));

// Load multiple components
loader.loadMultipleComponents([
  {
    path: 'navbar.html',
    container: '#navbar-placeholder'
  },
  {
    path: 'footer.html',
    container: '#footer-placeholder'
  }
]).then(() => console.log('All components loaded'));

// Load component with data
loader.loadComponent('profile-card.html', '#profile-container', {
  username: 'MathGenius',
  score: 850,
  level: 5
});

// Load additional resources
loader.loadStylesheet('/css/components.css');
loader.loadScript('/js/utils/animations.js');
```

---

## Best Practices

1. **Always use components** for repeated UI patterns instead of duplicating HTML/CSS.
2. **Centralize theme definitions** in the themeRegistry file.
3. **Use semantic variables** in CSS instead of hard-coded colors.
4. **Keep components focused** - each component should do one thing well.
5. **Document component changes** in this documentation when updating.

## Contributing to the Component Library

When adding new components:

1. Create the component class in `js/components/`
2. Add corresponding styles in `css/components.css`
3. Update this documentation with usage examples
4. Consider backward compatibility with existing usages
