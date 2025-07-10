// Authentication Modal Component
// Provides unified login/registration interface using Modal component

import Modal from '../../components/ui/Modal.js';
import LoginForm from './loginForm.js';
import RegistrationForm from './registrationForm.js';
import PasswordResetForm from './passwordResetForm.js';
import authService from './authService.js';

class AuthModal extends Modal {
  constructor(options = {}) {
    const defaultOptions = {
      id: 'auth-modal',
      title: 'Welcome to Learnimals',
      content: '', // Will be populated dynamically
      size: 'medium',
      showClose: true,
      showConfirmButton: false,
      showCancelButton: false,
      onClose: () => this.handleClose()
    };

    super({ ...defaultOptions, ...options });
    
    this.authService = authService;
    this.currentMode = 'login'; // 'login', 'register', or 'reset'
    this.loginForm = null;
    this.registrationForm = null;
    this.passwordResetForm = null;
    this.isInitialized = false;
  }

  generateHTML() {
    // Generate basic modal structure
    const baseHTML = super.generateHTML();
    
    // We'll populate the content after rendering
    return baseHTML;
  }

  create() {
    // Create the modal
    super.create();
    
    // Initialize the authentication interface
    this.initializeAuthInterface();
    
    return this;
  }

  initializeAuthInterface() {
    if (this.isInitialized || !this.element) return;
    
    const modalContent = this.element.querySelector('.modal-content');
    if (!modalContent) return;
    
    // Create tab interface
    const tabsHTML = `
      <div class="auth-tabs">
        <button class="auth-tab auth-tab--active" data-mode="login">Log In</button>
        <button class="auth-tab" data-mode="register">Create Account</button>
        <button class="auth-tab" data-mode="reset">Reset Password</button>
      </div>
      <div class="auth-form-container">
        <div id="login-form-container" class="auth-form-panel auth-form-panel--active"></div>
        <div id="registration-form-container" class="auth-form-panel"></div>
        <div id="reset-form-container" class="auth-form-panel"></div>
      </div>
    `;
    
    modalContent.innerHTML = tabsHTML;
    
    // Initialize forms
    this.initializeForms();
    
    // Attach tab event listeners
    this.attachTabEventListeners();
    
    // Attach authentication event listeners
    this.attachAuthEventListeners();
    
    this.isInitialized = true;
  }

  initializeForms() {
    // Initialize login form
    this.loginForm = new LoginForm({
      id: 'auth-login-form'
    });
    
    const loginContainer = this.element.querySelector('#login-form-container');
    if (loginContainer) {
      this.loginForm.render(loginContainer);
    }
    
    // Initialize registration form
    this.registrationForm = new RegistrationForm({
      id: 'auth-registration-form'
    });
    
    const registrationContainer = this.element.querySelector('#registration-form-container');
    if (registrationContainer) {
      this.registrationForm.render(registrationContainer);
    }
    
    // Initialize password reset form
    this.passwordResetForm = new PasswordResetForm({
      id: 'auth-reset-form'
    });
    
    const resetContainer = this.element.querySelector('#reset-form-container');
    if (resetContainer) {
      this.passwordResetForm.render(resetContainer);
    }
  }

