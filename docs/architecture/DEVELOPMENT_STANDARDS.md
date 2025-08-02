# Development Standards and Code Conventions

## Overview

This document establishes coding standards and conventions for the Learnimals project. Consistency in code style improves readability, maintainability, and reduces cognitive overhead for developers.

---

## JavaScript Standards

### ES6+ Features

#### Use Modern JavaScript
```javascript
// ✅ GOOD - Use const/let
const MAX_ATTEMPTS = 3;
let currentAttempt = 0;

// ❌ BAD - Avoid var
var maxAttempts = 3;
var currentAttempt = 0;
```

#### Arrow Functions
```javascript
// ✅ GOOD - Arrow functions for callbacks
const numbers = [1, 2, 3];
const doubled = numbers.map(n => n * 2);

// For single-line returns
const getName = user => user.name;

// For multi-line functions
const processUser = user => {
  validate(user);
  save(user);
  return user.id;
};

// ✅ GOOD - Regular functions for methods
class Component {
  handleClick() {
    this.update();
  }
}
```

#### Destructuring
```javascript
// ✅ GOOD - Object destructuring
const { name, age, email } = user;

// ✅ GOOD - Array destructuring
const [first, second, ...rest] = items;

// ✅ GOOD - Parameter destructuring
function createUser({ name, email, role = 'student' }) {
  return { name, email, role };
}

// ❌ BAD
const name = user.name;
const age = user.age;
const email = user.email;
```

#### Template Literals
```javascript
// ✅ GOOD
const message = `Welcome ${user.name}! You have ${count} new messages.`;
const multiline = `
  <div class="card">
    <h2>${title}</h2>
    <p>${description}</p>
  </div>
`;

// ❌ BAD
const message = 'Welcome ' + user.name + '! You have ' + count + ' new messages.';
```

### Naming Conventions

#### Variables and Functions
```javascript
// ✅ GOOD - Descriptive names
const userScore = 100;
const isLoggedIn = true;
const hasCompletedTutorial = false;

function calculateProgress(completed, total) {
  return (completed / total) * 100;
}

// ❌ BAD - Single letters, abbreviations
const s = 100;
const flag = true;
function calc(c, t) {
  return (c / t) * 100;
}
```

#### Constants
```javascript
// ✅ GOOD - UPPER_SNAKE_CASE for true constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const API_ENDPOINTS = {
  USERS: '/api/users',
  ACTIVITIES: '/api/activities'
};

// Configuration objects can use camelCase
const config = {
  apiUrl: 'https://api.learnimals.com',
  timeout: 30000
};
```

#### Classes and Constructors
```javascript
// ✅ GOOD - PascalCase for classes
class UserProfile {
  constructor(data) {
    this.data = data;
  }
}

class ActivityManager extends BaseManager {
  // Class implementation
}

// Component naming
class CardComponent { }
class ProgressBarComponent { }
```

#### Private Properties/Methods
```javascript
// ✅ GOOD - Underscore prefix for private
class DataService {
  constructor() {
    this._cache = new Map();
  }

  _validateData(data) {
    // Private method
  }

  getData() {
    // Public method
  }
}

// Or use # for true private fields (ES2022)
class ModernService {
  #privateField = 42;
  
  #privateMethod() {
    return this.#privateField;
  }
}
```

### Code Organization

#### Module Structure
```javascript
// ✅ GOOD - Clear module organization
// userService.js

// 1. Imports (grouped and ordered)
import { validateEmail } from '@/utils/validators';
import { API_ENDPOINTS } from '@/config/constants';
import { HttpClient } from '@/services/http';

// 2. Constants
const USER_ROLES = ['student', 'teacher', 'parent'];

// 3. Main class/function
export class UserService {
  constructor(httpClient) {
    this.http = httpClient;
  }

  async getUser(id) {
    // Implementation
  }
}

// 4. Helper functions
function formatUserData(rawData) {
  // Helper implementation
}

// 5. Default export (if needed)
export default new UserService(HttpClient);
```

