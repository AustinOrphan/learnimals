/**
 * Character Factory
 * Central factory for creating, validating, and managing characters
 *
 * Part of Phase D: Character Generator Core
 */

import {
  CharacterSchema,
  DefaultCharacterTemplate,
  SubjectTemplates,
} from '../schemas/CharacterSchema.js';
import { CharacterValidator } from '../validation/CharacterValidator.js';
import { CharacterStorage } from '../storage/CharacterStorage.js';

export class CharacterFactory {
  constructor() {
    this.validator = new CharacterValidator();
    this.storage = new CharacterStorage();
    this.defaultTemplate = DefaultCharacterTemplate;
    this.subjectTemplates = SubjectTemplates;

    // Character generation rules and algorithms
    this.generationRules = {
      colorPalettes: this.initializeColorPalettes(),
      nameGenerators: this.initializeNameGenerators(),
      personalityTraitCombinations: this.initializePersonalityTraits(),
      educationSpecialties: this.initializeEducationSpecialties(),
    };
  }

  /**
   * Create a new character from scratch
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Creation result with character data
   */
  async createCharacter(options = {}) {
    try {
      const character = this.buildCharacterFromOptions(options);

      // Validate the created character
      const validation = this.validator.validate(character);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Generated character failed validation',
          details: validation.errors,
          warnings: validation.warnings,
        };
      }

      // Save to storage if requested
      if (options.autoSave !== false) {
        const saveResult = await this.storage.saveCharacter(character);
        if (!saveResult.success) {
          return saveResult;
        }

        return {
          success: true,
          character: saveResult.character,
          characterId: saveResult.characterId,
          warnings: validation.warnings.concat(saveResult.warnings || []),
        };
      }

