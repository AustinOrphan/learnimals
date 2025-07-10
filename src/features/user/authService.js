// Authentication Service for Learnimals
// Handles user registration, login, logout, and session management

import UserProgress from './userProgress.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.userProgress = null;
    
    // Storage keys
    this.AUTH_STORAGE_KEY = 'learnimals-auth-data';
    this.USERS_STORAGE_KEY = 'learnimals-users';
    this.CURRENT_USER_KEY = 'learnimals-current-user';
    
    // Initialize authentication state
    this.init();
  }
  
  init() {
    // Check if user is already logged in
    this.loadCurrentUser();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  // Load current user from localStorage
  loadCurrentUser() {
    try {
      const currentUserData = localStorage.getItem(this.CURRENT_USER_KEY);
      if (currentUserData) {
        const userData = JSON.parse(currentUserData);
        
        // Validate that the user still exists in users storage
        const users = this.getAllUsers();
        const userExists = users.find(u => u.username === userData.username);
        
        if (userExists) {
          this.currentUser = userData;
          this.isAuthenticated = true;
          
          // Initialize UserProgress for current user
          this.userProgress = new UserProgress();
          
          // Load user-specific progress data
          this.loadUserProgress();
          
          this.dispatchAuthEvent('userLoggedIn', { user: this.currentUser });
        } else {
          // User no longer exists, clear session
          this.logout();
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      this.logout();
    }
  }
  
  // Register a new user
  async register(registrationData) {
    const { username, email, password, name, age, grade, avatar, securityQuestion, securityAnswer } = registrationData;
    
    // Validation
    const validation = this.validateRegistration(registrationData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Check if user already exists
    const existingUser = this.getUserByUsername(username);
    if (existingUser) {
      return { success: false, error: 'Username already exists' };
    }
    
    const existingEmail = this.getUserByEmail(email);
    if (existingEmail) {
      return { success: false, error: 'Email already registered' };
    }
    
    try {
      // Create user object
      const user = {
        id: this.generateUserId(),
        username: username,
        email: email,
        passwordHash: await this.hashPassword(password),
        securityQuestion: securityQuestion,
        securityAnswerHash: await this.hashSecurityAnswer(securityAnswer),
        profile: {
          name: name || username,
          age: age || null,
          grade: grade || null,
          avatar: avatar || 'default'
        },
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true
      };
      
      // Save user to storage
      const users = this.getAllUsers();
      users.push(user);
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
      
      // Automatically log in the new user
      const loginResult = await this.login(username, password);
      if (loginResult.success) {
        this.dispatchAuthEvent('userRegistered', { user: this.currentUser });
        return { success: true, user: this.currentUser };
      } else {
        return { success: false, error: 'Registration successful but login failed' };
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed due to system error' };
    }
  }
  
  // Login user
  async login(username, password) {
    try {
      // Find user
      const user = this.getUserByUsername(username);
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }
      
      // Verify password
      const passwordValid = await this.verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        return { success: false, error: 'Invalid username or password' };
      }
      
      // Check if user is active
      if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' };
      }
      
      // Update last login
      user.lastLogin = new Date().toISOString();
      this.updateUser(user);
      
      // Set current user
      this.currentUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        lastLogin: user.lastLogin
      };
      this.isAuthenticated = true;
      
      // Save current user session
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this.currentUser));
      
      // Initialize UserProgress for this user
      this.userProgress = new UserProgress();
      this.loadUserProgress();
      
      this.dispatchAuthEvent('userLoggedIn', { user: this.currentUser });
      
      return { success: true, user: this.currentUser };
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed due to system error' };
    }
  }
  
  // Logout user
  logout() {
    if (this.isAuthenticated) {
      // Save current progress before logout
      if (this.userProgress) {
        this.saveUserProgress();
      }
      
      const user = this.currentUser;
      
      // Clear session
      this.currentUser = null;
      this.isAuthenticated = false;
      this.userProgress = null;
      
      // Clear localStorage
      localStorage.removeItem(this.CURRENT_USER_KEY);
      
      this.dispatchAuthEvent('userLoggedOut', { user });
    }
  }
  
  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }
  
  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated;
  }
  
  // Get user progress instance
  getUserProgress() {
    return this.userProgress;
  }
  
  // Validate registration data
  validateRegistration(data) {
    const { username, email, password, name } = data;
    
    // Username validation
    if (!username || username.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters long' };
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    
    // Email validation
    if (!email || !this.isValidEmail(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    
    // Password validation
    if (!password || password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long' };
    }
    
    // Name validation
    if (!name || name.trim().length < 1) {
      return { valid: false, error: 'Please enter a name' };
    }
    
    return { valid: true };
  }
  
  // Helper methods
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  async hashPassword(password) {
    // Simple hash for localStorage-based auth (not for production)
    // In a real app, this would use bcrypt or similar
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'learnimals_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async verifyPassword(password, hash) {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  async hashSecurityAnswer(answer) {
    // Hash security answer with different salt for additional security
    const encoder = new TextEncoder();
    const data = encoder.encode(answer.toLowerCase().trim() + 'learnimals_security_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifySecurityAnswer(answer, hash) {
    const answerHash = await this.hashSecurityAnswer(answer);
    return answerHash === hash;
  }
  
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // User management
  getAllUsers() {
    try {
      const users = localStorage.getItem(this.USERS_STORAGE_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }
  
  getUserByUsername(username) {
    const users = this.getAllUsers();
    return users.find(user => user.username === username);
  }
  
  getUserByEmail(email) {
    const users = this.getAllUsers();
    return users.find(user => user.email === email);
  }
  
  updateUser(updatedUser) {
    const users = this.getAllUsers();
    const index = users.findIndex(user => user.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
      return true;
    }
    return false;
  }
  
  // User progress management
  loadUserProgress() {
    if (!this.isAuthenticated || !this.currentUser) return;
    
    // Load user-specific progress data
    const userProgressKey = `learnimals-user-data-${this.currentUser.id}`;
    try {
      const savedData = localStorage.getItem(userProgressKey);
      if (savedData && this.userProgress) {
        const userData = JSON.parse(savedData);
        this.userProgress.userData = userData;
      } else if (this.userProgress) {
        // Initialize new user progress with profile info
        this.userProgress.createProfile(
          this.currentUser.profile.name,
          this.currentUser.profile.age,
          this.currentUser.profile.grade,
          this.currentUser.profile.avatar
        );
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  }
  
  saveUserProgress() {
    if (!this.isAuthenticated || !this.currentUser || !this.userProgress) return;
    
    // Save user-specific progress data
    const userProgressKey = `learnimals-user-data-${this.currentUser.id}`;
    try {
      localStorage.setItem(userProgressKey, JSON.stringify(this.userProgress.userData));
    } catch (error) {
      console.error('Error saving user progress:', error);
    }
  }
  
  // Event management
  setupEventListeners() {
    // Listen for page unload to save progress
    window.addEventListener('beforeunload', () => {
      this.saveUserProgress();
    });
    
    // Listen for storage changes (multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === this.CURRENT_USER_KEY) {
        this.loadCurrentUser();
      }
    });
  }
  
  dispatchAuthEvent(eventType, data) {
    const event = new CustomEvent(eventType, {
      detail: data,
      bubbles: true,
      cancelable: false
    });
    document.dispatchEvent(event);
  }
  
  // User switching (for multi-user families)
  switchToUser(userId) {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (user && user.isActive) {
      // Save current user progress
      this.saveUserProgress();
      
      // Switch to new user
      this.currentUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        lastLogin: user.lastLogin
      };
      
      // Update last login
      user.lastLogin = new Date().toISOString();
      this.updateUser(user);
      
      // Save current user session
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this.currentUser));
      
      // Initialize UserProgress for new user
      this.userProgress = new UserProgress();
      this.loadUserProgress();
      
      this.dispatchAuthEvent('userSwitched', { user: this.currentUser });
      
      return { success: true, user: this.currentUser };
    }
    
    return { success: false, error: 'User not found or inactive' };
  }
  
  // Get all users for family account (excluding sensitive data)
  getFamilyUsers() {
    const users = this.getAllUsers();
    return users
      .filter(user => user.isActive)
      .map(user => ({
        id: user.id,
        username: user.username,
        profile: user.profile,
        lastLogin: user.lastLogin
      }));
  }
  
  // Account management
  updateUserProfile(profileData) {
    if (!this.isAuthenticated || !this.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    try {
      // Update current user
      Object.assign(this.currentUser.profile, profileData);
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this.currentUser));
      
      // Update stored user data
      const user = this.getUserByUsername(this.currentUser.username);
      if (user) {
        Object.assign(user.profile, profileData);
        this.updateUser(user);
      }
      
      // Update UserProgress profile
      if (this.userProgress) {
        this.userProgress.updateProfile(profileData);
      }
      
      this.dispatchAuthEvent('userProfileUpdated', { user: this.currentUser });
      
      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }
  
  // Change password
  async changePassword(currentPassword, newPassword) {
    if (!this.isAuthenticated || !this.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    try {
      const user = this.getUserByUsername(this.currentUser.username);
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      
      // Verify current password
      const passwordValid = await this.verifyPassword(currentPassword, user.passwordHash);
      if (!passwordValid) {
        return { success: false, error: 'Current password is incorrect' };
      }
      
      // Validate new password
      if (newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters long' };
      }
      
      // Update password
      user.passwordHash = await this.hashPassword(newPassword);
      this.updateUser(user);
      
      this.dispatchAuthEvent('userPasswordChanged', { user: this.currentUser });
      
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }
  
  // Password reset request
  async requestPasswordReset(username) {
    try {
      const user = this.getUserByUsername(username);
      if (!user) {
        return { success: false, error: 'Username not found' };
      }

      if (!user.securityQuestion) {
        return { success: false, error: 'No security question set for this account' };
      }

      return { 
        success: true, 
        securityQuestion: this.getSecurityQuestionText(user.securityQuestion),
        username: username
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: 'Failed to process password reset request' };
    }
  }

  // Reset password with security question verification
  async resetPassword(username, securityAnswer, newPassword) {
    try {
      const user = this.getUserByUsername(username);
      if (!user) {
        return { success: false, error: 'Username not found' };
      }

      // Verify security answer
      const answerValid = await this.verifySecurityAnswer(securityAnswer, user.securityAnswerHash);
      if (!answerValid) {
        return { success: false, error: 'Security answer is incorrect' };
      }

      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters long' };
      }

      // Update password
      user.passwordHash = await this.hashPassword(newPassword);
      this.updateUser(user);

      this.dispatchAuthEvent('userPasswordReset', { username });

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Failed to reset password' };
    }
  }

  // Get security question text from key
  getSecurityQuestionText(questionKey) {
    const questions = {
      'pet': 'What was the name of your first pet?',
      'school': 'What elementary school did you attend?',
      'city': 'In what city were you born?',
      'book': 'What is your favorite book?',
      'teacher': 'What was your favorite teacher\'s name?',
      'food': 'What is your favorite food?'
    };
    return questions[questionKey] || 'Security question not found';
  }

  // Delete account
  deleteAccount(_password) {
    // Implementation for account deletion
    // This would be a more complex operation in a real app
    console.warn('Account deletion not implemented in localStorage version');
    return { success: false, error: 'Account deletion not available' };
  }
}

// Create singleton instance
const authService = new AuthService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = authService;
} else {
  window.AuthService = authService;
}

export default authService;