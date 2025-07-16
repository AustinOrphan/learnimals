// Color Theory Database for Color Palette Game
// Comprehensive color education data for teaching art and color theory

/**
 * Core color definitions with educational information
 * Each color includes RGB values, theory, and real-world connections
 */

export const colorDatabase = {
  primary: [
    {
      id: 'red',
      name: 'Red',
      hex: '#FF0000',
      rgb: { r: 255, g: 0, b: 0 },
      hsl: { h: 0, s: 100, l: 50 },
      temperature: 'warm',
      properties: [
        'A primary color - cannot be made by mixing other colors',
        'The color of fire, energy, and passion',
        'Often associated with excitement and strength',
        'One of the three basic colors in traditional color theory'
      ],
      realWorldExamples: [
        'Fire trucks and stop signs',
        'Ripe strawberries and apples',
        'Roses and poppies',
        'Ruby gemstones'
      ],
      emotions: ['passionate', 'energetic', 'powerful', 'exciting'],
      culturalMeanings: {
        western: 'Love, danger, excitement',
        eastern: 'Good luck, prosperity, celebration',
        general: 'Attention, importance, urgency'
      },
      mixingWith: {
        yellow: { result: 'orange', type: 'secondary' },
        blue: { result: 'purple', type: 'secondary' }
      }
    },
    {
      id: 'blue',
      name: 'Blue',
      hex: '#0000FF',
      rgb: { r: 0, g: 0, b: 255 },
      hsl: { h: 240, s: 100, l: 50 },
      temperature: 'cool',
      properties: [
        'A primary color - pure and unmixable',
        'The color of sky and ocean',
        'Often associated with calm and trust',
        'Most popular color across many cultures'
      ],
      realWorldExamples: [
        'Clear sky and deep ocean',
        'Blueberries and blue jays',
        'Sapphire gemstones',
        'Police uniforms'
      ],
      emotions: ['calm', 'peaceful', 'trustworthy', 'stable'],
      culturalMeanings: {
        western: 'Trust, loyalty, wisdom',
        eastern: 'Immortality, spirituality',
        general: 'Peace, stability, professionalism'
      },
      mixingWith: {
        yellow: { result: 'green', type: 'secondary' },
        red: { result: 'purple', type: 'secondary' }
      }
    },
    {
      id: 'yellow',
      name: 'Yellow',
      hex: '#FFFF00',
      rgb: { r: 255, g: 255, b: 0 },
      hsl: { h: 60, s: 100, l: 50 },
      temperature: 'warm',
      properties: [
        'A primary color - bright and pure',
        'The color of sunshine and happiness',
        'Most visible color to the human eye',
        'Associated with joy and optimism'
      ],
      realWorldExamples: [
        'Sun and sunflowers',
        'Bananas and lemons',
        'School buses and taxi cabs',
        'Golden honey'
      ],
      emotions: ['happy', 'optimistic', 'energetic', 'cheerful'],
      culturalMeanings: {
        western: 'Happiness, caution, creativity',
        eastern: 'Prosperity, royalty, wisdom',
        general: 'Attention, warmth, illumination'
      },
      mixingWith: {
        red: { result: 'orange', type: 'secondary' },
        blue: { result: 'green', type: 'secondary' }
      }
    }
  ],

  secondary: [
    {
      id: 'orange',
      name: 'Orange',
      hex: '#FFA500',
      rgb: { r: 255, g: 165, b: 0 },
      hsl: { h: 39, s: 100, l: 50 },
      temperature: 'warm',
      madeFrom: ['red', 'yellow'],
      properties: [
        'A secondary color made by mixing red and yellow',
        'The color of autumn and harvest',
        'Combines the energy of red with the happiness of yellow',
        'Very attention-grabbing and vibrant'
      ],
      realWorldExamples: [
        'Oranges and carrots',
        'Autumn leaves and pumpkins',
        'Traffic cones and basketballs',
        'Marigold flowers'
      ],
      emotions: ['enthusiastic', 'warm', 'adventurous', 'confident'],
      culturalMeanings: {
        western: 'Creativity, enthusiasm, adventure',
        eastern: 'Good fortune, spirituality',
        general: 'Energy, warmth, approachability'
      }
    },
    {
      id: 'green',
      name: 'Green',
      hex: '#00FF00',
      rgb: { r: 0, g: 255, b: 0 },
      hsl: { h: 120, s: 100, l: 50 },
      temperature: 'cool',
      madeFrom: ['blue', 'yellow'],
      properties: [
        'A secondary color made by mixing blue and yellow',
        'The color of nature and growth',
        'Most restful color to the human eye',
        'Associated with life and renewal'
      ],
      realWorldExamples: [
        'Grass and leaves',
        'Emerald gemstones',
        'Frogs and lizards',
        'Money and dollar bills'
      ],
      emotions: ['peaceful', 'natural', 'growing', 'balanced'],
      culturalMeanings: {
        western: 'Nature, money, growth, envy',
        eastern: 'New beginnings, fertility',
        general: 'Life, renewal, environment'
      }
    },
    {
      id: 'purple',
      name: 'Purple',
      hex: '#800080',
      rgb: { r: 128, g: 0, b: 128 },
      hsl: { h: 300, s: 100, l: 25 },
      temperature: 'cool',
      madeFrom: ['red', 'blue'],
      properties: [
        'A secondary color made by mixing red and blue',
        'Historically associated with royalty and luxury',
        'Combines the stability of blue with the energy of red',
        'Often linked to creativity and mystery'
      ],
      realWorldExamples: [
        'Violets and lavender',
        'Amethyst gemstones',
        'Eggplants and grapes',
        'Royal robes and crowns'
      ],
      emotions: ['creative', 'mysterious', 'royal', 'spiritual'],
      culturalMeanings: {
        western: 'Royalty, luxury, creativity, mystery',
        eastern: 'Spirituality, transformation',
        general: 'Nobility, wisdom, magic'
      }
    }
  ],

  tertiary: [
    {
      id: 'red-orange',
      name: 'Red-Orange',
      hex: '#FF4500',
      rgb: { r: 255, g: 69, b: 0 },
      hsl: { h: 16, s: 100, l: 50 },
      temperature: 'warm',
      madeFrom: ['red', 'orange'],
      properties: ['A tertiary color with high energy', 'Very warm and exciting']
    },
    {
      id: 'yellow-orange',
      name: 'Yellow-Orange',
      hex: '#FFAE42',
      rgb: { r: 255, g: 174, b: 66 },
      hsl: { h: 34, s: 100, l: 63 },
      temperature: 'warm',
      madeFrom: ['yellow', 'orange'],
      properties: ['A tertiary color like golden autumn', 'Warm and inviting']
    },
    {
      id: 'yellow-green',
      name: 'Yellow-Green',
      hex: '#9ACD32',
      rgb: { r: 154, g: 205, b: 50 },
      hsl: { h: 80, s: 61, l: 50 },
      temperature: 'warm',
      madeFrom: ['yellow', 'green'],
      properties: ['A tertiary color of fresh spring', 'Vibrant and natural']
    },
    {
      id: 'blue-green',
      name: 'Blue-Green',
      hex: '#0D98BA',
      rgb: { r: 13, g: 152, b: 186 },
      hsl: { h: 192, s: 87, l: 39 },
      temperature: 'cool',
      madeFrom: ['blue', 'green'],
      properties: ['A tertiary color like tropical waters', 'Cool and refreshing']
    },
    {
      id: 'blue-purple',
      name: 'Blue-Purple',
      hex: '#4B0082',
      rgb: { r: 75, g: 0, b: 130 },
      hsl: { h: 275, s: 100, l: 25 },
      temperature: 'cool',
      madeFrom: ['blue', 'purple'],
      properties: ['A tertiary color like deep twilight', 'Mysterious and deep']
    },
    {
      id: 'red-purple',
      name: 'Red-Purple',
      hex: '#C71585',
      rgb: { r: 199, g: 21, b: 133 },
      hsl: { h: 322, s: 81, l: 43 },
      temperature: 'warm',
      madeFrom: ['red', 'purple'],
      properties: ['A tertiary color like rich wine', 'Dramatic and bold']
    }
  ]
};

