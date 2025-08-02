// Sentence Database for Sentence Builder Game
// Educational sentences organized by difficulty level for reading comprehension

/**
 * Comprehensive sentence database for teaching grammar and sentence structure
 * Each sentence includes words, correct order, category, and educational hints
 */

export const sentenceDatabase = {
  easy: [
    {
      id: 'easy-1',
      words: ['The', 'cat', 'sits'],
      correctOrder: ['The', 'cat', 'sits'],
      category: 'animals',
      hint: 'What is the cat doing?',
      explanation: 'A simple sentence with a subject (cat) and verb (sits).',
      image: '🐱',
    },
    {
      id: 'easy-2',
      words: ['Dogs', 'run', 'fast'],
      correctOrder: ['Dogs', 'run', 'fast'],
      category: 'animals',
      hint: 'How do dogs move?',
      explanation: 'Dogs are the subject, run is the action, fast describes how.',
      image: '🐕',
    },
    {
      id: 'easy-3',
      words: ['Birds', 'can', 'fly'],
      correctOrder: ['Birds', 'can', 'fly'],
      category: 'animals',
      hint: 'What special ability do birds have?',
      explanation: 'This sentence shows what birds are able to do.',
      image: '🐦',
    },
    {
      id: 'easy-4',
      words: ['I', 'like', 'books'],
      correctOrder: ['I', 'like', 'books'],
      category: 'school',
      hint: 'What do you enjoy reading?',
      explanation: 'This expresses a personal preference.',
      image: '📚',
    },
    {
      id: 'easy-5',
      words: ['The', 'sun', 'shines'],
      correctOrder: ['The', 'sun', 'shines'],
      category: 'nature',
      hint: 'What does the sun do during the day?',
      explanation: 'The sun is the subject that performs the action of shining.',
      image: '☀️',
    },
    {
      id: 'easy-6',
      words: ['Fish', 'swim', 'well'],
      correctOrder: ['Fish', 'swim', 'well'],
      category: 'animals',
      hint: 'How do fish move in water?',
      explanation: 'Fish swim, and they do it well.',
      image: '🐟',
    },
  ],

  medium: [
    {
      id: 'medium-1',
      words: ['The', 'red', 'bird', 'flies', 'high'],
      correctOrder: ['The', 'red', 'bird', 'flies', 'high'],
      category: 'animals',
      hint: 'What color is the bird, and where does it fly?',
      explanation: 'Adjective (red) describes the bird, adverb (high) describes how it flies.',
      image: '🐦',
    },
    {
      id: 'medium-2',
      words: ['Children', 'play', 'in', 'the', 'park'],
      correctOrder: ['Children', 'play', 'in', 'the', 'park'],
      category: 'family',
      hint: 'Where do children have fun?',
      explanation: 'The prepositional phrase "in the park" tells us where.',
      image: '🏞️',
    },
    {
      id: 'medium-3',
      words: ['My', 'mom', 'cooks', 'delicious', 'dinner'],
      correctOrder: ['My', 'mom', 'cooks', 'delicious', 'dinner'],
      category: 'family',
      hint: 'Who makes tasty food?',
      explanation: 'Possessive (my) shows ownership, adjective (delicious) describes dinner.',
      image: '🍽️',
    },
    {
      id: 'medium-4',
      words: ['The', 'blue', 'ocean', 'waves', 'gently'],
      correctOrder: ['The', 'blue', 'ocean', 'waves', 'gently'],
      category: 'nature',
      hint: 'How does the ocean move?',
      explanation: 'The ocean is blue and it waves in a gentle way.',
      image: '🌊',
    },
    {
      id: 'medium-5',
      words: ['Students', 'read', 'interesting', 'stories', 'daily'],
      correctOrder: ['Students', 'read', 'interesting', 'stories', 'daily'],
      category: 'school',
      hint: 'What do students do with books every day?',
      explanation: 'Students is the subject, daily tells us when they read.',
      image: '📖',
    },
    {
      id: 'medium-6',
      words: ['The', 'happy', 'children', 'laugh', 'loudly'],
      correctOrder: ['The', 'happy', 'children', 'laugh', 'loudly'],
      category: 'emotions',
      hint: 'How do joyful kids express themselves?',
      explanation: 'Happy describes the children, loudly describes how they laugh.',
      image: '😊',
    },
  ],

  hard: [
    {
      id: 'hard-1',
      words: [
        'The',
        'beautiful',
        'butterfly',
        'landed',
        'gently',
        'on',
        'the',
        'colorful',
        'flower',
      ],
      correctOrder: [
        'The',
        'beautiful',
        'butterfly',
        'landed',
        'gently',
        'on',
        'the',
        'colorful',
        'flower',
      ],
      category: 'nature',
      hint: 'Where did the pretty insect rest softly?',
      explanation:
        'Multiple adjectives (beautiful, colorful) and an adverb (gently) with a prepositional phrase.',
      image: '🦋',
    },
    {
      id: 'hard-2',
      words: [
        'The',
        'curious',
        'young',
        'scientist',
        'carefully',
        'examined',
        'the',
        'mysterious',
        'specimen',
      ],
      correctOrder: [
        'The',
        'curious',
        'young',
        'scientist',
        'carefully',
        'examined',
        'the',
        'mysterious',
        'specimen',
      ],
      category: 'science',
      hint: 'How did the researcher study the unknown sample?',
      explanation: 'Complex sentence with multiple adjectives and an adverb describing the action.',
      image: '🔬',
    },
    {
      id: 'hard-3',
      words: [
        'During',
        'the',
        'storm',
        'the',
        'brave',
        'firefighters',
        'rescued',
        'families',
        'safely',
      ],
      correctOrder: [
        'During',
        'the',
        'storm',
        'the',
        'brave',
        'firefighters',
        'rescued',
        'families',
        'safely',
      ],
      category: 'community',
      hint: 'When did the heroes help people?',
      explanation:
        'Prepositional phrase at the beginning sets the time, adverb at the end describes how.',
      image: '🚒',
    },
    {
      id: 'hard-4',
      words: ['The', 'ancient', 'oak', 'tree', 'has', 'stood', 'majestically', 'for', 'centuries'],
      correctOrder: [
        'The',
        'ancient',
        'oak',
        'tree',
        'has',
        'stood',
        'majestically',
        'for',
        'centuries',
      ],
      category: 'nature',
      hint: 'How long has the old tree been standing proudly?',
      explanation: 'Present perfect tense with adverb and prepositional phrase showing duration.',
      image: '🌳',
    },
    {
      id: 'hard-5',
      words: [
        'After',
        'studying',
        'hard',
        'the',
        'determined',
        'student',
        'passed',
        'the',
        'difficult',
        'exam',
      ],
      correctOrder: [
        'After',
        'studying',
        'hard',
        'the',
        'determined',
        'student',
        'passed',
        'the',
        'difficult',
        'exam',
      ],
      category: 'school',
      hint: 'What happened when the student worked really hard?',
      explanation: 'Complex sentence starting with a dependent clause about cause and effect.',
      image: '📝',
    },
    {
      id: 'hard-6',
      words: [
        'The',
        'talented',
        'orchestra',
        'performed',
        'beautifully',
        'while',
        'the',
        'audience',
        'listened',
        'quietly',
      ],
      correctOrder: [
        'The',
        'talented',
        'orchestra',
        'performed',
        'beautifully',
        'while',
        'the',
        'audience',
        'listened',
        'quietly',
      ],
      category: 'arts',
      hint: 'What did the musicians and listeners do at the same time?',
      explanation: 'Compound sentence with two independent clauses connected by "while".',
      image: '🎵',
    },
  ],
};

