/**
 * Game Registry - Configuration for all games in the Learnimals system
 * This file defines metadata, dependencies, and configuration for each game
 */

/**
 * Game registry containing all available games
 * Each game entry must have the required fields and can include optional configuration
 */
export const gameRegistry = [
  // Word Scramble Game - Already properly extends BaseGame
  {
    id: 'word-scramble',
    name: 'Word Scramble',
    description: 'Unscramble letters to spell words and improve your reading skills!',
    gameClass: 'WordScrambleGame',
    scriptPath: '/src/features/games/word-scramble/wordScramble.js',
    styleSheet: '/src/features/games/word-scramble/wordScramble.css',
    
    // Subject and character information
    subject: 'reading',
    character: 'Ruby',
    characterType: 'Rabbit',
    
    // Supported difficulty levels
    difficulty: ['easy', 'medium', 'hard'],
    
    // Game features
    features: ['analytics', 'progress', 'mobile', 'themes', 'audio'],
    
    // Template configuration - Using minimal template for focused word puzzle gameplay
    template: 'minimal',
    showControls: true,
    showProgress: true,
    showStats: true,
    
    // Enhanced metadata fields
    metadata: {
      gameType: 'word-puzzle',
      estimatedPlayTime: 5, // minutes
      ageRange: '6-12',
      learningObjectives: ['vocabulary', 'spelling', 'word recognition'],
      accessibility: ['keyboard-navigation', 'screen-reader'],
      platforms: ['desktop', 'mobile', 'tablet'],
      lastUpdated: '2024-01-15',
      version: '1.2.0',
      tags: ['educational', 'vocabulary', 'spelling', 'puzzle'],
      competencyLevel: 'beginner-intermediate'
    },
    
    // Game-specific options
    options: {
      timeLimit: 60,
      maxRounds: 5,
      enableHints: true,
      enableDragDrop: true
    },
    
    // Content for template rendering
    templateContent: `
      <div class="word-scramble-container">
        <div class="game-instructions" id="instructions">
          <p>Drag letters to spell the word!</p>
        </div>
        <div class="word-hint" id="word-hint"></div>
        <div class="scrambled-letters" id="scrambled-area"></div>
        <div class="solution-area" id="solution-area"></div>
        <div class="game-controls">
          <button id="check-word" class="btn btn-primary">Check Answer</button>
          <button id="new-word" class="btn btn-secondary">Next Word</button>
        </div>
      </div>
    `,
    
    // Dependencies (loaded before game script)
    dependencies: []
  },

  // Bubble Pop Game - Now fully migrated to BaseGame
  {
    id: 'bubble-pop',
    name: 'Bubble Pop Math',
    description: 'Pop bubbles with the correct answers to solve math problems!',
    gameClass: 'BubblePopGame',
    scriptPath: '/src/features/games/bubble-pop/bubblepop.js',
    styleSheet: '/src/features/games/bubble-pop/bubblepop.css',
    
    // Subject and character information
    subject: 'math',
    character: 'Mango',
    characterType: 'Shark',
    
    // Supported difficulty levels
    difficulty: ['easy', 'medium', 'hard'],
    
    // Game features (fully featured after BaseGame migration)
    features: ['analytics', 'progress', 'mobile', 'themes', 'audio'],
    
    // Template configuration - Using fullscreen template for immersive action-puzzle experience
    template: 'fullscreen', // Immersive canvas-based bubble popping with auto-hide UI
    showControls: true,
    showProgress: true,
    showStats: true,
    
    // Enhanced metadata fields
    metadata: {
      gameType: 'action-puzzle',
      estimatedPlayTime: 10, // minutes
      ageRange: '5-10',
      learningObjectives: ['arithmetic', 'number recognition', 'problem-solving', 'hand-eye coordination'],
      accessibility: ['keyboard-navigation', 'high-contrast'],
      platforms: ['desktop', 'mobile', 'tablet'],
      lastUpdated: '2024-07-14',
      version: '2.0.0',
      tags: ['educational', 'math', 'action', 'bubbles', 'arithmetic'],
      competencyLevel: 'beginner'
    },
    
    // Game-specific options
    options: {
      canvasWidth: 800,
      canvasHeight: 600,
      bubbleSpeed: 2,
      spawnRate: 3000
    },
    
    // Content for template rendering
    templateContent: `
      <div class="bubble-pop-container">
        <canvas id="gameCanvas" width="800" height="600" class="game-canvas">
          Your browser doesn't support canvas. Please upgrade to play!
        </canvas>
      </div>
    `,
    
    // Dependencies
    dependencies: [
      '/src/features/games/bubble-pop/Bubble.js'
    ]
  },

  // Pizza Maker Game - Now fully extends BaseGame for DOM-based gameplay
  {
    id: 'pizza-maker',
    name: 'Pizza Party Rush',
    description: 'Help serve delicious pizzas by following customer orders!',
    gameClass: 'PizzaMakerGame',
    scriptPath: '/src/features/games/pizza-maker/PizzaMakerGame.js',
    styleSheet: '/src/features/games/pizza-maker/pizzaMaker.css',
    
    // Subject and character information
    subject: 'general',
    character: 'Chef Mario',
    characterType: 'Chef',
    
    // Supported difficulty levels
    difficulty: ['easy', 'medium', 'hard'],
    
    // Game features (fully featured after BaseGame migration)
    features: ['analytics', 'progress', 'mobile', 'themes', 'audio'],
    
    // Template configuration - Using mobile template for touch-friendly simulation game
    template: 'mobile', // Touch-optimized for younger ages with haptic feedback
    showControls: true, // BaseGame provides enhanced controls
    showProgress: true,
    showStats: true,
    
    // Enhanced metadata fields
    metadata: {
      gameType: 'simulation',
      estimatedPlayTime: 8, // minutes
      ageRange: '4-10',
      learningObjectives: ['following instructions', 'sequencing', 'memory', 'time management'],
      accessibility: ['touch-friendly', 'large-buttons', 'audio-cues'],
      platforms: ['desktop', 'mobile', 'tablet'],
      lastUpdated: '2024-07-14',
      version: '2.0.0',
      tags: ['simulation', 'cooking', 'memory', 'following-directions', 'fun'],
      competencyLevel: 'beginner'
    },
    
    // Game-specific options
    options: {
      ordersPerLevel: 3,
      timeLimit: 30,
      enableSound: true,
      enableHapticFeedback: true
    },
    
    // Content for template rendering
    templateContent: `
      <div class="pizza-maker-container">
        <div class="customer-area">
          <div class="customer-character" id="customerCharacter">
            <span class="customer-emoji">👧</span>
          </div>
          <div class="speech-bubble" id="speechBubble">
            <div class="order-request" id="orderRequest"></div>
          </div>
        </div>
        
        <div class="kitchen-area">
          <div class="pizza-station">
            <div class="pizza-base" id="pizzaBase"></div>
            <div class="pizza-toppings" id="pizzaToppings"></div>
          </div>
          
          <div class="toppings-grid" id="toppingsGrid">
            <!-- Toppings will be generated by game -->
          </div>
          
          <div class="kitchen-controls">
            <button id="bakeButton" class="btn btn-primary">🔥 Bake & Serve!</button>
            <button id="trashButton" class="btn btn-secondary">🗑️ Clear</button>
          </div>
        </div>
      </div>
    `,
    
    // Dependencies
    dependencies: [
      '/src/utils/AnimationManager.js'
    ]
  },

  // Element Match Game - Already fully extends BaseGame for canvas-based gameplay
  {
    id: 'element-match',
    name: 'Element Match Lab',
    description: 'Match chemical elements with their properties in Sage\'s laboratory!',
    gameClass: 'ElementMatchGame',
    scriptPath: '/src/features/games/element-match/elementMatch.js',
    styleSheet: '/src/features/games/element-match/elementMatch.css',
    
    // Subject and character information
    subject: 'science',
    character: 'Sage',
    characterType: 'Owl',
    
    // Supported difficulty levels
    difficulty: ['easy', 'medium', 'hard'],
    
    // Game features (fully featured with BaseGame integration)
    features: ['analytics', 'progress', 'mobile', 'themes', 'audio'],
    
    // Template configuration
    template: 'game',
    showControls: true,
    showProgress: true,
    showStats: true,
    
    // Enhanced metadata fields
    metadata: {
      gameType: 'matching-puzzle',
      estimatedPlayTime: 12, // minutes
      ageRange: '8-14',
      learningObjectives: ['chemistry basics', 'element properties', 'scientific reasoning', 'pattern recognition'],
      accessibility: ['keyboard-navigation', 'color-blind-friendly'],
      platforms: ['desktop', 'mobile', 'tablet'],
      lastUpdated: '2024-07-14',
      version: '1.5.0',
      tags: ['educational', 'science', 'chemistry', 'elements', 'matching'],
      competencyLevel: 'intermediate'
    },
    
    // Game-specific options
    options: {
      elementsPerRound: 4,
      maxRounds: 5,
      enableHints: true,
      showPeriodicTable: true
    },
    
    // Content for template rendering
    templateContent: `
      <div class="element-match-container">
        <div class="game-instructions" id="game-instructions">
          <h3>🧪 Welcome to the Science Lab!</h3>
          <p>Match elements with their properties!</p>
        </div>
        
        <canvas id="gameCanvas" class="game-canvas" width="900" height="550">
          Your browser doesn't support canvas. Please upgrade to explore the elements!
        </canvas>
        
        <div class="lab-controls">
          <button id="hint-btn" class="btn btn-outline">💡 Hint</button>
          <button id="info-btn" class="btn btn-outline">ℹ️ Element Info</button>
        </div>
      </div>
    `,
    
    // Dependencies
    dependencies: []
  },

  // Memory Card Game - Pattern matching and memory training
  {
    id: 'memory-cards',
    name: 'Memory Cards',
    description: 'Flip cards to find matching pairs and train your memory!',
    gameClass: 'MemoryCardGame',
    scriptPath: '/src/features/games/memory-cards/memoryCards.js',
    styleSheet: '/src/features/games/memory-cards/memoryCards.css',
    
    // Subject and character information
    subject: 'general',
    character: 'Mnemonica',
    characterType: 'Elephant',
    
    // Supported difficulty levels
    difficulty: ['easy', 'medium', 'hard'],
    
    // Game features
    features: ['analytics', 'progress', 'mobile', 'themes'],
    
    // Template configuration - Using mobile template for touch-friendly card flipping
    template: 'mobile',
    showControls: true,
    showProgress: true,
    showStats: true,
    
    // Enhanced metadata fields
    metadata: {
      gameType: 'memory-puzzle',
      estimatedPlayTime: 6, // minutes
      ageRange: '4-12',
      learningObjectives: ['visual memory', 'concentration', 'pattern recognition', 'cognitive skills'],
      accessibility: ['keyboard-navigation', 'large-cards', 'high-contrast'],
      platforms: ['desktop', 'mobile', 'tablet'],
      lastUpdated: '2024-07-14',
      version: '1.3.0',
      tags: ['memory', 'cognitive', 'matching', 'concentration', 'cards'],
      competencyLevel: 'beginner'
    },
    
    // Game-specific options
    options: {
      gridSizes: {
        easy: { rows: 3, cols: 4 },
        medium: { rows: 4, cols: 5 },
        hard: { rows: 5, cols: 6 }
      },
      flipAnimationDuration: 600,
      matchDisplayTime: 1000
    },
    
    // Content for template rendering
    templateContent: `
      <div class="memory-cards-container">
        <div class="game-board" id="game-board"></div>
        <div class="game-stats">
          <div class="stat">Moves: <span id="moves-count">0</span></div>
          <div class="stat">Matches: <span id="matches-count">0</span></div>
          <div class="stat">Time: <span id="time-elapsed">00:00</span></div>
        </div>
      </div>
    `,
    
    // Dependencies
    dependencies: []
  },

  // Number Bonds Game - Math relationships
  {
    id: 'number-bonds',
    name: 'Number Bonds',
    description: 'Discover number relationships and build math foundations!',
    gameClass: 'NumberBondsGame',
    scriptPath: '/src/features/games/number-bonds/numberBonds.js',
    styleSheet: '/src/features/games/number-bonds/numberBonds.css',
    
    // Subject and character information
    subject: 'math',
    character: 'Newton',
    characterType: 'Penguin',
    
    // Supported difficulty levels
    difficulty: ['easy', 'medium', 'hard'],
    
    // Game features
    features: ['analytics', 'progress', 'mobile', 'themes', 'audio'],
    
    // Template configuration
    template: 'game',
    showControls: true,
    showProgress: true,
    showStats: true,
    
    // Enhanced metadata fields
    metadata: {
      gameType: 'math-puzzle',
      estimatedPlayTime: 8, // minutes
      ageRange: '5-9',
      learningObjectives: ['number relationships', 'addition bonds', 'subtraction bonds', 'mental math'],
      accessibility: ['keyboard-navigation', 'visual-aids', 'audio-feedback'],
      platforms: ['desktop', 'mobile', 'tablet'],
      lastUpdated: '2024-07-14',
      version: '1.4.0',
      tags: ['educational', 'math', 'number-bonds', 'addition', 'subtraction'],
      competencyLevel: 'beginner'
    },
    
    // Game-specific options
    options: {
      targetNumbers: {
        easy: [5, 10],
        medium: [10, 20],
        hard: [20, 50]
      },
      visualMode: true,
      enableAnimations: true
    },
    
    // Content for template rendering
    templateContent: `
      <div class="number-bonds-container">
        <div class="target-number" id="target-number">
          <span>Make</span>
          <span class="number" id="target-value">10</span>
        </div>
        
        <div class="bonds-workspace" id="workspace">
          <div class="number-circles" id="number-circles"></div>
          <div class="bond-equation" id="bond-equation">
            <span id="first-number">?</span>
            <span class="operator">+</span>
            <span id="second-number">?</span>
            <span class="equals">=</span>
            <span id="result-number">?</span>
          </div>
        </div>
        
        <div class="number-picker" id="number-picker"></div>
      </div>
    `,
    
    // Dependencies
    dependencies: []
  },

  // Pattern Blocks Game - Geometry and spatial reasoning
  {
    id: 'pattern-blocks',
    name: 'Pattern Blocks',
    description: 'Create beautiful patterns and explore geometric shapes!',
    gameClass: 'PatternBlocksGame',
    scriptPath: '/src/features/games/pattern-blocks/patternBlocks.js',
    styleSheet: '/src/features/games/pattern-blocks/patternBlocks.css',
    
    // Subject and character information
    subject: 'math',
    character: 'Pythagoras',
    characterType: 'Snake',
    
    // Supported difficulty levels
    difficulty: ['easy', 'medium', 'hard'],
    
    // Game features
    features: ['analytics', 'progress', 'mobile', 'themes'],
    
    // Template configuration - Using fullscreen template for creative pattern design
    template: 'fullscreen',
    showControls: true,
    showProgress: true,
    showStats: true,
    
    // Enhanced metadata fields
    metadata: {
      gameType: 'creative-puzzle',
      estimatedPlayTime: 15, // minutes
      ageRange: '6-12',
      learningObjectives: ['geometric shapes', 'spatial reasoning', 'pattern recognition', 'creativity'],
      accessibility: ['drag-and-drop', 'keyboard-navigation', 'color-coding'],
      platforms: ['desktop', 'mobile', 'tablet'],
      lastUpdated: '2024-07-14',
      version: '1.3.0',
      tags: ['educational', 'math', 'geometry', 'patterns', 'shapes', 'creative'],
      competencyLevel: 'beginner-intermediate'
    },
    
    // Game-specific options
    options: {
      enableFreePlay: true,
      enablePatternMode: true,
      enableSymmetryCheck: true,
      availableShapes: ['triangle', 'square', 'hexagon', 'rhombus', 'trapezoid']
    },
    
    // Content for template rendering
    templateContent: `
      <div class="pattern-blocks-container">
        <div class="canvas-area">
          <canvas id="pattern-canvas" width="800" height="600" class="pattern-canvas">
            Your browser doesn't support canvas.
          </canvas>
        </div>
        
        <div class="shapes-palette" id="shapes-palette">
          <h4>Shapes</h4>
          <div class="shape-grid" id="shape-grid"></div>
        </div>
        
        <div class="pattern-controls">
          <button id="clear-canvas" class="btn btn-secondary">Clear</button>
          <button id="save-pattern" class="btn btn-primary">Save Pattern</button>
          <button id="load-pattern" class="btn btn-outline">Load Pattern</button>
        </div>
      </div>
    `,
    
    // Dependencies
    dependencies: []
  },

  // Story Builder Game - Creative writing and reading
  {
    id: 'story-builder',
    name: 'Story Builder',
    description: 'Create amazing stories by choosing words and building sentences!',
    gameClass: 'StoryBuilderGame',
    scriptPath: '/src/features/games/story-builder/storyBuilder.js',
    styleSheet: '/src/features/games/story-builder/storyBuilder.css',
    
    // Subject and character information
    subject: 'reading',
    character: 'Storyteller',
    characterType: 'Fox',
    
    // Supported difficulty levels
    difficulty: ['easy', 'medium', 'hard'],
    
    // Game features
    features: ['analytics', 'progress', 'mobile', 'themes', 'audio'],
    
    // Template configuration
    template: 'game',
    showControls: true,
    showProgress: true,
    showStats: true,
    
    // Enhanced metadata fields
    metadata: {
      gameType: 'creative-writing',
      estimatedPlayTime: 12, // minutes
      ageRange: '6-12',
      learningObjectives: ['creative writing', 'story structure', 'vocabulary expansion', 'reading comprehension'],
      accessibility: ['text-to-speech', 'keyboard-navigation', 'large-text'],
      platforms: ['desktop', 'mobile', 'tablet'],
      lastUpdated: '2024-07-14',
      version: '1.4.0',
      tags: ['educational', 'reading', 'writing', 'creativity', 'stories', 'vocabulary'],
      competencyLevel: 'beginner-intermediate'
    },
    
    // Game-specific options
    options: {
      storyTemplates: ['adventure', 'mystery', 'fantasy', 'science'],
      enableIllustrations: true,
      enableNarration: true,
      maxStoryLength: 10
    },
    
    // Content for template rendering
    templateContent: `
      <div class="story-builder-container">
        <div class="story-display" id="story-display">
          <div class="story-text" id="story-text">
            <p>Click on words below to build your story!</p>
          </div>
          <div class="story-illustration" id="story-illustration"></div>
        </div>
        
        <div class="word-choices" id="word-choices">
          <div class="word-category" id="nouns">
            <h4>Who/What</h4>
            <div class="word-buttons" id="noun-buttons"></div>
          </div>
          <div class="word-category" id="verbs">
            <h4>Action</h4>
            <div class="word-buttons" id="verb-buttons"></div>
          </div>
          <div class="word-category" id="adjectives">
            <h4>Describing</h4>
            <div class="word-buttons" id="adjective-buttons"></div>
          </div>
        </div>
        
        <div class="story-controls">
          <button id="read-story" class="btn btn-primary">📖 Read Story</button>
          <button id="new-story" class="btn btn-secondary">🔄 New Story</button>
          <button id="save-story" class="btn btn-outline">💾 Save Story</button>
        </div>
      </div>
    `,
    
    // Dependencies
    dependencies: []
  },

  // Number Line Jump Game - Already fully extends BaseGame for canvas-based gameplay
  {
    id: 'number-line-jump',
    name: 'Number Line Jump',
    description: 'Jump along the number line with Leo the Lion to learn addition and subtraction!',
    gameClass: 'NumberLineJumpGame',
    scriptPath: '/src/features/games/number-line-jump/numberLineJump.js',
    styleSheet: '/src/features/games/number-line-jump/numberLineJump.css',
    
    // Subject and character information
    subject: 'math',
    character: 'Leo',
    characterType: 'Lion',
    
    // Supported difficulty levels
    difficulty: ['easy', 'medium', 'hard'],
    
    // Game features (fully featured with BaseGame integration)
    features: ['analytics', 'progress', 'mobile', 'themes', 'audio'],
    
    // Template configuration - Using minimal template for focused math visualization
    template: 'minimal',
    showControls: true,
    showProgress: true,
    showStats: true,
    
    // Enhanced metadata fields
    metadata: {
      gameType: 'math-visualization',
      estimatedPlayTime: 10, // minutes
      ageRange: '5-10',
      learningObjectives: ['number line concepts', 'addition visualization', 'subtraction visualization', 'counting'],
      accessibility: ['keyboard-navigation', 'visual-aids', 'audio-instructions'],
      platforms: ['desktop', 'mobile', 'tablet'],
      lastUpdated: '2024-07-14',
      version: '1.5.0',
      tags: ['educational', 'math', 'number-line', 'addition', 'subtraction', 'visualization'],
      competencyLevel: 'beginner'
    },
    
    // Game-specific options
    options: {
      maxNumber: 20,
      maxJumps: 10,
      enableUndo: true,
      visualizeJumps: true
    },
    
    // Content for template rendering
    templateContent: `
      <div class="number-line-jump-container">
        <div class="game-instructions" id="game-instructions">
          <h3>🦁 Jump with Leo!</h3>
          <p>Help Leo jump to the target number!</p>
        </div>
        
        <canvas id="gameCanvas" class="game-canvas" width="800" height="500">
          Your browser doesn't support canvas. Please upgrade to jump with Leo!
        </canvas>
        
        <div class="jump-controls">
          <button id="undo-btn" class="btn btn-outline">↶ Undo</button>
          <button id="hint-btn" class="btn btn-outline">💡 Hint</button>
        </div>
      </div>
    `,
    
    // Dependencies
    dependencies: []
  },

  // Color Palette Game - Already fully extends BaseGame for canvas-based gameplay
  {
    id: 'color-palette',
    name: 'Color Palette Creator',
    description: 'Learn color theory and create beautiful palettes with Aria the Owl!',
    gameClass: 'ColorPaletteGame',
    scriptPath: '/src/features/games/color-palette/colorPalette.js',
    styleSheet: '/src/features/games/color-palette/colorPalette.css',
    
    // Subject and character information
    subject: 'art',
    character: 'Aria',
    characterType: 'Owl',
    
    // Supported difficulty levels
    difficulty: ['easy', 'medium', 'hard'],
    
    // Game features (fully featured with BaseGame integration)
    features: ['analytics', 'progress', 'mobile', 'themes', 'audio'],
    
    // Template configuration - Using fullscreen template for immersive art creation
    template: 'fullscreen',
    showControls: true,
    showProgress: true,
    showStats: true,
    
    // Enhanced metadata fields
    metadata: {
      gameType: 'creative-art',
      estimatedPlayTime: 15, // minutes
      ageRange: '6-14',
      learningObjectives: ['color theory', 'artistic expression', 'color harmony', 'visual design'],
      accessibility: ['color-blind-assistance', 'keyboard-navigation', 'color-names'],
      platforms: ['desktop', 'mobile', 'tablet'],
      lastUpdated: '2024-07-14',
      version: '1.4.0',
      tags: ['educational', 'art', 'color-theory', 'creativity', 'design', 'palette'],
      competencyLevel: 'beginner-intermediate'
    },
    
    // Game-specific options
    options: {
      maxChallenges: 5,
      enableColorMixing: true,
      showColorWheel: true,
      enableHints: true
    },
    
    // Content for template rendering
    templateContent: `
      <div class="color-palette-container">
        <div class="game-instructions" id="game-instructions">
          <h3>🎨 Color Theory with Aria!</h3>
          <p>Create beautiful color palettes!</p>
        </div>
        
        <canvas id="gameCanvas" class="game-canvas" width="900" height="600">
          Your browser doesn't support canvas. Please upgrade to paint with Aria!
        </canvas>
        
        <div class="palette-controls">
          <button id="color-wheel-btn" class="btn btn-outline">🎨 Color Wheel</button>
          <button id="palette-hint-btn" class="btn btn-outline">💡 Hint</button>
        </div>
      </div>
    `,
    
    // Dependencies
    dependencies: [
      '/src/features/games/color-palette/colorData.js'
    ]
  },

  // Sentence Builder Game - Already fully extends BaseGame for DOM-based gameplay
  {
    id: 'sentence-builder',
    name: 'Sentence Builder',
    description: 'Build perfect sentences with Bella the Bunny and learn grammar!',
    gameClass: 'SentenceBuilderGame',
    scriptPath: '/src/features/games/sentence-builder/sentenceBuilder.js',
    styleSheet: '/src/features/games/sentence-builder/sentenceBuilder.css',
    
    // Subject and character information
    subject: 'reading',
    character: 'Bella',
    characterType: 'Bunny',
    
    // Supported difficulty levels
    difficulty: ['easy', 'medium', 'hard'],
    
    // Game features (fully featured with BaseGame integration)
    features: ['analytics', 'progress', 'mobile', 'themes', 'audio'],
    
    // Template configuration
    template: 'game',
    showControls: true,
    showProgress: true,
    showStats: true,
    
    // Enhanced metadata fields
    metadata: {
      gameType: 'grammar-puzzle',
      estimatedPlayTime: 8, // minutes
      ageRange: '6-11',
      learningObjectives: ['sentence structure', 'grammar rules', 'parts of speech', 'reading comprehension'],
      accessibility: ['drag-and-drop', 'keyboard-navigation', 'text-to-speech', 'grammar-hints'],
      platforms: ['desktop', 'mobile', 'tablet'],
      lastUpdated: '2024-07-14',
      version: '1.4.0',
      tags: ['educational', 'reading', 'grammar', 'sentences', 'language-arts'],
      competencyLevel: 'beginner-intermediate'
    },
    
    // Game-specific options
    options: {
      maxSentences: 5,
      enableDragDrop: true,
      showGrammarHints: true,
      enableAutoCheck: false
    },
    
    // Content for template rendering
    templateContent: `
      <div class="sentence-builder-container">
        <div class="game-instructions" id="game-instructions">
          <h3>🐰 Grammar with Bella!</h3>
          <p>Drag words to build perfect sentences!</p>
        </div>
        
        <div class="sentence-workspace" id="sentence-workspace">
          <div class="word-bank" id="word-bank"></div>
          <div class="sentence-area" id="sentence-area"></div>
          <div class="grammar-hint" id="grammar-hint"></div>
        </div>
        
        <div class="sentence-controls">
          <button id="check-sentence" class="btn btn-primary">✓ Check Sentence</button>
          <button id="clear-sentence" class="btn btn-secondary">🗑️ Clear</button>
          <button id="grammar-help" class="btn btn-outline">📖 Grammar Help</button>
        </div>
      </div>
    `,
    
    // Dependencies
    dependencies: [
      '/src/features/games/sentence-builder/sentenceData.js'
    ]
  }
];

