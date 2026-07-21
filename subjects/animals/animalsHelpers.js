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
