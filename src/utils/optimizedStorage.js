/**
 * optimizedStorage.js
 * 
 * Optimized storage utilities for profile and achievement data
 * Provides a high-level interface over CachedStorageManager
 */

import CachedStorageManager from './CachedStorageManager.js';

/**
 * Storage keys used throughout the application
 */
export const STORAGE_KEYS = {
  ACTIVE_PROFILE: 'learnimals_active_profile',
  PROFILES: 'learnimals_profiles',
  SETTINGS: 'learnimals_settings',
  ACHIEVEMENTS: 'learnimals_achievements',
  GAME_STATS: 'learnimals_game_stats',
  USER_PREFERENCES: 'learnimals_user_preferences',
  LEVEL_PROGRESS: 'learnimals_level_progress',
  BADGES: 'learnimals_badges',
  SOCIAL_DATA: 'learnimals_social_data',
  THEME_SETTINGS: 'learnimals_theme_settings',
  PERFORMANCE_DATA: 'learnimals_performance_data'
};

/**
 * Storage configurations for different data types
 */
const STORAGE_CONFIGS = {
  [STORAGE_KEYS.ACTIVE_PROFILE]: {
    ttl: 600000, // 10 minutes - frequently accessed
    immediate: false
  },
  [STORAGE_KEYS.PROFILES]: {
    ttl: 1800000, // 30 minutes - less frequently changed
    immediate: true // Important data, write immediately
  },
  [STORAGE_KEYS.SETTINGS]: {
    ttl: 3600000, // 1 hour - rarely changed
    immediate: true
  },
  [STORAGE_KEYS.ACHIEVEMENTS]: {
    ttl: 1800000, // 30 minutes
    immediate: false
  },
  [STORAGE_KEYS.GAME_STATS]: {
    ttl: 300000, // 5 minutes - frequently updated
    immediate: false
  },
  [STORAGE_KEYS.USER_PREFERENCES]: {
    ttl: 3600000, // 1 hour
    immediate: true
  },
  [STORAGE_KEYS.LEVEL_PROGRESS]: {
    ttl: 600000, // 10 minutes
    immediate: false
  },
  [STORAGE_KEYS.BADGES]: {
    ttl: 1800000, // 30 minutes
    immediate: false
  },
  [STORAGE_KEYS.SOCIAL_DATA]: {
    ttl: 900000, // 15 minutes
    immediate: false
  },
  [STORAGE_KEYS.THEME_SETTINGS]: {
    ttl: 3600000, // 1 hour
    immediate: true
  },
  [STORAGE_KEYS.PERFORMANCE_DATA]: {
    ttl: 300000, // 5 minutes
    immediate: false
  }
};

/**
 * OptimizedStorage class providing high-level storage operations
 */
class OptimizedStorage {
  constructor() {
    this.storage = CachedStorageManager;
    this.migrationVersion = '1.0.0';
    
    // Initialize and perform migration if needed
    this.init();
  }
  
  /**
   * Initialize storage and perform migrations
   */
  init() {
    // Check if migration is needed
    const version = this.storage.get('storage_version');
    if (version !== this.migrationVersion) {
      this.performMigration(version);
    }
    
    // Preload critical data
    this.preloadCriticalData();
  }
  
  /**
   * Perform storage migration if needed
   */
  performMigration(currentVersion) {
    console.log(`Migrating storage from ${currentVersion || 'unknown'} to ${this.migrationVersion}`);
    
    // Migration logic would go here
    // For now, just set the version
    this.storage.set('storage_version', this.migrationVersion, { immediate: true });
  }
  
  /**
   * Preload critical data that's frequently accessed
   */
  preloadCriticalData() {
    const criticalKeys = [
      STORAGE_KEYS.ACTIVE_PROFILE,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.USER_PREFERENCES,
      STORAGE_KEYS.THEME_SETTINGS
    ];
    
    this.storage.preload(criticalKeys);
  }
  
  /**
   * Get data with optimized configuration
   */
  get(key, defaultValue = null) {
    return this.storage.get(key, defaultValue);
  }
  
  /**
   * Set data with optimized configuration
   */
  set(key, value) {
    const config = STORAGE_CONFIGS[key] || {};
    this.storage.set(key, value, config);
  }
  
  /**
   * Remove data
   */
  remove(key) {
    const config = STORAGE_CONFIGS[key] || {};
    this.storage.remove(key, { immediate: config.immediate });
  }
  
  /**
   * Check if key exists
   */
  has(key) {
    return this.storage.has(key);
  }
  
