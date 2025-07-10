// Family Management Modal Component
// Provides interface for managing family accounts and child users

import Modal from '../../components/ui/Modal.js';
import AddChildForm from './addChildForm.js';
import authService from './authService.js';

class FamilyManagement extends Modal {
  constructor(options = {}) {
    const defaultOptions = {
      id: 'family-management-modal',
      title: 'Family Management',
      content: '', // Will be populated dynamically
      size: 'large',
      showClose: true,
      showConfirmButton: false,
      showCancelButton: false,
      onClose: () => this.handleClose()
    };

    super({ ...defaultOptions, ...options });
    
    this.authService = authService;
    this.addChildForm = null;
    this.currentView = 'overview'; // 'overview', 'addChild'
    this.isInitialized = false;
  }

  create() {
    super.create();
    this.initializeFamilyInterface();
    return this;
  }

  initializeFamilyInterface() {
    if (this.isInitialized || !this.element) return;
    
    const modalContent = this.element.querySelector('.modal-content');
    if (!modalContent) return;
    
    this.showOverview();
    this.isInitialized = true;
  }

  showOverview() {
    this.currentView = 'overview';
    this.updateTitle('Family Management');
    
    const modalContent = this.element.querySelector('.modal-content');
    if (!modalContent) return;
    
    const currentUser = this.authService.getCurrentUser();
    const currentUserFull = this.authService.getCurrentUserFull();
    const familyUsers = this.authService.getCurrentFamilyUsers();
    const children = this.authService.getMyChildren();
    
    const overviewHTML = `
      <div class="family-overview">
        <div class="family-header">
          <div class="family-info">
            <h3>Family Account</h3>
            <p class="family-id">Family ID: ${currentUserFull?.familyId || 'Not set'}</p>
            <p class="account-owner">
              <strong>Account Owner:</strong> ${currentUser.profile.name} (${this.formatRole(currentUserFull?.role)})
            </p>
          </div>
          <div class="family-stats">
            <div class="stat">
              <span class="stat-number">${familyUsers.length}</span>
              <span class="stat-label">Total Users</span>
            </div>
            <div class="stat">
              <span class="stat-number">${children.length}</span>
              <span class="stat-label">Children</span>
            </div>
          </div>
        </div>

        <div class="family-actions">
          <button class="btn btn--primary" id="add-child-action">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 1v6m0 0v6m0-6h6m-6 0H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add Child Account
          </button>
          <button class="btn btn--outline" id="family-settings-action">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 1l1 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l1-4z" fill="currentColor"/>
            </svg>
            Family Settings
          </button>
        </div>

        <div class="family-members">
          <h4>Family Members</h4>
          <div class="members-list">
            ${this.generateMembersHTML(familyUsers)}
          </div>
        </div>

        ${children.length > 0 ? this.generateChildrenSection(children) : ''}
      </div>
    `;
    
    modalContent.innerHTML = overviewHTML;
    this.attachOverviewEventListeners();
  }

  generateMembersHTML(familyUsers) {
    return familyUsers.map(user => `
      <div class="member-card ${user.isCurrentUser ? 'current-user' : ''}" data-user-id="${user.id}">
        <img class="member-avatar" src="/public/images/avatars/${user.profile.avatar || 'default'}.png" alt="${user.profile.name}'s avatar">
        <div class="member-info">
          <span class="member-name">${user.profile.name}</span>
          <span class="member-role">${this.formatRole(user.role)}</span>
          <span class="member-username">@${user.username}</span>
          ${user.lastLogin ? `<span class="member-last-login">Last login: ${this.formatLastLogin(user.lastLogin)}</span>` : '<span class="member-last-login">Never logged in</span>'}
        </div>
        <div class="member-actions">
          ${user.isCurrentUser ? '<span class="current-user-badge">You</span>' : `
            <button class="btn btn--sm btn--outline switch-to-user" data-user-id="${user.id}">
              Switch
            </button>
          `}
        </div>
      </div>
    `).join('');
  }

