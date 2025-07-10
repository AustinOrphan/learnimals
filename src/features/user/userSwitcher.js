// Enhanced User Switcher Component
// Provides visual user switching interface for family accounts

import Modal from '../../components/ui/Modal.js';
import authService from './authService.js';

class UserSwitcher extends Modal {
  constructor(options = {}) {
    const defaultOptions = {
      id: 'user-switcher-modal',
      title: 'Switch User',
      content: '', // Will be populated dynamically
      size: 'medium',
      showClose: true,
      showConfirmButton: false,
      showCancelButton: false,
      onClose: () => this.handleClose()
    };

    super({ ...defaultOptions, ...options });
    
    this.authService = authService;
    this.familyUsers = [];
    this.isInitialized = false;
  }

  generateHTML() {
    // Generate basic modal structure
    const baseHTML = super.generateHTML();
    return baseHTML;
  }

  create() {
    // Create the modal
    super.create();
    
    // Initialize the user switching interface
    this.initializeUserInterface();
    
    return this;
  }

  initializeUserInterface() {
    if (this.isInitialized || !this.element) return;
    
    const modalContent = this.element.querySelector('.modal-content');
    if (!modalContent) return;
    
    // Load family users
    this.loadFamilyUsers();
    
    // Create user switching interface
    const switcherHTML = this.generateSwitcherHTML();
    modalContent.innerHTML = switcherHTML;
    
    // Attach event listeners
    this.attachSwitcherEventListeners();
    
    this.isInitialized = true;
  }

  loadFamilyUsers() {
    this.familyUsers = this.authService.getCurrentFamilyUsers();
  }

  generateSwitcherHTML() {
    if (this.familyUsers.length === 0) {
      return `
        <div class="user-switcher-empty">
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>No Users Available</h3>
            <p>No other users are available for switching.</p>
          </div>
        </div>
      `;
    }

    const currentUser = this.authService.getCurrentUser();
    const canManageFamily = this.authService.canManageFamily();

    let html = `
      <div class="user-switcher-container">
        <div class="current-user-info">
          <p class="current-user-label">Currently signed in as:</p>
          <div class="current-user-card">
            <img class="user-avatar-large" src="/public/images/avatars/${currentUser.profile.avatar || 'default'}.png" alt="${currentUser.profile.name}'s avatar">
            <div class="user-details">
              <span class="user-name">${currentUser.profile.name}</span>
              <span class="user-role">${this.formatRole(this.getCurrentUserRole())}</span>
            </div>
          </div>
        </div>
        
        <div class="user-switcher-grid">
          <h4>Switch to:</h4>
          <div class="users-grid">
    `;

    this.familyUsers.forEach(user => {
      if (user.isCurrentUser) return; // Skip current user
      
      const userCard = `
        <div class="user-card" data-user-id="${user.id}">
          <img class="user-avatar" src="/public/images/avatars/${user.profile.avatar || 'default'}.png" alt="${user.profile.name}'s avatar">
          <div class="user-info">
            <span class="user-name">${user.profile.name}</span>
            <span class="user-role">${this.formatRole(user.role)}</span>
            ${user.lastLogin ? `<span class="last-login">Last: ${this.formatLastLogin(user.lastLogin)}</span>` : '<span class="last-login">New user</span>'}
          </div>
          <button class="switch-button" data-user-id="${user.id}">
            Switch
          </button>
        </div>
      `;
      
      html += userCard;
    });

    html += `
          </div>
        </div>
    `;

    // Add family management section for parents
    if (canManageFamily) {
      html += `
        <div class="family-management">
          <hr class="section-divider">
          <h4>Family Management</h4>
          <div class="management-actions">
            <button class="btn btn--outline btn--sm" id="add-child-btn">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 1l1 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l1-4z" fill="currentColor"/>
              </svg>
              Add Child Account
            </button>
            <button class="btn btn--outline btn--sm" id="manage-family-btn">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
              </svg>
              Manage Family
            </button>
          </div>
        </div>
      `;
    }

    html += `
      </div>
    `;

    return html;
  }

  getCurrentUserRole() {
    const currentUserFull = this.authService.getCurrentUserFull();
    return currentUserFull?.role || 'learner';
  }

