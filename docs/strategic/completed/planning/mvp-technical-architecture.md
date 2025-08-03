# Learnimals MVP Technical Architecture

## Architecture Overview

The Learnimals MVP follows a client-side architecture with static hosting, focusing on simplicity, performance, and offline capabilities. This approach minimizes complexity while delivering a robust educational platform.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Pages     │  Components  │  Games      │  Styles          │
│  - index   │  - Card      │  - BubblePop│  - Base          │
│  - profile │  - Modal     │  - WordGame │  - Components    │
│  - about   │  - Navbar    │  - PizzaGame│  - Themes        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Application Logic Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Services  │  Utils       │  Features   │  Data Models     │
│  - Progress│  - Logger    │  - Subjects │  - User          │
│  - Character│ - Theme     │  - Games    │  - Progress      │
│  - Storage │  - Common    │  - Profile  │  - Achievements  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Data Storage Layer                       │
├─────────────────────────────────────────────────────────────┤
│  LocalStorage  │  Session    │  Cache     │  Static Assets  │
│  - User Data   │  - Game     │  - Images  │  - Sounds       │
│  - Progress    │  - State    │  - CSS/JS  │  - Images       │
│  - Settings    │  - Theme    │  - Offline │  - Fonts        │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Technologies
- **JavaScript**: ES6+ Vanilla JavaScript
- **HTML5**: Semantic markup with Web APIs
- **CSS3**: Modern styling with animations
- **PWA**: Service Worker for offline functionality

### Development Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Vitest**: Unit and integration testing
- **Git**: Version control with GitHub

### Hosting & Deployment
- **GitHub Pages**: Static site hosting
- **Cloudflare**: CDN and performance optimization
- **GitHub Actions**: CI/CD pipeline

## Component Architecture

### Component Hierarchy
```
App
├── Navbar
│   ├── ThemeSwitcher
│   └── MobileMenuHandler
├── Pages
│   ├── HomePage
│   ├── ProfilePage
│   ├── GamePage
│   └── ParentDashboard
├── Game Components
│   ├── BaseGame
│   ├── BubblePopGame
│   ├── WordScrambleGame
│   └── PizzaPartyGame
├── UI Components
│   ├── Card
│   ├── Modal
│   ├── ProgressBar
│   └── AchievementBadge
└── Layout Components
    ├── Header
    ├── Footer
    └── Sidebar
```

### Component Communication
```javascript
// Event-driven architecture
class EventBus {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// Global event bus
window.learnimals = {
  eventBus: new EventBus(),
  config: {},
  user: {},
  progress: {}
};
```

## Data Management

### Data Models

#### User Model
```javascript
class User {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.age = data.age || null;
    this.selectedCharacter = data.selectedCharacter || 'mango';
    this.preferences = data.preferences || {
      theme: 'light',
      sound: true,
      notifications: true
    };
    this.createdAt = data.createdAt || new Date().toISOString();
    this.lastLogin = data.lastLogin || null;
  }
  
  save() {
    localStorage.setItem('learnimals_user', JSON.stringify(this));
  }
  
  static load() {
    const data = localStorage.getItem('learnimals_user');
    return data ? new User(JSON.parse(data)) : new User();
  }
}
```

#### Progress Model
```javascript
class Progress {
  constructor(data = {}) {
    this.userId = data.userId;
    this.subjects = data.subjects || {
      math: { level: 1, xp: 0, games: {} },
      science: { level: 1, xp: 0, games: {} },
      reading: { level: 1, xp: 0, games: {} },
      art: { level: 1, xp: 0, games: {} }
    };
    this.achievements = data.achievements || [];
    this.dailyStreak = data.dailyStreak || 0;
    this.totalPlayTime = data.totalPlayTime || 0;
    this.lastUpdated = data.lastUpdated || new Date().toISOString();
  }
  
  addXP(subject, amount) {
    this.subjects[subject].xp += amount;
    this.checkLevelUp(subject);
    this.save();
  }
  
  checkLevelUp(subject) {
    const xp = this.subjects[subject].xp;
    const newLevel = Math.floor(xp / 100) + 1;
    if (newLevel > this.subjects[subject].level) {
      this.subjects[subject].level = newLevel;
      this.triggerLevelUp(subject, newLevel);
    }
  }
}
```