  generateChildrenSection(children) {
    return `
      <div class="children-section">
        <h4>Child Accounts</h4>
        <div class="children-list">
          ${children.map(child => `
            <div class="child-card" data-child-id="${child.id}">
              <img class="child-avatar" src="/public/images/avatars/${child.profile.avatar || 'default'}.png" alt="${child.profile.name}'s avatar">
              <div class="child-info">
                <span class="child-name">${child.profile.name}</span>
                <span class="child-details">Age: ${child.profile.age || 'Not set'} • Grade: ${child.profile.grade || 'Not set'}</span>
                <span class="child-username">@${child.username}</span>
              </div>
              <div class="child-actions">
                <button class="btn btn--sm btn--primary switch-to-child" data-child-id="${child.id}">
                  Switch to ${child.profile.name}
                </button>
                <button class="btn btn--sm btn--outline manage-child" data-child-id="${child.id}">
                  Manage
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  showAddChild() {
    this.currentView = 'addChild';
    this.updateTitle('Add Child Account');
    
    const modalContent = this.element.querySelector('.modal-content');
    if (!modalContent) return;
    
    const addChildHTML = `
      <div class="add-child-container">
        <div class="add-child-header">
          <button class="back-button" id="back-to-overview">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M6 12l-4-4 4-4M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Back to Family Overview
          </button>
        </div>
        <div class="add-child-form-container">
          <!-- Form will be inserted here -->
        </div>
      </div>
    `;
    
    modalContent.innerHTML = addChildHTML;
    
    // Initialize add child form
    this.addChildForm = new AddChildForm({
      id: 'family-add-child-form'
    });
    
    const formContainer = modalContent.querySelector('.add-child-form-container');
    if (formContainer) {
      this.addChildForm.render(formContainer);
    }
    
    this.attachAddChildEventListeners();
  }

  attachOverviewEventListeners() {
    // Add child button
    const addChildBtn = this.element.querySelector('#add-child-action');
    if (addChildBtn) {
      addChildBtn.addEventListener('click', () => this.showAddChild());
    }
    
    // Family settings button
    const settingsBtn = this.element.querySelector('#family-settings-action');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showFamilySettings());
    }
    
    // Switch to user buttons
    const switchButtons = this.element.querySelectorAll('.switch-to-user');
    switchButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const userId = e.target.getAttribute('data-user-id');
        this.handleUserSwitch(userId);
      });
    });
    
    // Switch to child buttons
    const childButtons = this.element.querySelectorAll('.switch-to-child');
    childButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const childId = e.target.getAttribute('data-child-id');
        this.handleChildSwitch(childId);
      });
    });
  }

  attachAddChildEventListeners() {
    // Back button
    const backBtn = this.element.querySelector('#back-to-overview');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.showOverview());
    }
    
    // Listen for child account creation
    if (this.addChildForm && this.addChildForm.element) {
      this.addChildForm.element.addEventListener('childAccountAdded', (_e) => {
        // Show success and return to overview
        setTimeout(() => {
          this.showOverview();
        }, 2000);
      });
    }
  }

  async handleUserSwitch(userId) {
    if (!userId) return;
    
    const result = this.authService.switchToUser(userId);
    if (result.success) {
      this.showSuccessMessage(`Switched to ${result.user.profile.name}`);
      setTimeout(() => this.close(), 1000);
    } else {
      this.showErrorMessage(result.error || 'Failed to switch user');
    }
  }

  async handleChildSwitch(childId) {
    if (!childId) return;
    
    const result = this.authService.switchToChildAccount(childId);
    if (result.success) {
      this.showSuccessMessage(`Switched to ${result.user.profile.name}`);
      setTimeout(() => this.close(), 1000);
    } else {
      this.showErrorMessage(result.error || 'Failed to switch to child account');
    }
  }

  showFamilySettings() {
    // Placeholder for family settings
    this.showInfoMessage('Family settings will be available in a future update.');
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

  updateTitle(title) {
    const titleElement = this.element.querySelector('.modal-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  showSuccessMessage(message) {
    this.clearMessages();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'family-success-message';
    messageDiv.textContent = message;
    
    const container = this.element.querySelector('.family-overview, .add-child-container');
    if (container) {
      container.insertBefore(messageDiv, container.firstChild);
    }
  }

  showErrorMessage(message) {
    this.clearMessages();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'family-error-message';
    messageDiv.textContent = message;
    
    const container = this.element.querySelector('.family-overview, .add-child-container');
    if (container) {
      container.insertBefore(messageDiv, container.firstChild);
    }
  }

  showInfoMessage(message) {
    this.clearMessages();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'family-info-message';
    messageDiv.textContent = message;
    
    const container = this.element.querySelector('.family-overview, .add-child-container');
    if (container) {
      container.insertBefore(messageDiv, container.firstChild);
    }
  }

  clearMessages() {
    if (this.element) {
      const messages = this.element.querySelectorAll('.family-success-message, .family-error-message, .family-info-message');
      messages.forEach(msg => msg.remove());
    }
  }

  open() {
    // Refresh data when opening
    super.open();
    
    if (this.currentView === 'overview') {
      this.showOverview();
    }
    
    return this;
  }

  handleClose() {
    this.clearMessages();
    this.currentView = 'overview';
    
    if (this.addChildForm) {
      this.addChildForm.destroy();
      this.addChildForm = null;
    }
    
    this.isInitialized = false;
  }

  destroy() {
    if (this.addChildForm) {
      this.addChildForm.destroy();
      this.addChildForm = null;
    }
    
    super.destroy();
  }

  // Static method to get or create the global family management instance
  static getInstance() {
    if (!window.familyManagementInstance) {
      window.familyManagementInstance = new FamilyManagement();
      window.familyManagementInstance.create();
    }
    return window.familyManagementInstance;
  }

  // Convenience static method
  static show() {
    const instance = FamilyManagement.getInstance();
    return instance.open();
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FamilyManagement;
} else {
  window.FamilyManagement = FamilyManagement;
}

export default FamilyManagement;