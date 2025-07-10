// Add Child Account Form Component
// Allows parents to add child accounts to their family

import FormComponent from '../../components/forms/FormComponent.js';
import authService from './authService.js';

class AddChildForm extends FormComponent {
  constructor(options = {}) {
    const defaultOptions = {
      id: 'add-child-form',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Child\'s Name',
          placeholder: 'Enter child\'s full name',
          required: true,
          validate: (value) => {
            if (!value || value.trim().length < 1) {
              return 'Child\'s name is required';
            }
            if (value.trim().length < 2) {
              return 'Name must be at least 2 characters long';
            }
            return true;
          }
        },
        {
          name: 'username',
          type: 'text',
          label: 'Username',
          placeholder: 'Choose a unique username',
          required: true,
          helpText: 'Username will be used for switching between accounts',
          validate: (value) => {
            if (!value || value.length < 3) {
              return 'Username must be at least 3 characters long';
            }
            if (!/^[a-zA-Z0-9_]+$/.test(value)) {
              return 'Username can only contain letters, numbers, and underscores';
            }
            return true;
          }
        },
        {
          name: 'age',
          type: 'number',
          label: 'Age',
          placeholder: 'Enter child\'s age',
          min: 3,
          max: 17,
          helpText: 'Age helps us provide appropriate content and features'
        },
        {
          name: 'grade',
          type: 'select',
          label: 'Grade Level',
          options: [
            { value: '', label: 'Select grade level (optional)' },
            { value: 'preschool', label: 'Preschool' },
            { value: 'kindergarten', label: 'Kindergarten' },
            { value: '1', label: '1st Grade' },
            { value: '2', label: '2nd Grade' },
            { value: '3', label: '3rd Grade' },
            { value: '4', label: '4th Grade' },
            { value: '5', label: '5th Grade' },
            { value: '6', label: '6th Grade' },
            { value: '7', label: '7th Grade' },
            { value: '8', label: '8th Grade' },
            { value: '9', label: '9th Grade' },
            { value: '10', label: '10th Grade' },
            { value: '11', label: '11th Grade' },
            { value: '12', label: '12th Grade' }
          ],
          helpText: 'Grade level helps us customize the learning experience'
        },
        {
          name: 'avatar',
          type: 'select',
          label: 'Choose Avatar',
          options: [
            { value: 'default', label: 'Default Avatar' },
            { value: 'elephant', label: '🐘 Elephant (Math)' },
            { value: 'owl', label: '🦉 Owl (Science)' },
            { value: 'rabbit', label: '🐰 Rabbit (Reading)' },
            { value: 'cat', label: '🐱 Cat (Art)' },
            { value: 'monkey', label: '🐵 Monkey (Coding)' },
            { value: 'dolphin', label: '🐬 Dolphin (Music)' },
            { value: 'penguin', label: '🐧 Penguin (Geography)' },
            { value: 'lion', label: '🦁 Lion (History)' },
            { value: 'fox', label: '🦊 Fox (Language)' }
          ],
          value: 'default',
          helpText: 'Choose a fun avatar for your child'
        }
      ],
      submitButtonText: 'Add Child Account',
      onSubmit: (data, _formInstance) => this.handleAddChild(data, _formInstance)
    };

    super({ ...defaultOptions, ...options });
    
    this.authService = authService;
    this.isProcessing = false;
  }

  async handleAddChild(data, _formInstance) {
    if (this.isProcessing) return;
    
    // Check if user can add children
    if (!this.authService.canManageFamily()) {
      this.showErrorMessage('Only parents can add child accounts');
      return;
    }
    
    this.isProcessing = true;
    this.showLoadingState();
    
    try {
      // Prepare child data
      const childData = {
        username: data.username,
        name: data.name,
        age: data.age ? parseInt(data.age) : null,
        grade: data.grade || null,
        avatar: data.avatar || 'default'
      };
      
      // Add child account
      const result = await this.authService.addChildAccount(childData);
      
      if (result.success) {
        this.showSuccessMessage(`Child account created successfully for ${childData.name}!`);
        
        // Dispatch success event
        this.dispatchEvent('childAccountAdded', {
          child: result.child
        });
        
        // Reset form after delay
        setTimeout(() => {
          this.reset();
        }, 2000);
        
      } else {
        this.showErrorMessage(result.error || 'Failed to create child account. Please try again.');
      }
      
    } catch (error) {
      console.error('Add child error:', error);
      this.showErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      this.isProcessing = false;
      this.hideLoadingState();
    }
  }

  showLoadingState() {
    const submitButton = this.element?.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Creating Account...';
      submitButton.classList.add('loading');
    }
  }

  hideLoadingState() {
    const submitButton = this.element?.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = this.options.submitButtonText;
      submitButton.classList.remove('loading');
    }
  }

  showSuccessMessage(message) {
    this.clearMessages();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'form-success-message';
    messageDiv.textContent = message;
    
    if (this.element) {
      this.element.insertBefore(messageDiv, this.element.firstChild);
    }
  }

  showErrorMessage(message) {
    this.clearMessages();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'form-error-message';
    messageDiv.textContent = message;
    
    if (this.element) {
      this.element.insertBefore(messageDiv, this.element.firstChild);
    }
  }

  clearMessages() {
    if (this.element) {
      const successMessages = this.element.querySelectorAll('.form-success-message');
      const errorMessages = this.element.querySelectorAll('.form-error-message');
      
      successMessages.forEach(msg => msg.remove());
      errorMessages.forEach(msg => msg.remove());
    }
  }

  render(container) {
    // Call parent render method
    super.render(container);
    
    // Add specific styling
    if (this.element) {
      this.element.classList.add('add-child-form');
    }
    
    // Add real-time username availability checking
    this.addUsernameValidation();
    
    return this;
  }

  addUsernameValidation() {
    if (!this.element) return;
    
    const usernameField = this.element.querySelector('[name="username"]');
    if (!usernameField) return;
    
    let validationTimeout;
    
    usernameField.addEventListener('input', () => {
      clearTimeout(validationTimeout);
      
      validationTimeout = setTimeout(() => {
        const username = usernameField.value;
        if (username.length >= 3) {
          this.checkUsernameAvailability(username);
        }
      }, 500);
    });
  }

  checkUsernameAvailability(username) {
    const existingUser = this.authService.getUserByUsername(username);
    const usernameField = this.element.querySelector('[name="username"]');
    
    if (existingUser) {
      this.showFieldError('username', 'Username is already taken');
      usernameField.classList.add('invalid');
    } else {
      this.clearFieldError('username');
      usernameField.classList.remove('invalid');
    }
  }

  showFieldError(fieldName, message) {
    if (!this.element) return;
    
    const field = this.element.querySelector(`[name="${fieldName}"]`);
    const errorElement = this.element.querySelector(`#${this.options.id}-${fieldName}-error`);
    
    if (field) {
      field.classList.add('invalid');
    }
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearFieldError(fieldName) {
    if (!this.element) return;
    
    const field = this.element.querySelector(`[name="${fieldName}"]`);
    const errorElement = this.element.querySelector(`#${this.options.id}-${fieldName}-error`);
    
    if (field) {
      field.classList.remove('invalid');
    }
    
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  // Dispatch custom events
  dispatchEvent(eventType, data) {
    const event = new CustomEvent(eventType, {
      detail: data,
      bubbles: true,
      cancelable: false
    });
    
    if (this.element) {
      this.element.dispatchEvent(event);
    } else {
      document.dispatchEvent(event);
    }
  }
}

export default AddChildForm;