  /**
   * Profile-specific operations
   */
  profile = {
    /**
     * Get active profile with caching
     */
    getActive: () => {
      return this.get(STORAGE_KEYS.ACTIVE_PROFILE);
    },
    
    /**
     * Set active profile
     */
    setActive: (profile) => {
      this.set(STORAGE_KEYS.ACTIVE_PROFILE, profile);
    },
    
    /**
     * Get all profiles
     */
    getAll: () => {
      return this.get(STORAGE_KEYS.PROFILES, []);
    },
    
    /**
     * Set all profiles
     */
    setAll: (profiles) => {
      this.set(STORAGE_KEYS.PROFILES, profiles);
    },
    
    /**
     * Add or update a profile
     */
    save: (profile) => {
      const profiles = this.profile.getAll();
      const existingIndex = profiles.findIndex(p => p.id === profile.id);
      
      if (existingIndex >= 0) {
        profiles[existingIndex] = profile;
      } else {
        profiles.push(profile);
      }
      
      this.profile.setAll(profiles);
      
      // Update active profile if it's the same
      const activeProfile = this.profile.getActive();
      if (activeProfile && activeProfile.id === profile.id) {
        this.profile.setActive(profile);
      }
    },
    
    /**
     * Delete a profile
     */
    delete: (profileId) => {
      const profiles = this.profile.getAll();
      const filtered = profiles.filter(p => p.id !== profileId);
      this.profile.setAll(filtered);
      
      // Clear active profile if it was deleted
      const activeProfile = this.profile.getActive();
      if (activeProfile && activeProfile.id === profileId) {
        this.remove(STORAGE_KEYS.ACTIVE_PROFILE);
      }
    }
  };
  
  /**
   * Achievement-specific operations
   */
  achievements = {
    /**
     * Get all achievements
     */
    getAll: () => {
      return this.get(STORAGE_KEYS.ACHIEVEMENTS, []);
    },
    
    /**
     * Set all achievements
     */
    setAll: (achievements) => {
      this.set(STORAGE_KEYS.ACHIEVEMENTS, achievements);
    },
    
    /**
     * Get achievements for a specific profile
     */
    getForProfile: (profileId) => {
      const allAchievements = this.achievements.getAll();
      return allAchievements.filter(a => a.profileId === profileId);
    },
    
    /**
     * Add or update an achievement
     */
    save: (achievement) => {
      const achievements = this.achievements.getAll();
      const existingIndex = achievements.findIndex(a => 
        a.id === achievement.id && a.profileId === achievement.profileId
      );
      
      if (existingIndex >= 0) {
        achievements[existingIndex] = achievement;
      } else {
        achievements.push(achievement);
      }
      
      this.achievements.setAll(achievements);
    },
    
    /**
     * Batch update achievements (more efficient)
     */
    saveBatch: (achievements) => {
      const existing = this.achievements.getAll();
      const updated = [...existing];
      
      achievements.forEach(achievement => {
        const existingIndex = updated.findIndex(a => 
          a.id === achievement.id && a.profileId === achievement.profileId
        );
        
        if (existingIndex >= 0) {
          updated[existingIndex] = achievement;
        } else {
          updated.push(achievement);
        }
      });
      
      this.achievements.setAll(updated);
    }
  };
  
  /**
   * Level progress operations
   */
  levelProgress = {
    /**
     * Get level progress for profile
     */
    get: (profileId) => {
      const key = `${STORAGE_KEYS.LEVEL_PROGRESS}_${profileId}`;
      return this.get(key, { level: 1, xp: 0, totalXp: 0 });
    },
    
    /**
     * Set level progress for profile
     */
    set: (profileId, progress) => {
      const key = `${STORAGE_KEYS.LEVEL_PROGRESS}_${profileId}`;
      this.set(key, progress);
    },
    
    /**
     * Update XP for profile
     */
    addXP: (profileId, xpGain) => {
      const progress = this.levelProgress.get(profileId);
      progress.xp += xpGain;
      progress.totalXp += xpGain;
      this.levelProgress.set(profileId, progress);
      return progress;
    }
  };
  
  /**
   * Game statistics operations
   */
  gameStats = {
    /**
     * Get game stats for profile
     */
    get: (profileId, gameType) => {
      const key = `${STORAGE_KEYS.GAME_STATS}_${profileId}_${gameType}`;
      return this.get(key, {
        gamesPlayed: 0,
        bestScore: 0,
        totalScore: 0,
        averageScore: 0,
        timeSpent: 0,
        lastPlayed: null
      });
    },
    
    /**
     * Update game stats
     */
    update: (profileId, gameType, stats) => {
      const key = `${STORAGE_KEYS.GAME_STATS}_${profileId}_${gameType}`;
      const existing = this.gameStats.get(profileId, gameType);
      
      const updated = {
        ...existing,
        ...stats,
        gamesPlayed: existing.gamesPlayed + 1,
        totalScore: existing.totalScore + (stats.score || 0),
        lastPlayed: new Date().toISOString()
      };
      
      updated.averageScore = updated.gamesPlayed > 0 
        ? Math.round(updated.totalScore / updated.gamesPlayed) 
        : 0;
      
      this.set(key, updated);
      return updated;
    }
  };
  
