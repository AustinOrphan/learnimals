// Full number to words converter (supports large numbers) with formatting
function convertNumber() {
  const numStr = document.getElementById('numberInput').value;
  const num = parseInt(numStr);
  const output = document.getElementById('numberOutput');

  if (isNaN(num) || num < 0) {
    output.innerText = "Please enter a valid non-negative number.";
    return;
  }

  const formattedNumber = Number(numStr).toLocaleString();
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const scales = ["", "thousand", "million", "billion", "trillion", "quadrillion", "quintillion", "sextillion", "septillion", "octillion", "nonillion"];

  function chunkToWords(chunk) {
    let word = "";
    const hundred = Math.floor(chunk / 100);
    const remainder = chunk % 100;

    if (hundred) {
      word += ones[hundred] + " hundred ";
    }
    if (remainder >= 10 && remainder < 20) {
      word += teens[remainder - 10] + " ";
    } else {
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;
      if (ten) word += tens[ten] + " ";
      if (one) word += ones[one] + " ";
    }
    return word.trim();
  }

  function numberToWords(n) {
    if (n === 0) return "zero";

    const chunks = [];
    while (n > 0) {
      chunks.push(n % 1000);
      n = Math.floor(n / 1000);
    }

    let words = [];
    for (let i = chunks.length - 1; i >= 0; i--) {
      if (chunks[i] !== 0) {
        words.push(chunkToWords(chunks[i]) + (scales[i] ? " " + scales[i] : ""));
      }
    }
    return words.join(", ").trim();
  }

  const words = numberToWords(num);
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);

  output.innerHTML = `<strong>${formattedNumber}</strong><br>${capitalized}`;
}