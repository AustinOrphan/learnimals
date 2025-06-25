// Form Component
// Reusable form component for consistent UI and validation across the site

import BaseComponent from '../BaseComponent.js';

class FormComponent extends BaseComponent {
  /**
   * Create a form component
   * @param {Object} options - Form options
   * @param {string} options.id - Form ID
   * @param {string} [options.method] - Form method (get, post)
   * @param {string} [options.action] - Form action URL
   * @param {Array} options.fields - Form field definitions
   * @param {Function} [options.onSubmit] - Function to call on submit
   * @param {Function} [options.onValidate] - Function to call for custom validation
   * @param {string} [options.submitButtonText] - Text for submit button
   * @param {boolean} [options.useLocalStorage] - Store form data in localStorage
   */
  constructor(options) {
    super({
      method: options.method || 'get',
      action: options.action || '',
      fields: options.fields || [],
      onSubmit: options.onSubmit || null,
      onValidate: options.onValidate || null,
      submitButtonText: options.submitButtonText || 'Submit',
      useLocalStorage: options.useLocalStorage || false,
      storageKey: options.storageKey || `form-data-${options.id || ''}`,
      ...options
    });

    this.formData = {};
    this.errors = {};

    // Initialize
    if (this.options.useLocalStorage) {
      this.loadFromLocalStorage();
    }
  }

  /**
   * Generate a single form field
   * @param {Object} field - Field definition
   * @returns {string} - Field HTML
   */
  generateFieldHTML(field) {
    const {
      name,
      type = 'text',
      label,
      placeholder = '',
      value = '',
      required = false,
      options = [],
      min,
      max,
      pattern,
      helpText,
      cssClasses = []
    } = field;

    // Generate unique ID for the field
    const fieldId = `${this.options.id}-${name}`;
    
    // Common attributes
    const requiredAttr = required ? 'required' : '';
    const minAttr = min !== undefined ? `min="${min}"` : '';
    const maxAttr = max !== undefined ? `max="${max}"` : '';
    const patternAttr = pattern ? `pattern="${pattern}"` : '';
    const cssClass = ['form-field', ...cssClasses].join(' ');
    const ariaDescribedBy = helpText ? `aria-describedby="${fieldId}-help"` : '';
    
    // Field wrapper
    let html = `<div class="${cssClass}">`;
    
    // Label
    if (label) {
      html += `<label for="${fieldId}" class="component-label">${label}${required ? ' <span class="required">*</span>' : ''}</label>`;
    }
    
    // Field based on type
    switch (type) {
    case 'textarea':
      html += `
          <textarea 
            id="${fieldId}" 
            name="${name}" 
            placeholder="${placeholder}"
            class="component-input"
            ${requiredAttr}
            ${ariaDescribedBy}
            rows="4"
          >${value}</textarea>
        `;
      break;
        
    case 'select':
      html += `
          <select 
            id="${fieldId}" 
            name="${name}"
            class="component-input"
            ${requiredAttr}
            ${ariaDescribedBy}
          >
        `;
        
      // Add options
      options.forEach(opt => {
        const isSelected = opt.value === value ? 'selected' : '';
        html += `<option value="${opt.value}" ${isSelected}>${opt.label}</option>`;
      });
        
      html += '</select>';
      break;
        
    case 'radio':
    case 'checkbox':
      html += '<div class="option-group">';
        
      options.forEach((opt, index) => {
        const optionId = `${fieldId}-${index}`;
        const isChecked = 
            (type === 'checkbox' && Array.isArray(value) && value.includes(opt.value)) || 
            (type === 'radio' && opt.value === value) ? 
              'checked' : '';
            
        html += `
            <div class="option-item">
              <input 
                type="${type}" 
                id="${optionId}" 
                name="${name}" 
                value="${opt.value}"
                ${isChecked}
                ${requiredAttr}
              >
              <label for="${optionId}">${opt.label}</label>
            </div>
          `;
      });
        
      html += '</div>';
      break;
        
    default:
      // Default to normal input field
      html += `
          <input 
            type="${type}" 
            id="${fieldId}" 
            name="${name}" 
            value="${value}"
            placeholder="${placeholder}"
            class="component-input"
            ${requiredAttr}
            ${minAttr}
            ${maxAttr}
            ${patternAttr}
            ${ariaDescribedBy}
          >
        `;
    }
    
    // Help text
    if (helpText) {
      html += `<div class="component-help" id="${fieldId}-help">${helpText}</div>`;
    }
    
    // Error message container
    html += `<div class="component-error" id="${fieldId}-error"></div>`;
    
    html += '</div>';
    
    return html;
  }

