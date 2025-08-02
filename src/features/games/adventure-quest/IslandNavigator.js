/**
 * IslandNavigator - Manages world exploration and island navigation
 * Handles the world map, island discovery, and travel between locations
 */
export default class IslandNavigator {
  /**
   * Create a new IslandNavigator instance
   * @param {AdventureQuestGame} game - Reference to main game instance
   */
  constructor(game) {
    this.game = game;
    this.currentIsland = null;
    this.unlockedIslands = new Set(['starting_dock']);
    this.visitedIslands = new Set();
    this.islandConnections = new Map();
    this.playerPosition = { x: 0, y: 0 };
    this.targetPosition = { x: 0, y: 0 };
    this.isMoving = false;
    this.moveSpeed = 100; // pixels per second

    // UI state
    this.clickableBounds = [];
    this.hoveredIsland = null;
    this.showingTooltip = false;
    this.animationTime = 0;

    // Camera and viewport
    this.cameraX = 0;
    this.cameraY = 0;
    this.zoomLevel = 1.0;

    // Initialize island data
    this.islandData = this.initializeIslandData();

    // Initialize player at starting dock
    this.currentIsland = 'starting_dock';
    this.playerPosition = { ...this.islandData.starting_dock.position };
    this.targetPosition = { ...this.playerPosition };

    // Load progress
    this.loadProgress();
  }

  /**
   * Initialize island data with positions and connections
   * @returns {Object} Island data structure
   */
  initializeIslandData() {
    return {
      starting_dock: {
        name: 'Sky\'s Observatory',
        type: 'hub',
        position: { x: 400, y: 300 },
        description:
          'Your starting point with Sky the Parrot. Plan your scientific expeditions here!',
        icon: '🏠',
        color: '#4a90e2',
        unlocked: true,
        challenges: [],
        connections: ['physics_island', 'chemistry_cove', 'biology_beach'],
      },

      physics_island: {
        name: 'Physics Island',
        type: 'physics',
        position: { x: 200, y: 150 },
        description:
          'Explore forces, motion, energy, and the fundamental laws that govern our universe.',
        icon: '⚛️',
        color: '#e74c3c',
        unlocked: false,
        unlockCondition: { type: 'story_progress', value: 'introduction' },
        challenges: ['gravity_basics', 'force_and_motion', 'energy_conservation', 'waves_sound'],
        connections: ['starting_dock', 'engineering_bay'],
        features: {
          experiments: ['falling_objects', 'pendulum_motion', 'lever_mechanics'],
          discoveries: ['gravity_well', 'magnetic_field', 'sound_cave'],
        },
      },

      chemistry_cove: {
        name: 'Chemistry Cove',
        type: 'chemistry',
        position: { x: 600, y: 150 },
        description: 'Mix, react, and discover the amazing world of atoms and molecules.',
        icon: '🧪',
        color: '#9b59b6',
        unlocked: false,
        unlockCondition: { type: 'story_progress', value: 'introduction' },
        challenges: ['color_reactions', 'states_of_matter', 'acid_base', 'crystal_formation'],
        connections: ['starting_dock', 'underwater_lab'],
        features: {
          experiments: ['safe_reactions', 'ph_testing', 'crystallization'],
          discoveries: ['mineral_cave', 'hot_springs', 'salt_flats'],
        },
      },

      biology_beach: {
        name: 'Biology Beach',
        type: 'biology',
        position: { x: 400, y: 450 },
        description: 'Study living things and discover how life adapts and thrives.',
        icon: '🌿',
        color: '#27ae60',
        unlocked: false,
        unlockCondition: { type: 'story_progress', value: 'introduction' },
        challenges: ['ecosystem_observation', 'adaptation_study', 'life_cycles', 'biodiversity'],
        connections: ['starting_dock', 'coral_reef', 'rainforest_canopy'],
        features: {
          experiments: ['habitat_study', 'species_classification', 'food_web_mapping'],
          discoveries: ['tide_pools', 'nesting_grounds', 'medicinal_plants'],
        },
      },

      engineering_bay: {
        name: 'Engineering Bay',
        type: 'engineering',
        position: { x: 100, y: 250 },
        description: 'Build and design solutions using scientific principles.',
        icon: '🔧',
        color: '#f39c12',
        unlocked: false,
        unlockCondition: { type: 'challenges_completed', subject: 'physics', value: 3 },
        challenges: ['simple_machines', 'bridge_building', 'energy_efficiency'],
        connections: ['physics_island'],
        features: {
          experiments: ['lever_design', 'pulley_systems', 'bridge_testing'],
          discoveries: ['ancient_machines', 'gear_puzzles'],
        },
      },

      underwater_lab: {
        name: 'Underwater Laboratory',
        type: 'chemistry',
        position: { x: 700, y: 250 },
        description: 'Advanced chemistry in an underwater research facility.',
        icon: '🐠',
        color: '#3498db',
        unlocked: false,
        unlockCondition: { type: 'challenges_completed', subject: 'chemistry', value: 3 },
        challenges: ['underwater_reactions', 'pressure_effects', 'marine_chemistry'],
        connections: ['chemistry_cove'],
        features: {
          experiments: ['pressure_chambers', 'deep_sea_analysis'],
          discoveries: ['thermal_vents', 'bioluminescence'],
        },
      },

      coral_reef: {
        name: 'Coral Reef Ecosystem',
        type: 'biology',
        position: { x: 550, y: 500 },
        description: 'Explore the intricate relationships in a coral reef ecosystem.',
        icon: '🐠',
        color: '#1abc9c',
        unlocked: false,
        unlockCondition: { type: 'challenges_completed', subject: 'biology', value: 2 },
        challenges: ['symbiosis_study', 'reef_conservation', 'marine_biodiversity'],
        connections: ['biology_beach'],
        features: {
          experiments: ['coral_health_monitoring', 'fish_behavior_study'],
          discoveries: ['hidden_lagoon', 'ancient_coral'],
        },
      },

      rainforest_canopy: {
        name: 'Rainforest Canopy',
        type: 'biology',
        position: { x: 250, y: 550 },
        description: 'Study life high in the treetops of a lush rainforest.',
        icon: '🌳',
        color: '#2ecc71',
        unlocked: false,
        unlockCondition: { type: 'challenges_completed', subject: 'biology', value: 2 },
        challenges: ['canopy_ecosystems', 'plant_adaptations', 'animal_behavior'],
        connections: ['biology_beach'],
        features: {
          experiments: ['canopy_photography', 'plant_collection', 'animal_tracking'],
          discoveries: ['rare_orchids', 'bird_observatory', 'medicine_garden'],
        },
      },
    };
  }

