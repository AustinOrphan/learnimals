// Password Reset Form Component
// Provides password reset functionality using FormComponent

import FormComponent from '../../components/forms/FormComponent.js';
import authService from './authService.js';

class PasswordResetForm extends FormComponent {
  constructor(options = {}) {
    const defaultOptions = {
      id: 'password-reset-form',
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
        }
      ],
      submitButtonText: 'Find Account',
      onSubmit: (data, _formInstance) => this.handleUsernameSubmit(data, _formInstance)
    };

    super({ ...defaultOptions, ...options });
    
    this.authService = authService;
    this.currentStep = 'username'; // 'username', 'security', 'newPassword'
    this.resetData = {};
    this.isProcessing = false;
  }

  async handleUsernameSubmit(data, _formInstance) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.showLoadingState('Searching...');
    
    try {
      const { username } = data;
      
      // Request password reset
      const result = await this.authService.requestPasswordReset(username);
      
      if (result.success) {
        // Store data and move to security question step
        this.resetData.username = username;
        this.resetData.securityQuestion = result.securityQuestion;
        
        this.showSecurityQuestionStep();
      } else {
        this.showErrorMessage(result.error || 'Username not found or no security question set.');
      }
      
    } catch (error) {
      console.error('Password reset request error:', error);
      this.showErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      this.isProcessing = false;
      this.hideLoadingState();
    }
  }

  showSecurityQuestionStep() {
    this.currentStep = 'security';
    
    // Update form fields
    this.options.fields = [
      {
        name: 'securityAnswer',
        type: 'text',
        label: 'Security Question',
        placeholder: 'Enter your answer',
        required: true,
        helpText: `Question: ${this.resetData.securityQuestion}`,
        validate: (value) => {
          if (!value || value.trim().length < 1) {
            return 'Please enter your security answer';
          }
          return true;
        }
      }
    ];
    
    this.options.submitButtonText = 'Verify Answer';
    this.options.onSubmit = (data, _formInstance) => this.handleSecuritySubmit(data, _formInstance);
    
    // Re-render form
    this.regenerateForm();
    
    this.showSuccessMessage('Account found! Please answer your security question.');
  }

  async handleSecuritySubmit(data, _formInstance) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.showLoadingState('Verifying...');
    
    try {
      const { securityAnswer } = data;
      this.resetData.securityAnswer = securityAnswer;
      
      this.showNewPasswordStep();
      
    } catch (error) {
      console.error('Security verification error:', error);
      this.showErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      this.isProcessing = false;
      this.hideLoadingState();
    }
  }

  showNewPasswordStep() {
    this.currentStep = 'newPassword';
    
    // Update form fields
    this.options.fields = [
      {
        name: 'newPassword',
        type: 'password',
        label: 'New Password',
        placeholder: 'Enter your new password',
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
        label: 'Confirm New Password',
        placeholder: 'Confirm your new password',
        required: true,
        validate: (value, formData) => {
          if (!value) {
            return 'Please confirm your new password';
          }
          if (value !== formData.newPassword) {
            return 'Passwords do not match';
          }
          return true;
        }
      }
    ];
    
    this.options.submitButtonText = 'Reset Password';
    this.options.onSubmit = (data, _formInstance) => this.handlePasswordSubmit(data, _formInstance);
    this.options.onValidate = (data) => this.validateNewPasswordForm(data);
    
    // Re-render form
    this.regenerateForm();
    
    this.showSuccessMessage('Security answer verified! Please set your new password.');
  }

  validateNewPasswordForm(data) {
    if (data.newPassword !== data.confirmPassword) {
      return 'Passwords do not match';
    }
    return true;
  }

  async handlePasswordSubmit(data, _formInstance) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.showLoadingState('Resetting Password...');
    
    try {
      const { newPassword } = data;
      
      // Reset password
      const result = await this.authService.resetPassword(
        this.resetData.username,
        this.resetData.securityAnswer,
        newPassword
      );
      
      if (result.success) {
        this.showSuccessMessage('Password reset successfully! You can now log in with your new password.');
        
        // Dispatch success event
        this.dispatchEvent('passwordResetSuccess', {
          username: this.resetData.username
        });
        
        // Reset form after delay
        setTimeout(() => {
          this.resetForm();
        }, 3000);
        
      } else {
        this.showErrorMessage(result.error || 'Failed to reset password. Please try again.');
      }
      
    } catch (error) {
      console.error('Password reset error:', error);
      this.showErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      this.isProcessing = false;
      this.hideLoadingState();
    }
  }

  regenerateForm() {
    if (!this.element) return;
    
    // Store current container
    const container = this.element.parentNode;
    
    // Remove current form
    this.element.remove();
    
    // Re-render with new options
    this.render(container);
  }

  resetForm() {
    this.currentStep = 'username';
    this.resetData = {};
    
    // Reset to initial form
    this.options.fields = [
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
      }
    ];
    
    this.options.submitButtonText = 'Find Account';
    this.options.onSubmit = (data, _formInstance) => this.handleUsernameSubmit(data, _formInstance);
    this.options.onValidate = null;
    
    // Re-render form
    this.regenerateForm();
    
    this.clearMessages();
  }

  showLoadingState(text = 'Processing...') {
    const submitButton = this.element?.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = text;
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
      this.element.classList.add('password-reset-form');
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

export default PasswordResetForm;