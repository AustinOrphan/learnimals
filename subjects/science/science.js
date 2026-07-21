// Science page: renders random verified facts, the space zone, and a scored
// quiz from the content bank in /data/scienceContent.js.
import { scienceFacts, spaceFacts, planets, scienceQuiz } from '/data/scienceContent.js';

const FACTS_SHOWN = 4;
const QUIZ_QUESTIONS = 5;

let currentQuiz = [];

/** Return a new array shuffled (Fisher–Yates). */
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `n` random items from an array. */
function sample(array, n) {
  return shuffle(array).slice(0, n);
}

/** "Did You Know?" — show a fresh handful of facts. */
function renderFacts() {
  const list = document.getElementById('facts-list');
  if (!list) return;
  list.innerHTML = '';
  for (const fact of sample(scienceFacts, FACTS_SHOWN)) {
    const span = document.createElement('span');
    span.textContent = fact.text;
    list.appendChild(span);
  }
}

/** Space Zone — one rotating space fact. */
function renderSpaceFact() {
  const el = document.getElementById('space-fact');
  if (!el) return;
  el.textContent = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
}

/** Space Zone — the eight planets as cards. */
function renderPlanets() {
  const grid = document.getElementById('planet-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const planet of planets) {
    const card = document.createElement('div');
    card.className = 'planet-card';
    card.innerHTML = `
      <div class="planet-emoji" aria-hidden="true">${planet.emoji}</div>
      <div class="planet-name">${planet.name}</div>
      <div class="planet-fact">${planet.fact}</div>`;
    grid.appendChild(card);
  }
}

/** Quiz — pick fresh questions and render them with shuffled options. */
function renderQuiz() {
  const container = document.getElementById('quiz-questions');
  const result = document.getElementById('quiz-result');
  if (!container) return;
  if (result) {
    result.textContent = '';
    result.className = '';
  }

  currentQuiz = sample(scienceQuiz, QUIZ_QUESTIONS);
  container.innerHTML = '';

  currentQuiz.forEach((q, i) => {
    const block = document.createElement('div');
    block.className = 'quiz-question';
    block.dataset.index = String(i);

    const prompt = document.createElement('p');
    prompt.className = 'quiz-prompt';
    prompt.textContent = `${i + 1}. ${q.question}`;
    block.appendChild(prompt);

    for (const option of shuffle(q.options)) {
      const label = document.createElement('label');
      label.className = 'quiz-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${i}`;
      input.value = option;
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + option));
      block.appendChild(label);
    }
    container.appendChild(block);
  });
}

/** Score the current quiz and mark each question right/wrong. */
function checkQuiz() {
  const result = document.getElementById('quiz-result');
  if (!result) return;

  let answered = 0;
  let correct = 0;

  currentQuiz.forEach((q, i) => {
    const block = document.querySelector(`.quiz-question[data-index="${i}"]`);
    if (!block) return;
    block.classList.remove('correct', 'incorrect');
    const chosen = document.querySelector(`input[name="q${i}"]:checked`);
    if (!chosen) return;
    answered += 1;
    if (chosen.value === q.answer) {
      correct += 1;
      block.classList.add('correct');
    } else {
      block.classList.add('incorrect');
    }
  });

  if (answered < currentQuiz.length) {
    result.textContent = 'Please answer every question first!';
    result.className = 'quiz-result-missing';
    return;
  }

  const perfect = correct === currentQuiz.length;
  result.textContent = perfect
    ? `Amazing! You got all ${currentQuiz.length} right! 🎉`
    : `You got ${correct} out of ${currentQuiz.length}. Great try — check the answers and play again!`;
  result.className = perfect ? 'quiz-result-success' : 'quiz-result-partial';
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function initSciencePage() {
  renderFacts();
  renderSpaceFact();
  renderPlanets();
  renderQuiz();

  document.getElementById('shuffle-facts')?.addEventListener('click', renderFacts);
  document.getElementById('next-space-fact')?.addEventListener('click', renderSpaceFact);
  document.getElementById('new-quiz')?.addEventListener('click', renderQuiz);
  document.getElementById('quiz-form')?.addEventListener('submit', e => {
    e.preventDefault();
    checkQuiz();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSciencePage);
} else {
  initSciencePage();
}
