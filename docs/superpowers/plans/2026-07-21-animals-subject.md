# Animals Subject Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a kid-facing "Meet the Animals" subject where children meet each of the 7 mascots (big art + tappable greeting → fun facts → a 3-question quiz), reusing existing infrastructure.

**Architecture:** A normal subject at `subjects/animals/`, built as a **static HTML shell + a data-driven ES module** — following the **Science** page pattern (`subjects/science/`), NOT the `SubjectTemplateLoader` template pattern. Rationale (deliberate refinement of the spec): the template loader rewrites the whole document on load, which is the same re-render race that broke place-value, and a bespoke gallery + hash-routed meet view + quiz doesn't fit the feature-card `subject.html` template. Science *is* one of the "exact patterns Math/Science/Music use" the spec points at, and it already pairs facts + a scored quiz. Single page, hash-routed (`#shark`, `#parrot`, …). Learning content lives in a new `data/animalsContent.js`; mascot identity is extracted into a new `data/mascotsContent.js` and re-exposed by `config.js` so nothing downstream breaks.

**Tech Stack:** Plain ES modules (no framework, no build step), Vitest (jsdom) for unit tests, Playwright for browser e2e. Node 20.15.1.

## Global Constraints

- No framework, no build step, no backend. Static site served from repo root.
- ES modules everywhere; relative imports include the `.js` extension; HTML module scripts use root-absolute `/…` paths. The `@/…` aliases work ONLY in Vitest.
- Children's app (COPPA/child-safety): every fun fact and quiz answer must be accurate, verifiable, kid-friendly, and safe.
- Accessibility is first-class: real focusable links/buttons with aria-labels; quiz as labelled radio groups; all motion gated behind `prefers-reduced-motion`; focus moves to the meet-view heading on navigation; color only via semantic theme variables (`--text-primary`, `--bg-card`, `--accent-primary`), never raw colors in new CSS where a variable exists.
- Reaction has NO audio in v1 (no audio assets): reaction = CSS animation + emoji only.
- Style: 2-space indent, single quotes, semicolons; Prettier printWidth 100 (HTML/CSS 120). Conventional Commits **with scope**, no emoji. **Never** add a `Co-Authored-By` line (per CLAUDE.local.md).
- Commands run from `/home/dev/src/learnimals`. Single Vitest file: `npx vitest run <path>`. Full unit run: `npm run test:all`. Lint: `npm run lint`.

---

### Task 1: Extract mascot identity data into `data/mascotsContent.js`

Move the 7 `character` objects out of `config.js` into a dedicated, well-named file, and have `config.js` re-expose them so every existing consumer (`utils/subjectEducators.js`, `utils/characterIntegration.js`, homepage, About grid) keeps resolving `config.subjects.<key>.character` **unchanged**.

**Files:**
- Create: `data/mascotsContent.js`
- Modify: `config.js` (replace the 7 inline `character: { … }` literals with references)
- Test: `tests/unit/mascotsContent.test.js`

**Interfaces:**
- Produces: `export const mascots` — an object keyed by subject key (`math`, `science`, `reading`, `art`, `coding`, `music`, `geography`); each value is the character object `{ name, type, species, image, role, personality: { traits, learningStyle, teachingApproach, favoriteActivities, catchphrase, voiceStyle }, colors: { primary, secondary, accent } }`. `export default mascots` as well.
- Consumes: nothing.

- [ ] **Step 1: Write the failing test**

`tests/unit/mascotsContent.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { mascots } from '../../data/mascotsContent.js';
import config from '../../config.js';

const SUBJECT_KEYS = ['math', 'science', 'reading', 'art', 'coding', 'music', 'geography'];

describe('mascotsContent', () => {
  it('exports a mascot for every subject key', () => {
    expect(Object.keys(mascots).sort()).toEqual([...SUBJECT_KEYS].sort());
  });

  it('every mascot has the fields the app relies on', () => {
    for (const key of SUBJECT_KEYS) {
      const m = mascots[key];
      expect(m.name, key).toBeTruthy();
      expect(m.type, key).toBeTruthy();
      expect(m.species, key).toBeTruthy();
      expect(m.image, key).toMatch(/^\/public\/images\//);
      expect(m.personality.traits.enthusiasm, key).toBeTypeOf('number');
      expect(m.personality.catchphrase, key).toBeTruthy();
    }
  });

  it('config re-exposes the same mascot objects (non-breaking refactor)', () => {
    for (const key of SUBJECT_KEYS) {
      expect(config.subjects[key].character, key).toBe(mascots[key]);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/mascotsContent.test.js`
Expected: FAIL — cannot resolve `../../data/mascotsContent.js` (file does not exist yet).

- [ ] **Step 3: Create `data/mascotsContent.js`**

Move the 7 character objects verbatim out of `config.js`. The file:

```js
// Mascot identity data for the 7 Learnimals subject characters.
// Extracted from config.js so both config (via re-export) and the Animals
// subject can share a single source of truth. "Mascots" (not "characters")
// deliberately distinguishes these from the user-avatar character-generation
// system (character-generation/, data/characterSchema.js).

export const mascots = {
  math: {
    name: 'Mango',
    type: 'Shark',
    species: 'shark',
    image: '/public/images/math-shark.png',
    role: 'Math Expert',
    personality: {
      traits: { enthusiasm: 75, patience: 85, curiosity: 70, playfulness: 60, confidence: 80, empathy: 70 },
      learningStyle: 'analytical',
      teachingApproach: 'step-by-step',
      favoriteActivities: ['problem-solving', 'pattern-recognition', 'calculation-games'],
      catchphrase: "Let's dive into numbers!",
      voiceStyle: 'confident',
    },
    colors: { primary: '#4a90e2', secondary: '#2171b5', accent: '#08519c' },
  },
  science: {
    name: 'Sky',
    type: 'Parrot',
    species: 'parrot',
    image: '/public/images/science-parrot.png',
    role: 'Science Specialist',
    personality: {
      traits: { enthusiasm: 95, patience: 70, curiosity: 100, playfulness: 85, confidence: 80, empathy: 75 },
      learningStyle: 'experimental',
      teachingApproach: 'hands-on',
      favoriteActivities: ['experiments', 'discovery', 'exploration'],
      catchphrase: "Let's explore and discover!",
      voiceStyle: 'excited',
    },
    colors: { primary: '#7ed321', secondary: '#5cb85c', accent: '#449d44' },
  },
  reading: {
    name: 'Ruby',
    type: 'Panda',
    species: 'panda',
    image: '/public/images/reading-panda.png',
    role: 'Reading Teacher',
    personality: {
      traits: { enthusiasm: 70, patience: 95, curiosity: 80, playfulness: 65, confidence: 75, empathy: 100 },
      learningStyle: 'visual',
      teachingApproach: 'nurturing',
      favoriteActivities: ['storytelling', 'word-games', 'comprehension'],
      catchphrase: 'Every book is an adventure!',
      voiceStyle: 'gentle',
    },
    colors: { primary: '#333333', secondary: '#ffffff', accent: '#f5a623' },
  },
  art: {
    name: 'Leo',
    type: 'Lion',
    species: 'lion',
    image: '/public/images/art-lion.png',
    role: 'Art Instructor',
    personality: {
      traits: { enthusiasm: 90, patience: 80, curiosity: 85, playfulness: 95, confidence: 90, empathy: 85 },
      learningStyle: 'creative',
      teachingApproach: 'inspiring',
      favoriteActivities: ['drawing', 'coloring', 'creative-expression'],
      catchphrase: 'Let your creativity roar!',
      voiceStyle: 'encouraging',
    },
    colors: { primary: '#f5a623', secondary: '#f39c12', accent: '#e67e22' },
  },
  coding: {
    name: 'Cody',
    type: 'Cat',
    species: 'cat',
    image: '/public/images/cody-cat.png',
    role: 'Coding Guide',
    personality: {
      traits: { enthusiasm: 80, patience: 90, curiosity: 85, playfulness: 75, confidence: 85, empathy: 80 },
      learningStyle: 'logical',
      teachingApproach: 'methodical',
      favoriteActivities: ['problem-solving', 'debugging', 'creating'],
      catchphrase: "Code is like a puzzle - let's solve it together!",
      voiceStyle: 'thoughtful',
    },
    colors: { primary: '#9b59b6', secondary: '#8e44ad', accent: '#7d3c98' },
  },
  music: {
    name: 'Melody',
    type: 'Songbird',
    species: 'songbird',
    image: '/public/images/music-songbird.svg',
    role: 'Music Teacher',
    personality: {
      traits: { enthusiasm: 100, patience: 75, curiosity: 85, playfulness: 90, confidence: 85, empathy: 90 },
      learningStyle: 'auditory',
      teachingApproach: 'rhythmic',
      favoriteActivities: ['singing', 'rhythm-games', 'composition'],
      catchphrase: 'Music makes everything better!',
      voiceStyle: 'melodic',
    },
    colors: { primary: '#e74c3c', secondary: '#c0392b', accent: '#a93226' },
  },
  geography: {
    name: 'Atlas',
    type: 'Eagle',
    species: 'eagle',
    image: '/public/images/geography-eagle.svg',
    role: 'Geography Guide',
    personality: {
      traits: { enthusiasm: 80, patience: 85, curiosity: 95, playfulness: 70, confidence: 90, empathy: 80 },
      learningStyle: 'visual',
      teachingApproach: 'explorative',
      favoriteActivities: ['map-exploration', 'cultural-discovery', 'travel-stories'],
      catchphrase: 'The world is your classroom!',
      voiceStyle: 'wise',
    },
    colors: { primary: '#27ae60', secondary: '#229954', accent: '#1e8449' },
  },
};

export default mascots;
```

- [ ] **Step 4: Rewire `config.js` to re-expose the mascots**

At the top of `config.js`, add the import:

```js
import { mascots } from './data/mascotsContent.js';
```

Then in the `subjects` block, replace each inline `character: { … }` object with a reference — e.g. for `math`:

```js
    math: {
      name: 'Math',
      character: mascots.math,
      description: 'Fun math tools and games for children',
    },
```

