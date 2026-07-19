# GameSystem Developer Guide

This guide explains how to use the new GameSystem to create consistent, maintainable games for Learnimals.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Core Components](#core-components)
- [Creating a New Game](#creating-a-new-game)
- [Using Templates](#using-templates)
- [Game Registry](#game-registry)
- [Migration Guide](#migration-guide)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)

## Overview

The GameSystem provides:

- 🎮 **Centralized game management** with registration and lifecycle control
- 📄 **Template-based page generation** for consistent UI across all games
- 🔧 **BaseGame integration** for analytics, progress tracking, and mobile support
- 📦 **Configuration-driven approach** for easy game addition and maintenance

## Quick Start

### Loading a Game

```javascript
import gameSystem from '/src/utils/GameSystem.js';

// Initialize the system (only needed once)
await gameSystem.init();

// Load a game
const gameInstance = await gameSystem.loadGame(
  'word-scramble', // Game ID from registry
  'game-container', // Container element ID
  {
    difficulty: 'medium',
    template: 'game', // Use full game template
  }
);
```

### Available Games

All games are registered in `/src/config/gameRegistry.js`:

- `word-scramble` - Word unscrambling game (Reading)
- `bubble-pop` - Math bubble popping game
- `pizza-maker` - Pizza making game
- `element-match` - Science element matching
- `memory-cards` - Memory pattern game
- `number-bonds` - Math number relationships
- `pattern-blocks` - Geometry patterns
- `story-builder` - Creative writing

## Core Components

### 1. GameSystem Manager

Central orchestrator for all games:

```javascript
// Get available games
const mathGames = gameSystem.getAvailableGames({ subject: 'math' });

// Check if game is active
if (gameSystem.isGameActive('word-scramble')) {
  // Game is currently running
}

// Destroy a game
await gameSystem.destroyGame('word-scramble');

// Listen to system events
gameSystem.on('gameComplete', data => {
  console.log(`Game ${data.gameId} completed with score ${data.score}`);
});
```

### 2. Game Templates

Three built-in templates:

#### Full Game Template (`game`)

- Complete UI with header, controls, progress bar
- Settings and help modals
- Keyboard shortcuts
- Mobile-responsive design

#### Minimal Template (`minimal`)

- Basic wrapper for simple games
- No extra UI elements
- Lightweight and fast

#### Fullscreen Template (`fullscreen`)

- Maximizes game area
- Ideal for immersive experiences
- No distracting UI elements

### 3. BaseGame Integration

All games should extend BaseGame for full feature support:

```javascript
import BaseGame from '/src/components/games/BaseGame.js';

class MyNewGame extends BaseGame {
  constructor(containerId, options = {}) {
    super(containerId, {
      useDOMContainer: true,
      gameType: 'my-game',
      subject: 'math',
      difficulty: options.difficulty || 'easy',
      ...options,
    });
  }

  // Template integration for GameSystem
  setupTemplateIntegration() {
    // Connect to template UI elements
    this.templateElements = {
      score: document.getElementById('header-score'),
      level: document.getElementById('header-level'),
      timer: document.getElementById('header-timer'),
      progressBar: document.getElementById('progress-fill'),
    };

    // Listen to GameSystem events
    if (window.gameSystem) {
      window.gameSystem.on('gameStart', this.handleGameStart.bind(this));
      window.gameSystem.on('gamePause', this.handleGamePause.bind(this));
    }
  }

  // Update template UI
  updateTemplateUI() {
    if (!this.templateElements) return;

    if (this.templateElements.score) {
      this.templateElements.score.textContent = this.score;
    }
    // Update other UI elements...
  }
}
```

## Creating a New Game

### Step 1: Create Game Class

Create your game file in `/src/features/games/[game-name]/[gameName].js`:

```javascript
import BaseGame from '../../../components/games/BaseGame.js';

export default class MyNewGame extends BaseGame {
  constructor(containerId, options = {}) {
    super(containerId, {
      useDOMContainer: true,
      gameType: 'my-new-game',
      subject: 'math',
      difficulty: options.difficulty || 'easy',
      enableProgressTracking: true,
      ...options,
    });

    // Game-specific properties
    this.maxScore = 100;
    this.timeLimit = 60;
  }

  // Required: Set up DOM structure
  setupDOMContainer() {
    super.setupDOMContainer();
    this.createGameUI();
  }

  // Required: Game initialization
  onInitialized() {
    super.onInitialized();
    console.log('My game initialized!');
  }

  // Required: Start game logic
  onStart() {
    super.onStart();
    this.startGameplay();
  }

  // Required: Template integration
  setupTemplateIntegration() {
    // Connect to GameSystem template
  }

  createGameUI() {
    this.container.innerHTML = `
      <div class="my-game-container">
        <h2>My New Game</h2>
        <div class="game-area">
          <!-- Your game UI here -->
        </div>
      </div>
    `;
  }

  startGameplay() {
    // Your game logic here
  }
}
```

### Step 2: Add to Game Registry

Add your game to `/src/config/gameRegistry.js`:

```javascript
{
  id: 'my-new-game',
  name: 'My New Game',
  description: 'An exciting new educational game!',
  gameClass: 'MyNewGame',
  scriptPath: '/src/features/games/my-new-game/myNewGame.js',
  styleSheet: '/src/features/games/my-new-game/myNewGame.css',

  // Metadata
  subject: 'math',
  character: 'Benny',
  characterType: 'Bear',

  // Game configuration
  difficulty: ['easy', 'medium', 'hard'],
  features: ['analytics', 'progress', 'mobile', 'themes'],
  template: 'game',

  // UI options
  showControls: true,
  showProgress: true,
  showStats: true,

  // Game-specific options
  options: {
    maxScore: 100,
    timeLimit: 60,
    enableHints: true
  },

  // Template content (optional)
  templateContent: `
    <div class="my-game-container">
      <div id="game-board"></div>
    </div>
  `
}
```

### Step 3: Create Styles

Create `/src/features/games/my-new-game/myNewGame.css`:

```css
.my-game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.game-area {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Use theme variables for consistency */
.my-game-text {
  color: var(--text-primary);
  font-size: 1.2rem;
}
```

### Step 4: Test Your Game

Create a test page or use the demo:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My New Game - Test</title>
    <link rel="stylesheet" href="/src/styles/base/styles.css" />
  </head>
  <body>
    <div id="game-container"></div>

    <script type="module">
      import gameSystem from '/src/utils/GameSystem.js';

      async function loadGame() {
        await gameSystem.init();
        await gameSystem.loadGame('my-new-game', 'game-container');
      }

      loadGame();
    </script>
  </body>
</html>
```

## Using Templates

### Choosing a Template

```javascript
// Full game template (default)
gameSystem.loadGame('my-game', 'container', {
  template: 'game',
});

// Minimal template
gameSystem.loadGame('my-game', 'container', {
  template: 'minimal',
});

// No template (direct rendering)
gameSystem.loadGame('my-game', 'container', {
  template: 'none',
});
```

### Custom Templates

Register your own template:

```javascript
gameSystem.templateEngine.registerTemplate('custom', {
  path: '/src/templates/custom-game.html',
});

// Or inline template
gameSystem.templateEngine.registerTemplate('custom', {
  content: '<div>{{gameName}}</div>',
});
```

### Template Variables

Available variables in templates:

- `{{gameId}}` - Unique game identifier
- `{{gameName}}` - Display name
- `{{gameDescription}}` - Game description
- `{{characterName}}` - Character name (e.g., "Ruby")
- `{{characterType}}` - Character type (e.g., "Rabbit")
- `{{gameScriptPath}}` - Path to game JavaScript
- `{{gameStyleSheet}}` - Path to game CSS
- `{{gameContent}}` - Game-specific HTML content
- `{{gameOptions}}` - JSON stringified options
- `{{showControls}}` - Whether to show control buttons
- `{{showProgress}}` - Whether to show progress bar
- `{{showStats}}` - Whether to show game stats

## Game Registry

### Filtering Games

```javascript
// By subject
const mathGames = GameRegistryUtil.getGamesBySubject('math');

// By difficulty
const easyGames = GameRegistryUtil.getGamesByDifficulty('easy');

// By features
const mobileGames = GameRegistryUtil.getGamesByFeatures(['mobile', 'themes']);

// Search games
const results = GameRegistryUtil.searchGames('scramble');
```

### Registry Statistics

```javascript
const stats = GameRegistryUtil.getStats();
console.log(stats);
// {
//   totalGames: 8,
//   subjects: { math: 3, reading: 2, ... },
//   needingConversion: 5
// }
```

## Migration Guide

### Converting Existing Games to BaseGame

For games like BubblePopGame that don't extend BaseGame:

1. **Extend BaseGame**:

```javascript
// Before
class BubblePopGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    // ...
  }
}

// After
import BaseGame from '../../../components/games/BaseGame.js';

class BubblePopGame extends BaseGame {
  constructor(containerId, options = {}) {
    super(containerId, {
      useDOMContainer: false, // Using canvas
      gameType: 'bubble-pop',
      subject: 'math',
      ...options,
    });
    // ...
  }
}
```

2. **Add Required Methods**:

```javascript
onInitialized() {
  super.onInitialized();
  // Your init code
}

onStart() {
  super.onStart();
  // Your start code
}

setupTemplateIntegration() {
  // Connect to template UI
}
```

3. **Update Registry Entry**:

```javascript
{
  id: 'bubble-pop',
  // ...
  features: ['analytics', 'progress', 'mobile', 'themes'], // Add all features
  template: 'game' // Use full template
}
```

## API Reference

### GameSystem Methods

```javascript
// Core methods
gameSystem.init(); // Initialize system
gameSystem.registerGame(config); // Register new game
gameSystem.loadGame(gameId, containerId, options); // Load and start game
gameSystem.destroyGame(gameId); // Clean up game
gameSystem.getAvailableGames(filters); // Query games
gameSystem.getGameInfo(gameId); // Get game config
gameSystem.isGameActive(gameId); // Check if running
gameSystem.getActiveGames(); // List active games
gameSystem.getStats(); // System statistics

// Event methods
gameSystem.on(event, handler); // Add listener
gameSystem.off(event, handler); // Remove listener
gameSystem.emit(event, data); // Trigger event
```

### GameSystem Events

- `systemInitialized` - System ready
- `gameRegistered` - New game registered
- `gameLoaded` - Game loaded successfully
- `gameError` - Game encountered error
- `gameDestroyed` - Game cleaned up
- `gameComplete` - Game finished
- `gameStart` - Game started
- `gamePause` - Game paused
- `gameResume` - Game resumed
- `gameRestart` - Game restarted

### Template Engine Methods

```javascript
templateEngine.registerTemplate(name, definition);
templateEngine.getTemplate(name);
templateEngine.renderGamePage(gameConfig, containerId);
templateEngine.processTemplate(template, variables);
templateEngine.clearCache();
```

## Best Practices

### 1. Always Extend BaseGame

- Provides analytics, progress tracking, mobile optimization
- Consistent lifecycle management
- Built-in error handling

### 2. Use Theme Variables

```css
/* Good */
color: var(--text-primary);
background: var(--bg-card);

/* Avoid */
color: #333;
background: white;
```

### 3. Implement Template Integration

- Connect to template UI elements
- Listen to GameSystem events
- Update UI through `updateTemplateUI()`

### 4. Handle Cleanup Properly

```javascript
onDestroy() {
  // Remove event listeners
  // Clear timers
  // Clean up resources
  super.onDestroy();
}
```

### 5. Use Configuration Over Code

- Define game behavior in registry
- Use options for customization
- Keep game classes focused on gameplay

### 6. Test Across Templates

- Test with `game`, `minimal`, and `none` templates
- Ensure mobile responsiveness
- Verify theme compatibility

### 7. Progressive Enhancement

```javascript
// Check for template elements before using
if (this.templateElements?.score) {
  this.templateElements.score.textContent = this.score;
}
```

## Example: Complete Game Implementation

See `/src/features/games/word-scramble/wordScramble.js` for a complete example of:

- BaseGame extension
- Template integration
- Mobile optimization
- Progress tracking
- Theme support

## Troubleshooting

### Game Won't Load

1. Check browser console for errors
2. Verify game is registered in `gameRegistry.js`
3. Ensure script path is correct
4. Check that game class is exported as default

### Template Not Rendering

1. Verify template name in registry
2. Check that container element exists
3. Look for template syntax errors
4. Ensure GameSystem is initialized

### Events Not Working

1. Verify event names match exactly
2. Check that handlers are bound correctly
3. Ensure GameSystem is available globally
4. Use arrow functions or bind `this` context

### Performance Issues

1. Use `requestAnimationFrame` for animations
2. Implement object pooling for frequently created objects
3. Optimize canvas rendering
4. Use CSS transforms instead of position changes

## Support

For questions or issues:

1. Check existing games for examples
2. Review test files for usage patterns
3. Consult BaseGame documentation
4. Check browser compatibility

---

Happy game development! 🎮✨