/**
 * Game registry utilities for querying and filtering games
 */
export class GameRegistryUtil {
  /**
   * Get all games
   * @returns {Array} All registered games
   */
  static getAllGames() {
    return [...gameRegistry];
  }

  /**
   * Get game by ID
   * @param {string} gameId - Game ID to find
   * @returns {Object|null} Game configuration or null if not found
   */
  static getGameById(gameId) {
    return gameRegistry.find(game => game.id === gameId) || null;
  }

  /**
   * Get games by subject
   * @param {string} subject - Subject to filter by
   * @returns {Array} Games for the specified subject
   */
  static getGamesBySubject(subject) {
    return gameRegistry.filter(game => game.subject === subject);
  }

  /**
   * Get games by difficulty
   * @param {string} difficulty - Difficulty level to filter by
   * @returns {Array} Games supporting the specified difficulty
   */
  static getGamesByDifficulty(difficulty) {
    return gameRegistry.filter(game => 
      game.difficulty && game.difficulty.includes(difficulty)
    );
  }

  /**
   * Get games by character
   * @param {string} character - Character name to filter by
   * @returns {Array} Games featuring the specified character
   */
  static getGamesByCharacter(character) {
    return gameRegistry.filter(game => 
      game.character && game.character.toLowerCase() === character.toLowerCase()
    );
  }

