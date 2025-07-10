// User Data Model
// Standardized user data structure compatible with frontend and backend systems

class User {
  constructor(data = {}) {
    // Required fields
    this.id = data.id || null;
    this.username = data.username || '';
    
    // Profile information
    this.profile = {
      name: data.profile?.name || '',
      avatar: data.profile?.avatar || 'default',
      age: data.profile?.age || null,
      grade: data.profile?.grade || null,
      email: data.profile?.email || null,
      bio: data.profile?.bio || '',
      ...data.profile
    };
    
    // Authentication data
    this.passwordHash = data.passwordHash || null;
    this.securityQuestion = data.securityQuestion || null;
    this.securityAnswer = data.securityAnswer || null;
    
    // Role and permissions
    this.role = data.role || 'learner'; // learner, child, teen, parent, admin
    this.permissions = data.permissions || this.getDefaultPermissions(this.role);
    
    // Family relationships
    this.familyId = data.familyId || null;
    this.parentId = data.parentId || null; // For child accounts
    this.childIds = data.childIds || []; // For parent accounts
    
    // Account settings
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.theme = data.theme || 'light';
    this.language = data.language || 'en';
    this.notifications = {
      email: data.notifications?.email !== undefined ? data.notifications.email : true,
      push: data.notifications?.push !== undefined ? data.notifications.push : true,
      achievements: data.notifications?.achievements !== undefined ? data.notifications.achievements : true,
      progress: data.notifications?.progress !== undefined ? data.notifications.progress : true,
      ...data.notifications
    };
    
    // Privacy settings
    this.privacy = {
      showProfile: data.privacy?.showProfile !== undefined ? data.privacy.showProfile : true,
      showProgress: data.privacy?.showProgress !== undefined ? data.privacy.showProgress : false,
      shareAchievements: data.privacy?.shareAchievements !== undefined ? data.privacy.shareAchievements : true,
      ...data.privacy
    };
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastLogin = data.lastLogin || null;
    this.lastActivity = data.lastActivity || null;
    
    // Additional metadata
    this.metadata = data.metadata || {};
  }
  
  // Get default permissions based on role
  getDefaultPermissions(role) {
    const permissionSets = {
      'admin': {
        canManageUsers: true,
        canManageContent: true,
        canViewAnalytics: true,
        canManageFamily: true,
        canCreateChildren: true,
        canSwitchUsers: true,
        canExportData: true
      },
      'parent': {
        canManageUsers: false,
        canManageContent: false,
        canViewAnalytics: false,
        canManageFamily: true,
        canCreateChildren: true,
        canSwitchUsers: true,
        canExportData: true
      },
      'teen': {
        canManageUsers: false,
        canManageContent: false,
        canViewAnalytics: false,
        canManageFamily: false,
        canCreateChildren: false,
        canSwitchUsers: false,
        canExportData: false
      },
      'child': {
        canManageUsers: false,
        canManageContent: false,
        canViewAnalytics: false,
        canManageFamily: false,
        canCreateChildren: false,
        canSwitchUsers: false,
        canExportData: false
      },
      'learner': {
        canManageUsers: false,
        canManageContent: false,
        canViewAnalytics: false,
        canManageFamily: false,
        canCreateChildren: false,
        canSwitchUsers: false,
        canExportData: false
      }
    };
    
    return permissionSets[role] || permissionSets['learner'];
  }
  
  // Validation methods
  validate() {
    const errors = [];
    
    // Required field validation
    if (!this.username || this.username.trim().length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(this.username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
    
    if (!this.profile.name || this.profile.name.trim().length < 1) {
      errors.push('Name is required');
    }
    
    // Age validation for child accounts
    if (this.role === 'child' && (!this.profile.age || this.profile.age < 3 || this.profile.age > 17)) {
      errors.push('Child accounts must have age between 3 and 17');
    }
    
    // Email validation if provided
    if (this.profile.email && !this.isValidEmail(this.profile.email)) {
      errors.push('Invalid email format');
    }
    
    // Role validation
    const validRoles = ['learner', 'child', 'teen', 'parent', 'admin'];
    if (!validRoles.includes(this.role)) {
      errors.push('Invalid user role');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // Permission checking methods
  hasPermission(permission) {
    return this.permissions[permission] === true;
  }
  
  canManageFamily() {
    return this.hasPermission('canManageFamily');
  }
  
  canCreateChildren() {
    return this.hasPermission('canCreateChildren');
  }
  
  canSwitchUsers() {
    return this.hasPermission('canSwitchUsers');
  }
  
  // Role checking methods
  isAdmin() {
    return this.role === 'admin';
  }
  
  isParent() {
    return this.role === 'parent';
  }
  
  isChild() {
    return this.role === 'child';
  }
  
  isTeen() {
    return this.role === 'teen';
  }
  
  isLearner() {
    return this.role === 'learner';
  }
  
  // Age-based role determination
  static determineRoleFromAge(age) {
    if (!age) return 'learner';
    if (age >= 18) return 'parent';
    if (age >= 13) return 'teen';
    return 'child';
  }
  
  // Data transformation methods
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      profile: this.profile,
      passwordHash: this.passwordHash,
      securityQuestion: this.securityQuestion,
      securityAnswer: this.securityAnswer,
      role: this.role,
      permissions: this.permissions,
      familyId: this.familyId,
      parentId: this.parentId,
      childIds: this.childIds,
      isActive: this.isActive,
      theme: this.theme,
      language: this.language,
      notifications: this.notifications,
      privacy: this.privacy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin,
      lastActivity: this.lastActivity,
      metadata: this.metadata
    };
  }
  
  // Create a safe version without sensitive data for client-side use
  toSafeJSON() {
    const safeData = { ...this.toJSON() };
    delete safeData.passwordHash;
    delete safeData.securityAnswer;
    return safeData;
  }
  
  // Update user data
  update(newData) {
    // Preserve ID and creation date
    const protectedFields = ['id', 'createdAt'];
    const filteredData = { ...newData };
    protectedFields.forEach(field => delete filteredData[field]);
    
    // Update timestamp
    filteredData.updatedAt = new Date().toISOString();
    
    // Merge data
    Object.assign(this, filteredData);
    
    // Merge nested objects properly
    if (newData.profile) {
      this.profile = { ...this.profile, ...newData.profile };
    }
    if (newData.notifications) {
      this.notifications = { ...this.notifications, ...newData.notifications };
    }
    if (newData.privacy) {
      this.privacy = { ...this.privacy, ...newData.privacy };
    }
    if (newData.metadata) {
      this.metadata = { ...this.metadata, ...newData.metadata };
    }
    
    return this;
  }
  
  // Static factory methods
  static fromStorageData(data) {
    return new User(data);
  }
  
  static createChild(parentUser, childData) {
    if (!parentUser.canCreateChildren()) {
      throw new Error('User does not have permission to create child accounts');
    }
    
    const child = new User({
      ...childData,
      role: User.determineRoleFromAge(childData.age),
      familyId: parentUser.familyId,
      parentId: parentUser.id,
      permissions: this.prototype.getDefaultPermissions('child')
    });
    
    return child;
  }
  
  // Update last activity timestamp
  updateActivity() {
    this.lastActivity = new Date().toISOString();
    return this;
  }
  
  // Check if user has been active recently
  isRecentlyActive(hoursThreshold = 24) {
    if (!this.lastActivity) return false;
    
    const lastActivity = new Date(this.lastActivity);
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - hoursThreshold);
    
    return lastActivity > threshold;
  }
}

export default User;