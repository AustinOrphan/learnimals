/**
 * Accessible Component Extension
 * Extends BaseComponent with comprehensive accessibility features
 */

import BaseComponent from './BaseComponent.js';
import { accessibilityService } from '../services/accessibility/AccessibilityService.js';

export class AccessibleComponent extends BaseComponent {
  constructor(options = {}) {
    super({
      // Accessibility-specific options
      ariaLabel: options.ariaLabel || null,
      ariaLabelledBy: options.ariaLabelledBy || null,
      ariaDescribedBy: options.ariaDescribedBy || null,
      role: options.role || null,
      ariaHidden: options.ariaHidden || null,
      focusable: options.focusable !== false, // Default to focusable
      keyboardNavigation: options.keyboardNavigation !== false,
      announceChanges: options.announceChanges !== false,
      content: options.content || 'Accessible Component',
      tagName: options.tagName || 'div',
      ...options
    });

    this.focusTrap = null;
    this.keyboardHandler = null;
    this.announcements = [];
    
    // Bind accessibility methods
    this.handleAccessibleKeydown = this.handleAccessibleKeydown.bind(this);
    this.handleFocusIn = this.handleFocusIn.bind(this);
    this.handleFocusOut = this.handleFocusOut.bind(this);
  }

  /**
   * Default implementation of generateHTML for testing and base functionality
   */
  generateHTML() {
    const attributes = this.buildAttributes();
    const content = this.options.content || 'Accessible Component';
    const tagName = this.options.tagName || 'div';
    
    return `<${tagName}${attributes}>${content}</${tagName}>`;
  }

  /**
   * Build HTML attributes string
   */
  buildAttributes() {
    const attrs = [];
    
    // Add ID
    if (this.options.id) {
      attrs.push(`id="${this.options.id}"`);
    }
    
    // Add CSS classes
    const classes = ['accessible-component', ...(this.options.cssClasses || [])];
    attrs.push(`class="${classes.join(' ')}"`);
    
    // Add ARIA attributes
    if (this.options.ariaLabel) {
      attrs.push(`aria-label="${this.options.ariaLabel}"`);
    }
    if (this.options.ariaLabelledBy) {
      attrs.push(`aria-labelledby="${this.options.ariaLabelledBy}"`);
    }
    if (this.options.ariaDescribedBy) {
      attrs.push(`aria-describedby="${this.options.ariaDescribedBy}"`);
    }
    if (this.options.role) {
      attrs.push(`role="${this.options.role}"`);
    }
    if (this.options.ariaHidden !== null) {
      attrs.push(`aria-hidden="${this.options.ariaHidden}"`);
    }
    
    // Add focusable attribute
    if (this.options.focusable && this.options.tagName !== 'button' && this.options.tagName !== 'a') {
      attrs.push('tabindex="0"');
    }
    
    // Add custom attributes
    Object.entries(this.options.attributes || {}).forEach(([key, value]) => {
      attrs.push(`${key}="${value}"`);
    });
    
    return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  }

  /**
   * Enhanced render method with accessibility setup
   */
  render(container) {
    const result = super.render(container);
    
    if (this.element) {
      this.setupAccessibility();
    }
    
    return result;
  }

  /**
   * Set up accessibility features for the component
   */
  setupAccessibility() {
    this.applyARIAAttributes();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupSemanticStructure();
    this.announceComponentReady();
  }

  /**
   * Apply ARIA attributes based on options
   */
  applyARIAAttributes() {
    const { ariaLabel, ariaLabelledBy, ariaDescribedBy, role, ariaHidden } = this.options;

    if (ariaLabel) {
      this.element.setAttribute('aria-label', ariaLabel);
    }

    if (ariaLabelledBy) {
      this.element.setAttribute('aria-labelledby', ariaLabelledBy);
    }

    if (ariaDescribedBy) {
      this.element.setAttribute('aria-describedby', ariaDescribedBy);
    }

    if (role) {
      this.element.setAttribute('role', role);
    }

    if (ariaHidden !== null) {
      this.element.setAttribute('aria-hidden', ariaHidden.toString());
    }

    // Set tabindex for focusable elements
    if (this.options.focusable && !this.element.hasAttribute('tabindex')) {
      const interactive = this.isInteractiveElement();
      if (!interactive) {
        this.element.setAttribute('tabindex', '0');
      }
    } else if (!this.options.focusable) {
      this.element.setAttribute('tabindex', '-1');
    }
  }

