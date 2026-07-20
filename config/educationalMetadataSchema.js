/**
 * Educational Metadata Schema
 * Defines required and optional metadata fields for games using the educational template
 * Ensures COPPA compliance and educational effectiveness
 */

/**
 * Required metadata fields for educational games
 */
export const REQUIRED_EDUCATIONAL_METADATA = {
  // Basic Educational Info
  learningObjectives: {
    type: 'array',
    minItems: 1,
    description: 'Specific learning objectives the game addresses',
    example: ['addition', 'subtraction', 'number sense'],
  },

  ageRange: {
    type: 'string',
    pattern: /^\d+-\d+$/,
    description: 'Target age range (e.g., "6-8", "9-12")',
    coppaRelevant: true, // Under 13 requires parental consent
  },

  educationalStandards: {
    type: 'array',
    description: 'Curriculum standards alignment (e.g., Common Core)',
    example: ['CCSS.MATH.CONTENT.K.OA.A.5', 'NGSS.K-PS2-1'],
  },

  assessmentType: {
    type: 'string',
    enum: ['formative', 'summative', 'diagnostic', 'practice'],
    description: 'Type of assessment the game provides',
  },

  estimatedPlayTime: {
    type: 'number',
    min: 1,
    max: 60,
    description: 'Expected play time in minutes',
  },

  // Privacy & Safety
  dataCollection: {
    type: 'object',
    required: ['collectsPersonalInfo', 'dataTypes', 'purpose'],
    properties: {
      collectsPersonalInfo: {
        type: 'boolean',
        description: 'Whether game collects any personal information',
      },
      dataTypes: {
        type: 'array',
        description: 'Types of data collected (e.g., "progress", "scores")',
        enum: ['progress', 'scores', 'responses', 'time_spent', 'hints_used'],
      },
      purpose: {
        type: 'string',
        description: 'Purpose of data collection',
        enum: ['educational_assessment', 'progress_tracking', 'adaptive_learning'],
      },
      retention: {
        type: 'string',
        description: 'Data retention period',
        enum: ['session_only', '30_days', '90_days', 'school_year'],
      },
    },
  },
};

/**
 * Optional but recommended metadata fields
 */
export const OPTIONAL_EDUCATIONAL_METADATA = {
  // Pedagogical Information
  pedagogicalApproach: {
    type: 'string',
    enum: ['direct_instruction', 'discovery_learning', 'collaborative', 'gamification', 'adaptive'],
    description: 'Teaching methodology used',
  },

  difficultyAdjustment: {
    type: 'string',
    enum: ['static', 'manual', 'adaptive'],
    description: 'How difficulty is adjusted during gameplay',
  },

  feedbackType: {
    type: 'string',
    enum: ['immediate', 'delayed', 'summary'],
    description: 'When and how feedback is provided',
  },

  // Accessibility
  accessibility: {
    type: 'object',
    properties: {
      screenReader: { type: 'boolean' },
      keyboardNavigation: { type: 'boolean' },
      colorBlindMode: { type: 'boolean' },
      fontSize: { type: 'string', enum: ['adjustable', 'fixed'] },
      audioDescriptions: { type: 'boolean' },
    },
  },

  // Teacher/Parent Features
  teacherResources: {
    type: 'object',
    properties: {
      lessonPlans: { type: 'boolean' },
      printableWorksheets: { type: 'boolean' },
      answerKeys: { type: 'boolean' },
      discussionGuides: { type: 'boolean' },
    },
  },

  parentalControls: {
    type: 'object',
    properties: {
      timeLimit: { type: 'boolean' },
      difficultyLock: { type: 'boolean' },
      progressReports: { type: 'boolean' },
      contentFiltering: { type: 'boolean' },
    },
  },

  // Learning Metrics
  trackingMetrics: {
    type: 'array',
    description: 'Specific metrics tracked for assessment',
    items: {
      type: 'string',
      enum: [
        'accuracy',
        'speed',
        'attempts',
        'hints_used',
        'time_on_task',
        'error_patterns',
        'mastery_level',
        'engagement_score',
        'completion_rate',
      ],
    },
  },

  // Content Information
  prerequisites: {
    type: 'array',
    description: 'Skills or knowledge required before playing',
    example: ['basic_counting', 'number_recognition'],
  },

  relatedGames: {
    type: 'array',
    description: 'IDs of games that complement this one',
    example: ['number-line-jump', 'math-quest'],
  },

  // Certification & Quality
  educationalCertification: {
    type: 'object',
    properties: {
      certified: { type: 'boolean' },
      certifyingBody: { type: 'string' },
      certificationDate: { type: 'string', format: 'date' },
    },
  },
};

