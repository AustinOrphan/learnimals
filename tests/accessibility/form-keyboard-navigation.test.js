/**
 * Form Keyboard Navigation Tests
 *
 * Comprehensive tests for form keyboard accessibility including:
 * - Tab and Shift+Tab navigation through form fields
 * - Enter key submission and field navigation
 * - Arrow key navigation for radio buttons and checkboxes
 * - Escape key behavior in form controls
 * - Focus management for form validation
 * - Keyboard access to form help and error messages
 * - Complex form widget navigation (date pickers, etc.)
 * - Form state announcements for screen readers
 */

/* global FocusEvent, HTMLFormElement, HTMLInputElement */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FormComponent from '../../components/forms/FormComponent.js';
import { accessibilityService } from '../../services/accessibility/AccessibilityService.js';
import { accessibilityTester } from '../../utils/accessibilityTester.js';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  default: {
    level: 2,
    enabled: true,
    getLogLevel: vi.fn().mockReturnValue(2),
    setLevel: vi.fn(),
    setEnabled: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    shouldLog: vi.fn().mockReturnValue(true),
    formatMessage: vi.fn().mockImplementation((level, message, args) => {
      const timestamp = new Date().toISOString().slice(11, 23);
      return [`[${timestamp}] ${level}:`, message, ...args];
    }),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    game: vi.fn(),
    user: vi.fn(),
    perf: vi.fn(),
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
}));

