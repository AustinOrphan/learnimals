// User Progress Tracking Module for Learnimals
// Handles saving and loading user progress data, achievements, and statistics

class UserProgress {
  constructor() {
    this.userData = {
      profile: {
        name: '',
        avatar: 'default',
        age: null,
        grade: null,
        createdAt: null,
        lastLogin: null,
      },
      progress: {
        math: {
          lessonsCompleted: 0,
          questionsAnswered: 0,
          correctAnswers: 0,
          level: 1,
          lastActivity: null,
          topics: {},
        },
        reading: {
          storiesRead: 0,
          wordsLearned: 0,
          comprehensionScore: 0,
          level: 1,
          lastActivity: null,
          books: {},
        },
        science: {
          experimentsCompleted: 0,
          factsLearned: 0,
          quizScore: 0,
          level: 1,
          lastActivity: null,
          topics: {},
        },
        art: {
          projectsCompleted: 0,
          techniquesLearned: 0,
          level: 1,
          lastActivity: null,
          gallery: [],
        },
      },
      achievements: [],
      gameStats: {
        bubblePop: {
          highScore: 0,
          gamesPlayed: 0,
          totalScore: 0,
        },
        wordScramble: {
          highScore: 0,
          gamesPlayed: 0,
          wordsCompleted: 0,
        },
      },
      settings: {
        theme: 'default',
        soundEffects: true,
        backgroundMusic: true,
        notifications: true,
        accessibility: {
          highContrast: false,
          largeText: false,
          reduceMotion: false,
        },
      },
    };

    this.achievementsList = [
      {
        id: 'math_novice',
        name: 'Math Novice',
        description: 'Complete 5 math lessons',
        icon: 'medal-bronze',
        unlocked: false,
        progress: 0,
        target: 5,
      },
      {
        id: 'math_expert',
        name: 'Math Expert',
        description: 'Answer 50 math questions correctly',
        icon: 'medal-silver',
        unlocked: false,
        progress: 0,
        target: 50,
      },
      {
        id: 'math_master',
        name: 'Math Master',
        description: 'Reach level 5 in math',
        icon: 'medal-gold',
        unlocked: false,
        progress: 0,
        target: 5,
      },
      {
        id: 'reading_explorer',
        name: 'Reading Explorer',
        description: 'Read 10 stories',
        icon: 'book-bronze',
        unlocked: false,
        progress: 0,
        target: 10,
      },
      {
        id: 'word_wizard',
        name: 'Word Wizard',
        description: 'Learn 100 new words',
        icon: 'wand-silver',
        unlocked: false,
        progress: 0,
        target: 100,
      },
      {
        id: 'science_discoverer',
        name: 'Science Discoverer',
        description: 'Complete 5 science experiments',
        icon: 'flask-bronze',
        unlocked: false,
        progress: 0,
        target: 5,
      },
      {
        id: 'art_creator',
        name: 'Art Creator',
        description: 'Complete 5 art projects',
        icon: 'palette-bronze',
        unlocked: false,
        progress: 0,
        target: 5,
      },
      {
        id: 'learnimals_friend',
        name: 'Learnimals Friend',
        description: 'Visit the site for 5 consecutive days',
        icon: 'star-bronze',
        unlocked: false,
        progress: 0,
        target: 5,
      },
      {
        id: 'bubble_popper',
        name: 'Bubble Popper',
        description: 'Score 20 points in Bubble Pop',
        icon: 'bubble-silver',
        unlocked: false,
        progress: 0,
        target: 20,
      },
      {
        id: 'word_master',
        name: 'Word Master',
        description: 'Complete 15 words in Word Scramble',
        icon: 'words-gold',
        unlocked: false,
        progress: 0,
        target: 15,
      },
    ];

    this.init();
  }

  init() {
    // Load user data from localStorage or use defaults
    this.loadUserData();

    // Add achievements to user data if not already present
    if (!this.userData.achievements.length) {
      this.userData.achievements = this.achievementsList;
    }

    // Update last login time
    this.userData.profile.lastLogin = new Date().toISOString();

    // Save initial data
    this.saveUserData();

    // Set up daily streak tracking
    this.checkDailyStreak();
  }

