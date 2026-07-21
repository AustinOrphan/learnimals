// Animals subject page: a gallery of the mascot animals plus a hash-routed
// "meet" view (greeting reaction, tap-to-reveal facts, a 3-question quiz).
// Pure logic lives in animalsHelpers.js so it can be unit-tested.
import { animalsContent } from '/data/animalsContent.js';
import { mascots } from '/data/mascotsContent.js';
import { generateCharacterMessage } from '/utils/characterIntegration.js';
import {
  buildAnimals,
  resolveSpecies,
  shuffle,
  scoreQuiz,
} from '/subjects/animals/animalsHelpers.js';

const animals = buildAnimals(animalsContent, mascots);
const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Render the gallery of animal cards. */
function renderGallery() {
  const gallery = document.getElementById('animals-gallery');
  const meet = document.getElementById('animal-meet');
  if (!gallery) return;
  meet?.setAttribute('hidden', '');
  gallery.removeAttribute('hidden');
  gallery.innerHTML = '';

  for (const a of animals) {
    const card = document.createElement('a');
    card.className = 'animal-card';
    card.href = `#${a.species}`;
    card.setAttribute('aria-label', `Meet ${a.name} the ${a.type}`);
    card.innerHTML = `
      <img src="${a.image}" alt="${a.name} the ${a.type}" />
      <span class="animal-card-name">${a.name}</span>
      <span class="animal-card-kind">the ${a.type}</span>`;
    gallery.appendChild(card);
  }
}

/** Render the meet view for one animal. */
function renderMeet(animal) {
  const gallery = document.getElementById('animals-gallery');
  const meet = document.getElementById('animal-meet');
  if (!meet) return;
  gallery?.setAttribute('hidden', '');
  meet.removeAttribute('hidden');
  meet.innerHTML = '';

  const back = document.createElement('a');
  back.className = 'meet-back';
  back.href = '#';
  back.textContent = '← Back to all animals';
  meet.appendChild(back);

  const hero = document.createElement('div');
  hero.className = 'meet-hero';
  hero.innerHTML = `
    <button type="button" class="meet-art ${animal.reaction.animation}" aria-label="Say hello to ${animal.name}">
      <img src="${animal.image}" alt="${animal.name} the ${animal.type}" />
    </button>
    <h2 tabindex="-1" id="meet-heading">${animal.name} the ${animal.type}</h2>
    <p class="meet-role">${animal.role}</p>
    <p class="meet-speech" id="meet-speech" aria-live="polite"></p>`;
  meet.appendChild(hero);

  // Tap the art → playful reaction + a personality greeting.
  const artBtn = hero.querySelector('.meet-art');
  const speech = hero.querySelector('#meet-speech');
  const react = () => {
    speech.textContent = generateCharacterMessage(animal.mascot, 'greeting');
    if (prefersReducedMotion()) return;
    artBtn.classList.remove('reacting');
    // reflow so the animation can retrigger on repeated taps
    void artBtn.offsetWidth;
    artBtn.classList.add('reacting');
  };
  artBtn.addEventListener('click', react);
  artBtn.addEventListener('animationend', () => artBtn.classList.remove('reacting'));

  renderFacts(meet, animal);
  renderQuiz(meet, animal);

  // Move focus to the heading for screen-reader users.
  hero.querySelector('#meet-heading')?.focus();
  window.scrollTo({ top: 0 });
}

/** Fun facts as tap-to-reveal cards. */
function renderFacts(meet, animal) {
  const section = document.createElement('section');
  section.className = 'animal-facts';
  section.innerHTML = `<h3>${animal.reaction.emoji} Fun Facts</h3>`;
  for (const fact of animal.facts) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fact-card';
    btn.innerHTML = `<span class="fact-prompt">Tap to reveal a fun fact ✨</span><span class="fact-text">${fact}</span>`;
    btn.addEventListener('click', () => btn.classList.add('revealed'));
    section.appendChild(btn);
  }
  meet.appendChild(section);
}

/** A 3-question quiz with shuffled options, scored on submit. */
function renderQuiz(meet, animal) {
  const section = document.createElement('section');
  section.className = 'animal-quiz';
  section.innerHTML = `<h3>🧠 ${animal.name}'s Quiz</h3>`;
  const form = document.createElement('form');
  form.id = 'quiz-form';
  const questions = document.createElement('div');
  questions.id = 'quiz-questions';

  animal.quiz.forEach((q, i) => {
    const block = document.createElement('fieldset');
    block.className = 'quiz-question';
    block.dataset.index = String(i);
    const legend = document.createElement('legend');
    legend.className = 'quiz-prompt';
    legend.textContent = `${i + 1}. ${q.question}`;
    block.appendChild(legend);
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
    questions.appendChild(block);
  });

  form.appendChild(questions);
  form.insertAdjacentHTML(
    'beforeend',
    '<button type="submit" class="quiz-submit-button">Check Answers</button><p id="quiz-result" aria-live="polite"></p>'
  );
  section.appendChild(form);
  meet.appendChild(section);

  form.addEventListener('submit', e => {
    e.preventDefault();
    checkQuiz(animal.quiz);
  });
}

/** Score the quiz and mark each question right/wrong. */
function checkQuiz(quiz) {
  const result = document.getElementById('quiz-result');
  if (!result) return;
  const answers = {};
  quiz.forEach((q, i) => {
    const block = document.querySelector(`.quiz-question[data-index="${i}"]`);
    block?.classList.remove('correct', 'incorrect');
    const chosen = document.querySelector(`input[name="q${i}"]:checked`);
    if (chosen) answers[i] = chosen.value;
  });

  const { answered, correct, total } = scoreQuiz(quiz, answers);
  if (answered < total) {
    result.textContent = 'Please answer every question first!';
    result.className = 'quiz-result-missing';
    return;
  }
  quiz.forEach((q, i) => {
    const block = document.querySelector(`.quiz-question[data-index="${i}"]`);
    block?.classList.add(answers[i] === q.answer ? 'correct' : 'incorrect');
  });
  const perfect = correct === total;
  result.textContent = perfect
    ? `Amazing! You got all ${total} right! 🎉`
    : `You got ${correct} out of ${total}. Great try — check the answers and try again!`;
  result.className = perfect ? 'quiz-result-success' : 'quiz-result-partial';
}

/** Route based on the current hash: a known species → meet view, else gallery. */
function route() {
  const animal = resolveSpecies(window.location.hash, animals);
  if (animal) renderMeet(animal);
  else renderGallery();
}

function init() {
  window.addEventListener('hashchange', route);
  route();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
