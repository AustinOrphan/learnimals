// Element Database for Element Match Game
// Accurate scientific data for educational purposes

/**
 * Comprehensive element database organized by difficulty level
 * Each element includes symbol, atomic number, type, properties, and real-world uses
 */

export const elementDatabase = {
  easy: [
    {
      name: 'Hydrogen',
      symbol: 'H',
      atomicNumber: 1,
      type: 'nonmetal',
      color: '#FF6B6B', // Red for hydrogen
      properties: [
        'Lightest element in the universe',
        'Colorless and odorless gas',
        'Highly flammable',
        'Most abundant element in the universe',
      ],
      uses: [
        'Rocket fuel',
        'Making ammonia for fertilizers',
        'Fuel cells for clean energy',
        'Weather balloons',
      ],
      funFacts: [
        'The sun is mostly made of hydrogen!',
        'Hydrogen was the first element created after the Big Bang',
      ],
    },
    {
      name: 'Oxygen',
      symbol: 'O',
      atomicNumber: 8,
      type: 'nonmetal',
      color: '#4ECDC4', // Teal for oxygen
      properties: [
        'Essential for breathing',
        'Supports combustion',
        'Colorless and odorless gas',
        'Makes up about 21% of air',
      ],
      uses: [
        'Breathing and respiration',
        'Steel production',
        'Medical treatments',
        'Rocket oxidizer',
      ],
      funFacts: [
        'We breathe about 550 liters of oxygen every day!',
        'Oxygen makes up about 65% of your body weight',
      ],
    },
    {
      name: 'Carbon',
      symbol: 'C',
      atomicNumber: 6,
      type: 'nonmetal',
      color: '#45B7D1', // Blue for carbon
      properties: [
        'Forms many different compounds',
        'Found in all living things',
        'Can form diamond or graphite',
        'Has four bonding electrons',
      ],
      uses: [
        'Making steel (as carbon steel)',
        'Pencil lead (graphite)',
        'Jewelry (diamonds)',
        'Carbon fiber materials',
      ],
      funFacts: [
        'Diamonds and pencil lead are both made of carbon!',
        'All life on Earth is carbon-based',
      ],
    },
    {
      name: 'Iron',
      symbol: 'Fe',
      atomicNumber: 26,
      type: 'metal',
      color: '#95A5A6', // Gray for iron
      properties: [
        'Magnetic metal',
        'Rusts when exposed to air and water',
        'Strong and durable',
        'Fourth most abundant element in Earth\'s crust',
      ],
      uses: [
        'Making steel for buildings',
        'Car parts and engines',
        'Tools and machinery',
        'Blood (iron in hemoglobin)',
      ],
      funFacts: ['Your blood is red because of iron!', 'The Eiffel Tower is made of iron'],
    },
    {
      name: 'Gold',
      symbol: 'Au',
      atomicNumber: 79,
      type: 'metal',
      color: '#F1C40F', // Gold color
      properties: [
        'Does not rust or tarnish',
        'Excellent conductor of electricity',
        'Very soft and malleable',
        'Shiny yellow metal',
      ],
      uses: [
        'Jewelry and decorations',
        'Electronics and computer parts',
        'Dental fillings',
        'Currency and investment',
      ],
      funFacts: [
        'All the gold ever mined could fit in a swimming pool!',
        'Gold doesn\'t rust, even after thousands of years',
      ],
    },
    {
      name: 'Silver',
      symbol: 'Ag',
      atomicNumber: 47,
      type: 'metal',
      color: '#BDC3C7', // Silver color
      properties: [
        'Best conductor of electricity',
        'Shiny white metal',
        'Antimicrobial properties',
        'Very malleable and ductile',
      ],
      uses: [
        'Jewelry and silverware',
        'Photography and X-rays',
        'Electronics and solar panels',
        'Antibacterial coatings',
      ],
      funFacts: [
        'Silver kills bacteria naturally!',
        'One ounce of silver can be stretched into a wire 8,000 feet long',
      ],
    },
  ],

  medium: [
    // Include all easy elements plus additional ones
    {
      name: 'Nitrogen',
      symbol: 'N',
      atomicNumber: 7,
      type: 'nonmetal',
      color: '#9B59B6', // Purple for nitrogen
      properties: [
        'Makes up 78% of Earth\'s atmosphere',
        'Colorless and odorless gas',
        'Relatively unreactive',
        'Essential for proteins and DNA',
      ],
      uses: [
        'Fertilizers for plants',
        'Food preservation',
        'Making ammonia',
        'Liquid nitrogen for cooling',
      ],
      funFacts: [
        'The air you breathe is mostly nitrogen!',
        'Lightning helps convert nitrogen for plants to use',
      ],
    },
    {
      name: 'Copper',
      symbol: 'Cu',
      atomicNumber: 29,
      type: 'metal',
      color: '#D35400', // Copper color
      properties: [
        'Excellent conductor of electricity',
        'Reddish-brown metal',
        'Antimicrobial properties',
        'Forms green patina when oxidized',
      ],
      uses: [
        'Electrical wiring',
        'Plumbing pipes',
        'Coins and decorations',
        'Cooking pots and pans',
      ],
      funFacts: [
        'The Statue of Liberty is made of copper!',
        'Copper was one of the first metals used by humans',
      ],
    },
    {
      name: 'Aluminum',
      symbol: 'Al',
      atomicNumber: 13,
      type: 'metal',
      color: '#85C1E9', // Light blue for aluminum
      properties: [
        'Lightweight and strong',
        'Does not rust',
        'Good conductor of heat',
        'Most abundant metal in Earth\'s crust',
      ],
      uses: ['Soda cans and foil', 'Airplane parts', 'Kitchen cookware', 'Building materials'],
      funFacts: [
        'Aluminum is recycled more than any other metal!',
        'It was once more valuable than gold',
      ],
    },
  ],

  hard: [
    // Include all previous elements plus advanced ones
    {
      name: 'Helium',
      symbol: 'He',
      atomicNumber: 2,
      type: 'noble gas',
      color: '#FFF700', // Yellow for helium
      properties: [
        'Second lightest element',
        'Cannot form chemical compounds',
        'Liquid helium is the coldest liquid',
        'Non-toxic and non-flammable',
      ],
      uses: [
        'Party balloons',
        'Deep-sea diving gas mixtures',
        'Cooling superconducting magnets',
        'Leak detection',
      ],
      funFacts: [
        'Helium makes your voice sound funny!',
        'It was first discovered on the Sun before Earth',
      ],
    },
    {
      name: 'Uranium',
      symbol: 'U',
      atomicNumber: 92,
      type: 'metal',
      color: '#2ECC71', // Green for uranium
      properties: [
        'Radioactive element',
        'Very heavy metal',
        'Naturally occurring',
        'Can undergo nuclear fission',
      ],
      uses: [
        'Nuclear power plants',
        'Nuclear medicine',
        'Dating ancient rocks',
        'Nuclear submarines',
      ],
      funFacts: [
        'Uranium glows green under UV light!',
        'One uranium pellet has as much energy as a ton of coal',
      ],
    },
  ],
};