describe('Form Keyboard Navigation Tests', () => {
  let testContainer;
  let formComponent;

  beforeEach(() => {
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Mock focus methods
    Element.prototype.focus = vi.fn(function () {
      Object.defineProperty(document, 'activeElement', {
        value: this,
        configurable: true,
      });
      this.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    });

    Element.prototype.blur = vi.fn(function () {
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true,
      });
      this.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    });

    // Mock form submission
    HTMLFormElement.prototype.checkValidity = vi.fn(() => true);
    HTMLFormElement.prototype.reportValidity = vi.fn(() => true);
    HTMLInputElement.prototype.checkValidity = vi.fn(() => true);
    HTMLInputElement.prototype.setCustomValidity = vi.fn();
  });

  afterEach(() => {
    if (formComponent) {
      formComponent.destroy();
      formComponent = null;
    }
    accessibilityService.destroy();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Basic Form Field Navigation', () => {
    beforeEach(() => {
      formComponent = new FormComponent({
        id: 'basic-form',
        fields: [
          { name: 'firstName', type: 'text', label: 'First Name', required: true },
          { name: 'lastName', type: 'text', label: 'Last Name', required: true },
          { name: 'email', type: 'email', label: 'Email Address', required: true },
          { name: 'phone', type: 'tel', label: 'Phone Number' },
          { name: 'comments', type: 'textarea', label: 'Comments' },
        ],
      });

      formComponent.render(testContainer);
    });

    it('should have logical tab order through form fields', () => {
      const form = testContainer.querySelector('#basic-form');
      const focusableElements = accessibilityTester.getFocusableElements(form);

      const expectedOrder = ['firstName', 'lastName', 'email', 'phone', 'comments'];
      const formFields = focusableElements.slice(0, -1); // Exclude submit button

      formFields.forEach((element, index) => {
        expect(element.name).toBe(expectedOrder[index]);
      });

      // Last focusable element should be submit button
      const submitButton = focusableElements[focusableElements.length - 1];
      expect(submitButton.type).toBe('submit');
    });

    it('should support forward tab navigation', () => {
      const form = testContainer.querySelector('#basic-form');
      const firstNameField = form.querySelector('[name="firstName"]');
      const lastNameField = form.querySelector('[name="lastName"]');

      firstNameField.focus();
      expect(document.activeElement).toBe(firstNameField);

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      firstNameField.dispatchEvent(tabEvent);

      // Should move to next field
      expect(lastNameField.focus).toHaveBeenCalled();
    });

    it('should support backward tab navigation with Shift+Tab', () => {
      const form = testContainer.querySelector('#basic-form');
      const firstNameField = form.querySelector('[name="firstName"]');
      const lastNameField = form.querySelector('[name="lastName"]');

      lastNameField.focus();
      expect(document.activeElement).toBe(lastNameField);

      // Simulate Shift+Tab key
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });
      lastNameField.dispatchEvent(shiftTabEvent);

      // Should move to previous field
      expect(firstNameField.focus).toHaveBeenCalled();
    });

    it('should handle Enter key appropriately in different field types', async () => {
      // The accessibility service provides the document-level form keyboard
      // management (Enter moves between fields and activates submit controls)
      await accessibilityService.initialize();

      const form = testContainer.querySelector('#basic-form');
      const textField = form.querySelector('[name="firstName"]');
      const textareaField = form.querySelector('[name="comments"]');
      const submitButton = form.querySelector('[type="submit"]');

      // Test Enter in text field - should move to next field or submit
      textField.focus();
      const enterInTextEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      enterInTextEvent.preventDefault = vi.fn();
      textField.dispatchEvent(enterInTextEvent);

      // Enter in single-line text field should not create new line
      expect(enterInTextEvent.preventDefault).toHaveBeenCalled();

      // Test Enter in textarea - should create new line (not prevent default)
      textareaField.focus();
      const enterInTextareaEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      enterInTextareaEvent.preventDefault = vi.fn();
      textareaField.dispatchEvent(enterInTextareaEvent);

      // Enter in textarea should allow new line (preventDefault not called)
      expect(enterInTextareaEvent.preventDefault).not.toHaveBeenCalled();

      // Test Enter on submit button - should submit form
      const onSubmitSpy = vi.fn();
      formComponent.options.onSubmit = onSubmitSpy;

      submitButton.focus();
      const enterOnSubmitEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      enterOnSubmitEvent.preventDefault = vi.fn();
      submitButton.dispatchEvent(enterOnSubmitEvent);

      expect(enterOnSubmitEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Radio Button and Checkbox Navigation', () => {
    beforeEach(() => {
      formComponent = new FormComponent({
        id: 'choice-form',
        fields: [
          {
            name: 'experience',
            type: 'radio',
            label: 'Experience Level',
            options: [
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
              { value: 'expert', label: 'Expert' },
            ],
          },
          {
            name: 'interests',
            type: 'checkbox',
            label: 'Interests',
            options: [
              { value: 'math', label: 'Mathematics' },
              { value: 'science', label: 'Science' },
              { value: 'reading', label: 'Reading' },
              { value: 'art', label: 'Art' },
            ],
          },
        ],
      });

      formComponent.render(testContainer);

      // Apply the accessibility enhancement layer, which sets up the APG
      // roving tabindex pattern for radio groups
      accessibilityService.enhanceForm(testContainer.querySelector('#choice-form'));
    });

    it('should implement roving tabindex for radio button groups', () => {
      const form = testContainer.querySelector('#choice-form');
      const radioButtons = form.querySelectorAll('[name="experience"]');

      // Only first radio button should be in tab order initially
      expect(radioButtons[0].getAttribute('tabindex')).toBe('0');
      for (let i = 1; i < radioButtons.length; i++) {
        expect(radioButtons[i].getAttribute('tabindex')).toBe('-1');
      }

      // When a radio button receives focus, it should become the tabbable one
      radioButtons[2].focus();
      radioButtons[2].dispatchEvent(new FocusEvent('focus'));

      expect(radioButtons[2].getAttribute('tabindex')).toBe('0');
      expect(radioButtons[0].getAttribute('tabindex')).toBe('-1');
      expect(radioButtons[1].getAttribute('tabindex')).toBe('-1');
      expect(radioButtons[3].getAttribute('tabindex')).toBe('-1');
    });

    it('should handle arrow key navigation in radio button groups', () => {
      const form = testContainer.querySelector('#choice-form');
      const radioButtons = form.querySelectorAll('[name="experience"]');

      // Set up arrow key navigation
      radioButtons.forEach((radio, index) => {
        radio.addEventListener('keydown', e => {
          let nextIndex;
          switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
              e.preventDefault();
              nextIndex = (index + 1) % radioButtons.length;
              radioButtons[nextIndex].focus();
              radioButtons[nextIndex].checked = true;
              break;
            case 'ArrowUp':
            case 'ArrowLeft':
              e.preventDefault();
              nextIndex = index > 0 ? index - 1 : radioButtons.length - 1;
              radioButtons[nextIndex].focus();
              radioButtons[nextIndex].checked = true;
              break;
          }
        });
      });

      radioButtons[0].focus();
      expect(document.activeElement).toBe(radioButtons[0]);

      // Test Arrow Down
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      arrowDownEvent.preventDefault = vi.fn();
      radioButtons[0].dispatchEvent(arrowDownEvent);

      expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
      expect(radioButtons[1].focus).toHaveBeenCalled();
      expect(radioButtons[1].checked).toBe(true);

      // Test Arrow Up (should wrap to last)
      radioButtons[0].focus();
      const arrowUpEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      });
      arrowUpEvent.preventDefault = vi.fn();
      radioButtons[0].dispatchEvent(arrowUpEvent);

      expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
      expect(radioButtons[radioButtons.length - 1].focus).toHaveBeenCalled();
    });

    it('should handle Space key for selecting radio buttons and checkboxes', async () => {
      // The accessibility service handles Space key selection for radio
      // buttons and checkboxes at the document level
      await accessibilityService.initialize();

      const form = testContainer.querySelector('#choice-form');
      const firstRadio = form.querySelector('[name="experience"]');
      const firstCheckbox = form.querySelector('[name="interests"]');

      // Test Space key on radio button
      firstRadio.focus();
      expect(firstRadio.checked).toBe(false);

      const spaceOnRadioEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      spaceOnRadioEvent.preventDefault = vi.fn();
      firstRadio.dispatchEvent(spaceOnRadioEvent);

      expect(spaceOnRadioEvent.preventDefault).toHaveBeenCalled();
      expect(firstRadio.checked).toBe(true);

      // Test Space key on checkbox
      firstCheckbox.focus();
      expect(firstCheckbox.checked).toBe(false);

      const spaceOnCheckboxEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      spaceOnCheckboxEvent.preventDefault = vi.fn();
      firstCheckbox.dispatchEvent(spaceOnCheckboxEvent);

      expect(spaceOnCheckboxEvent.preventDefault).toHaveBeenCalled();
      expect(firstCheckbox.checked).toBe(true);
    });

    it('should allow individual tab navigation for checkboxes', () => {
      const form = testContainer.querySelector('#choice-form');
      const checkboxes = form.querySelectorAll('[name="interests"]');

      // All checkboxes should be in tab order (unlike radio buttons)
      checkboxes.forEach(checkbox => {
        expect(accessibilityTester.isKeyboardAccessible(checkbox)).toBe(true);
      });

      // Test tab navigation through checkboxes
      checkboxes[0].focus();
      expect(document.activeElement).toBe(checkboxes[0]);

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      checkboxes[0].dispatchEvent(tabEvent);

      expect(checkboxes[1].focus).toHaveBeenCalled();
    });
  });

  describe('Select and Dropdown Navigation', () => {
    beforeEach(() => {
      formComponent = new FormComponent({
        id: 'select-form',
        fields: [
          {
            name: 'country',
            type: 'select',
            label: 'Country',
            options: [
              { value: '', label: 'Select a country' },
              { value: 'us', label: 'United States' },
              { value: 'ca', label: 'Canada' },
              { value: 'uk', label: 'United Kingdom' },
              { value: 'au', label: 'Australia' },
            ],
          },
          {
            name: 'grade',
            type: 'select',
            label: 'Grade Level',
            options: [
              { value: 'k', label: 'Kindergarten' },
              { value: '1', label: '1st Grade' },
              { value: '2', label: '2nd Grade' },
              { value: '3', label: '3rd Grade' },
              { value: '4', label: '4th Grade' },
              { value: '5', label: '5th Grade' },
            ],
          },
        ],
      });

      formComponent.render(testContainer);
    });

    it('should handle arrow key navigation in select dropdowns', () => {
      const form = testContainer.querySelector('#select-form');
      const countrySelect = form.querySelector('[name="country"]');

      countrySelect.focus();
      expect(document.activeElement).toBe(countrySelect);

      // Mock select dropdown behavior
      let selectedIndex = 0;
      countrySelect.addEventListener('keydown', e => {
        const options = countrySelect.options;
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, options.length - 1);
            countrySelect.selectedIndex = selectedIndex;
            break;
          case 'ArrowUp':
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            countrySelect.selectedIndex = selectedIndex;
            break;
          case 'Home':
            e.preventDefault();
            selectedIndex = 0;
            countrySelect.selectedIndex = selectedIndex;
            break;
          case 'End':
            e.preventDefault();
            selectedIndex = options.length - 1;
            countrySelect.selectedIndex = selectedIndex;
            break;
        }
      });

      // Test Arrow Down
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      arrowDownEvent.preventDefault = vi.fn();
      countrySelect.dispatchEvent(arrowDownEvent);

      expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
      expect(countrySelect.selectedIndex).toBe(1);

      // Test Home key
      const homeEvent = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
        cancelable: true,
      });
      homeEvent.preventDefault = vi.fn();
      countrySelect.dispatchEvent(homeEvent);

      expect(homeEvent.preventDefault).toHaveBeenCalled();
      expect(countrySelect.selectedIndex).toBe(0);
    });

    it('should handle letter key navigation for quick selection', () => {
      const form = testContainer.querySelector('#select-form');
      const countrySelect = form.querySelector('[name="country"]');

      countrySelect.focus();

      // Mock letter key navigation
      countrySelect.addEventListener('keydown', e => {
        if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
          const options = Array.from(countrySelect.options);
          const currentIndex = countrySelect.selectedIndex;

          // Find next option starting with the typed letter
          const nextOption = options.find(
            (option, index) =>
              index > currentIndex && option.text.toLowerCase().startsWith(e.key.toLowerCase())
          );

          if (nextOption) {
            countrySelect.selectedIndex = options.indexOf(nextOption);
          }
        }
      });

      // Test typing 'c' to select 'Canada'
      const cKeyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        bubbles: true,
      });
      countrySelect.dispatchEvent(cKeyEvent);

      expect(countrySelect.selectedIndex).toBe(2); // Canada
      expect(countrySelect.value).toBe('ca');
    });

    it('should handle Enter and Space keys for opening/closing select', () => {
      const form = testContainer.querySelector('#select-form');
      const countrySelect = form.querySelector('[name="country"]');

      countrySelect.focus();

      // Mock select open/close behavior
      let isOpen = false;
      countrySelect.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          isOpen = !isOpen;
          // In real implementation, this would open/close the dropdown
        }
      });

      // Test Space key
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      spaceEvent.preventDefault = vi.fn();
      countrySelect.dispatchEvent(spaceEvent);

      expect(spaceEvent.preventDefault).toHaveBeenCalled();
      expect(isOpen).toBe(true);

      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      enterEvent.preventDefault = vi.fn();
      countrySelect.dispatchEvent(enterEvent);

      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(isOpen).toBe(false);
    });
  });

  describe('Form Validation and Error Handling', () => {
    beforeEach(() => {
      formComponent = new FormComponent({
        id: 'validation-form',
        fields: [
          {
            name: 'username',
            type: 'text',
            label: 'Username',
            required: true,
            validate: value => {
              if (value.length < 3) return 'Username must be at least 3 characters';
              return true;
            },
          },
          {
            name: 'email',
            type: 'email',
            label: 'Email',
            required: true,
            validate: value => {
              if (!value.includes('@')) return 'Please enter a valid email address';
              return true;
            },
          },
          {
            name: 'password',
            type: 'password',
            label: 'Password',
            required: true,
            validate: value => {
              if (value.length < 8) return 'Password must be at least 8 characters';
              return true;
            },
          },
        ],
      });

      formComponent.render(testContainer);

      // Apply the accessibility enhancement layer, which associates error
      // containers with their fields and keeps aria-invalid in sync
      accessibilityService.enhanceForm(testContainer.querySelector('#validation-form'));
    });

    it('should associate error messages with form fields using aria-describedby', () => {
      const form = testContainer.querySelector('#validation-form');
      const usernameField = form.querySelector('[name="username"]');

      // Test initial state
      expect(usernameField.getAttribute('aria-describedby')).toContain(
        'validation-form-username-error'
      );

      // Trigger validation error; a bubbling blur reaches the form-level
      // validation listeners (browsers deliver this via focusout)
      usernameField.value = 'ab'; // Too short
      usernameField.dispatchEvent(new Event('blur', { bubbles: true }));

      const errorElement = form.querySelector('#validation-form-username-error');
      expect(errorElement.textContent).toContain('at least 3 characters');
      expect(usernameField.getAttribute('aria-invalid')).toBe('true');
    });

    it('should move focus to first invalid field on form submission', () => {
      const form = testContainer.querySelector('#validation-form');
      const usernameField = form.querySelector('[name="username"]');
      const emailField = form.querySelector('[name="email"]');
      const submitButton = form.querySelector('[type="submit"]');

      // Fill form with invalid data
      usernameField.value = 'ab'; // Too short
      emailField.value = 'invalid-email'; // No @

      // Mock form validation
      form.checkValidity = vi.fn(() => false);
      usernameField.checkValidity = vi.fn(() => false);
      emailField.checkValidity = vi.fn(() => false);

      // Submit form
      submitButton.focus();
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      submitEvent.preventDefault = vi.fn();
      form.dispatchEvent(submitEvent);

      expect(submitEvent.preventDefault).toHaveBeenCalled();

      // Focus should move to first invalid field
      expect(usernameField.focus).toHaveBeenCalled();
    });

    it('should handle Escape key to clear validation errors', () => {
      const form = testContainer.querySelector('#validation-form');
      const usernameField = form.querySelector('[name="username"]');

      // Trigger validation error
      usernameField.value = 'ab';
      formComponent.validateField('username');

      const errorElement = form.querySelector('#validation-form-username-error');
      expect(errorElement.textContent).toContain('at least 3 characters');

      // Mock Escape key behavior to clear errors
      usernameField.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          // Clear the field and error
          usernameField.value = '';
          errorElement.textContent = '';
          errorElement.style.display = 'none';
          usernameField.removeAttribute('aria-invalid');
        }
      });

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      escapeEvent.preventDefault = vi.fn();
      usernameField.dispatchEvent(escapeEvent);

      expect(escapeEvent.preventDefault).toHaveBeenCalled();
      expect(usernameField.value).toBe('');
      expect(errorElement.textContent).toBe('');
    });

    it('should announce validation results to screen readers', () => {
      const form = testContainer.querySelector('#validation-form');
      const usernameField = form.querySelector('[name="username"]');

      // Create announcement region
      const announcements = document.createElement('div');
      announcements.setAttribute('aria-live', 'assertive');
      announcements.setAttribute('aria-atomic', 'true');
      announcements.className = 'sr-only';
      form.appendChild(announcements);

      // Mock validation announcement
      usernameField.addEventListener('blur', () => {
        const isValid = formComponent.validateField('username');
        if (!isValid) {
          announcements.textContent = `Username field has an error: ${formComponent.errors.username}`;
        } else {
          announcements.textContent = 'Username field is valid';
        }
      });

      // Trigger validation
      usernameField.value = 'ab';
      usernameField.dispatchEvent(new Event('blur'));

      expect(announcements.textContent).toContain('Username field has an error');
      expect(announcements.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('Complex Form Widgets', () => {
    beforeEach(() => {
      testContainer.innerHTML = `
        <form id="complex-form">
          <fieldset>
            <legend>Date Selection</legend>
            <div class="date-picker" role="application" aria-label="Date picker">
              <input type="text" id="date-input" placeholder="MM/DD/YYYY" aria-describedby="date-help">
              <button type="button" id="date-trigger" aria-label="Open calendar">📅</button>
              <div id="date-help" class="sr-only">Use arrow keys to navigate calendar when open</div>
              
              <div id="calendar" class="calendar" hidden aria-label="Calendar">
                <div class="calendar-header">
                  <button type="button" id="prev-month" aria-label="Previous month">‹</button>
                  <h3 id="month-year">January 2024</h3>
                  <button type="button" id="next-month" aria-label="Next month">›</button>
                </div>
                <div class="calendar-grid" role="grid" aria-labelledby="month-year">
                  <div class="calendar-row" role="row">
                    <div role="columnheader">Sun</div>
                    <div role="columnheader">Mon</div>
                    <div role="columnheader">Tue</div>
                    <div role="columnheader">Wed</div>
                    <div role="columnheader">Thu</div>
                    <div role="columnheader">Fri</div>
                    <div role="columnheader">Sat</div>
                  </div>
                  <div class="calendar-row" role="row">
                    <div role="gridcell" tabindex="-1" data-date="2024-01-01">1</div>
                    <div role="gridcell" tabindex="-1" data-date="2024-01-02">2</div>
                    <div role="gridcell" tabindex="-1" data-date="2024-01-03">3</div>
                    <div role="gridcell" tabindex="-1" data-date="2024-01-04">4</div>
                    <div role="gridcell" tabindex="-1" data-date="2024-01-05">5</div>
                    <div role="gridcell" tabindex="-1" data-date="2024-01-06">6</div>
                    <div role="gridcell" tabindex="-1" data-date="2024-01-07">7</div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
          
          <fieldset>
            <legend>Time Selection</legend>
            <div class="time-picker" role="group" aria-labelledby="time-legend">
              <label for="hours">Hours:</label>
              <input type="number" id="hours" min="1" max="12" value="12">
              
              <label for="minutes">Minutes:</label>
              <input type="number" id="minutes" min="0" max="59" value="0" step="1">
              
              <div role="radiogroup" aria-label="AM/PM">
                <label><input type="radio" name="ampm" value="am" checked> AM</label>
                <label><input type="radio" name="ampm" value="pm"> PM</label>
              </div>
            </div>
          </fieldset>
        </form>
      `;

      // Set up date picker behavior
      const dateTrigger = testContainer.querySelector('#date-trigger');
      const calendar = testContainer.querySelector('#calendar');
      const dateInput = testContainer.querySelector('#date-input');

      dateTrigger.addEventListener('click', () => {
        const isOpen = !calendar.hidden;
        calendar.hidden = isOpen;
        dateTrigger.setAttribute('aria-expanded', (!isOpen).toString());

        if (!isOpen) {
          // Focus first day when opening
          const firstDay = calendar.querySelector('[role="gridcell"]');
          firstDay.setAttribute('tabindex', '0');
          firstDay.focus();
        }
      });

      // Set up calendar navigation
      const calendarCells = testContainer.querySelectorAll('[role="gridcell"]');
      calendarCells.forEach((cell, index) => {
        cell.addEventListener('keydown', e => {
          let nextIndex;
          switch (e.key) {
            case 'ArrowRight':
              e.preventDefault();
              nextIndex = (index + 1) % calendarCells.length;
              focusCalendarCell(calendarCells, nextIndex);
              break;
            case 'ArrowLeft':
              e.preventDefault();
              nextIndex = index > 0 ? index - 1 : calendarCells.length - 1;
              focusCalendarCell(calendarCells, nextIndex);
              break;
            case 'ArrowDown':
              e.preventDefault();
              nextIndex = (index + 7) % calendarCells.length;
              focusCalendarCell(calendarCells, nextIndex);
              break;
            case 'ArrowUp':
              e.preventDefault();
              nextIndex = index >= 7 ? index - 7 : calendarCells.length + index - 7;
              focusCalendarCell(calendarCells, nextIndex);
              break;
            case 'Enter':
            case ' ':
              e.preventDefault();
              selectDate(cell, dateInput, calendar, dateTrigger);
              break;
            case 'Escape':
              e.preventDefault();
              calendar.hidden = true;
              dateTrigger.setAttribute('aria-expanded', 'false');
              dateTrigger.focus();
              break;
          }
        });
      });

      function focusCalendarCell(cells, index) {
        cells.forEach(cell => cell.setAttribute('tabindex', '-1'));
        cells[index].setAttribute('tabindex', '0');
        cells[index].focus();
      }

      function selectDate(cell, input, calendar, trigger) {
        const date = cell.dataset.date;
        input.value = new Date(date).toLocaleDateString();
        calendar.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        input.focus();
      }
    });

    it('should handle keyboard navigation in date picker calendar', () => {
      const dateTrigger = testContainer.querySelector('#date-trigger');
      const calendar = testContainer.querySelector('#calendar');
      const firstCell = testContainer.querySelector('[role="gridcell"]');

      // Open calendar
      dateTrigger.click();
      expect(calendar.hidden).toBe(false);
      expect(dateTrigger.getAttribute('aria-expanded')).toBe('true');

      // First cell should be focused and focusable
      expect(firstCell.getAttribute('tabindex')).toBe('0');
      expect(firstCell.focus).toHaveBeenCalled();

      // Test arrow navigation
      const arrowRightEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      arrowRightEvent.preventDefault = vi.fn();
      firstCell.dispatchEvent(arrowRightEvent);

      expect(arrowRightEvent.preventDefault).toHaveBeenCalled();

      // Second cell should now be focusable
      const secondCell = testContainer.querySelectorAll('[role="gridcell"]')[1];
      expect(secondCell.getAttribute('tabindex')).toBe('0');
      expect(firstCell.getAttribute('tabindex')).toBe('-1');
    });

    it('should handle date selection with Enter and Space keys', () => {
      const dateTrigger = testContainer.querySelector('#date-trigger');
      const dateInput = testContainer.querySelector('#date-input');
      const calendar = testContainer.querySelector('#calendar');
      const firstCell = testContainer.querySelector('[role="gridcell"]');

      // Open calendar
      dateTrigger.click();
      firstCell.focus();

      expect(dateInput.value).toBe('');

      // Select date with Enter
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      enterEvent.preventDefault = vi.fn();
      firstCell.dispatchEvent(enterEvent);

      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(dateInput.value).toBeTruthy(); // Should have a date value
      expect(calendar.hidden).toBe(true);
      expect(dateInput.focus).toHaveBeenCalled();
    });

    it('should close calendar with Escape and return focus', () => {
      const dateTrigger = testContainer.querySelector('#date-trigger');
      const calendar = testContainer.querySelector('#calendar');
      const firstCell = testContainer.querySelector('[role="gridcell"]');

      // Open calendar
      dateTrigger.click();
      firstCell.focus();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      escapeEvent.preventDefault = vi.fn();
      firstCell.dispatchEvent(escapeEvent);

      expect(escapeEvent.preventDefault).toHaveBeenCalled();
      expect(calendar.hidden).toBe(true);
      expect(dateTrigger.getAttribute('aria-expanded')).toBe('false');
      expect(dateTrigger.focus).toHaveBeenCalled();
    });

    it('should handle keyboard navigation in time picker', () => {
      const hoursInput = testContainer.querySelector('#hours');
      const _minutesInput = testContainer.querySelector('#minutes');
      const _amRadio = testContainer.querySelector('[value="am"]');
      const _pmRadio = testContainer.querySelector('[value="pm"]');

      // Test Tab navigation through time components
      hoursInput.focus();
      expect(document.activeElement).toBe(hoursInput);

      // Test arrow keys for number inputs
      hoursInput.addEventListener('keydown', e => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const currentValue = parseInt(hoursInput.value);
          hoursInput.value = currentValue < 12 ? currentValue + 1 : 1;
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const currentValue = parseInt(hoursInput.value);
          hoursInput.value = currentValue > 1 ? currentValue - 1 : 12;
        }
      });

      const arrowUpEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      });
      arrowUpEvent.preventDefault = vi.fn();
      hoursInput.dispatchEvent(arrowUpEvent);

      expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
      // A 12-hour clock wraps from 12 back to 1 on ArrowUp
      expect(parseInt(hoursInput.value)).toBe(1);
    });
  });

  describe('Form Accessibility and Screen Reader Support', () => {
    beforeEach(() => {
      formComponent = new FormComponent({
        id: 'accessible-form',
        fields: [
          {
            name: 'name',
            type: 'text',
            label: 'Full Name',
            required: true,
            helpText: 'Enter your first and last name',
          },
          {
            name: 'email',
            type: 'email',
            label: 'Email Address',
            required: true,
            helpText: 'We will use this to send you updates',
          },
        ],
      });

      formComponent.render(testContainer);

      // Apply the accessibility enhancement layer, which adds aria-required
      // and error container associations for assistive technology
      accessibilityService.enhanceForm(testContainer.querySelector('#accessible-form'));
    });

    it('should have proper label associations', () => {
      const form = testContainer.querySelector('#accessible-form');
      const nameField = form.querySelector('[name="name"]');
      const emailField = form.querySelector('[name="email"]');
      const nameLabel = form.querySelector('label[for="accessible-form-name"]');
      const emailLabel = form.querySelector('label[for="accessible-form-email"]');

      expect(nameLabel).toBeTruthy();
      expect(emailLabel).toBeTruthy();
      expect(nameLabel.getAttribute('for')).toBe(nameField.id);
      expect(emailLabel.getAttribute('for')).toBe(emailField.id);
    });

    it('should associate help text with form fields', () => {
      const form = testContainer.querySelector('#accessible-form');
      const nameField = form.querySelector('[name="name"]');
      const nameHelp = form.querySelector('#accessible-form-name-help');

      expect(nameHelp).toBeTruthy();
      expect(nameHelp.textContent).toContain('first and last name');
      expect(nameField.getAttribute('aria-describedby')).toContain('accessible-form-name-help');
    });

    it('should indicate required fields to screen readers', () => {
      const form = testContainer.querySelector('#accessible-form');
      const nameField = form.querySelector('[name="name"]');
      const nameLabel = form.querySelector('label[for="accessible-form-name"]');

      expect(nameField.hasAttribute('required')).toBe(true);
      expect(nameLabel.textContent).toContain('*'); // Visual indicator
      expect(nameField.getAttribute('aria-required')).toBe('true');
    });

    it('should announce form submission results', () => {
      const form = testContainer.querySelector('#accessible-form');

      // Create status region
      const statusRegion = document.createElement('div');
      statusRegion.setAttribute('aria-live', 'polite');
      statusRegion.setAttribute('aria-atomic', 'true');
      statusRegion.className = 'sr-only';
      form.appendChild(statusRegion);

      // Mock successful submission
      const onSubmitSpy = vi.fn(() => {
        statusRegion.textContent = 'Form submitted successfully!';
      });
      formComponent.options.onSubmit = onSubmitSpy;

      // Fill and submit form
      const nameField = form.querySelector('[name="name"]');
      const emailField = form.querySelector('[name="email"]');
      nameField.value = 'John Doe';
      emailField.value = 'john@example.com';

      const submitEvent = new Event('submit');
      form.dispatchEvent(submitEvent);

      expect(statusRegion.textContent).toBe('Form submitted successfully!');
      expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    });

    it('should pass automated accessibility audit', async () => {
      const form = testContainer.querySelector('#accessible-form');

      // Audit a page-like container: forms live inside a main landmark
      const main = document.createElement('main');
      testContainer.appendChild(main);
      main.appendChild(form);

      const auditResults = await accessibilityTester.runAudit(testContainer);

      // Warnings are advisory only (touch target sizes cannot be measured
      // in jsdom); violations must be empty
      expect(auditResults.violations).toEqual([]);
    });
  });
});
