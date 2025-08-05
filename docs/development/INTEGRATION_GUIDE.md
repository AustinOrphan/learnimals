# Integration Guide: Adding New Games to Learnimals

## Overview

This guide provides step-by-step instructions for integrating new educational games into the Learnimals platform, following the patterns established by Adventure Quest.

## Prerequisites

- Understanding of ES6 JavaScript modules
- Familiarity with HTML5 Canvas API
- Knowledge of Learnimals theming system
- Basic understanding of educational game design principles

---

## Quick Start Checklist

### ✅ Planning Phase
- [ ] Define educational objectives and target age group
- [ ] Design game mechanics and user interactions
- [ ] Plan character and narrative elements
- [ ] Map content to educational standards
- [ ] Create wireframes and user flow diagrams

### ✅ Development Phase
- [ ] Set up game directory structure
- [ ] Create main game engine class
- [ ] Implement core game systems
- [ ] Integrate with Learnimals theming
- [ ] Add to subject page navigation
- [ ] Create configuration entries

### ✅ Testing Phase
- [ ] Unit test individual systems
- [ ] Integration test with Learnimals platform
- [ ] Cross-browser compatibility testing
- [ ] Educational effectiveness validation
- [ ] Accessibility compliance verification

---

## Step 1: Project Structure Setup

### Directory Organization

Create your game following this structure:

```
src/features/games/[your-game-name]/
├── [YourGame]Game.js          # Main game engine
├── [YourGame]Story.js         # Narrative system (optional)
├── [YourGame]Challenge.js     # Challenge system (optional)
├── [YourGame]Progress.js      # Progress tracking (optional)
├── [your-game-name].css       # Game-specific styles
├── index.html                 # Game page template
├── assets/                    # Game-specific assets
│   ├── images/
│   ├── sounds/
│   └── data/
└── README.md                  # Game documentation
```

### File Naming Conventions

- **Classes**: PascalCase (e.g., `MathQuestGame`)
- **Files**: kebab-case (e.g., `math-quest.css`)
- **Directories**: kebab-case (e.g., `math-quest/`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `GAME_STATES`)

---

## Step 2: Core Game Engine Implementation

### Base Game Class Structure

```javascript
// src/features/games/math-quest/MathQuestGame.js
import config from '../../../config.js';
import { getRandomInt, debounce } from '../../../utils/common.js';

export default class MathQuestGame {
  constructor(canvasId, options = {}) {
    // Initialize canvas and context
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    
    // Game configuration
    this.config = {
      ...config.mathQuest,  // Add your config to config.js
      ...options
    };
    
    // Game state
    this.gameState = {
      isPlaying: false,
      isPaused: false,
      currentScene: 'intro',
      score: 0
    };
    
    // Theme integration
    this.themeColors = this.initializeThemeColors();
    
    // Initialize systems
    this.setupCanvas();
    this.setupEventListeners();
    this.setupThemeListener();
  }
  
  // Required methods - implement these
  initializeThemeColors() { /* Theme integration */ }
  setupCanvas() { /* Canvas setup */ }
  setupEventListeners() { /* Event handling */ }
  setupThemeListener() { /* Theme change detection */ }
  startGame() { /* Game initialization */ }
  render() { /* Main rendering loop */ }
  update(deltaTime) { /* Game state updates */ }
  destroy() { /* Cleanup */ }
}
```

### Required Integration Methods

#### Theme Integration
```javascript
initializeThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    primary: style.getPropertyValue('--accent-primary').trim() || '#4a90e2',
    secondary: style.getPropertyValue('--accent-secondary').trim() || '#7ed321',
    background: style.getPropertyValue('--bg-primary').trim() || '#ffffff',
    surface: style.getPropertyValue('--bg-card').trim() || '#f8f9fa',
    text: style.getPropertyValue('--text-primary').trim() || '#333333'
  };
}

setupThemeListener() {
  const observer = new MutationObserver(() => {
    this.themeColors = this.initializeThemeColors();
    this.render(); // Re-render with new colors
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class']
  });
}
```

#### Canvas Management
```javascript
setupCanvas() {
  this.resizeCanvas();
  this.canvas.style.border = '2px solid ' + this.themeColors.primary;
  this.canvas.style.borderRadius = '8px';
  this.canvas.style.background = this.themeColors.background;
}

resizeCanvas() {
  const container = this.canvas.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight || 600;
  
  // Maintain aspect ratio (16:9 recommended)
  const aspectRatio = 16 / 9;
  let canvasWidth = containerWidth;
  let canvasHeight = containerWidth / aspectRatio;
  
  if (canvasHeight > containerHeight) {
    canvasHeight = containerHeight;
    canvasWidth = containerHeight * aspectRatio;
  }
  
  this.canvas.width = canvasWidth;
  this.canvas.height = canvasHeight;
}
```

