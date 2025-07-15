/**
 * Character Schema Definition
 * Defines the structure and constraints for generated characters in Learnimals
 * 
 * Part of Phase D: Character Generator Core
 */

export const CharacterSchema = {
  // Required character properties
  id: {
    type: 'string',
    required: true,
    pattern: /^[a-zA-Z0-9-_]+$/,
    minLength: 3,
    maxLength: 50,
    description: 'Unique identifier for the character'
  },

  name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 30,
    pattern: /^[a-zA-Z\s]+$/,
    description: 'Character display name'
  },

  subject: {
    type: 'string',
    required: true,
    enum: ['math', 'reading', 'science', 'art', 'coding', 'music', 'geography', 'history', 'language', 'physics', 'cooking', 'environment'],
    description: 'Subject area the character specializes in'
  },

  // Character appearance
  appearance: {
    type: 'object',
    required: true,
    properties: {
      baseShape: {
        type: 'string',
        enum: ['circle', 'oval', 'square', 'rectangle', 'triangle', 'hexagon'],
        default: 'circle',
        description: 'Base geometric shape for character'
      },
      
      size: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        default: 'medium',
        description: 'Relative size of the character'
      },

      primaryColor: {
        type: 'string',
        pattern: /^#[0-9A-Fa-f]{6}$/,
        default: '#4A90E2',
        description: 'Primary color in hex format'
      },

      secondaryColor: {
        type: 'string',
        pattern: /^#[0-9A-Fa-f]{6}$/,
        default: '#FFFFFF',
        description: 'Secondary color in hex format'
      },

      accentColor: {
        type: 'string',
        pattern: /^#[0-9A-Fa-f]{6}$/,
        default: '#FFD700',
        description: 'Accent color for highlights'
      },

      eyes: {
        type: 'object',
        properties: {
          shape: {
            type: 'string',
            enum: ['circle', 'oval', 'almond', 'square'],
            default: 'circle'
          },
          color: {
            type: 'string',
            pattern: /^#[0-9A-Fa-f]{6}$/,
            default: '#333333'
          },
          size: {
            type: 'number',
            min: 0.5,
            max: 2.0,
            default: 1.0
          }
        }
      },

      mouth: {
        type: 'object',
        properties: {
          shape: {
            type: 'string',
            enum: ['smile', 'neutral', 'open', 'small', 'wide'],
            default: 'smile'
          },
          expression: {
            type: 'string',
            enum: ['happy', 'neutral', 'excited', 'curious', 'friendly'],
            default: 'happy'
          }
        }
      },

      accessories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['hat', 'glasses', 'bow', 'scarf', 'badge', 'tool']
            },
            style: {
              type: 'string'
            },
            color: {
              type: 'string',
              pattern: /^#[0-9A-Fa-f]{6}$/
            },
            position: {
              type: 'object',
              properties: {
                x: { type: 'number', min: -1, max: 1, default: 0 },
                y: { type: 'number', min: -1, max: 1, default: 0 }
              }
            }
          }
        },
        maxItems: 5,
        default: []
      }
    }
  },

  // Character personality and behavior
  personality: {
    type: 'object',
    required: true,
    properties: {
      traits: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'friendly', 'energetic', 'wise', 'curious', 'patient', 
            'creative', 'logical', 'encouraging', 'playful', 'methodical',
            'inspiring', 'adventurous', 'calm', 'enthusiastic', 'helpful', 'caring'
          ]
        },
        minItems: 1,
        maxItems: 3,
        uniqueItems: true,
        description: 'Key personality traits'
      },

      primaryTrait: {
        type: 'string',
        required: true,
        description: 'Main personality characteristic'
      },

      voiceType: {
        type: 'string',
        enum: ['child', 'adult', 'elderly', 'robotic', 'melodic'],
        default: 'child',
        description: 'Voice characteristics for speech synthesis'
      },

      catchphrases: {
        type: 'array',
        items: {
          type: 'string',
          maxLength: 100
        },
        maxItems: 5,
        default: [],
        description: 'Character-specific phrases'
      }
    }
  },

  // Educational specialization
  education: {
    type: 'object',
    required: true,
    properties: {
      specialties: {
        type: 'array',
        items: {
          type: 'string',
          maxLength: 50
        },
        minItems: 1,
        maxItems: 5,
        description: 'Specific areas of expertise within subject'
      },

      difficultyLevel: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
        default: 'mixed',
        description: 'Target difficulty level'
      },

      ageRange: {
        type: 'object',
        properties: {
          min: { type: 'number', min: 3, max: 18 },
          max: { type: 'number', min: 3, max: 18 }
        },
        default: { min: 4, max: 12 }
      },

      teachingStyle: {
        type: 'string',
        enum: ['visual', 'auditory', 'kinesthetic', 'mixed'],
        default: 'mixed',
        description: 'Preferred teaching approach'
      }
    }
  },

  // Interaction capabilities
  interactions: {
    type: 'object',
    properties: {
      greetings: {
        type: 'array',
        items: { type: 'string', maxLength: 200 },
        minItems: 1,
        maxItems: 10,
        description: 'Available greeting messages'
      },

      encouragements: {
        type: 'array',
        items: { type: 'string', maxLength: 200 },
        minItems: 1,
        maxItems: 10,
        description: 'Encouraging messages for learners'
      },

      celebrations: {
        type: 'array',
        items: { type: 'string', maxLength: 200 },
        minItems: 1,
        maxItems: 10,
        description: 'Success celebration messages'
      },

      hints: {
        type: 'array',
        items: { type: 'string', maxLength: 300 },
        maxItems: 15,
        description: 'Educational hints and tips'
      }
    }
  },

  // Animation and behavior settings
  animations: {
    type: 'object',
    properties: {
      idle: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', default: true },
          duration: { type: 'number', min: 1000, max: 10000, default: 3000 },
          intensity: { type: 'number', min: 0.1, max: 1.0, default: 0.3 }
        }
      },

      speaking: {
        type: 'object',
        properties: {
          bobbing: { type: 'boolean', default: true },
          eyeMovement: { type: 'boolean', default: true },
          mouthSync: { type: 'boolean', default: true }
        }
      },

      emotions: {
        type: 'object',
        properties: {
          happy: { type: 'string', enum: ['bounce', 'glow', 'wiggle', 'pulse'], default: 'bounce' },
          excited: { type: 'string', enum: ['jump', 'spin', 'shake', 'flash'], default: 'jump' },
          thinking: { type: 'string', enum: ['tilt', 'dim', 'slow-pulse'], default: 'tilt' }
        }
      }
    }
  },

  // Metadata
  metadata: {
    type: 'object',
    properties: {
      created: {
        type: 'string',
        format: 'date-time',
        description: 'Creation timestamp'
      },

      modified: {
        type: 'string',
        format: 'date-time',
        description: 'Last modification timestamp'
      },

      version: {
        type: 'string',
        pattern: /^\d+\.\d+\.\d+$/,
        default: '1.0.0',
        description: 'Character version for compatibility'
      },

      creator: {
        type: 'string',
        enum: ['system', 'user', 'template'],
        default: 'system',
        description: 'Who created this character'
      },

      tags: {
        type: 'array',
        items: { type: 'string', maxLength: 20 },
        maxItems: 10,
        description: 'Searchable tags'
      },

      isPublic: {
        type: 'boolean',
        default: false,
        description: 'Whether character can be shared'
      },

      popularity: {
        type: 'number',
        min: 0,
        max: 100,
        default: 0,
        description: 'Popularity score for sorting'
      }
    }
  }
};