  /**
   * Get games supporting specific features
   * @param {Array|string} features - Feature(s) to filter by
   * @returns {Array} Games supporting all specified features
   */
  static getGamesByFeatures(features) {
    const requiredFeatures = Array.isArray(features) ? features : [features];
    
    return gameRegistry.filter(game =>
      game.features && requiredFeatures.every(feature => 
        game.features.includes(feature)
      )
    );
  }

  /**
   * Advanced filtering with multiple criteria
   * @param {Object} criteria - Filtering criteria
   * @param {string} criteria.subject - Subject to filter by
   * @param {string} criteria.difficulty - Difficulty level
   * @param {Array} criteria.features - Required features
   * @param {string} criteria.template - Template type
   * @param {string} criteria.character - Character name
   * @param {string} criteria.search - Search term for name/description
   * @param {boolean} criteria.baseGameOnly - Only games using BaseGame
   * @returns {Array} Filtered games
   */
  static getGamesAdvanced(criteria = {}) {
    let filteredGames = [...gameRegistry];
    
    if (criteria.subject) {
      filteredGames = filteredGames.filter(game => 
        game.subject === criteria.subject
      );
    }
    
    if (criteria.difficulty) {
      filteredGames = filteredGames.filter(game => 
        game.difficulty && game.difficulty.includes(criteria.difficulty)
      );
    }
    
    if (criteria.features) {
      const requiredFeatures = Array.isArray(criteria.features) ? criteria.features : [criteria.features];
      filteredGames = filteredGames.filter(game =>
        game.features && requiredFeatures.every(feature => 
          game.features.includes(feature)
        )
      );
    }
    
    if (criteria.template) {
      filteredGames = filteredGames.filter(game => 
        game.template === criteria.template
      );
    }
    
    if (criteria.character) {
      filteredGames = filteredGames.filter(game => 
        game.character && game.character.toLowerCase() === criteria.character.toLowerCase()
      );
    }
    
    if (criteria.search) {
      const searchTerm = criteria.search.toLowerCase();
      filteredGames = filteredGames.filter(game =>
        game.name.toLowerCase().includes(searchTerm) ||
        game.description.toLowerCase().includes(searchTerm) ||
        game.subject.toLowerCase().includes(searchTerm) ||
        (game.character && game.character.toLowerCase().includes(searchTerm))
      );
    }
    
    if (criteria.baseGameOnly) {
      const baseGameFeatures = ['analytics', 'progress', 'mobile', 'themes'];
      filteredGames = filteredGames.filter(game =>
        baseGameFeatures.every(feature => game.features.includes(feature))
      );
    }
    
    return filteredGames;
  }

