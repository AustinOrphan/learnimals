/**
 * profileManager.js
 * 
 * Enhanced profile management system for Learnimals
 * Extends user profiles with avatars, themes, stats, and social features
 */

import { getProgressTracker } from './progressIntegration.js';
import logger from './logger.js';

class ProfileManager {
  constructor() {
    this.STORAGE_KEY = 'enhancedUserProfiles';
    this.ACTIVE_PROFILE_KEY = 'activeProfileId';
    this.profiles = new Map();
    this.activeProfileId = null;
    
    this.loadProfiles();
    this.setupEventListeners();
  }
  
  /**
   * Load profiles from localStorage
   */
  loadProfiles() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([id, profile]) => {
          this.profiles.set(id, this.migrateProfile(profile));
        });
      }
      
      // Load active profile
      this.activeProfileId = localStorage.getItem(this.ACTIVE_PROFILE_KEY);
      
      // Migrate existing users if needed
      this.migrateExistingUsers();
      
    } catch (error) {
      logger.error('Failed to load profiles:', error);
    }
  }
  
  /**
   * Migrate profile to latest schema
   */
  migrateProfile(profile) {
    return {
      // Basic info (existing)
      id: profile.id,
      name: profile.name,
      email: profile.email || '',
      role: profile.role || 'student',
      createdAt: profile.createdAt || new Date().toISOString(),
      
      // Enhanced profile data (new)
      avatar: profile.avatar || this.getDefaultAvatar(),
      bio: profile.bio || '',
      favoriteSubject: profile.favoriteSubject || null,
      favoriteCharacter: profile.favoriteCharacter || null,
      
      // Customization
      theme: profile.theme || 'default',
      colorScheme: profile.colorScheme || 'blue',
      fontSize: profile.fontSize || 'medium',
      soundEnabled: profile.soundEnabled !== false,
      
      // Stats and progress
      level: profile.level || 1,
      xp: profile.xp || 0,
      totalPlayTime: profile.totalPlayTime || 0,
      lastActive: profile.lastActive || new Date().toISOString(),
      streakDays: profile.streakDays || 0,
      
      // Social features
      friendCode: profile.friendCode || this.generateFriendCode(),
      friends: profile.friends || [],
      privacy: profile.privacy || {
        showProfile: true,
        showAchievements: true,
        showStats: true,
        allowFriendRequests: true
      },
      
      // Unlockables
      unlockedAvatarItems: profile.unlockedAvatarItems || [],
      unlockedThemes: profile.unlockedThemes || ['default'],
      unlockedTitles: profile.unlockedTitles || ['Learner'],
      selectedTitle: profile.selectedTitle || 'Learner',
      
      // Preferences
      preferences: profile.preferences || {
        difficulty: 'medium',
        hintsEnabled: true,
        animationsEnabled: true,
        autoSave: true,
        notifications: {
          achievements: true,
          dailyReminder: false,
          friendActivity: true
        }
      }
    };
  }
  
  /**
   * Migrate existing users from old system
   */
  migrateExistingUsers() {
    const oldUsers = localStorage.getItem('learnimals_users');
    if (oldUsers) {
      try {
        const users = JSON.parse(oldUsers);
        users.forEach(user => {
          if (!this.profiles.has(user.id)) {
            const enhancedProfile = this.migrateProfile({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role || 'student',
              createdAt: user.createdAt
            });
            this.profiles.set(user.id, enhancedProfile);
          }
        });
        this.saveProfiles();
      } catch (error) {
        logger.error('Failed to migrate old users:', error);
      }
    }
  }
  
  /**
   * Save profiles to localStorage
   */
  saveProfiles() {
    try {
      const data = {};
      this.profiles.forEach((profile, id) => {
        data[id] = profile;
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      
      if (this.activeProfileId) {
        localStorage.setItem(this.ACTIVE_PROFILE_KEY, this.activeProfileId);
      }
    } catch (error) {
      logger.error('Failed to save profiles:', error);
    }
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for achievement unlocks to update XP
    window.addEventListener('achievementUnlocked', (event) => {
      this.handleAchievementUnlock(event.detail);
    });
    
    // Listen for game sessions to update stats
    window.addEventListener('gameSessionEnded', (event) => {
      this.handleGameSessionEnd(event.detail);
    });
  }
  
  /**
   * Create a new profile
   */
  createProfile(data) {
    const id = data.id || this.generateId();
    const profile = this.migrateProfile({
      ...data,
      id,
      createdAt: new Date().toISOString()
    });
    
    this.profiles.set(id, profile);
    this.saveProfiles();
    
    logger.info('Created new profile:', profile.name);
    return profile;
  }
  
  /**
   * Update profile data
   */
  updateProfile(profileId, updates) {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      logger.error('Profile not found:', profileId);
      return null;
    }
    
    // Merge updates
    Object.assign(profile, updates);
    profile.lastActive = new Date().toISOString();
    
    this.profiles.set(profileId, profile);
    this.saveProfiles();
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('profileUpdated', {
      detail: { profileId, updates }
    }));
    
    return profile;
  }
  
  /**
   * Get profile by ID
   */
  getProfile(profileId) {
    return this.profiles.get(profileId);
  }
  
  /**
   * Get all profiles
   */
  getAllProfiles() {
    return Array.from(this.profiles.values());
  }
  
  /**
   * Set active profile
   */
  setActiveProfile(profileId) {
    if (!this.profiles.has(profileId)) {
      logger.error('Profile not found:', profileId);
      return false;
    }
    
    this.activeProfileId = profileId;
    localStorage.setItem(this.ACTIVE_PROFILE_KEY, profileId);
    
    // Update last active
    this.updateProfile(profileId, {
      lastActive: new Date().toISOString()
    });
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('activeProfileChanged', {
      detail: { profileId }
    }));
    
    return true;
  }
  
  /**
   * Get active profile
   */
  getActiveProfile() {
    if (!this.activeProfileId) return null;
    return this.profiles.get(this.activeProfileId);
  }
  
  /**
   * Calculate level from XP
   */
  calculateLevel(xp) {
    // Level formula: level = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }
  
  /**
   * Calculate XP needed for next level
   */
  calculateXPForNextLevel(currentLevel) {
    // XP needed for level n = 100 * (n-1)^2
    return 100 * Math.pow(currentLevel, 2);
  }
  
  /**
   * Add XP to profile
   */
  addXP(profileId, amount) {
    const profile = this.profiles.get(profileId);
    if (!profile) return;
    
    const oldLevel = profile.level;
    profile.xp += amount;
    profile.level = this.calculateLevel(profile.xp);
    
    // Check for level up
    if (profile.level > oldLevel) {
      this.handleLevelUp(profile, oldLevel, profile.level);
    }
    
    this.updateProfile(profileId, {
      xp: profile.xp,
      level: profile.level
    });
    
    return {
      newXP: profile.xp,
      newLevel: profile.level,
      leveledUp: profile.level > oldLevel
    };
  }
  
  /**
   * Handle level up event
   */
  handleLevelUp(profile, oldLevel, newLevel) {
    logger.info(`${profile.name} leveled up from ${oldLevel} to ${newLevel}!`);
    
    // Unlock rewards based on level
    const rewards = this.getLevelRewards(newLevel);
    
    if (rewards.avatarItems) {
      profile.unlockedAvatarItems.push(...rewards.avatarItems);
    }
    
    if (rewards.themes) {
      profile.unlockedThemes.push(...rewards.themes);
    }
    
    if (rewards.titles) {
      profile.unlockedTitles.push(...rewards.titles);
    }
    
    // Dispatch level up event
    window.dispatchEvent(new CustomEvent('levelUp', {
      detail: {
        profile,
        oldLevel,
        newLevel,
        rewards
      }
    }));
  }
  
  /**
   * Get rewards for reaching a level
   */
  getLevelRewards(level) {
    const rewards = {
      avatarItems: [],
      themes: [],
      titles: []
    };
    
    // Every 5 levels unlock a new theme
    if (level % 5 === 0) {
      const themes = ['ocean', 'forest', 'space', 'candy', 'rainbow'];
      const themeIndex = Math.floor(level / 5) - 1;
      if (themeIndex < themes.length) {
        rewards.themes.push(themes[themeIndex]);
      }
    }
    
    // Every 10 levels unlock a new title
    if (level % 10 === 0) {
      const titles = ['Scholar', 'Expert', 'Master', 'Champion', 'Legend'];
      const titleIndex = Math.floor(level / 10) - 1;
      if (titleIndex < titles.length) {
        rewards.titles.push(titles[titleIndex]);
      }
    }
    
    // Specific level rewards
    switch (level) {
    case 5:
      rewards.avatarItems.push('glasses', 'hat');
      break;
    case 10:
      rewards.avatarItems.push('crown', 'cape');
      break;
    case 15:
      rewards.avatarItems.push('wings', 'sparkles');
      break;
    case 20:
      rewards.avatarItems.push('rainbow-aura', 'golden-badge');
      break;
    }
    
    return rewards;
  }
  
  /**
   * Handle achievement unlock
   */
  handleAchievementUnlock(detail) {
    const profile = this.getActiveProfile();
    if (!profile) return;
    
    const achievement = detail.achievement;
    const xpReward = achievement.reward?.points || 10;
    
    this.addXP(profile.id, xpReward);
  }
  
  /**
   * Handle game session end
   */
  handleGameSessionEnd(sessionData) {
    const profile = this.getActiveProfile();
    if (!profile) return;
    
    // Update play time
    const sessionDuration = sessionData.duration || 0;
    this.updateProfile(profile.id, {
      totalPlayTime: profile.totalPlayTime + sessionDuration
    });
    
    // Update streak
    this.updateStreak(profile.id);
    
    // Add XP based on performance
    const baseXP = 10;
    const accuracyBonus = Math.floor((sessionData.accuracy || 0) / 10);
    const scoreBonus = Math.floor((sessionData.score || 0) / 100);
    const totalXP = baseXP + accuracyBonus + scoreBonus;
    
    this.addXP(profile.id, totalXP);
  }
  
  /**
   * Update daily streak
   */
  updateStreak(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) return;
    
    const today = new Date().toDateString();
    const lastActive = new Date(profile.lastActive).toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    if (lastActive === yesterdayString) {
      // Played yesterday, increment streak
      profile.streakDays++;
    } else if (lastActive !== today) {
      // Didn't play yesterday, reset streak
      profile.streakDays = 1;
    }
    // If lastActive === today, streak already counted
    
    this.updateProfile(profileId, {
      streakDays: profile.streakDays,
      lastActive: new Date().toISOString()
    });
  }
  
  /**
   * Generate friend code
   */
  generateFriendCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
  
  /**
   * Add friend by code
   */
  addFriend(profileId, friendCode) {
    const profile = this.profiles.get(profileId);
    if (!profile) return { success: false, error: 'Profile not found' };
    
    // Find friend profile
    let friendProfile = null;
    for (const [id, p] of this.profiles) {
      if (p.friendCode === friendCode && id !== profileId) {
        friendProfile = p;
        break;
      }
    }
    
    if (!friendProfile) {
      return { success: false, error: 'Friend code not found' };
    }
    
    if (!friendProfile.privacy.allowFriendRequests) {
      return { success: false, error: 'User is not accepting friend requests' };
    }
    
    if (profile.friends.includes(friendProfile.id)) {
      return { success: false, error: 'Already friends' };
    }
    
    // Add friend
    profile.friends.push(friendProfile.id);
    this.updateProfile(profileId, { friends: profile.friends });
    
    return { success: true, friend: friendProfile };
  }
  
  /**
   * Get friends list with profiles
   */
  getFriends(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) return [];
    
    return profile.friends
      .map(friendId => this.profiles.get(friendId))
      .filter(friend => friend != null);
  }
  
  /**
   * Export profile data
   */
  exportProfile(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;
    
    // Get progress data
    const progressTracker = getProgressTracker();
    const progressData = progressTracker.getProgressSummary();
    
    return {
      profile,
      progress: progressData,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }
  
  /**
   * Import profile data
   */
  importProfile(data) {
    try {
      const { profile, progress } = data;
      
      // Generate new ID to avoid conflicts
      const newId = this.generateId();
      profile.id = newId;
      profile.friendCode = this.generateFriendCode(); // New friend code
      
      // Create profile
      this.profiles.set(newId, profile);
      this.saveProfiles();
      
      // Import progress if available
      if (progress) {
        // This would need integration with progress tracker
        logger.info('Progress import not yet implemented');
      }
      
      return { success: true, profileId: newId };
    } catch (error) {
      logger.error('Failed to import profile:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get profile statistics
   */
  getProfileStats(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;
    
    const progressTracker = getProgressTracker();
    const progress = progressTracker.getProgressSummary();
    
    return {
      basic: {
        name: profile.name,
        level: profile.level,
        xp: profile.xp,
        xpToNextLevel: this.calculateXPForNextLevel(profile.level) - profile.xp,
        title: profile.selectedTitle,
        memberSince: profile.createdAt,
        lastActive: profile.lastActive
      },
      gameplay: {
        totalPlayTime: profile.totalPlayTime,
        streakDays: profile.streakDays,
        gamesPlayed: progress.crossGame.gamesPlayed,
        totalScore: progress.crossGame.totalScore,
        overallAccuracy: progress.crossGame.overallAccuracy
      },
      achievements: {
        total: progress.achievements.total,
        unlocked: progress.achievements.unlocked,
        points: progress.achievements.points,
        completion: Math.round((progress.achievements.unlocked / progress.achievements.total) * 100)
      },
      social: {
        friendCount: profile.friends.length,
        friendCode: profile.friendCode
      },
      unlockables: {
        avatarItems: profile.unlockedAvatarItems.length,
        themes: profile.unlockedThemes.length,
        titles: profile.unlockedTitles.length
      }
    };
  }
  
  /**
   * Get default avatar configuration
   */
  getDefaultAvatar() {
    return {
      base: 'animal-1', // Default animal base
      color: '#4A90E2', // Default blue
      eyes: 'happy',
      mouth: 'smile',
      accessories: []
    };
  }
  
  /**
   * Generate unique ID
   */
  generateId() {
    return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Create singleton instance
const profileManager = new ProfileManager();

// Export for use in other modules
export default profileManager;

// Also attach to window for easy access
window.profileManager = profileManager;