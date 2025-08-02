/**
 * DiscoveryTracker - Manages discoveries, achievements, and progress tracking
 * Handles collection system, badge awards, and scientific journal entries
 */
export default class DiscoveryTracker {
  /**
   * Create a new DiscoveryTracker instance
   * @param {AdventureQuestGame} game - Reference to main game instance
   */
  constructor(game) {
    this.game = game;
    this.discoveries = [];
    this.achievements = [];
    this.scientificJournal = [];
    this.currentDiscoveryDisplay = null;
    this.displayTimer = 0;

    // Discovery categories
    this.discoveryTypes = {
      story: { name: 'Story Progress', icon: '📖', basePoints: 50 },
      challenge: { name: 'Challenge Solved', icon: '🧪', basePoints: 25 },
      challenge_complete: { name: 'Challenge Master', icon: '🏆', basePoints: 100 },
      exploration: { name: 'Explorer', icon: '🗺️', basePoints: 15 },
      experiment: { name: 'Scientist', icon: '🔬', basePoints: 30 },
      observation: { name: 'Observer', icon: '👁️', basePoints: 20 },
      first_time: { name: 'First Discovery', icon: '⭐', basePoints: 75 },
      streak: { name: 'Learning Streak', icon: '🔥', basePoints: 40 },
      speed: { name: 'Quick Learner', icon: '⚡', basePoints: 35 },
      mastery: { name: 'Subject Master', icon: '🎓', basePoints: 150 },
    };

    // Achievement definitions
    this.achievementDefinitions = this.initializeAchievements();

    // Animation state
    this.animationTime = 0;
    this.particles = [];
    this.celebrationActive = false;

    // Load saved progress
    this.loadProgress();
  }

  /**
   * Initialize achievement definitions
   * @returns {Array} Achievement definitions
   */
  initializeAchievements() {
    return [
      {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first challenge',
        icon: '👶',
        condition: { type: 'challenge_count', value: 1 },
        points: 100,
      },
      {
        id: 'curious_explorer',
        name: 'Curious Explorer',
        description: 'Visit all island types',
        icon: '🧭',
        condition: { type: 'islands_visited', value: 4 },
        points: 200,
      },
      {
        id: 'physics_apprentice',
        name: 'Physics Apprentice',
        description: 'Complete 5 physics challenges',
        icon: '⚛️',
        condition: { type: 'subject_challenges', subject: 'physics', value: 5 },
        points: 150,
      },
      {
        id: 'chemistry_apprentice',
        name: 'Chemistry Apprentice',
        description: 'Complete 5 chemistry challenges',
        icon: '🧪',
        condition: { type: 'subject_challenges', subject: 'chemistry', value: 5 },
        points: 150,
      },
      {
        id: 'biology_apprentice',
        name: 'Biology Apprentice',
        description: 'Complete 5 biology challenges',
        icon: '🦋',
        condition: { type: 'subject_challenges', subject: 'biology', value: 5 },
        points: 150,
      },
      {
        id: 'perfect_score',
        name: 'Perfect Score',
        description: 'Get 100% on a challenge',
        icon: '💯',
        condition: { type: 'perfect_challenge', value: 1 },
        points: 300,
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a challenge in under 30 seconds',
        icon: '🏃‍♂️',
        condition: { type: 'fast_completion', value: 30000 },
        points: 250,
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Get 10 correct answers in a row',
        icon: '🔥',
        condition: { type: 'answer_streak', value: 10 },
        points: 400,
      },
      {
        id: 'journal_keeper',
        name: 'Journal Keeper',
        description: 'Record 20 scientific observations',
        icon: '📔',
        condition: { type: 'journal_entries', value: 20 },
        points: 200,
      },
      {
        id: 'science_master',
        name: 'Science Master',
        description: 'Earn 5000 total points',
        icon: '🎓',
        condition: { type: 'total_points', value: 5000 },
        points: 1000,
      },
    ];
  }