  /**
   * Get games by template type
   * @param {string} template - Template type to filter by
   * @returns {Array} Games using the specified template
   */
  static getGamesByTemplate(template) {
    return gameRegistry.filter(game => game.template === template);
  }

  /**
   * Get games by game type
   * @param {string} gameType - Game type to filter by (puzzle, action, educational, etc.)
   * @returns {Array} Games of the specified type
   */
  static getGamesByType(gameType) {
    return gameRegistry.filter(game => 
      game.gameType === gameType || 
      (game.options && game.options.gameType === gameType)
    );
  }

  /**
   * Get games supporting specific platforms
   * @param {Array|string} platforms - Platform(s) to filter by ('mobile', 'desktop', 'tablet')
   * @returns {Array} Games supporting the specified platforms
   */
  static getGamesByPlatform(platforms) {
    const requiredPlatforms = Array.isArray(platforms) ? platforms : [platforms];
    
    return gameRegistry.filter(game => {
      if (!game.features) return false;
      
      return requiredPlatforms.every(platform => {
        switch (platform) {
        case 'mobile':
          return game.features.includes('mobile');
        case 'desktop':
          return true; // All games support desktop
        case 'tablet':
          return game.features.includes('mobile') || game.features.includes('responsive');
        default:
          return false;
        }
      });
    });
  }