  /**
   * Settings operations
   */
  settings = {
    /**
     * Get user settings
     */
    get: () => {
      return this.get(STORAGE_KEYS.SETTINGS, {
        soundEnabled: true,
        musicEnabled: true,
        animationsEnabled: true,
        difficulty: 'normal',
        language: 'en',
        theme: 'auto',
        notifications: true
      });
    },
    
    /**
     * Set user settings
     */
    set: (settings) => {
      this.set(STORAGE_KEYS.SETTINGS, settings);
    },
    
    /**
     * Update specific setting
     */
    update: (key, value) => {
      const settings = this.settings.get();
      settings[key] = value;
      this.settings.set(settings);
    }
  };
  
  /**
   * Theme settings operations
   */
  theme = {
    /**
     * Get theme settings
     */
    get: () => {
      return this.get(STORAGE_KEYS.THEME_SETTINGS, {
        mode: 'auto', // 'light', 'dark', 'auto'
        colorScheme: 'default',
        reducedMotion: false,
        highContrast: false
      });
    },
    
    /**
     * Set theme settings
     */
    set: (themeSettings) => {
      this.set(STORAGE_KEYS.THEME_SETTINGS, themeSettings);
    }
  };
  
  /**
   * Performance data operations
   */
  performance = {
    /**
     * Log performance data
     */
    log: (operation, duration, metadata = {}) => {
      const perfData = this.get(STORAGE_KEYS.PERFORMANCE_DATA, []);
      
      perfData.push({
        operation,
        duration,
        metadata,
        timestamp: Date.now()
      });
      
      // Keep only last 100 entries
      if (perfData.length > 100) {
        perfData.splice(0, perfData.length - 100);
      }
      
      this.set(STORAGE_KEYS.PERFORMANCE_DATA, perfData);
    },
    
    /**
     * Get performance statistics
     */
    getStats: () => {
      return this.get(STORAGE_KEYS.PERFORMANCE_DATA, []);
    },
    
    /**
     * Clear performance data
     */
    clear: () => {
      this.remove(STORAGE_KEYS.PERFORMANCE_DATA);
    }
  };
  
  /**
   * Utility operations
   */
  utils = {
    /**
     * Get storage statistics
     */
    getStorageStats: () => {
      return this.storage.getCacheStats();
    },
    
    /**
     * Clear all data
     */
    clearAll: () => {
      this.storage.clear();
    },
    
    /**
     * Export all data for backup
     */
    exportData: () => {
      const data = {};
      
      Object.values(STORAGE_KEYS).forEach(key => {
        const value = this.get(key);
        if (value !== null) {
          data[key] = value;
        }
      });
      
      return {
        version: this.migrationVersion,
        timestamp: new Date().toISOString(),
        data
      };
    },
    
    /**
     * Import data from backup
     */
    importData: (backup) => {
      if (!backup.data) {
        throw new Error('Invalid backup format');
      }
      
      Object.entries(backup.data).forEach(([key, value]) => {
        this.set(key, value);
      });
      
      // Force write all data immediately
      this.storage.flushWriteQueue();
    },
    
    /**
     * Get memory usage estimate
     */
    getMemoryUsage: () => {
      return this.storage.getCacheStats().memoryUsage;
    },
    
    /**
     * Optimize storage (cleanup and defragment)
     */
    optimize: () => {
      // Force cleanup of expired items
      this.storage.cleanupExpiredItems();
      
      // Flush any pending writes
      this.storage.flushWriteQueue();
      
      // Preload critical data
      this.preloadCriticalData();
    }
  };
  
  /**
   * Debug operations
   */
  debug = {
    /**
     * Get cache contents for debugging
     */
    getCacheContents: () => {
      return this.storage.exportCache();
    },
    
    /**
     * Enable performance logging
     */
    enablePerformanceLogging: () => {
      const originalGet = this.get.bind(this);
      const originalSet = this.set.bind(this);
      
      this.get = (key, defaultValue) => {
        const start = performance.now();
        const result = originalGet(key, defaultValue);
        const duration = performance.now() - start;
        
        this.performance.log('get', duration, { key });
        return result;
      };
      
      this.set = (key, value) => {
        const start = performance.now();
        const result = originalSet(key, value);
        const duration = performance.now() - start;
        
        this.performance.log('set', duration, { key });
        return result;
      };
    }
  };
}

// Create and export singleton instance
const optimizedStorage = new OptimizedStorage();

export default optimizedStorage;