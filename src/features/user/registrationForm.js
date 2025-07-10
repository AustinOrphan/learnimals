// Registration Form Component
// Provides user registration interface using FormComponent

import FormComponent from '../../components/forms/FormComponent.js';
import authService from './authService.js';

class RegistrationForm extends FormComponent {
  constructor(options = {}) {
    const defaultOptions = {
      id: 'registration-form',
      fields: [
        {
          name: 'username',
          type: 'text',
          label: 'Username',
          placeholder: 'Choose a username',
          required: true,
          helpText: 'Username can only contain letters, numbers, and underscores',
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
          name: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'Enter your email address',
          required: true,
          validate: (value) => {
            if (!value) {
              return 'Email is required';
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              return 'Please enter a valid email address';
            }
            return true;
          }
        },
        {
          name: 'password',
          type: 'password',
          label: 'Password',
          placeholder: 'Choose a password',
          required: true,
          helpText: 'Password must be at least 6 characters long',
          validate: (value) => {
            if (!value || value.length < 6) {
              return 'Password must be at least 6 characters long';
            }
            return true;
          }
        },
        {
          name: 'confirmPassword',
          type: 'password',
          label: 'Confirm Password',
          placeholder: 'Confirm your password',
          required: true,
          validate: (value, formData) => {
            if (!value) {
              return 'Please confirm your password';
            }
            if (value !== formData.password) {
              return 'Passwords do not match';
            }
            return true;
          }
        },
        {
          name: 'name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true,
          validate: (value) => {
            if (!value || value.trim().length < 1) {
              return 'Please enter your name';
            }
            return true;
          }
        },
        {
          name: 'age',
          type: 'number',
          label: 'Age',
          placeholder: 'Enter your age',
          min: 3,
          max: 100,
          helpText: 'Age helps us provide appropriate content'
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
            { value: '12', label: '12th Grade' },
            { value: 'adult', label: 'Adult Learner' }
          ],
          helpText: 'Grade level helps us customize your learning experience'
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
            { value: 'penguin', label: '🐧 Penguin (Geography)' }
          ],
          value: 'default',
          helpText: 'Choose your favorite animal avatar'
        },
        {
          name: 'securityQuestion',
          type: 'select',
          label: 'Security Question',
          options: [
            { value: '', label: 'Choose a security question' },
            { value: 'pet', label: 'What was the name of your first pet?' },
            { value: 'school', label: 'What elementary school did you attend?' },
            { value: 'city', label: 'In what city were you born?' },
            { value: 'book', label: 'What is your favorite book?' },
            { value: 'teacher', label: 'What was your favorite teacher\'s name?' },
            { value: 'food', label: 'What is your favorite food?' }
          ],
          required: true,
          helpText: 'This will help you reset your password if you forget it'
        },
        {
          name: 'securityAnswer',
          type: 'text',
          label: 'Security Answer',
          placeholder: 'Enter your answer',
          required: true,
          helpText: 'Remember this answer - you\'ll need it to reset your password',
          validate: (value) => {
            if (!value || value.trim().length < 2) {
              return 'Security answer must be at least 2 characters long';
            }
            return true;
          }
        }
      ],
      submitButtonText: 'Create Account',
      onSubmit: (data, _formInstance) => this.handleRegistration(data, _formInstance),
      onValidate: (data) => this.validateRegistrationForm(data)
    };

    super({ ...defaultOptions, ...options });
    
    this.authService = authService;
    this.isRegistering = false;
  }

  validateRegistrationForm(data) {
    // Additional form-level validation
    if (data.password !== data.confirmPassword) {
      return 'Passwords do not match';
    }
    
    // Age validation if provided
    if (data.age && (data.age < 3 || data.age > 100)) {
      return 'Please enter a valid age between 3 and 100';
    }
    
    return true;
  }

  async handleRegistration(data, _formInstance) {
    if (this.isRegistering) return;
    
    this.isRegistering = true;
    this.showLoadingState();
    
    try {
      // Prepare registration data
      const registrationData = {
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
        age: data.age ? parseInt(data.age) : null,
        grade: data.grade || null,
        avatar: data.avatar || 'default',
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer
      };
      
      // Attempt registration
      const result = await this.authService.register(registrationData);
      
      if (result.success) {
        // Handle successful registration
        this.showSuccessMessage('Account created successfully! Welcome to Learnimals!');
        
        // Dispatch registration success event
        this.dispatchEvent('registrationSuccess', {
          user: result.user
        });
        
        // Reset form after a short delay to show success message
        setTimeout(() => {
          this.reset();
        }, 2000);
        
      } else {
        // Handle registration failure
        this.showErrorMessage(result.error || 'Registration failed. Please try again.');
        
        // Focus on the first field with an error
        this.focusFirstError();
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      this.showErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      this.isRegistering = false;
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

  focusFirstError() {
    if (this.element) {
      const firstErrorField = this.element.querySelector('.invalid');
      if (firstErrorField) {
        firstErrorField.focus();
      }
    }
  }

  render(container) {
    // Call parent render method
    super.render(container);
    
    // Add specific styling for registration form
    if (this.element) {
      this.element.classList.add('registration-form');
    }
    
    // Add real-time password confirmation validation
    this.addPasswordConfirmationValidation();
    
    return this;
  }

  addPasswordConfirmationValidation() {
    if (!this.element) return;
    
    const passwordField = this.element.querySelector('[name="password"]');
    const confirmPasswordField = this.element.querySelector('[name="confirmPassword"]');
    
    if (passwordField && confirmPasswordField) {
      const validatePasswordMatch = () => {
        if (confirmPasswordField.value && passwordField.value !== confirmPasswordField.value) {
          this.showFieldError('confirmPassword', 'Passwords do not match');
        } else {
          this.clearFieldError('confirmPassword');
        }
      };
      
      passwordField.addEventListener('input', validatePasswordMatch);
      confirmPasswordField.addEventListener('input', validatePasswordMatch);
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

export default RegistrationForm;