/**
 * Color scheme definitions for palette creation challenges
 */
export const colorSchemes = {
  monochromatic: {
    name: 'Monochromatic',
    description: 'Different shades, tints, and tones of a single color',
    instruction: 'Create a palette using only variations of one color',
    example: ['#000080', '#4169E1', '#87CEEB', '#E0F6FF'],
    difficulty: 'easy',
    educational: 'Teaches how one color can create rich, harmonious palettes'
  },
  analogous: {
    name: 'Analogous',
    description: 'Colors that are next to each other on the color wheel',
    instruction: 'Choose colors that sit beside each other on the wheel',
    example: ['#FF0000', '#FF4500', '#FFA500', '#FFFF00'],
    difficulty: 'medium',
    educational: 'Shows how neighboring colors create natural harmony'
  },
  complementary: {
    name: 'Complementary',
    description: 'Colors that are directly opposite on the color wheel',
    instruction: 'Pick colors that are across from each other',
    example: ['#FF0000', '#00FF00'],
    difficulty: 'medium',
    educational: 'Demonstrates how opposite colors create strong contrast'
  },
  triadic: {
    name: 'Triadic',
    description: 'Three colors equally spaced around the color wheel',
    instruction: 'Select three colors that form a triangle on the wheel',
    example: ['#FF0000', '#00FF00', '#0000FF'],
    difficulty: 'hard',
    educational: 'Shows balanced, vibrant color relationships'
  },
  splitComplementary: {
    name: 'Split-Complementary',
    description: 'A color plus the two colors on either side of its complement',
    instruction: 'Choose one color and the neighbors of its opposite',
    example: ['#FF0000', '#00FF80', '#0080FF'],
    difficulty: 'hard',
    educational: 'Provides contrast with more color options than complementary'
  },
  warm: {
    name: 'Warm Colors',
    description: 'Colors that remind us of warmth: reds, oranges, yellows',
    instruction: 'Create a palette that feels warm and energetic',
    example: ['#FF0000', '#FFA500', '#FFFF00', '#FF69B4'],
    difficulty: 'easy',
    educational: 'Understanding color temperature and emotional associations'
  },
  cool: {
    name: 'Cool Colors',
    description: 'Colors that remind us of coolness: blues, greens, purples',
    instruction: 'Create a palette that feels cool and calm',
    example: ['#0000FF', '#00FF00', '#800080', '#40E0D0'],
    difficulty: 'easy',
    educational: 'Understanding color temperature and calming effects'
  }
};