  formatRole(role) {
    const roleMap = {
      'parent': 'Parent',
      'child': 'Child',
      'teen': 'Teen',
      'learner': 'Learner',
      'admin': 'Admin'
    };
    return roleMap[role] || 'User';
  }

  formatLastLogin(lastLogin) {
    if (!lastLogin) return 'Never';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  attachSwitcherEventListeners() {
    // Switch user buttons
    const switchButtons = this.element.querySelectorAll('.switch-button');
    switchButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const userId = e.target.getAttribute('data-user-id');
        this.handleUserSwitch(userId);
      });
    });

    // User card click (alternative to button)
    const userCards = this.element.querySelectorAll('.user-card');
    userCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Only if not clicking the button
        if (e.target.classList.contains('switch-button')) return;
        
        const userId = card.getAttribute('data-user-id');
        this.handleUserSwitch(userId);
      });
    });

    // Family management buttons
    const addChildBtn = this.element.querySelector('#add-child-btn');
    if (addChildBtn) {
      addChildBtn.addEventListener('click', () => this.handleAddChild());
    }

    const manageFamilyBtn = this.element.querySelector('#manage-family-btn');
    if (manageFamilyBtn) {
      manageFamilyBtn.addEventListener('click', () => this.handleManageFamily());
    }
  }

  async handleUserSwitch(userId) {
    if (!userId) return;
    
    this.showLoadingState();
    
    try {
      const result = this.authService.switchToUser(userId);
      
      if (result.success) {
        this.showSuccessMessage(`Switched to ${result.user.profile.name}`);
        
        // Close modal after short delay
        setTimeout(() => {
          this.close();
        }, 1000);
        
      } else {
        this.showErrorMessage(result.error || 'Failed to switch user');
      }
      
    } catch (error) {
      console.error('User switch error:', error);
      this.showErrorMessage('An error occurred while switching users');
    } finally {
      this.hideLoadingState();
    }
  }

  handleAddChild() {
    // Dispatch event to show add child form
    this.dispatchEvent('showAddChild', {});
    this.close();
  }

  handleManageFamily() {
    // Dispatch event to show family management
    this.dispatchEvent('showFamilyManagement', {});
    this.close();
  }

  showLoadingState() {
    const switchButtons = this.element.querySelectorAll('.switch-button');
    switchButtons.forEach(button => {
      button.disabled = true;
      button.textContent = 'Switching...';
    });
  }

  hideLoadingState() {
    const switchButtons = this.element.querySelectorAll('.switch-button');
    switchButtons.forEach(button => {
      button.disabled = false;
      button.textContent = 'Switch';
    });
  }

  showSuccessMessage(message) {
    this.clearMessages();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'switcher-success-message';
    messageDiv.textContent = message;
    
    const container = this.element.querySelector('.user-switcher-container');
    if (container) {
      container.insertBefore(messageDiv, container.firstChild);
    }
  }

  showErrorMessage(message) {
    this.clearMessages();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'switcher-error-message';
    messageDiv.textContent = message;
    
    const container = this.element.querySelector('.user-switcher-container');
    if (container) {
      container.insertBefore(messageDiv, container.firstChild);
    }
  }

  clearMessages() {
    if (this.element) {
      const successMessages = this.element.querySelectorAll('.switcher-success-message');
      const errorMessages = this.element.querySelectorAll('.switcher-error-message');
      
      successMessages.forEach(msg => msg.remove());
      errorMessages.forEach(msg => msg.remove());
    }
  }

  open() {
    // Refresh data when opening
    this.loadFamilyUsers();
    
    // Re-initialize interface with fresh data
    if (this.element) {
      this.initializeUserInterface();
    }
    
    super.open();
    return this;
  }

  handleClose() {
    this.clearMessages();
    this.isInitialized = false;
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

  // Static method to get or create the global user switcher instance
  static getInstance() {
    if (!window.userSwitcherInstance) {
      window.userSwitcherInstance = new UserSwitcher();
      window.userSwitcherInstance.create();
    }
    return window.userSwitcherInstance;
  }

  // Convenience static method
  static show() {
    const instance = UserSwitcher.getInstance();
    return instance.open();
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserSwitcher;
} else {
  window.UserSwitcher = UserSwitcher;
}

export default UserSwitcher;