/**
 * Validate educational metadata
 * @param {Object} metadata - Game metadata to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateEducationalMetadata(metadata) {
  const errors = [];

  // Check required fields
  Object.entries(REQUIRED_EDUCATIONAL_METADATA).forEach(([field, schema]) => {
    if (!metadata[field]) {
      errors.push(`Missing required field: ${field}`);
      return;
    }

    // Type validation
    if (schema.type === 'array' && !Array.isArray(metadata[field])) {
      errors.push(`Field ${field} must be an array`);
    } else if (
      schema.type === 'array' &&
      schema.minItems &&
      metadata[field].length < schema.minItems
    ) {
      errors.push(`Field ${field} must have at least ${schema.minItems} items`);
    } else if (schema.type === 'string' && typeof metadata[field] !== 'string') {
      errors.push(`Field ${field} must be a string`);
    } else if (schema.type === 'number' && typeof metadata[field] !== 'number') {
      errors.push(`Field ${field} must be a number`);
    } else if (schema.type === 'object' && typeof metadata[field] !== 'object') {
      errors.push(`Field ${field} must be an object`);
    }

    // Pattern validation
    if (schema.pattern && !schema.pattern.test(metadata[field])) {
      errors.push(`Field ${field} does not match required pattern: ${schema.pattern}`);
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(metadata[field])) {
      errors.push(`Field ${field} must be one of: ${schema.enum.join(', ')}`);
    }

    // Range validation
    if (schema.min !== undefined && metadata[field] < schema.min) {
      errors.push(`Field ${field} must be at least ${schema.min}`);
    }
    if (schema.max !== undefined && metadata[field] > schema.max) {
      errors.push(`Field ${field} must be at most ${schema.max}`);
    }
  });

  // Validate nested required fields
  if (metadata.dataCollection) {
    const dc = metadata.dataCollection;
    if (typeof dc.collectsPersonalInfo !== 'boolean') {
      errors.push('dataCollection.collectsPersonalInfo must be a boolean');
    }
    if (!Array.isArray(dc.dataTypes)) {
      errors.push('dataCollection.dataTypes must be an array');
    }
    if (!dc.purpose) {
      errors.push('dataCollection.purpose is required');
    }
  }

  // COPPA compliance check
  if (metadata.ageRange) {
    const [minAge] = metadata.ageRange.split('-').map(Number);
    if (minAge < 13 && metadata.dataCollection?.collectsPersonalInfo) {
      errors.push(
        'COPPA WARNING: Game targets children under 13 and collects personal info - parental consent required'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: generateWarnings(metadata),
  };
}

/**
 * Generate warnings for best practices
 * @param {Object} metadata - Game metadata
 * @returns {Array} Warning messages
 */
function generateWarnings(metadata) {
  const warnings = [];

  // Check for recommended fields
  if (!metadata.pedagogicalApproach) {
    warnings.push('Consider adding pedagogicalApproach for better educational alignment');
  }

  if (!metadata.accessibility) {
    warnings.push('Consider adding accessibility features for inclusive learning');
  }

  if (!metadata.trackingMetrics) {
    warnings.push('Consider defining trackingMetrics for better assessment capabilities');
  }

  if (metadata.estimatedPlayTime > 30) {
    warnings.push('Play sessions over 30 minutes may reduce engagement for younger learners');
  }

  if (!metadata.teacherResources) {
    warnings.push('Consider adding teacher resources to support classroom integration');
  }

  return warnings;
}

/**
 * Generate a template for educational metadata
 * @param {string} subject - Game subject
 * @param {string} ageRange - Target age range
 * @returns {Object} Template metadata object
 */
