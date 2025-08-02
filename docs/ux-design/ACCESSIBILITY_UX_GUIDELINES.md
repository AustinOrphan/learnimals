# Accessibility & UX Guidelines

## Overview

This guide ensures Learnimals is accessible to all users, including those with disabilities, and provides an excellent user experience across all abilities and devices. We follow WCAG 2.1 Level AA standards as our baseline.

---

## Accessibility Principles

### 1. Perceivable
Information and UI components must be presentable in ways users can perceive.

### 2. Operable
UI components and navigation must be operable by all users.

### 3. Understandable
Information and UI operation must be understandable.

### 4. Robust
Content must be robust enough to work with various assistive technologies.

---

## Visual Design

### Color & Contrast

#### Color Contrast Requirements
```css
/* Minimum contrast ratios */
:root {
  /* Text contrast ratios:
   * Normal text: 4.5:1
   * Large text (18pt+): 3:1
   * UI components: 3:1
   */
  
  /* Light theme - AA compliant */
  --text-primary: #212529;      /* 15.3:1 on white */
  --text-secondary: #495057;    /* 8.6:1 on white */
  --text-muted: #6c757d;        /* 4.5:1 on white */
  
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-accent: #e9ecef;
  
  /* Dark theme - AA compliant */
  --dark-text-primary: #f8f9fa;     /* 15.3:1 on dark */
  --dark-text-secondary: #dee2e6;   /* 11.9:1 on dark */
  --dark-text-muted: #adb5bd;       /* 7.0:1 on dark */
  
  --dark-bg-primary: #121212;
  --dark-bg-secondary: #1e1e1e;
  --dark-bg-accent: #2d2d2d;
}
```

#### Color Usage Guidelines
```css
/* Never use color as the only indicator */
.error {
  color: var(--color-error);
  border: 2px solid var(--color-error);
}

.error::before {
  content: "⚠ "; /* Icon indicator */
}

/* Provide multiple visual cues */
.button:disabled {
  opacity: 0.6;              /* Visual dim */
  cursor: not-allowed;       /* Cursor change */
  text-decoration: line-through; /* Additional indicator */
}
```

### Focus Indicators

#### Visible Focus States
```css
/* Custom focus styles */
:focus {
  outline: none; /* Remove default */
}

/* Keyboard navigation focus */
:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: 3px;
}

/* High contrast focus for better visibility */
@media (prefers-contrast: high) {
  :focus-visible {
    outline: 4px solid currentColor;
    outline-offset: 4px;
  }
}

/* Interactive elements focus */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}
```

#### Skip Links
```html
<!-- Skip navigation links -->
<a href="#main-content" class="skip-link">Skip to main content</a>
<a href="#main-nav" class="skip-link">Skip to navigation</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

---

## Keyboard Navigation

### Navigation Patterns

#### Tab Order
```javascript
// Manage tab order programmatically
class TabManager {
  constructor(container) {
    this.container = container;
    this.elements = this.getTabableElements();
    this.currentIndex = 0;
  }

  getTabableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    
    return Array.from(this.container.querySelectorAll(selector));
  }

  handleKeydown(event) {
    switch(event.key) {
      case 'Tab':
        if (event.shiftKey) {
          this.focusPrevious();
        } else {
          this.focusNext();
        }
        event.preventDefault();
        break;
      case 'Home':
        this.focusFirst();
        event.preventDefault();
        break;
      case 'End':
        this.focusLast();
        event.preventDefault();
        break;
    }
  }

  focusNext() {
    this.currentIndex = (this.currentIndex + 1) % this.elements.length;
    this.elements[this.currentIndex].focus();
  }

  focusPrevious() {
    this.currentIndex = (this.currentIndex - 1 + this.elements.length) % this.elements.length;
    this.elements[this.currentIndex].focus();
  }
}
```

#### Arrow Key Navigation
```javascript
// Grid/list navigation
class GridNavigation {
  constructor(grid, columns) {
    this.grid = grid;
    this.columns = columns;
    this.cells = Array.from(grid.querySelectorAll('[role="gridcell"]'));
    this.currentIndex = 0;
    
    this.grid.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  handleKeydown(event) {
    const movements = {
      'ArrowUp': -this.columns,
      'ArrowDown': this.columns,
      'ArrowLeft': -1,
      'ArrowRight': 1
    };

    if (movements[event.key]) {
      event.preventDefault();
      this.move(movements[event.key]);
    }
  }

  move(offset) {
    const newIndex = this.currentIndex + offset;
    
    if (newIndex >= 0 && newIndex < this.cells.length) {
      this.cells[this.currentIndex].setAttribute('tabindex', '-1');
      this.currentIndex = newIndex;
      this.cells[this.currentIndex].setAttribute('tabindex', '0');
      this.cells[this.currentIndex].focus();
    }
  }
}
```

### Focus Management

#### Focus Trapping
```javascript
// Modal focus trap
class FocusTrap {
  constructor(container) {
    this.container = container;
    this.focusableElements = this.getFocusableElements();
    this.firstElement = this.focusableElements[0];
    this.lastElement = this.focusableElements[this.focusableElements.length - 1];
    
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  getFocusableElements() {
    return this.container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
  }

  trap() {
    this.container.addEventListener('keydown', this.handleKeydown);
    this.firstElement.focus();
  }

  release() {
    this.container.removeEventListener('keydown', this.handleKeydown);
  }

  handleKeydown(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === this.firstElement) {
          this.lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === this.lastElement) {
          this.firstElement.focus();
          e.preventDefault();
        }
      }
    }
    
    if (e.key === 'Escape') {
      this.release();
      this.container.dispatchEvent(new Event('close'));
    }
  }
}
```

---

## Screen Reader Support

### ARIA Implementation

#### Semantic HTML First
```html
<!-- ✅ GOOD - Use semantic HTML -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/home">Home</a></li>
    <li><a href="/activities" aria-current="page">Activities</a></li>
  </ul>
</nav>

<main>
  <h1>Welcome to Learnimals</h1>
  <section aria-labelledby="activities-heading">
    <h2 id="activities-heading">Featured Activities</h2>
    <!-- Content -->
  </section>
</main>

<!-- ❌ BAD - Div soup -->
<div class="nav">
  <div class="nav-item">Home</div>
</div>
```

#### ARIA Labels and Descriptions
```html
<!-- Icon buttons -->
<button aria-label="Close dialog" class="close-button">
  <svg aria-hidden="true"><!-- Icon --></svg>
</button>

<!-- Form inputs -->
<label for="email">Email Address</label>
<input 
  type="email" 
  id="email" 
  aria-describedby="email-help email-error"
  aria-invalid="false"
  required
>
<span id="email-help" class="help-text">We'll never share your email</span>
<span id="email-error" class="error-text" role="alert" aria-live="polite"></span>

<!-- Complex widgets -->
<div 
  role="slider"
  aria-label="Volume"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="50"
  tabindex="0"
>
  <div class="slider-track">
    <div class="slider-thumb"></div>
  </div>
</div>
```

#### Live Regions
```javascript
// Announcements for screen readers
class ScreenReaderAnnouncer {
  constructor() {
    this.createAnnouncer();
  }

  createAnnouncer() {
    // Polite announcements (wait for screen reader to finish)
    this.polite = document.createElement('div');
    this.polite.setAttribute('aria-live', 'polite');
    this.polite.setAttribute('aria-atomic', 'true');
    this.polite.className = 'sr-only';
    
    // Assertive announcements (interrupt screen reader)
    this.assertive = document.createElement('div');
    this.assertive.setAttribute('aria-live', 'assertive');
    this.assertive.setAttribute('aria-atomic', 'true');
    this.assertive.className = 'sr-only';
    
    document.body.appendChild(this.polite);
    document.body.appendChild(this.assertive);
  }