  /**
   * Load navigation scene
   * @param {Object} data - Navigation data
   */
  loadNavigation(data = {}) {
    // Check for newly unlocked islands based on progress
    this.updateUnlockedIslands();

    // Handle completion rewards
    if (data.completedChallenge) {
      this.handleChallengeCompletion(data.completedChallenge, data.challengeType);
    }

    if (data.completedChapter) {
      this.handleStoryCompletion(data.completedChapter);
    }

    // Center camera on current position
    this.centerCameraOnPlayer();
  }

  /**
   * Update which islands should be unlocked based on progress
   */
  updateUnlockedIslands() {
    for (const [islandId, island] of Object.entries(this.islandData)) {
      if (island.unlocked || this.unlockedIslands.has(islandId)) {
        continue;
      }

      if (this.checkUnlockCondition(island.unlockCondition)) {
        this.unlockIsland(islandId);
      }
    }
  }

  /**
   * Check if unlock condition is met
   * @param {Object} condition - Unlock condition
   * @returns {boolean} True if condition is met
   */
  checkUnlockCondition(condition) {
    if (!condition) return true;

    switch (condition.type) {
    case 'story_progress':
      const completedChapters = this.game.storyProgression.getCompletedChapters();
      return completedChapters.includes(condition.value);

    case 'challenges_completed':
      const challengeProgress = this.game.challengeManager.getProgress();
      const subjectChallenges = this.game.discoveryTracker.discoveries.filter(
        d => d.type === 'challenge_complete' && d.metadata.challengeType === condition.subject
      );
      return subjectChallenges.length >= condition.value;

    case 'discoveries':
      return this.game.gameState.totalDiscoveries >= condition.value;

    case 'score':
      return this.game.gameState.score >= condition.value;

    default:
      return false;
    }
  }