/**
 * Challenges organized by difficulty level
 */
export const challenges = {
  easy: [
    {
      id: 'primary-mixing',
      type: 'color-mixing',
      title: 'Mix Primary Colors',
      description: 'Learn what happens when you mix the primary colors!',
      instruction: 'Drag two primary colors to the mixing bowl',
      objective: 'red + yellow = ?',
      correctAnswer: 'orange',
      hint: 'Think about the color of a sunset!',
      educational: 'Primary colors are the foundation of all other colors'
    },
    {
      id: 'warm-cool-sorting',
      type: 'color-sorting',
      title: 'Warm vs Cool Colors',
      description: 'Sort colors into warm and cool groups',
      instruction: 'Drag warm colors to the sun, cool colors to the snowflake',
      colors: ['red', 'blue', 'yellow', 'green', 'orange', 'purple'],
      correctAnswer: {
        warm: ['red', 'yellow', 'orange'],
        cool: ['blue', 'green', 'purple']
      },
      hint: 'Warm colors remind you of fire and sun, cool colors of water and sky',
      educational: 'Color temperature affects the mood and feeling of artwork'
    },
    {
      id: 'color-wheel-basics',
      type: 'color-wheel',
      title: 'Complete the Color Wheel',
      description: 'Place the primary and secondary colors in the right spots',
      instruction: 'Drag colors to complete the basic color wheel',
      wheelPositions: [
        { position: 0, correct: 'red' },
        { position: 60, correct: 'yellow' },
        { position: 120, correct: 'green' },
        { position: 180, correct: 'blue' },
        { position: 240, correct: 'purple' },
        { position: 300, correct: 'orange' }
      ],
      hint: 'Primary colors are evenly spaced, with secondary colors between them',
      educational: 'The color wheel shows relationships between all colors'
    }
  ],
  medium: [
    {
      id: 'secondary-creation',
      type: 'color-mixing',
      title: 'Create All Secondary Colors',
      description: 'Mix primary colors to make orange, green, and purple',
      instruction: 'Use the mixing station to create each secondary color',
      objectives: [
        { mix: ['red', 'yellow'], result: 'orange' },
        { mix: ['blue', 'yellow'], result: 'green' },
        { mix: ['red', 'blue'], result: 'purple' }
      ],
      hint: 'Each secondary color is made from exactly two primary colors',
      educational: 'Secondary colors show how primary colors work together'
    },
    {
      id: 'complementary-pairs',
      type: 'color-matching',
      title: 'Find Complementary Colors',
      description: 'Match colors with their opposites on the color wheel',
      instruction: 'Connect each color with its complement',
      pairs: [
        { color1: 'red', color2: 'green' },
        { color1: 'blue', color2: 'orange' },
        { color1: 'yellow', color2: 'purple' }
      ],
      hint: 'Complementary colors are across from each other on the color wheel',
      educational: 'Complementary colors create the strongest visual contrast'
    },
    {
      id: 'analogous-harmony',
      type: 'palette-creation',
      title: 'Create Analogous Harmony',
      description: 'Make a beautiful palette using neighboring colors',
      instruction: 'Choose 3-4 colors that sit next to each other on the wheel',
      scheme: 'analogous',
      hint: 'Think of colors you see together in nature, like a sunset',
      educational: 'Analogous colors create peaceful, comfortable designs'
    }
  ],
  hard: [
    {
      id: 'tertiary-mastery',
      type: 'color-mixing',
      title: 'Master Tertiary Colors',
      description: 'Create tertiary colors by mixing primary and secondary',
      instruction: 'Mix a primary color with a secondary color',
      objectives: [
        { mix: ['red', 'orange'], result: 'red-orange' },
        { mix: ['yellow', 'orange'], result: 'yellow-orange' },
        { mix: ['yellow', 'green'], result: 'yellow-green' },
        { mix: ['blue', 'green'], result: 'blue-green' },
        { mix: ['blue', 'purple'], result: 'blue-purple' },
        { mix: ['red', 'purple'], result: 'red-purple' }
      ],
      hint: 'Tertiary colors have two-word names describing their mix',
      educational: 'Tertiary colors provide nuanced options for artists'
    },
    {
      id: 'triadic-harmony',
      type: 'palette-creation',
      title: 'Create Triadic Harmony',
      description: 'Make a vibrant palette using three equally-spaced colors',
      instruction: 'Choose three colors that form a triangle on the color wheel',
      scheme: 'triadic',
      hint: 'The primary colors (red, blue, yellow) are a perfect triadic scheme',
      educational: 'Triadic schemes are bold but balanced'
    },
    {
      id: 'split-complementary',
      type: 'palette-creation',
      title: 'Split-Complementary Scheme',
      description: 'Create an advanced color scheme with sophisticated contrast',
      instruction: 'Pick one color, then the two colors beside its complement',
      scheme: 'splitComplementary',
      hint: 'This gives you contrast without being too overwhelming',
      educational: 'Split-complementary offers contrast with more harmony'
    }
  ]
};