/**
 * Get sentences for specified difficulty level
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Array} Array of sentence objects
 */
export function getSentencesForDifficulty(difficulty) {
  switch (difficulty) {
  case 'easy':
    return [...sentenceDatabase.easy];
  case 'medium':
    return [...sentenceDatabase.easy, ...sentenceDatabase.medium];
  case 'hard':
    return [...sentenceDatabase.easy, ...sentenceDatabase.medium, ...sentenceDatabase.hard];
  default:
    return [...sentenceDatabase.easy];
  }
}

/**
 * Get random sentences for a game session
 * @param {string} difficulty - Difficulty level
 * @param {number} count - Number of sentences to return
 * @returns {Array} Random selection of sentences
 */
export function getRandomSentences(difficulty, count = 5) {
  const allSentences = getSentencesForDifficulty(difficulty);
  const shuffled = [...allSentences].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, allSentences.length));
}

/**
 * Get sentence by ID
 * @param {string} id - Sentence ID
 * @returns {Object|null} Sentence object or null if not found
 */
export function getSentenceById(id) {
  const allSentences = [
    ...sentenceDatabase.easy,
    ...sentenceDatabase.medium,
    ...sentenceDatabase.hard,
  ];
  return allSentences.find(sentence => sentence.id === id) || null;
}

/**
 * Get sentences by category
 * @param {string} category - Category name
 * @param {string} difficulty - Difficulty level
 * @returns {Array} Sentences of specified category
 */
export function getSentencesByCategory(category, difficulty = 'easy') {
  const sentences = getSentencesForDifficulty(difficulty);
  return sentences.filter(sentence => sentence.category === category);
}

/**
 * Validate sentence order
 * @param {Array} userOrder - User's word arrangement
 * @param {Array} correctOrder - Correct word order
 * @returns {Object} Validation result with details
 */
export function validateSentenceOrder(userOrder, correctOrder) {
  const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);

  const result = {
    isCorrect,
    score: 0,
    feedback: '',
  };

  if (isCorrect) {
    result.score = 100;
    result.feedback = 'Perfect! You built the sentence correctly!';
  } else {
    // Calculate partial score based on correct positions
    let correctPositions = 0;
    for (let i = 0; i < Math.min(userOrder.length, correctOrder.length); i++) {
      if (userOrder[i] === correctOrder[i]) {
        correctPositions++;
      }
    }
    result.score = Math.round((correctPositions / correctOrder.length) * 100);
    result.feedback = `${correctPositions} out of ${correctOrder.length} words are in the right place. Keep trying!`;
  }

  return result;
}

/**
 * Shuffle array of words
 * @param {Array} words - Array of words to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleWords(words) {
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Grammar categories for educational feedback
 */
export const grammarCategories = {
  articles: ['The', 'A', 'An'],
  nouns: ['cat', 'dog', 'bird', 'children', 'sun', 'book', 'tree', 'flower'],
  verbs: ['sits', 'run', 'fly', 'like', 'shines', 'swim', 'play', 'cooks'],
  adjectives: ['red', 'blue', 'beautiful', 'happy', 'delicious', 'ancient'],
  adverbs: ['fast', 'well', 'high', 'gently', 'carefully', 'quietly'],
  prepositions: ['in', 'on', 'at', 'during', 'after', 'while'],
};

/**
 * Get grammar category for a word
 * @param {string} word - Word to categorize
 * @returns {string} Grammar category
 */
export function getGrammarCategory(word) {
  for (const [category, words] of Object.entries(grammarCategories)) {
    if (words.includes(word.toLowerCase())) {
      return category;
    }
  }
  return 'unknown';
}

export default sentenceDatabase;