  /**
   * Set up keyboard navigation
   */
  setupKeyboardNavigation() {
    if (!this.options.keyboardNavigation) return;

    this.element.addEventListener('keydown', this.handleAccessibleKeydown);
    this.element.addEventListener('focusin', this.handleFocusIn);
    this.element.addEventListener('focusout', this.handleFocusOut);

    // Set up roving tabindex for component groups
    this.setupRovingTabindex();
  }

  /**
   * Handle keyboard events for accessibility
   */
  handleAccessibleKeydown(e) {
    const handled = this.handleComponentSpecificKeys(e);
    
    if (!handled) {
      this.handleGenericKeys(e);
    }
  }

  /**
   * Handle component-specific keyboard interactions
   * Override in subclasses for custom behavior
   */
  handleComponentSpecificKeys(_e) {
    // To be overridden by subclasses
    return false;
  }

  /**
   * Handle generic keyboard interactions
   */
  handleGenericKeys(e) {
    switch (e.key) {
    case 'Enter':
    case ' ': // Space
      if (this.isActivatable()) {
        e.preventDefault();
        this.activate();
      }
      break;
    
    case 'Escape':
      if (this.isCloseable()) {
        e.preventDefault();
        this.close();
      }
      break;

    case 'Tab':
      this.handleTabNavigation(e);
      break;

    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
      if (this.hasDirectionalNavigation()) {
        e.preventDefault();
        this.handleArrowNavigation(e.key);
      }
      break;

    case 'Home':
      if (this.hasListNavigation()) {
        e.preventDefault();
        this.navigateToFirst();
      }
      break;

    case 'End':
      if (this.hasListNavigation()) {
        e.preventDefault();
        this.navigateToLast();
      }
      break;
    }
  }

  /**
   * Handle tab navigation within component
   */
  handleTabNavigation(_e) {
    if (this.focusTrap && this.focusTrap.isActive) {
      // Let focus trap handle tab navigation
      return;
    }

    // Default tab behavior - can be overridden
  }

  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation(key) {
    const items = this.getNavigableItems();
    if (items.length === 0) return;

    const currentIndex = items.findIndex(item => 
      item === document.activeElement || item.contains(document.activeElement)
    );

    let nextIndex;
    
    switch (key) {
    case 'ArrowUp':
    case 'ArrowLeft':
      nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      break;
    case 'ArrowDown':
    case 'ArrowRight':
      nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      break;
    }

    if (nextIndex !== undefined) {
      this.focusItem(items[nextIndex]);
    }
  }