  attachTabEventListeners() {
    const tabs = this.element.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = tab.getAttribute('data-mode');
        this.switchMode(mode);
      });
    });
  }

  attachAuthEventListeners() {
    // Listen for successful login
    if (this.loginForm && this.loginForm.element) {
      this.loginForm.element.addEventListener('loginSuccess', (e) => {
        this.handleAuthSuccess(e.detail, 'login');
      });
      
      // Listen for forgot password request
      this.loginForm.element.addEventListener('showPasswordReset', (_e) => {
        this.switchMode('reset');
      });
    }
    
    // Listen for successful registration
    if (this.registrationForm && this.registrationForm.element) {
      this.registrationForm.element.addEventListener('registrationSuccess', (e) => {
        this.handleAuthSuccess(e.detail, 'registration');
      });
    }
    
    // Listen for successful password reset
    if (this.passwordResetForm && this.passwordResetForm.element) {
      this.passwordResetForm.element.addEventListener('passwordResetSuccess', (e) => {
        this.handlePasswordResetSuccess(e.detail);
      });
    }
    
    // Listen for global auth events
    document.addEventListener('userLoggedIn', (_e) => {
      this.close();
    });
    
    document.addEventListener('userRegistered', (_e) => {
      this.close();
    });
  }

  switchMode(mode) {
    if (mode === this.currentMode) return;
    
    this.currentMode = mode;
    
    // Update tabs
    const tabs = this.element.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      const tabMode = tab.getAttribute('data-mode');
      if (tabMode === mode) {
        tab.classList.add('auth-tab--active');
      } else {
        tab.classList.remove('auth-tab--active');
      }
    });
    
    // Update panels
    const panels = this.element.querySelectorAll('.auth-form-panel');
    panels.forEach(panel => {
      panel.classList.remove('auth-form-panel--active');
    });
    
    if (mode === 'login') {
      const loginPanel = this.element.querySelector('#login-form-container');
      if (loginPanel) {
        loginPanel.classList.add('auth-form-panel--active');
      }
      this.updateTitle('Welcome Back!');
    } else if (mode === 'register') {
      const registerPanel = this.element.querySelector('#registration-form-container');
      if (registerPanel) {
        registerPanel.classList.add('auth-form-panel--active');
      }
      this.updateTitle('Join Learnimals');
    } else if (mode === 'reset') {
      const resetPanel = this.element.querySelector('#reset-form-container');
      if (resetPanel) {
        resetPanel.classList.add('auth-form-panel--active');
      }
      this.updateTitle('Reset Password');
    }
  }

  updateTitle(title) {
    const titleElement = this.element.querySelector('.modal-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  handleAuthSuccess(data, type) {
    // Show success message
    this.showSuccessMessage(
      type === 'login' 
        ? `Welcome back, ${data.user.profile.name}!`
        : `Welcome to Learnimals, ${data.user.profile.name}!`
    );
    
    // Close modal after short delay
    setTimeout(() => {
      this.close();
    }, 1500);
  }

  handlePasswordResetSuccess(data) {
    // Show success message
    this.showSuccessMessage(
      `Password reset successfully for ${data.username}! You can now log in with your new password.`
    );
    
    // Switch to login form after delay
    setTimeout(() => {
      this.switchMode('login');
      // Pre-fill username if available
      if (this.loginForm && this.loginForm.element) {
        const usernameField = this.loginForm.element.querySelector('[name="username"]');
        if (usernameField) {
          usernameField.value = data.username;
        }
      }
    }, 2000);
  }

  showSuccessMessage(message) {
    const modalContent = this.element.querySelector('.modal-content');
    if (!modalContent) return;
    
    // Clear existing messages
    const existingMessages = modalContent.querySelectorAll('.auth-success-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create success message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'auth-success-message';
    messageDiv.textContent = message;
    
    // Insert at top of modal content
    modalContent.insertBefore(messageDiv, modalContent.firstChild);
  }

  openLogin() {
    this.switchMode('login');
    this.open();
    return this;
  }

  openRegistration() {
    this.switchMode('register');
    this.open();
    return this;
  }

  openPasswordReset() {
    this.switchMode('reset');
    this.open();
    return this;
  }

  handleClose() {
    // Clear any success messages
    if (this.element) {
      const successMessages = this.element.querySelectorAll('.auth-success-message');
      successMessages.forEach(msg => msg.remove());
    }
    
    // Reset forms
    if (this.loginForm) {
      this.loginForm.reset();
    }
    if (this.registrationForm) {
      this.registrationForm.reset();
    }
    if (this.passwordResetForm) {
      this.passwordResetForm.resetForm();
    }
    
    // Reset to login mode
    this.switchMode('login');
  }

  destroy() {
    // Clean up forms
    if (this.loginForm) {
      this.loginForm.destroy();
      this.loginForm = null;
    }
    if (this.registrationForm) {
      this.registrationForm.destroy();
      this.registrationForm = null;
    }
    if (this.passwordResetForm) {
      this.passwordResetForm.destroy();
      this.passwordResetForm = null;
    }
    
    this.isInitialized = false;
    
    // Call parent destroy method
    super.destroy();
  }

  // Static method to get or create the global auth modal instance
  static getInstance() {
    if (!window.authModalInstance) {
      window.authModalInstance = new AuthModal();
      window.authModalInstance.create();
    }
    return window.authModalInstance;
  }

  // Convenience static methods
  static showLogin() {
    const instance = AuthModal.getInstance();
    return instance.openLogin();
  }

  static showRegistration() {
    const instance = AuthModal.getInstance();
    return instance.openRegistration();
  }

  static showPasswordReset() {
    const instance = AuthModal.getInstance();
    return instance.openPasswordReset();
  }

  // Check if user is already authenticated and show appropriate UI
  static checkAuthState() {
    if (authService.isUserAuthenticated()) {
      // User is already logged in, no need to show auth modal
      return false;
    }
    return true;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthModal;
} else {
  window.AuthModal = AuthModal;
}

export default AuthModal;