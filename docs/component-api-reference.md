# Component API Reference

This document provides comprehensive documentation for all Learnimals components, including usage examples, API specifications, and best practices.

## Table of Contents

- [Modal Component](#modal-component)
- [Card Component](#card-component)
- [BaseGame Component](#basegame-component)
- [BaseComponent (Foundation)](#basecomponent-foundation)

---

## Modal Component

**File:** `src/components/ui/Modal.js`

The Modal component creates accessible dialog boxes with customizable content, supporting various sizes, button configurations, and callback functions.

### Constructor

```javascript
new Modal(options)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.id` | `string` | *required* | Unique identifier for the modal element |
| `options.title` | `string` | *required* | Title text displayed in the modal header |
| `options.content` | `string` | *required* | HTML content for the modal body |
| `options.confirmButtonText` | `string` | `'OK'` | Text for the confirm/primary button |
| `options.cancelButtonText` | `string` | `'Cancel'` | Text for the cancel/secondary button |
| `options.onConfirm` | `Function` | `null` | Callback when confirm button is clicked |
| `options.onCancel` | `Function` | `null` | Callback when cancel button is clicked |
| `options.onClose` | `Function` | `null` | Callback when modal is closed by any method |
| `options.showClose` | `boolean` | `true` | Whether to display the X close button |
| `options.showConfirmButton` | `boolean` | `true` | Whether to display the confirm button |
| `options.showCancelButton` | `boolean` | `false` | Whether to display the cancel button |
| `options.size` | `string` | `'medium'` | Size variant: `'small'`, `'medium'`, `'large'` |

### Methods

#### `open()`
Opens and displays the modal to the user.

**Returns:** `Modal` - Returns this instance for method chaining

#### `close()`
Closes and hides the modal from the user.

**Returns:** `Modal` - Returns this instance for method chaining

#### `update(options)`
Updates the modal's content and configuration dynamically.

**Parameters:**
- `options` (Object) - Properties to update (same format as constructor)

**Returns:** `Modal` - Returns this instance for method chaining

#### `destroy()`
Completely removes the modal from the DOM and cleans up all resources.

### Usage Examples

#### Basic Confirmation Modal

```javascript
const confirmModal = new Modal({
  id: 'delete-confirmation',
  title: 'Delete Item',
  content: '<p>This action cannot be undone. Are you sure?</p>',
  confirmButtonText: 'Delete',
  cancelButtonText: 'Cancel',
  showCancelButton: true,
  size: 'small',
  onConfirm: () => {
    deleteItem();
    confirmModal.close();
  },
  onCancel: () => {
    console.log('Deletion cancelled');
  }
});

deleteButton.addEventListener('click', () => {
  confirmModal.open();
});
```

#### Notification Modal

```javascript
const notification = new Modal({
  id: 'success-notification',
  title: 'Success!',
  content: '<p>Your changes have been saved successfully.</p>',
  showCancelButton: false,
  showClose: true,
  onConfirm: () => notification.close()
});

saveButton.addEventListener('click', async () => {
  try {
    await saveData();
    notification.open();
  } catch (error) {
    showErrorModal(error.message);
  }
});
```

#### Dynamic Content Modal

```javascript
const gameOverModal = new Modal({
  id: 'game-over',
  title: 'Game Over!',
  content: '<p>Loading...</p>',
  confirmButtonText: 'Play Again',
  cancelButtonText: 'Main Menu',
  showCancelButton: true,
  onConfirm: () => restartGame(),
  onCancel: () => goToMainMenu()
});

function showGameOver(score, level) {
  gameOverModal.update({
    content: `
      <div class="game-over-content">
        <h4>Final Score: ${score}</h4>
        <p>You reached level ${level}!</p>
        <p>Great job! Want to try again?</p>
      </div>
    `
  });
  gameOverModal.open();
}
```

### Accessibility Features

- Automatic ARIA attributes (`role="dialog"`, `aria-modal="true"`)
- Keyboard navigation (Escape key to close)
- Focus management
- Screen reader compatible
- Semantic HTML structure

---

## Card Component

**File:** `src/components/ui/Card.js`

The Card component creates consistent, reusable card layouts across the application with support for images, links, and different themes.

### Constructor

```javascript
new Card(options)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.title` | `string` | *required* | Title text displayed in the card header |
| `options.content` | `string` | *required* | HTML content for the card body |
| `options.imageUrl` | `string` | `null` | URL for optional card image |
| `options.imageAlt` | `string` | `''` | Alt text for the card image |
| `options.linkUrl` | `string` | `null` | URL for optional card link button |
| `options.linkText` | `string` | `'Learn More'` | Text for the link button |
| `options.cssClasses` | `string[]` | `[]` | Additional CSS classes |
| `options.theme` | `string` | `'default'` | Theme variant: `'default'`, `'alt'` |
| `options.id` | `string` | *auto-generated* | Custom ID for the card element |

### Methods

#### `render(container)`
Renders the card into the specified container.

**Parameters:**
- `container` (Element|string) - DOM element or CSS selector

**Returns:** `Card` - Returns this instance for method chaining

### Static Methods

#### `Card.createLinkedCard(options, linkUrl)`
Creates a linked card without instantiating the class.

**Parameters:**
- `options` (Object) - Card configuration options
- `linkUrl` (string) - URL that the entire card should link to

**Returns:** `string` - Complete HTML string for the linked card

### Events

The Card component emits custom events:

- `cardClick` - Fired when card link is clicked
- `cardHover` - Fired when card is hovered

### Usage Examples

#### Basic Feature Card

```javascript
const mathCard = new Card({
  title: 'Mathematics with Max',
  content: '<p>Join Max the Monkey for exciting math adventures!</p>',
  imageUrl: '/images/max-monkey.png',
  imageAlt: 'Max the Monkey character',
  linkUrl: '/subjects/math.html',
  linkText: 'Explore Math',
  theme: 'default'
});

mathCard.render('#features-grid');
```

#### Card with Custom Styling

```javascript
const specialCard = new Card({
  title: 'Special Announcement',
  content: '<p>New features coming soon!</p>',
  cssClasses: ['featured-card', 'announcement'],
  theme: 'alt'
});

specialCard.render(document.querySelector('.announcements'));
```

#### Event Handling

```javascript
// Listen for card events
document.addEventListener('cardClick', (event) => {
  const { card, linkUrl } = event.detail;
  
  // Analytics tracking
  analytics.track('card_clicked', {
    title: card.title,
    url: linkUrl
  });
});

document.addEventListener('cardHover', (event) => {
  const { card } = event.detail;
  console.log('Card hovered:', card.title);
});
```

#### Static Linked Cards

```javascript
// Generate multiple navigation cards
const subjects = ['math', 'science', 'reading'];
const cardHTML = subjects.map(subject => 
  Card.createLinkedCard({
    title: subject.charAt(0).toUpperCase() + subject.slice(1),
    content: `<p>Explore ${subject} activities!</p>`,
    theme: 'default'
  }, `/subjects/${subject}.html`)
).join('');

document.querySelector('#navigation-cards').innerHTML = cardHTML;
```

---

## BaseGame Component

**File:** `src/components/games/BaseGame.js`

Base class for all Learnimals games providing common functionality for game state management, scoring, input handling, and performance monitoring.

### Constructor

```javascript
new BaseGame(canvasId, options)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `canvasId` | `string` | *required* | ID of the HTML canvas element |
| `options.onScoreUpdate` | `Function` | `null` | Callback when score changes |
| `options.onLevelUpdate` | `Function` | `null` | Callback when level changes |
| `options.onGameOver` | `Function` | `null` | Callback when game ends |
| `options.onPause` | `Function` | `null` | Callback when game pauses |
| `options.onResume` | `Function` | `null` | Callback when game resumes |
| `options.onStateChange` | `Function` | `null` | Callback when state changes |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `state` | `string` | Current game state: `'loading'`, `'ready'`, `'playing'`, `'paused'`, `'game-over'`, `'error'` |
| `score` | `number` | Current game score |
| `level` | `number` | Current game level |
| `lives` | `number` | Remaining lives |
| `canvas` | `HTMLCanvasElement` | The game canvas element |
| `ctx` | `CanvasRenderingContext2D` | 2D rendering context |

### Core Methods

#### `start()`
Starts the game with race condition protection.

**Returns:** `boolean` - True if game started successfully

#### `pause()`
Pauses the game and stops the game loop.

**Returns:** `boolean` - True if game paused successfully

#### `resume()`
Resumes the game and restarts the game loop.

**Returns:** `boolean` - True if game resumed successfully

#### `gameOver()`
Ends the game and triggers game over callbacks.

**Returns:** `boolean` - True if game ended successfully

#### `restart(autoStart = true)`
Resets all game state to initial values.

**Parameters:**
- `autoStart` (boolean) - Whether to automatically start after restart

### Score and Level Management

#### `updateScore(newScore)`
Updates the game score and notifies listeners.

**Parameters:**
- `newScore` (number) - The new score value

#### `addScore(points)`
Adds points to the current score.

**Parameters:**
- `points` (number) - Points to add (can be negative)

#### `updateLevel(newLevel)`
Updates the game level and notifies listeners.

**Parameters:**
- `newLevel` (number) - The new level value

### Input Handling

#### `isKeyPressed(keyCode)`
Checks if a specific key is currently pressed.

**Parameters:**
- `keyCode` (string) - The key code to check (e.g., 'Space', 'ArrowUp')

**Returns:** `boolean` - True if the key is pressed

#### `getPointerPosition(event)`
Gets normalized pointer position from mouse or touch event.

**Parameters:**
- `event` (MouseEvent|TouchEvent) - The pointer event

**Returns:** `Object` - Position with pixel and normalized coordinates

#### `getTouchCount()`
Gets the number of active touch points.

**Returns:** `number` - Number of active touches

### Audio

#### `playSound(frequency, duration, type)`
Plays a simple sound effect using Web Audio API.

**Parameters:**
- `frequency` (number) - Sound frequency in Hz
- `duration` (number) - Duration in milliseconds (default: 200)
- `type` (string) - Oscillator type (default: 'sine')

### Performance Monitoring

#### `getElapsedTime()`
Gets elapsed time since game started.

**Returns:** `number` - Elapsed time in milliseconds

#### `getAverageFPS()`
Gets average frames per second over recent history.

**Returns:** `number` - Average FPS

### Abstract Methods (Override Required)

#### `update(deltaTime, timestamp)`
Updates game logic each frame.

**Parameters:**
- `deltaTime` (number) - Time elapsed since last frame
- `timestamp` (number) - Current timestamp

#### `render()`
Renders the game graphics each frame.

### Optional Override Methods

#### `loadAssets()`
Load game assets (returns Promise).

#### `onInitialized()`
Called after successful initialization.

#### `onStart()`
Called when game starts.

#### `onGameEnd()`
Called when game ends.

#### `onRestart()`
Called when game restarts.

### Usage Example

```javascript
class BubblePopGame extends BaseGame {
  constructor(canvasId) {
    super(canvasId, {
      onScoreUpdate: (score) => updateScoreDisplay(score),
      onGameOver: (finalScore) => showGameOverModal(finalScore),
      onStateChange: (newState) => updateGameUI(newState)
    });
    
    this.bubbles = [];
    this.spawnRate = 1000; // milliseconds
    this.lastSpawn = 0;
  }
  
  async loadAssets() {
    // Load bubble images, sounds, etc.
    this.bubbleImage = await loadImage('/images/bubble.png');
  }
  
  onStart() {
    this.bubbles = [];
    this.lastSpawn = 0;
  }
  
  update(deltaTime, timestamp) {
    // Spawn new bubbles
    if (timestamp - this.lastSpawn > this.spawnRate) {
      this.spawnBubble();
      this.lastSpawn = timestamp;
    }
    
    // Update existing bubbles
    this.bubbles.forEach(bubble => {
      bubble.update(deltaTime);
      if (bubble.y > this.canvas.height) {
        this.removeBubble(bubble);
        this.lives--;
        if (this.lives <= 0) {
          this.gameOver();
        }
      }
    });
  }
  
  render() {
    super.render(); // Clear canvas
    
    // Draw bubbles
    this.bubbles.forEach(bubble => {
      bubble.draw(this.ctx);
    });
    
    // Draw UI
    this.drawHUD();
  }
  
  handleClick(position) {
    // Check bubble collisions
    const clickedBubble = this.bubbles.find(bubble => 
      bubble.containsPoint(position.x, position.y)
    );
    
    if (clickedBubble) {
      this.popBubble(clickedBubble);
      this.addScore(10);
      this.playSound(600, 100); // Pop sound
    }
  }
  
  spawnBubble() {
    this.bubbles.push(new Bubble({
      x: Math.random() * this.canvas.width,
      y: -50,
      speed: Math.random() * 2 + 1
    }));
  }
  
  popBubble(bubble) {
    const index = this.bubbles.indexOf(bubble);
    if (index > -1) {
      this.bubbles.splice(index, 1);
    }
  }
  
  drawHUD() {
    this.ctx.fillStyle = 'white';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    this.ctx.fillText(`Lives: ${this.lives}`, 10, 60);
    this.ctx.fillText(`Level: ${this.level}`, 10, 90);
  }
}

// Usage
const game = new BubblePopGame('game-canvas');
// Game automatically initializes and becomes ready to start
```

### State Management

The BaseGame uses a robust state machine with the following valid transitions:

- `loading` → `ready`, `error`
- `ready` → `playing`
- `playing` → `paused`, `game-over`
- `paused` → `playing`, `game-over`
- `game-over` → `loading`, `ready`
- `error` → `loading`

### Event Handling

The BaseGame automatically handles:
- Keyboard events (key tracking)
- Mouse events (position tracking, clicks)
- Touch events (multi-touch support)
- Window events (resize, blur, focus)
- Visibility changes (auto-pause when hidden)

---

## BaseComponent (Foundation)

**File:** `src/components/BaseComponent.js`

Foundation class that provides common functionality for all UI components including DOM management, event handling, and lifecycle methods.

### Constructor

```javascript
new BaseComponent(options)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.id` | `string` | *auto-generated* | Unique identifier for the component |
| `options.cssClasses` | `string[]` | `[]` | CSS classes to apply |
| `options.container` | `Element\|string` | `null` | Default container for rendering |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The component's DOM element |
| `isRendered` | `boolean` | Whether component is rendered in DOM |
| `options` | `Object` | Component configuration options |

### Methods

#### `render(container)`
Renders the component into the specified container.

#### `generateHTML()`
Abstract method to generate component HTML (override required).

#### `attachEventListeners()`
Override to attach component-specific event listeners.

#### `destroy()`
Removes component from DOM and cleans up resources.

#### `emit(eventName, detail)`
Emits a custom event from the component.

### Usage Guidelines

1. **Always extend BaseComponent** for new UI components
2. **Override generateHTML()** to define component structure
3. **Override attachEventListeners()** for interactions
4. **Call super.destroy()** in custom destroy methods
5. **Use emit()** for component communication

---

## Best Practices

### Component Development

1. **Consistent API Design**
   - Use descriptive parameter names
   - Provide sensible defaults
   - Support method chaining where appropriate

2. **Accessibility**
   - Include ARIA attributes
   - Support keyboard navigation
   - Provide semantic HTML structure

3. **Performance**
   - Clean up resources in destroy methods
   - Use event delegation when possible
   - Lazy load assets when appropriate

4. **Testing**
   - Write unit tests for all public methods
   - Test accessibility features
   - Test error conditions

### Event Handling

1. **Custom Events**
   - Use descriptive event names
   - Include relevant data in event.detail
   - Make events bubbleable when appropriate

2. **Memory Management**
   - Remove event listeners in destroy methods
   - Use bound event handlers for proper cleanup
   - Clear timeouts and intervals

### Documentation

1. **JSDoc Comments**
   - Document all public methods
   - Include parameter types and descriptions
   - Provide usage examples

2. **Code Examples**
   - Show common use cases
   - Include complete working examples
   - Demonstrate error handling