  /**
   * Get games with specific options
   * @param {Object} optionCriteria - Options to filter by
   * @returns {Array} Games matching the option criteria
   */
  static getGamesByOptions(optionCriteria) {
    return gameRegistry.filter(game => {
      if (!game.options) return false;
      
      return Object.keys(optionCriteria).every(key => {
        const expectedValue = optionCriteria[key];
        const actualValue = game.options[key];
        
        if (typeof expectedValue === 'boolean') {
          return actualValue === expectedValue;
        }
        
        if (Array.isArray(expectedValue)) {
          return expectedValue.includes(actualValue);
        }
        
        return actualValue === expectedValue;
      });
    });
  }

  /**
   * Sort games by various criteria
   * @param {Array} games - Games to sort
   * @param {string} sortBy - Sorting criteria ('name', 'subject', 'difficulty', 'character', 'features')
   * @param {string} order - Sort order ('asc' or 'desc')
   * @returns {Array} Sorted games
   */
  static sortGames(games, sortBy = 'name', order = 'asc') {
    const sortedGames = [...games];
    
    sortedGames.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'subject':
        aValue = a.subject.toLowerCase();
        bValue = b.subject.toLowerCase();
        break;
      case 'character':
        aValue = (a.character || '').toLowerCase();
        bValue = (b.character || '').toLowerCase();
        break;
      case 'features':
        aValue = a.features ? a.features.length : 0;
        bValue = b.features ? b.features.length : 0;
        break;
      case 'difficulty': {
        const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
        aValue = a.difficulty ? Math.min(...a.difficulty.map(d => difficultyOrder[d] || 0)) : 0;
        bValue = b.difficulty ? Math.min(...b.difficulty.map(d => difficultyOrder[d] || 0)) : 0;
        break;
      }
      default:
        aValue = a[sortBy] || '';
        bValue = b[sortBy] || '';
      }
      