  /**
   * Set up roving tabindex for component groups
   */
  setupRovingTabindex() {
    const items = this.getNavigableItems();
    if (items.length <= 1) return;

    // Initialize roving tabindex
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
      
      item.addEventListener('focus', () => {
        this.updateRovingTabindex(items, index);
      });
    });

    this.rovingTabindexItems = items;
  }

  /**
   * Update roving tabindex state
   */
  updateRovingTabindex(items, activeIndex) {
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
    });
  }

  /**
   * Set up focus management
   */
  setupFocusManagement() {
    // Create focus trap if component is modal
    if (this.isModal()) {
      this.focusTrap = accessibilityService.createFocusTrap(this.element);
    }

    // Handle focus restoration
    this.previousFocus = null;
  }

  /**
   * Handle focus entering component
   */
  handleFocusIn(e) {
    if (!this.previousFocus) {
      this.previousFocus = e.relatedTarget;
    }

    // Add keyboard navigation class
    if (accessibilityService.getPreferences().keyboardOnly) {
      this.element.classList.add('keyboard-navigation');
    }

    this.onFocusIn(e);
  }

  /**
   * Handle focus leaving component
   */
  handleFocusOut(e) {
    // Remove keyboard navigation class if focus completely leaves component
    setTimeout(() => {
      if (!this.element.contains(document.activeElement)) {
        this.element.classList.remove('keyboard-navigation');
      }
    }, 0);

    this.onFocusOut(e);
  }

  /**
   * Set up semantic structure
   */
  setupSemanticStructure() {
    // Ensure proper landmark roles
    this.ensureLandmarkRoles();
    
    // Set up heading hierarchy
    this.setupHeadingHierarchy();
    
    // Ensure proper list semantics
    this.setupListSemantics();
  }

  /**
   * Ensure proper landmark roles
   */
  ensureLandmarkRoles() {
    const componentType = this.getComponentType();
    
    const landmarkMap = {
      'navigation': 'navigation',
      'search': 'search',
      'main': 'main',
      'sidebar': 'complementary',
      'header': 'banner',
      'footer': 'contentinfo'
    };

    if (landmarkMap[componentType] && !this.element.getAttribute('role')) {
      this.element.setAttribute('role', landmarkMap[componentType]);
    }
  }

  /**
   * Set up heading hierarchy
   */
  setupHeadingHierarchy() {
    const headings = this.element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    // Ensure headings have proper structure
    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (previousLevel > 0 && level > previousLevel + 1) {
        // Fix skipped heading levels
        const correctLevel = Math.min(level, previousLevel + 1);
        const newHeading = document.createElement(`h${correctLevel}`);
        newHeading.innerHTML = heading.innerHTML;
        newHeading.className = heading.className;
        heading.parentNode.replaceChild(newHeading, heading);
      }
      
      previousLevel = level;
    });
  }

  /**
   * Set up list semantics
   */
  setupListSemantics() {
    // Find lists that might need role="list"
    const lists = this.element.querySelectorAll('ul, ol');
    
    lists.forEach(list => {
      // If list has no list-style, add role="list" to ensure screen reader recognition
      const style = window.getComputedStyle(list);
      if (style.listStyle === 'none' || style.listStyleType === 'none') {
        list.setAttribute('role', 'list');
        
        const items = list.querySelectorAll('li');
        items.forEach(item => {
          if (!item.getAttribute('role')) {
            item.setAttribute('role', 'listitem');
          }
        });
      }
    });
  }

  /**
   * Announce component ready state
   */
  announceComponentReady() {
    if (!this.options.announceChanges) return;

    const componentName = this.getComponentName();
    if (componentName) {
      this.announce(`${componentName} is ready`, 'polite');
    }
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite', timeout = 1000) {
    if (!this.options.announceChanges) return;

    accessibilityService.announce(message, priority, timeout);
    this.announcements.push({ message, priority, timestamp: Date.now() });
  }

  /**
   * Focus management methods
   */
  focus() {
    if (this.element) {
      this.element.focus();
    }
    return this;
  }

  blur() {
    if (this.element) {
      this.element.blur();
    }
    return this;
  }

  focusFirst() {
    const items = this.getNavigableItems();
    if (items.length > 0) {
      this.focusItem(items[0]);
    }
    return this;
  }

  focusLast() {
    const items = this.getNavigableItems();
    if (items.length > 0) {
      this.focusItem(items[items.length - 1]);
    }
    return this;
  }

  focusItem(item) {
    if (item && item.focus) {
      item.focus();
      
      // Update roving tabindex if applicable
      if (this.rovingTabindexItems) {
        const index = this.rovingTabindexItems.indexOf(item);
        if (index !== -1) {
          this.updateRovingTabindex(this.rovingTabindexItems, index);
        }
      }
    }
  }

  /**
   * Focus trap management
   */
  trapFocus() {
    if (this.focusTrap) {
      this.focusTrap.activate();
    }
    return this;
  }

  releaseFocus() {
    if (this.focusTrap) {
      this.focusTrap.deactivate();
    }
    return this;
  }

  restoreFocus() {
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
    }
    return this;
  }

  /**
   * State management with announcements
   */
  setState(state, announce = true) {
    const oldState = this.getState();
    
    // Update state
    this.updateState(state);
    
    if (announce && this.options.announceChanges) {
      this.announceStateChange(oldState, state);
    }
    
    return this;
  }

  updateState(state) {
    // To be implemented by subclasses
    Object.assign(this.options, state);
  }

  getState() {
    // To be implemented by subclasses
    return { ...this.options };
  }

  announceStateChange(oldState, newState) {
    // Generate appropriate announcement based on state change
    const message = this.generateStateChangeMessage(oldState, newState);
    if (message) {
      this.announce(message, 'polite');
    }
  }

  generateStateChangeMessage(_oldState, _newState) {
    // To be overridden by subclasses
    return null;
  }

  /**
   * Utility methods for determining component behavior
   */
  isInteractiveElement() {
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
    const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'option'];
    
    return interactiveTags.includes(this.element.tagName.toLowerCase()) ||
           interactiveRoles.includes(this.element.getAttribute('role'));
  }

  isActivatable() {
    return this.element.hasAttribute('role') && 
           ['button', 'link', 'menuitem', 'tab'].includes(this.element.getAttribute('role'));
  }

  isCloseable() {
    return this.isModal() || this.element.classList.contains('closeable');
  }

  isModal() {
    return this.element.getAttribute('role') === 'dialog' ||
           this.element.classList.contains('modal');
  }

  hasDirectionalNavigation() {
    const directionalRoles = ['tablist', 'menubar', 'toolbar', 'grid'];
    return directionalRoles.includes(this.element.getAttribute('role')) ||
           this.element.classList.contains('directional-nav');
  }

  hasListNavigation() {
    const listRoles = ['listbox', 'menu', 'tablist', 'grid'];
    return listRoles.includes(this.element.getAttribute('role')) ||
           this.element.tagName.toLowerCase() === 'ul' ||
           this.element.tagName.toLowerCase() === 'ol';
  }

  getNavigableItems() {
    const selectors = [
      '[tabindex]:not([tabindex="-1"])',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="link"]:not([aria-disabled="true"])',
      '[role="menuitem"]:not([aria-disabled="true"])',
      '[role="tab"]:not([aria-disabled="true"])'
    ].join(', ');

    return Array.from(this.element.querySelectorAll(selectors));
  }

  getComponentType() {
    // Determine component type from class name or role
    const className = this.constructor.name.toLowerCase();
    const role = this.element?.getAttribute('role');
    
    return role || className;
  }

  getComponentName() {
    const ariaLabel = this.element?.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const ariaLabelledBy = this.element?.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent.trim();
    }

    const title = this.element?.getAttribute('title');
    if (title) return title;

    return this.constructor.name;
  }

  /**
   * Component lifecycle hooks for accessibility
   */
  onFocusIn(_e) {
    // Override in subclasses
  }

  onFocusOut(_e) {
    // Override in subclasses
  }

  activate() {
    // Override in subclasses
    this.emit('activate');
  }

  close() {
    // Override in subclasses
    this.emit('close');
  }

  navigateToFirst() {
    this.focusFirst();
  }

  navigateToLast() {
    this.focusLast();
  }

  /**
   * Enhanced destroy method with accessibility cleanup
   */
  destroy() {
    // Release focus trap
    if (this.focusTrap) {
      this.focusTrap.deactivate();
    }

    // Remove accessibility event listeners
    if (this.element) {
      this.element.removeEventListener('keydown', this.handleAccessibleKeydown);
      this.element.removeEventListener('focusin', this.handleFocusIn);
      this.element.removeEventListener('focusout', this.handleFocusOut);
    }

    // Restore focus if needed
    this.restoreFocus();

    // Call parent destroy
    super.destroy();
  }

  /**
   * Accessibility testing helper
   */
  testAccessibility() {
    // eslint-disable-next-line no-undef
    const { accessibilityTester } = require('../utils/accessibilityTester.js');
    return accessibilityTester.runAudit(this.element);
  }
}

export default AccessibleComponent;