---

## Step 3: Configuration Integration

### Add to config.js

```javascript
// src/config.js
export default {
  // ... existing config
  
  mathQuest: {
    canvas: {
      defaultWidth: 1280,
      defaultHeight: 720,
      aspectRatio: 16/9
    },
    gameplay: {
      difficulty: 'medium',
      timeLimit: 60000,  // 60 seconds
      maxQuestions: 10
    },
    scoring: {
      basePoints: 10,
      difficultyMultiplier: 1.5,
      speedBonus: 5
    },
    character: {
      name: 'Maxwell the Monkey',
      animations: ['idle', 'excited', 'thinking', 'celebrating']
    }
  }
};
```

---

## Step 4: Subject Page Integration

### Add Game Section to Subject Page

```html
<!-- src/features/subjects/shared/math.html -->
<section class="section-box" id="math-quest-section">
    <h2>🧮 Maxwell's Math Adventure - Math Quest</h2>
    <p class="game-description">
        Join Maxwell the Monkey on an exciting mathematical journey! 
        Solve puzzles, explore number patterns, and master arithmetic 
        through engaging challenges and adventures.
    </p>
    
    <div class="game-preview">
        <div class="game-info">
            <h3>🐵 Interactive Math Learning</h3>
            <ul>
                <li>🔢 Number sense and arithmetic operations</li>
                <li>📊 Pattern recognition and algebra basics</li>
                <li>📐 Geometry and spatial reasoning</li>
                <li>🎯 Adaptive difficulty matching skill level</li>
                <li>🏆 Achievement system with progress tracking</li>
                <li>🎮 Story-driven mathematical adventures</li>
            </ul>
        </div>
        
        <div class="game-features">
            <h4>Game Features:</h4>
            <div class="feature-grid">
                <div class="feature-item">
                    <span class="feature-icon">🎯</span>
                    <span class="feature-name">Problem Solving</span>
                    <span class="feature-desc">Step-by-step math challenges</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🧠</span>
                    <span class="feature-name">Critical Thinking</span>
                    <span class="feature-desc">Logic puzzles and reasoning</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">📈</span>
                    <span class="feature-name">Progress Tracking</span>
                    <span class="feature-desc">Monitor learning advancement</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🎉</span>
                    <span class="feature-name">Celebration</span>
                    <span class="feature-desc">Reward system for achievements</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="game-launch">
        <button id="math-quest-btn" class="game-button primary">
            🚀 Start Math Quest
        </button>
        <p class="game-note">
            <em>Suitable for grades 3-6 • Progress automatically saved • Adaptive difficulty</em>
        </p>
    </div>
</section>
```

### JavaScript Integration

```javascript
// src/features/subjects/math/math.js

/**
 * Launch the Math Quest game
 */
function launchMathQuest() {
  window.location.href = '/src/features/games/math-quest/index.html';
}

/**
 * Initialize the math page functionality
 */
function initMathPage() {
  // ... existing initialization
  
  // Math Quest game button
  const mathQuestBtn = document.getElementById('math-quest-btn');
  if (mathQuestBtn) {
    mathQuestBtn.addEventListener('click', launchMathQuest);
    console.log('Math Quest button initialized');
  }
}

document.addEventListener('DOMContentLoaded', initMathPage);
```

---

## Step 5: Game Page Template

### HTML Template

```html
<!-- src/features/games/math-quest/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Math Quest - Maxwell's Mathematical Adventure</title>
    
    <!-- Learnimals core styles -->
    <link rel="stylesheet" href="/src/styles/base/styles.css" />
    <link rel="stylesheet" href="/src/styles/components/components.css" />
    
    <!-- Game-specific styles -->
    <link rel="stylesheet" href="./math-quest.css" />
    
    <link rel="icon" href="/public/images/favicon.ico" type="image/x-icon" />
</head>
<body>
    <!-- Navigation back to subject page -->
    <nav class="game-nav">
        <a href="/src/features/subjects/shared/math.html" class="back-link">
            ← Back to Math
        </a>
    </nav>

    <main class="game-container">
        <header class="game-header">
            <h1>🧮 Maxwell's Math Adventure</h1>
            <div class="game-stats">
                <span id="score-display">Score: 0</span>
                <span id="level-display">Level: 1</span>
            </div>
        </header>

        <div class="game-area">
            <canvas id="mathQuestCanvas" width="1280" height="720">
                Your browser doesn't support HTML5 Canvas. Please update to a modern browser.
            </canvas>
        </div>

        <div class="game-controls">
            <button id="pause-btn">⏸️ Pause</button>
            <button id="help-btn">❓ Help</button>
            <button id="settings-btn">⚙️ Settings</button>
        </div>
    </main>

    <!-- Game engine -->
    <script type="module">
        import MathQuestGame from './MathQuestGame.js';
        
        // Initialize game when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            try {
                const game = new MathQuestGame('mathQuestCanvas', {
                    playerName: 'Student',
                    difficulty: 'medium'
                });
                
                // Make game globally accessible for debugging
                window.mathQuestGame = game;
                
                console.log('Math Quest game initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Math Quest:', error);
                document.querySelector('.game-area').innerHTML = 
                    '<p class="error">Failed to load game. Please refresh the page.</p>';
            }
        });
    </script>
</body>
</html>
```

