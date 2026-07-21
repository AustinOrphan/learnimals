# Animals Subject — Design Spec

Date: 2026-07-21
Status: Approved (brainstorming complete). Reconstructed from session `e2d96358` after a
context loss; approved by the user across three sections ("Looks right").

## Purpose

A kid-facing **"Meet the Animals"** destination where children meet the app's mascot
characters and learn real, verified facts about the animals — bridging "meet the characters"
and "an animals subject" into one place. Chosen scope: **mascots first, expandable.**

## Approach (chosen: A — a new Animals subject)

Add **Animals** to the nav alongside Math/Science/Music, following the exact existing subject
pattern. No new framework, no backend. The landing page *is* the gallery; tapping a character
opens its meet experience on the same page via hash routing.

Rejected alternatives:

- **B — enhance the About-page "Meet Our Animal Educators" grid:** cheapest, but buried in a
  grown-up page; won't feel like a subject kids navigate to.
- **C — standalone "Meet the Characters" page, subject later:** fastest to the "meet" idea but
  leans "separate" and would need rework to become a real subject.

## Section 1 — Architecture & slot-in

Normal subject, matching Math/Science/Music.

```text
subjects/animals/
  index.html          → thin shell: SubjectTemplateLoader.renderTemplate(animalsOptions)
  animals.js          → auto-loaded module: gallery + meet/facts/reaction/quiz
  animals.css         → page styles (can borrow orphaned character-showcase.css)
data/
  animalsContent.js   → NEW content bank: per-species facts + quiz + reaction
  mascotsContent.js   → NEW: mascot identity data extracted from config.js (see §2)
config.js             → add `animals` subject entry (host mascot); re-expose mascot data
components/layout/navbar.html + utils/navigationHelper.js → add the "Animals" link
```

**Single page, hash-routed.** Landing = gallery (7 cards from mascot data). Tapping a card
shows that animal's meet view at `#shark`, `#parrot`, … — back-button friendly, linkable, no
page reloads. No per-animal HTML files.

**Reuse map (do NOT rebuild):**

- Mascot data → single source of truth (moved to `mascotsContent.js`, see §2).
- Gallery grid → the `utils/subjectEducators.js` / "Meet Our Animal Educators" pattern.
- Greeting text → `generateCharacterMessage(character, 'greeting')` (already built).
- Quiz engine → adapt Science's render/shuffle/score logic (`{question, options, answer}`).
- Character art & reaction → the existing mascot **PNG** + CSS animation (bob/wiggle + speech
  bubble). **Deliberately NOT** the SVG `CharacterPreviewRenderer` — it makes generic
  trait-avatars, not the real hand-drawn art; kids should meet the *actual* characters.

**Open decision (flag in plan):** the Animals subject needs a host mascot for its own hero —
a brand-new animal or reuse an existing nature-y one. Small.

## Section 2 — Data model

**One new content file, `data/animalsContent.js`** — a plain array, one entry per animal,
holding only the *learning* content. Identity (name, image, colors, catchphrase, greeting)
is resolved from mascot data so nothing is duplicated.

```js
export const animals = [
  {
    subject: 'math',          // links to the mascot → Mango the Shark
    species: 'shark',         // hash route (#shark) + reaction key
    facts: [                  // 3–5 kid-friendly, verified facts
      'Sharks have been swimming the oceans since before trees existed!',
      'Some sharks can grow a new tooth in just a day.',
      'A shark can smell a single drop of blood in a huge pool of water.',
    ],
    reaction: { emoji: '🦈', animation: 'wiggle' },  // CSS animation; sound deferred
    quiz: [                   // 3 questions, Science's {question, options, answer} shape
      { question: 'What do most sharks like to eat?', options: ['Fish', 'Leaves', 'Rocks'], answer: 'Fish' },
      { question: 'Sharks are older than…?', options: ['Trees', 'Cars', 'Mountains'], answer: 'Trees' },
      { question: 'How does a shark find food?', options: ['Smell', 'Reading', 'Texting'], answer: 'Smell' },
    ],
  },
  // …parrot (Sky), panda (Ruby), lion (Leo), cat (Cody), songbird (Melody), eagle (Atlas)
];
```

**Key decisions:**

- **Extract mascot data into `data/mascotsContent.js`** (user's call — a generic `config.js`
  grab-bag undersells it). To keep blast radius near-zero: **move the definitions into the
  new file and have `config.js` import + re-expose them**, so `config.subjects.math.character`
  keeps resolving exactly as today. Existing consumers (`subjectEducators.js`,
  `characterIntegration.js`, `subjectTemplateLoader.js`, homepage, About grid) are untouched;
  new Animals code imports `mascotsContent.js` directly. Name "mascots" deliberately avoids
  "character" (repo already has `character-generation/` + `data/characterSchema.js` for
  user avatars).
- **Expandable hook:** an entry may *optionally* carry self-contained `name`/`image`/`colors`,
  so a future non-mascot animal (a plain elephant) can be added without inventing a fake
  subject. v1's 7 all use `subject`.
- **Content is the real work:** 7 animals × (~4 facts + 3 quiz Qs), drafted accurate and
  age-appropriate (COPPA/child-safety posture); user gets final say on all content.
- **`reaction.sound` omitted in v1** (no audio assets); reaction = CSS animation + emoji.

## Section 3 — Interaction, accessibility, testing, MVP boundary

**Flow (one page, hash-routed):**

1. **Land** on `subjects/animals/` → host-mascot hero + **"Meet the Animals" gallery**: 7 cards
   (art, name, animal) from mascot data. Each card links to `#shark`, `#parrot`, …
2. **Tap a card → meet view** (same page, `#<species>`):
   - Mascot **art**, large; tap it → **reaction** (CSS wiggle/bob + speech-bubble greeting via
     `generateCharacterMessage()`).
   - Name + "Mango the Shark" + one-line personality/role.
   - **Fun Facts** — tap-to-reveal cards (+ a shuffle, like Science).
   - **Quiz** — 3 questions, shuffled options, Check → score + per-question right/wrong marks
     (adapted from `science.js`), "Play again" reshuffles.
   - Back-to-gallery link; browser Back works via the hash.
3. **Expandable:** add a `mascotsContent` + `animalsContent` entry → shows up in the gallery
   automatically.

`animals.js` is one data-driven module: build gallery; on `hashchange`, render the meet view
for the selected species. No per-animal HTML.

**Accessibility** (repo has a 22-file a11y suite — first-class): real focusable links/buttons
with aria-labels ("Meet Mango the Shark"); quiz as labelled radio groups (Science's
touch-polished pattern); reaction animation gated on `prefers-reduced-motion` (like
asteroid-math); focus moves to the meet-view heading on navigation; contrast via theme
variables.

**Error handling:** unknown/empty hash → gallery; missing image → alt-text fallback; an entry
missing facts/quiz → that section hides gracefully.

**Testing:**

- *Vitest* — data integrity (each animal maps to a real mascot; every quiz `answer ∈ options`;
  facts non-empty) + quiz scoring.
- *Playwright* — gallery → meet → answer quiz → see score; plus reduced-motion and a mobile
  viewport (the "re-drive in a real browser" rule).

**MVP boundary (YAGNI):** v1 = the 7 mascot animals with facts + reaction + 3-question quiz +
hash routing. **Not** in v1: audio/sound, non-mascot animals, richer game mechanics, per-animal
HTML pages, progress/achievement wiring beyond what BaseGame-free pages already get.

## Next step

Transition to the writing-plans skill to produce the implementation plan from this spec.
