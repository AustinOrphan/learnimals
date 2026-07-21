// Dynamic place-value practice and a "build this number" challenge for the
// math place-value page. Questions are generated (not a single static one),
// so kids get endless, self-checking practice.

const PLACES = [
  { name: 'ones', mult: 1 },
  { name: 'tens', mult: 10 },
  { name: 'hundreds', mult: 100 },
  { name: 'thousands', mult: 1000 },
];

const rnd = max => Math.floor(Math.random() * max);
const fmt = n => n.toLocaleString('en-US');

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A random whole number with between `minDigits` and `maxDigits` digits. */
function randomNumber(minDigits = 3, maxDigits = 4) {
  const digits = minDigits + rnd(maxDigits - minDigits + 1);
  let n = 0;
  for (let i = 0; i < digits; i++) {
    const d = i === 0 ? 1 + rnd(9) : rnd(10); // no leading zero
    n = n * 10 + d;
  }
  return n;
}

/** Per-place breakdown of n: [{name, mult, digit, value}] from ones up. */
function placeInfo(n) {
  const s = String(n);
  return [...s].reverse().map((ch, i) => {
    const digit = Number(ch);
    return { ...PLACES[i], digit, value: digit * PLACES[i].mult };
  });
}

/** "What is the value of the digit in the <place> place of N?" */
function valueQuestion(n) {
  const candidates = placeInfo(n).filter(p => p.digit !== 0);
  const p = candidates[rnd(candidates.length)];
  const options = new Set([p.value]);
  for (const place of PLACES) {
    options.add(p.digit * place.mult);
  }
  return {
    q: `What is the value of the digit in the ${p.name} place of ${fmt(n)}?`,
    options: shuffle([...options])
      .slice(0, 4)
      .map(fmt),
    answer: fmt(p.value),
  };
}

/** "Which digit is in the <place> place of N?" */
function digitQuestion(n) {
  const info = placeInfo(n);
  const p = info[rnd(info.length)];
  const options = new Set([p.digit]);
  while (options.size < 4) {
    options.add(rnd(10));
  }
  return {
    q: `Which digit is in the ${p.name} place of ${fmt(n)}?`,
    options: shuffle([...options]).map(String),
    answer: String(p.digit),
  };
}

function nextQuestion() {
  const n = randomNumber(3, 4);
  const make = Math.random() < 0.5 ? valueQuestion : digitQuestion;
  const question = make(n);
  // valueQuestion can occasionally dedupe below 4 options; guarantee the answer is present.
  if (!question.options.includes(question.answer)) {
    question.options[0] = question.answer;
  }
  return question;
}

/** Endless multiple-choice place-value practice with a running score. */
export function initPractice(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="pv-practice">
      <div class="pv-practice-head">
        <span class="pv-score" id="pv-score">Score: 0 / 0</span>
      </div>
      <p class="pv-question" id="pv-question"></p>
      <div class="pv-options" id="pv-options"></div>
      <p class="pv-feedback" id="pv-feedback"></p>
      <button class="pv-next" id="pv-next" type="button">Next question →</button>
    </div>`;

  const qEl = el.querySelector('#pv-question');
  const optsEl = el.querySelector('#pv-options');
  const fbEl = el.querySelector('#pv-feedback');
  const scoreEl = el.querySelector('#pv-score');
  const nextBtn = el.querySelector('#pv-next');

  let score = 0;
  let total = 0;
  let current = null;
  let answered = false;

  function choose(btn, value) {
    if (answered) return;
    answered = true;
    total += 1;
    const correct = value === current.answer;
    if (correct) {
      score += 1;
      btn.classList.add('correct');
      fbEl.textContent = '🎉 Correct!';
      fbEl.className = 'pv-feedback correct';
    } else {
      btn.classList.add('incorrect');
      fbEl.textContent = `Not quite — the answer is ${current.answer}.`;
      fbEl.className = 'pv-feedback incorrect';
      for (const c of optsEl.children) {
        if (c.textContent === current.answer) c.classList.add('correct');
      }
    }
    for (const c of optsEl.children) c.disabled = true;
    scoreEl.textContent = `Score: ${score} / ${total}`;
    nextBtn.style.visibility = 'visible';
  }

  function load() {
    current = nextQuestion();
    answered = false;
    qEl.textContent = current.q;
    fbEl.textContent = '';
    fbEl.className = 'pv-feedback';
    nextBtn.style.visibility = 'hidden';
    optsEl.innerHTML = '';
    for (const opt of current.options) {
      const b = document.createElement('button');
      b.className = 'pv-option';
      b.type = 'button';
      b.textContent = opt;
      b.addEventListener('click', () => choose(b, opt));
      optsEl.appendChild(b);
    }
  }

  nextBtn.addEventListener('click', load);
  load();
}

/**
 * A "build this number" challenge around the PlaceValueManipulative builder.
 * `builder` is the PlaceValueManipulative instance (exposes currentNumber + reset()).
 */
export function initBuildChallenge(containerId, builder) {
  const el = document.getElementById(containerId);
  if (!el || !builder) return;

  el.innerHTML = `
    <div class="pv-challenge">
      <p class="pv-challenge-prompt">🎯 Build this number: <span class="pv-target" id="pv-target"></span></p>
      <div class="pv-challenge-actions">
        <button class="pv-check" id="pv-check" type="button">Check my number</button>
        <button class="pv-newtarget" id="pv-newtarget" type="button">New number</button>
      </div>
      <p class="pv-challenge-feedback" id="pv-challenge-feedback"></p>
    </div>`;

  const targetEl = el.querySelector('#pv-target');
  const fbEl = el.querySelector('#pv-challenge-feedback');
  let target = 0;

  function newTarget() {
    target = randomNumber(2, 3);
    targetEl.textContent = fmt(target);
    fbEl.textContent = '';
    fbEl.className = 'pv-challenge-feedback';
    if (typeof builder.reset === 'function') builder.reset();
  }

  el.querySelector('#pv-check').addEventListener('click', () => {
    const current = builder.currentNumber ?? 0;
    if (current === target) {
      fbEl.textContent = `🎉 Perfect! You built ${fmt(target)}!`;
      fbEl.className = 'pv-challenge-feedback correct';
    } else {
      fbEl.textContent = `You built ${fmt(current)}. Keep adding blocks to reach ${fmt(target)}!`;
      fbEl.className = 'pv-challenge-feedback incorrect';
    }
  });

  el.querySelector('#pv-newtarget').addEventListener('click', newTarget);
  newTarget();
}
