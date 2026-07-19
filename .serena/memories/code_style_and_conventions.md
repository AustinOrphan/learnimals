# Code Style and Conventions

## JavaScript Conventions

- **ES6+ Features**: Uses modern JavaScript with classes, arrow functions, destructuring
- **Strict Mode**: All JavaScript files use `'use strict';`
- **Module Pattern**: IIFE (Immediately Invoked Function Expression) for encapsulation
- **Class-Based Components**: Component classes extend BaseComponent
- **JSDoc Comments**: Comprehensive documentation for methods and parameters
- **Naming**: camelCase for variables/functions, PascalCase for classes

## Component Architecture

- **BaseComponent Pattern**: All components extend BaseComponent class
- **Options Object**: Constructor accepts options object with default values
- **HTML Generation**: `generateHTML()` method returns HTML string
- **Event Handling**: `attachEventListeners()` method for event setup
- **Custom Events**: Components emit custom events for external handling

## CSS Conventions

- **Semantic Variables**: Use `--text-primary`, `--bg-card`, `--accent-primary` instead of direct colors
- **BEM Methodology**: Block Element Modifier naming convention
- **Component Structure**: `component`, `feature-card`, `card-title`, etc.
- **Theme Support**: All components support light/dark themes
- **Mobile-First**: Responsive design with mobile-first approach

## File Organization

- **Feature-Based**: Related files grouped by feature/subject
- **Component Types**: UI components separated by type (ui/, layout/, forms/)
- **CSS Co-location**: Component CSS files alongside JavaScript
- **Template System**: Shared templates with placeholder substitution

## Security and Best Practices

- **XSS Prevention**: Proper escaping of user content
- **Progressive Enhancement**: Works without JavaScript
- **Accessibility**: ARIA roles and semantic HTML
- **Performance**: Lazy loading images, service worker caching
