// User Progress Data Model
// Standardized progress tracking structure compatible with frontend and backend systems

class UserProgress {
  constructor(userId, data = {}) {
    // User identification
    this.userId = userId;
    
    // Overall progress metrics
    this.overallLevel = data.overallLevel || 1;
    this.totalXP = data.totalXP || 0;
    this.totalTimeSpent = data.totalTimeSpent || 0; // in minutes
    this.streakDays = data.streakDays || 0;
    this.lastActiveDate = data.lastActiveDate || null;
    
    // Subject-specific progress
    this.subjects = {
      math: this.initializeSubjectProgress(data.subjects?.math),
      science: this.initializeSubjectProgress(data.subjects?.science),
      reading: this.initializeSubjectProgress(data.subjects?.reading),
      art: this.initializeSubjectProgress(data.subjects?.art),
      coding: this.initializeSubjectProgress(data.subjects?.coding),
      music: this.initializeSubjectProgress(data.subjects?.music),
      geography: this.initializeSubjectProgress(data.subjects?.geography),
      history: this.initializeSubjectProgress(data.subjects?.history),
      language: this.initializeSubjectProgress(data.subjects?.language),
      ...data.subjects
    };
    
    // Games and activities progress
    this.games = {
      bubblePop: this.initializeGameProgress(data.games?.bubblePop),
      wordScramble: this.initializeGameProgress(data.games?.wordScramble),
      ...data.games
    };
    
    // Learning statistics
    this.statistics = {
      totalActivities: data.statistics?.totalActivities || 0,
      completedActivities: data.statistics?.completedActivities || 0,
      averageScore: data.statistics?.averageScore || 0,
      bestScore: data.statistics?.bestScore || 0,
      gamesPlayed: data.statistics?.gamesPlayed || 0,
      questionsAnswered: data.statistics?.questionsAnswered || 0,
      correctAnswers: data.statistics?.correctAnswers || 0,
      ...data.statistics
    };
    
    // Achievements and milestones
    this.achievements = data.achievements || [];
    this.milestones = data.milestones || [];
    this.badges = data.badges || [];
    
    // Learning preferences and adaptations
    this.preferences = {
      difficulty: data.preferences?.difficulty || 'medium',
      learningStyle: data.preferences?.learningStyle || 'visual',
      timePerSession: data.preferences?.timePerSession || 15, // minutes
      favoriteSubjects: data.preferences?.favoriteSubjects || [],
      ...data.preferences
    };
    
    // Progress tracking metadata
    this.metadata = {
      version: data.metadata?.version || '1.0',
      lastCalculated: data.metadata?.lastCalculated || new Date().toISOString(),
      migrationApplied: data.metadata?.migrationApplied || [],
      ...data.metadata
    };
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
  
  // Initialize subject progress structure
  initializeSubjectProgress(subjectData = {}) {
    return {
      level: subjectData?.level || 1,
      xp: subjectData?.xp || 0,
      timeSpent: subjectData?.timeSpent || 0,
      activitiesCompleted: subjectData?.activitiesCompleted || 0,
      averageScore: subjectData?.averageScore || 0,
      bestScore: subjectData?.bestScore || 0,
      currentStreak: subjectData?.currentStreak || 0,
      longestStreak: subjectData?.longestStreak || 0,
      lastPlayed: subjectData?.lastPlayed || null,
      unlockedActivities: subjectData?.unlockedActivities || [],
      completedActivities: subjectData?.completedActivities || [],
      ...subjectData
    };
  }
  
  // Initialize game progress structure
  initializeGameProgress(gameData = {}) {
    return {
      timesPlayed: gameData?.timesPlayed || 0,
      bestScore: gameData?.bestScore || 0,
      totalScore: gameData?.totalScore || 0,
      averageScore: gameData?.averageScore || 0,
      timeSpent: gameData?.timeSpent || 0,
      lastPlayed: gameData?.lastPlayed || null,
      difficulty: gameData?.difficulty || 1,
      achievements: gameData?.achievements || [],
      ...gameData
    };
  }
  
  // Progress calculation methods
  calculateOverallLevel() {
    const xpThresholds = [
      0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250,
      3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450
    ];
    
    let level = 1;
    for (let i = 0; i < xpThresholds.length; i++) {
      if (this.totalXP >= xpThresholds[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    
    this.overallLevel = level;
    return level;
  }
  
  // Subject progress methods
  addSubjectXP(subject, xp, timeSpent = 0) {
    if (!this.subjects[subject]) {
      this.subjects[subject] = this.initializeSubjectProgress();
    }
    
    this.subjects[subject].xp += xp;
    this.subjects[subject].timeSpent += timeSpent;
    this.subjects[subject].lastPlayed = new Date().toISOString();
    
    // Update overall progress
    this.totalXP += xp;
    this.totalTimeSpent += timeSpent;
    
    // Recalculate levels
    this.calculateOverallLevel();
    this.calculateSubjectLevel(subject);
    
    this.updateTimestamp();
    return this;
  }
  
  calculateSubjectLevel(subject) {
    if (!this.subjects[subject]) return 1;
    
    const subjectXP = this.subjects[subject].xp;
    const level = Math.floor(subjectXP / 100) + 1; // 100 XP per level
    
    this.subjects[subject].level = Math.min(level, 20); // Cap at level 20
    return this.subjects[subject].level;
  }
  
  // Activity completion methods
  completeActivity(subject, activityId, score, timeSpent = 0) {
    if (!this.subjects[subject]) {
      this.subjects[subject] = this.initializeSubjectProgress();
    }
    
    const subjectProgress = this.subjects[subject];
    
    // Mark activity as completed
    if (!subjectProgress.completedActivities.includes(activityId)) {
      subjectProgress.completedActivities.push(activityId);
      subjectProgress.activitiesCompleted++;
      this.statistics.completedActivities++;
    }
    
    // Update scores
    subjectProgress.bestScore = Math.max(subjectProgress.bestScore, score);
    this.statistics.bestScore = Math.max(this.statistics.bestScore, score);
    
    // Calculate average scores
    const totalActivities = subjectProgress.activitiesCompleted;
    if (totalActivities > 0) {
      subjectProgress.averageScore = (
        (subjectProgress.averageScore * (totalActivities - 1) + score) / totalActivities
      );
    }
    
    this.statistics.totalActivities++;
    this.statistics.averageScore = (
      (this.statistics.averageScore * (this.statistics.totalActivities - 1) + score) / 
      this.statistics.totalActivities
    );
    
    // Add XP based on score
    const xpGained = Math.floor(score * 0.1) + 10; // Base 10 XP + score bonus
    this.addSubjectXP(subject, xpGained, timeSpent);
    
    this.updateTimestamp();
    return this;
  }
  
  // Game progress methods
  recordGameSession(gameId, score, timeSpent = 0) {
    if (!this.games[gameId]) {
      this.games[gameId] = this.initializeGameProgress();
    }
    
    const gameProgress = this.games[gameId];
    
    gameProgress.timesPlayed++;
    gameProgress.totalScore += score;
    gameProgress.bestScore = Math.max(gameProgress.bestScore, score);
    gameProgress.timeSpent += timeSpent;
    gameProgress.lastPlayed = new Date().toISOString();
    
    // Calculate average score
    gameProgress.averageScore = gameProgress.totalScore / gameProgress.timesPlayed;
    
    // Update overall statistics
    this.statistics.gamesPlayed++;
    this.totalTimeSpent += timeSpent;
    
    // Award XP for game performance
    const xpGained = Math.floor(score * 0.05) + 5; // Base 5 XP + performance bonus
    this.totalXP += xpGained;
    this.calculateOverallLevel();
    
    this.updateTimestamp();
    return this;
  }
  
  // Achievement and milestone methods
  addAchievement(achievementData) {
    const achievement = {
      id: achievementData.id || this.generateId(),
      name: achievementData.name,
      description: achievementData.description,
      type: achievementData.type || 'general',
      earnedAt: new Date().toISOString(),
      xpReward: achievementData.xpReward || 0,
      ...achievementData
    };
    
    // Check if already earned
    const existing = this.achievements.find(a => a.id === achievement.id);
    if (existing) return false;
    
    this.achievements.push(achievement);
    
    // Award XP if applicable
    if (achievement.xpReward > 0) {
      this.totalXP += achievement.xpReward;
      this.calculateOverallLevel();
    }
    
    this.updateTimestamp();
    return achievement;
  }
  
  addMilestone(milestoneData) {
    const milestone = {
      id: milestoneData.id || this.generateId(),
      type: milestoneData.type,
      value: milestoneData.value,
      reachedAt: new Date().toISOString(),
      ...milestoneData
    };
    
    this.milestones.push(milestone);
    this.updateTimestamp();
    return milestone;
  }
  
  // Streak management
  updateStreak() {
    const today = new Date().toDateString();
    const lastActive = this.lastActiveDate ? new Date(this.lastActiveDate).toDateString() : null;
    
    if (lastActive === today) {
      // Already updated today
      return this.streakDays;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastActive === yesterdayStr) {
      // Continue streak
      this.streakDays++;
    } else if (lastActive !== today) {
      // Streak broken or first time
      this.streakDays = 1;
    }
    
    this.lastActiveDate = new Date().toISOString();
    this.updateTimestamp();
    
    return this.streakDays;
  }
  
  // Analytics and insights methods
  getWeeklyProgress() {
    // This would be enhanced with actual activity data in a real implementation
    return {
      daysActive: this.streakDays > 7 ? 7 : this.streakDays,
      totalTimeThisWeek: Math.min(this.totalTimeSpent, 420), // Cap at 7 hours
      activitiesCompletedThisWeek: Math.min(this.statistics.completedActivities, 50),
      xpGainedThisWeek: Math.min(this.totalXP, 1000)
    };
  }
  
  getSubjectStrengths() {
    return Object.entries(this.subjects)
      .map(([subject, progress]) => ({
        subject,
        level: progress.level,
        averageScore: progress.averageScore,
        activitiesCompleted: progress.activitiesCompleted
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
  }
  
  // Data validation
  validate() {
    const errors = [];
    
    if (!this.userId) {
      errors.push('User ID is required');
    }
    
    if (this.overallLevel < 1 || this.overallLevel > 100) {
      errors.push('Overall level must be between 1 and 100');
    }
    
    if (this.totalXP < 0) {
      errors.push('Total XP cannot be negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Utility methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  updateTimestamp() {
    this.updatedAt = new Date().toISOString();
    this.metadata.lastCalculated = this.updatedAt;
  }
  
  // Data transformation
  toJSON() {
    return {
      userId: this.userId,
      overallLevel: this.overallLevel,
      totalXP: this.totalXP,
      totalTimeSpent: this.totalTimeSpent,
      streakDays: this.streakDays,
      lastActiveDate: this.lastActiveDate,
      subjects: this.subjects,
      games: this.games,
      statistics: this.statistics,
      achievements: this.achievements,
      milestones: this.milestones,
      badges: this.badges,
      preferences: this.preferences,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  // Static factory methods
  static fromStorageData(userId, data) {
    return new UserProgress(userId, data);
  }
  
  static createNew(userId) {
    return new UserProgress(userId, {
      overallLevel: 1,
      totalXP: 0,
      subjects: {},
      achievements: []
    });
  }
}

export default UserProgress;