export function generateEducationalMetadataTemplate(subject, ageRange) {
  return {
    // Required fields
    learningObjectives: ['[Add specific learning objective]'],
    ageRange: ageRange || '6-12',
    educationalStandards: ['[Add curriculum standard]'],
    assessmentType: 'formative',
    estimatedPlayTime: 15,
    dataCollection: {
      collectsPersonalInfo: false,
      dataTypes: ['progress', 'scores'],
      purpose: 'educational_assessment',
      retention: 'session_only',
    },

    // Recommended fields
    pedagogicalApproach: 'gamification',
    difficultyAdjustment: 'adaptive',
    feedbackType: 'immediate',
    accessibility: {
      screenReader: false,
      keyboardNavigation: true,
      colorBlindMode: false,
      fontSize: 'adjustable',
      audioDescriptions: false,
    },
    trackingMetrics: ['accuracy', 'time_on_task', 'completion_rate'],

    // Additional fields based on subject
    ...(subject && getSubjectSpecificMetadata(subject)),
  };
}

/**
 * Get subject-specific metadata defaults
 * @param {string} subject - Game subject
 * @returns {Object} Subject-specific metadata
 */
function getSubjectSpecificMetadata(subject) {
  const subjectDefaults = {
    math: {
      learningObjectives: ['number sense', 'basic operations', 'problem solving'],
      educationalStandards: ['CCSS.MATH.CONTENT.K.OA.A.5'],
      trackingMetrics: ['accuracy', 'speed', 'error_patterns'],
    },
    reading: {
      learningObjectives: ['vocabulary', 'comprehension', 'phonics'],
      educationalStandards: ['CCSS.ELA-LITERACY.RF.K.1'],
      trackingMetrics: ['accuracy', 'time_on_task', 'completion_rate'],
    },
    science: {
      learningObjectives: ['scientific method', 'observation', 'hypothesis testing'],
      educationalStandards: ['NGSS.K-PS2-1'],
      trackingMetrics: ['attempts', 'time_on_task', 'mastery_level'],
    },
    coding: {
      learningObjectives: ['computational thinking', 'sequencing', 'debugging'],
      educationalStandards: ['CSTA.K-2.AP.08'],
      trackingMetrics: ['completion_rate', 'error_patterns', 'hints_used'],
    },
    art: {
      learningObjectives: ['creativity', 'color theory', 'artistic expression'],
      educationalStandards: ['NCAS.VA.Cr1.1.K'],
      trackingMetrics: ['engagement_score', 'time_on_task', 'completion_rate'],
    },
  };

  return subjectDefaults[subject] || {};
}

/**
 * Check COPPA compliance for educational game
 * @param {Object} metadata - Game metadata
 * @returns {Object} COPPA compliance status
 */
export function checkCOPPACompliance(metadata) {
  const compliance = {
    requiresParentalConsent: false,
    issues: [],
    recommendations: [],
  };

  // Check age range
  if (metadata.ageRange) {
    const [minAge] = metadata.ageRange.split('-').map(Number);
    if (minAge < 13) {
      compliance.requiresParentalConsent = true;

      if (metadata.dataCollection?.collectsPersonalInfo) {
        compliance.issues.push('Collects personal info from children under 13');
        compliance.recommendations.push('Implement verifiable parental consent mechanism');
        compliance.recommendations.push('Add clear privacy policy for parents');
      }

      if (
        !metadata.dataCollection?.retention ||
        metadata.dataCollection.retention !== 'session_only'
      ) {
        compliance.issues.push('Data retention beyond session for under-13 users');
        compliance.recommendations.push(
          'Limit data retention to session only or implement data deletion'
        );
      }
    }
  }

  // Check data collection practices
  if (metadata.dataCollection?.dataTypes?.includes('personal_info')) {
    compliance.issues.push('Collects personal information');
    compliance.recommendations.push('Minimize personal data collection');
  }

  // Check for marketing/advertising
  if (metadata.dataCollection?.purpose?.includes('marketing')) {
    compliance.issues.push('Data used for marketing purposes');
    compliance.recommendations.push('Remove marketing data collection for COPPA compliance');
  }

  return compliance;
}
