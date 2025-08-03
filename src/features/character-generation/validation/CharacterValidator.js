/**
 * Character Validator
 * Validates character data against the CharacterSchema
 * 
 * Part of Phase D: Character Generator Core
 */

import { CharacterSchema } from '../schemas/CharacterSchema.js';
// Inline escapeHTML function to avoid import issues in test environment
function escapeHTML(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export class CharacterValidator {
  constructor() {
    this.schema = CharacterSchema;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate a complete character object
   * @param {Object} character - Character data to validate
   * @returns {Object} Validation result with isValid, errors, warnings
   */
  validate(character) {
    this.errors = [];
    this.warnings = [];

    if (!character || typeof character !== 'object') {
      this.errors.push('Character data must be an object');
      return this.getResult();
    }

    // Validate each schema property
    this.validateProperty('id', character.id, this.schema.id);
    this.validateProperty('name', character.name, this.schema.name);
    this.validateProperty('subject', character.subject, this.schema.subject);
    
    if (character.appearance) {
      this.validateAppearance(character.appearance);
    } else {
      this.errors.push('appearance is required');
    }

    if (character.personality) {
      this.validatePersonality(character.personality);
    } else {
      this.errors.push('personality is required');
    }

    if (character.education) {
      this.validateEducation(character.education);
    } else {
      this.errors.push('education is required');
    }

    if (character.interactions) {
      this.validateInteractions(character.interactions);
    }

    if (character.animations) {
      this.validateAnimations(character.animations);
    }

    if (character.metadata) {
      this.validateMetadata(character.metadata);
    }

    // Additional cross-field validations
    this.validateCrossFieldConstraints(character);

    return this.getResult();
  }

  /**
   * Validate a single property against schema definition
   */
  validateProperty(propertyName, value, schemaDef) {
    if (!schemaDef) return;

    // Check required fields
    if (schemaDef.required && (value === undefined || value === null || value === '')) {
      this.errors.push(`${propertyName} is required`);
      return;
    }

    if (value === undefined || value === null) {
      return; // Optional field not provided
    }

    // Type validation (handle array type specially)
    if (schemaDef.type) {
      if (schemaDef.type === 'array' && !Array.isArray(value)) {
        this.errors.push(`${propertyName} must be an array`);
        return;
      } else if (schemaDef.type !== 'array' && typeof value !== schemaDef.type) {
        this.errors.push(`${propertyName} must be of type ${schemaDef.type}`);
        return;
      }
    }

    // String validations
    if (schemaDef.type === 'string') {
      this.validateString(propertyName, value, schemaDef);
    }

    // Number validations
    if (schemaDef.type === 'number') {
      this.validateNumber(propertyName, value, schemaDef);
    }

    // Array validations
    if (schemaDef.type === 'array') {
      this.validateArray(propertyName, value, schemaDef);
    }

    // Enum validation
    if (schemaDef.enum && !schemaDef.enum.includes(value)) {
      this.errors.push(`${propertyName} must be one of: ${schemaDef.enum.join(', ')}`);
    }
  } is required`);
      return;
    }

    if (value === undefined || value === null) {
      return; // Optional field not provided
    }

    // Type validation (handle array type specially)
    if (schemaDef.type) {
      if (schemaDef.type === 'array' && !Array.isArray(value)) {
        this.errors.push(`${propertyName} must be an array`);
        return;
      } else if (schemaDef.type !== 'array' && typeof value !== schemaDef.type) {
        this.errors.push(`${propertyName} must be of type ${schemaDef.type}`);
        return;
      }
    }

    // String validations
    if (schemaDef.type === 'string') {
      this.validateString(propertyName, value, schemaDef);
    }

    // Number validations
    if (schemaDef.type === 'number') {
      this.validateNumber(propertyName, value, schemaDef);
    }

    // Array validations
    if (schemaDef.type === 'array') {
      this.validateArray(propertyName, value, schemaDef);
    }

    // Enum validation
    if (schemaDef.enum && !schemaDef.enum.includes(value)) {
      this.errors.push(`${propertyName} must be one of: ${schemaDef.enum.join(', ')}`);
    }
  }

  /**
   * Validate string properties
   */
  validateString(propertyName, value, schemaDef) {
    if (typeof value !== 'string') {
      this.errors.push(`${propertyName} must be a string`);
      return;
    }

    // Length validations
    if (schemaDef.minLength && value.length < schemaDef.minLength) {
      this.errors.push(`${propertyName} must be at least ${schemaDef.minLength} characters long`);
    }

    if (schemaDef.maxLength && value.length > schemaDef.maxLength) {
      this.errors.push(`${propertyName} must be no more than ${schemaDef.maxLength} characters long`);
    }

    // Pattern validation
    if (schemaDef.pattern && !schemaDef.pattern.test(value)) {
      this.errors.push(`${propertyName} format is invalid`);
    }

    // Security validation - check for potential XSS
    if (this.containsPotentialXSS(value)) {
      this.errors.push(`${propertyName} contains potentially unsafe content`);
    }
  }

  /**
   * Validate number properties
   */
  validateNumber(propertyName, value, schemaDef) {
    if (typeof value !== 'number' || isNaN(value)) {
      this.errors.push(`${propertyName} must be a valid number`);
      return;
    }

    if (schemaDef.min !== undefined && value < schemaDef.min) {
      this.errors.push(`${propertyName} must be at least ${schemaDef.min}`);
    }

    if (schemaDef.max !== undefined && value > schemaDef.max) {
      this.errors.push(`${propertyName} must be no more than ${schemaDef.max}`);
    }
  }

  /**
   * Validate array properties
   */
  validateArray(propertyName, value, schemaDef) {
    if (!Array.isArray(value)) {
      this.errors.push(`${propertyName} must be an array`);
      return;
    }

    if (schemaDef.minItems && value.length < schemaDef.minItems) {
      this.errors.push(`${propertyName} must have at least ${schemaDef.minItems} items`);
    }

    if (schemaDef.maxItems && value.length > schemaDef.maxItems) {
      this.errors.push(`${propertyName} must have no more than ${schemaDef.maxItems} items`);
    }

    if (schemaDef.uniqueItems) {
      const unique = [...new Set(value)];
      if (unique.length !== value.length) {
        this.errors.push(`${propertyName} must contain unique items`);
      }
    }

    // Validate array items
    if (schemaDef.items) {
      value.forEach((item, index) => {
        this.validateProperty(`${propertyName}[${index}]`, item, schemaDef.items);
      });
    }
  }

  /**
   * Validate appearance object
   */
  validateAppearance(appearance) {
    const appearanceSchema = this.schema.appearance.properties;
    
    Object.keys(appearanceSchema).forEach(key => {
      if (key === 'eyes' && appearance.eyes) {
        this.validateObject('appearance.eyes', appearance.eyes, appearanceSchema.eyes.properties);
      } else if (key === 'mouth' && appearance.mouth) {
        this.validateObject('appearance.mouth', appearance.mouth, appearanceSchema.mouth.properties);
      } else if (key === 'accessories' && appearance.accessories) {
        this.validateProperty('appearance.accessories', appearance.accessories, appearanceSchema.accessories);
      } else {
        this.validateProperty(`appearance.${key}`, appearance[key], appearanceSchema[key]);
      }
    });

    // Color combination validation
    this.validateColorCombination(appearance);
  }

  /**
   * Validate personality object
   */
  validatePersonality(personality) {
    const personalitySchema = this.schema.personality.properties;
    
    Object.keys(personalitySchema).forEach(key => {
      this.validateProperty(`personality.${key}`, personality[key], personalitySchema[key]);
    });

    // Ensure primary trait is in traits array
    if (personality.traits && personality.primaryTrait) {
      if (!personality.traits.includes(personality.primaryTrait)) {
        this.errors.push('personality.primaryTrait must be included in personality.traits array');
      }
    }
  }

  /**
   * Validate education object
   */
  validateEducation(education) {
    const educationSchema = this.schema.education.properties;
    
    Object.keys(educationSchema).forEach(key => {
      if (key === 'ageRange' && education.ageRange) {
        this.validateProperty('education.ageRange.min', education.ageRange.min, educationSchema.ageRange.properties.min);
        this.validateProperty('education.ageRange.max', education.ageRange.max, educationSchema.ageRange.properties.max);
        
        // Validate age range logic
        if (education.ageRange.min && education.ageRange.max && education.ageRange.min > education.ageRange.max) {
          this.errors.push('education.ageRange.min cannot be greater than education.ageRange.max');
        }
      } else {
        this.validateProperty(`education.${key}`, education[key], educationSchema[key]);
      }
    });
  }

  /**
   * Validate interactions object
   */
  validateInteractions(interactions) {
    const interactionsSchema = this.schema.interactions.properties;
    
    Object.keys(interactionsSchema).forEach(key => {
      if (interactions[key]) {
        this.validateProperty(`interactions.${key}`, interactions[key], interactionsSchema[key]);
      }
    });
  }

  /**
   * Validate animations object
   */
  validateAnimations(animations) {
    const animationsSchema = this.schema.animations.properties;
    
    Object.keys(animationsSchema).forEach(key => {
      if (animations[key]) {
        this.validateObject(`animations.${key}`, animations[key], animationsSchema[key].properties);
      }
    });
  }

  /**
   * Validate metadata object
   */
  validateMetadata(metadata) {
    const metadataSchema = this.schema.metadata.properties;
    
    Object.keys(metadataSchema).forEach(key => {
      this.validateProperty(`metadata.${key}`, metadata[key], metadataSchema[key]);
    });

    // Date format validation
    if (metadata.created && !this.isValidDateString(metadata.created)) {
      this.errors.push('metadata.created must be a valid ISO date string');
    }

    if (metadata.modified && !this.isValidDateString(metadata.modified)) {
      this.errors.push('metadata.modified must be a valid ISO date string');
    }
  }

  /**
   * Validate nested objects
   */
  validateObject(propertyName, obj, properties) {
    if (!obj || typeof obj !== 'object') {
      this.errors.push(`${propertyName} must be an object`);
      return;
    }

    Object.keys(properties).forEach(key => {
      this.validateProperty(`${propertyName}.${key}`, obj[key], properties[key]);
    });
  }

  /**
   * Cross-field validation
   */
  validateCrossFieldConstraints(character) {
    // Subject-specific validations
    if (character.subject && character.education?.specialties) {
      this.validateSubjectSpecialties(character.subject, character.education.specialties);
    }

    // Consistency checks
    if (character.personality?.voiceType === 'child' && character.education?.ageRange?.min > 12) {
      this.warnings.push('Child voice type with high minimum age may be inconsistent');
    }

    // Color accessibility check
    if (character.appearance?.primaryColor && character.appearance?.secondaryColor) {
      this.validateColorContrast(character.appearance.primaryColor, character.appearance.secondaryColor);
    }
  }

  /**
   * Validate subject-specialty alignment
   */
  validateSubjectSpecialties(subject, specialties) {
    const subjectSpecialtyMap = {
      math: ['numbers', 'algebra', 'geometry', 'statistics', 'calculus', 'problem solving', 'patterns'],
      science: ['physics', 'chemistry', 'biology', 'experiments', 'discovery', 'nature', 'lab work'],
      reading: ['stories', 'vocabulary', 'comprehension', 'phonics', 'literature', 'writing'],
      art: ['drawing', 'painting', 'colors', 'creativity', 'design', 'crafts'],
      coding: ['programming', 'logic', 'algorithms', 'debugging', 'web development', 'problem solving']
    };

    const validSpecialties = subjectSpecialtyMap[subject];
    if (validSpecialties) {
      specialties.forEach(specialty => {
        const isValid = validSpecialties.some(valid => 
          specialty.toLowerCase().includes(valid) || valid.includes(specialty.toLowerCase())
        );
        if (!isValid) {
          this.warnings.push(`Specialty "${specialty}" may not align well with subject "${subject}"`);
        }
      });
    }
  }

  /**
   * Validate color combination for accessibility
   */
  validateColorCombination(appearance) {
    const { primaryColor, secondaryColor, accentColor } = appearance;
    
    if (primaryColor && secondaryColor) {
      const contrast = this.calculateColorContrast(primaryColor, secondaryColor);
      if (contrast < 3.0) {
        this.warnings.push('Primary and secondary colors may have insufficient contrast');
      }
    }

    if (primaryColor && accentColor && primaryColor.toLowerCase() === accentColor.toLowerCase()) {
      this.warnings.push('Primary and accent colors should be different for better visual distinction');
    }
  }

  /**
   * Calculate color contrast ratio
   */
  calculateColorContrast(color1, color2) {
    const getLuminance = (color) => {
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;
      
      const srgb = [r, g, b].map(c => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );
      
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check for potential XSS content
   */
  containsPotentialXSS(value) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b/gi,
      /<object\b/gi,
      /<embed\b/gi
    ];

    return xssPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Validate color format
   */
  validateColorContrast(color1, color2) {
    const contrast = this.calculateColorContrast(color1, color2);
    if (contrast < 2.0) {
      this.warnings.push(`Colors ${color1} and ${color2} have low contrast ratio (${contrast.toFixed(2)})`);
    }
  }

  /**
   * Validate date string format
   */
  isValidDateString(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
  }

  /**
   * Get validation result
   */
  getResult() {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
      errorCount: this.errors.length,
      warningCount: this.warnings.length
    };
  }

  /**
   * Quick validation for specific properties
   */
  static validateId(id) {
    const validator = new CharacterValidator();
    validator.validateProperty('id', id, validator.schema.id);
    return validator.getResult();
  }

  static validateName(name) {
    const validator = new CharacterValidator();
    validator.validateProperty('name', name, validator.schema.name);
    return validator.getResult();
  }

  static validateColor(color) {
    const validator = new CharacterValidator();
    validator.validateProperty('color', color, { 
      type: 'string', 
      pattern: /^#[0-9A-Fa-f]{6}$/ 
    });
    return validator.getResult();
  }

  /**
   * Sanitize character data
   */
  static sanitize(character) {
    if (!character || typeof character !== 'object') return character;

    const sanitized = { ...character };

    // Sanitize string fields
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      return escapeHTML(str.trim());
    };

    if (sanitized.name) sanitized.name = sanitizeString(sanitized.name);
    if (sanitized.personality?.catchphrases) {
      sanitized.personality.catchphrases = sanitized.personality.catchphrases.map(sanitizeString);
    }
    if (sanitized.interactions?.greetings) {
      sanitized.interactions.greetings = sanitized.interactions.greetings.map(sanitizeString);
    }
    if (sanitized.interactions?.encouragements) {
      sanitized.interactions.encouragements = sanitized.interactions.encouragements.map(sanitizeString);
    }
    if (sanitized.interactions?.celebrations) {
      sanitized.interactions.celebrations = sanitized.interactions.celebrations.map(sanitizeString);
    }
    if (sanitized.interactions?.hints) {
      sanitized.interactions.hints = sanitized.interactions.hints.map(sanitizeString);
    }

    return sanitized;
  }
}

// Class is already exported on line 11 where it's declared