/**
 * Get elements for specified difficulty level
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Array} Array of element objects
 */
export function getElementsForDifficulty(difficulty) {
  switch (difficulty) {
  case 'easy':
    return [...elementDatabase.easy];
  case 'medium':
    return [...elementDatabase.easy, ...elementDatabase.medium];
  case 'hard':
    return [...elementDatabase.easy, ...elementDatabase.medium, ...elementDatabase.hard];
  default:
    return [...elementDatabase.easy];
  }
}

/**
 * Get random elements for a game round
 * @param {string} difficulty - Difficulty level
 * @param {number} count - Number of elements to return
 * @returns {Array} Random selection of elements
 */
export function getRandomElements(difficulty, count = 6) {
  const allElements = getElementsForDifficulty(difficulty);
  const shuffled = [...allElements].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, allElements.length));
}

/**
 * Get element by symbol
 * @param {string} symbol - Chemical symbol
 * @returns {Object|null} Element object or null if not found
 */
export function getElementBySymbol(symbol) {
  const allElements = [...elementDatabase.easy, ...elementDatabase.medium, ...elementDatabase.hard];
  return allElements.find(element => element.symbol === symbol) || null;
}

/**
 * Get elements by type
 * @param {string} type - Element type ('metal', 'nonmetal', 'noble gas')
 * @param {string} difficulty - Difficulty level
 * @returns {Array} Elements of specified type
 */
export function getElementsByType(type, difficulty = 'easy') {
  const elements = getElementsForDifficulty(difficulty);
  return elements.filter(element => element.type === type);
}

/**
 * Periodic table color scheme for element types
 */
export const elementTypeColors = {
  metal: '#3498DB', // Blue
  nonmetal: '#E74C3C', // Red
  'noble gas': '#F39C12', // Orange
  metalloid: '#9B59B6', // Purple
};

/**
 * Match type definitions for different rounds
 */
export const matchTypes = {
  symbol: {
    name: 'Symbol Match',
    description: 'Match each element with its chemical symbol',
    getQuestion: element => element.name,
    getAnswer: element => element.symbol,
    instruction: 'Match the element names with their chemical symbols',
  },
  atomicNumber: {
    name: 'Atomic Number',
    description: 'Match each element with its atomic number',
    getQuestion: element => element.name,
    getAnswer: element => element.atomicNumber.toString(),
    instruction: 'Match the elements with their atomic numbers',
  },
  property: {
    name: 'Properties',
    description: 'Match each element with one of its properties',
    getQuestion: element => element.name,
    getAnswer: element => element.properties[Math.floor(Math.random() * element.properties.length)],
    instruction: 'Match the elements with their properties',
  },
  use: {
    name: 'Uses',
    description: 'Match each element with one of its common uses',
    getQuestion: element => element.name,
    getAnswer: element => element.uses[Math.floor(Math.random() * element.uses.length)],
    instruction: 'Match the elements with their common uses',
  },
  type: {
    name: 'Element Type',
    description: 'Match each element with its type',
    getQuestion: element => element.name,
    getAnswer: element => element.type,
    instruction: 'Match the elements with their types (metal, nonmetal, etc.)',
  },
};

export default elementDatabase;