// Default character template for new characters
export const DefaultCharacterTemplate = {
  id: '',
  name: '',
  subject: 'math',
  appearance: {
    baseShape: 'circle',
    size: 'medium',
    primaryColor: '#4A90E2',
    secondaryColor: '#FFFFFF',
    accentColor: '#FFD700',
    eyes: {
      shape: 'circle',
      color: '#333333',
      size: 1.0
    },
    mouth: {
      shape: 'smile',
      expression: 'happy'
    },
    accessories: []
  },
  personality: {
    traits: ['friendly'],
    primaryTrait: 'friendly',
    voiceType: 'child',
    catchphrases: []
  },
  education: {
    specialties: ['General Learning'],
    difficultyLevel: 'mixed',
    ageRange: { min: 4, max: 12 },
    teachingStyle: 'mixed'
  },
  interactions: {
    greetings: ['Hello! Ready to learn together?'],
    encouragements: ['You\'re doing great! Keep it up!'],
    celebrations: ['Fantastic work! Well done!'],
    hints: []
  },
  animations: {
    idle: {
      enabled: true,
      duration: 3000,
      intensity: 0.3
    },
    speaking: {
      bobbing: true,
      eyeMovement: true,
      mouthSync: true
    },
    emotions: {
      happy: 'bounce',
      excited: 'jump',
      thinking: 'tilt'
    }
  },
  metadata: {
    created: '', // Will be set dynamically when character is created
    modified: '', // Will be set dynamically when character is created
    version: '1.0.0',
    creator: 'system',
    tags: [],
    isPublic: false,
    popularity: 0
  }
};

