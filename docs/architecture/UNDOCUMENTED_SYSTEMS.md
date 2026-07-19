# Undocumented Systems Documentation

## Overview

This document provides detailed documentation for game systems that were implemented but not fully documented elsewhere. These systems represent critical game mechanics that require clear understanding for maintenance and extension.

---

## 1. Adaptive Difficulty Algorithm

### Purpose

Dynamically adjust challenge difficulty based on student performance to maintain optimal learning engagement.

### Implementation Location

- **File**: `src/features/games/adventure-quest/ChallengeManager.js`
- **Method**: `adaptDifficulty()`, `applyDifficultyModifications()`

### Algorithm Details

#### Performance Tracking

```javascript
playerPerformance = {
  correct: 0, // Number of correct answers
  incorrect: 0, // Number of incorrect answers
  streak: 0, // Current consecutive correct answers
  averageTime: 0, // Average response time in milliseconds
};
```

#### Difficulty Adjustment Logic

```javascript
adaptDifficulty() {
  const accuracy = this.playerPerformance.correct /
    (this.playerPerformance.correct + this.playerPerformance.incorrect || 1);

  // Increase difficulty conditions
  if (accuracy > 0.8 && this.playerPerformance.streak > 3) {
    this.difficultyLevel = Math.min(5, this.difficultyLevel + 1);
  }
  // Decrease difficulty conditions
  else if (accuracy < 0.5) {
    this.difficultyLevel = Math.max(1, this.difficultyLevel - 1);
  }
}
```

#### Difficulty Level Effects

| Level | Name        | Modifications                                                                          |
| ----- | ----------- | -------------------------------------------------------------------------------------- |
| 1     | Easy        | • Highlight obviously wrong answers<br>• Extended time limits<br>• More detailed hints |
| 2     | Normal      | • Standard question presentation<br>• Default time limits<br>• Basic explanations      |
| 3     | Challenging | • 30-second time limits<br>• Less obvious hint system<br>• Multi-step problems         |
| 4     | Hard        | • Requires explanation of reasoning<br>• Complex scenarios<br>• Multiple concepts      |
| 5     | Expert      | • Open-ended questions<br>• Creative problem solving<br>• Advanced applications        |

#### Difficulty Modification Implementation

```javascript
applyDifficultyModifications() {
  switch (this.difficultyLevel) {
    case 3: // Challenging
      this.currentQuestion.timeLimit = 30000; // 30 seconds
      break;
    case 4: // Hard
      this.currentQuestion.requireExplanation = true;
      break;
    case 5: // Expert
      this.currentQuestion.openEnded = true;
      break;
  }
}
```

### Design Rationale

- **Educational Research**: Based on Zone of Proximal Development theory
- **Engagement**: Prevents frustration (too hard) and boredom (too easy)
- **Personalization**: Adapts to individual learning pace
- **Motivation**: Success breeds confidence and continued engagement

### Future Enhancements

- **Multi-factor Analysis**: Include time patterns, hint usage, attempt patterns
- **Subject-specific Adaptation**: Different algorithms for math vs. science
- **Teacher Override**: Allow educators to set difficulty bounds
- **Learning Style Adaptation**: Adjust based on visual/auditory/kinesthetic preferences

---

## 2. Discovery Point Scoring System

### Purpose

Motivate continued learning through a comprehensive achievement and rewards system.

### Implementation Location

- **File**: `src/features/games/adventure-quest/DiscoveryTracker.js`
- **Method**: `addDiscovery()`, `calculateAchievementPoints()`

### Scoring Components

#### Base Point Values

```javascript
const DISCOVERY_TYPES = {
  challenge: 10, // Completing a challenge question
  story: 50, // Advancing story chapter
  exploration: 25, // Discovering new areas
  experimentation: 15, // Trying different approaches
  challenge_complete: 100, // Completing entire challenge set
};
```

#### Point Calculation Algorithm

```javascript
calculatePoints() {
  let basePoints = 10;

  // 1. Difficulty multiplier (1x to 5x)
  basePoints *= this.difficultyLevel;

  // 2. Streak bonus (2 points per consecutive correct)
  if (this.playerPerformance.streak > 2) {
    basePoints += this.playerPerformance.streak * 2;
  }

  // 3. Speed bonus (5 points for quick responses)
  const responseTime = Date.now() - this.startTime;
  if (responseTime < 10000) { // Less than 10 seconds
    basePoints += 5;
  }

  // 4. First attempt bonus (50% more for getting it right first time)
  if (this.attempts === 1) {
    basePoints *= 1.5;
  }

  return Math.floor(basePoints);
}
```

#### Discovery Data Structure