  announce(message, priority = 'polite') {
    const announcer = priority === 'assertive' ? this.assertive : this.polite;
    
    // Clear previous announcement
    announcer.textContent = '';
    
    // Announce after a brief delay to ensure it's picked up
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
    
    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
}

// Usage
const announcer = new ScreenReaderAnnouncer();
announcer.announce('Activity completed successfully!');
announcer.announce('Error: Please fix the form errors', 'assertive');
```

### Screen Reader CSS
```css
/* Visually hidden but screen reader accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Show on focus (for skip links) */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Form Accessibility

### Accessible Forms

#### Label Association
```html
<!-- Explicit labels -->
<label for="username">Username</label>
<input type="text" id="username" name="username" required>

<!-- Wrapped labels -->
<label>
  <input type="checkbox" name="remember">
  Remember me
</label>

<!-- Grouped inputs -->
<fieldset>
  <legend>Preferred Contact Method</legend>
  <label>
    <input type="radio" name="contact" value="email" checked>
    Email
  </label>
  <label>
    <input type="radio" name="contact" value="phone">
    Phone
  </label>
</fieldset>
```

#### Error Handling
```javascript
// Accessible form validation
class AccessibleForm {
  constructor(form) {
    this.form = form;
    this.errors = new Map();
    
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  handleSubmit(event) {
    event.preventDefault();
    this.clearErrors();
    
    if (!this.validate()) {
      this.announceErrors();
      this.focusFirstError();
    } else {
      this.submit();
    }
  }

  validate() {
    const inputs = this.form.querySelectorAll('[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!input.value.trim()) {
        this.addError(input, `${this.getLabel(input)} is required`);
        isValid = false;
      }
    });
    
    return isValid;
  }

  addError(input, message) {
    this.errors.set(input, message);
    
    // Update ARIA states
    input.setAttribute('aria-invalid', 'true');
    
    // Create/update error message
    let errorId = input.getAttribute('aria-describedby') || '';
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.id = `${input.id}-error`;
      errorElement.className = 'error-message';
      errorElement.setAttribute('role', 'alert');
      input.parentNode.appendChild(errorElement);
      
      // Update aria-describedby
      const describedBy = input.getAttribute('aria-describedby') || '';
      input.setAttribute('aria-describedby', 
        `${describedBy} ${errorElement.id}`.trim());
    }
    
    errorElement.textContent = message;
  }

  clearErrors() {
    this.errors.forEach((message, input) => {
      input.setAttribute('aria-invalid', 'false');
      const errorId = `${input.id}-error`;
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        errorElement.textContent = '';
      }
    });
    this.errors.clear();
  }

  announceErrors() {
    const count = this.errors.size;
    const message = `There ${count === 1 ? 'is' : 'are'} ${count} error${count === 1 ? '' : 's'} in the form`;
    
    // Use live region for announcement
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'alert');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    setTimeout(() => announcer.remove(), 3000);
  }

  focusFirstError() {
    const firstError = Array.from(this.errors.keys())[0];
    firstError?.focus();
  }
}
```

---

## Touch & Mobile Accessibility

### Touch Target Guidelines

```css
/* Minimum touch target sizes */
.touch-target {
  min-width: 44px;   /* iOS recommendation */
  min-height: 44px;  /* iOS recommendation */
  padding: 12px;     /* Additional padding for comfort */
}

/* Spacing between targets */
.button-group > * + * {
  margin-left: 8px;  /* Minimum 8px between targets */
}

/* Larger targets for primary actions */
.primary-action {
  min-height: 48px;  /* Material Design recommendation */
  font-size: 16px;   /* Prevent zoom on iOS */
}
```

### Gesture Alternatives

```javascript
// Provide alternatives to complex gestures
class AccessibleGestures {
  constructor(element) {
    this.element = element;
    this.setupGestures();
    this.setupKeyboardAlternatives();
  }

  setupGestures() {
    // Swipe gesture
    let touchStartX = 0;
    
    this.element.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    });
    
    this.element.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          this.handleSwipeLeft();
        } else {
          this.handleSwipeRight();
        }
      }
    });
  }

  setupKeyboardAlternatives() {
    // Keyboard alternatives for gestures
    this.element.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          this.handleSwipeRight(); // Opposite for intuitive navigation
          break;
        case 'ArrowRight':
          this.handleSwipeLeft();
          break;
      }
    });
  }

  handleSwipeLeft() {
    // Also provide button alternative
    this.element.dispatchEvent(new Event('next'));
  }

  handleSwipeRight() {
    // Also provide button alternative
    this.element.dispatchEvent(new Event('previous'));
  }
}
```

---

## Cognitive Accessibility

### Clear Language

```javascript
// Error messages that are helpful
const ERROR_MESSAGES = {
  required: (fieldName) => `Please enter your ${fieldName}`,
  email: 'Please enter a valid email address (example: name@email.com)',
  password: 'Password must be at least 8 characters with a mix of letters and numbers',
  date: 'Please enter a date in MM/DD/YYYY format'
};

// Progress indicators
class ClearProgress {
  constructor(steps) {
    this.steps = steps;
    this.currentStep = 0;
  }

  render() {
    return `
      <div class="progress-indicator" role="group" aria-label="Progress">
        <p class="progress-text">
          Step ${this.currentStep + 1} of ${this.steps.length}: 
          ${this.steps[this.currentStep].name}
        </p>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            style="width: ${((this.currentStep + 1) / this.steps.length) * 100}%"
            role="progressbar"
            aria-valuenow="${this.currentStep + 1}"
            aria-valuemin="1"
            aria-valuemax="${this.steps.length}"
          ></div>
        </div>
        <ol class="progress-steps">
          ${this.steps.map((step, index) => `
            <li class="${index <= this.currentStep ? 'completed' : ''} 
                       ${index === this.currentStep ? 'current' : ''}">
              ${step.name}
            </li>
          `).join('')}
        </ol>
      </div>
    `;
  }
}
```

### Consistent Navigation

```javascript
// Predictable navigation patterns
class ConsistentNav {
  constructor() {
    this.navItems = [
      { name: 'Home', path: '/', icon: 'home' },
      { name: 'Activities', path: '/activities', icon: 'activities' },
      { name: 'Progress', path: '/progress', icon: 'progress' },
      { name: 'Settings', path: '/settings', icon: 'settings' }
    ];
  }

  render(currentPath) {
    return `
      <nav class="main-nav" aria-label="Main navigation">
        <ul>
          ${this.navItems.map(item => `
            <li>
              <a 
                href="${item.path}"
                ${currentPath === item.path ? 'aria-current="page"' : ''}
                class="nav-link ${currentPath === item.path ? 'active' : ''}"
              >
                <svg class="nav-icon" aria-hidden="true">
                  <use href="#icon-${item.icon}"></use>
                </svg>
                <span>${item.name}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </nav>
    `;
  }
}
```

---

## Motion & Animation

### Respecting Preferences

```css
/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Keep essential animations but make them instant */
  .modal {
    transition: opacity 0.01ms;
  }
}