### Storage Strategy

#### LocalStorage Schema
```javascript
const storageSchema = {
  // User data
  'learnimals_user': 'User object JSON',
  'learnimals_progress': 'Progress object JSON',
  'learnimals_settings': 'Settings object JSON',
  
  // Game data
  'learnimals_game_saves': 'Game state saves',
  'learnimals_achievements': 'Achievement data',
  
  // App data
  'learnimals_app_version': 'Version for migration',
  'learnimals_last_sync': 'Last sync timestamp'
};
```

#### Data Persistence Service
```javascript
class StorageService {
  static save(key, data) {
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: APP_VERSION
      });
      localStorage.setItem(`learnimals_${key}`, serialized);
    } catch (error) {
      console.error('Storage save failed:', error);
      this.handleStorageError(error);
    }
  }
  
  static load(key) {
    try {
      const item = localStorage.getItem(`learnimals_${key}`);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      return parsed.data;
    } catch (error) {
      console.error('Storage load failed:', error);
      return null;
    }
  }
}
```

## Game Architecture

### Base Game Class
```javascript
class BaseGame {
  constructor(containerId, config = {}) {
    this.container = document.getElementById(containerId);
    this.config = {
      difficulty: 1,
      timeLimit: null,
      soundEnabled: true,
      ...config
    };
    this.state = {
      score: 0,
      level: 1,
      isPlaying: false,
      isPaused: false
    };
    this.progressTracker = new ProgressTracker();
  }
  
  init() {
    this.createGameElements();
    this.bindEvents();
    this.loadAssets();
  }
  
  start() {
    this.state.isPlaying = true;
    this.gameLoop();
  }
  
  gameLoop() {
    if (!this.state.isPlaying) return;
    
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
  
  end(score) {
    this.state.isPlaying = false;
    this.progressTracker.recordScore(this.config.subject, score);
    this.showResults(score);
  }
}
```

### Game State Management
```javascript
class GameStateManager {
  constructor() {
    this.states = new Map();
  }
  
  saveState(gameId, state) {
    this.states.set(gameId, {
      ...state,
      timestamp: Date.now()
    });
    this.persist();
  }
  
  loadState(gameId) {
    return this.states.get(gameId) || null;
  }
  
  persist() {
    StorageService.save('game_states', Object.fromEntries(this.states));
  }
}
```

## Performance Architecture

### Asset Loading Strategy
```javascript
class AssetLoader {
  constructor() {
    this.loadQueue = [];
    this.loaded = new Map();
    this.loading = new Set();
  }
  
  preload(assets) {
    assets.forEach(asset => {
      if (!this.loaded.has(asset.url)) {
        this.loadQueue.push(asset);
      }
    });
    return this.processQueue();
  }
  
  lazy(assets) {
    // Load on demand
    return new Promise((resolve) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.load(assets).then(resolve);
            observer.disconnect();
          }
        });
      });
    });
  }
}
```

### Caching Strategy
```javascript
// Service Worker for offline caching
const CACHE_NAME = 'learnimals-v1';
const STATIC_ASSETS = [
  '/',
  '/src/pages/index.html',
  '/src/styles/base/styles.css',
  '/src/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

## Security Architecture

### Input Sanitization
```javascript
class SecurityUtils {
  static sanitizeHTML(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
  
  static validateAge(age) {
    const numAge = parseInt(age);
    return numAge >= 4 && numAge <= 12;
  }
  
  static sanitizeUsername(name) {
    return name.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20);
  }
}
```

### COPPA Compliance
```javascript
class PrivacyManager {
  static collectMinimalData(userData) {
    // Only collect necessary data for functionality
    return {
      age: userData.age, // For age-appropriate content
      preferences: userData.preferences // For user experience
      // No personal information stored
    };
  }
  