Do the same for all 7 (`character: mascots.science`, `mascots.reading`, `mascots.art`, `mascots.coding`, `mascots.music`, `mascots.geography`). Keep every other subject field (`name`, `description`, and music/geography's extra `color`/`difficulty`/`ageRange`/`features`) exactly as-is.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/mascotsContent.test.js`
Expected: PASS (3 tests). The `toBe` identity check proves `config.subjects.<key>.character` is literally the same object.

- [ ] **Step 6: Run the full unit suite to prove nothing broke**

Run: `npm run test:all`
Expected: PASS — same green baseline as before plus the new file. If any existing character/educator/config test fails, the extraction diverged from the originals; diff against git and fix.

- [ ] **Step 7: Commit**

```bash
git add data/mascotsContent.js config.js tests/unit/mascotsContent.test.js
git commit -m "refactor(config): extract mascot data into data/mascotsContent.js"
```

---

### Task 2: Add the learning content bank `data/animalsContent.js`

The one genuinely new content file: per-animal facts + reaction + quiz. Holds only *learning* content; identity is resolved from `mascotsContent.js` by `subject` key.

**Files:**
- Create: `data/animalsContent.js`
- Test: `tests/unit/animalsContent.test.js`

**Interfaces:**
- Produces: `export const animalsContent` — an array; each entry `{ subject: string, species: string, facts: string[], reaction: { emoji: string, animation: 'wiggle' | 'bob' }, quiz: Array<{ question: string, options: string[], answer: string }> }`. `export default animalsContent`.
- Consumes: mascot subject keys from Task 1 (referenced by `subject`).

- [ ] **Step 1: Write the failing test**

`tests/unit/animalsContent.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { animalsContent } from '../../data/animalsContent.js';
import { mascots } from '../../data/mascotsContent.js';

describe('animalsContent', () => {
  it('has the 7 mascot animals', () => {
    expect(animalsContent).toHaveLength(7);
  });

  it('every entry maps to a real mascot with a matching species', () => {
    for (const a of animalsContent) {
      const m = mascots[a.subject];
      expect(m, a.subject).toBeTruthy();
      expect(a.species, a.subject).toBe(m.species);
    }
  });

  it('species are unique', () => {
    const species = animalsContent.map(a => a.species);
    expect(new Set(species).size).toBe(species.length);
  });

  it('every entry has non-empty facts and a valid reaction', () => {
    for (const a of animalsContent) {
      expect(a.facts.length, a.species).toBeGreaterThanOrEqual(3);
      a.facts.forEach(f => expect(typeof f, a.species).toBe('string'));
      expect(a.reaction.emoji, a.species).toBeTruthy();
      expect(['wiggle', 'bob'], a.species).toContain(a.reaction.animation);
    }
  });

  it('every quiz question has answer within options', () => {
    for (const a of animalsContent) {
      expect(a.quiz.length, a.species).toBe(3);
      a.quiz.forEach(q => {
        expect(q.options.length, a.species).toBeGreaterThanOrEqual(3);
        expect(q.options, `${a.species}: ${q.question}`).toContain(q.answer);
      });
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/animalsContent.test.js`
Expected: FAIL — cannot resolve `../../data/animalsContent.js`.

- [ ] **Step 3: Create `data/animalsContent.js`**

All facts and answers below are established, kid-friendly, and verifiable. `reaction.animation` is one of `wiggle` | `bob` (both defined in Task 4's CSS).

```js
// Learning content for the Animals subject: kid-friendly, verified facts plus
// a short quiz for each mascot animal. Identity (name, image, colors, greeting)
// is resolved from data/mascotsContent.js by `subject`, so nothing is duplicated.
// This is a children's app — every fact and answer here is accurate and safe.

export const animalsContent = [
  {
    subject: 'math',
    species: 'shark',
    facts: [
      'Sharks have been swimming in the ocean since before there were trees!',
      'Some sharks grow a brand-new tooth in just a day, and can go through thousands in a lifetime.',
      'A shark can smell a single drop of blood mixed into a huge amount of water.',
      'Sharks are fish, but unlike most fish their skeleton is made of bendy cartilage — the same stuff as your ears and nose.',
    ],
    reaction: { emoji: '🦈', animation: 'wiggle' },
    quiz: [
      { question: 'What do most sharks like to eat?', options: ['Fish', 'Leaves', 'Rocks'], answer: 'Fish' },
      { question: 'Sharks have lived on Earth longer than which of these?', options: ['Trees', 'Cars', 'Phones'], answer: 'Trees' },
      { question: 'How does a shark find food far away?', options: ['By smelling', 'By reading', 'By texting'], answer: 'By smelling' },
    ],
  },
  {
    subject: 'science',
    species: 'parrot',
    facts: [
      'Parrots can copy sounds they hear — some even learn to say words like people do!',
      'Parrots hold their food up to their mouths with their feet, almost like using hands.',
      'Some big parrots can live to be 60 years old or even older.',
      'Parrots are very clever birds and can solve puzzles to reach a treat.',
    ],
    reaction: { emoji: '🦜', animation: 'bob' },
    quiz: [
      { question: 'What can many parrots do that most birds cannot?', options: ['Copy sounds and words', 'Breathe underwater', 'Turn invisible'], answer: 'Copy sounds and words' },
      { question: 'What does a parrot use to hold its food?', options: ['Its feet', 'Its tail', 'Its wings'], answer: 'Its feet' },
      { question: 'A parrot is a kind of…', options: ['Bird', 'Fish', 'Bug'], answer: 'Bird' },
    ],
  },
  {
    subject: 'reading',
    species: 'panda',
    facts: [
      'Giant pandas spend most of the day eating bamboo — sometimes more than 12 hours!',
      'A newborn panda is tiny — about the size of a stick of butter — and pink instead of black-and-white.',
      'Pandas have a special wrist bone that works like a thumb to help them grip bamboo.',
      'Giant pandas are great tree climbers, even though they look big and heavy.',
    ],
    reaction: { emoji: '🐼', animation: 'wiggle' },
    quiz: [
      { question: 'What do giant pandas eat most of the time?', options: ['Bamboo', 'Ice cream', 'Sand'], answer: 'Bamboo' },
      { question: 'How big is a baby panda when it is born?', options: ['Very tiny', 'As big as a car', 'As big as a house'], answer: 'Very tiny' },
      { question: 'What are pandas surprisingly good at?', options: ['Climbing trees', 'Flying', 'Swimming across oceans'], answer: 'Climbing trees' },
    ],
  },
  {
    subject: 'art',
    species: 'lion',
    facts: [
      "A lion's roar is so loud it can be heard from about 5 miles (8 kilometers) away.",
      'Lions live together in family groups called prides.',
      'In a pride, the female lions (lionesses) do most of the hunting.',
      'Lions rest and sleep for a big part of the day — sometimes up to 20 hours!',
    ],
    reaction: { emoji: '🦁', animation: 'bob' },
    quiz: [
      { question: 'What is a group of lions called?', options: ['A pride', 'A flock', 'A school'], answer: 'A pride' },
      { question: 'What do lions do for much of the day?', options: ['Rest and sleep', 'Build nests', 'Go to school'], answer: 'Rest and sleep' },
      { question: 'What can you hear from far away when a lion makes it?', options: ['Its roar', 'Its whisper', 'Its song'], answer: 'Its roar' },
    ],
  },
  {
    subject: 'coding',
    species: 'cat',
    facts: [
      'Cats sleep a lot — about two-thirds of their whole lives!',
      "A cat's whiskers help it feel whether it can fit through a narrow space.",
      'Cats cannot taste sweet things the way people can.',
      'Cats can make many different sounds, including meows, purrs, and chirps.',
    ],
    reaction: { emoji: '🐱', animation: 'wiggle' },
    quiz: [
      { question: 'What do cats do for most of their lives?', options: ['Sleep', 'Read books', 'Drive cars'], answer: 'Sleep' },
      { question: 'What do a cat’s whiskers help it do?', options: ['Feel spaces around it', 'See in color', 'Fly'], answer: 'Feel spaces around it' },
      { question: 'Which sound does a cat make?', options: ['Meow', 'Moo', 'Quack'], answer: 'Meow' },
    ],
  },
  {
    subject: 'music',
    species: 'songbird',
    facts: [
      'Baby songbirds learn their songs by listening to grown-up birds — a lot like how you learned to talk.',
      'Many birds sing the most at sunrise, in what people call the "dawn chorus."',
      'Each kind of songbird has its own special tune, so birds can tell each other apart.',
      'Some songbirds can even sing two notes at the very same time!',
    ],
    reaction: { emoji: '🐦', animation: 'bob' },
    quiz: [
      { question: 'How do young songbirds learn their songs?', options: ['By listening', 'By reading music', 'By magic'], answer: 'By listening' },
      { question: 'When do many birds sing the most?', options: ['At sunrise', 'At midnight', 'Never'], answer: 'At sunrise' },
      { question: 'How does a songbird make music?', options: ['By singing', 'By clapping', 'By stomping'], answer: 'By singing' },
    ],
  },
  {
    subject: 'geography',
    species: 'eagle',
    facts: [
      'Eagles have amazing eyesight — they can see much more sharply than people can.',
      'Eagles can soar high in the sky for a long time by riding on warm rising air.',
      'Bald eagles build some of the biggest nests of any bird, adding to them year after year.',
      'An eagle has a very strong grip in its feet, called talons, for holding on tight.',
    ],
    reaction: { emoji: '🦅', animation: 'bob' },
    quiz: [
      { question: 'What are eagles famous for?', options: ['Amazing eyesight', 'Glowing in the dark', 'Talking'], answer: 'Amazing eyesight' },
      { question: 'How do eagles stay up in the sky for a long time?', options: ['They ride warm rising air', 'They flap the whole time', 'They hold balloons'], answer: 'They ride warm rising air' },
      { question: 'What do eagles build that is very big?', options: ['Nests', 'Houses', 'Bridges'], answer: 'Nests' },
    ],
  },
];

export default animalsContent;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/animalsContent.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add data/animalsContent.js tests/unit/animalsContent.test.js
git commit -m "feat(animals): add verified per-animal facts and quiz content bank"
```

---

### Task 3: Pure logic helpers `subjects/animals/animalsHelpers.js`

Isolate all pure, DOM-free logic so it is unit-testable without jsdom. The DOM module (Task 4) imports these. Note: Science's shuffle/score logic is module-scoped and not exported, so we **copy** it here rather than import (small, acceptable DRY debt for v1; documented).

**Files:**
- Create: `subjects/animals/animalsHelpers.js`
- Test: `tests/unit/animalsHelpers.test.js`

**Interfaces:**
- Consumes: `animalsContent` (Task 2) and `mascots` (Task 1) — passed in as arguments, never imported here.
- Produces:
  - `buildAnimals(content, mascots)` → `Array<{ subject, species, name, type, image, role, mascot, facts, reaction, quiz }>` where `mascot` is the raw mascot object (for `generateCharacterMessage`). Entries whose `subject` has no mascot are skipped.
  - `resolveSpecies(hash, animals)` → the animal whose `species` matches `hash` (with or without a leading `#`), or `null`.
  - `shuffle(array)` → new shuffled array (Fisher–Yates).
  - `scoreQuiz(quiz, answers)` → `{ answered, correct, total }`, where `answers` is a `Map`/object of `questionIndex → chosenOptionString`.

- [ ] **Step 1: Write the failing test**

`tests/unit/animalsHelpers.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildAnimals, resolveSpecies, shuffle, scoreQuiz } from '../../subjects/animals/animalsHelpers.js';

const mascots = {
  math: { name: 'Mango', type: 'Shark', species: 'shark', image: '/img/shark.png', role: 'Math Expert' },
  science: { name: 'Sky', type: 'Parrot', species: 'parrot', image: '/img/parrot.png', role: 'Science Specialist' },
};
const content = [
  { subject: 'math', species: 'shark', facts: ['f1'], reaction: { emoji: '🦈', animation: 'wiggle' }, quiz: [] },
  { subject: 'science', species: 'parrot', facts: ['f2'], reaction: { emoji: '🦜', animation: 'bob' }, quiz: [] },
  { subject: 'ghost', species: 'ghost', facts: ['boo'], reaction: { emoji: '👻', animation: 'bob' }, quiz: [] },
];

describe('buildAnimals', () => {
  it('joins content with mascot identity and skips animals without a mascot', () => {
    const animals = buildAnimals(content, mascots);
    expect(animals).toHaveLength(2);
    const shark = animals.find(a => a.species === 'shark');
    expect(shark.name).toBe('Mango');
    expect(shark.type).toBe('Shark');
    expect(shark.image).toBe('/img/shark.png');
    expect(shark.mascot).toBe(mascots.math);
    expect(shark.facts).toEqual(['f1']);
  });
});

describe('resolveSpecies', () => {
  const animals = buildAnimals(content, mascots);
  it('matches with a leading hash', () => {
    expect(resolveSpecies('#parrot', animals).name).toBe('Sky');
  });
  it('matches without a hash', () => {
    expect(resolveSpecies('shark', animals).name).toBe('Mango');
  });
  it('returns null for empty or unknown hash', () => {
    expect(resolveSpecies('', animals)).toBeNull();
    expect(resolveSpecies('#nope', animals)).toBeNull();
  });
});

describe('shuffle', () => {
  it('returns a new array with the same members', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).not.toBe(input);
    expect(out.slice().sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('scoreQuiz', () => {
  const quiz = [
    { question: 'q0', options: ['a', 'b'], answer: 'a' },
    { question: 'q1', options: ['c', 'd'], answer: 'd' },
    { question: 'q2', options: ['e', 'f'], answer: 'e' },
  ];
  it('counts answered and correct', () => {
    const answers = { 0: 'a', 1: 'c', 2: 'e' };
    expect(scoreQuiz(quiz, answers)).toEqual({ answered: 3, correct: 2, total: 3 });
  });
  it('counts partial answers', () => {
    expect(scoreQuiz(quiz, { 0: 'a' })).toEqual({ answered: 1, correct: 1, total: 3 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/animalsHelpers.test.js`
Expected: FAIL — cannot resolve `../../subjects/animals/animalsHelpers.js`.

- [ ] **Step 3: Create `subjects/animals/animalsHelpers.js`**

```js
// Pure, DOM-free helpers for the Animals subject, kept separate so they are
// unit-testable without jsdom. (shuffle/score mirror subjects/science/science.js,
// which keeps them module-private; copied here for v1 — small, intentional DRY debt.)

/** Join learning content with mascot identity. Skips content with no mascot. */
export function buildAnimals(content, mascots) {
  return content
    .filter(a => mascots[a.subject])
    .map(a => {
      const m = mascots[a.subject];
      return {
        subject: a.subject,
        species: a.species,
        name: m.name,
        type: m.type,
        image: m.image,
        role: m.role,
        mascot: m,
        facts: a.facts,
        reaction: a.reaction,
        quiz: a.quiz,
      };
    });
}

/** Find the animal matching a location hash (`#shark` or `shark`), else null. */
export function resolveSpecies(hash, animals) {
  const species = (hash || '').replace(/^#/, '');
  if (!species) return null;
  return animals.find(a => a.species === species) || null;
}

/** Return a new array shuffled (Fisher–Yates). */
export function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Score a quiz. `answers` maps question index → chosen option string. */
export function scoreQuiz(quiz, answers) {
  let answered = 0;
  let correct = 0;
  quiz.forEach((q, i) => {
    const chosen = answers[i];
    if (chosen === undefined || chosen === null) return;
    answered += 1;
    if (chosen === q.answer) correct += 1;
  });
  return { answered, correct, total: quiz.length };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/animalsHelpers.test.js`
Expected: PASS (all groups green).

- [ ] **Step 5: Commit**

```bash
git add subjects/animals/animalsHelpers.js tests/unit/animalsHelpers.test.js
git commit -m "feat(animals): add pure logic helpers (build/resolve/shuffle/score)"
```

---

### Task 4: Page shell + styles + rendering module

The browser-facing pieces: the static HTML shell, the CSS (gallery grid, meet view, reaction animations gated on reduced-motion, quiz styles), and the DOM module that wires it all together with hash routing. Covered end-to-end by Playwright in Task 6; this task's deliverable is a working page you can open at `http://localhost:3000/subjects/animals/`.

**Files:**
- Create: `subjects/animals/index.html`
- Create: `subjects/animals/animals.css`
- Create: `subjects/animals/animals.js`

**Interfaces:**
- Consumes: `buildAnimals`, `resolveSpecies`, `shuffle`, `scoreQuiz` (Task 3); `animalsContent` (Task 2); `mascots` (Task 1); `generateCharacterMessage` from `/utils/characterIntegration.js` (existing — reads `character.name`, `character.personality.traits.enthusiasm`, `character.personality.catchphrase`; the raw mascot object satisfies this, verified against the source).
- Produces: a self-initializing page. No exports consumed by other tasks.

- [ ] **Step 1: Create `subjects/animals/index.html`**

Static shell modeled on `subjects/science/index.html` (same stylesheet set, navbar placeholder, theme scripts, footer).

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Meet the Learnimals animal friends — say hello, learn fun facts, and take a quick quiz!" />
    <title>Meet the Animals - Learnimals</title>
    <link rel="stylesheet" href="/styles/base/styles.css" />
    <link rel="stylesheet" href="/styles/components/navbar.css" />
    <link rel="stylesheet" href="/styles/components/components.css" />
    <link rel="stylesheet" href="/styles/components/themeSwitcher.css" />
    <link rel="stylesheet" href="/subjects/animals/animals.css" />
    <link rel="icon" href="/public/images/favicon.ico" type="image/x-icon" />
    <link rel="manifest" href="/public/manifest.json" />
  </head>
  <body>
    <div id="navbar-placeholder"></div>

    <main>
      <section class="hero">
        <h1>🐾 Meet the Animals</h1>
        <p>Say hello to your Learnimals friends, learn amazing animal facts, and try a fun quiz!</p>
      </section>

      <!-- Gallery of animal cards (rendered by animals.js) -->
      <section class="animals-gallery" id="animals-gallery" aria-label="Meet the animals"></section>

      <!-- Meet view for a single animal (rendered by animals.js on hash change) -->
      <section class="animal-meet" id="animal-meet" hidden></section>
    </main>

    <footer>
      <p>&copy; 2025 Learnimals. All rights reserved.</p>
      <div class="footer-links">
        <a href="/pages/about.html">About Us</a>
        <a href="/pages/contact.html">Contact</a>
        <a href="/pages/privacy.html">Privacy Policy</a>
        <a href="/pages/profile.html">My Profile</a>
      </div>
    </footer>

    <script type="module" src="/subjects/animals/animals.js"></script>
    <script defer type="module" src="/themeInitializer.js"></script>
    <script type="module" src="/utils/themeManager.js"></script>
    <script type="module" src="/components/layout/themeSwitcher.js"></script>
    <script defer src="/components/layout/navbarLoader.js"></script>
    <script defer src="/components/component-loader.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `subjects/animals/animals.css`**

Semantic theme variables only; both reaction animations defined and gated on `prefers-reduced-motion`.

```css
/* Animals subject: gallery grid + single-animal meet view. Semantic theme
   variables only; motion gated behind prefers-reduced-motion. */

.animals-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  max-width: 900px;
  margin: 1.5rem auto;
  padding: 0 1rem;
}

.animal-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: var(--text-primary);
  text-decoration: none;
  text-align: center;
  transition: transform 0.15s ease;
}
.animal-card:hover,
.animal-card:focus-visible {
  transform: translateY(-4px);
  outline: 2px solid var(--accent-primary);
}
.animal-card img {
  width: 96px;
  height: 96px;
  object-fit: contain;
}
.animal-card .animal-card-name {
  font-weight: 700;
}
.animal-card .animal-card-kind {
  font-size: 0.85rem;
  color: var(--text-secondary, var(--text-primary));
}

/* Meet view */
.animal-meet {
  max-width: 720px;
  margin: 1.5rem auto;
  padding: 0 1rem 3rem;
}
.animal-meet .meet-back {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--accent-primary);
}
.animal-meet .meet-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}
.animal-meet .meet-art {
  width: 180px;
  height: 180px;
  object-fit: contain;
  cursor: pointer;
  background: none;
  border: none;
}
.animal-meet .meet-speech {
  min-height: 1.5em;
  font-style: italic;
  color: var(--text-primary);
}

/* Fun facts (tap to reveal) */
.animal-facts {
  margin-top: 2rem;
}
.fact-card {
  display: block;
  width: 100%;
  text-align: left;
  margin: 0.5rem 0;
  padding: 0.85rem 1rem;
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--accent-primary);
  border-radius: 12px;
  cursor: pointer;
}
.fact-card .fact-text {
  display: none;
}
.fact-card.revealed .fact-text {
  display: block;
}
.fact-card.revealed .fact-prompt {
  display: none;
}

/* Quiz (reuses the shape of science.js) */
.animal-quiz {
  margin-top: 2rem;
}
.quiz-question {
  margin: 1rem 0;
  padding: 0.75rem;
  border-radius: 12px;
}
.quiz-question.correct {
  background: rgba(46, 204, 113, 0.15);
}
.quiz-question.incorrect {
  background: rgba(231, 76, 60, 0.15);
}
.quiz-option {
  display: block;
  margin: 0.25rem 0;
  cursor: pointer;
}
.quiz-submit-button {
  margin-top: 0.5rem;
}
#quiz-result.quiz-result-success {
  font-weight: 700;
}

/* Reaction + greeting animations, gated on motion preference */
@media (prefers-reduced-motion: no-preference) {
  .animal-meet .meet-art.reacting.wiggle {
    animation: animal-wiggle 0.6s ease;
  }
  .animal-meet .meet-art.reacting.bob {
    animation: animal-bob 0.6s ease;
  }
}
@keyframes animal-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}
@keyframes animal-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-14px); }
}
```

- [ ] **Step 3: Create `subjects/animals/animals.js`**

```js
// Animals subject page: a gallery of the mascot animals plus a hash-routed
// "meet" view (greeting reaction, tap-to-reveal facts, a 3-question quiz).
// Pure logic lives in animalsHelpers.js so it can be unit-tested.
import { animalsContent } from '/data/animalsContent.js';
import { mascots } from '/data/mascotsContent.js';
import { generateCharacterMessage } from '/utils/characterIntegration.js';
import { buildAnimals, resolveSpecies, shuffle, scoreQuiz } from '/subjects/animals/animalsHelpers.js';

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
```

- [ ] **Step 4: Manually verify the page in a real browser**

Start the server and open the page:

```bash
npm run serve
```

Open `http://localhost:3000/subjects/animals/` and confirm:
- The gallery shows 7 animal cards with art, name, and "the <Type>".
- Clicking a card navigates to `#shark` (etc.) and shows the meet view; the browser Back button returns to the gallery.
- Tapping the big art shows a greeting line (and wiggles/bobs unless reduced motion is on).
- Fun-fact cards reveal on tap.
- The quiz: submitting with a blank answer prompts "Please answer every question first!"; a full submit shows a score and marks each question.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint
git add subjects/animals/index.html subjects/animals/animals.css subjects/animals/animals.js
git commit -m "feat(animals): add Meet the Animals page — gallery, meet view, facts, quiz"
```

---

### Task 5: Wire the Animals subject into navigation

Make Animals reachable from the main navbar and register its clean URL in the navigation helper.

**Files:**
- Modify: `components/layout/navbar.html:26` (after the Geography `<li>`)
- Modify: `utils/navigationHelper.js:94` (add to `linkMappings`)

**Interfaces:**
- Consumes: the page created in Task 4 (`/subjects/animals/`).
- Produces: nav link visible on every page that loads the shared navbar.

- [ ] **Step 1: Add the navbar link**

In `components/layout/navbar.html`, add a list item after the Geography one:

```html
      <li><a href="/subjects/geography/">Geography</a></li>
      <li><a href="/subjects/animals/">Animals</a></li>
```

- [ ] **Step 2: Add the navigation-helper mapping**

In `utils/navigationHelper.js`, in the `linkMappings` object (after `geography`):

```js
      geography: 'subjects/geography/',
      animals: 'subjects/animals/',
      bubblepop: 'games/bubble-pop/',
```

- [ ] **Step 3: Verify in the browser**

With `npm run serve` running, load `http://localhost:3000/` (or any page), confirm the navbar shows an **Animals** link, and clicking it lands on the gallery.

- [ ] **Step 4: Run the full unit suite (navigationHelper has tests)**

Run: `npm run test:all`
Expected: PASS — existing `navigationHelper` tests still green (we only added a key).

- [ ] **Step 5: Commit**

```bash
git add components/layout/navbar.html utils/navigationHelper.js
git commit -m "feat(nav): link the Animals subject page"
```

---

### Task 6: Browser end-to-end tests (Playwright)

Prove the core loop works in a real browser, plus the reduced-motion and mobile paths the spec calls out.

**Files:**
- Create: `e2e/tests/animals.spec.ts`

**Interfaces:**
- Consumes: the running site (Playwright's `webServer` auto-starts `npm run serve`; `BASE_URL` defaults to `http://localhost:3000`). Confirm the base URL / path convention against an existing spec in `e2e/tests/` before writing (match how they navigate, e.g. `page.goto('/subjects/animals/')`).

- [ ] **Step 1: Write the e2e spec**

`e2e/tests/animals.spec.ts` (adjust the import/config header to match a sibling spec in `e2e/tests/`):

```ts
import { test, expect } from '@playwright/test';

test.describe('Animals subject', () => {
  test('gallery shows the animals and links to a meet view', async ({ page }) => {
    await page.goto('/subjects/animals/');
    const cards = page.locator('.animal-card');
    await expect(cards).toHaveCount(7);

    await page.locator('.animal-card[href="#shark"]').click();
    await expect(page).toHaveURL(/#shark$/);
    await expect(page.locator('#meet-heading')).toContainText('Mango the Shark');
  });

  test('tapping the art shows a greeting', async ({ page }) => {
    await page.goto('/subjects/animals/#parrot');
    await page.locator('.meet-art').click();
    await expect(page.locator('#meet-speech')).not.toBeEmpty();
  });

  test('a fun fact reveals on tap', async ({ page }) => {
    await page.goto('/subjects/animals/#panda');
    const fact = page.locator('.fact-card').first();
    await fact.click();
    await expect(fact).toHaveClass(/revealed/);
  });

  test('quiz scores a full correct set', async ({ page }) => {
    await page.goto('/subjects/animals/#shark');
    // Answer each question with its correct option (labels contain the answer text).
    await page.getByText('Fish', { exact: false }).first().click();
    await page.getByText('Trees', { exact: false }).first().click();
    await page.getByText('By smelling', { exact: false }).first().click();
    await page.getByRole('button', { name: 'Check Answers' }).click();
    await expect(page.locator('#quiz-result')).toContainText('right');
  });

  test('respects reduced motion (no reacting class lingers)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/subjects/animals/#lion');
    await page.locator('.meet-art').click();
    await expect(page.locator('#meet-speech')).not.toBeEmpty();
    await expect(page.locator('.meet-art')).not.toHaveClass(/reacting/);
  });

  test('works on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/subjects/animals/');
    await expect(page.locator('.animal-card')).toHaveCount(7);
  });
});
```

- [ ] **Step 2: Run the spec (chromium first)**

Run: `npx playwright test --config e2e/playwright.config.ts --project=chromium e2e/tests/animals.spec.ts`
Expected: PASS. If the correct-answer clicks are ambiguous (an answer word appears in multiple options), tighten the selector to the specific `label.quiz-option` containing the answer text.

- [ ] **Step 3: Run the full e2e matrix**

Run: `npm run test:e2e`
Expected: PASS across the configured browser projects (existing 30 + the new Animals tests).

- [ ] **Step 4: Commit**

```bash
git add e2e/tests/animals.spec.ts
git commit -m "test(animals): e2e for gallery, meet, facts, quiz, reduced-motion, mobile"
```

---

### Task 7: Promote Animals to a full subject on the homepage (needs a decision)

The navbar link (Task 5) makes Animals a real destination. The homepage subject cards are **hardcoded** in `index.html` and each uses a mascot PNG; Animals has no single representative image. **Raise this with the user at execution time** (see Execution Handoff): provide/choose an image, or ship v1 without the homepage card. Do NOT invent a misleading single-mascot image.

Deliberately **out of scope** and NOT done here: registering `animals` in `config.js` `subjects` — that would auto-inject Animals into the About "Meet Our Animal Educators" grid (`utils/subjectEducators.js`) and `characterIntegration.getAllDefaultCharacters()`, which expect a real teaching mascot with an image. Animals is a meta-destination, not a teaching mascot, so it correctly stays out of `config.subjects`.

**Files (only if the user opts to add the card):**
- Modify: `index.html` (add a `feature-card-link` in the `.features` section)

**Interfaces:**
- Consumes: an animals image at a path the user provides (e.g. `/public/images/animals-<something>.png`).

- [ ] **Step 1: Confirm the image with the user** — get a real asset path or an explicit "ship without the card."

- [ ] **Step 2 (if adding): Insert the homepage card**

In `index.html`, inside `<section class="features">`, after the last existing card:

```html
        <a
          href="/subjects/animals/"
          class="feature-card-link"
          aria-label="Meet the Animals - Say hello to your animal friends and learn fun facts"
        >
          <div class="feature-card hover-glow">
            <img src="/public/images/PLACEHOLDER-REPLACE-WITH-USER-ASSET.png" alt="Animal friends" loading="lazy" decoding="async" />
            <h3>Meet the Animals</h3>
            <p>Say hello to your animal friends and learn fun facts!</p>
          </div>
        </a>
```

Replace the `src` with the confirmed asset before committing. (The card-color auto-alternation in the homepage CSS is `nth-child`-based, so a new card colors itself automatically.)

- [ ] **Step 3: Verify + commit**

```bash
npm run lint
git add index.html
git commit -m "feat(home): add the Meet the Animals subject card"
```

---

## Self-Review

**Spec coverage:**
- Meet-the-animals gallery from mascot data → Task 4 (`renderGallery`), data from Tasks 1–2. ✓
- Tap character → animated greeting + personality → Task 4 (`react` + `generateCharacterMessage`, gated on reduced motion). ✓
- Tap-to-reveal fun facts → Task 4 (`renderFacts`). ✓
- 3-question quiz adapted from Science → Tasks 2 (content), 3 (`scoreQuiz`), 4 (`renderQuiz`/`checkQuiz`). ✓
- One page, hash-routed, expandable → Task 4 (`route`, `resolveSpecies`); adding an entry to both data files auto-appears. ✓
- Extract mascot data to `mascotsContent.js`, `config.js` re-exposes → Task 1. ✓
- Reuse existing PNGs (not the SVG renderer) → Task 4 uses `mascot.image`. ✓
- Accessibility (aria-labels, radio groups via `<fieldset>/<legend>`, reduced-motion, focus to heading) → Task 4. ✓
- Testing: Vitest data-integrity + logic (Tasks 1–3), Playwright gallery→meet→quiz + reduced-motion + mobile (Task 6). ✓
- MVP boundary: no audio, no non-mascot animals, no per-animal HTML → honored. ✓
- Nav link → Task 5. ✓
- "Add an `animals` subject entry to config" (spec §1) → intentionally deferred with rationale in Task 7 (would break the educators grid); homepage card surfaced as a user decision. This is a documented refinement, flagged at handoff — not a silent cut.

**Placeholder scan:** The only literal placeholder is the homepage image `src` in Task 7, which is explicitly gated on a user decision. No "TBD"/"add error handling"/"similar to Task N" anywhere; all code and content is complete.

**Type consistency:** `buildAnimals`/`resolveSpecies`/`shuffle`/`scoreQuiz` signatures match between Task 3 (definition/tests) and Task 4 (call sites). `animalsContent` entry shape matches between Task 2 and the Task 3 tests and Task 4 consumers. `mascots` keyed-by-subject shape matches Tasks 1, 3, 4. `generateCharacterMessage(mascot, 'greeting')` matches the verified signature in `utils/characterIntegration.js`.