  /**
   * Unlock an island and create discovery
   * @param {string} islandId - Island to unlock
   */
  unlockIsland(islandId) {
    this.unlockedIslands.add(islandId);
    const island = this.islandData[islandId];

    // Add discovery for unlocking new island
    this.game.discoveryTracker.addDiscovery({
      type: 'exploration',
      name: `Discovered ${island.name}`,
      points: 75,
      metadata: { islandId, islandType: island.type },
    });

    console.log(`Island unlocked: ${island.name}`);
    this.saveProgress();
  }

  /**
   * Handle challenge completion rewards
   * @param {Object} challenge - Completed challenge
   * @param {string} challengeType - Type of challenge
   */
  handleChallengeCompletion(challenge, challengeType) {
    // Mark visit to current island type
    this.visitedIslands.add(this.currentIsland);

    // Check for new island unlocks
    this.updateUnlockedIslands();
  }

  /**
   * Handle story completion rewards
   * @param {Object} chapter - Completed story chapter
   */
  handleStoryCompletion(chapter) {
    // Story completion may unlock new areas
    this.updateUnlockedIslands();
  }

  /**
   * Travel to a specific island
   * @param {string} islandId - Target island ID
   */
  travelToIsland(islandId) {
    if (!this.unlockedIslands.has(islandId)) {
      console.warn(`Cannot travel to locked island: ${islandId}`);
      return;
    }

    const targetIsland = this.islandData[islandId];
    if (!targetIsland) {
      console.warn(`Unknown island: ${islandId}`);
      return;
    }

    // Check if islands are connected (for unlocked travel)
    if (!this.canTravelTo(islandId)) {
      console.warn(`No route to island: ${islandId}`);
      return;
    }

    // Start travel animation
    this.targetPosition = { ...targetIsland.position };
    this.isMoving = true;
    this.currentIsland = islandId;

    // Mark as visited
    this.visitedIslands.add(islandId);

    // Add exploration discovery if first visit
    if (!this.visitedIslands.has(islandId)) {
      this.game.discoveryTracker.addDiscovery({
        type: 'exploration',
        name: `First visit to ${targetIsland.name}`,
        points: 50,
        metadata: { islandId, islandType: targetIsland.type },
      });
    }
  }

  /**
   * Check if can travel to target island
   * @param {string} targetIslandId - Target island ID
   * @returns {boolean} True if travel is possible
   */
  canTravelTo(targetIslandId) {
    const currentIsland = this.islandData[this.currentIsland];
    return (
      currentIsland.connections.includes(targetIslandId) || targetIslandId === this.currentIsland
    );
  }

  /**
   * Get available destinations from current island
   * @returns {Array} Available destination island IDs
   */
  getAvailableDestinations() {
    const currentIsland = this.islandData[this.currentIsland];
    return currentIsland.connections.filter(islandId => this.unlockedIslands.has(islandId));
  }

  /**
   * Enter an island (start island-specific content)
   * @param {string} islandId - Island to enter
   */
  enterIsland(islandId) {
    const island = this.islandData[islandId];

    if (island.type === 'hub') {
      // Hub islands show story or general navigation
      this.game.loadScene('story', { chapter: 'hub_visit' });
    } else {
      // Science islands show introduction story then challenges
      this.game.loadScene('story', { chapter: `${island.type}_island_intro` });
    }
  }

  /**
   * Center camera on player position
   */
  centerCameraOnPlayer() {
    this.cameraX = this.playerPosition.x - this.game.canvas.width / 2;
    this.cameraY = this.playerPosition.y - this.game.canvas.height / 2;
  }