/**
 * Utility functions for color manipulation and education
 */

/**
 * Get all colors for a difficulty level
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Array} Array of color objects
 */
export function getColorsForDifficulty(difficulty) {
  switch (difficulty) {
  case 'easy':
    return [...colorDatabase.primary, ...colorDatabase.secondary];
  case 'medium':
    return [...colorDatabase.primary, ...colorDatabase.secondary, ...colorDatabase.tertiary.slice(0, 3)];
  case 'hard':
    return [...colorDatabase.primary, ...colorDatabase.secondary, ...colorDatabase.tertiary];
  default:
    return [...colorDatabase.primary, ...colorDatabase.secondary];
  }
}

/**
 * Get challenges for a difficulty level
 * @param {string} difficulty - Difficulty level
 * @returns {Array} Array of challenge objects
 */
export function getChallengesForDifficulty(difficulty) {
  return challenges[difficulty] || challenges.easy;
}

/**
 * Get color by ID
 * @param {string} colorId - Color identifier
 * @returns {Object|null} Color object or null
 */
export function getColorById(colorId) {
  const allColors = [
    ...colorDatabase.primary,
    ...colorDatabase.secondary,
    ...colorDatabase.tertiary
  ];
  return allColors.find(color => color.id === colorId) || null;
}

/**
 * Mix two colors together
 * @param {string} color1Id - First color ID
 * @param {string} color2Id - Second color ID
 * @returns {Object} Mixing result with success and resulting color
 */
export function mixColors(color1Id, color2Id) {
  const color1 = getColorById(color1Id);
  const color2 = getColorById(color2Id);
  
  if (!color1 || !color2) {
    return { success: false, result: null, message: 'Invalid colors' };
  }
  
  // Check if either color has mixing information
  const mixingInfo = color1.mixingWith?.[color2Id] || color2.mixingWith?.[color1Id];
  
  if (mixingInfo) {
    const _resultColor = getColorById(mixingInfo.result);
    return {
      success: true,
      result: _resultColor,
      message: `${color1.name} + ${color2.name} = ${_resultColor.name}!`,
      type: mixingInfo.type
    };
  }
  
  return {
    success: false,
    result: null,
    message: `${color1.name} and ${color2.name} don't mix to create a standard color`
  };
}

/**
 * Check if colors form a valid color scheme
 * @param {Array} colorIds - Array of color IDs
 * @param {string} schemeType - Type of color scheme to validate
 * @returns {Object} Validation result
 */
export function validateColorScheme(colorIds, schemeType) {
  const scheme = colorSchemes[schemeType];
  if (!scheme) {
    return { valid: false, message: 'Unknown color scheme' };
  }
  
  // Basic validation - this could be enhanced with more sophisticated checking
  if (colorIds.length < 2) {
    return { valid: false, message: 'Need at least 2 colors for a scheme' };
  }
  
  // For now, return true for any reasonable attempt
  // In a full implementation, this would check color wheel positions
  return {
    valid: true,
    message: `Great ${scheme.name} color scheme!`,
    feedback: scheme.educational
  };
}

/**
 * Get random colors for practice
 * @param {number} count - Number of colors to return
 * @param {string} difficulty - Difficulty level
 * @returns {Array} Random color selection
 */
export function getRandomColors(count, difficulty = 'easy') {
  const availableColors = getColorsForDifficulty(difficulty);
  const shuffled = [...availableColors].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, availableColors.length));
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color string
 * @returns {Object} RGB object
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to HSL
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {Object} HSL object
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export default colorDatabase;