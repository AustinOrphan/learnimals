# Asteroid Math — Polish Pass Design

Date: 2026-07-21
Status: Approved (proceeding in visible increments)

## Goal

Make the existing `games/asteroid-math/` game feel professional and fair, matching
house conventions already present in the repo's other games. No framework, no build
step — same self-contained canvas engine.

Scope confirmed with the user: **visual & audio juice + standards parity + gameplay
fairness**. Explicitly out of scope: a full accessibility overhaul (keyboard-only
aiming, ARIA live regions) beyond reduced-motion.

## 1. Gameplay fairness — loss model

Chosen model: **timeout + wrong-answer both cost a life**, tuned so it is fair rather
than punishing (this is a children's app):

- Wrong asteroid hit → lose 1 life + reset streak. **Drop the existing −40 point
  penalty** so a single misclick is not double-punished.
- **Grace window (~1s) after any life loss**: fires during the grace window do not
  register a wrong hit, so a panic multi-tap on touch cannot instantly burn all 3
  lives.
- Timeout → lose 1 life (unchanged), but the round timer bar shows a clear red-pulse
  warning as it runs low so a timeout never feels like a rug-pull.
- Timer stays generous but scales down with level (keep current scaling shape).
- Correct hit path unchanged (score + streak + level-up every 5).

## 2. Standards parity (match other games)

- **High-score persistence**: localStorage key `learnimals-asteroid-highscore`. Shown
  in the HUD and highlighted on game-over ("New best! 🏆") when beaten.
- **Mute toggle**: 🔊/🔇 button in the HUD; preference persisted
  (`learnimals-asteroid-muted`). Beeper respects it.
- **Pause**: auto-pause on `visibilitychange` / window blur; manual pause too. Resume
  reseeds `last` timestamp so `dt` does not jump.
- **Reduced motion**: read `matchMedia('(prefers-reduced-motion: reduce)')` **in the
  engine** (a CSS media query cannot affect canvas drawing). When set: disable screen
  shake, freeze/omit starfield twinkle, and reduce particle counts.

## 3. Visual & audio juice

- Replace `Comic Sans MS` canvas text with a clean system stack (rounded/heavier) to
  avoid any web-font swap pop mid-game.
- Firing: muzzle flash at the turret, short bullet trail, subtle recoil.
- Ship: livelier thruster flicker + soft glow.
- Round start: a brief "3·2·1 / Get ready" beat so a new problem does not snap in cold.
- Hit feedback: correct = pop + expanding ring; wrong = distinct thud + red shake
  (shake suppressed under reduced motion).
- Keep the dark space-arcade palette and both-theme behavior.

## Verification

"Feels professional" is a judgment only the user can make by playing. Loop:
implement increment → functional verify by actually running it (headless Chromium +
390px mobile; screenshot idle / mid-round / wrong-hit / game-over; zero console
errors) → user plays and reacts → tune. A parallel review workflow (correctness,
fairness edge-cases, reduced-motion, mobile-touch, cross-theme) runs before sign-off.
Green unit tests are necessary but not sufficient; do not declare done off tests alone.
