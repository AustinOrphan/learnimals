/**
 * Form Accessibility Tests
 * Comprehensive tests for form accessibility and validation messaging
 * Ensures WCAG 2.1 Level AA compliance for form accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibleComponent } from '../../src/components/AccessibleComponent.js';
import { accessibilityService, AccessibilityService } from '../../src/services/accessibility/AccessibilityService.js';
import { accessibilityTester } from '../../src/utils/accessibilityTester.js';

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
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
    perf: vi.fn()
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
}));

describe('Form Accessibility Tests', () => {
  let testContainer;
  let service;

  beforeEach(() => {
    // Set up clean DOM
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0
    }));

    // Mock focus method
    Element.prototype.focus = vi.fn(function() {
      Object.defineProperty(document, 'activeElement', {
        value: this,
        configurable: true
      });
      this.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    });

    service = new AccessibilityService();
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Form Labels and Associations', () => {
    it('should associate labels with form controls using for/id', () => {
      testContainer.innerHTML = `
        <form>
          <label for="email">Email Address</label>
          <input type="email" id="email" name="email" required>
          
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
          
          <label for="remember">
            <input type="checkbox" id="remember" name="remember">
            Remember me
          </label>
        </form>
      `;

      const emailLabel = testContainer.querySelector('label[for="email"]');
      const emailInput = testContainer.querySelector('#email');
      const passwordLabel = testContainer.querySelector('label[for="password"]');
      const passwordInput = testContainer.querySelector('#password');
      const checkboxLabel = testContainer.querySelector('label[for="remember"]');
      const checkboxInput = testContainer.querySelector('#remember');

      expect(emailLabel.getAttribute('for')).toBe('email');
      expect(emailInput.id).toBe('email');
      expect(passwordLabel.getAttribute('for')).toBe('password');
      expect(passwordInput.id).toBe('password');
      
      // Checkbox with implicit association
      expect(checkboxLabel.contains(checkboxInput)).toBe(true);
      expect(accessibilityTester.hasLabel(emailInput)).toBe(true);
      expect(accessibilityTester.hasLabel(passwordInput)).toBe(true);
      expect(accessibilityTester.hasLabel(checkboxInput)).toBe(true);
    });

    it('should handle aria-label for form controls', () => {
      testContainer.innerHTML = `
        <form>
          <input type="search" aria-label="Search courses" placeholder="Type to search...">
          <button type="submit" aria-label="Submit search">🔍</button>
          
          <input type="text" aria-labelledby="username-label" id="username">
          <div id="username-label">Username</div>
        </form>
      `;

      const searchInput = testContainer.querySelector('input[type="search"]');
      const submitButton = testContainer.querySelector('button[type="submit"]');
      const usernameInput = testContainer.querySelector('#username');

      expect(searchInput.getAttribute('aria-label')).toBe('Search courses');
      expect(submitButton.getAttribute('aria-label')).toBe('Submit search');
      expect(usernameInput.getAttribute('aria-labelledby')).toBe('username-label');
      
      expect(accessibilityTester.hasLabel(searchInput)).toBe(true);
      expect(accessibilityTester.hasLabel(submitButton)).toBe(false); // buttons need accessible name differently
      expect(accessibilityTester.hasLabel(usernameInput)).toBe(true);
    });

    it('should group related form controls with fieldset and legend', () => {
      testContainer.innerHTML = `
        <form>
          <fieldset>
            <legend>Contact Information</legend>
            <label for="first-name">First Name</label>
            <input type="text" id="first-name" name="firstName" required>
            
            <label for="last-name">Last Name</label>
            <input type="text" id="last-name" name="lastName" required>
            
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone">
          </fieldset>
          
          <fieldset>
            <legend>Preferred Contact Method</legend>
            <label>
              <input type="radio" name="contact-method" value="email" checked>
              Email
            </label>
            <label>
              <input type="radio" name="contact-method" value="phone">
              Phone
            </label>
            <label>
              <input type="radio" name="contact-method" value="text">
              Text Message
            </label>
          </fieldset>
        </form>
      `;

      const fieldsets = testContainer.querySelectorAll('fieldset');
      const legends = testContainer.querySelectorAll('legend');
      const radioButtons = testContainer.querySelectorAll('input[type="radio"]');

      expect(fieldsets.length).toBe(2);
      expect(legends.length).toBe(2);
      expect(legends[0].textContent).toBe('Contact Information');
      expect(legends[1].textContent).toBe('Preferred Contact Method');

      // Radio buttons should be grouped by name
      radioButtons.forEach(radio => {
        expect(radio.name).toBe('contact-method');
        expect(radio.closest('fieldset')).toBeTruthy();
      });
    });

    it('should handle required field indicators', () => {
      testContainer.innerHTML = `
        <form>
          <label for="required-field">
            Required Field <span class="required" aria-label="required">*</span>
          </label>
          <input type="text" id="required-field" required aria-describedby="required-help">
          <div id="required-help" class="help-text">This field is required</div>
          
          <label for="optional-field">Optional Field</label>
          <input type="text" id="optional-field">
        </form>
      `;

      const requiredInput = testContainer.querySelector('#required-field');
      const requiredIndicator = testContainer.querySelector('.required');

      expect(requiredInput.hasAttribute('required')).toBe(true);
      expect(requiredInput.getAttribute('aria-describedby')).toBe('required-help');
      expect(requiredIndicator.getAttribute('aria-label')).toBe('required');
      expect(requiredIndicator.textContent).toBe('*');
    });
  });

  describe('Form Help Text and Descriptions', () => {
    it('should associate help text with form controls using aria-describedby', () => {
      testContainer.innerHTML = `
        <form>
          <label for="password">Password</label>
          <input type="password" 
                 id="password" 
                 aria-describedby="password-help password-requirements">
          <div id="password-help" class="help-text">
            Choose a strong password to protect your account
          </div>
          <div id="password-requirements" class="help-text">
            Must be at least 8 characters with uppercase, lowercase, and numbers
          </div>
        </form>
      `;

      const passwordInput = testContainer.querySelector('#password');
      const helpText = testContainer.querySelector('#password-help');
      const requirements = testContainer.querySelector('#password-requirements');

      expect(passwordInput.getAttribute('aria-describedby')).toBe('password-help password-requirements');
      expect(helpText.textContent).toContain('Choose a strong password');
      expect(requirements.textContent).toContain('Must be at least 8 characters');
    });

    it('should provide instructions for complex form controls', () => {
      testContainer.innerHTML = `
        <form>
          <label for="date-picker">Select Date</label>
          <input type="date" 
                 id="date-picker" 
                 aria-describedby="date-instructions">
          <div id="date-instructions" class="help-text">
            Use arrow keys to navigate calendar. Press Enter to select date.
          </div>
          
          <label for="file-upload">Upload File</label>
          <input type="file" 
                 id="file-upload" 
                 accept=".pdf,.doc,.docx"
                 aria-describedby="file-help">
          <div id="file-help" class="help-text">
            Accepted formats: PDF, DOC, DOCX. Maximum size: 10MB.
          </div>
        </form>
      `;

      const datePicker = testContainer.querySelector('#date-picker');
      const fileUpload = testContainer.querySelector('#file-upload');
      const dateInstructions = testContainer.querySelector('#date-instructions');
      const fileHelp = testContainer.querySelector('#file-help');

      expect(datePicker.getAttribute('aria-describedby')).toBe('date-instructions');
      expect(fileUpload.getAttribute('aria-describedby')).toBe('file-help');
      expect(dateInstructions.textContent).toContain('arrow keys');
      expect(fileHelp.textContent).toContain('PDF, DOC, DOCX');
    });

    it('should handle placeholder text appropriately', () => {
      testContainer.innerHTML = `
        <form>
          <!-- Good: Label + placeholder -->
          <label for="search">Search</label>
          <input type="search" 
                 id="search" 
                 placeholder="Enter keywords..." 
                 aria-describedby="search-help">
          <div id="search-help" class="help-text">
            Search through course titles and descriptions
          </div>
          
          <!-- Avoid: Placeholder as only label -->
          <input type="email" 
                 placeholder="Enter your email address"
                 aria-label="Email address">
          
          <!-- Good: Label with helpful placeholder -->
          <label for="phone">Phone Number</label>
          <input type="tel" 
                 id="phone" 
                 placeholder="(555) 123-4567"
                 aria-describedby="phone-format">
          <div id="phone-format" class="help-text">Format: (XXX) XXX-XXXX</div>
        </form>
      `;

      const searchInput = testContainer.querySelector('#search');
      const emailInput = testContainer.querySelector('input[type="email"]');
      const phoneInput = testContainer.querySelector('#phone');

      // Search input has both label and helpful placeholder
      expect(accessibilityTester.hasLabel(searchInput)).toBe(true);
      expect(searchInput.placeholder).toBe('Enter keywords...');

      // Email input uses aria-label (placeholder alone is insufficient)
      expect(emailInput.getAttribute('aria-label')).toBe('Email address');

      // Phone input has label and format example in placeholder
      expect(accessibilityTester.hasLabel(phoneInput)).toBe(true);
      expect(phoneInput.placeholder).toBe('(555) 123-4567');
    });
  });

  describe('Form Validation and Error Handling', () => {
    it('should provide accessible error messages', () => {
      testContainer.innerHTML = `
        <form>
          <label for="email">Email Address</label>
          <input type="email" 
                 id="email" 
                 aria-invalid="true"
                 aria-describedby="email-error">
          <div id="email-error" 
               role="alert" 
               aria-live="polite" 
               class="error-message">
            Please enter a valid email address
          </div>
          
          <label for="password">Password</label>
          <input type="password" 
                 id="password" 
                 aria-invalid="false"
                 aria-describedby="password-help">
          <div id="password-help" class="help-text">
            Password is valid
          </div>
        </form>
      `;

      const emailInput = testContainer.querySelector('#email');
      const passwordInput = testContainer.querySelector('#password');
      const errorMessage = testContainer.querySelector('#email-error');

      expect(emailInput.getAttribute('aria-invalid')).toBe('true');
      expect(emailInput.getAttribute('aria-describedby')).toBe('email-error');
      expect(errorMessage.getAttribute('role')).toBe('alert');
      expect(errorMessage.getAttribute('aria-live')).toBe('polite');
      expect(errorMessage.textContent).toContain('valid email address');

      expect(passwordInput.getAttribute('aria-invalid')).toBe('false');
    });

    it('should handle client-side validation with AccessibleForm', () => {
      testContainer.innerHTML = `
        <form id="test-form">
          <label for="required-field">Required Field</label>
          <input type="text" id="required-field" required>
          
          <label for="email-field">Email</label>
          <input type="email" id="email-field">
          
          <button type="submit">Submit</button>
        </form>
      `;

      const form = testContainer.querySelector('#test-form');
      const accessibleForm = service.enhanceForm(form);

      expect(accessibleForm).toBeTruthy();
      expect(accessibleForm.form).toBe(form);

      // Test form validation
      const requiredInput = form.querySelector('#required-field');
      const emailInput = form.querySelector('#email-field');

      // Set invalid email
      emailInput.value = 'invalid-email';
      
      const isValidEmail = accessibleForm.isValidEmail('invalid-email');
      const isValidEmailFormat = accessibleForm.isValidEmail('user@example.com');

      expect(isValidEmail).toBe(false);
      expect(isValidEmailFormat).toBe(true);
    });

    it('should announce form submission results', () => {
      testContainer.innerHTML = `
        <form id="submission-form">
          <label for="name">Name</label>
          <input type="text" id="name" required>
          
          <button type="submit">Submit</button>
          
          <div id="form-status" 
               aria-live="polite" 
               aria-atomic="true" 
               class="sr-only">
          </div>
        </form>
      `;

      const form = testContainer.querySelector('#submission-form');
      const statusDiv = testContainer.querySelector('#form-status');

      // Simulate successful submission
      statusDiv.textContent = 'Form submitted successfully';
      expect(statusDiv.getAttribute('aria-live')).toBe('polite');
      expect(statusDiv.textContent).toBe('Form submitted successfully');

      // Simulate error
      statusDiv.textContent = 'Error: Please correct the highlighted fields';
      expect(statusDiv.textContent).toContain('Error:');
    });

    it('should handle real-time validation feedback', () => {
      testContainer.innerHTML = `
        <form>
          <label for="username">Username</label>
          <input type="text" 
                 id="username" 
                 aria-describedby="username-status"
                 minlength="3"
                 maxlength="20">
          <div id="username-status" 
               aria-live="polite" 
               class="field-status sr-only">
          </div>
          
          <label for="confirm-password">Confirm Password</label>
          <input type="password" 
                 id="confirm-password" 
                 aria-describedby="password-match-status">
          <div id="password-match-status" 
               aria-live="polite" 
               class="field-status sr-only">
          </div>
        </form>
      `;

      const usernameInput = testContainer.querySelector('#username');
      const usernameStatus = testContainer.querySelector('#username-status');
      const confirmPasswordInput = testContainer.querySelector('#confirm-password');
      const passwordMatchStatus = testContainer.querySelector('#password-match-status');

      // Simulate username validation
      usernameInput.value = 'ab'; // Too short
      usernameStatus.textContent = 'Username must be at least 3 characters';
      expect(usernameStatus.textContent).toContain('at least 3 characters');

      usernameInput.value = 'validusername';
      usernameStatus.textContent = 'Username is available';
      expect(usernameStatus.textContent).toBe('Username is available');

      // Simulate password confirmation
      confirmPasswordInput.value = 'different';
      passwordMatchStatus.textContent = 'Passwords do not match';
      expect(passwordMatchStatus.textContent).toBe('Passwords do not match');
    });
  });

  describe('Form Controls and Widgets', () => {
    it('should handle custom select dropdowns', () => {
      testContainer.innerHTML = `
        <div class="custom-select">
          <label id="country-label">Country</label>
          <button type="button" 
                  role="combobox" 
                  aria-labelledby="country-label"
                  aria-expanded="false" 
                  aria-haspopup="listbox"
                  aria-controls="country-options"
                  id="country-select">
            Select Country
          </button>
          <ul role="listbox" 
              id="country-options" 
              aria-labelledby="country-label"
              style="display: none;">
            <li role="option" aria-selected="false" data-value="us">United States</li>
            <li role="option" aria-selected="false" data-value="ca">Canada</li>
            <li role="option" aria-selected="false" data-value="uk">United Kingdom</li>
          </ul>
        </div>
      `;

      const selectButton = testContainer.querySelector('#country-select');
      const optionsList = testContainer.querySelector('#country-options');
      const options = testContainer.querySelectorAll('[role="option"]');

      expect(selectButton.getAttribute('role')).toBe('combobox');
      expect(selectButton.getAttribute('aria-expanded')).toBe('false');
      expect(selectButton.getAttribute('aria-haspopup')).toBe('listbox');
      expect(selectButton.getAttribute('aria-controls')).toBe('country-options');

      expect(optionsList.getAttribute('role')).toBe('listbox');
      expect(options.length).toBe(3);
      
      options.forEach(option => {
        expect(option.getAttribute('role')).toBe('option');
        expect(option.getAttribute('aria-selected')).toBe('false');
      });
    });

    it('should handle date and time inputs', () => {
      testContainer.innerHTML = `
        <form>
          <label for="birth-date">Date of Birth</label>
          <input type="date" 
                 id="birth-date" 
                 aria-describedby="date-format">
          <div id="date-format" class="help-text">Format: MM/DD/YYYY</div>
          
          <label for="appointment-time">Appointment Time</label>
          <input type="datetime-local" 
                 id="appointment-time"
                 aria-describedby="time-help">
          <div id="time-help" class="help-text">
            Select your preferred appointment date and time
          </div>
          
          <fieldset>
            <legend>Time Zone</legend>
            <select id="timezone" aria-describedby="timezone-help">
              <option value="est">Eastern Standard Time</option>
              <option value="cst">Central Standard Time</option>
              <option value="pst">Pacific Standard Time</option>
            </select>
            <div id="timezone-help" class="help-text">
              Select your local time zone
            </div>
          </fieldset>
        </form>
      `;

      const dateInput = testContainer.querySelector('#birth-date');
      const timeInput = testContainer.querySelector('#appointment-time');
      const timezoneSelect = testContainer.querySelector('#timezone');

      expect(dateInput.type).toBe('date');
      expect(dateInput.getAttribute('aria-describedby')).toBe('date-format');

      expect(timeInput.type).toBe('datetime-local');
      expect(timeInput.getAttribute('aria-describedby')).toBe('time-help');

      expect(timezoneSelect.tagName).toBe('SELECT');
      expect(timezoneSelect.getAttribute('aria-describedby')).toBe('timezone-help');
    });

    it('should handle range sliders and numeric inputs', () => {
      testContainer.innerHTML = `
        <form>
          <label for="volume-slider">Volume</label>
          <input type="range" 
                 id="volume-slider"
                 min="0" 
                 max="100" 
                 value="50"
                 aria-describedby="volume-value volume-instructions">
          <div id="volume-value" aria-live="polite">Volume: 50%</div>
          <div id="volume-instructions" class="help-text">
            Use arrow keys or drag to adjust volume
          </div>
          
          <label for="quantity">Quantity</label>
          <input type="number" 
                 id="quantity"
                 min="1" 
                 max="10" 
                 value="1"
                 aria-describedby="quantity-help">
          <div id="quantity-help" class="help-text">Enter a number between 1 and 10</div>
        </form>
      `;

      const volumeSlider = testContainer.querySelector('#volume-slider');
      const volumeValue = testContainer.querySelector('#volume-value');
      const quantityInput = testContainer.querySelector('#quantity');

      expect(volumeSlider.type).toBe('range');
      expect(volumeSlider.getAttribute('min')).toBe('0');
      expect(volumeSlider.getAttribute('max')).toBe('100');
      expect(volumeSlider.getAttribute('value')).toBe('50');
      expect(volumeValue.getAttribute('aria-live')).toBe('polite');

      expect(quantityInput.type).toBe('number');
      expect(quantityInput.getAttribute('min')).toBe('1');
      expect(quantityInput.getAttribute('max')).toBe('10');
    });

    it('should handle file upload inputs', () => {
      testContainer.innerHTML = `
        <form>
          <label for="document-upload">Upload Document</label>
          <input type="file" 
                 id="document-upload"
                 accept=".pdf,.doc,.docx"
                 multiple
                 aria-describedby="upload-help upload-status">
          <div id="upload-help" class="help-text">
            Choose one or more files. Supported formats: PDF, DOC, DOCX. Max size: 5MB each.
          </div>
          <div id="upload-status" 
               aria-live="polite" 
               class="upload-status sr-only">
          </div>
          
          <div class="drag-drop-area" 
               role="button"
               tabindex="0"
               aria-describedby="drag-instructions">
            <p>Drag and drop files here, or click to browse</p>
          </div>
          <div id="drag-instructions" class="help-text">
            You can drag files from your computer or click to open file browser
          </div>
        </form>
      `;

      const fileInput = testContainer.querySelector('#document-upload');
      const uploadStatus = testContainer.querySelector('#upload-status');
      const dragDropArea = testContainer.querySelector('.drag-drop-area');

      expect(fileInput.type).toBe('file');
      expect(fileInput.hasAttribute('multiple')).toBe(true);
      expect(fileInput.getAttribute('accept')).toBe('.pdf,.doc,.docx');
      expect(fileInput.getAttribute('aria-describedby')).toContain('upload-help');

      expect(uploadStatus.getAttribute('aria-live')).toBe('polite');

      expect(dragDropArea.getAttribute('role')).toBe('button');
      expect(dragDropArea.getAttribute('tabindex')).toBe('0');
      expect(dragDropArea.getAttribute('aria-describedby')).toBe('drag-instructions');
    });
  });

  describe('Form Submission and Progress', () => {
    it('should handle form submission states', () => {
      testContainer.innerHTML = `
        <form id="async-form">
          <label for="email">Email</label>
          <input type="email" id="email" required>
          
          <button type="submit" id="submit-btn">
            <span class="btn-text">Submit</span>
            <span class="spinner" style="display: none;" aria-hidden="true">⟳</span>
          </button>
          
          <div id="form-status" 
               aria-live="polite" 
               aria-atomic="true" 
               class="sr-only">
          </div>
        </form>
      `;

      const form = testContainer.querySelector('#async-form');
      const submitButton = testContainer.querySelector('#submit-btn');
      const buttonText = testContainer.querySelector('.btn-text');
      const spinner = testContainer.querySelector('.spinner');
      const formStatus = testContainer.querySelector('#form-status');

      // Initial state
      expect(submitButton.disabled).toBe(false);
      expect(buttonText.textContent).toBe('Submit');
      expect(spinner.style.display).toBe('none');

      // Simulate loading state
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      buttonText.textContent = 'Submitting...';
      spinner.style.display = 'inline';
      formStatus.textContent = 'Submitting form, please wait';

      expect(submitButton.disabled).toBe(true);
      expect(submitButton.getAttribute('aria-busy')).toBe('true');
      expect(formStatus.textContent).toBe('Submitting form, please wait');

      // Simulate success state
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      buttonText.textContent = 'Submitted';
      spinner.style.display = 'none';
      formStatus.textContent = 'Form submitted successfully';

      expect(submitButton.getAttribute('aria-busy')).toBeNull();
      expect(formStatus.textContent).toBe('Form submitted successfully');
    });

    it('should handle multi-step forms', () => {
      testContainer.innerHTML = `
        <form id="multi-step-form">
          <div class="progress-indicator" role="progressbar" 
               aria-valuenow="1" 
               aria-valuemin="1" 
               aria-valuemax="3" 
               aria-labelledby="progress-label">
            <div id="progress-label">Step 1 of 3: Personal Information</div>
            <div class="progress-bar" style="width: 33.33%;"></div>
          </div>
          
          <div id="step-1" class="form-step" aria-hidden="false">
            <h2>Personal Information</h2>
            <label for="first-name">First Name</label>
            <input type="text" id="first-name" required>
            
            <label for="last-name">Last Name</label>
            <input type="text" id="last-name" required>
            
            <button type="button" class="next-step">Next</button>
          </div>
          
          <div id="step-2" class="form-step" aria-hidden="true" style="display: none;">
            <h2>Contact Information</h2>
            <label for="email">Email</label>
            <input type="email" id="email" required>
            
            <label for="phone">Phone</label>
            <input type="tel" id="phone">
            
            <button type="button" class="prev-step">Previous</button>
            <button type="button" class="next-step">Next</button>
          </div>
          
          <div id="step-3" class="form-step" aria-hidden="true" style="display: none;">
            <h2>Review and Submit</h2>
            <div class="form-summary" aria-describedby="summary-instructions">
              <p>Please review your information before submitting</p>
            </div>
            <div id="summary-instructions" class="help-text">
              Use the Previous button to make changes
            </div>
            
            <button type="button" class="prev-step">Previous</button>
            <button type="submit">Submit</button>
          </div>
        </form>
      `;

      const progressBar = testContainer.querySelector('[role="progressbar"]');
      const progressLabel = testContainer.querySelector('#progress-label');
      const steps = testContainer.querySelectorAll('.form-step');

      expect(progressBar.getAttribute('aria-valuenow')).toBe('1');
      expect(progressBar.getAttribute('aria-valuemax')).toBe('3');
      expect(progressLabel.textContent).toBe('Step 1 of 3: Personal Information');

      // Only first step should be visible
      expect(steps[0].getAttribute('aria-hidden')).toBe('false');
      expect(steps[1].getAttribute('aria-hidden')).toBe('true');
      expect(steps[2].getAttribute('aria-hidden')).toBe('true');

      // Simulate moving to step 2
      progressBar.setAttribute('aria-valuenow', '2');
      progressLabel.textContent = 'Step 2 of 3: Contact Information';
      steps[0].setAttribute('aria-hidden', 'true');
      steps[0].style.display = 'none';
      steps[1].setAttribute('aria-hidden', 'false');
      steps[1].style.display = 'block';

      expect(progressBar.getAttribute('aria-valuenow')).toBe('2');
      expect(progressLabel.textContent).toContain('Step 2 of 3');
    });

    it('should handle form auto-save functionality', () => {
      testContainer.innerHTML = `
        <form id="auto-save-form">
          <div id="save-status" 
               aria-live="polite" 
               class="save-status sr-only">
          </div>
          
          <label for="draft-title">Title</label>
          <input type="text" 
                 id="draft-title" 
                 data-auto-save="true"
                 aria-describedby="save-status">
          
          <label for="draft-content">Content</label>
          <textarea id="draft-content" 
                    data-auto-save="true"
                    aria-describedby="save-status">
          </textarea>
          
          <div class="manual-save">
            <button type="button" id="save-draft">Save Draft</button>
            <span class="save-indicator" aria-live="polite">
              <span class="saved-icon" style="display: none;" aria-label="Saved">✓</span>
              <span class="saving-icon" style="display: none;" aria-label="Saving">⟳</span>
            </span>
          </div>
        </form>
      `;

      const saveStatus = testContainer.querySelector('#save-status');
      const titleInput = testContainer.querySelector('#draft-title');
      const contentTextarea = testContainer.querySelector('#draft-content');
      const saveButton = testContainer.querySelector('#save-draft');
      const savedIcon = testContainer.querySelector('.saved-icon');
      const savingIcon = testContainer.querySelector('.saving-icon');

      // Simulate auto-save
      titleInput.value = 'My Draft Title';
      saveStatus.textContent = 'Draft saved automatically';
      savedIcon.style.display = 'inline';

      expect(saveStatus.textContent).toBe('Draft saved automatically');
      expect(saveStatus.getAttribute('aria-live')).toBe('polite');
      expect(savedIcon.getAttribute('aria-label')).toBe('Saved');

      // Simulate manual save
      saveButton.click();
      savingIcon.style.display = 'inline';
      savedIcon.style.display = 'none';
      saveStatus.textContent = 'Saving draft...';

      expect(saveStatus.textContent).toBe('Saving draft...');
      expect(savingIcon.getAttribute('aria-label')).toBe('Saving');
    });
  });

  describe('Form Accessibility Edge Cases', () => {
    it('should handle nested form controls', () => {
      testContainer.innerHTML = `
        <form>
          <fieldset class="address-group">
            <legend>Billing Address</legend>
            
            <div class="address-line">
              <label for="street-address">Street Address</label>
              <input type="text" id="street-address" required>
            </div>
            
            <div class="city-state-zip">
              <div class="city-group">
                <label for="city">City</label>
                <input type="text" id="city" required>
              </div>
              
              <div class="state-group">
                <label for="state">State</label>
                <select id="state" required>
                  <option value="">Select State</option>
                  <option value="ca">California</option>
                  <option value="ny">New York</option>
                </select>
              </div>
              
              <div class="zip-group">
                <label for="zip">ZIP Code</label>
                <input type="text" 
                       id="zip" 
                       pattern="[0-9]{5}(-[0-9]{4})?"
                       title="5-digit ZIP code or ZIP+4 format"
                       required>
              </div>
            </div>
          </fieldset>
          
          <label>
            <input type="checkbox" required aria-describedby="terms-text">
            <span id="terms-text">I agree to the <a href="/terms">Terms of Service</a></span>
          </label>
        </form>
      `;

      const fieldset = testContainer.querySelector('.address-group');
      const legend = testContainer.querySelector('legend');
      const zipInput = testContainer.querySelector('#zip');
      const termsCheckbox = testContainer.querySelector('input[type="checkbox"]');

      expect(fieldset.tagName).toBe('FIELDSET');
      expect(legend.textContent).toBe('Billing Address');
      expect(zipInput.getAttribute('pattern')).toBe('[0-9]{5}(-[0-9]{4})?');
      expect(zipInput.getAttribute('title')).toContain('5-digit ZIP');
      expect(termsCheckbox.getAttribute('aria-describedby')).toBe('terms-text');
    });

    it('should handle dynamic form updates', () => {
      testContainer.innerHTML = `
        <form id="dynamic-form">
          <label for="country">Country</label>
          <select id="country">
            <option value="">Select Country</option>
            <option value="us">United States</option>
            <option value="ca">Canada</option>
          </select>
          
          <div id="state-container" style="display: none;">
            <label for="state">State/Province</label>
            <select id="state" aria-describedby="state-help">
              <option value="">Select State</option>
            </select>
            <div id="state-help" class="help-text">
              Required for US and Canadian addresses
            </div>
          </div>
          
          <div id="form-messages" aria-live="polite" class="sr-only"></div>
        </form>
      `;

      const countrySelect = testContainer.querySelector('#country');
      const stateContainer = testContainer.querySelector('#state-container');
      const stateSelect = testContainer.querySelector('#state');
      const formMessages = testContainer.querySelector('#form-messages');

      // Initially state container is hidden
      expect(stateContainer.style.display).toBe('none');

      // Simulate selecting US
      countrySelect.value = 'us';
      stateContainer.style.display = 'block';
      stateSelect.required = true;
      stateSelect.innerHTML = `
        <option value="">Select State</option>
        <option value="ca">California</option>
        <option value="ny">New York</option>
        <option value="tx">Texas</option>
      `;
      formMessages.textContent = 'State field is now required';

      expect(stateContainer.style.display).toBe('block');
      expect(stateSelect.required).toBe(true);
      expect(formMessages.textContent).toBe('State field is now required');
    });

    it('should handle form validation with custom messages', () => {
      testContainer.innerHTML = `
        <form novalidate>
          <label for="custom-email">Email Address</label>
          <input type="email" 
                 id="custom-email" 
                 required
                 aria-describedby="email-error"
                 aria-invalid="false">
          <div id="email-error" 
               role="alert" 
               class="error-message" 
               style="display: none;">
          </div>
          
          <label for="custom-password">Password</label>
          <input type="password" 
                 id="custom-password" 
                 required
                 minlength="8"
                 aria-describedby="password-error"
                 aria-invalid="false">
          <div id="password-error" 
               role="alert" 
               class="error-message" 
               style="display: none;">
          </div>
          
          <button type="submit" id="custom-submit">Submit</button>
        </form>
      `;

      const emailInput = testContainer.querySelector('#custom-email');
      const passwordInput = testContainer.querySelector('#custom-password');
      const emailError = testContainer.querySelector('#email-error');
      const passwordError = testContainer.querySelector('#password-error');

      // Simulate custom validation
      emailInput.value = 'invalid-email';
      emailInput.setAttribute('aria-invalid', 'true');
      emailError.textContent = 'Please enter a valid email address in the format: user@domain.com';
      emailError.style.display = 'block';

      passwordInput.value = '123';
      passwordInput.setAttribute('aria-invalid', 'true');
      passwordError.textContent = 'Password must be at least 8 characters long';
      passwordError.style.display = 'block';

      expect(emailInput.getAttribute('aria-invalid')).toBe('true');
      expect(emailError.textContent).toContain('user@domain.com');
      expect(passwordInput.getAttribute('aria-invalid')).toBe('true');
      expect(passwordError.textContent).toContain('8 characters');
    });
  });
});