#### Import Organization
```javascript
// ✅ GOOD - Organized imports
// 1. External dependencies
import { create } from 'zustand';
import DOMPurify from 'dompurify';

// 2. Internal absolute imports
import { UserService } from '@/services/user';
import { Button, Card } from '@/components/ui';

// 3. Internal relative imports
import { formatDate } from './utils';
import styles from './styles.css';

// 4. Type imports (if using TypeScript)
import type { User, Activity } from '@/types';
```

### Functions and Methods

#### Function Guidelines
```javascript
// ✅ GOOD - Single responsibility
function calculateDiscount(price, discountPercent) {
  return price * (discountPercent / 100);
}

function applyDiscount(price, discountPercent) {
  const discount = calculateDiscount(price, discountPercent);
  return price - discount;
}

// ❌ BAD - Multiple responsibilities
function processOrder(order) {
  // Validates order
  // Calculates discount
  // Updates inventory
  // Sends email
  // Returns result
}
```

#### Default Parameters
```javascript
// ✅ GOOD
function createUser(name, role = 'student', active = true) {
  return { name, role, active };
}

// ✅ GOOD - Options object for many parameters
function createActivity({
  title,
  subject,
  difficulty = 'medium',
  duration = 30,
  maxAttempts = 3
} = {}) {
  return { title, subject, difficulty, duration, maxAttempts };
}
```

#### Async/Await
```javascript
// ✅ GOOD - Clean async code
async function fetchUserData(userId) {
  try {
    const user = await api.getUser(userId);
    const activities = await api.getUserActivities(userId);
    
    return {
      user,
      activities
    };
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw new Error('Unable to load user data');
  }
}

// ✅ GOOD - Parallel requests
async function fetchDashboardData(userId) {
  const [user, activities, achievements] = await Promise.all([
    api.getUser(userId),
    api.getUserActivities(userId),
    api.getUserAchievements(userId)
  ]);
  
  return { user, activities, achievements };
}
```

### Error Handling

#### Try-Catch Patterns
```javascript
// ✅ GOOD - Specific error handling
class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

async function fetchData(endpoint) {
  try {
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new APIError(
        `API request failed: ${response.statusText}`,
        response.status
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      // Handle API errors
      console.error(`API Error ${error.status}: ${error.message}`);
    } else if (error instanceof TypeError) {
      // Handle network errors
      console.error('Network error:', error);
    } else {
      // Handle unexpected errors
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

#### Error Boundaries
```javascript
// ✅ GOOD - Component error boundaries
class ErrorBoundary {
  constructor(container, fallback) {
    this.container = container;
    this.fallback = fallback;
  }