      return {
        success: true,
        character,
        warnings: validation.warnings,
      };
    } catch (error) {
      console.error('Character creation failed:', error);
      return {
        success: false,
        error: 'Character creation failed',
        details: [error.message],
      };
    }
  }

  /**
   * Generate a random character for a specific subject
   * @param {string} subject - Subject area for the character
   * @param {Object} constraints - Optional constraints for generation
   * @returns {Promise<Object>} Generated character
   */
  async generateRandomCharacter(subject, constraints = {}) {
    const options = {
      subject,
      randomGeneration: true,
      ...constraints,
    };

    // Apply subject-specific template
    if (this.subjectTemplates[subject]) {
      options.template = this.subjectTemplates[subject];
    }

    return this.createCharacter(options);
  }

  /**
   * Create character from template
   * @param {string} templateName - Template name or subject
   * @param {Object} overrides - Properties to override from template
   * @returns {Promise<Object>} Created character
   */
  async createFromTemplate(templateName, overrides = {}) {
    const template = this.subjectTemplates[templateName] || this.defaultTemplate;

    const options = {
      template: template,
      ...overrides,
    };

    // If templateName is a valid subject template, ensure subject is set
    if (this.subjectTemplates[templateName] && !overrides.subject) {
      options.subject = templateName;
    }

    return this.createCharacter(options);
  }

  /**
   * Duplicate an existing character with modifications
   * @param {string} characterId - ID of character to duplicate
   * @param {Object} modifications - Properties to modify
   * @returns {Promise<Object>} Duplicated character
   */
  async duplicateCharacter(characterId, modifications = {}) {
    try {
      const originalCharacter = this.storage.loadCharacter(characterId);
      if (!originalCharacter) {
        return {
          success: false,
          error: 'Original character not found',
          details: [`Character with ID ${characterId} does not exist`],
        };
      }

      // Create a deep copy
      const duplicatedCharacter = JSON.parse(JSON.stringify(originalCharacter));

      // Apply modifications
      Object.keys(modifications).forEach(key => {
        if (key === 'metadata') {
          // Handle metadata specially to preserve some original fields
          duplicatedCharacter.metadata = {
            ...duplicatedCharacter.metadata,
            ...modifications.metadata,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            version: '1.0.0',
          };
        } else if (typeof modifications[key] === 'object' && !Array.isArray(modifications[key])) {
          // Deep merge objects
          duplicatedCharacter[key] = {
            ...duplicatedCharacter[key],
            ...modifications[key],
          };
        } else {
          duplicatedCharacter[key] = modifications[key];
        }
      });

      // Generate new ID
      duplicatedCharacter.id = this.generateUniqueId(duplicatedCharacter);

      // Update name if not explicitly changed
      if (!modifications.name) {
        duplicatedCharacter.name = `${duplicatedCharacter.name} Copy`;
      }

      return this.createCharacter({
        ...duplicatedCharacter,
        autoSave: true,
      });
    } catch (error) {
      console.error('Character duplication failed:', error);
      return {
        success: false,
        error: 'Character duplication failed',
        details: [error.message],
      };
    }
  }

  /**
   * Validate character data
   * @param {Object} character - Character data to validate
   * @returns {Object} Validation result
   */
  validateCharacter(character) {
    return this.validator.validate(character);
  }

  /**
   * Get character creation suggestions based on existing characters
   * @param {Object} preferences - User preferences
   * @returns {Array} Array of suggested character configurations
   */
  getCreationSuggestions(preferences = {}) {
    const existingCharacters = this.storage.loadAllCharacters();
    const suggestions = [];

    // Analyze existing characters to find gaps
    const subjectCounts = {};
    const personalityTraits = new Set();
    const colorsSeen = new Set();

    existingCharacters.forEach(char => {
      subjectCounts[char.subject] = (subjectCounts[char.subject] || 0) + 1;
      char.personality?.traits?.forEach(trait => personalityTraits.add(trait));
      if (char.appearance?.primaryColor) colorsSeen.add(char.appearance.primaryColor);
    });

    // Suggest characters for underrepresented subjects
    const allSubjects = Object.keys(this.subjectTemplates);
    allSubjects.forEach(subject => {
      const count = subjectCounts[subject] || 0;
      if (count < 2) {
        // Suggest if less than 2 characters exist
        suggestions.push({
          type: 'subject_gap',
          priority: count === 0 ? 'high' : 'medium',
          suggestion: {
            subject,
            reason:
              count === 0
                ? 'No characters for this subject'
                : 'Only one character for this subject',
            template: this.subjectTemplates[subject],
          },
        });
      }
    });

    // Suggest personality combinations not yet explored
    const unusedTraits = this.generationRules.personalityTraitCombinations
      .filter(combo => !combo.every(trait => personalityTraits.has(trait)))
      .slice(0, 3);

    unusedTraits.forEach(traits => {
      suggestions.push({
        type: 'personality_variety',
        priority: 'medium',
        suggestion: {
          personality: { traits, primaryTrait: traits[0] },
          reason: 'Explore new personality combination',
        },
      });
    });

    // Suggest color palettes not yet used
    const unusedColors = this.generationRules.colorPalettes
      .filter(palette => !colorsSeen.has(palette.primary))
      .slice(0, 2);

    unusedColors.forEach(palette => {
      suggestions.push({
        type: 'visual_variety',
        priority: 'low',
        suggestion: {
          appearance: {
            primaryColor: palette.primary,
            secondaryColor: palette.secondary,
            accentColor: palette.accent,
          },
          reason: 'Try a new color scheme',
        },
      });
    });

    // Apply user preferences to filter suggestions
    if (preferences.favoriteSubjects) {
      suggestions.forEach(suggestion => {
        if (
          suggestion.suggestion.subject &&
          preferences.favoriteSubjects.includes(suggestion.suggestion.subject)
        ) {
          suggestion.priority = 'high';
        }
      });
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return suggestions.slice(0, 10); // Return top 10 suggestions
  }

  /**
   * Generate character preview without saving
   * @param {Object} partialCharacter - Partial character data
   * @returns {Object} Preview character with filled defaults
   */
  generatePreview(partialCharacter = {}) {
    const preview = this.buildCharacterFromOptions({
      ...partialCharacter,
      autoSave: false,
      preview: true,
    });

    return {
      character: preview,
      validation: this.validator.validate(preview),
    };
  }

  // Private helper methods

  buildCharacterFromOptions(options) {
    // Start with default template
    let character = JSON.parse(JSON.stringify(this.defaultTemplate));

    // Apply subject template if specified
    if (options.subject && this.subjectTemplates[options.subject]) {
      character = this.mergeDeep(character, this.subjectTemplates[options.subject]);
      character.subject = options.subject;
    }

    // Apply custom template if provided
    if (options.template) {
      character = this.mergeDeep(character, options.template);
    }

    // Apply specific overrides
    Object.keys(options).forEach(key => {
      if (
        key !== 'template' &&
        key !== 'randomGeneration' &&
        key !== 'autoSave' &&
        key !== 'preview'
      ) {
        if (
          typeof options[key] === 'object' &&
          !Array.isArray(options[key]) &&
          options[key] !== null
        ) {
          character[key] = this.mergeDeep(character[key] || {}, options[key]);
        } else {
          character[key] = options[key];
        }
      }
    });

    // Ensure subject is set correctly if specified in options
    if (options.subject) {
      character.subject = options.subject;
    }

    // Apply random generation if requested
    if (options.randomGeneration) {
      character = this.applyRandomGeneration(character, options);
    }

    // Ensure required fields are set
    character = this.ensureRequiredFields(character);

    // Generate unique ID if not provided
    if (!character.id || options.preview) {
      character.id = this.generateUniqueId(character);
    }

    return character;
  }

  applyRandomGeneration(character, constraints = {}) {
    // Random name generation
    if (!character.name || constraints.randomName) {
      character.name = this.generateRandomName(character.subject);
    }

    // Random appearance
    if (constraints.randomAppearance !== false) {
      const colorPalette = this.getRandomColorPalette(character.subject);
      character.appearance.primaryColor = colorPalette.primary;
      character.appearance.secondaryColor = colorPalette.secondary;
      character.appearance.accentColor = colorPalette.accent;

      // Random shape
      if (!constraints.keepShape) {
        const shapes = ['circle', 'oval', 'square', 'rectangle'];
        character.appearance.baseShape = shapes[Math.floor(Math.random() * shapes.length)];
      }

      // Random accessories
      if (constraints.addAccessories !== false) {
        character.appearance.accessories = this.generateRandomAccessories(character.subject);
      }
    }

    // Random personality traits
    if (constraints.randomPersonality !== false) {
      const traitCombination = this.getRandomPersonalityTraits();
      character.personality.traits = traitCombination;
      character.personality.primaryTrait = traitCombination[0];
    }

    // Random educational specialties
    if (constraints.randomSpecialties !== false) {
      character.education.specialties = this.getRandomSpecialties(character.subject);
    }

    // Random interactions
    if (constraints.randomInteractions !== false) {
      character.interactions = this.generateRandomInteractions(character);
    }

    return character;
  }

  ensureRequiredFields(character) {
    // Set default metadata if missing
    if (!character.metadata) {
      character.metadata = {};
    }

    const now = new Date().toISOString();
    character.metadata.created = character.metadata.created || now;
    character.metadata.modified = now;
    character.metadata.version = character.metadata.version || '1.0.0';
    character.metadata.creator = character.metadata.creator || 'system';

    // Ensure required appearance fields
    if (!character.appearance) {
      character.appearance = this.defaultTemplate.appearance;
    }

    // Ensure required personality fields
    if (!character.personality) {
      character.personality = this.defaultTemplate.personality;
    }

    // Ensure required education fields
    if (!character.education) {
      character.education = this.defaultTemplate.education;
    }

    return character;
  }

  generateUniqueId(character) {
    const baseName = (character.name || 'character').toLowerCase().replace(/[^a-z0-9]/g, '');
    const subject = character.subject || 'general';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);

    return `${baseName}-${subject}-${timestamp}-${random}`;
  }

  generateRandomName(subject) {
    const names =
      this.generationRules.nameGenerators[subject] || this.generationRules.nameGenerators.general;
    return names[Math.floor(Math.random() * names.length)];
  }

  getRandomColorPalette(subject) {
    const palettes = this.generationRules.colorPalettes.filter(
      p => !p.subjects || p.subjects.includes(subject)
    );
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  getRandomPersonalityTraits() {
    const combinations = this.generationRules.personalityTraitCombinations;
    return combinations[Math.floor(Math.random() * combinations.length)];
  }

  getRandomSpecialties(subject) {
    const specialties = this.generationRules.educationSpecialties[subject] || ['General Learning'];
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 specialties
    const shuffled = [...specialties].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  generateRandomAccessories(subject) {
    const accessories = [];
    const accessoryTypes = ['glasses', 'hat', 'badge', 'bow'];

    // 30% chance of having accessories
    if (Math.random() < 0.3) {
      const accessoryType = accessoryTypes[Math.floor(Math.random() * accessoryTypes.length)];
      accessories.push({
        type: accessoryType,
        style: 'default',
        color: '#333333',
        position: { x: 0, y: accessoryType === 'hat' ? 0.4 : 0.1 },
      });
    }

    return accessories;
  }

  generateRandomInteractions(character) {
    const subjectPhrases = {
      math: {
        greetings: ["Let's solve some equations!", 'Ready for number fun?', 'Math magic time!'],
        encouragements: [
          "You're calculating perfectly!",
          'Great problem solving!',
          'Mathematical genius!',
        ],
      },
      science: {
        greetings: ['Time for discovery!', "Let's experiment!", 'Science adventure awaits!'],
        encouragements: ['Excellent hypothesis!', 'Great observation!', 'Scientific thinking!'],
      },
    };

    const phrases = subjectPhrases[character.subject] || {
      greetings: ['Hello! Ready to learn?', "Let's explore together!", 'Learning time!'],
      encouragements: ['Great work!', 'Keep it up!', 'Excellent effort!'],
    };

    return {
      greetings: phrases.greetings,
      encouragements: phrases.encouragements,
      celebrations: ['Fantastic!', 'Amazing work!', 'You did it!'],
      hints: [],
    };
  }

  mergeDeep(target, source) {
    const result = { ...target };

    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });

    return result;
  }

  // Initialize generation rules and data

  initializeColorPalettes() {
    return [
      {
        name: 'Ocean Blue',
        primary: '#4A90E2',
        secondary: '#FFFFFF',
        accent: '#FFD700',
        subjects: ['science', 'physics'],
      },
      {
        name: 'Warm Orange',
        primary: '#FFA500',
        secondary: '#FFFFFF',
        accent: '#FF6347',
        subjects: ['math', 'cooking'],
      },
      {
        name: 'Forest Green',
        primary: '#228B22',
        secondary: '#FFFFFF',
        accent: '#FFFF00',
        subjects: ['science', 'geography', 'environment'],
      },
      {
        name: 'Royal Purple',
        primary: '#9370DB',
        secondary: '#FFFFFF',
        accent: '#FFD700',
        subjects: ['coding', 'music'],
      },
      {
        name: 'Rose Pink',
        primary: '#FF69B4',
        secondary: '#FFFFFF',
        accent: '#FFB6C1',
        subjects: ['art', 'music'],
      },
      {
        name: 'Sunset Red',
        primary: '#FF4500',
        secondary: '#FFFFFF',
        accent: '#FFFF00',
        subjects: ['art', 'language'],
      },
      {
        name: 'Sky Blue',
        primary: '#87CEEB',
        secondary: '#FFFFFF',
        accent: '#FFA500',
        subjects: ['physics'],
      },
      {
        name: 'Earth Brown',
        primary: '#8B4513',
        secondary: '#FFFFFF',
        accent: '#FFD700',
        subjects: ['reading', 'history'],
      },
      {
        name: 'Emerald Green',
        primary: '#50C878',
        secondary: '#FFFFFF',
        accent: '#FFC0CB',
        subjects: ['environment', 'geography'],
      },
      {
        name: 'Golden Yellow',
        primary: '#FFD700',
        secondary: '#FFFFFF',
        accent: '#FF6347',
        subjects: ['cooking', 'history'],
      },
      {
        name: 'Deep Blue',
        primary: '#4682B4',
        secondary: '#FFFFFF',
        accent: '#FFE4B5',
        subjects: ['physics', 'language'],
      },
      {
        name: 'Coral',
        primary: '#FF7F50',
        secondary: '#FFFFFF',
        accent: '#40E0D0',
        subjects: ['language', 'music'],
      },
    ];
  }

  initializeNameGenerators() {
    return {
      math: ['Calculus', 'Algebra', 'Newton', 'Fibonacci', 'Pi', 'Delta', 'Sigma', 'Prime'],
      science: ['Beaker', 'Atom', 'Neutron', 'Galileo', 'Darwin', 'Tesla', 'Curie', 'Einstein'],
      reading: ['Story', 'Prose', 'Verse', 'Chapter', 'Novel', 'Sonnet', 'Epic', 'Tale'],
      art: ['Palette', 'Canvas', 'Brush', 'Sketch', 'Prism', 'Hue', 'Shade', 'Tint'],
      coding: ['Pixel', 'Binary', 'Code', 'Logic', 'Debug', 'Syntax', 'Array', 'Loop'],
      music: ['Melody', 'Harmony', 'Rhythm', 'Beat', 'Tempo', 'Note', 'Chord', 'Symphony'],
      geography: ['Atlas', 'Globe', 'Compass', 'Explorer', 'Terrain', 'Summit', 'River', 'Valley'],
      history: [
        'Chronicle',
        'Legacy',
        'Ancient',
        'Heritage',
        'Timeline',
        'Era',
        'Dynasty',
        'Archive',
      ],
      language: ['Lingua', 'Verb', 'Prose', 'Dialect', 'Lexicon', 'Grammar', 'Syntax', 'Phrase'],
      physics: ['Quantum', 'Newton', 'Force', 'Energy', 'Motion', 'Wave', 'Particle', 'Vector'],
      cooking: ['Chef', 'Spice', 'Savor', 'Recipe', 'Flavor', 'Baker', 'Gourmet', 'Feast'],
      environment: ['Eco', 'Terra', 'Flora', 'Fauna', 'Gaia', 'Nature', 'Verde', 'Bloom'],
      general: ['Buddy', 'Sage', 'Spark', 'Zen', 'Quest', 'Nova', 'Echo', 'Dash'],
    };
  }

  initializePersonalityTraits() {
    return [
      ['friendly', 'encouraging'],
      ['wise', 'patient'],
      ['energetic', 'playful'],
      ['curious', 'methodical'],
      ['creative', 'inspiring'],
      ['logical', 'systematic'],
      ['adventurous', 'enthusiastic'],
      ['calm', 'helpful'],
      ['cheerful', 'optimistic'],
      ['thoughtful', 'caring'],
    ];
  }

  initializeEducationSpecialties() {
    return {
      math: [
        'Numbers',
        'Algebra',
        'Geometry',
        'Statistics',
        'Problem Solving',
        'Patterns',
        'Fractions',
      ],
      science: [
        'Experiments',
        'Discovery',
        'Nature',
        'Physics',
        'Chemistry',
        'Biology',
        'Astronomy',
      ],
      reading: [
        'Stories',
        'Vocabulary',
        'Comprehension',
        'Phonics',
        'Writing',
        'Grammar',
        'Literature',
      ],
      art: ['Drawing', 'Painting', 'Colors', 'Creativity', 'Design', 'Sculpture', 'Crafts'],
      coding: [
        'Programming',
        'Logic',
        'Algorithms',
        'Debugging',
        'Web Development',
        'Problem Solving',
      ],
      music: [
        'Rhythm',
        'Melody',
        'Harmony',
        'Instruments',
        'Music Theory',
        'Composition',
        'Singing',
      ],
      geography: [
        'Maps',
        'Countries',
        'Cultures',
        'Landforms',
        'Climate',
        'Population',
        'Resources',
      ],
      history: [
        'Ancient Civilizations',
        'Timeline',
        'Historical Events',
        'Famous People',
        'Cultural Heritage',
        'World History',
      ],
      language: [
        'Vocabulary',
        'Grammar',
        'Communication',
        'Writing',
        'Reading',
        'Speaking',
        'Language Structure',
      ],
      physics: ['Forces', 'Motion', 'Energy', 'Waves', 'Electricity', 'Magnetism', 'Matter'],
      cooking: [
        'Recipes',
        'Nutrition',
        'Kitchen Safety',
        'Food Preparation',
        'Healthy Eating',
        'Measurements',
        'Techniques',
      ],
      environment: [
        'Conservation',
        'Ecosystems',
        'Sustainability',
        'Climate',
        'Wildlife',
        'Recycling',
        'Natural Resources',
      ],
    };
  }
}

// Export class only - instances created in index.js
export default CharacterFactory;