/* Safe animations */
.safe-animation {
  animation: fadeIn 0.3s ease-out;
}

@media (prefers-reduced-motion: no-preference) {
  .decorative-animation {
    animation: float 3s ease-in-out infinite;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Pause Controls

```javascript
// Provide animation controls
class AnimationController {
  constructor() {
    this.animationsPaused = false;
    this.animations = new Set();
    
    // Check user preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      this.pauseAll();
    }
    
    // Create control button
    this.createControl();
  }

  createControl() {
    const button = document.createElement('button');
    button.className = 'animation-control';
    button.setAttribute('aria-label', 'Pause animations');
    button.setAttribute('aria-pressed', 'false');
    button.textContent = '⏸️ Pause animations';
    
    button.addEventListener('click', () => {
      if (this.animationsPaused) {
        this.playAll();
        button.setAttribute('aria-pressed', 'false');
        button.textContent = '⏸️ Pause animations';
      } else {
        this.pauseAll();
        button.setAttribute('aria-pressed', 'true');
        button.textContent = '▶️ Play animations';
      }
    });
    
    document.body.appendChild(button);
  }

  register(animation) {
    this.animations.add(animation);
    if (this.animationsPaused) {
      animation.pause();
    }
  }

  pauseAll() {
    this.animationsPaused = true;
    this.animations.forEach(animation => animation.pause());
    document.body.classList.add('animations-paused');
  }

  playAll() {
    this.animationsPaused = false;
    this.animations.forEach(animation => animation.play());
    document.body.classList.remove('animations-paused');
  }
}
```

---

## Testing Accessibility

### Manual Testing Checklist

```markdown
## Keyboard Testing
- [ ] Can navigate using only keyboard
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Can activate all interactive elements
- [ ] Can escape from traps (modals, menus)
- [ ] Skip links work correctly

## Screen Reader Testing
- [ ] All content is announced
- [ ] ARIA labels are meaningful
- [ ] Form errors are announced
- [ ] Dynamic changes are announced
- [ ] Images have appropriate alt text
- [ ] Heading structure is logical

## Visual Testing
- [ ] Text has sufficient contrast
- [ ] Focus indicators are visible
- [ ] Information isn't conveyed by color alone
- [ ] Text can be resized to 200%
- [ ] Layout doesn't break when zoomed

## Mobile Testing
- [ ] Touch targets are large enough
- [ ] Gestures have alternatives
- [ ] Pinch-to-zoom works
- [ ] Screen rotation works
- [ ] Forms don't zoom on focus (iOS)
```

### Automated Testing

```javascript
// Accessibility testing utilities
class A11yTester {
  static async runAxe() {
    if (!window.axe) {
      console.error('axe-core not loaded');
      return;
    }
    
    try {
      const results = await axe.run();
      
      if (results.violations.length > 0) {
        console.group('Accessibility Violations');
        results.violations.forEach(violation => {
          console.error(`${violation.impact}: ${violation.description}`);
          violation.nodes.forEach(node => {
            console.log('Element:', node.target);
            console.log('Fix:', node.failureSummary);
          });
        });
        console.groupEnd();
      } else {
        console.log('No accessibility violations found');
      }
      
      return results;
    } catch (error) {
      console.error('Error running axe:', error);
    }
  }

  static checkContrast(foreground, background) {
    // Calculate contrast ratio
    const ratio = this.getContrastRatio(foreground, background);
    
    return {
      ratio: ratio.toFixed(2),
      largeTextAAA: ratio >= 4.5,
      largeTextAA: ratio >= 3,
      normalTextAAA: ratio >= 7,
      normalTextAA: ratio >= 4.5
    };
  }

  static getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }
}
```

---

## Accessibility Resources

### Tools
- **Screen Readers**: NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS), TalkBack (Android)
- **Browser Extensions**: axe DevTools, WAVE, Lighthouse
- **Color Tools**: Contrast Checker, Stark, Color Oracle
- **Testing Tools**: Pa11y, axe-core, jest-axe

### Guidelines & Standards
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)

### Learning Resources
- [WebAIM](https://webaim.org/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)
- [Accessibility Developer Guide](https://www.accessibility-developer-guide.com/)

---

## Accessibility Statement Template

```markdown
# Learnimals Accessibility Statement

## Our Commitment
Learnimals is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards.

## Conformance Status
Learnimals aims to conform to WCAG 2.1 Level AA standards.

## Accessibility Features
- Keyboard navigation throughout the site
- Screen reader compatibility
- High contrast mode support
- Resizable text up to 200%
- Alternative text for images
- Captions for videos
- Clear heading structure
- Form labels and error messages

## Known Issues
- [List any known accessibility issues]

## Contact
If you encounter accessibility barriers, please contact:
- Email: accessibility@learnimals.com
- Phone: [Phone number]

Last updated: [Date]
```

---

*Accessibility is not a feature, it's a fundamental aspect of good design. Regular testing and user feedback are essential for maintaining an accessible experience.*