```javascript
discovery = {
  type: 'challenge', // Discovery category
  name: 'Understanding Gravity', // Human-readable name
  points: 35, // Points awarded
  timestamp: '2025-08-01T10:30:00Z', // When discovered
  metadata: {
    // Additional context
    difficulty: 3,
    accuracy: 0.85,
    attempts: 1,
    responseTime: 8500,
  },
};
```

### Achievement Categories

#### Challenge Achievements

- **Quick Learner**: Answer within 5 seconds (10 bonus points)
- **Persistent**: Complete after multiple attempts (15 points)
- **Perfect Streak**: 5 consecutive correct answers (25 points)
- **Subject Master**: Complete all challenges in a subject (100 points)

#### Exploration Achievements

- **Island Explorer**: Visit all areas of an island (30 points)
- **Curious Mind**: Click on all interactive elements (20 points)
- **Hidden Secrets**: Find bonus content areas (50 points)

#### Story Achievements

- **Engaged Learner**: Complete story without skipping (40 points)
- **Thoughtful Choice**: Select educational dialogue options (15 points)
- **Story Completion**: Finish entire narrative arc (75 points)

### Progression System

#### Experience Levels

```javascript
const LEVEL_THRESHOLDS = {
  1: 0, // Beginner Explorer
  2: 100, // Curious Student
  3: 300, // Dedicated Learner
  4: 600, // Science Enthusiast
  5: 1000, // Junior Scientist
  6: 1500, // Skilled Researcher
  7: 2100, // Expert Investigator
  8: 2800, // Master Explorer
  9: 3600, // Scientific Genius
  10: 4500, // Sky's Assistant
};
```

#### Badge System

- **Subject Badges**: Complete all challenges in a subject area
- **Difficulty Badges**: Complete challenges at specific difficulty levels
- **Speed Badges**: Consistent quick response times
- **Exploration Badges**: Discovery of special areas or content
- **Social Badges**: Helping other students (future feature)

### Design Rationale

- **Intrinsic Motivation**: Points reflect actual learning achievement
- **Multiple Pathways**: Different ways to earn points (speed, accuracy, persistence)
- **Progressive Difficulty**: Higher rewards for more challenging content
- **Educational Alignment**: Points correlate with educational objectives

---

## 3. Island Progression System

### Purpose

Guide students through structured learning sequences while maintaining exploration freedom.

### Implementation Location

- **File**: `src/features/games/adventure-quest/IslandNavigator.js`
- **Method**: `checkIslandUnlocks()`, `getIslandStatus()`

### Island Structure

#### Island Hierarchy

```javascript
ISLAND_STRUCTURE = {
  starter_island: {
    name: 'Welcome Harbor',
    requiredDiscoveries: 0,
    unlocks: ['physics_island', 'chemistry_cove'],
    type: 'tutorial',
  },
  physics_island: {
    name: 'Physics Island',
    requiredDiscoveries: 3,
    requiredCompletions: ['introduction'],
    unlocks: ['advanced_physics', 'biology_beach'],
    subjects: ['gravity', 'motion', 'energy', 'forces'],
  },
  chemistry_cove: {
    name: 'Chemistry Cove',
    requiredDiscoveries: 3,
    requiredCompletions: ['introduction'],
    unlocks: ['advanced_chemistry', 'biology_beach'],
    subjects: ['reactions', 'states_matter', 'mixtures', 'elements'],
  },
};
```

#### Progression Logic

```javascript
checkIslandUnlocks() {
  for (const [islandId, island] of Object.entries(ISLAND_STRUCTURE)) {
    const currentStatus = this.getIslandStatus(islandId);

    if (currentStatus === 'locked') {
      const canUnlock = this.meetsUnlockRequirements(island);
      if (canUnlock) {
        this.unlockIsland(islandId);
        this.showUnlockNotification(island.name);
      }
    }
  }
}

meetsUnlockRequirements(island) {
  // Check discovery count requirement
  if (this.totalDiscoveries < island.requiredDiscoveries) {
    return false;
  }

  // Check story completion requirements
  if (island.requiredCompletions) {
    const completed = this.getCompletedChapters();
    return island.requiredCompletions.every(chapter =>
      completed.includes(chapter)
    );
  }

  return true;
}
```

### Island States

#### State Definitions

- **Locked**: Not yet accessible, requirements not met
- **Available**: Can be visited, requirements satisfied
- **Visited**: Player has been to the island
- **Completed**: All major content on island finished
- **Mastered**: Perfect scores on all island challenges

#### Visual Indicators

```javascript
getIslandVisualState(islandId) {
  const status = this.getIslandStatus(islandId);

  return {
    locked: {
      opacity: 0.3,
      clickable: false,
      overlay: '🔒',
      tooltip: 'Complete more discoveries to unlock'
    },
    available: {
      opacity: 1.0,
      clickable: true,
      overlay: '✨',
      tooltip: 'Click to explore!'
    },
    completed: {
      opacity: 1.0,
      clickable: true,
      overlay: '⭐',
      tooltip: 'Completed! Click to revisit'
    }
  }[status];
}
```