      if (order === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
      
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    });
    
    return sortedGames;
  }

  /**
   * Get games grouped by a specific field
   * @param {string} groupBy - Field to group by ('subject', 'character', 'template', 'difficulty')
   * @returns {Object} Games grouped by the specified field
   */
  static getGamesGrouped(groupBy) {
    const grouped = {};
    
    gameRegistry.forEach(game => {
      let groupKey;
      
      switch (groupBy) {
      case 'subject':
        groupKey = game.subject;
        break;
      case 'character':
        groupKey = game.character || 'Unknown';
        break;
      case 'template':
        groupKey = game.template || 'default';
        break;
      case 'difficulty':
        // Group by primary difficulty (first in array)
        groupKey = game.difficulty ? game.difficulty[0] : 'Unknown';
        break;
      case 'metadata.gameType':
        groupKey = game.metadata?.gameType || 'Unknown';
        break;
      case 'metadata.competencyLevel':
        groupKey = game.metadata?.competencyLevel || 'Unknown';
        break;
      case 'metadata.ageRange':
        groupKey = game.metadata?.ageRange || 'Unknown';
        break;
      default:
        // Handle nested properties with dot notation
        if (groupBy.includes('.')) {
          const keys = groupBy.split('.');
          let value = game;
          for (const key of keys) {
            value = value?.[key];
          }
          groupKey = value || 'Unknown';
        } else {
          groupKey = game[groupBy] || 'Unknown';
        }
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      
      grouped[groupKey].push(game);
    });
    
    return grouped;
  }

  /**
   * Get similar games based on a reference game
   * @param {string} gameId - Reference game ID
   * @param {number} limit - Maximum number of similar games to return
   * @returns {Array} Similar games
   */
  static getSimilarGames(gameId, limit = 5) {
    const referenceGame = this.getGameById(gameId);
    if (!referenceGame) return [];
    
    const similarGames = gameRegistry
      .filter(game => game.id !== gameId)
      .map(game => ({
        ...game,
        similarity: this.calculateSimilarity(referenceGame, game)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return similarGames.map(({ similarity: _similarity, ...game }) => game);
  }

  /**
   * Calculate similarity score between two games
   * @param {Object} game1 - First game
   * @param {Object} game2 - Second game
   * @returns {number} Similarity score (0-1)
   */
  static calculateSimilarity(game1, game2) {
    let score = 0;
    let maxScore = 0;
    
    // Subject similarity (high weight)
    maxScore += 3;
    if (game1.subject === game2.subject) score += 3;
    
    // Character similarity (medium weight)
    maxScore += 2;
    if (game1.character === game2.character) score += 2;
    
    // Template similarity (low weight)
    maxScore += 1;
    if (game1.template === game2.template) score += 1;
    
    // Feature similarity (medium weight)
    maxScore += 2;
    if (game1.features && game2.features) {
      const commonFeatures = game1.features.filter(f => game2.features.includes(f));
      const totalFeatures = new Set([...game1.features, ...game2.features]).size;
      score += (commonFeatures.length / totalFeatures) * 2;
    }
    
    // Difficulty similarity (low weight)
    maxScore += 1;
    if (game1.difficulty && game2.difficulty) {
      const commonDifficulties = game1.difficulty.filter(d => game2.difficulty.includes(d));
      if (commonDifficulties.length > 0) score += 1;
    }
    
    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Get games by metadata criteria
   * @param {Object} metadataCriteria - Metadata criteria to filter by
   * @returns {Array} Games matching the metadata criteria
   */
  static getGamesByMetadata(metadataCriteria) {
    return gameRegistry.filter(game => {
      if (!game.metadata) return false;
      
      return Object.keys(metadataCriteria).every(key => {
        const expectedValue = metadataCriteria[key];
        const actualValue = game.metadata[key];
        
        if (key === 'tags' && Array.isArray(expectedValue)) {
          return expectedValue.some(tag => 
            game.metadata.tags && game.metadata.tags.includes(tag)
          );
        }
        
        if (key === 'learningObjectives' && Array.isArray(expectedValue)) {
          return expectedValue.some(objective => 
            game.metadata.learningObjectives && game.metadata.learningObjectives.includes(objective)
          );
        }
        
        if (key === 'platforms' && Array.isArray(expectedValue)) {
          return expectedValue.some(platform => 
            game.metadata.platforms && game.metadata.platforms.includes(platform)
          );
        }
        
        if (key === 'ageRange') {
          return this.isAgeRangeMatch(actualValue, expectedValue);
        }
        
        if (key === 'estimatedPlayTime') {
          return this.isPlayTimeMatch(actualValue, expectedValue);
        }
        
        return actualValue === expectedValue;
      });
    });
  }

  /**
   * Check if age ranges match
   * @param {string} gameAgeRange - Game's age range (e.g., '6-12')
   * @param {string} targetAgeRange - Target age range
   * @returns {boolean} Whether age ranges overlap
   */
  static isAgeRangeMatch(gameAgeRange, targetAgeRange) {
    if (!gameAgeRange || !targetAgeRange) return false;
    
    const parseRange = (range) => {
      const [min, max] = range.split('-').map(Number);
      return { min, max: max || min };
    };
    
    const gameRange = parseRange(gameAgeRange);
    const targetRange = parseRange(targetAgeRange);
    
    return gameRange.min <= targetRange.max && gameRange.max >= targetRange.min;
  }

  /**
   * Check if play time matches criteria
   * @param {number} gamePlayTime - Game's estimated play time
   * @param {Object|number} criteria - Play time criteria
   * @returns {boolean} Whether play time matches
   */
  static isPlayTimeMatch(gamePlayTime, criteria) {
    if (!gamePlayTime) return false;
    
    if (typeof criteria === 'number') {
      return gamePlayTime === criteria;
    }
    
    if (typeof criteria === 'object') {
      const { min, max, exact } = criteria;
      
      if (exact !== undefined) {
        return gamePlayTime === exact;
      }
      
      if (min !== undefined && max !== undefined) {
        return gamePlayTime >= min && gamePlayTime <= max;
      }
      
      if (min !== undefined) {
        return gamePlayTime >= min;
      }
      
      if (max !== undefined) {
        return gamePlayTime <= max;
      }
    }
    
    return false;
  }

  /**
   * Get games by learning objectives
   * @param {Array|string} objectives - Learning objectives to filter by
   * @returns {Array} Games with matching learning objectives
   */
  static getGamesByLearningObjectives(objectives) {
    const targetObjectives = Array.isArray(objectives) ? objectives : [objectives];
    
    return gameRegistry.filter(game => {
      if (!game.metadata || !game.metadata.learningObjectives) return false;
      
      return targetObjectives.some(objective => 
        game.metadata.learningObjectives.includes(objective)
      );
    });
  }

  /**
   * Get games by tags
   * @param {Array|string} tags - Tags to filter by
   * @returns {Array} Games with matching tags
   */
  static getGamesByTags(tags) {
    const targetTags = Array.isArray(tags) ? tags : [tags];
    
    return gameRegistry.filter(game => {
      if (!game.metadata || !game.metadata.tags) return false;
      
      return targetTags.some(tag => 
        game.metadata.tags.includes(tag)
      );
    });
  }

  /**
   * Get games by age range
   * @param {string} ageRange - Age range (e.g., '8-10')
   * @returns {Array} Games suitable for the age range
   */
  static getGamesByAgeRange(ageRange) {
    return gameRegistry.filter(game => {
      if (!game.metadata || !game.metadata.ageRange) return false;
      
      return this.isAgeRangeMatch(game.metadata.ageRange, ageRange);
    });
  }

  /**
   * Get games by estimated play time
   * @param {Object|number} playTimeCriteria - Play time criteria
   * @returns {Array} Games matching the play time criteria
   */
  static getGamesByPlayTime(playTimeCriteria) {
    return gameRegistry.filter(game => {
      if (!game.metadata || !game.metadata.estimatedPlayTime) return false;
      
      return this.isPlayTimeMatch(game.metadata.estimatedPlayTime, playTimeCriteria);
    });
  }

  /**
   * Get game recommendations based on user preferences
   * @param {Object} preferences - User preferences
   * @param {number} limit - Maximum number of recommendations
   * @returns {Array} Recommended games
   */
  static getRecommendations(preferences, limit = 10) {
    const recommendations = gameRegistry.map(game => ({
      ...game,
      score: this.calculateRecommendationScore(game, preferences)
    }))
      .filter(game => game.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return recommendations.map(({ score: _score, ...game }) => game);
  }

  /**
   * Calculate recommendation score for a game based on preferences
   * @param {Object} game - Game to score
   * @param {Object} preferences - User preferences
   * @returns {number} Recommendation score
   */
  static calculateRecommendationScore(game, preferences) {
    let score = 0;
    
    // Subject preference (high weight)
    if (preferences.subjects && preferences.subjects.includes(game.subject)) {
      score += 5;
    }
    
    // Difficulty preference (medium weight)
    if (preferences.difficulty && game.difficulty && game.difficulty.includes(preferences.difficulty)) {
      score += 3;
    }
    
    // Age range preference (high weight)
    if (preferences.ageRange && game.metadata && game.metadata.ageRange) {
      if (this.isAgeRangeMatch(game.metadata.ageRange, preferences.ageRange)) {
        score += 4;
      }
    }
    
    // Play time preference (medium weight)
    if (preferences.playTime && game.metadata && game.metadata.estimatedPlayTime) {
      if (this.isPlayTimeMatch(game.metadata.estimatedPlayTime, preferences.playTime)) {
        score += 3;
      }
    }
    
    // Learning objectives preference (medium weight)
    if (preferences.learningObjectives && game.metadata && game.metadata.learningObjectives) {
      const matchingObjectives = preferences.learningObjectives.filter(obj => 
        game.metadata.learningObjectives.includes(obj)
      );
      score += matchingObjectives.length * 2;
    }
    
    // Platform preference (low weight)
    if (preferences.platform && game.metadata && game.metadata.platforms) {
      if (game.metadata.platforms.includes(preferences.platform)) {
        score += 1;
      }
    }
    
    // Feature preference (low weight)
    if (preferences.features && game.features) {
      const matchingFeatures = preferences.features.filter(feature => 
        game.features.includes(feature)
      );
      score += matchingFeatures.length * 0.5;
    }
    
    return score;
  }

  /**
   * Get unique values for a metadata field
   * @param {string} field - Metadata field name
   * @returns {Array} Unique values for the field
   */
  static getUniqueMetadataValues(field) {
    const values = new Set();
    
    gameRegistry.forEach(game => {
      if (game.metadata && game.metadata[field]) {
        const fieldValue = game.metadata[field];
        
        if (Array.isArray(fieldValue)) {
          fieldValue.forEach(value => values.add(value));
        } else {
          values.add(fieldValue);
        }
      }
    });
    
    return Array.from(values).sort();
  }

  /**
   * Get template usage statistics
   * @returns {Object} Template usage statistics
   */
  static getTemplateStats() {
    const templateStats = {};
    
    gameRegistry.forEach(game => {
      const template = game.template || 'default';
      templateStats[template] = (templateStats[template] || 0) + 1;
    });
    
    return templateStats;
  }

  /**
   * Export game registry data for external use
   * @param {string} format - Export format ('json', 'csv')
   * @returns {string} Exported data
   */
  static exportRegistry(format = 'json') {
    switch (format) {
    case 'json':
      return JSON.stringify(gameRegistry, null, 2);
      
    case 'csv': {
      const headers = ['id', 'name', 'subject', 'character', 'difficulty', 'features', 'template'];
      const rows = gameRegistry.map(game => [
        game.id,
        game.name,
        game.subject,
        game.character,
        game.difficulty ? game.difficulty.join(';') : '',
        game.features ? game.features.join(';') : '',
        game.template
      ]);
        
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Search games by name or description
   * @param {string} query - Search query
   * @returns {Array} Matching games
   */
  static searchGames(query) {
    const searchTerm = query.toLowerCase();
    
    return gameRegistry.filter(game =>
      game.name.toLowerCase().includes(searchTerm) ||
      game.description.toLowerCase().includes(searchTerm) ||
      game.subject.toLowerCase().includes(searchTerm) ||
      (game.character && game.character.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get games that need BaseGame conversion
   * @returns {Array} Games not using BaseGame architecture
   */
  static getGamesNeedingConversion() {
    // Games that don't have full feature support yet
    const fullFeatures = ['analytics', 'progress', 'mobile', 'themes'];
    
    return gameRegistry.filter(game =>
      !fullFeatures.every(feature => game.features.includes(feature))
    );
  }

  /**
   * Get unique subjects from all games
   * @returns {Array} Array of unique subjects
   */
  static getSubjects() {
    const subjects = gameRegistry.map(game => game.subject);
    return [...new Set(subjects)].sort();
  }

  /**
   * Get unique characters from all games
   * @returns {Array} Array of unique characters
   */
  static getCharacters() {
    const characters = gameRegistry
      .map(game => game.character)
      .filter(character => character);
    return [...new Set(characters)].sort();
  }

  /**
   * Get unique difficulties from all games
   * @returns {Array} Array of unique difficulty levels
   */
  static getDifficulties() {
    const difficulties = gameRegistry
      .flatMap(game => game.difficulty || []);
    return [...new Set(difficulties)].sort();
  }

  /**
   * Validate a game configuration
   * @param {Object} gameConfig - Game configuration to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateGameConfig(gameConfig) {
    const errors = [];
    
    // Required fields
    const required = ['id', 'name', 'gameClass', 'scriptPath'];
    for (const field of required) {
      if (!gameConfig[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // ID format validation
    if (gameConfig.id && !/^[a-z0-9-]+$/.test(gameConfig.id)) {
      errors.push('Game ID must be lowercase alphanumeric with hyphens only');
    }

    // Subject validation
    const validSubjects = ['math', 'science', 'reading', 'art', 'coding', 'general'];
    if (gameConfig.subject && !validSubjects.includes(gameConfig.subject)) {
      errors.push(`Invalid subject: ${gameConfig.subject}. Must be one of: ${validSubjects.join(', ')}`);
    }

    // Difficulty validation
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (gameConfig.difficulty) {
      const invalidDiffs = gameConfig.difficulty.filter(diff => 
        !validDifficulties.includes(diff)
      );
      if (invalidDiffs.length > 0) {
        errors.push(`Invalid difficulty levels: ${invalidDiffs.join(', ')}`);
      }
    }

    // Template validation
    const validTemplates = ['game', 'minimal', 'fullscreen', 'mobile', 'none'];
    if (gameConfig.template && !validTemplates.includes(gameConfig.template)) {
      errors.push(`Invalid template: ${gameConfig.template}. Must be one of: ${validTemplates.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get statistics about the game registry
   * @returns {Object} Registry statistics
   */
  static getStats() {
    const stats = {
      totalGames: gameRegistry.length,
      subjects: {},
      difficulties: {},
      features: {},
      characters: {},
      needingConversion: 0
    };

    // Count by categories
    gameRegistry.forEach(game => {
      // Subjects
      stats.subjects[game.subject] = (stats.subjects[game.subject] || 0) + 1;

      // Difficulties
      if (game.difficulty) {
        game.difficulty.forEach(diff => {
          stats.difficulties[diff] = (stats.difficulties[diff] || 0) + 1;
        });
      }

      // Features
      if (game.features) {
        game.features.forEach(feature => {
          stats.features[feature] = (stats.features[feature] || 0) + 1;
        });
      }

      // Characters
      if (game.character) {
        stats.characters[game.character] = (stats.characters[game.character] || 0) + 1;
      }

      // Check if needs conversion
      const fullFeatures = ['analytics', 'progress', 'mobile', 'themes'];
      if (!fullFeatures.every(feature => game.features.includes(feature))) {
        stats.needingConversion++;
      }
    });

    return stats;
  }
}

export default gameRegistry;