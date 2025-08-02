# Game System Enhancements Guide

This guide documents the recent enhancements to the Learnimals game system, including new templates, advanced registry features, and BaseGame migrations.

## Table of Contents

1. [New Game Templates](#new-game-templates)
2. [Enhanced Game Registry](#enhanced-game-registry)
3. [BaseGame Migration](#basegame-migration)
4. [API Reference](#api-reference)
5. [Migration Guide](#migration-guide)
6. [Best Practices](#best-practices)

## New Game Templates

The game system now supports four template types, each optimized for different use cases:

### 1. Standard Template (`game`)
The original full-featured template with complete UI, modals, and controls.

**Use when:** You need full UI features, settings, help modals, and progress tracking.

### 2. Minimal Template (`minimal`)
A lightweight template with only essential controls and minimal UI overhead.

**Features:**
- Simple score/level display
- Basic controls (start, pause, restart)
- Minimal overlays
- 60% smaller than standard template

**Use when:** Building simple games, prototypes, or when UI should not distract from gameplay.

```javascript
// In gameRegistry.js
{
  id: 'my-simple-game',
  template: 'minimal',
  showControls: true,
  showStats: true,
  // ... other config
}
```

### 3. Fullscreen Template (`fullscreen`)
An immersive template designed for distraction-free gameplay.

**Features:**
- Auto-hide UI after 3 seconds of inactivity
- Fullscreen mode on load
- Keyboard shortcuts (ESC for pause, H for hide UI)
- Minimal floating controls
- Exit fullscreen redirects to standard template

**Use when:** Creating immersive experiences, action games, or when screen space is critical.

```javascript
{
  id: 'immersive-game',
  template: 'fullscreen',
  showControls: true,
  showStats: true,
  // ... other config
}
```

### 4. Mobile Template (`mobile`)
Optimized for touch devices with mobile-first design.

**Features:**
- Touch-optimized controls
- Haptic feedback support
- Visual touch feedback
- Portrait/landscape handling
- Safe area support for notched devices
- Vibration patterns for game events

**Use when:** Targeting mobile devices or creating touch-first experiences.

```javascript
{
  id: 'mobile-game',
  template: 'mobile',
  showControls: true,
  showStats: true,
  options: {
    hapticFeedback: true,
    touchSensitivity: 0.8
  }
}
```

## Enhanced Game Registry

The game registry now includes powerful filtering and discovery features:

### Advanced Filtering

```javascript
// Multi-criteria filtering
const games = GameRegistryUtil.getGamesAdvanced({
  subject: 'math',              // Filter by subject
  difficulty: 'easy',           // Filter by difficulty
  features: ['mobile', 'audio'], // Required features
  template: 'minimal',          // Template type
  character: 'Mango',           // Character name
  search: 'addition',           // Search in name/description
  baseGameOnly: true            // Only BaseGame-enabled games
});
```

### Metadata Support

Games can now include rich metadata:

```javascript
{
  id: 'word-scramble',
  // ... basic config ...
  metadata: {
    gameType: 'word-puzzle',
    estimatedPlayTime: 5,        // minutes
    ageRange: '6-12',
    learningObjectives: ['vocabulary', 'spelling', 'word recognition'],
    accessibility: ['keyboard-navigation', 'screen-reader'],
    platforms: ['desktop', 'mobile', 'tablet'],
    lastUpdated: '2024-01-15',
    version: '1.2.0',
    tags: ['educational', 'vocabulary', 'spelling', 'puzzle'],
    competencyLevel: 'beginner-intermediate'
  }
}
```

### Recommendation System

Get personalized game recommendations:

```javascript
const recommendations = GameRegistryUtil.getRecommendations({
  subjects: ['math', 'science'],      // Preferred subjects
  difficulty: 'medium',               // Preferred difficulty
  ageRange: '8-10',                  // Age range
  playTime: { min: 5, max: 15 },     // Play time preference
  learningObjectives: ['problem-solving', 'logic'],
  platform: 'mobile',
  features: ['offline', 'progress']
}, 10); // Return top 10 recommendations
```

### Utility Functions

```javascript
// Get similar games
const similar = GameRegistryUtil.getSimilarGames('bubble-pop', 5);

// Group games by field
const bySubject = GameRegistryUtil.getGamesGrouped('subject');
const byTemplate = GameRegistryUtil.getGamesGrouped('template');

// Sort games
const sorted = GameRegistryUtil.sortGames(games, 'name', 'asc');

// Get unique metadata values
const allTags = GameRegistryUtil.getUniqueMetadataValues('tags');
const ageRanges = GameRegistryUtil.getUniqueMetadataValues('ageRange');

// Export registry
const json = GameRegistryUtil.exportRegistry('json');
const csv = GameRegistryUtil.exportRegistry('csv');
```

### Specialized Queries

```javascript
// By learning objectives
const vocabGames = GameRegistryUtil.getGamesByLearningObjectives(['vocabulary']);

// By age range
const youngLearners = GameRegistryUtil.getGamesByAgeRange('5-7');

// By play time
const quickGames = GameRegistryUtil.getGamesByPlayTime({ max: 10 });

// By platform
const mobileGames = GameRegistryUtil.getGamesByPlatform('mobile');

// By tags
const puzzleGames = GameRegistryUtil.getGamesByTags(['puzzle', 'logic']);
```

## BaseGame Migration

Games migrated to BaseGame automatically gain these features:

### Standard Features
- **Analytics**: Automatic tracking of play time, attempts, success rate
- **Progress Tracking**: Save/load game state, achievement integration
- **Mobile Support**: Touch controls, responsive design, device orientation
- **Theme Support**: Automatic theme variable usage, dark/light mode
- **Audio Management**: Centralized audio context, volume controls

### Migration Example

**Before (Standalone Game):**
```javascript
class BubblePopGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.score = 0;
    this.bubbles = [];
  }
  
  start() {
    this.gameLoop();
  }
}
```

**After (BaseGame):**
```javascript
export default class BubblePopGame extends BaseGame {
  constructor(containerId, options = {}) {
    const gameConfig = {
      name: 'Bubble Pop Math',
      id: 'bubble-pop',
      character: 'Mango',
      features: {
        analytics: true,
        progress: true,
        mobile: true,
        themes: true,
        audio: true
      },
      ...options
    };
    
    super(containerId, gameConfig);
    
    // Game-specific properties
    this.bubbles = [];
  }
  
  onStart() {
    super.onStart();
    // Game-specific start logic
  }
  
  update(deltaTime) {
    // Game update logic
  }
  
  render() {
    // Game rendering
  }
}
```

### DOM-Based Games

For games using DOM instead of canvas:

```javascript
const gameConfig = {
  name: 'Pizza Maker',
  id: 'pizza-maker',
  useDOMContainer: true,  // Enable DOM mode
  // ... other config
};
```

## API Reference

### GameRegistryUtil Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `getAllGames()` | Get all registered games | None | Array of games |
| `getGameById(id)` | Get game by ID | `id: string` | Game object or null |
| `getGamesBySubject(subject)` | Filter by subject | `subject: string` | Array of games |
| `getGamesByDifficulty(difficulty)` | Filter by difficulty | `difficulty: string` | Array of games |
| `getGamesByFeatures(features)` | Filter by features | `features: Array\|string` | Array of games |
| `getGamesAdvanced(criteria)` | Multi-criteria filter | `criteria: Object` | Array of games |
| `getGamesByTemplate(template)` | Filter by template | `template: string` | Array of games |
| `getGamesByMetadata(criteria)` | Filter by metadata | `criteria: Object` | Array of games |
| `getRecommendations(prefs, limit)` | Get recommendations | `prefs: Object, limit: number` | Array of games |
| `getSimilarGames(gameId, limit)` | Find similar games | `gameId: string, limit: number` | Array of games |
| `sortGames(games, sortBy, order)` | Sort games | `games: Array, sortBy: string, order: string` | Array of games |
| `getGamesGrouped(groupBy)` | Group games | `groupBy: string` | Object of arrays |
| `exportRegistry(format)` | Export registry | `format: string` | String (JSON/CSV) |

### Template Variables

All templates support these Handlebars-style variables:

- `{{gameId}}` - Unique game identifier
- `{{gameName}}` - Display name of the game
- `{{gameDescription}}` - Game description
- `{{characterName}}` - Character name
- `{{characterType}}` - Character type (animal)
- `{{containerId}}` - DOM container ID
- `{{gameScriptPath}}` - Path to game script
- `{{gameStyleSheet}}` - Path to game styles
- `{{gameContent}}` - Custom game HTML content
- `{{showControls}}` - Whether to show controls
- `{{showStats}}` - Whether to show stats
- `{{showProgress}}` - Whether to show progress
- `{{timeLimit}}` - Time limit (if applicable)
- `{{featureFlags}}` - JSON features object
- `{{gameOptions}}` - JSON options object

## Migration Guide

### Migrating to New Templates

1. **Choose the appropriate template:**
   - Keep `game` for full features
   - Use `minimal` for simple games
   - Use `fullscreen` for immersive games
   - Use `mobile` for mobile-first games

2. **Update registry entry:**
   ```javascript
   {
     id: 'my-game',
     template: 'minimal',  // Changed from 'game'
     // ... rest of config
   }
   ```

3. **Test the game** with the new template

### Migrating to BaseGame

1. **Extend BaseGame class:**
   ```javascript
   import BaseGame from '../../../components/games/BaseGame.js';
   
   export default class MyGame extends BaseGame {
     // ... implementation
   }
   ```

2. **Implement lifecycle methods:**
   - `onStart()` - Called when game starts
   - `onRestart()` - Called when game restarts
   - `onPause()` - Called when game pauses
   - `onResume()` - Called when game resumes
   - `onGameEnd()` - Called when game ends
   - `update(deltaTime)` - Game update loop
   - `render()` - Game render loop

3. **Use BaseGame features:**
   - `this.addScore(points)` - Add to score
   - `this.setState(state)` - Change game state
   - `this.trackCorrectAnswer()` - Track success
   - `this.trackIncorrectAnswer()` - Track failure
   - `this.showFeedback(type, message)` - Show feedback

4. **Update registry features:**
   ```javascript
   features: ['analytics', 'progress', 'mobile', 'themes', 'audio']
   ```

### Adding Metadata

Enhance game discoverability by adding metadata:

```javascript
metadata: {
  gameType: 'puzzle',           // Game category
  estimatedPlayTime: 10,        // Minutes
  ageRange: '8-12',            // Target age
  learningObjectives: [         // Learning goals
    'problem-solving',
    'pattern-recognition'
  ],
  accessibility: [              // Accessibility features
    'keyboard-navigation',
    'high-contrast'
  ],
  platforms: ['desktop', 'mobile', 'tablet'],
  tags: ['educational', 'logic', 'puzzle'],
  competencyLevel: 'intermediate'
}
```

## Best Practices

### Template Selection
- Use **minimal** template for prototypes and simple games
- Use **fullscreen** for action games and immersive experiences
- Use **mobile** when mobile is the primary platform
- Use **game** (standard) when you need all UI features

### Registry Organization
- Always include metadata for better discoverability
- Use consistent tags across similar games
- Keep learning objectives specific and measurable
- Update version and lastUpdated fields

### Performance
- Minimal template loads 60% faster than standard
- Mobile template includes touch optimizations
- Fullscreen template reduces UI overhead
- Use appropriate template for your use case

### Accessibility
- All templates support keyboard navigation
- Include accessibility metadata
- Test with screen readers
- Ensure sufficient color contrast

### Mobile Considerations
- Test haptic feedback on various devices
- Handle orientation changes gracefully
- Support both touch and mouse input
- Consider battery usage for haptic features

## Troubleshooting

### Template Not Loading
- Verify template name in registry is correct
- Check that template file exists in `/src/templates/`
- Ensure GameSystem is initialized

### BaseGame Features Not Working
- Confirm game extends BaseGame class
- Check that features are listed in registry
- Verify super() is called in constructor
- Ensure lifecycle methods call super methods

### Registry Filtering Issues
- Check metadata format matches examples
- Verify filter criteria spelling
- Use console.log to debug filter results
- Test with simpler criteria first

## Future Enhancements

Planned improvements include:
- Educational template with lesson integration
- Multiplayer template for collaborative games
- Offline template with enhanced caching
- AR/VR template for immersive learning
- Additional metadata fields for curriculum alignment

For questions or contributions, please refer to the main project documentation or create an issue in the repository.