  /**
   * Generate the form HTML
   * @returns {string} - Form HTML
   */
  generateHTML() {
    const { id, method, action, fields, submitButtonText } = this.options;
    
    let html = `
      <form id="${id}" class="component" method="${method}" action="${action}" novalidate>
    `;
    
    // Generate fields
    fields.forEach(field => {
      html += this.generateFieldHTML(field);
    });
    
    // Submit button
    html += `
        <div class="form-actions">
          <button type="submit" class="component-button component-button--primary">${submitButtonText}</button>
        </div>
      </form>
    `;
    
    return html;
  }


  /**
   * Attach event listeners to the form
   */
  attachEventListeners() {
    // Add submit handler
    this.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    
    // Add input handlers for live validation
    this.options.fields.forEach(field => {
      // Input change handling
      this.addEventListener('input', () => {
        this.validateField(field.name);
        
        // Save to localStorage if enabled
        if (this.options.useLocalStorage) {
          this.saveToLocalStorage();
        }
        
        // Emit field change event
        this.emit('fieldChange', { field: field.name, value: this.getFieldValue(field.name) });
      }, `[name="${field.name}"]`);
      
      // Blur handling for validation
      this.addEventListener('blur', () => {
        this.validateField(field.name);
      }, `[name="${field.name}"]`);
    });
  }
  
  /**
   * Get value of a specific field
   * @param {string} fieldName - Name of the field
   * @returns {*} - Field value
   */
  getFieldValue(fieldName) {
    if (!this.element) return null;
    
    const input = this.element.querySelector(`[name="${fieldName}"]`);
    return input ? input.value : null;
  }

  /**
   * Get form data
   * @returns {Object} - Current form data
   */
  getFormData() {
    if (!this.element) return this.formData;
    
    const formData = new FormData(this.element);
    const data = {};
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      // Handle multiple checkboxes with same name
      if (key in data) {
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }
    
    // Update internal formData
    this.formData = data;
    
    return data;
  }

  /**
   * Validate a single field
   * @param {string} fieldName - Name of the field to validate
   * @returns {boolean} - Is field valid
   */
  validateField(fieldName) {
    const form = document.getElementById(this.options.id);
    if (!form) return true;
    
    const field = this.options.fields.find(f => f.name === fieldName);
    if (!field) return true;
    
    const input = form.querySelector(`[name="${fieldName}"]`);
    if (!input) return true;
    
    const errorElement = document.getElementById(`${this.options.id}-${fieldName}-error`);
    
    // Clear previous error
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
      input.classList.remove('invalid');
    }
    
    let isValid = true;
    let errorMessage = '';
    
    // Check built-in validation
    if (!input.checkValidity()) {
      isValid = false;
      errorMessage = input.validationMessage;
    }
    
    // Custom validation rules
    if (isValid && field.validate) {
      const value = input.value;
      try {
        const customValid = field.validate(value, this.getFormData());
        if (customValid !== true) {
          isValid = false;
          errorMessage = customValid || 'Invalid input';
        }
      } catch (err) {
        isValid = false;
        errorMessage = err.message || 'Validation error';
      }
    }
    