  /**
   * Handle click events
   * @param {number} x - Click X coordinate
   * @param {number} y - Click Y coordinate
   * @returns {boolean} True if click was handled
   */
  handleClick(x, y) {
    // Convert screen coordinates to world coordinates
    const worldX = x + this.cameraX;
    const worldY = y + this.cameraY;

    // Check clickable islands
    for (const bounds of this.clickableBounds) {
      if (
        x >= bounds.screenX &&
        x <= bounds.screenX + bounds.width &&
        y >= bounds.screenY &&
        y <= bounds.screenY + bounds.height
      ) {
        if (bounds.type === 'island') {
          if (bounds.islandId === this.currentIsland) {
            // Enter current island
            this.enterIsland(bounds.islandId);
          } else if (this.unlockedIslands.has(bounds.islandId)) {
            // Travel to different island
            this.travelToIsland(bounds.islandId);
          }
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Handle mouse move for tooltips
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   */
  handleMouseMove(x, y) {
    this.hoveredIsland = null;

    // Check if hovering over any island
    for (const bounds of this.clickableBounds) {
      if (
        x >= bounds.screenX &&
        x <= bounds.screenX + bounds.width &&
        y >= bounds.screenY &&
        y <= bounds.screenY + bounds.height
      ) {
        if (bounds.type === 'island') {
          this.hoveredIsland = bounds.islandId;
          break;
        }
      }
    }
  }

  /**
   * Update navigation state
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    this.animationTime += deltaTime;

    // Update player movement
    if (this.isMoving) {
      this.updatePlayerMovement(deltaTime);
    }

    // Update camera to follow player
    this.updateCamera(deltaTime);
  }

  /**
   * Update player movement animation
   * @param {number} deltaTime - Time since last update
   */
  updatePlayerMovement(deltaTime) {
    const dx = this.targetPosition.x - this.playerPosition.x;
    const dy = this.targetPosition.y - this.playerPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      // Arrived at destination
      this.playerPosition = { ...this.targetPosition };
      this.isMoving = false;
    } else {
      // Move towards target
      const moveDistance = (this.moveSpeed * deltaTime) / 1000;
      const ratio = moveDistance / distance;

      this.playerPosition.x += dx * ratio;
      this.playerPosition.y += dy * ratio;
    }
  }

  /**
   * Update camera to follow player
   * @param {number} deltaTime - Time since last update
   */
  updateCamera(deltaTime) {
    const targetCameraX = this.playerPosition.x - this.game.canvas.width / 2;
    const targetCameraY = this.playerPosition.y - this.game.canvas.height / 2;

    // Smooth camera following
    const cameraSpeed = 2;
    const ratio = (cameraSpeed * deltaTime) / 1000;

    this.cameraX += (targetCameraX - this.cameraX) * ratio;
    this.cameraY += (targetCameraY - this.cameraY) * ratio;
  }

  /**
   * Render the navigation scene
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Clear clickable bounds
    this.clickableBounds = [];

    // Draw ocean background
    this.renderOceanBackground(ctx, canvasWidth, canvasHeight);

    // Draw island connections
    this.renderIslandConnections(ctx);

    // Draw islands
    this.renderIslands(ctx);

    // Draw player
    this.renderPlayer(ctx);

    // Draw UI overlay
    this.renderUIOverlay(ctx, canvasWidth, canvasHeight);

    // Draw tooltip if hovering
    if (this.hoveredIsland) {
      this.renderTooltip(ctx, canvasWidth, canvasHeight);
    }
  }

  /**
   * Render animated ocean background
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderOceanBackground(ctx, canvasWidth, canvasHeight) {
    // Ocean gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#4682B4');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Animated waves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const waveY = canvasHeight * 0.2 + i * 100;
      const waveOffset = this.animationTime * 0.001 + i * 0.5;

      for (let x = 0; x <= canvasWidth; x += 10) {
        const y = waveY + Math.sin(x * 0.01 + waveOffset) * 20;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }

  /**
   * Render connections between islands
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  renderIslandConnections(ctx) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);

    // Draw connections from unlocked islands
    for (const [islandId, island] of Object.entries(this.islandData)) {
      if (!this.unlockedIslands.has(islandId)) continue;

      const fromX = island.position.x - this.cameraX;
      const fromY = island.position.y - this.cameraY;

      for (const connectionId of island.connections) {
        if (!this.unlockedIslands.has(connectionId)) continue;

        const toIsland = this.islandData[connectionId];
        const toX = toIsland.position.x - this.cameraX;
        const toY = toIsland.position.y - this.cameraY;

        // Only draw each connection once
        if (islandId < connectionId) {
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();
        }
      }
    }

    ctx.setLineDash([]);
  }

  /**
   * Render all islands
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  renderIslands(ctx) {
    for (const [islandId, island] of Object.entries(this.islandData)) {
      const screenX = island.position.x - this.cameraX;
      const screenY = island.position.y - this.cameraY;

      // Skip if off-screen
      if (
        screenX < -100 ||
        screenX > ctx.canvas.width + 100 ||
        screenY < -100 ||
        screenY > ctx.canvas.height + 100
      ) {
        continue;
      }

      this.renderIsland(ctx, islandId, island, screenX, screenY);
    }
  }

  /**
   * Render a single island
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} islandId - Island ID
   * @param {Object} island - Island data
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   */
  renderIsland(ctx, islandId, island, screenX, screenY) {
    const isUnlocked = this.unlockedIslands.has(islandId);
    const isVisited = this.visitedIslands.has(islandId);
    const isCurrent = islandId === this.currentIsland;
    const isHovered = islandId === this.hoveredIsland;

    const baseRadius = 40;
    const radius = baseRadius + (isHovered ? 5 : 0) + (isCurrent ? 10 : 0);

    // Island shadow
    if (isUnlocked) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(screenX + 3, screenY + 3, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Island base
    if (isUnlocked) {
      ctx.fillStyle = island.color;
    } else {
      ctx.fillStyle = '#999999';
    }

    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Island border
    if (isCurrent) {
      ctx.strokeStyle = this.game.themeColors.primary;
      ctx.lineWidth = 4;
    } else if (isHovered && isUnlocked) {
      ctx.strokeStyle = this.game.themeColors.secondary;
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
    }

    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Island icon
    if (isUnlocked) {
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      ctx.fillText(island.icon, screenX, screenY + 8);
    } else {
      // Lock icon for locked islands
      ctx.font = '20px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText('🔒', screenX, screenY + 6);
    }

    // Island name
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = isUnlocked ? this.game.themeColors.text : '#666666';
    ctx.fillText(island.name, screenX, screenY + radius + 20);

    // Progress indicator
    if (isUnlocked && island.challenges) {
      const completedChallenges = this.getCompletedChallenges(islandId);
      const totalChallenges = island.challenges.length;

      if (totalChallenges > 0) {
        const progressWidth = 60;
        const progressHeight = 6;
        const progressX = screenX - progressWidth / 2;
        const progressY = screenY + radius + 35;

        // Progress background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

        // Progress fill
        const progressPercent = completedChallenges / totalChallenges;
        ctx.fillStyle = this.game.themeColors.success;
        ctx.fillRect(progressX, progressY, progressWidth * progressPercent, progressHeight);

        // Progress text
        ctx.font = '10px Arial';
        ctx.fillStyle = this.game.themeColors.text;
        ctx.fillText(`${completedChallenges}/${totalChallenges}`, screenX, progressY + 18);
      }
    }

    // Store clickable bounds
    this.clickableBounds.push({
      screenX: screenX - radius,
      screenY: screenY - radius,
      width: radius * 2,
      height: radius * 2,
      type: 'island',
      islandId: islandId,
    });
  }

  /**
   * Get number of completed challenges for an island
   * @param {string} islandId - Island ID
   * @returns {number} Number of completed challenges
   */
  getCompletedChallenges(islandId) {
    const island = this.islandData[islandId];
    if (!island.challenges) return 0;

    return island.challenges.filter(challengeName => {
      return this.game.discoveryTracker.discoveries.some(
        d => d.type === 'challenge_complete' && d.name.includes(challengeName)
      );
    }).length;
  }

  /**
   * Render player (Sky the Parrot)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  renderPlayer(ctx) {
    const screenX = this.playerPosition.x - this.cameraX;
    const screenY = this.playerPosition.y - this.cameraY;

    // Skip if off-screen
    if (
      screenX < -50 ||
      screenX > ctx.canvas.width + 50 ||
      screenY < -50 ||
      screenY > ctx.canvas.height + 50
    ) {
      return;
    }

    // Floating animation
    const floatOffset = Math.sin(this.animationTime * 0.005) * 3;
    const playerY = screenY + floatOffset;

    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 15, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sky the Parrot (simplified)
    // Body
    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.ellipse(screenX, playerY, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#2171b5';
    ctx.beginPath();
    ctx.ellipse(screenX - 4, playerY, 6, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.arc(screenX, playerY - 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ffa500';
    ctx.beginPath();
    ctx.ellipse(screenX + 5, playerY - 8, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render UI overlay
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderUIOverlay(ctx, canvasWidth, canvasHeight) {
    // Current location indicator
    const currentIsland = this.islandData[this.currentIsland];
    if (currentIsland) {
      ctx.fillStyle = this.game.themeColors.surface;
      ctx.strokeStyle = this.game.themeColors.primary;
      ctx.lineWidth = 2;

      const boxWidth = 250;
      const boxHeight = 60;
      const boxX = 20;
      const boxY = 20;

      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      ctx.fillStyle = this.game.themeColors.text;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Current Location:', boxX + 10, boxY + 20);

      ctx.font = '14px Arial';
      ctx.fillText(currentIsland.name, boxX + 10, boxY + 40);
    }

    // Instructions
    ctx.fillStyle = this.game.themeColors.textSecondary;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Click islands to travel • Double-click to enter',
      canvasWidth / 2,
      canvasHeight - 20
    );

    // Mini-map (optional)
    this.renderMiniMap(ctx, canvasWidth, canvasHeight);
  }

  /**
   * Render mini-map in corner
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderMiniMap(ctx, canvasWidth, canvasHeight) {
    const mapSize = 120;
    const mapX = canvasWidth - mapSize - 20;
    const mapY = 20;
    const scale = 0.15;

    // Map background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    ctx.strokeStyle = this.game.themeColors.primary;
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Draw islands on mini-map
    for (const [islandId, island] of Object.entries(this.islandData)) {
      if (!this.unlockedIslands.has(islandId)) continue;

      const miniX = mapX + island.position.x * scale;
      const miniY = mapY + island.position.y * scale;

      const radius = islandId === this.currentIsland ? 4 : 2;

      ctx.fillStyle =
        islandId === this.currentIsland ? this.game.themeColors.primary : island.color;

      ctx.beginPath();
      ctx.arc(miniX, miniY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player position on mini-map
    const playerMiniX = mapX + this.playerPosition.x * scale;
    const playerMiniY = mapY + this.playerPosition.y * scale;

    ctx.fillStyle = this.game.themeColors.secondary;
    ctx.beginPath();
    ctx.arc(playerMiniX, playerMiniY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render tooltip for hovered island
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderTooltip(ctx, canvasWidth, canvasHeight) {
    const island = this.islandData[this.hoveredIsland];
    if (!island) return;

    const tooltipWidth = 300;
    const tooltipHeight = 100;
    const tooltipX = Math.min(canvasWidth - tooltipWidth - 20, canvasWidth / 2);
    const tooltipY = canvasHeight - tooltipHeight - 50;

    // Tooltip background
    ctx.fillStyle = this.game.themeColors.surface;
    ctx.strokeStyle = this.game.themeColors.primary;
    ctx.lineWidth = 2;

    ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

    // Island name
    ctx.fillStyle = this.game.themeColors.text;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(island.name, tooltipX + 10, tooltipY + 20);

    // Description
    ctx.font = '12px Arial';
    const descLines = this.wrapText(ctx, island.description, tooltipWidth - 20);
    descLines.forEach((line, index) => {
      ctx.fillText(line, tooltipX + 10, tooltipY + 40 + index * 15);
    });

    // Status
    const isUnlocked = this.unlockedIslands.has(this.hoveredIsland);
    ctx.fillStyle = isUnlocked ? this.game.themeColors.success : this.game.themeColors.danger;
    ctx.font = 'bold 12px Arial';
    ctx.fillText(isUnlocked ? 'Available' : 'Locked', tooltipX + 10, tooltipY + 85);
  }

  /**
   * Utility method to wrap text
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} text - Text to wrap
   * @param {number} maxWidth - Maximum width
   * @returns {Array<string>} Array of text lines
   */
  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Get navigation progress data
   * @returns {Object} Progress information
   */
  getProgress() {
    return {
      currentIsland: this.currentIsland,
      unlockedIslands: Array.from(this.unlockedIslands),
      visitedIslands: Array.from(this.visitedIslands),
      playerPosition: { ...this.playerPosition },
    };
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    const progress = this.getProgress();
    localStorage.setItem('adventureQuest_navigationProgress', JSON.stringify(progress));
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    const saved = localStorage.getItem('adventureQuest_navigationProgress');
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        this.currentIsland = progress.currentIsland || 'starting_dock';
        this.unlockedIslands = new Set(progress.unlockedIslands || ['starting_dock']);
        this.visitedIslands = new Set(progress.visitedIslands || []);
        this.playerPosition = progress.playerPosition || this.islandData.starting_dock.position;
        this.targetPosition = { ...this.playerPosition };
      } catch (error) {
        console.warn('Failed to load navigation progress:', error);
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clickableBounds = [];
    this.hoveredIsland = null;
  }
}
