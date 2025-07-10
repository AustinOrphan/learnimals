// Enhanced Navigation Component with Authentication
// Extends the existing navigation with user authentication features

import authService from '../../features/user/authService.js';
import AuthModal from '../../features/user/authModal.js';
import UserSwitcher from '../../features/user/userSwitcher.js';

class AuthNavigation {
  constructor() {
    this.authService = authService;
    this.currentUser = null;
    this.authButtons = null;
    this.userMenu = null;
    this.isInitialized = false;
    
    this.init();
  }
  
  init() {
    // Wait for navbar to be loaded
    this.waitForNavbar(() => {
      this.initializeAuthInterface();
      this.attachEventListeners();
      this.updateAuthState();
      this.isInitialized = true;
    });
  }
  
  waitForNavbar(callback) {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      callback();
    } else {
      // Wait for navbar to be loaded
      document.addEventListener('navbarLoaded', callback, { once: true });
    }
  }
  
  initializeAuthInterface() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    // Create auth container
    const authContainer = document.createElement('div');
    authContainer.className = 'navbar-auth';
    authContainer.innerHTML = this.generateAuthHTML();
    
    // Insert auth container before the mobile menu button
    const mobileMenuButton = navbar.querySelector('#mobile-menu');
    if (mobileMenuButton) {
      navbar.insertBefore(authContainer, mobileMenuButton);
    } else {
      navbar.appendChild(authContainer);
    }
    
    // Cache references
    this.authButtons = authContainer.querySelector('.auth-buttons');
    this.userMenu = authContainer.querySelector('.user-menu');
  }
  
  generateAuthHTML() {
    return `
      <!-- Authentication buttons (shown when not logged in) -->
      <div class="auth-buttons">
        <button class="btn btn--outline btn--sm" id="login-btn">Log In</button>
        <button class="btn btn--primary btn--sm" id="register-btn">Sign Up</button>
      </div>
      
      <!-- User menu (shown when logged in) -->
      <div class="user-menu" style="display: none;">
        <button class="user-menu-toggle" aria-label="User menu" aria-expanded="false">
          <img class="user-avatar" src="/public/images/avatars/default.png" alt="User avatar">
          <span class="user-name">User</span>
          <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12">
            <path d="M6 8l-3-3h6l-3 3z" fill="currentColor"/>
          </svg>
        </button>
        
        <div class="user-dropdown" style="display: none;">
          <div class="user-info">
            <img class="user-avatar-large" src="/public/images/avatars/default.png" alt="User avatar">
            <div class="user-details">
              <span class="user-name-full">User Name</span>
              <span class="user-progress">Level 1 Learner</span>
            </div>
          </div>
          
          <hr class="dropdown-divider">
          
          <ul class="user-menu-items">
            <li><a href="/src/features/user/profile.html" class="user-menu-link">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
              </svg>
              My Profile
            </a></li>
            <li><a href="/src/features/user/progress.html" class="user-menu-link">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm0-2A6 6 0 1 0 8 2a6 6 0 0 0 0 12zm1-7h2l-3 4-3-4h2V4h2v3z" fill="currentColor"/>
              </svg>
              Progress
            </a></li>
            <li><a href="/src/features/user/achievements.html" class="user-menu-link">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" fill="currentColor"/>
              </svg>
              Achievements
            </a></li>
            <li><button class="user-menu-button" id="switch-user-btn">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0zm4-6a6 6 0 1 0 0 12A6 6 0 0 0 8 2z" fill="currentColor"/>
              </svg>
              Switch User
            </button></li>
          </ul>
          
          <hr class="dropdown-divider">
          
          <button class="user-menu-button user-menu-button--danger" id="logout-btn">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M3 1h8a1 1 0 0 1 1 1v3h-2V3H4v10h6v-2h2v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm11 7l-3-3v2H7v2h4v2l3-3z" fill="currentColor"/>
            </svg>
            Log Out
          </button>
        </div>
      </div>
    `;
  }
  
  attachEventListeners() {
    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.showLogin());
    }
    
    // Register button
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
      registerBtn.addEventListener('click', () => this.showRegister());
    }
    
    // User menu toggle
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    if (userMenuToggle) {
      userMenuToggle.addEventListener('click', () => this.toggleUserMenu());
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
    
    // Switch user button
    const switchUserBtn = document.getElementById('switch-user-btn');
    if (switchUserBtn) {
      switchUserBtn.addEventListener('click', () => this.showUserSwitcher());
    }
    
    // Close user menu when clicking outside
    document.addEventListener('click', (e) => {
      const userMenu = document.querySelector('.user-menu');
      const userDropdown = document.querySelector('.user-dropdown');
      
      if (userMenu && userDropdown && 
          !userMenu.contains(e.target) && 
          userDropdown.style.display === 'block') {
        this.closeUserMenu();
      }
    });
    
    // Listen for authentication events
    this.attachAuthEventListeners();
  }
  
  attachAuthEventListeners() {
    // Listen for login/logout events
    document.addEventListener('userLoggedIn', (_e) => {
      this.updateAuthState();
    });
    
    document.addEventListener('userLoggedOut', (_e) => {
      this.updateAuthState();
    });
    
    document.addEventListener('userSwitched', (_e) => {
      this.updateAuthState();
    });
    
    document.addEventListener('userProfileUpdated', (_e) => {
      this.updateUserDisplay();
    });
  }
  
  updateAuthState() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      this.showUserMenu();
      this.updateUserDisplay();
    } else {
      this.showAuthButtons();
    }
  }
  
  showAuthButtons() {
    if (this.authButtons) {
      this.authButtons.style.display = 'flex';
    }
    if (this.userMenu) {
      this.userMenu.style.display = 'none';
    }
  }
  
  showUserMenu() {
    if (this.authButtons) {
      this.authButtons.style.display = 'none';
    }
    if (this.userMenu) {
      this.userMenu.style.display = 'block';
    }
  }
  
  updateUserDisplay() {
    if (!this.currentUser || !this.userMenu) return;
    
    const { profile } = this.currentUser;
    
    // Update user name
    const userNameElements = this.userMenu.querySelectorAll('.user-name, .user-name-full');
    userNameElements.forEach(el => {
      el.textContent = profile.name || this.currentUser.username;
    });
    
    // Update avatar
    const avatarElements = this.userMenu.querySelectorAll('.user-avatar, .user-avatar-large');
    const avatarSrc = `/public/images/avatars/${profile.avatar || 'default'}.png`;
    avatarElements.forEach(el => {
      el.src = avatarSrc;
      el.alt = `${profile.name}'s avatar`;
    });
    
    // Update progress display
    const progressElement = this.userMenu.querySelector('.user-progress');
    if (progressElement) {
      const userProgress = this.authService.getUserProgress();
      if (userProgress) {
        const level = userProgress.getOverallLevel();
        progressElement.textContent = `Level ${level} Learner`;
      }
    }
  }
  
  toggleUserMenu() {
    const userDropdown = document.querySelector('.user-dropdown');
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    
    if (userDropdown && userMenuToggle) {
      const isOpen = userDropdown.style.display === 'block';
      
      if (isOpen) {
        this.closeUserMenu();
      } else {
        this.openUserMenu();
      }
    }
  }
  
  openUserMenu() {
    const userDropdown = document.querySelector('.user-dropdown');
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    
    if (userDropdown && userMenuToggle) {
      userDropdown.style.display = 'block';
      userMenuToggle.setAttribute('aria-expanded', 'true');
    }
  }
  
  closeUserMenu() {
    const userDropdown = document.querySelector('.user-dropdown');
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    
    if (userDropdown && userMenuToggle) {
      userDropdown.style.display = 'none';
      userMenuToggle.setAttribute('aria-expanded', 'false');
    }
  }
  
  showLogin() {
    AuthModal.showLogin();
  }
  
  showRegister() {
    AuthModal.showRegistration();
  }
  
  logout() {
    // Close user menu first
    this.closeUserMenu();
    
    // Logout
    this.authService.logout();
    
    // Show confirmation
    this.showLogoutMessage();
  }
  
  showLogoutMessage() {
    // Simple toast-like notification
    const message = document.createElement('div');
    message.className = 'auth-notification auth-notification--success';
    message.textContent = 'You have been logged out successfully.';
    
    document.body.appendChild(message);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 3000);
  }
  
  showUserSwitcher() {
    // Close current menu
    this.closeUserMenu();
    
    // Show enhanced user switcher modal
    UserSwitcher.show();
  }
  
  // Static method to initialize the auth navigation
  static initialize() {
    if (!window.authNavigation) {
      window.authNavigation = new AuthNavigation();
    }
    return window.authNavigation;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AuthNavigation.initialize();
  });
} else {
  AuthNavigation.initialize();
}

export default AuthNavigation;