// Subject-specific character templates
export const SubjectTemplates = {
  math: {
    personality: {
      traits: ['logical', 'patient', 'encouraging'],
      primaryTrait: 'logical'
    },
    appearance: {
      primaryColor: '#FFA500',
      accessories: [
        { type: 'glasses', style: 'round', color: '#333333', position: { x: 0, y: 0.1 } }
      ]
    },
    education: {
      specialties: ['Numbers', 'Problem Solving', 'Patterns'],
      teachingStyle: 'visual'
    },
    interactions: {
      greetings: [
        'Hi! Let\'s explore the wonderful world of numbers!',
        'Ready to solve some fun math puzzles?'
      ]
    }
  },

  science: {
    personality: {
      traits: ['curious', 'methodical', 'inspiring'],
      primaryTrait: 'curious'
    },
    appearance: {
      primaryColor: '#4A90E2',
      accessories: [
        { type: 'badge', style: 'scientist', color: '#FFFFFF', position: { x: 0.3, y: -0.2 } }
      ]
    },
    education: {
      specialties: ['Experiments', 'Discovery', 'Nature'],
      teachingStyle: 'kinesthetic'
    }
  },

  reading: {
    personality: {
      traits: ['wise', 'patient', 'encouraging'],
      primaryTrait: 'wise'
    },
    appearance: {
      primaryColor: '#8B4513',
      accessories: [
        { type: 'glasses', style: 'reading', color: '#8B4513', position: { x: 0, y: 0.1 } }
      ]
    },
    education: {
      specialties: ['Stories', 'Vocabulary', 'Comprehension'],
      teachingStyle: 'auditory'
    }
  },

  art: {
    personality: {
      traits: ['creative', 'inspiring', 'enthusiastic'],
      primaryTrait: 'creative'
    },
    appearance: {
      primaryColor: '#E91E63',
      accessories: [
        { type: 'beret', style: 'artist', color: '#E91E63', position: { x: 0, y: 0.4 } }
      ]
    },
    education: {
      specialties: ['Drawing', 'Colors', 'Creativity'],
      teachingStyle: 'visual'
    }
  },

  coding: {
    personality: {
      traits: ['logical', 'methodical', 'helpful'],
      primaryTrait: 'logical'
    },
    appearance: {
      primaryColor: '#9C27B0',
      accessories: [
        { type: 'glasses', style: 'programmer', color: '#333333', position: { x: 0, y: 0.1 } }
      ]
    },
    education: {
      specialties: ['Programming', 'Logic', 'Problem Solving'],
      teachingStyle: 'kinesthetic'
    }
  },

  music: {
    personality: {
      traits: ['creative', 'patient', 'enthusiastic'],
      primaryTrait: 'creative'
    },
    appearance: {
      primaryColor: '#FF1493',
      accessories: [
        { type: 'hat', style: 'musician', color: '#FF1493', position: { x: 0, y: 0.4 } }
      ]
    },
    education: {
      specialties: ['Rhythm', 'Melody', 'Music Theory'],
      teachingStyle: 'auditory'
    },
    interactions: {
      greetings: [
        'Let\'s make beautiful music together!',
        'Ready to explore the world of sound?'
      ]
    }
  },

  geography: {
    personality: {
      traits: ['adventurous', 'curious', 'inspiring'],
      primaryTrait: 'adventurous'
    },
    appearance: {
      primaryColor: '#228B22',
      accessories: [
        { type: 'hat', style: 'explorer', color: '#8B4513', position: { x: 0, y: 0.4 } }
      ]
    },
    education: {
      specialties: ['Maps', 'Countries', 'Cultures'],
      teachingStyle: 'visual'
    }
  },

  history: {
    personality: {
      traits: ['wise', 'methodical', 'inspiring'],
      primaryTrait: 'wise'
    },
    appearance: {
      primaryColor: '#8B4513',
      accessories: [
        { type: 'glasses', style: 'scholarly', color: '#8B4513', position: { x: 0, y: 0.1 } }
      ]
    },
    education: {
      specialties: ['Ancient Civilizations', 'Timeline', 'Historical Events'],
      teachingStyle: 'mixed'
    }
  },

  language: {
    personality: {
      traits: ['friendly', 'patient', 'encouraging'],
      primaryTrait: 'friendly'
    },
    appearance: {
      primaryColor: '#FF6347',
      accessories: [
        { type: 'badge', style: 'translator', color: '#FFFFFF', position: { x: 0.3, y: -0.2 } }
      ]
    },
    education: {
      specialties: ['Vocabulary', 'Grammar', 'Communication'],
      teachingStyle: 'auditory'
    }
  },

  physics: {
    personality: {
      traits: ['logical', 'curious', 'methodical'],
      primaryTrait: 'logical'
    },
    appearance: {
      primaryColor: '#4682B4',
      accessories: [
        { type: 'glasses', style: 'scientific', color: '#333333', position: { x: 0, y: 0.1 } }
      ]
    },
    education: {
      specialties: ['Forces', 'Motion', 'Energy'],
      teachingStyle: 'kinesthetic'
    }
  },

  cooking: {
    personality: {
      traits: ['creative', 'patient', 'encouraging'],
      primaryTrait: 'creative'
    },
    appearance: {
      primaryColor: '#FF8C00',
      accessories: [
        { type: 'hat', style: 'chef', color: '#FFFFFF', position: { x: 0, y: 0.4 } }
      ]
    },
    education: {
      specialties: ['Recipes', 'Nutrition', 'Kitchen Safety'],
      teachingStyle: 'kinesthetic'
    }
  },

  environment: {
    personality: {
      traits: ['caring', 'inspiring', 'patient'],
      primaryTrait: 'caring'
    },
    appearance: {
      primaryColor: '#32CD32',
      accessories: [
        { type: 'badge', style: 'eco', color: '#228B22', position: { x: 0.3, y: -0.2 } }
      ]
    },
    education: {
      specialties: ['Conservation', 'Ecosystems', 'Sustainability'],
      teachingStyle: 'mixed'
    }
  }
};

export default CharacterSchema;