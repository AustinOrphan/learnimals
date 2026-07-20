/**
 * Character Data Schema
 *
 * Defines the structure and validation for character data in the Learnimals system.
 * This schema supports both basic characters and fully customized user-generated characters.
 */

/**
 * Default character configuration template
 * @typedef {Object} CharacterSchema
 */
export const CharacterSchema = {
  // Core Identity
  id: '', // UUID or generated ID
  name: '', // User-given name or default character name
  created: null, // Date object
  lastModified: null, // Date object
  version: 1, // For data migration support
  isCustom: false, // true for user-created, false for default characters

  // Species Configuration
  species: {
    primary: '', // cat, dog, shark, parrot, panda, etc.
    secondary: null, // for hybrid characters
    category: '', // mammal, bird, aquatic, mythical
    traits: [], // species-specific traits like 'aquatic', 'flying', 'nocturnal'
  },

  // Visual Appearance
  appearance: {
    // Basic Properties
    size: 'medium', // tiny, small, medium, large, giant
    bodyType: 'balanced', // slim, chubby, athletic, fluffy, balanced

    // Color Scheme
    colors: {
      primary: '#4a90e2', // Main body color
      secondary: '#7ed321', // Secondary features color
      accent: '#f5a623', // Accent color for details
      eyes: '#333333', // Eye color
      pattern: '#ffffff', // Pattern overlay color
    },

    // Patterns and Textures
    patterns: {
      type: 'solid', // solid, stripes, spots, patches, gradient, sparkles
      density: 50, // 0-100, affects pattern visibility
      variation: 30, // 0-100, affects pattern randomness
      scale: 50, // 0-100, affects pattern size
    },

    // Facial Features
    features: {
      eyes: 'round', // round, sleepy, star, heart, determined, wise
      eyeSize: 'medium', // small, medium, large
      mouth: 'smile', // smile, grin, serious, tongue-out, neutral
      ears: 'medium', // small, medium, large, floppy, pointed
      nose: 'default', // small, medium, large, button, pointed
      whiskers: false, // boolean for applicable species
      tail: 'medium', // none, short, medium, long, fluffy, curly
    },

    // Accessories and Customizations
    accessories: {
      head: [], // ['hat', 'bow', 'glasses', 'crown', 'headphones']
      body: [], // ['scarf', 'cape', 'backpack', 'necklace']
      special: [], // ['wings', 'magic-wand', 'book', 'instrument']
    },
  },

  // Personality and Behavior
  personality: {
    // Core Traits (0-100 scale)
    traits: {
      enthusiasm: 50, // How excited they get about learning
      patience: 50, // How they handle mistakes and struggles
      curiosity: 50, // Interest in exploration and discovery
      playfulness: 50, // Tendency toward games and fun
      confidence: 50, // Self-assurance in abilities
      empathy: 50, // Understanding and responding to user emotions
    },

    // Learning Preferences
    learningStyle: 'mixed', // visual, auditory, kinesthetic, mixed
    favoriteSubject: null, // math, science, reading, art, coding, music, geography
    teachingApproach: 'balanced', // encouraging, analytical, creative, patient, energetic

    // Communication Style
    voice: {
      pitch: 1.0, // 0.5-2.0, affects speech synthesis
      speed: 1.0, // 0.5-2.0, affects speech rate
      accent: 'friendly', // friendly, excited, calm, wise, playful
      vocabulary: 'age-appropriate', // simple, age-appropriate, advanced
    },

    // Behavioral Patterns
    reactions: {
      toSuccess: 'celebrate', // celebrate, encourage, analyze, share-joy
      toMistakes: 'support', // support, teach, patience, humor
      toStruggle: 'encourage', // encourage, hint, break-down, motivate
      toIdleness: 'gentle-prompt', // gentle-prompt, suggest, inspire, play
    },
  },

  // Progression and Growth
  progression: {
    level: 1, // 1-100, overall character development
    experience: 0, // Total experience points earned
    evolutionStage: 'child', // baby, child, teen, adult, master

    // Subject-specific skill points
    skillPoints: {
      math: 0,
      science: 0,
      reading: 0,
      art: 0,
      coding: 0,
      music: 0,
      geography: 0,
    },

    // Achievements and milestones
    achievements: [], // Array of achievement IDs
    badges: [], // Array of earned badge IDs
    unlockedFeatures: [], // Array of unlocked customization options

    // Learning Analytics
    stats: {
      totalActivitiesCompleted: 0,
      totalTimeSpent: 0, // in minutes
      averageSessionLength: 0,
      favoriteActivityType: null,
      longestStreak: 0,
      currentStreak: 0,
    },
  },

  // Animation and Interaction Preferences
  animations: {
    idle: 'gentle-breathe', // Default animation when inactive
    happy: 'bounce-celebrate', // Animation for positive events
    learning: 'focused-nod', // Animation during learning activities
    encouraging: 'warm-gesture', // Animation when providing support
    surprised: 'eyes-widen', // Animation for unexpected events
    thinking: 'thoughtful-pose', // Animation when processing
  },

  // Social and Sharing Features
  social: {
    isPublic: false, // Whether character appears in public gallery
    allowRemix: true, // Whether others can create variations
    shareCode: null, // Generated code for sharing
    tags: [], // User-defined tags for categorization
    description: '', // User description of their character
    parentalApproval: false, // Required for social features
  },

  // Educational Integration
  education: {
    adaptiveDifficulty: true, // Whether character adjusts to user progress
    providesHints: true, // Whether character offers learning hints
    tracksProgress: true, // Whether character monitors learning progress
    celebratesAchievements: true, // Whether character celebrates milestones

    // Subject-specific adaptations
    subjectAdaptations: {
      math: {
        accessories: ['calculator', 'ruler'],
        personality: { analytical: true },
      },
      science: {
        accessories: ['lab-coat', 'goggles'],
        personality: { curious: true },
      },
      // Additional subjects can be added
    },
  },
};

