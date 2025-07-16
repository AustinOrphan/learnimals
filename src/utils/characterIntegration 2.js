/**
 * Character Integration Utilities
 * 
 * Bridge between existing config-based characters and the new character generation system.
 * Provides conversion, compatibility, and enhancement functions.
 */

import config from '../config.js';
import { createCharacterFromTemplate } from '../data/characterSchema.js';

/**
 * Convert config character to character schema format
 * @param {string} subjectKey - Subject key (math, science, etc.)
 * @returns {Object} Character in schema format
 */
export function configToCharacterSchema(subjectKey) {
  const subjectConfig = config.subjects[subjectKey];
  if (!subjectConfig) {
    throw new Error(`Subject not found: ${subjectKey}`);
  }

  const configChar = subjectConfig.character;
  
  // Create base character using template if available
  let character;
  try {
    character = createCharacterFromTemplate(subjectKey);
  } catch (error) {
    // Fallback to generic character if no template exists
    character = createCharacter({
      name: configChar.name,
      species: {
        primary: configChar.species || configChar.type.toLowerCase(),
        category: getSpeciesCategory(configChar.species || configChar.type.toLowerCase())
      }
    });
  }

  // Override with config-specific data
  character.name = configChar.name;
  character.species.primary = configChar.species || configChar.type.toLowerCase();
  
  // Map personality if available in config
  if (configChar.personality) {
    character.personality.traits = { ...character.personality.traits, ...configChar.personality.traits };
    character.personality.learningStyle = configChar.personality.learningStyle || character.personality.learningStyle;
    character.personality.teachingApproach = configChar.personality.teachingApproach || character.personality.teachingApproach;
    character.personality.favoriteSubject = subjectKey;
    
    // Add config-specific personality data
    if (configChar.personality.catchphrase) {
      character.personality.catchphrase = configChar.personality.catchphrase;
    }
    if (configChar.personality.voiceStyle) {
      character.personality.voice.accent = configChar.personality.voiceStyle;
    }
  }

  // Map colors if available
  if (configChar.colors) {
    character.appearance.colors = { ...character.appearance.colors, ...configChar.colors };
  }

  // Add metadata
  character.metadata = {
    source: 'config',
    subjectKey: subjectKey,
    role: configChar.role,
    originalImage: configChar.image,
    isDefault: true
  };

  return character;
}

/**
 * Get all default characters from config
 * @returns {Array<Object>} Array of characters in schema format
 */
export function getAllDefaultCharacters() {
  const characters = [];
  
  Object.keys(config.subjects).forEach(subjectKey => {
    try {
      const character = configToCharacterSchema(subjectKey);
      characters.push(character);
    } catch (error) {
      console.warn(`Failed to convert character for ${subjectKey}:`, error);
    }
  });

  return characters;
}

/**
 * Get character by subject
 * @param {string} subjectKey - Subject key
 * @returns {Object|null} Character data or null if not found
 */
export function getCharacterBySubject(subjectKey) {
  try {
    return configToCharacterSchema(subjectKey);
  } catch (error) {
    console.error(`Error getting character for subject ${subjectKey}:`, error);
    return null;
  }
}

/**
 * Update existing character with config data
 * @param {Object} character - Existing character
 * @param {string} subjectKey - Subject to enhance from
 * @returns {Object} Enhanced character
 */
export function enhanceCharacterWithConfig(character, subjectKey) {
  const configChar = config.subjects[subjectKey]?.character;
  if (!configChar) {
    return character;
  }

  const enhanced = { ...character };

  // Add subject-specific personality traits
  if (configChar.personality) {
    enhanced.personality = {
      ...enhanced.personality,
      favoriteSubject: subjectKey,
      teachingStyle: configChar.personality.teachingApproach,
      catchphrase: configChar.personality.catchphrase
    };

    // Blend personality traits (75% character, 25% config)
    if (configChar.personality.traits) {
      Object.keys(configChar.personality.traits).forEach(trait => {
        if (enhanced.personality.traits[trait] !== undefined) {
          enhanced.personality.traits[trait] = Math.round(
            enhanced.personality.traits[trait] * 0.75 + 
            configChar.personality.traits[trait] * 0.25
          );
        }
      });
    }
  }

  // Add subject-specific accessories
  if (subjectKey === 'science') {
    enhanced.appearance.accessories.head.push('goggles');
    enhanced.appearance.accessories.body.push('lab-coat');
  } else if (subjectKey === 'math') {
    enhanced.appearance.accessories.special.push('calculator');
  } else if (subjectKey === 'art') {
    enhanced.appearance.accessories.special.push('paintbrush');
  } else if (subjectKey === 'coding') {
    enhanced.appearance.accessories.head.push('headphones');
  } else if (subjectKey === 'music') {
    enhanced.appearance.accessories.special.push('musical-note');
  }

  return enhanced;
}

/**
 * Create character prompt/message based on personality
 * @param {Object} character - Character data
 * @param {string} context - Context for the message (greeting, encouragement, etc.)
 * @returns {string} Character message
 */