  loadUserData() {
    try {
      const savedData = localStorage.getItem('learnimals-user-data');
      if (savedData) {
        this.userData = JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // If there's an error, we'll use the default data
    }
  }

  saveUserData() {
    try {
      localStorage.setItem('learnimals-user-data', JSON.stringify(this.userData));

      // Dispatch an event that other components can listen for
      const event = new CustomEvent('userDataUpdated', { detail: { userData: this.userData } });
      document.dispatchEvent(event);

      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  }

  createProfile(name, age, grade, avatar = 'default') {
    this.userData.profile.name = name;
    this.userData.profile.age = age;
    this.userData.profile.grade = grade;
    this.userData.profile.avatar = avatar;
    this.userData.profile.createdAt = new Date().toISOString();
    this.userData.profile.lastLogin = new Date().toISOString();

    return this.saveUserData();
  }

  updateProfile(profileData) {
    Object.assign(this.userData.profile, profileData);
    return this.saveUserData();
  }

  getProfile() {
    return { ...this.userData.profile };
  }

  updateSettings(settingsData) {
    Object.assign(this.userData.settings, settingsData);
    return this.saveUserData();
  }

  getSettings() {
    return { ...this.userData.settings };
  }

  // Track math progress
  updateMathProgress(data) {
    if (data.topicId) {
      // Initialize topic if it doesn't exist
      if (!this.userData.progress.math.topics[data.topicId]) {
        this.userData.progress.math.topics[data.topicId] = {
          completed: false,
          progress: 0,
          score: 0,
          attempts: 0,
        };
      }

      // Update topic data
      Object.assign(this.userData.progress.math.topics[data.topicId], data.topicData);
    }

    // Update overall math progress
    if (data.questionsAnswered) {
      this.userData.progress.math.questionsAnswered += data.questionsAnswered;
    }

    if (data.correctAnswers) {
      this.userData.progress.math.correctAnswers += data.correctAnswers;

      // Check for math expert achievement
      this.updateAchievementProgress('math_expert', this.userData.progress.math.correctAnswers);
    }

    if (data.lessonCompleted) {
      this.userData.progress.math.lessonsCompleted++;

      // Check for math novice achievement
      this.updateAchievementProgress('math_novice', this.userData.progress.math.lessonsCompleted);
    }

    // Calculate level based on lessons completed (1 level per 3 lessons)
    this.userData.progress.math.level =
      Math.floor(this.userData.progress.math.lessonsCompleted / 3) + 1;

    // Check for math master achievement
    this.updateAchievementProgress('math_master', this.userData.progress.math.level);

    this.userData.progress.math.lastActivity = new Date().toISOString();

    return this.saveUserData();
  }

  // Track reading progress
  updateReadingProgress(data) {
    if (data.bookId) {
      // Initialize book if it doesn't exist
      if (!this.userData.progress.reading.books[data.bookId]) {
        this.userData.progress.reading.books[data.bookId] = {
          completed: false,
          lastPageRead: 0,
          comprehensionScore: 0,
          dateStarted: new Date().toISOString(),
        };
      }

      // Update book data
      Object.assign(this.userData.progress.reading.books[data.bookId], data.bookData);

      // Increment stories read if just completed
      if (
        data.bookData &&
        data.bookData.completed &&
        !this.userData.progress.reading.books[data.bookId].dateCompleted
      ) {
        this.userData.progress.reading.storiesRead++;
        this.userData.progress.reading.books[data.bookId].dateCompleted = new Date().toISOString();

        // Check for reading explorer achievement
        this.updateAchievementProgress(
          'reading_explorer',
          this.userData.progress.reading.storiesRead
        );
      }
    }

    if (data.wordsLearned) {
      this.userData.progress.reading.wordsLearned += data.wordsLearned;

      // Check for word wizard achievement
      this.updateAchievementProgress('word_wizard', this.userData.progress.reading.wordsLearned);
    }

    if (data.comprehensionScore) {
      // Update average comprehension score
      const totalBooks = Object.keys(this.userData.progress.reading.books).length;
      const oldTotal = this.userData.progress.reading.comprehensionScore * (totalBooks - 1);
      this.userData.progress.reading.comprehensionScore =
        (oldTotal + data.comprehensionScore) / totalBooks;
    }

    // Calculate level based on stories read (1 level per 2 stories)
    this.userData.progress.reading.level =
      Math.floor(this.userData.progress.reading.storiesRead / 2) + 1;

    this.userData.progress.reading.lastActivity = new Date().toISOString();

    return this.saveUserData();
  }

  // Track science progress
  updateScienceProgress(data) {
    if (data.topicId) {
      // Initialize topic if it doesn't exist
      if (!this.userData.progress.science.topics[data.topicId]) {
        this.userData.progress.science.topics[data.topicId] = {
          completed: false,
          progress: 0,
          experimentsDone: 0,
        };
      }

      // Update topic data
      Object.assign(this.userData.progress.science.topics[data.topicId], data.topicData);
    }

    if (data.experimentCompleted) {
      this.userData.progress.science.experimentsCompleted++;

      // Check for science discoverer achievement
      this.updateAchievementProgress(
        'science_discoverer',
        this.userData.progress.science.experimentsCompleted
      );
    }

    if (data.factsLearned) {
      this.userData.progress.science.factsLearned += data.factsLearned;
    }

    if (data.quizScore) {
      // Update average quiz score
      const topics = Object.keys(this.userData.progress.science.topics).length;
      const oldTotal = this.userData.progress.science.quizScore * (topics - 1);
      this.userData.progress.science.quizScore = (oldTotal + data.quizScore) / topics;
    }

    // Calculate level based on experiments completed (1 level per 2 experiments)
    this.userData.progress.science.level =
      Math.floor(this.userData.progress.science.experimentsCompleted / 2) + 1;

    this.userData.progress.science.lastActivity = new Date().toISOString();

    return this.saveUserData();
  }

  // Track art progress
  updateArtProgress(data) {
    if (data.projectCompleted) {
      this.userData.progress.art.projectsCompleted++;

      // Check for art creator achievement
      this.updateAchievementProgress('art_creator', this.userData.progress.art.projectsCompleted);
    }

    if (data.techniqueLearned) {
      this.userData.progress.art.techniquesLearned++;
    }

    if (data.artworkData) {
      // Add new artwork to gallery
      this.userData.progress.art.gallery.push({
        id: `art_${Date.now()}`,
        title: data.artworkData.title || 'Untitled Artwork',
        imageUrl: data.artworkData.imageUrl,
        date: new Date().toISOString(),
        technique: data.artworkData.technique || 'mixed',
        likes: 0,
      });
    }

    // Calculate level based on projects completed (1 level per 2 projects)
    this.userData.progress.art.level =
      Math.floor(this.userData.progress.art.projectsCompleted / 2) + 1;

    this.userData.progress.art.lastActivity = new Date().toISOString();

    return this.saveUserData();
  }

  // Track game statistics
  updateGameStats(game, stats) {
    if (!this.userData.gameStats[game]) {
      this.userData.gameStats[game] = {
        highScore: 0,
        gamesPlayed: 0,
        totalScore: 0,
      };
    }

    this.userData.gameStats[game].gamesPlayed++;
    this.userData.gameStats[game].totalScore += stats.score || 0;

    if (stats.score > this.userData.gameStats[game].highScore) {
      this.userData.gameStats[game].highScore = stats.score;
    }

    // Game-specific stats
    if (game === 'bubblePop') {
      // Update bubble popper achievement
      this.updateAchievementProgress('bubble_popper', this.userData.gameStats.bubblePop.highScore);
    } else if (game === 'wordScramble') {
      this.userData.gameStats.wordScramble.wordsCompleted += stats.wordsCompleted || 0;

      // Update word master achievement
      this.updateAchievementProgress(
        'word_master',
        this.userData.gameStats.wordScramble.wordsCompleted
      );
    }

    return this.saveUserData();
  }

  // Get achievement progress
  getAchievements() {
    return [...this.userData.achievements];
  }

  // Update achievement progress
  updateAchievementProgress(achievementId, currentValue) {
    const achievement = this.userData.achievements.find(a => a.id === achievementId);

    if (achievement) {
      achievement.progress = Math.min(currentValue, achievement.target);

      // Check if achievement should be unlocked
      if (currentValue >= achievement.target && !achievement.unlocked) {
        achievement.unlocked = true;
        achievement.dateUnlocked = new Date().toISOString();

        // Dispatch achievement unlocked event
        const event = new CustomEvent('achievementUnlocked', {
          detail: { achievement: achievement },
        });
        document.dispatchEvent(event);
      }

      this.saveUserData();
    }
  }

  // Check for daily login streak
  checkDailyStreak() {
    const today = new Date();
    const lastLogin = new Date(this.userData.profile.lastLogin);

    // Initialize streak data if it doesn't exist
    if (!this.userData.profile.streak) {
      this.userData.profile.streak = {
        current: 1,
        max: 1,
        lastDate: today.toISOString().split('T')[0],
      };
    }

    const lastLoginDate = lastLogin.toISOString().split('T')[0];
    const todayDate = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    // If last login was yesterday, increment streak
    if (lastLoginDate === yesterdayDate) {
      this.userData.profile.streak.current++;
      this.userData.profile.streak.lastDate = todayDate;

      // Update max streak if current is greater
      if (this.userData.profile.streak.current > this.userData.profile.streak.max) {
        this.userData.profile.streak.max = this.userData.profile.streak.current;
      }

      // Update Learnimals Friend achievement (5-day streak)
      this.updateAchievementProgress('learnimals_friend', this.userData.profile.streak.current);
    }
    // If last login was before yesterday, reset streak
    else if (lastLoginDate !== todayDate) {
      this.userData.profile.streak.current = 1;
      this.userData.profile.streak.lastDate = todayDate;
    }

    this.saveUserData();
  }

  // Get user progress summary
  getProgressSummary() {
    return {
      profile: {
        name: this.userData.profile.name,
        avatar: this.userData.profile.avatar,
        streak: this.userData.profile.streak || { current: 0, max: 0 },
      },
      levels: {
        math: this.userData.progress.math.level,
        reading: this.userData.progress.reading.level,
        science: this.userData.progress.science.level,
        art: this.userData.progress.art.level,
      },
      stats: {
        mathProblems: this.userData.progress.math.questionsAnswered,
        mathAccuracy:
          this.userData.progress.math.questionsAnswered > 0
            ? Math.round(
                (this.userData.progress.math.correctAnswers /
                  this.userData.progress.math.questionsAnswered) *
                  100
              )
            : 0,
        storiesRead: this.userData.progress.reading.storiesRead,
        wordsLearned: this.userData.progress.reading.wordsLearned,
        experimentsCompleted: this.userData.progress.science.experimentsCompleted,
        projectsCompleted: this.userData.progress.art.projectsCompleted,
      },
      recentActivity: this.getRecentActivity(),
      achievements: {
        total: this.userData.achievements.length,
        unlocked: this.userData.achievements.filter(a => a.unlocked).length,
        recent: this.getRecentAchievements(3),
      },
    };
  }

  // Get recent activity across all subjects
  getRecentActivity(limit = 5) {
    const activities = [];

    // Check recent math activity
    if (this.userData.progress.math.lastActivity) {
      activities.push({
        type: 'math',
        date: this.userData.progress.math.lastActivity,
        description: `Worked on math (Level ${this.userData.progress.math.level})`,
      });
    }

    // Check recent reading activity
    if (this.userData.progress.reading.lastActivity) {
      activities.push({
        type: 'reading',
        date: this.userData.progress.reading.lastActivity,
        description: `Practiced reading (Level ${this.userData.progress.reading.level})`,
      });
    }

    // Check recent science activity
    if (this.userData.progress.science.lastActivity) {
      activities.push({
        type: 'science',
        date: this.userData.progress.science.lastActivity,
        description: `Explored science (Level ${this.userData.progress.science.level})`,
      });
    }

    // Check recent art activity
    if (this.userData.progress.art.lastActivity) {
      activities.push({
        type: 'art',
        date: this.userData.progress.art.lastActivity,
        description: `Created art (Level ${this.userData.progress.art.level})`,
      });
    }

    // Sort by date (newest first) and limit
    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
  }

  // Get recently unlocked achievements
  getRecentAchievements(limit = 3) {
    return this.userData.achievements
      .filter(a => a.unlocked && a.dateUnlocked)
      .sort((a, b) => new Date(b.dateUnlocked) - new Date(a.dateUnlocked))
      .slice(0, limit);
  }

  // Reset all user data (for testing or user request)
  resetUserData() {
    // Save name and accessibility settings
    const name = this.userData.profile.name;
    const accessibility = { ...this.userData.settings.accessibility };

    // Reset to defaults
    this.userData = {
      profile: {
        name: name,
        avatar: 'default',
        age: null,
        grade: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
      progress: {
        math: {
          lessonsCompleted: 0,
          questionsAnswered: 0,
          correctAnswers: 0,
          level: 1,
          lastActivity: null,
          topics: {},
        },
        reading: {
          storiesRead: 0,
          wordsLearned: 0,
          comprehensionScore: 0,
          level: 1,
          lastActivity: null,
          books: {},
        },
        science: {
          experimentsCompleted: 0,
          factsLearned: 0,
          quizScore: 0,
          level: 1,
          lastActivity: null,
          topics: {},
        },
        art: {
          projectsCompleted: 0,
          techniquesLearned: 0,
          level: 1,
          lastActivity: null,
          gallery: [],
        },
      },
      achievements: this.achievementsList,
      gameStats: {
        bubblePop: {
          highScore: 0,
          gamesPlayed: 0,
          totalScore: 0,
        },
        wordScramble: {
          highScore: 0,
          gamesPlayed: 0,
          wordsCompleted: 0,
        },
      },
      settings: {
        theme: 'default',
        soundEffects: true,
        backgroundMusic: true,
        notifications: true,
        accessibility: accessibility,
      },
    };

    return this.saveUserData();
  }
}

// Create and export singleton instance
const userProgress = new UserProgress();

// Pages gate their dynamic data / save paths on window.userProgress; without
// this assignment those blocks silently no-op (profile save did nothing).
if (typeof window !== 'undefined') {
  window.userProgress = userProgress;
}

export default userProgress;
