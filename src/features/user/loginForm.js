// Login Form Component
// Provides user authentication interface using FormComponent

import FormComponent from '../../components/forms/FormComponent.js';
import authService from './authService.js';

class LoginForm extends FormComponent {
  constructor(options = {}) {
    const defaultOptions = {
      id: 'login-form',
      fields: [
        {
          name: 'username',
          type: 'text',
          label: 'Username',
          placeholder: 'Enter your username',
          required: true,
          validate: (value) => {
            if (!value || value.length < 3) {
              return 'Username must be at least 3 characters long';
            }
            return true;
          }
        },
        {
          name: 'password',
          type: 'password',
          label: 'Password',
          placeholder: 'Enter your password',
          required: true,
          validate: (value) => {
            if (!value || value.length < 6) {
              return 'Password must be at least 6 characters long';
            }
            return true;
          }
        },
        {
          name: 'rememberMe',
          type: 'checkbox',
          label: 'Remember me',
          options: [
            { value: 'remember', label: 'Keep me logged in' }
          ]
        }
      ],
      submitButtonText: 'Log In',
      onSubmit: (data, _formInstance) => this.handleLogin(data, _formInstance),
      onValidate: null
    };

    super({ ...defaultOptions, ...options });
    
    this.authService = authService;
    this.isLoggingIn = false;
  }

  async handleLogin(data, _formInstance) {
    if (this.isLoggingIn) return;
    
    this.isLoggingIn = true;
    this.showLoadingState();
    
    try {
      const { username, password, rememberMe } = data;
      
      // Attempt login
      const result = await this.authService.login(username, password);
      
      if (result.success) {
        // Handle successful login
        this.showSuccessMessage('Login successful! Welcome back.');
        
        // Store remember me preference
        if (rememberMe && rememberMe.includes('remember')) {
          localStorage.setItem('learnimals-remember-user', username);
        } else {
          localStorage.removeItem('learnimals-remember-user');
        }
        
        // Dispatch login success event
        this.dispatchEvent('loginSuccess', {
          user: result.user,
          rememberMe: rememberMe && rememberMe.includes('remember')
        });
        
        // Reset form
        this.reset();
        
      } else {
        // Handle login failure
        this.showErrorMessage(result.error || 'Login failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      this.showErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      this.isLoggingIn = false;
      this.hideLoadingState();
    }
  }

  showLoadingState() {
    const submitButton = this.element?.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
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
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 3000);
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

  // Pre-fill username if "remember me" was used
  loadRememberedUser() {
    const rememberedUser = localStorage.getItem('learnimals-remember-user');
    if (rememberedUser) {
      const usernameField = this.options.fields.find(field => field.name === 'username');
      if (usernameField) {
        usernameField.value = rememberedUser;
      }
    }
  }

  render(container) {
    // Load remembered user before rendering
    this.loadRememberedUser();
    
    // Call parent render method
    super.render(container);
    
    // Add specific styling for login form
    if (this.element) {
      this.element.classList.add('login-form');
    }
    
    return this;
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

export default LoginForm;