// LocalStorage Repository Implementation
// Implements DataRepository interface using browser localStorage
// Maintains backward compatibility with existing data structure

import DataRepository from './dataRepository.js';

class LocalStorageRepository extends DataRepository {
  constructor() {
    super();
    this.storageKeys = {
      users: 'learnimals_users',
      currentUser: 'learnimals_current_user',
      userProgress: 'learnimals_user_progress',
      achievements: 'learnimals_achievements',
      families: 'learnimals_families'
    };
  }

  // Helper methods for localStorage operations
  getStorageItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key: ${key}`, error);
      return null;
    }
  }

  setStorageItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage key: ${key}`, error);
      throw new Error(`Failed to save data: ${error.message}`);
    }
  }

  removeStorageItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key: ${key}`, error);
      return false;
    }
  }

  // User Management Implementation
  async createUser(userData) {
    return this.executeWithErrorHandling(async () => {
      // Validate user data
      this.validateUserData(userData);
      
      // Get existing users
      const users = this.getStorageItem(this.storageKeys.users) || {};
      
      // Check if username already exists
      const existingUser = Object.values(users).find(user => user.username === userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }
      
      // Create new user with ID
      const userId = userData.id || this.generateId();
      const newUser = {
        id: userId,
        username: userData.username,
        profile: userData.profile || {},
        role: userData.role || 'learner',
        familyId: userData.familyId || null,
        createdAt: this.getCurrentTimestamp(),
        lastLogin: null,
        isActive: true,
        ...userData
      };
      
      // Add to users collection
      users[userId] = newUser;
      this.setStorageItem(this.storageKeys.users, users);
      
      return { success: true, user: newUser };
    }, 'createUser');
  }

  async getUserById(userId) {
    return this.executeWithErrorHandling(async () => {
      if (!userId) return null;
      
      const users = this.getStorageItem(this.storageKeys.users) || {};
      return users[userId] || null;
    }, 'getUserById');
  }

  async getUserByUsername(username) {
    return this.executeWithErrorHandling(async () => {
      if (!username) return null;
      
      const users = this.getStorageItem(this.storageKeys.users) || {};
      return Object.values(users).find(user => user.username === username) || null;
    }, 'getUserByUsername');
  }

  async updateUser(userId, userData) {
    return this.executeWithErrorHandling(async () => {
      if (!userId) throw new Error('User ID is required');
      
      const users = this.getStorageItem(this.storageKeys.users) || {};
      const existingUser = users[userId];
      
      if (!existingUser) {
        throw new Error('User not found');
      }
      
      // Merge update data with existing user
      const updatedUser = {
        ...existingUser,
        ...userData,
        id: userId, // Ensure ID doesn't change
        updatedAt: this.getCurrentTimestamp()
      };
      
      users[userId] = updatedUser;
      this.setStorageItem(this.storageKeys.users, users);
      
      return { success: true, user: updatedUser };
    }, 'updateUser');
  }

  async deleteUser(userId) {
    return this.executeWithErrorHandling(async () => {
      if (!userId) throw new Error('User ID is required');
      
      const users = this.getStorageItem(this.storageKeys.users) || {};
      
      if (!users[userId]) {
        throw new Error('User not found');
      }
      
      // Remove user
      delete users[userId];
      this.setStorageItem(this.storageKeys.users, users);
      
      // Clean up related data
      this.removeStorageItem(`${this.storageKeys.userProgress}_${userId}`);
      this.removeStorageItem(`${this.storageKeys.achievements}_${userId}`);
      
      return { success: true };
    }, 'deleteUser');
  }

  async getAllUsers() {
    return this.executeWithErrorHandling(async () => {
      const users = this.getStorageItem(this.storageKeys.users) || {};
      return Object.values(users);
    }, 'getAllUsers');
  }

  // User Progress Management
  async getUserProgress(userId) {
    return this.executeWithErrorHandling(async () => {
      if (!userId) return null;
      
      const progressKey = `${this.storageKeys.userProgress}_${userId}`;
      return this.getStorageItem(progressKey);
    }, 'getUserProgress');
  }

  async updateUserProgress(userId, progressData) {
    return this.executeWithErrorHandling(async () => {
      if (!userId) throw new Error('User ID is required');
      
      this.validateProgressData(progressData);
      
      const progressKey = `${this.storageKeys.userProgress}_${userId}`;
      const existingProgress = this.getStorageItem(progressKey) || {};
      
      const updatedProgress = {
        ...existingProgress,
        ...progressData,
        userId,
        updatedAt: this.getCurrentTimestamp()
      };
      
      this.setStorageItem(progressKey, updatedProgress);
      
      return { success: true, progress: updatedProgress };
    }, 'updateUserProgress');
  }

  async getUserAchievements(userId) {
    return this.executeWithErrorHandling(async () => {
      if (!userId) return [];
      
      const achievementsKey = `${this.storageKeys.achievements}_${userId}`;
      return this.getStorageItem(achievementsKey) || [];
    }, 'getUserAchievements');
  }

  async addUserAchievement(userId, achievementData) {
    return this.executeWithErrorHandling(async () => {
      if (!userId) throw new Error('User ID is required');
      if (!achievementData) throw new Error('Achievement data is required');
      
      const achievementsKey = `${this.storageKeys.achievements}_${userId}`;
      const achievements = this.getStorageItem(achievementsKey) || [];
      
      const newAchievement = {
        id: this.generateId(),
        userId,
        earnedAt: this.getCurrentTimestamp(),
        ...achievementData
      };
      
      achievements.push(newAchievement);
      this.setStorageItem(achievementsKey, achievements);
      
      return { success: true, achievement: newAchievement };
    }, 'addUserAchievement');
  }

  // Family Management
  async getFamilyUsers(familyId) {
    return this.executeWithErrorHandling(async () => {
      if (!familyId) return [];
      
      const users = this.getStorageItem(this.storageKeys.users) || {};
      return Object.values(users).filter(user => user.familyId === familyId);
    }, 'getFamilyUsers');
  }

  async addUserToFamily(userId, familyId) {
    return this.executeWithErrorHandling(async () => {
      if (!userId || !familyId) throw new Error('User ID and Family ID are required');
      
      return this.updateUser(userId, { familyId });
    }, 'addUserToFamily');
  }

  async removeUserFromFamily(userId, _familyId) {
    return this.executeWithErrorHandling(async () => {
      if (!userId) throw new Error('User ID is required');
      
      return this.updateUser(userId, { familyId: null });
    }, 'removeUserFromFamily');
  }

  // Authentication Session
  async getCurrentUser() {
    return this.executeWithErrorHandling(async () => {
      const currentUserId = this.getStorageItem(this.storageKeys.currentUser);
      if (!currentUserId) return null;
      
      return this.getUserById(currentUserId);
    }, 'getCurrentUser');
  }

  async setCurrentUser(userId) {
    return this.executeWithErrorHandling(async () => {
      if (!userId) throw new Error('User ID is required');
      
      // Verify user exists
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update last login
      await this.updateUser(userId, { lastLogin: this.getCurrentTimestamp() });
      
      // Set as current user
      this.setStorageItem(this.storageKeys.currentUser, userId);
      
      return { success: true, user };
    }, 'setCurrentUser');
  }

  async clearCurrentUser() {
    return this.executeWithErrorHandling(async () => {
      this.removeStorageItem(this.storageKeys.currentUser);
      return { success: true };
    }, 'clearCurrentUser');
  }

  // Data Management
  async exportAllData() {
    return this.executeWithErrorHandling(async () => {
      const exportData = {
        version: '1.0',
        exportedAt: this.getCurrentTimestamp(),
        data: {}
      };
      
      // Export all storage keys
      Object.entries(this.storageKeys).forEach(([key, storageKey]) => {
        exportData.data[key] = this.getStorageItem(storageKey);
      });
      
      // Export user-specific progress and achievements
      const users = this.getStorageItem(this.storageKeys.users) || {};
      exportData.data.userProgress = {};
      exportData.data.userAchievements = {};
      
      Object.keys(users).forEach(userId => {
        exportData.data.userProgress[userId] = this.getStorageItem(`${this.storageKeys.userProgress}_${userId}`);
        exportData.data.userAchievements[userId] = this.getStorageItem(`${this.storageKeys.achievements}_${userId}`);
      });
      
      return exportData;
    }, 'exportAllData');
  }

  async importData(data) {
    return this.executeWithErrorHandling(async () => {
      if (!data || !data.data) throw new Error('Invalid import data format');
      
      // Import main storage keys
      Object.entries(this.storageKeys).forEach(([key, storageKey]) => {
        if (data.data[key]) {
          this.setStorageItem(storageKey, data.data[key]);
        }
      });
      
      // Import user-specific data
      if (data.data.userProgress) {
        Object.entries(data.data.userProgress).forEach(([userId, progress]) => {
          if (progress) {
            this.setStorageItem(`${this.storageKeys.userProgress}_${userId}`, progress);
          }
        });
      }
      
      if (data.data.userAchievements) {
        Object.entries(data.data.userAchievements).forEach(([userId, achievements]) => {
          if (achievements) {
            this.setStorageItem(`${this.storageKeys.achievements}_${userId}`, achievements);
          }
        });
      }
      
      return { success: true };
    }, 'importData');
  }

  async clearAllData() {
    return this.executeWithErrorHandling(async () => {
      // Remove all storage keys
      Object.values(this.storageKeys).forEach(key => {
        this.removeStorageItem(key);
      });
      
      // Find and remove user-specific keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith(this.storageKeys.userProgress) ||
          key.startsWith(this.storageKeys.achievements)
        )) {
          localStorage.removeItem(key);
        }
      }
      
      return { success: true };
    }, 'clearAllData');
  }

  // Health Check
  async isAvailable() {
    try {
      // Test localStorage availability
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default LocalStorageRepository;