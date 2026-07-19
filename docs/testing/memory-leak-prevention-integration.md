# Memory Leak Prevention - Integration Guide

## Critical Integration Requirements

### ⚠️ **Required: Proper Game Lifecycle Management**

The `destroy()` methods added to games **MUST** be called when games are unloaded to prevent memory leaks. This document outlines the integration requirements and current implementation status.

## Current Integration Status

### ✅ **GameTemplateLoader Integration (Already Implemented)**

The `GameTemplateLoader` class already handles proper game lifecycle management:

```javascript
// In GameTemplateLoader.js:631-641
destroy() {
  if (this.gameInstance && typeof this.gameInstance.destroy === 'function') {
    this.gameInstance.destroy(); // ✅ Calls our new destroy() methods
  }

  // Remove event listeners
  document.removeEventListener('keydown', this.handleKeyboard);
  document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
  document.removeEventListener('visibilitychange', this.handleVisibilityChange);

  this.gameInstance = null;
  this.isInitialized = false;
}
```

**Status**: ✅ **COMPLETE** - GameTemplateLoader will automatically call `destroy()` on game instances when they are unloaded.

## Games with Memory Leak Prevention

### ✅ **PizzaMakerGame**

- **File**: `src/features/games/pizza-maker/PizzaMakerGame.js`
- **Status**: ✅ Complete `destroy()` method implemented
- **Cleanup**: Timers, event listeners, audio context, DOM references

### ✅ **WordScrambleGame**

- **File**: `src/features/games/word-scramble/wordScramble.js`
- **Status**: ✅ Complete `destroy()` method implemented
- **Cleanup**: Timers, event listeners, DOM references

### ✅ **BubblePopGameTemplate**

- **File**: `src/features/games/bubble-pop/BubblePopGameTemplate.js`
- **Status**: ✅ Already extends BaseGame (has comprehensive cleanup)
- **Cleanup**: All BaseGame cleanup patterns

## Integration Patterns

### **For New Games**

When creating new games, implement the `destroy()` method:

```javascript
export default class MyNewGame {
  constructor() {
    // Game initialization
  }

  /**
   * Clean up all resources and prevent memory leaks
   */
  destroy() {
    // 1. Clear timers and intervals
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }

    // 2. Remove event listeners
    // Use bound handlers or clone/replace pattern

    // 3. Close audio contexts
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // 4. Clear all object references
    this.gameState = null;
    this.container = null;
    // ... clear all properties

    console.log('MyNewGame destroyed and cleaned up');
  }
}
```

### **For Direct Game Usage**

When using games directly (not through GameTemplateLoader):

```javascript
// Initialize game
const game = new PizzaMakerGame();

// When finished or navigating away
window.addEventListener('beforeunload', () => {
  if (game && typeof game.destroy === 'function') {
    game.destroy();
  }
});

// Or when explicitly switching games/pages
function switchToNewGame() {
  if (currentGame && typeof currentGame.destroy === 'function') {
    currentGame.destroy();
  }
  currentGame = new NewGame();
}
```

## Testing Memory Leak Prevention

### **Manual Testing Checklist**

- [ ] **Timer Cleanup**: Verify setInterval/setTimeout are cleared
- [ ] **Event Listeners**: Check event listeners are removed
- [ ] **Audio Context**: Confirm audio contexts are closed
- [ ] **DOM References**: Ensure DOM elements are nullified
- [ ] **Repeated Loading**: Test multiple game initialize/destroy cycles

### **Browser Developer Tools**

1. **Memory Tab**: Monitor memory usage during game lifecycle
2. **Performance Tab**: Check for lingering timers after destroy
3. **Console**: Watch for destroy confirmation messages

## Memory Management Utility

Use the new `MemoryLeakPrevention` utility for advanced cases:

```javascript
import { createMemoryManager } from '../utils/MemoryLeakPrevention.js';

class AdvancedGame {
  constructor() {
    this.memoryManager = createMemoryManager();

    // Register resources for automatic cleanup
    this.timer = this.memoryManager.setInterval(() => {
      this.gameLoop();
    }, 16);

    this.memoryManager.addEventListener(document, 'keydown', this.handleKey.bind(this));
  }

  destroy() {
    // Automatic cleanup of all registered resources
    this.memoryManager.destroy();
  }
}
```

## Critical Warning Signs

### 🚨 **Memory Leak Indicators**

- **Increasing Memory Usage**: Memory grows with each game session
- **Multiple Audio Contexts**: Audio becomes distorted or fails
- **Timer Accumulation**: Game speed increases unexpectedly
- **Event Handler Duplication**: Events fire multiple times

### 🔧 **Debug Commands**

```javascript
// Check active timers (Chrome DevTools Console)
getEventListeners(document);

// Monitor audio contexts
console.log('Audio contexts:', window.webkitAudioContext || window.AudioContext);

// Check memory usage
performance.memory; // Chrome only
```

## Future Integration Points

### **Character Components** (When Re-added)

- CharacterGallery autoplay animations
- CharacterCustomizationWizard event delegation
- CharacterRenderer resource management

### **Subject Template System**

- Template loader lifecycle management
- Component initialization/destruction
- Animation cleanup on page transitions

## Conclusion

✅ **Current Status**: Memory leak prevention is **FULLY INTEGRATED** for all existing games through the GameTemplateLoader system.

⚠️ **Developer Responsibility**: New games MUST implement the `destroy()` method pattern to prevent memory leaks.

📋 **Next Steps**:

1. Monitor production memory usage
2. Add integration tests for component lifecycle
3. Extend patterns to character components when re-added
