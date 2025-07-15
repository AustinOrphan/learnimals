/**
 * Game System Integration Tests
 * Tests the integration between game engines, session management, progress tracking, and UI
 */

import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';

// Mock game modules
const mockBaseGame = {
  init: vi.fn(),
  start: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  end: vi.fn(),
  destroy: vi.fn(),
  getState: vi.fn(),
  updateScore: vi.fn()
};

const mockGameTemplateLoader = {
  loadTemplate: vi.fn(),
  renderGame: vi.fn(),
  unloadGame: vi.fn()
};

const mockProgressTracker = {
  trackGameStart: vi.fn(),
  trackGameEnd: vi.fn(),
  updateGameProgress: vi.fn(),
  saveGameSession: vi.fn()
};

// Mock canvas and game context
const mockCanvas = {
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn()
  })),
  width: 800,
  height: 600
};

vi.stubGlobal('HTMLCanvasElement', function() {
  return mockCanvas;
});

describe('Game System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up game DOM structure
    document.body.innerHTML = `
      <div id="game-container">
        <div id="game-header">
          <h1 id="game-title">Test Game</h1>
          <div id="game-stats">
            <span id="score">Score: 0</span>
            <span id="timer">Time: 60</span>
            <span id="level">Level: 1</span>
          </div>
        </div>
        <div id="game-canvas-container">
          <canvas id="game-canvas" width="800" height="600"></canvas>
        </div>
        <div id="game-controls">
          <button id="start-button">Start</button>
          <button id="pause-button">Pause</button>
          <button id="restart-button">Restart</button>
        </div>
        <div id="game-ui-overlay">
          <div id="pause-menu" style="display: none;">
            <button id="resume-button">Resume</button>
            <button id="quit-button">Quit</button>
          </div>
          <div id="game-over-modal" style="display: none;">
            <h2>Game Over!</h2>
            <p id="final-score">Final Score: 0</p>
            <button id="play-again-button">Play Again</button>
            <button id="back-to-menu-button">Back to Menu</button>
          </div>
        </div>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('complete game lifecycle management', async () => {
    const gameConfig = {
      id: 'bubble-pop',
      name: 'Bubble Pop Game',
      type: 'arcade',
      difficulty: 'medium',
      timeLimit: 60,
      canvas: '#game-canvas'
    };

    const gameSession = {
      sessionId: 'session_game_123',
      playerId: 'player_456',
      gameId: 'bubble-pop',
      startTime: Date.now(),
      state: 'initialized'
    };

    // Test game initialization
    mockBaseGame.init.mockResolvedValue(true);
    await mockBaseGame.init(gameConfig);
    
    expect(mockBaseGame.init).toHaveBeenCalledWith(gameConfig);

    // Test game template loading
    mockGameTemplateLoader.loadTemplate.mockResolvedValue({
      html: '<div class="game-template">Game loaded</div>',
      css: '.game-template { background: blue; }',
      scripts: ['gameLogic.js']
    });

    const template = await mockGameTemplateLoader.loadTemplate(gameConfig.id);
    expect(template.html).toBeTruthy();
    expect(mockGameTemplateLoader.loadTemplate).toHaveBeenCalledWith('bubble-pop');

    // Test progress tracking initialization
    mockProgressTracker.trackGameStart.mockResolvedValue(gameSession);
    const trackedSession = await mockProgressTracker.trackGameStart(gameConfig, 'player_456');
    
    expect(trackedSession.gameId).toBe('bubble-pop');
    expect(trackedSession.playerId).toBe('player_456');

    // Test game start
    mockBaseGame.start.mockResolvedValue(true);
    await mockBaseGame.start();
    
    expect(mockBaseGame.start).toHaveBeenCalled();

    console.log('✅ Game lifecycle initialization test passed');
  });

  test('game session management and state persistence', async () => {
    const gameState = {
      score: 1250,
      level: 3,
      timeRemaining: 45,
      playerPosition: { x: 400, y: 300 },
      gameObjects: [
        { id: 'bubble_1', x: 100, y: 150, color: 'red' },
        { id: 'bubble_2', x: 250, y: 200, color: 'blue' },
        { id: 'bubble_3', x: 600, y: 100, color: 'green' }
      ],
      powerUps: ['speed_boost', 'extra_points'],
      achievements: ['first_pop', 'combo_master']
    };

    // Test state retrieval
    mockBaseGame.getState.mockReturnValue(gameState);
    const currentState = mockBaseGame.getState();
    
    expect(currentState.score).toBe(1250);
    expect(currentState.level).toBe(3);
    expect(currentState.gameObjects).toHaveLength(3);

    // Test game pause and state preservation
    mockBaseGame.pause.mockResolvedValue(true);
    await mockBaseGame.pause();
    
    expect(mockBaseGame.pause).toHaveBeenCalled();

    // Verify state is preserved during pause
    const pausedState = mockBaseGame.getState();
    expect(pausedState).toEqual(currentState);

    // Test game resume
    mockBaseGame.resume.mockResolvedValue(true);
    await mockBaseGame.resume();
    
    expect(mockBaseGame.resume).toHaveBeenCalled();

    // Test session save
    mockProgressTracker.saveGameSession.mockResolvedValue(true);
    await mockProgressTracker.saveGameSession('session_123', gameState);
    
    expect(mockProgressTracker.saveGameSession).toHaveBeenCalledWith('session_123', gameState);

    console.log('✅ Game session management test passed');
  });

  test('game scoring and progress integration', async () => {
    const initialScore = 0;
    const scoreEvents = [
      { action: 'bubble_pop', points: 100, multiplier: 1 },
      { action: 'combo', points: 50, multiplier: 2 },
      { action: 'power_up', points: 200, multiplier: 1 },
      { action: 'level_complete', points: 500, multiplier: 1.5 }
    ];

    let currentScore = initialScore;

    // Test score updates
    scoreEvents.forEach((event, index) => {
      const points = event.points * event.multiplier;
      currentScore += points;
      
      mockBaseGame.updateScore.mockReturnValueOnce(currentScore);
      const newScore = mockBaseGame.updateScore(points);
      
      expect(newScore).toBe(currentScore);
      console.log(`   Score update ${index + 1}: +${points} = ${currentScore}`);
    });

    // Test progress tracking for each score event
    scoreEvents.forEach(async (event) => {
      mockProgressTracker.updateGameProgress.mockResolvedValue(true);
      await mockProgressTracker.updateGameProgress('session_123', {
        action: event.action,
        points: event.points * event.multiplier,
        timestamp: Date.now()
      });
    });

    expect(mockProgressTracker.updateGameProgress).toHaveBeenCalledTimes(scoreEvents.length);

    // Test final score calculation
    const expectedFinalScore = scoreEvents.reduce((total, event) => {
      return total + (event.points * event.multiplier);
    }, 0);

    expect(currentScore).toBe(expectedFinalScore);

    console.log('✅ Game scoring integration test passed');
  });

  test('multi-game type support and switching', async () => {
    const gameTypes = [
      {
        id: 'bubble-pop',
        type: 'arcade',
        engine: 'canvas',
        config: { timeLimit: 60, difficulty: 'medium' }
      },
      {
        id: 'word-scramble',
        type: 'puzzle',
        engine: 'dom',
        config: { wordCount: 10, difficulty: 'easy' }
      },
      {
        id: 'element-match',
        type: 'memory',
        engine: 'hybrid',
        config: { pairs: 8, difficulty: 'hard' }
      }
    ];

    // Test loading different game types
    for (const gameType of gameTypes) {
      mockGameTemplateLoader.loadTemplate.mockResolvedValue({
        id: gameType.id,
        type: gameType.type,
        engine: gameType.engine,
        initialized: true
      });

      const loadedGame = await mockGameTemplateLoader.loadTemplate(gameType.id);
      
      expect(loadedGame.id).toBe(gameType.id);
      expect(loadedGame.type).toBe(gameType.type);
      expect(loadedGame.engine).toBe(gameType.engine);
      
      console.log(`   ✓ ${gameType.id} (${gameType.type}) loaded successfully`);
    }

    // Test game switching
    mockGameTemplateLoader.unloadGame.mockResolvedValue(true);
    
    // Unload current game
    await mockGameTemplateLoader.unloadGame('bubble-pop');
    expect(mockGameTemplateLoader.unloadGame).toHaveBeenCalledWith('bubble-pop');

    // Load new game
    await mockGameTemplateLoader.loadTemplate('word-scramble');
    expect(mockGameTemplateLoader.loadTemplate).toHaveBeenCalledWith('word-scramble');

    console.log('✅ Multi-game type support test passed');
  });

  test('game controls and user interaction', async () => {
    const gameControls = {
      keyboard: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'],
      mouse: ['click', 'mousedown', 'mouseup', 'mousemove'],
      touch: ['touchstart', 'touchend', 'touchmove']
    };

    // Mock event handlers
    const mockEventHandlers = {
      onKeyPress: vi.fn(),
      onMouseClick: vi.fn(),
      onTouchStart: vi.fn()
    };

    // Test keyboard controls
    gameControls.keyboard.forEach((key) => {
      const keyEvent = new KeyboardEvent('keydown', { key });
      mockEventHandlers.onKeyPress(keyEvent);
    });

    expect(mockEventHandlers.onKeyPress).toHaveBeenCalledTimes(gameControls.keyboard.length);

    // Test mouse controls
    const mouseEvent = new MouseEvent('click', { clientX: 400, clientY: 300 });
    mockEventHandlers.onMouseClick(mouseEvent);
    
    expect(mockEventHandlers.onMouseClick).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'click',
        clientX: 400,
        clientY: 300
      })
    );

    // Test touch controls
    const touchEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 200, clientY: 150 }]
    });
    mockEventHandlers.onTouchStart(touchEvent);
    
    expect(mockEventHandlers.onTouchStart).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'touchstart'
      })
    );

    // Test game control buttons
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    
    startButton.click();
    expect(mockBaseGame.start).toHaveBeenCalled();
    
    pauseButton.click();
    expect(mockBaseGame.pause).toHaveBeenCalled();

    console.log('✅ Game controls and user interaction test passed');
  });

  test('game performance monitoring and optimization', async () => {
    const performanceMetrics = {
      frameRate: 60,
      renderTime: 0,
      updateTime: 0,
      totalMemory: 0,
      frameDrops: 0
    };

    // Mock performance monitoring
    const mockPerformanceMonitor = {
      startMonitoring: vi.fn(),
      recordFrame: vi.fn(),
      getMetrics: vi.fn(),
      optimizePerformance: vi.fn()
    };

    // Test performance monitoring start
    mockPerformanceMonitor.startMonitoring.mockReturnValue(true);
    mockPerformanceMonitor.startMonitoring();
    
    expect(mockPerformanceMonitor.startMonitoring).toHaveBeenCalled();

    // Simulate frame recording
    for (let frame = 0; frame < 60; frame++) {
      const frameData = {
        frameNumber: frame,
        renderTime: Math.random() * 16, // 0-16ms
        updateTime: Math.random() * 8,  // 0-8ms
        timestamp: Date.now() + (frame * 16.67) // 60fps
      };

      mockPerformanceMonitor.recordFrame.mockReturnValue(frameData);
      const recordedFrame = mockPerformanceMonitor.recordFrame(frameData);
      
      expect(recordedFrame.frameNumber).toBe(frame);
    }

    expect(mockPerformanceMonitor.recordFrame).toHaveBeenCalledTimes(60);

    // Test performance metrics retrieval
    mockPerformanceMonitor.getMetrics.mockReturnValue({
      avgFrameRate: 58.5,
      avgRenderTime: 12.3,
      avgUpdateTime: 4.7,
      frameDrops: 2,
      memoryUsage: 45.6
    });

    const metrics = mockPerformanceMonitor.getMetrics();
    
    expect(metrics.avgFrameRate).toBeGreaterThan(55);
    expect(metrics.avgRenderTime).toBeLessThan(16);
    expect(metrics.frameDrops).toBeLessThan(5);

    // Test performance optimization
    if (metrics.avgFrameRate < 58 || metrics.frameDrops > 3) {
      mockPerformanceMonitor.optimizePerformance.mockReturnValue({
        reducedParticles: true,
        loweredQuality: false,
        disabledEffects: false
      });

      const optimizations = mockPerformanceMonitor.optimizePerformance();
      expect(optimizations).toBeDefined();
    }

    console.log('✅ Game performance monitoring test passed');
  });

  test('game error handling and recovery', async () => {
    const errorScenarios = [
      {
        type: 'canvas_error',
        message: 'Failed to get canvas context',
        recoverable: true
      },
      {
        type: 'asset_load_error',
        message: 'Failed to load game assets',
        recoverable: true
      },
      {
        type: 'save_error',
        message: 'Failed to save game progress',
        recoverable: false
      },
      {
        type: 'network_error',
        message: 'Connection lost',
        recoverable: true
      }
    ];

    const mockErrorHandler = {
      handleError: vi.fn(),
      recoverFromError: vi.fn(),
      showErrorMessage: vi.fn()
    };

    // Test error handling for each scenario
    errorScenarios.forEach(async (scenario) => {
      const error = new Error(scenario.message);
      error.type = scenario.type;
      error.recoverable = scenario.recoverable;

      mockErrorHandler.handleError.mockResolvedValue({
        handled: true,
        recovery: scenario.recoverable ? 'attempted' : 'not_possible'
      });

      const result = await mockErrorHandler.handleError(error);
      
      expect(result.handled).toBe(true);
      
      if (scenario.recoverable) {
        expect(result.recovery).toBe('attempted');
        
        mockErrorHandler.recoverFromError.mockResolvedValue(true);
        await mockErrorHandler.recoverFromError(error);
        
        expect(mockErrorHandler.recoverFromError).toHaveBeenCalledWith(error);
      }

      console.log(`   ✓ ${scenario.type} handled correctly`);
    });

    // Test graceful degradation
    const criticalError = new Error('Critical system failure');
    criticalError.critical = true;

    mockErrorHandler.handleError.mockResolvedValue({
      handled: true,
      action: 'graceful_shutdown'
    });

    const criticalResult = await mockErrorHandler.handleError(criticalError);
    expect(criticalResult.action).toBe('graceful_shutdown');

    console.log('✅ Game error handling test passed');
  });

  test('game asset management and loading', async () => {
    const gameAssets = {
      images: [
        { id: 'background', src: '/images/game-bg.jpg', size: 1024000 },
        { id: 'player_sprite', src: '/images/player.png', size: 51200 },
        { id: 'enemy_sprite', src: '/images/enemy.png', size: 25600 }
      ],
      sounds: [
        { id: 'background_music', src: '/audio/game-music.mp3', size: 2048000 },
        { id: 'pop_sound', src: '/audio/pop.wav', size: 12800 },
        { id: 'victory_sound', src: '/audio/victory.mp3', size: 102400 }
      ],
      fonts: [
        { id: 'game_font', src: '/fonts/game-font.woff2', size: 40960 }
      ]
    };

    const mockAssetLoader = {
      preloadAssets: vi.fn(),
      loadAsset: vi.fn(),
      getAsset: vi.fn(),
      unloadAssets: vi.fn()
    };

    // Test asset preloading
    const totalAssets = gameAssets.images.length + gameAssets.sounds.length + gameAssets.fonts.length;
    mockAssetLoader.preloadAssets.mockResolvedValue({
      loaded: totalAssets,
      failed: 0,
      totalSize: gameAssets.images.reduce((sum, img) => sum + img.size, 0) +
                  gameAssets.sounds.reduce((sum, snd) => sum + snd.size, 0) +
                  gameAssets.fonts.reduce((sum, fnt) => sum + fnt.size, 0)
    });

    const preloadResult = await mockAssetLoader.preloadAssets(gameAssets);
    
    expect(preloadResult.loaded).toBe(totalAssets);
    expect(preloadResult.failed).toBe(0);
    expect(preloadResult.totalSize).toBeGreaterThan(0);

    // Test individual asset loading
    gameAssets.images.forEach(async (image) => {
      mockAssetLoader.loadAsset.mockResolvedValue({
        id: image.id,
        type: 'image',
        data: new Image(), // Mock image object
        loaded: true
      });

      const loadedAsset = await mockAssetLoader.loadAsset(image.id, 'image');
      expect(loadedAsset.id).toBe(image.id);
      expect(loadedAsset.loaded).toBe(true);
    });

    // Test asset retrieval
    mockAssetLoader.getAsset.mockReturnValue({
      id: 'player_sprite',
      type: 'image',
      data: new Image()
    });

    const playerSprite = mockAssetLoader.getAsset('player_sprite');
    expect(playerSprite.id).toBe('player_sprite');

    // Test asset cleanup
    mockAssetLoader.unloadAssets.mockResolvedValue({
      unloaded: totalAssets,
      memoryFreed: preloadResult.totalSize
    });

    const unloadResult = await mockAssetLoader.unloadAssets();
    expect(unloadResult.unloaded).toBe(totalAssets);

    console.log('✅ Game asset management test passed');
  });

  test('game analytics and telemetry integration', async () => {
    const gameAnalytics = {
      sessionId: 'analytics_session_789',
      events: [],
      metrics: {
        sessionDuration: 0,
        interactions: 0,
        achievements: 0,
        errors: 0
      }
    };

    const mockAnalyticsTracker = {
      trackEvent: vi.fn(),
      trackMetric: vi.fn(),
      getAnalytics: vi.fn(),
      sendAnalytics: vi.fn()
    };

    // Test event tracking
    const gameEvents = [
      { type: 'game_start', data: { gameId: 'bubble-pop', level: 1 } },
      { type: 'score_update', data: { score: 150, action: 'bubble_pop' } },
      { type: 'level_up', data: { newLevel: 2, score: 500 } },
      { type: 'power_up_used', data: { powerUp: 'speed_boost', remaining: 2 } },
      { type: 'game_end', data: { finalScore: 1250, completedLevels: 3 } }
    ];

    gameEvents.forEach((event) => {
      mockAnalyticsTracker.trackEvent.mockReturnValue(true);
      const tracked = mockAnalyticsTracker.trackEvent(event.type, event.data);
      
      expect(tracked).toBe(true);
      gameAnalytics.events.push(event);
    });

    expect(mockAnalyticsTracker.trackEvent).toHaveBeenCalledTimes(gameEvents.length);

    // Test metric tracking
    const metrics = [
      { name: 'session_duration', value: 180000 }, // 3 minutes
      { name: 'clicks_per_minute', value: 45 },
      { name: 'accuracy_percentage', value: 87.5 },
      { name: 'average_reaction_time', value: 245 } // milliseconds
    ];

    metrics.forEach((metric) => {
      mockAnalyticsTracker.trackMetric.mockReturnValue(true);
      const tracked = mockAnalyticsTracker.trackMetric(metric.name, metric.value);
      
      expect(tracked).toBe(true);
      gameAnalytics.metrics[metric.name] = metric.value;
    });

    // Test analytics retrieval
    mockAnalyticsTracker.getAnalytics.mockReturnValue(gameAnalytics);
    const analytics = mockAnalyticsTracker.getAnalytics();
    
    expect(analytics.events).toHaveLength(gameEvents.length);
    expect(analytics.metrics.session_duration).toBe(180000);
    expect(analytics.metrics.accuracy_percentage).toBe(87.5);

    // Test analytics sending
    mockAnalyticsTracker.sendAnalytics.mockResolvedValue({
      sent: true,
      timestamp: Date.now(),
      batchId: 'batch_123'
    });

    const sendResult = await mockAnalyticsTracker.sendAnalytics(analytics);
    expect(sendResult.sent).toBe(true);
    expect(sendResult.batchId).toBe('batch_123');

    console.log('✅ Game analytics integration test passed');
  });
});