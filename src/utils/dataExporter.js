// Data Export and Migration Utilities
// Provides tools for exporting localStorage data for backend migration

import { getRepository } from '../config/storage.js';
import User from '../models/User.js';
import UserProgress from '../models/UserProgress.js';

class DataExporter {
  constructor() {
    this.version = '1.0';
    this.repository = null;
  }
  
  // Initialize with storage repository
  async initialize() {
    this.repository = await getRepository();
    return this;
  }
  
  // Export all data in standardized format
  async exportAllData() {
    if (!this.repository) {
      throw new Error('DataExporter not initialized');
    }
    
    const exportData = {
      metadata: {
        version: this.version,
        exportedAt: new Date().toISOString(),
        exportedBy: 'Learnimals Data Exporter',
        dataVersion: '1.0',
        compatibleWith: ['backend-api-v1', 'localStorage-v1']
      },
      users: [],
      progress: [],
      achievements: [],
      families: [],
      statistics: {
        totalUsers: 0,
        totalFamilies: 0,
        dataSize: 0
      }
    };
    
    try {
      // Export users
      const users = await this.repository.getAllUsers();
      exportData.users = users.map(userData => {
        const user = new User(userData);
        return user.toJSON();
      });
      
      // Export progress for each user
      for (const user of users) {
        try {
          const progressData = await this.repository.getUserProgress(user.id);
          if (progressData) {
            const progress = UserProgress.fromStorageData(user.id, progressData);
            exportData.progress.push(progress.toJSON());
          }
        } catch (error) {
          console.warn(`Failed to export progress for user ${user.id}:`, error);
        }
      }
      
      // Export achievements for each user
      for (const user of users) {
        try {
          const achievements = await this.repository.getUserAchievements(user.id);
          if (achievements && achievements.length > 0) {
            exportData.achievements.push({
              userId: user.id,
              achievements: achievements
            });
          }
        } catch (error) {
          console.warn(`Failed to export achievements for user ${user.id}:`, error);
        }
      }
      
      // Group users by families
      const familyGroups = this.groupUsersByFamily(users);
      exportData.families = familyGroups;
      
      // Calculate statistics
      exportData.statistics.totalUsers = users.length;
      exportData.statistics.totalFamilies = familyGroups.length;
      exportData.statistics.dataSize = JSON.stringify(exportData).length;
      
      return exportData;
      
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }
  
  // Group users by family for family data export
  groupUsersByFamily(users) {
    const families = new Map();
    
    users.forEach(user => {
      if (user.familyId) {
        if (!families.has(user.familyId)) {
          families.set(user.familyId, {
            familyId: user.familyId,
            members: [],
            parentId: null,
            children: [],
            createdAt: null,
            updatedAt: new Date().toISOString()
          });
        }
        
        const family = families.get(user.familyId);
        family.members.push({
          userId: user.id,
          username: user.username,
          role: user.role,
          name: user.profile?.name || user.username
        });
        
        // Track parent and children
        if (user.role === 'parent') {
          family.parentId = user.id;
          if (!family.createdAt) {
            family.createdAt = user.createdAt;
          }
        } else if (user.role === 'child' || user.role === 'teen') {
          family.children.push(user.id);
        }
      }
    });
    
    return Array.from(families.values());
  }
  
  // Export specific user data
  async exportUserData(userId) {
    if (!this.repository) {
      throw new Error('DataExporter not initialized');
    }
    
    try {
      // Get user data
      const userData = await this.repository.getUserById(userId);
      if (!userData) {
        throw new Error('User not found');
      }
      
      const user = new User(userData);
      
      // Get progress data
      const progressData = await this.repository.getUserProgress(userId);
      const progress = progressData ? UserProgress.fromStorageData(userId, progressData) : null;
      
      // Get achievements
      const achievements = await this.repository.getUserAchievements(userId);
      
      return {
        metadata: {
          version: this.version,
          exportedAt: new Date().toISOString(),
          userId: userId,
          type: 'single-user-export'
        },
        user: user.toJSON(),
        progress: progress ? progress.toJSON() : null,
        achievements: achievements || []
      };
      
    } catch (error) {
      throw new Error(`User export failed: ${error.message}`);
    }
  }
  
  // Export family data
  async exportFamilyData(familyId) {
    if (!this.repository) {
      throw new Error('DataExporter not initialized');
    }
    
    try {
      const familyUsers = await this.repository.getFamilyUsers(familyId);
      
      if (familyUsers.length === 0) {
        throw new Error('Family not found or has no members');
      }
      
      const familyExport = {
        metadata: {
          version: this.version,
          exportedAt: new Date().toISOString(),
          familyId: familyId,
          type: 'family-export'
        },
        family: {
          familyId: familyId,
          members: [],
          totalMembers: familyUsers.length
        },
        users: [],
        progress: [],
        achievements: []
      };
      
      // Export each family member
      for (const userData of familyUsers) {
        const user = new User(userData);
        familyExport.users.push(user.toJSON());
        familyExport.family.members.push({
          userId: user.id,
          username: user.username,
          role: user.role,
          name: user.profile?.name || user.username
        });
        
        // Export their progress
        try {
          const progressData = await this.repository.getUserProgress(user.id);
          if (progressData) {
            const progress = UserProgress.fromStorageData(user.id, progressData);
            familyExport.progress.push(progress.toJSON());
          }
        } catch (error) {
          console.warn(`Failed to export progress for family member ${user.id}:`, error);
        }
        
        // Export their achievements
        try {
          const achievements = await this.repository.getUserAchievements(user.id);
          if (achievements && achievements.length > 0) {
            familyExport.achievements.push({
              userId: user.id,
              achievements: achievements
            });
          }
        } catch (error) {
          console.warn(`Failed to export achievements for family member ${user.id}:`, error);
        }
      }
      
      return familyExport;
      
    } catch (error) {
      throw new Error(`Family export failed: ${error.message}`);
    }
  }
  
  // Generate migration script
  generateMigrationScript(exportData, targetFormat = 'sql') {
    if (targetFormat === 'sql') {
      return this.generateSQLMigrationScript(exportData);
    } else if (targetFormat === 'json') {
      return this.generateJSONMigrationScript(exportData);
    } else {
      throw new Error(`Unsupported migration format: ${targetFormat}`);
    }
  }
  
  // Generate SQL migration script
  generateSQLMigrationScript(exportData) {
    let sql = '-- Learnimals Data Migration Script\n';
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Version: ${exportData.metadata.version}\n\n`;
    
    // Users table
    sql += '-- Users Migration\n';
    exportData.users.forEach(user => {
      sql += 'INSERT INTO users (id, username, profile, role, family_id, created_at, updated_at) VALUES (\n';
      sql += `  '${user.id}',\n`;
      sql += `  '${user.username}',\n`;
      sql += `  '${JSON.stringify(user.profile).replace(/'/g, '\'\'')}',\n`;
      sql += `  '${user.role}',\n`;
      sql += `  ${user.familyId ? `'${user.familyId}'` : 'NULL'},\n`;
      sql += `  '${user.createdAt}',\n`;
      sql += `  '${user.updatedAt}'\n`;
      sql += ');\n\n';
    });
    
    // Progress table
    sql += '-- User Progress Migration\n';
    exportData.progress.forEach(progress => {
      sql += 'INSERT INTO user_progress (user_id, overall_level, total_xp, subjects, games, created_at, updated_at) VALUES (\n';
      sql += `  '${progress.userId}',\n`;
      sql += `  ${progress.overallLevel},\n`;
      sql += `  ${progress.totalXP},\n`;
      sql += `  '${JSON.stringify(progress.subjects).replace(/'/g, '\'\'')}',\n`;
      sql += `  '${JSON.stringify(progress.games).replace(/'/g, '\'\'')}',\n`;
      sql += `  '${progress.createdAt}',\n`;
      sql += `  '${progress.updatedAt}'\n`;
      sql += ');\n\n';
    });
    
    return sql;
  }
  
  // Generate JSON migration script
  generateJSONMigrationScript(exportData) {
    return {
      type: 'migration',
      version: exportData.metadata.version,
      generatedAt: new Date().toISOString(),
      instructions: [
        'Import this data into your backend API',
        'Validate all user data before insertion',
        'Ensure family relationships are properly linked',
        'Verify progress data integrity'
      ],
      data: exportData
    };
  }
  
  // Download export as file
  downloadExport(exportData, filename = null) {
    if (!filename) {
      filename = `learnimals-export-${new Date().toISOString().split('T')[0]}.json`;
    }
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const downloadUrl = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(downloadUrl);
    
    return filename;
  }
  
  // Validate export data integrity
  validateExportData(exportData) {
    const errors = [];
    
    if (!exportData.metadata) {
      errors.push('Missing metadata');
    }
    
    if (!Array.isArray(exportData.users)) {
      errors.push('Users data must be an array');
    }
    
    if (!Array.isArray(exportData.progress)) {
      errors.push('Progress data must be an array');
    }
    
    // Validate each user
    exportData.users.forEach((user, index) => {
      try {
        const userModel = new User(user);
        const validation = userModel.validate();
        if (!validation.isValid) {
          errors.push(`User ${index}: ${validation.errors.join(', ')}`);
        }
      } catch (error) {
        errors.push(`User ${index}: ${error.message}`);
      }
    });
    
    // Validate progress data
    exportData.progress.forEach((progress, index) => {
      try {
        const progressModel = UserProgress.fromStorageData(progress.userId, progress);
        const validation = progressModel.validate();
        if (!validation.isValid) {
          errors.push(`Progress ${index}: ${validation.errors.join(', ')}`);
        }
      } catch (error) {
        errors.push(`Progress ${index}: ${error.message}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  // Static convenience methods
  static async exportAll() {
    const exporter = new DataExporter();
    await exporter.initialize();
    return exporter.exportAllData();
  }
  
  static async exportUser(userId) {
    const exporter = new DataExporter();
    await exporter.initialize();
    return exporter.exportUserData(userId);
  }
  
  static async exportFamily(familyId) {
    const exporter = new DataExporter();
    await exporter.initialize();
    return exporter.exportFamilyData(familyId);
  }
}

export default DataExporter;