### Navigation Features

#### Fast Travel System

- **Unlocked Islands**: Quick travel between discovered islands
- **Progress Indicators**: Show completion percentage for each island
- **Recommended Path**: Suggest next island based on learning progression
- **Backtracking**: Return to previous islands for review

#### Exploration Mechanics

```javascript
handleIslandClick(islandId) {
  const status = this.getIslandStatus(islandId);

  if (status === 'locked') {
    this.showRequirementsModal(islandId);
    return;
  }

  // Mark as visited if first time
  if (status === 'available') {
    this.markIslandVisited(islandId);
    this.awardExplorationPoints(25);
  }

  // Navigate to island
  this.game.loadScene('story', {
    chapter: `${islandId}_intro`
  });
}
```

#### Discovery Integration

- **Hidden Areas**: Special locations unlocked by thorough exploration
- **Bonus Content**: Extra challenges for advanced students
- **Easter Eggs**: Fun discoveries that don't affect progression
- **Collectibles**: Special items or knowledge that persist across sessions

### Educational Design Principles

#### Scaffolded Learning

- **Prerequisites**: Ensure foundational knowledge before advanced topics
- **Flexible Paths**: Multiple routes to the same learning objectives
- **Review Opportunities**: Easy return to previous content for reinforcement
- **Difficulty Ramps**: Gradual increase in challenge complexity

#### Motivation Mechanics

- **Clear Progress**: Visual indicators of advancement
- **Achievement Recognition**: Celebrate completion milestones
- **Exploration Rewards**: Bonus points for thorough investigation
- **Curiosity Drives**: Mysterious locked content creates intrigue

### Technical Implementation

#### State Persistence

```javascript
// Save island progression state
saveIslandProgress() {
  const progressData = {
    unlockedIslands: this.unlockedIslands,
    visitedIslands: this.visitedIslands,
    completedIslands: this.completedIslands,
    currentIsland: this.currentIsland,
    lastVisited: Date.now()
  };

  localStorage.setItem('adventure_quest_islands',
    JSON.stringify(progressData));
}
```

#### Performance Optimization

- **Lazy Loading**: Island content loaded only when needed
- **Asset Preloading**: Next likely islands preloaded in background
- **State Caching**: Minimize computation by caching progression calculations
- **Memory Management**: Unload unused island data to conserve memory

---

## 4. Cross-System Integration Patterns

### Event Communication System

#### Event Types

```javascript
SYSTEM_EVENTS = {
  DISCOVERY_ADDED: 'discovery:added',
  CHALLENGE_COMPLETED: 'challenge:completed',
  STORY_ADVANCED: 'story:advanced',
  ISLAND_UNLOCKED: 'island:unlocked',
  DIFFICULTY_CHANGED: 'difficulty:changed',
};
```

#### Event Handling Pattern

```javascript
// Publisher (e.g., ChallengeManager)
this.game.eventBus.emit(SYSTEM_EVENTS.CHALLENGE_COMPLETED, {
  challengeId: 'gravity_basics',
  score: 85,
  attempts: 2,
  timeSpent: 45000,
});

// Subscriber (e.g., DiscoveryTracker)
this.game.eventBus.on(SYSTEM_EVENTS.CHALLENGE_COMPLETED, data => {
  this.addDiscovery({
    type: 'challenge',
    name: data.challengeId,
    points: this.calculatePoints(data),
  });
});
```

### Data Flow Architecture

```
User Action → Game Engine → System Router → Target System
     ↓              ↓             ↓              ↓
State Update → Event Emission → Cross-System → UI Update
     ↓              ↓           Notification      ↓
Progress Save → Analytics → Discovery Update → Render
```

### System Dependencies

#### Dependency Map

- **StoryProgression** → triggers → **DiscoveryTracker**, **IslandNavigator**
- **ChallengeManager** → triggers → **DiscoveryTracker**, **AdaptiveDifficulty**
- **DiscoveryTracker** → triggers → **IslandNavigator**, **ProgressSaving**
- **IslandNavigator** → triggers → **StoryProgression**, **ChallengeManager**

This interconnected system ensures that achievements in one area properly influence and unlock content in other areas, creating a cohesive educational experience.

---

## Future Documentation Needs

### Performance Monitoring

- Memory usage patterns across different devices
- Frame rate optimization strategies
- Asset loading and caching mechanisms

### Error Handling

- Graceful degradation strategies
- Recovery mechanisms for corrupted save data
- Fallback systems for browser compatibility issues

### Security Considerations

- Input validation and sanitization
- Local storage data protection
- Prevention of game state manipulation

This documentation provides the foundation for understanding and extending these critical but previously undocumented systems.