/**
 * Validation rules for character data
 */
export const CharacterValidation = {
  // Required fields that must be present
  required: ['id', 'name', 'species.primary', 'appearance.colors.primary'],

  // Field type validation
  types: {
    id: 'string',
    name: 'string',
    'species.primary': 'string',
    'appearance.size': 'string',
    'personality.traits.enthusiasm': 'number',
  },

  // Valid enum values
  enums: {
    'appearance.size': ['tiny', 'small', 'medium', 'large', 'giant'],
    'appearance.bodyType': ['slim', 'chubby', 'athletic', 'fluffy', 'balanced'],
    'appearance.patterns.type': ['solid', 'stripes', 'spots', 'patches', 'gradient', 'sparkles'],
    'appearance.features.eyes': ['round', 'sleepy', 'star', 'heart', 'determined', 'wise'],
    'personality.learningStyle': ['visual', 'auditory', 'kinesthetic', 'mixed'],
    'progression.evolutionStage': ['baby', 'child', 'teen', 'adult', 'master'],
  },

  // Numeric ranges
  ranges: {
    'personality.traits.enthusiasm': [0, 100],
    'personality.traits.patience': [0, 100],
    'personality.traits.curiosity': [0, 100],
    'personality.traits.playfulness': [0, 100],
    'personality.voice.pitch': [0.5, 2.0],
    'personality.voice.speed': [0.5, 2.0],
    'progression.level': [1, 100],
  },

  // String length limits
  lengths: {
    name: [1, 50],
    'social.description': [0, 500],
  },
};

/**
 * Default character templates for each subject
 */
export const DefaultCharacterTemplates = {
  math: {
    name: 'Mango',
    species: { primary: 'shark', category: 'aquatic' },
    appearance: {
      colors: {
        primary: '#4a90e2',
        secondary: '#2171b5',
        accent: '#08519c',
      },
    },
    personality: {
      traits: { analytical: 75, patience: 80 },
      favoriteSubject: 'math',
    },
  },

  science: {
    name: 'Sky',
    species: { primary: 'parrot', category: 'bird' },
    appearance: {
      colors: {
        primary: '#7ed321',
        secondary: '#5cb85c',
        accent: '#449d44',
      },
    },
    personality: {
      traits: { curiosity: 90, enthusiasm: 85 },
      favoriteSubject: 'science',
    },
  },

  reading: {
    name: 'Ruby',
    species: { primary: 'panda', category: 'mammal' },
    appearance: {
      colors: {
        primary: '#333333',
        secondary: '#ffffff',
        accent: '#f5a623',
      },
    },
    personality: {
      traits: { empathy: 90, patience: 85 },
      favoriteSubject: 'reading',
    },
  },

  art: {
    name: 'Leo',
    species: { primary: 'lion', category: 'mammal' },
    appearance: {
      colors: {
        primary: '#f5a623',
        secondary: '#f39c12',
        accent: '#e67e22',
      },
    },
    personality: {
      traits: { creativity: 95, playfulness: 80 },
      favoriteSubject: 'art',
    },
  },

  coding: {
    name: 'Cody',
    species: { primary: 'cat', category: 'mammal' },
    appearance: {
      colors: {
        primary: '#9b59b6',
        secondary: '#8e44ad',
        accent: '#7d3c98',
      },
    },
    personality: {
      traits: { analytical: 85, patience: 75 },
      favoriteSubject: 'coding',
    },
  },
};

/**
 * Factory function to create a new character with default values
 * @param {Object} overrides - Properties to override in the default schema
 * @returns {Object} New character object
 */
export function createCharacter(overrides = {}) {
  const defaultCharacter = JSON.parse(JSON.stringify(CharacterSchema));

  // Set default timestamps
  const now = new Date();
  defaultCharacter.created = now;
  defaultCharacter.lastModified = now;

  // Generate unique ID if not provided
  if (!overrides.id) {
    defaultCharacter.id = generateCharacterId();
  }

  // Deep merge overrides
  return deepMerge(defaultCharacter, overrides);
}

/**
 * Factory function to create character from a subject template
 * @param {string} subject - Subject name (math, science, etc.)
 * @param {Object} customizations - Additional customizations
 * @returns {Object} Character based on subject template
 */
export function createCharacterFromTemplate(subject, customizations = {}) {
  const template = DefaultCharacterTemplates[subject];
  if (!template) {
    throw new Error(`No template found for subject: ${subject}`);
  }

  return createCharacter({
    ...template,
    ...customizations,
    isCustom: Object.keys(customizations).length > 0,
  });
}

/**
 * Generate a unique character ID
 * @returns {string} Unique identifier
 */
function generateCharacterId() {
  return 'char_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Deep merge utility function
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

export default CharacterSchema;