---

## Step 6: Educational Content Integration

### Content Structure Pattern

```javascript
// Define educational content structure
const MATH_CONTENT = {
  topics: {
    addition: {
      title: "Addition Adventures",
      description: "Learn addition through fun challenges",
      levels: [
        {
          name: "Single Digits",
          problems: [
            {
              question: "What is 3 + 4?",
              answer: 7,
              hints: ["Count on your fingers", "Start with 3 and add 4 more"],
              visualAid: "counters"
            }
          ]
        }
      ]
    }
  }
};
```

### Adaptive Learning Integration

```javascript
class EducationalEngine {
  constructor(game) {
    this.game = game;
    this.studentModel = {
      mastery: {},      // Topic mastery levels
      struggles: [],    // Areas of difficulty
      preferences: {}   // Learning style preferences
    };
  }
  
  selectNextProblem() {
    // Choose problem based on:
    // - Current mastery level
    // - Recent performance
    // - Spaced repetition schedule
    // - Zone of proximal development
  }
  
  updateStudentModel(response) {
    // Update understanding based on:
    // - Correctness
    // - Response time
    // - Number of attempts
    // - Help usage
  }
}
```

---

## Step 7: Testing Integration

### Unit Testing Template

```javascript
// tests/games/math-quest.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MathQuestGame from '../src/features/games/math-quest/MathQuestGame.js';

describe('MathQuestGame', () => {
  let game;
  let canvas;

  beforeEach(() => {
    // Create test canvas
    canvas = document.createElement('canvas');
    canvas.id = 'test-canvas';
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);
    
    // Initialize game
    game = new MathQuestGame('test-canvas');
  });

  afterEach(() => {
    // Cleanup
    if (game) {
      game.destroy();
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  });

  it('should initialize correctly', () => {
    expect(game).toBeDefined();
    expect(game.canvas).toBeDefined();
    expect(game.gameState.currentScene).toBe('intro');
  });

  it('should handle theme changes', () => {
    const originalColors = { ...game.themeColors };
    
    // Simulate theme change
    document.documentElement.setAttribute('data-theme', 'dark');
    
    // Trigger theme update
    game.onThemeChange();
    
    // Colors should have updated
    expect(game.themeColors).not.toEqual(originalColors);
  });
});
```

---

## Step 8: Performance & Accessibility

### Performance Best Practices

```javascript
class OptimizedRenderer {
  constructor(game) {
    this.game = game;
    this.lastRenderTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
  }
  
  render(currentTime) {
    // Throttle rendering to target FPS
    if (currentTime - this.lastRenderTime < this.frameInterval) {
      return;
    }
    
    // Only render if game state changed
    if (this.game.needsRender) {
      this.performRender();
      this.game.needsRender = false;
    }
    
    this.lastRenderTime = currentTime;
  }
  
  performRender() {
    // Efficient rendering logic
    // - Use requestAnimationFrame
    // - Batch DOM updates
    // - Minimize canvas operations
  }
}
```

### Accessibility Integration

```javascript
class AccessibilityManager {
  constructor(game) {
    this.game = game;
    this.setupAccessibility();
  }
  
  setupAccessibility() {
    // Add ARIA labels
    this.game.canvas.setAttribute('role', 'application');
    this.game.canvas.setAttribute('aria-label', 'Math Quest Game');
    
    // Keyboard navigation
    this.game.canvas.setAttribute('tabindex', '0');
    
    // Screen reader announcements
    this.announceGameState();
  }
  
  announceGameState() {
    const announcement = `Current score: ${this.game.gameState.score}. 
                         Level: ${this.game.gameState.level}`;
    this.updateScreenReader(announcement);
  }
  
  updateScreenReader(text) {
    let announcer = document.getElementById('sr-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      document.body.appendChild(announcer);
    }
    announcer.textContent = text;
  }
}
```

---

## Step 9: Documentation & Maintenance

### Game Documentation Template

