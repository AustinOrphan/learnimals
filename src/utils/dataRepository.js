// Abstract Data Repository Interface
// Provides standardized interface for data storage that can be implemented
// with localStorage, IndexedDB, or future backend APIs

class DataRepository {
  constructor() {
    if (this.constructor === DataRepository) {
      throw new Error('DataRepository is abstract and cannot be instantiated directly');
    }
  }

  // User Management
  async createUser(_userData) {
    throw new Error('createUser method must be implemented');
  }

  async getUserById(_userId) {
    throw new Error('getUserById method must be implemented');
  }

  async getUserByUsername(_username) {
    throw new Error('getUserByUsername method must be implemented');
  }

  async updateUser(_userId, _userData) {
    throw new Error('updateUser method must be implemented');
  }

  async deleteUser(_userId) {
    throw new Error('deleteUser method must be implemented');
  }

  async getAllUsers() {
    throw new Error('getAllUsers method must be implemented');
  }

  // User Progress Management
  async getUserProgress(_userId) {
    throw new Error('getUserProgress method must be implemented');
  }

  async updateUserProgress(_userId, _progressData) {
    throw new Error('updateUserProgress method must be implemented');
  }

  async getUserAchievements(_userId) {
    throw new Error('getUserAchievements method must be implemented');
  }

  async addUserAchievement(_userId, _achievementData) {
    throw new Error('addUserAchievement method must be implemented');
  }

  // Family Management
  async getFamilyUsers(_familyId) {
    throw new Error('getFamilyUsers method must be implemented');
  }

  async addUserToFamily(_userId, _familyId) {
    throw new Error('addUserToFamily method must be implemented');
  }

  async removeUserFromFamily(_userId, _familyId) {
    throw new Error('removeUserFromFamily method must be implemented');
  }

  // Authentication Session
  async getCurrentUser() {
    throw new Error('getCurrentUser method must be implemented');
  }

  async setCurrentUser(_userId) {
    throw new Error('setCurrentUser method must be implemented');
  }

  async clearCurrentUser() {
    throw new Error('clearCurrentUser method must be implemented');
  }

  // Data Management
  async exportAllData() {
    throw new Error('exportAllData method must be implemented');
  }

  async importData(_data) {
    throw new Error('importData method must be implemented');
  }

  async clearAllData() {
    throw new Error('clearAllData method must be implemented');
  }

  // Health Check
  async isAvailable() {
    throw new Error('isAvailable method must be implemented');
  }

  // Data Validation (optional override)
  validateUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      throw new Error('User data must be an object');
    }
    
    if (!userData.username || typeof userData.username !== 'string') {
      throw new Error('Username is required and must be a string');
    }
    
    if (userData.username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    
    return true;
  }

  validateProgressData(progressData) {
    if (!progressData || typeof progressData !== 'object') {
      throw new Error('Progress data must be an object');
    }
    
    return true;
  }

  // Utility methods that can be shared across implementations
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getCurrentTimestamp() {
    return new Date().toISOString();
  }

  // Error handling wrapper
  async executeWithErrorHandling(operation, operationName) {
    try {
      return await operation();
    } catch (error) {
      const enhancedError = new Error(`${operationName} failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.operation = operationName;
      enhancedError.timestamp = this.getCurrentTimestamp();
      throw enhancedError;
    }
  }
}

export default DataRepository;