  static handleParentVerification() {
    // Require parent email for children under 13
    // Implement double opt-in process
  }
}
```

## Testing Architecture

### Test Structure
```
tests/
├── unit/
│   ├── components/
│   ├── services/
│   └── utils/
├── integration/
│   ├── game-flows/
│   ├── progress-tracking/
│   └── data-persistence/
├── e2e/
│   ├── user-journeys/
│   └── critical-paths/
└── helpers/
    ├── test-utils.js
    └── mock-data.js
```

### Test Configuration
```javascript
// vitest.config.js
export default {
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/**',
        'docs/**',
        '**/*.config.js'
      ]
    }
  }
};
```

## Monitoring & Analytics

### Error Tracking
```javascript
class ErrorTracker {
  static init() {
    window.addEventListener('error', this.handleError);
    window.addEventListener('unhandledrejection', this.handlePromiseError);
  }
  
  static handleError(event) {
    const errorData = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    this.logError(errorData);
  }
}
```

### Analytics Events
```javascript
class Analytics {
  static track(event, properties = {}) {
    // Google Analytics 4 event tracking
    gtag('event', event, {
      custom_properties: properties,
      timestamp: Date.now()
    });
  }
  
  static trackGameStart(gameId, subject) {
    this.track('game_start', {
      game_id: gameId,
      subject: subject
    });
  }
  
  static trackLevelComplete(level, score, timeSpent) {
    this.track('level_complete', {
      level,
      score,
      time_spent: timeSpent
    });
  }
}
```

## Deployment Architecture

### Build Process
```javascript
// build.js - Simple build script for MVP
const fs = require('fs');
const path = require('path');

class Builder {
  static async build() {
    // Minify CSS
    await this.minifyCSS();
    
    // Optimize images
    await this.optimizeImages();
    
    // Generate service worker
    await this.generateServiceWorker();
    
    // Create manifest
    await this.updateManifest();
  }
}
```

### Hosting Configuration
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Migration Strategy

### Version Management
```javascript
class MigrationManager {
  static checkVersion() {
    const currentVersion = APP_VERSION;
    const storedVersion = localStorage.getItem('learnimals_version');
    
    if (!storedVersion || storedVersion !== currentVersion) {
      this.runMigrations(storedVersion, currentVersion);
    }
  }
  
  static runMigrations(from, to) {
    const migrations = [
      { version: '1.1.0', migrate: this.migrateProgressSchema },
      { version: '1.2.0', migrate: this.migrateAchievements }
    ];
    
    migrations.forEach(migration => {
      if (this.shouldRunMigration(from, to, migration.version)) {
        migration.migrate();
      }
    });
    
    localStorage.setItem('learnimals_version', to);
  }
}
```

## Scalability Considerations

### Future Backend Integration
```javascript
// API abstraction for future backend
class ApiService {
  static async request(endpoint, options = {}) {
    // For MVP: return static data or localStorage
    // For Phase 2: make actual API calls
    if (ENVIRONMENT === 'mvp') {
      return this.handleMockRequest(endpoint, options);
    } else {
      return fetch(endpoint, options);
    }
  }
}
```

## Conclusion

This technical architecture provides a solid foundation for the Learnimals MVP while maintaining flexibility for future enhancements. The modular design, robust testing strategy, and performance optimizations ensure the platform can scale from prototype to production-ready application.

Key benefits of this architecture:
- **Simplicity**: Easy to understand and maintain
- **Performance**: Fast loading and smooth gameplay
- **Offline Support**: Works without internet connection
- **Scalability**: Easy to migrate to backend services
- **Security**: COPPA-compliant and secure by design