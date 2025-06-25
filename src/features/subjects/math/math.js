// Math subject functionality

// Full number to words converter (supports large numbers) with formatting
// This function is called from math.html via onclick attribute and must be globally available
function convertNumber() {
  const numStr = document.getElementById('numberInput').value;
  const num = parseInt(numStr);
  const output = document.getElementById('numberOutput');

  if (isNaN(num) || num < 0) {
    output.innerText = 'Please enter a valid non-negative number.';
    return;
  }

  const formattedNumber = Number(numStr).toLocaleString();
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const scales = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion'];

  function chunkToWords(chunk) {
    let word = '';
    const hundred = Math.floor(chunk / 100);
    const remainder = chunk % 100;

    if (hundred) {
      word += ones[hundred] + ' hundred ';
    }
    if (remainder >= 10 && remainder < 20) {
      word += teens[remainder - 10] + ' ';
    } else {
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;
      if (ten) word += tens[ten] + ' ';
      if (one) word += ones[one] + ' ';
    }
    return word.trim();
  }

  function numberToWords(n) {
    if (n === 0) return 'zero';

    const chunks = [];
    while (n > 0) {
      chunks.push(n % 1000);
      n = Math.floor(n / 1000);
    }

    const wordParts = [];
    for (let i = chunks.length - 1; i >= 0; i--) {
      if (chunks[i] !== 0) {
        wordParts.push(chunkToWords(chunks[i]) + (scales[i] ? ' ' + scales[i] : ''));
      }
    }
    return wordParts.join(', ').trim();
  }

  const wordsResult = numberToWords(num);
  const capitalized = wordsResult.charAt(0).toUpperCase() + wordsResult.slice(1);

  output.innerHTML = `<strong>${formattedNumber}</strong><br>${capitalized}`;
}

// Make convertNumber globally available for HTML usage
window.convertNumber = convertNumber;

// Educational tools and games for children - check if already defined to avoid redeclaration
if (typeof window.mathDifficulty === 'undefined') {
  window.mathDifficulty = [
    'easy', 'medium', 'hard',
    'very-easy', 'basic', 'beginner',
    'intermediate', 'advanced',
    'expert', 'graduate-level'
  ];
}

if (typeof window.mathBasicLevels === 'undefined') {
  window.mathBasicLevels = ['Place Value', 'Counting', 'Addition', 'Subtraction', 'Multiplication', 'Division'];
}

if (typeof window.mathIntermediateLevels === 'undefined') {
  window.mathIntermediateLevels = ['Fractions', 'Decimals', 'Percentages', 'Algebra Basics', 'Geometry Basics'];
}

if (typeof window.mathAdvancedLevels === 'undefined') {
  window.mathAdvancedLevels = ['Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Calculus'];
}

if (typeof window.mathExpertLevels === 'undefined') {
  window.mathExpertLevels = ['Advanced Calculus', 'Complex Analysis', 'Linear Algebra', 'Differential Equations'];
}

// TODO: Game features to be implemented
if (typeof window.mathWords === 'undefined') {
  window.mathWords = ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Fractions', 'Decimals', 'Percentages', 'Exponents'];
}

console.log('Math games loaded');
console.log(window.mathWords);

// Export features for other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    difficulty: window.mathDifficulty, 
    basicLevels: window.mathBasicLevels, 
    intermediateLevels: window.mathIntermediateLevels, 
    advancedLevels: window.mathAdvancedLevels, 
    expertLevels: window.mathExpertLevels 
  };
}