  /**
   * Add a new discovery
   * @param {Object} discoveryData - Discovery information
   * @param {string} discoveryData.type - Type of discovery
   * @param {string} discoveryData.name - Name/description of discovery
   * @param {number} discoveryData.points - Points awarded
   * @param {Object} discoveryData.metadata - Additional data
   */
  addDiscovery(discoveryData) {
    const discovery = {
      id: this.generateDiscoveryId(),
      type: discoveryData.type,
      name: discoveryData.name,
      points: discoveryData.points || this.discoveryTypes[discoveryData.type]?.basePoints || 0,
      timestamp: Date.now(),
      metadata: discoveryData.metadata || {},
    };

    this.discoveries.push(discovery);
    this.game.gameState.totalDiscoveries = this.discoveries.length;

    // Add to scientific journal if applicable
    this.addToJournal(discovery);

    // Check for achievements
    this.checkAchievements();

    // Display discovery notification
    this.displayDiscovery(discovery);

    // Create celebration effects
    this.createCelebrationEffects(discovery);

    // Save progress
    this.saveProgress();

    console.log(`Discovery added: ${discovery.name} (+${discovery.points} points)`);
  }

  /**
   * Generate unique discovery ID
   * @returns {string} Unique ID
   */
  generateDiscoveryId() {
    return `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add discovery to scientific journal
   * @param {Object} discovery - Discovery to add to journal
   */
  addToJournal(discovery) {
    if (['experiment', 'observation', 'challenge_complete'].includes(discovery.type)) {
      const journalEntry = {
        id: this.generateDiscoveryId(),
        title: discovery.name,
        type: discovery.type,
        date: new Date(discovery.timestamp).toLocaleDateString(),
        content: this.generateJournalContent(discovery),
        illustration: this.getJournalIllustration(discovery.type),
      };

      this.scientificJournal.push(journalEntry);
    }
  }

  /**
   * Generate journal content based on discovery
   * @param {Object} discovery - Discovery object
   * @returns {string} Journal entry content
   */
  generateJournalContent(discovery) {
    const templates = {
      experiment: `Today I conducted an experiment about ${discovery.name}. ${discovery.metadata.explanation || 'I learned something new about how science works!'}`,
      observation: `I observed ${discovery.name} and noticed ${discovery.metadata.observation || 'interesting patterns in nature'}.`,
      challenge_complete: `I mastered ${discovery.name} with ${Math.round((discovery.metadata.accuracy || 1) * 100)}% accuracy. ${discovery.metadata.key_learning || 'This challenge taught me important scientific concepts.'}`,
    };

    return templates[discovery.type] || `I discovered: ${discovery.name}`;
  }

  /**
   * Get illustration emoji for journal entry
   * @param {string} type - Discovery type
   * @returns {string} Emoji illustration
   */
  getJournalIllustration(type) {
    const illustrations = {
      experiment: '🔬',
      observation: '👀',
      challenge_complete: '🏆',
      story: '📚',
      exploration: '🗺️',
    };

    return illustrations[type] || '⭐';
  }

  /**
   * Check and award achievements
   */
  checkAchievements() {
    for (const achievementDef of this.achievementDefinitions) {
      // Skip if already achieved
      if (this.achievements.some(a => a.id === achievementDef.id)) {
        continue;
      }

      if (this.checkAchievementCondition(achievementDef.condition)) {
        this.awardAchievement(achievementDef);
      }
    }
  }

  /**
   * Check if achievement condition is met
   * @param {Object} condition - Achievement condition
   * @returns {boolean} True if condition is met
   */
  checkAchievementCondition(condition) {
    switch (condition.type) {
      case 'challenge_count':
        return (
          this.discoveries.filter(d => d.type === 'challenge_complete').length >= condition.value
        );

      case 'islands_visited':
        const visitedTypes = new Set(
          this.discoveries.filter(d => d.type === 'exploration').map(d => d.metadata.islandType)
        );
        return visitedTypes.size >= condition.value;

      case 'subject_challenges':
        return (
          this.discoveries.filter(
            d => d.type === 'challenge_complete' && d.metadata.challengeType === condition.subject
          ).length >= condition.value
        );

      case 'perfect_challenge':
        return this.discoveries.some(
          d => d.type === 'challenge_complete' && d.metadata.accuracy === 1.0
        );

      case 'fast_completion':
        return this.discoveries.some(
          d => d.type === 'challenge_complete' && d.metadata.completionTime < condition.value
        );

      case 'answer_streak':
        return this.discoveries.some(
          d => d.type === 'streak' && d.metadata.streakLength >= condition.value
        );

      case 'journal_entries':
        return this.scientificJournal.length >= condition.value;

      case 'total_points':
        const totalPoints = this.discoveries.reduce((sum, d) => sum + d.points, 0);
        return totalPoints >= condition.value;

      default:
        return false;
    }
  }

  /**
   * Award an achievement
   * @param {Object} achievementDef - Achievement definition
   */
  awardAchievement(achievementDef) {
    const achievement = {
      ...achievementDef,
      awardedAt: Date.now(),
    };

    this.achievements.push(achievement);

    // Add achievement as a special discovery
    this.addDiscovery({
      type: 'achievement',
      name: `Achievement: ${achievement.name}`,
      points: achievement.points,
      metadata: { achievementId: achievement.id },
    });

    console.log(`Achievement unlocked: ${achievement.name}!`);
  }

  /**
   * Display discovery notification
   * @param {Object} discovery - Discovery to display
   */
  displayDiscovery(discovery) {
    this.currentDiscoveryDisplay = {
      discovery: discovery,
      startTime: Date.now(),
      phase: 'appearing', // appearing -> showing -> disappearing
    };
    this.displayTimer = 0;
  }

  /**
   * Create celebration particle effects
   * @param {Object} discovery - Discovery that triggered celebration
   */
  createCelebrationEffects(discovery) {
    const isSpecial = ['achievement', 'challenge_complete', 'mastery'].includes(discovery.type);
    const particleCount = isSpecial ? 30 : 15;
    const colors = isSpecial
      ? [this.game.themeColors.success, this.game.themeColors.secondary, '#FFD700']
      : [this.game.themeColors.primary, this.game.themeColors.secondary];

    const centerX = this.game.canvas.width / 2;
    const centerY = this.game.canvas.height / 3;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 3 + Math.random() * 4;

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        life: 1.0,
        decay: 0.015,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    if (isSpecial) {
      this.celebrationActive = true;
      setTimeout(() => {
        this.celebrationActive = false;
      }, 3000);
    }
  }

  /**
   * Get discovery statistics
   * @returns {Object} Discovery statistics
   */
  getStatistics() {
    const stats = {
      totalDiscoveries: this.discoveries.length,
      totalPoints: this.discoveries.reduce((sum, d) => sum + d.points, 0),
      totalAchievements: this.achievements.length,
      journalEntries: this.scientificJournal.length,
      byType: {},
    };

    // Count discoveries by type
    Object.keys(this.discoveryTypes).forEach(type => {
      stats.byType[type] = this.discoveries.filter(d => d.type === type).length;
    });

    return stats;
  }

  /**
   * Get recent discoveries
   * @param {number} count - Number of recent discoveries to get
   * @returns {Array} Recent discoveries
   */
  getRecentDiscoveries(count = 5) {
    return this.discoveries.sort((a, b) => b.timestamp - a.timestamp).slice(0, count);
  }

  /**
   * Handle click events for discovery interface
   * @param {number} x - Click X coordinate
   * @param {number} y - Click Y coordinate
   * @returns {boolean} True if click was handled
   */
  handleClick(x, y) {
    // Dismiss discovery notification if clicked
    if (this.currentDiscoveryDisplay) {
      this.currentDiscoveryDisplay = null;
      return true;
    }

    return false;
  }

  /**
   * Update discovery tracker state
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    this.animationTime += deltaTime;

    // Update discovery display
    if (this.currentDiscoveryDisplay) {
      this.displayTimer += deltaTime;

      // Auto-dismiss after 5 seconds
      if (this.displayTimer > 5000) {
        this.currentDiscoveryDisplay = null;
      }
    }

    // Update particles
    this.updateParticles(deltaTime);
  }

  /**
   * Update particle animations
   * @param {number} deltaTime - Time since last update
   */
  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // Gravity
      particle.vx *= 0.99; // Air resistance
      particle.rotation += particle.rotationSpeed;
      particle.life -= particle.decay;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render discovery notifications and effects
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    // Render particles
    this.renderParticles(ctx);

    // Render discovery notification
    if (this.currentDiscoveryDisplay) {
      this.renderDiscoveryNotification(ctx);
    }

    // Render celebration effects
    if (this.celebrationActive) {
      this.renderCelebrationEffects(ctx);
    }
  }

  /**
   * Render particle effects
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  renderParticles(ctx) {
    this.particles.forEach(particle => {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);

      const alpha = Math.floor(particle.life * 255)
        .toString(16)
        .padStart(2, '0');
      ctx.fillStyle = particle.color + alpha;

      // Render as star shape for special particles
      if (particle.size > 5) {
        this.drawStar(ctx, 0, 0, particle.size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  /**
   * Draw a star shape
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} size - Star size
   */
  drawStar(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5;
      const radius = i % 2 === 0 ? size : size / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Render discovery notification popup
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  renderDiscoveryNotification(ctx) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const discovery = this.currentDiscoveryDisplay.discovery;

    // Calculate animation progress
    const elapsed = this.displayTimer;
    let alpha = 1;
    let scale = 1;

    if (elapsed < 500) {
      // Appearing
      scale = 0.5 + (elapsed / 500) * 0.5;
      alpha = elapsed / 500;
    } else if (elapsed > 4500) {
      // Disappearing
      alpha = 1 - (elapsed - 4500) / 500;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    // Notification background
    const notifWidth = 400;
    const notifHeight = 120;
    const notifX = (canvasWidth - notifWidth) / 2;
    const notifY = 50;

    ctx.fillStyle = this.game.themeColors.surface;
    ctx.strokeStyle = this.game.themeColors.primary;
    ctx.lineWidth = 3;

    ctx.fillRect(notifX, notifY, notifWidth, notifHeight);
    ctx.strokeRect(notifX, notifY, notifWidth, notifHeight);

    // Discovery type icon
    const typeInfo = this.discoveryTypes[discovery.type];
    if (typeInfo) {
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(typeInfo.icon, notifX + 40, notifY + 50);
    }

    // Discovery text
    ctx.fillStyle = this.game.themeColors.text;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Discovery!', notifX + 80, notifY + 25);

    ctx.font = '16px Arial';
    ctx.fillText(discovery.name, notifX + 80, notifY + 50);

    // Points
    ctx.fillStyle = this.game.themeColors.secondary;
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`+${discovery.points} points`, notifX + 80, notifY + 75);

    // Progress bar (points accumulation animation)
    const progressY = notifY + 90;
    const progressWidth = notifWidth - 20;
    const progressHeight = 8;

    ctx.fillStyle = this.game.themeColors.surface;
    ctx.fillRect(notifX + 10, progressY, progressWidth, progressHeight);

    const progressPercent = Math.min(1, elapsed / 1000);
    ctx.fillStyle = this.game.themeColors.secondary;
    ctx.fillRect(notifX + 10, progressY, progressWidth * progressPercent, progressHeight);

    ctx.restore();
  }

  /**
   * Render celebration effects for special discoveries
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  renderCelebrationEffects(ctx) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Confetti effect
    ctx.save();
    ctx.globalAlpha = 0.8;

    for (let i = 0; i < 50; i++) {
      const x = (canvasWidth / 50) * i + Math.sin(this.animationTime * 0.01 + i) * 20;
      const y = ((this.animationTime * 0.5 + i * 50) % (canvasHeight + 100)) - 50;

      ctx.fillStyle = `hsl(${(i * 73) % 360}, 70%, 60%)`;
      ctx.fillRect(x, y, 4, 10);
    }

    ctx.restore();
  }

  /**
   * Get progress data for saving
   * @returns {Object} Progress data
   */
  getProgress() {
    return {
      discoveries: this.discoveries,
      achievements: this.achievements,
      scientificJournal: this.scientificJournal,
    };
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    const progress = this.getProgress();
    localStorage.setItem('adventureQuest_discoveryProgress', JSON.stringify(progress));
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    const saved = localStorage.getItem('adventureQuest_discoveryProgress');
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        this.discoveries = progress.discoveries || [];
        this.achievements = progress.achievements || [];
        this.scientificJournal = progress.scientificJournal || [];

        // Update game state
        this.game.gameState.totalDiscoveries = this.discoveries.length;
      } catch (error) {
        console.warn('Failed to load discovery progress:', error);
      }
    }
  }

  /**
   * Reset all progress (for testing or new game)
   */
  resetProgress() {
    this.discoveries = [];
    this.achievements = [];
    this.scientificJournal = [];
    this.game.gameState.totalDiscoveries = 0;
    this.saveProgress();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.particles = [];
    this.currentDiscoveryDisplay = null;
    this.celebrationActive = false;
  }
}