    // Show error if invalid
    if (!isValid && errorElement) {
      errorElement.textContent = errorMessage;
      errorElement.style.display = 'block';
      input.classList.add('invalid');
      
      // Store error
      this.errors[fieldName] = errorMessage;
    } else {
      // Clear error
      delete this.errors[fieldName];
    }
    
    return isValid;
  }

  /**
   * Validate the entire form
   * @returns {boolean} - Is form valid
   */
  validate() {
    let isValid = true;
    
    // Validate all fields
    this.options.fields.forEach(field => {
      if (!this.validateField(field.name)) {
        isValid = false;
      }
    });
    
    // Run custom validation if provided
    if (isValid && this.options.onValidate) {
      try {
        const customValid = this.options.onValidate(this.getFormData());
        if (customValid !== true) {
          isValid = false;
          
          // Show general error
          const form = document.getElementById(this.options.id);
          if (form) {
            let errorEl = form.querySelector('.form-general-error');
            if (!errorEl) {
              errorEl = document.createElement('div');
              errorEl.className = 'form-general-error';
              form.insertBefore(errorEl, form.querySelector('.form-actions'));
            }
            errorEl.textContent = typeof customValid === 'string' ? customValid : 'Form validation failed';
            errorEl.style.display = 'block';
          }
        }
      } catch (err) {
        isValid = false;
        console.error('Validation error:', err);
      }
    }
    
    return isValid;
  }

  /**
   * Handle form submission
   */
  handleSubmit() {
    const data = this.getFormData();
    
    // Validate form
    if (!this.validate()) {
      return;
    }
    
    // Clear general error if it exists
    const form = document.getElementById(this.options.id);
    const generalError = form.querySelector('.form-general-error');
    if (generalError) {
      generalError.style.display = 'none';
    }
    
    // Call onSubmit handler if provided
    if (this.options.onSubmit) {
      try {
        this.options.onSubmit(data, form);
      } catch (err) {
        console.error('Submit error:', err);
        
        // Show error
        if (!generalError) {
          const errorEl = document.createElement('div');
          errorEl.className = 'form-general-error';
          form.insertBefore(errorEl, form.querySelector('.form-actions'));
          errorEl.textContent = 'Form submission failed';
          errorEl.style.display = 'block';
        }
      }
    } else {
      // If no custom handler, submit the form normally
      form.submit();
    }
  }

  /**
   * Save form data to localStorage
   */
  saveToLocalStorage() {
    if (!this.options.useLocalStorage) return;
    
    try {
      const data = this.getFormData();
      localStorage.setItem(this.options.storageKey, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save form data to localStorage:', err);
    }
  }

  /**
   * Load form data from localStorage
   */
  loadFromLocalStorage() {
    if (!this.options.useLocalStorage) return;
    
    try {
      const dataStr = localStorage.getItem(this.options.storageKey);
      if (dataStr) {
        this.formData = JSON.parse(dataStr);
        
        // Update field values in options
        this.options.fields = this.options.fields.map(field => {
          if (field.name in this.formData) {
            return { ...field, value: this.formData[field.name] };
          }
          return field;
        });
      }
    } catch (err) {
      console.error('Failed to load form data from localStorage:', err);
    }
  }

  /**
   * Reset the form
   */
  reset() {
    const form = document.getElementById(this.options.id);
    if (form) {
      form.reset();
      
      // Clear errors
      this.errors = {};
      
      // Clear error displays
      const errorElements = form.querySelectorAll('.error-message');
      errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
      });
      
      // Remove invalid classes
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.classList.remove('invalid');
      });
      
      // Clear general error
      const generalError = form.querySelector('.form-general-error');
      if (generalError) {
        generalError.style.display = 'none';
      }
      
      // Clear localStorage if used
      if (this.options.useLocalStorage) {
        localStorage.removeItem(this.options.storageKey);
        this.formData = {};
      }
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormComponent;
} else {
  window.FormComponent = FormComponent;
}