```markdown
# Math Quest Game

## Overview
Mathematical adventure game featuring Maxwell the Monkey.

## Educational Objectives
- Arithmetic fluency (addition, subtraction, multiplication, division)
- Problem-solving strategies
- Pattern recognition
- Mathematical reasoning

## Technical Architecture
- **Engine**: Canvas-based with ES6 modules
- **Characters**: Maxwell the Monkey (main character)
- **Themes**: Number Island, Geometry Gardens, Algebra Academy
- **Difficulty**: 5 adaptive levels based on performance

## Content Areas
### Number Sense (Grades K-2)
- Counting and cardinality
- Number recognition and formation
- Basic addition and subtraction

### Operations (Grades 2-4)
- Multi-digit arithmetic
- Word problems
- Mental math strategies

### Advanced Topics (Grades 4-6)
- Fractions and decimals
- Geometry and measurement
- Basic algebraic thinking

## Configuration Options
```javascript
{
  difficulty: 'easy|medium|hard',
  timeLimit: 30000,  // milliseconds
  showHints: true,
  enableAudio: true
}
```

## API Reference
### MathQuestGame
- `constructor(canvasId, options)`
- `startGame()`
- `pauseGame()`
- `getProgress()`
- `destroy()`
```

---

## Common Integration Patterns

### 1. Character Integration Pattern

```javascript
class GameCharacter {
  constructor(name, personality, animations) {
    this.name = name;
    this.personality = personality;
    this.animations = animations;
    this.currentEmotion = 'neutral';
  }
  
  speak(text, emotion = 'neutral') {
    this.currentEmotion = emotion;
    return {
      speaker: this.name,
      text: text,
      emotion: emotion,
      animation: this.animations[emotion] || this.animations.idle
    };
  }
}

// Usage
const maxwell = new GameCharacter('Maxwell', 'encouraging', {
  idle: 'monkey-idle',
  excited: 'monkey-jump',
  thinking: 'monkey-scratch-head',
  celebrating: 'monkey-dance'
});
```

### 2. Progress Persistence Pattern

```javascript
class GameProgress {
  constructor(gameId) {
    this.gameId = gameId;
    this.storageKey = `learnimals_${gameId}_progress`;
  }
  
  save(progressData) {
    const dataToSave = {
      ...progressData,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
  }
  
  load() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return null;
    
    try {
      const data = JSON.parse(saved);
      // Version migration logic here if needed
      return data;
    } catch (error) {
      console.warn('Failed to load progress:', error);
      return null;
    }
  }
}
```

### 3. Event System Pattern

```javascript
class GameEventBus {
  constructor() {
    this.events = {};
  }
  
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }
  
  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => callback(data));
    }
  }
  
  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }
}
```

---

## Troubleshooting Guide

### Common Issues

#### Canvas Not Rendering
```javascript
// Check canvas context
if (!this.ctx) {
  console.error('Canvas context not available');
  return;
}

// Verify canvas dimensions
console.log('Canvas size:', this.canvas.width, 'x', this.canvas.height);

// Check for CSS conflicts
const computedStyle = getComputedStyle(this.canvas);
console.log('Canvas display:', computedStyle.display);
```

#### Theme Colors Not Loading
```javascript
// Debug theme color loading
const style = getComputedStyle(document.documentElement);
console.log('Available CSS variables:', 
  Array.from(document.styleSheets)
    .flatMap(sheet => Array.from(sheet.cssRules))
    .filter(rule => rule.style && rule.style.cssText.includes('--'))
);
```

#### Performance Issues
```javascript
// Monitor performance
const startTime = performance.now();
this.render();
const endTime = performance.now();
if (endTime - startTime > 16.67) { // Slower than 60fps
  console.warn('Render took', endTime - startTime, 'ms');
}
```

### Testing Checklist

- [ ] Game loads without errors
- [ ] Canvas renders correctly
- [ ] Theme integration works
- [ ] User input responds
- [ ] Progress saves and loads
- [ ] Performance acceptable (>30fps)
- [ ] Accessible via keyboard
- [ ] Works across browsers
- [ ] Mobile responsive
- [ ] Educational content accurate

---

## Support & Resources

### Code Examples
- **Adventure Quest**: Reference implementation
- **Test Suite**: `/tests/games/adventure-quest.test.js`
- **Integration Tests**: `/tests/integration/gameSystem.integration.test.js`

### Documentation
- **Architecture**: `/docs/architecture/ADVENTURE_QUEST_ARCHITECTURE.md`
- **ADRs**: `/docs/architecture/ARCHITECTURE_DECISIONS.md`
- **Component Library**: `/docs/components.md`

### Getting Help
1. Check existing games in `/src/features/games/` for patterns
2. Review architectural documentation
3. Run test suite to verify integration
4. Follow performance and accessibility guidelines

This integration guide provides a comprehensive foundation for adding new educational games to the Learnimals platform while maintaining consistency, quality, and educational effectiveness.