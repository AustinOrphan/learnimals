// Math subject functionality

// Educational tools and games for children
const difficulty = [
  'easy', 'medium', 'hard',
  'very-easy', 'basic', 'beginner',
  'intermediate', 'advanced',
  'expert', 'graduate-level'
];
const basicLevels = ['Place Value', 'Counting', 'Addition', 'Subtraction', 'Multiplication', 'Division'];
const intermediateLevels = ['Fractions', 'Decimals', 'Percentages', 'Algebra Basics', 'Geometry Basics'];
const advancedLevels = ['Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Calculus'];
const expertLevels = ['Advanced Calculus', 'Complex Analysis', 'Linear Algebra', 'Differential Equations'];

// TODO: Game features to be implemented
const words = ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Fractions', 'Decimals', 'Percentages', 'Exponents'];

console.log('Math games loaded');
console.log(words);

// Export features for other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { difficulty, basicLevels, intermediateLevels, advancedLevels, expertLevels };
}