  try(renderFn) {
    try {
      const content = renderFn();
      this.container.innerHTML = '';
      this.container.appendChild(content);
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    console.error('Component error:', error);
    this.container.innerHTML = this.fallback(error);
  }
}
```

---

## CSS Standards

### Naming Conventions

#### BEM Methodology
```css
/* ✅ GOOD - BEM naming */
/* Block */
.card { }

/* Element */
.card__header { }
.card__body { }
.card__footer { }

/* Modifier */
.card--large { }
.card--highlighted { }
.card__header--centered { }

/* ❌ BAD - Inconsistent naming */
.card { }
.cardHeader { }
.card-large { }
.card_highlighted { }
```

#### CSS Custom Properties
```css
/* ✅ GOOD - Semantic naming */
:root {
  /* Colors */
  --color-primary: #007bff;
  --color-primary-dark: #0056b3;
  --color-secondary: #6c757d;
  
  /* Text */
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Organization

#### File Structure
```css
/* ✅ GOOD - Logical organization */

/* 1. CSS Custom Properties */
:root { }

/* 2. Base/Reset Styles */
* { box-sizing: border-box; }
body { margin: 0; }

/* 3. Typography */
h1, h2, h3 { }
p { }

/* 4. Layout Components */
.container { }
.grid { }

/* 5. UI Components */
.button { }
.card { }

/* 6. Utilities */
.text-center { }
.mt-1 { }

/* 7. Media Queries (mobile-first) */
@media (min-width: 768px) { }
@media (min-width: 1024px) { }
```

#### Component Styles
```css
/* ✅ GOOD - Component encapsulation */
.button {
  /* Base styles */
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
  
  /* Variants */
  &--primary {
    background-color: var(--color-primary);
    color: white;
  }
  
  &--large {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-lg);
  }
  
  /* States */
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

### Responsive Design

#### Mobile-First Approach
```css
/* ✅ GOOD - Mobile-first */
.card {
  /* Mobile styles (default) */
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

/* Tablet and up */
@media (min-width: 768px) {
  .card {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .card {
    padding: var(--spacing-xl);
  }
}
```

#### Breakpoint Variables
```css
/* ✅ GOOD - Consistent breakpoints */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}

/* Usage with CSS custom media (future) */
@custom-media --tablet (min-width: 768px);
@custom-media --desktop (min-width: 1024px);
```

---

## HTML Standards

### Semantic HTML

```html
<!-- ✅ GOOD - Semantic elements -->
<header class="site-header">
  <nav class="main-nav">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/activities">Activities</a></li>
    </ul>
  </nav>
</header>

<main class="content">
  <article class="activity">
    <header>
      <h1>Math Challenge</h1>
    </header>
    <section class="activity-content">
      <!-- Content -->
    </section>
  </article>
</main>

<footer class="site-footer">
  <p>&copy; 2024 Learnimals</p>
</footer>

<!-- ❌ BAD - Div soup -->
<div class="header">
  <div class="nav">
    <div class="nav-item">Home</div>
  </div>
</div>
```

### Accessibility

```html
<!-- ✅ GOOD - Accessible markup -->
<button 
  class="button button--primary"
  aria-label="Start math activity"
  aria-pressed="false"
>
  <svg class="icon" aria-hidden="true">
    <use href="#icon-play"></use>
  </svg>
  <span>Start Activity</span>
</button>

<form>
  <label for="username">Username</label>
  <input 
    type="text" 
    id="username" 
    name="username"
    required
    aria-describedby="username-error"
  >
  <span id="username-error" class="error" role="alert">
    Username is required
  </span>
</form>
```

### Data Attributes

```html
<!-- ✅ GOOD - Data attributes for JavaScript -->
<div 
  class="activity-card"
  data-activity-id="math-101"
  data-subject="math"
  data-difficulty="beginner"
>
  <!-- Content -->
</div>

<button
  class="theme-toggle"
  data-action="toggle-theme"
  data-current-theme="light"
>
  Toggle Theme
</button>
```

---

## Git Workflow

### Branch Naming

```bash
# ✅ GOOD - Clear branch names
feature/add-user-progress-tracking
bugfix/fix-modal-close-button
hotfix/security-patch-xss
refactor/update-activity-api
docs/update-readme

# ❌ BAD - Unclear names
feature/stuff
fix
new-feature
johns-branch
```

### Commit Messages

```bash
# ✅ GOOD - Conventional commits
feat: add user progress tracking system
fix: resolve modal close button not working on mobile
docs: update API documentation for activities
refactor: simplify theme switching logic
test: add unit tests for progress service
chore: update dependencies to latest versions

# With scope
feat(auth): implement two-factor authentication
fix(ui): correct button alignment in Safari
docs(api): add examples for activity endpoints

# With breaking change
feat!: redesign activity API response format

BREAKING CHANGE: Activity API now returns nested structure
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No console errors

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
```

---

## Code Comments

### JSDoc Standards

```javascript
/**
 * Calculates the progress percentage for a user's activities
 * @param {number} completed - Number of completed activities
 * @param {number} total - Total number of activities
 * @returns {number} Progress percentage (0-100)
 * @throws {Error} If total is 0 or negative
 * @example
 * const progress = calculateProgress(7, 10); // Returns 70
 */
function calculateProgress(completed, total) {
  if (total <= 0) {
    throw new Error('Total must be greater than 0');
  }
  return Math.round((completed / total) * 100);
}

/**
 * Service for managing user progress and achievements
 * @class
 */
class ProgressService {
  /**
   * Creates a new ProgressService instance
   * @param {Database} db - Database connection
   * @param {EventBus} eventBus - Event bus for notifications
   */
  constructor(db, eventBus) {
    this.db = db;
    this.eventBus = eventBus;
  }

  /**
   * Records activity completion
   * @param {string} userId - User ID
   * @param {string} activityId - Activity ID
   * @param {Object} data - Completion data
   * @param {number} data.score - Activity score
   * @param {number} data.duration - Time spent in seconds
   * @returns {Promise<ProgressRecord>} Created progress record
   */
  async recordCompletion(userId, activityId, data) {
    // Implementation
  }
}
```

### Inline Comments

```javascript
// ✅ GOOD - Explains why, not what
function processActivityData(data) {
  // Sort by timestamp to ensure chronological order
  // Required for progress calculation accuracy
  const sorted = data.sort((a, b) => a.timestamp - b.timestamp);
  
  // Use Map for O(1) lookups instead of repeated array searches
  const activityMap = new Map();
  
  return sorted.reduce((acc, item) => {
    // Skip duplicate entries (data sync issue workaround)
    if (activityMap.has(item.id)) {
      return acc;
    }
    
    activityMap.set(item.id, true);
    acc.push(processItem(item));
    return acc;
  }, []);
}

// ❌ BAD - States the obvious
function addNumbers(a, b) {
  // Add a and b
  const sum = a + b;
  // Return the sum
  return sum;
}
```

---

## File Organization

### Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI elements
│   │   ├── Button/
│   │   │   ├── Button.js
│   │   │   ├── Button.css
│   │   │   └── Button.test.js
│   │   └── Card/
│   ├── layout/          # Layout components
│   └── forms/           # Form components
├── features/            # Feature-based modules
│   ├── activities/
│   ├── progress/
│   └── user/
├── services/            # Business logic services
├── utils/               # Utility functions
├── styles/              # Global styles
├── config/              # Configuration files
└── test/                # Test utilities
```

### File Naming

```javascript
// ✅ GOOD - Consistent naming
UserProfile.js         // React/Class components
userService.js         // Services
formatDate.js          // Utilities
Button.test.js         // Tests
constants.js           // Constants
types.js              // Type definitions

// Component folders
Button/
├── Button.js          // Component
├── Button.css         // Styles
├── Button.test.js     // Tests
└── index.js          // Export
```

---

## Performance Guidelines

### Code Optimization

```javascript
// ✅ GOOD - Efficient patterns
// Memoization for expensive operations
const memoizedCalculation = (() => {
  const cache = new Map();
  
  return (input) => {
    if (cache.has(input)) {
      return cache.get(input);
    }
    
    const result = expensiveCalculation(input);
    cache.set(input, result);
    return result;
  };
})();

// Debouncing for frequent events
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Event delegation
document.addEventListener('click', (event) => {
  if (event.target.matches('.button')) {
    handleButtonClick(event.target);
  }
});
```

### DOM Manipulation

```javascript
// ✅ GOOD - Batch DOM updates
function updateElements(elements, data) {
  // Create document fragment
  const fragment = document.createDocumentFragment();
  
  data.forEach(item => {
    const element = createElement(item);
    fragment.appendChild(element);
  });
  
  // Single DOM update
  container.appendChild(fragment);
}

// ❌ BAD - Multiple DOM updates
data.forEach(item => {
  const element = createElement(item);
  container.appendChild(element); // Triggers reflow each time
});
```

---

## Code Review Checklist

### Before Submitting PR

```markdown
## Code Quality
- [ ] Code follows project style guide
- [ ] No commented-out code
- [ ] No console.logs in production code
- [ ] Functions are single-purpose
- [ ] Variable names are descriptive

## Testing
- [ ] All tests pass
- [ ] New features have tests
- [ ] Edge cases are tested
- [ ] Error scenarios are handled

## Documentation
- [ ] JSDoc comments for public APIs
- [ ] Complex logic is commented
- [ ] README updated if needed
- [ ] CHANGELOG updated

## Security
- [ ] No hardcoded secrets
- [ ] Input validation in place
- [ ] XSS prevention measures
- [ ] Dependencies are secure

## Performance
- [ ] No unnecessary re-renders
- [ ] Large lists are paginated
- [ ] Images are optimized
- [ ] Code is minified for production
```

---

## Enforcement Tools

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'arrow-spacing': 'error',
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never']
  }
};
```

### Prettier Configuration

```javascript
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

---

*These standards should be reviewed and updated regularly as the team grows and new best practices emerge.*