export function generateCharacterMessage(character, context = 'greeting') {
  const personality = character.personality;
  const name = character.name;
  
  const messages = {
    greeting: {
      high_enthusiasm: [
        `Hi there! I'm ${name} and I'm SO excited to learn with you today!`,
        `${name} here! Ready for an amazing adventure?`,
        `Wow! ${name} can't wait to explore together!`
      ],
      medium_enthusiasm: [
        `Hello! I'm ${name}, your learning companion.`,
        `Hi! ${name} here, ready to help you learn.`,
        `Welcome! I'm ${name} and I'm here to guide you.`
      ],
      low_enthusiasm: [
        `Hello. I'm ${name}. Let's begin our lesson.`,
        `I'm ${name}. We can start whenever you're ready.`,
        `${name} here. What would you like to work on?`
      ]
    },
    encouragement: {
      high_patience: [
        `Don't worry, ${name} believes in you! Let's try again.`,
        `That's okay! ${name} knows you can do this.`,
        `No problem! ${name} is here to help you learn.`
      ],
      medium_patience: [
        `Let's take another approach. ${name} will help!`,
        `That's alright! ${name} has some tips for you.`,
        `${name} thinks you're doing great! Let's keep trying.`
      ],
      low_patience: [
        'Let\'s focus and try again.',
        `${name} knows you can get this right.`,
        'One more time - you\'ve got this!'
      ]
    },
    celebration: {
      high_playfulness: [
        `YES! ${name} is doing a happy dance! You did it!`,
        `WOO-HOO! ${name} is so proud of you!`,
        `AMAZING! ${name} wants to celebrate with you!`
      ],
      medium_playfulness: [
        `Great job! ${name} is really proud of you!`,
        `Well done! ${name} thinks you're awesome!`,
        `Excellent work! ${name} is impressed!`
      ],
      low_playfulness: [
        `Well done. ${name} is pleased with your progress.`,
        `Good work. ${name} approves.`,
        `Correct. ${name} is satisfied with your answer.`
      ]
    }
  };

  // Determine personality level for message selection
  let level = 'medium';
  if (context === 'greeting') {
    level = personality.traits.enthusiasm > 80 ? 'high_enthusiasm' : 
      personality.traits.enthusiasm < 50 ? 'low_enthusiasm' : 'medium_enthusiasm';
  } else if (context === 'encouragement') {
    level = personality.traits.patience > 80 ? 'high_patience' : 
      personality.traits.patience < 50 ? 'low_patience' : 'medium_patience';
  } else if (context === 'celebration') {
    level = personality.traits.playfulness > 80 ? 'high_playfulness' : 
      personality.traits.playfulness < 50 ? 'low_playfulness' : 'medium_playfulness';
  }

  const messagePool = messages[context]?.[level] || messages.greeting.medium_enthusiasm;
  const randomMessage = messagePool[Math.floor(Math.random() * messagePool.length)];

  // Add catchphrase occasionally
  if (personality.catchphrase && Math.random() < 0.3) {
    return `${randomMessage} ${personality.catchphrase}`;
  }

  return randomMessage;
}

/**
 * Get species category for unknown species
 * @param {string} species - Species name
 * @returns {string} Category
 */
function getSpeciesCategory(species) {
  const categories = {
    // Mammals
    cat: 'mammal',
    dog: 'mammal',
    panda: 'mammal',
    lion: 'mammal',
    
    // Birds
    parrot: 'bird',
    songbird: 'bird',
    eagle: 'bird',
    
    // Aquatic
    shark: 'aquatic',
    fish: 'aquatic',
    dolphin: 'aquatic',
    
    // Mythical
    dragon: 'mythical',
    unicorn: 'mythical',
    phoenix: 'mythical'
  };

  return categories[species.toLowerCase()] || 'mammal';
}

/**
 * Create character animation state based on context
 * @param {Object} character - Character data
 * @param {string} context - Animation context
 * @returns {string} Animation state
 */
export function getCharacterAnimationState(character, context) {
  const personality = character.personality;
  
  switch (context) {
  case 'correct_answer':
    return personality.traits.playfulness > 70 ? 'celebrating' : 'happy';
    
  case 'wrong_answer':
    return personality.traits.empathy > 80 ? 'encouraging' : 'thinking';
    
  case 'waiting':
    return personality.traits.patience > 80 ? 'calm' : 'idle';
    
  case 'teaching':
    return personality.traits.enthusiasm > 80 ? 'excited' : 'focused';
    
  default:
    return 'idle';
  }
}

/**
 * Get character voice parameters for speech synthesis
 * @param {Object} character - Character data
 * @returns {Object} Voice parameters
 */
export function getCharacterVoiceParams(character) {
  const personality = character.personality;
  
  return {
    pitch: personality.voice?.pitch || (personality.traits.enthusiasm / 100 + 0.5),
    speed: personality.voice?.speed || (personality.traits.playfulness > 70 ? 1.1 : 0.9),
    volume: personality.traits.confidence / 100,
    accent: personality.voice?.accent || 'friendly'
  };
}

/**
 * Check if character can use specific feature
 * @param {Object} character - Character data
 * @param {string} feature - Feature name
 * @returns {boolean} Whether character can use feature
 */
export function characterCanUseFeature(character, feature) {
  const features = {
    // Basic features all characters have
    greet: true,
    encourage: true,
    celebrate: true,
    
    // Subject-specific features
    teach_math: character.personality?.favoriteSubject === 'math',
    do_science: character.personality?.favoriteSubject === 'science',
    read_stories: character.personality?.favoriteSubject === 'reading',
    create_art: character.personality?.favoriteSubject === 'art',
    write_code: character.personality?.favoriteSubject === 'coding',
    
    // Personality-based features
    tell_jokes: character.personality?.traits?.playfulness > 70,
    give_detailed_help: character.personality?.traits?.patience > 80,
    show_enthusiasm: character.personality?.traits?.enthusiasm > 70
  };

  return features[feature] || false;
}

export default {
  configToCharacterSchema,
  getAllDefaultCharacters,
  getCharacterBySubject,
  enhanceCharacterWithConfig,
  generateCharacterMessage,
  getCharacterAnimationState,
  getCharacterVoiceParams,
  characterCanUseFeature
};