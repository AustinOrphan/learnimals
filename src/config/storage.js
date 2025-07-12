// Storage Configuration
// Manages different storage backends and provides unified configuration

import LocalStorageRepository from '../utils/localStorageRepository.js';

// Storage backend types
export const STORAGE_TYPES = {
  LOCAL_STORAGE: 'localStorage',
  INDEXEDDB: 'indexedDB',
  API: 'api',
  MEMORY: 'memory'
};

// Default storage configuration
const DEFAULT_CONFIG = {
  // Primary storage backend
  primary: STORAGE_TYPES.LOCAL_STORAGE,
  
  // Fallback storage backends (in order of preference)
  fallbacks: [STORAGE_TYPES.MEMORY],
  
  // API configuration (for future backend integration)
  api: {
    baseUrl: process.env.LEARNIMALS_API_URL || 'http://localhost:3000/api',
    version: 'v1',
    timeout: 10000,
    retries: 3,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  
  // localStorage configuration
  localStorage: {
    prefix: 'learnimals_',
    compressed: false,
    encrypted: false
  },
  
  // IndexedDB configuration (for future use)
  indexedDB: {
    dbName: 'LearnimalsDB',
    version: 1,
    stores: {
      users: 'users',
      progress: 'progress',
      achievements: 'achievements'
    }
  },
  
  // Memory storage configuration (for testing/fallback)
  memory: {
    maxEntries: 10000,
    ttl: null // No expiration
  },
  
  // Data migration settings
  migration: {
    enabled: true,
    backupBeforeMigration: true,
    autoMigrate: true
  },
  
  // Cache settings
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 100 // Max number of cached items
  },
  
  // Error handling
  errorHandling: {
    retryFailedOperations: true,
    maxRetries: 3,
    retryDelay: 1000,
    fallbackOnError: true
  }
};

class StorageConfig {
  constructor(customConfig = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, customConfig);
    this.repository = null;
    this.initialized = false;
  }
  
  // Merge custom configuration with defaults
  mergeConfig(defaultConfig, customConfig) {
    const merged = { ...defaultConfig };
    
    Object.keys(customConfig).forEach(key => {
      if (typeof customConfig[key] === 'object' && !Array.isArray(customConfig[key])) {
        merged[key] = { ...defaultConfig[key], ...customConfig[key] };
      } else {
        merged[key] = customConfig[key];
      }
    });
    
    return merged;
  }
  
  // Initialize storage based on configuration
  async initialize() {
    if (this.initialized) return this.repository;
    
    try {
      this.repository = await this.createRepository(this.config.primary);
      this.initialized = true;
      
      console.log(`Storage initialized with ${this.config.primary} backend`);
      return this.repository;
      
    } catch (error) {
      console.warn(`Failed to initialize ${this.config.primary} storage:`, error);
      
      // Try fallback options
      for (const fallback of this.config.fallbacks) {
        try {
          this.repository = await this.createRepository(fallback);
          this.initialized = true;
          
          console.log(`Storage initialized with fallback ${fallback} backend`);
          return this.repository;
          
        } catch (fallbackError) {
          console.warn(`Fallback ${fallback} also failed:`, fallbackError);
        }
      }
      
      throw new Error('All storage backends failed to initialize');
    }
  }
  
  // Create repository instance based on type
  async createRepository(type) {
    switch (type) {
    case STORAGE_TYPES.LOCAL_STORAGE:
      return this.createLocalStorageRepository();
        
    case STORAGE_TYPES.INDEXEDDB:
      throw new Error('IndexedDB repository not yet implemented');
        
    case STORAGE_TYPES.API:
      throw new Error('API repository not yet implemented');
        
    case STORAGE_TYPES.MEMORY:
      throw new Error('Memory repository not yet implemented');
        
    default:
      throw new Error(`Unknown storage type: ${type}`);
    }
  }
  
  // Create and configure localStorage repository
  async createLocalStorageRepository() {
    const repository = new LocalStorageRepository();
    
    // Test availability
    const isAvailable = await repository.isAvailable();
    if (!isAvailable) {
      throw new Error('localStorage is not available');
    }
    
    return repository;
  }
  
  // Get current repository instance
  getRepository() {
    if (!this.initialized) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return this.repository;
  }
  
  // Get configuration values
  get(key) {
    return this.getNestedValue(this.config, key);
  }
  
  // Set configuration values
  set(key, value) {
    this.setNestedValue(this.config, key, value);
  }
  
  // Helper method to get nested configuration values
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  // Helper method to set nested configuration values
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      current[key] = current[key] || {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
  
  // Environment-based configuration detection
  static detectEnvironmentConfig() {
    const config = {};
    
    // Detect environment
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    const isTesting = process.env.NODE_ENV === 'test';
    
    // Configure based on environment
    if (isTesting) {
      config.primary = STORAGE_TYPES.MEMORY;
      config.fallbacks = [];
    } else if (isDevelopment) {
      config.primary = STORAGE_TYPES.LOCAL_STORAGE;
      config.errorHandling = {
        ...DEFAULT_CONFIG.errorHandling,
        retryFailedOperations: false // Fail fast in development
      };
    } else if (isProduction) {
      config.primary = STORAGE_TYPES.LOCAL_STORAGE;
      config.fallbacks = [STORAGE_TYPES.MEMORY];
    }
    
    // API configuration from environment
    if (process.env.LEARNIMALS_API_URL) {
      config.api = {
        ...DEFAULT_CONFIG.api,
        baseUrl: process.env.LEARNIMALS_API_URL
      };
    }
    
    return config;
  }
  
  // Export current data for migration
  async exportData() {
    if (!this.repository) {
      throw new Error('Repository not initialized');
    }
    
    return this.repository.exportAllData();
  }
  
  // Import data from another source
  async importData(data) {
    if (!this.repository) {
      throw new Error('Repository not initialized');
    }
    
    return this.repository.importData(data);
  }
  
  // Clear all data
  async clearAllData() {
    if (!this.repository) {
      throw new Error('Repository not initialized');
    }
    
    return this.repository.clearAllData();
  }
  
  // Health check
  async healthCheck() {
    if (!this.repository) {
      return { healthy: false, error: 'Repository not initialized' };
    }
    
    try {
      const isAvailable = await this.repository.isAvailable();
      return { 
        healthy: isAvailable, 
        backend: this.config.primary,
        initialized: this.initialized
      };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message,
        backend: this.config.primary
      };
    }
  }
}

// Global storage configuration instance
let globalStorageConfig = null;

// Initialize global storage with environment detection
export async function initializeStorage(customConfig = {}) {
  const envConfig = StorageConfig.detectEnvironmentConfig();
  const finalConfig = { ...envConfig, ...customConfig };
  
  globalStorageConfig = new StorageConfig(finalConfig);
  await globalStorageConfig.initialize();
  
  return globalStorageConfig;
}

// Get global storage instance
export function getStorage() {
  if (!globalStorageConfig) {
    throw new Error('Storage not initialized. Call initializeStorage() first.');
  }
  return globalStorageConfig;
}

// Get repository directly
export function getRepository() {
  return getStorage().getRepository();
}

// Export configuration class
export { StorageConfig };

// Export default configuration
export default DEFAULT_CONFIG;