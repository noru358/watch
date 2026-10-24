# HANDOFF

## Status (2026-10-24) — Gate 1 first playable
A full night loop is playable in the browser: Day placeholder → 출동 → 7-room Euljiro contract
(3 combat → payphone → 2 combat → boss) → settlement → back to Day with money/trauma updated.

### What exists
- Tooling: Vite 8 + TypeScript 5 (strict, noUncheckedIndexedAccess) + Phaser 3.90 + React 19 + Vitest 5. `npm run dev`, `npm run check`, `npm run build`.
- `src/core/`: `InputManager` (window-only, context stack, `onAction` for React), typed `EventBus`, `SeededRNG`, `PhaseController`.
- `src/systems/combat/`: pure fixed-step simulation (player move/roll/attack with auto-aim, ghosts, boss, projectiles, ward zone, pickups, waves). Public API via `index.ts`.
- `src/systems/contract/` (room plan from contract data), `src/systems/run/` (room flow, trait offers, outcome, `settleRun` with risk-tier penalties).
- `src/registry/traitHooks.ts` (7 traits on the fixed hook points) and `skillEffects.ts` (3 companion calls + talisman ward).
- `src/store/gameStore.ts` (money, trauma, solved count, run seed, last run).
- `src/scenes/` (RiftScene, WorldView shapes-only renderer, CombatHud, Overlay for trait/end panels, vfx listeners: hit-stop, shake, popups, synth SFX).
- `src/ui/OfficeApp.tsx` (Gate 1 Day placeholder, 출동 via click or Enter through InputManager).
- `src/app/services.ts` holds singletons (input, store, phase switch binding).

### Controls
WASD move · J attack (held, auto-aim) · K/Space roll (i-frames) · L talisman ward · `;` call next ready companion · 1/2/3 pick trait · J/Enter confirm.

## Verified
- `npm run check`: tsc clean, 30 Vitest tests pass (core, combat, traits, run/settlement/store).
- `vite build` succeeds (warning only: bundle > 500 kB because of Phaser).
- Headless Chromium play-test (Playwright scripts, not committed): a scripted bot cleared the full contract twice with no page errors; death path shows the fail panel (+1 trauma, loot halved) and returns to Day; a second sortie starts and keyboard works without a click.
- Fixed during play-test: switching phase inside `RiftScene.update` stopped the scene and then rendered destroyed objects, killing the game loop.

## Known issues / unverified
- **Balance untested by a human.** The kiting bot took almost no damage → combat is probably too easy; tune in `src/data/`.
- No Tiled map yet: rooms are a plain rectangle arena (HANDOFF step "one Tiled room" deferred).
- No save/load (`SaveManager` not built); refresh resets progress.
- Sound is synthesised placeholder beeps; visuals are plain shapes.
- **Build is behind the design:** current build has the talisman thrower (≈ weapon B draft) + 3 placeholder companions. Decided design for Gate 1 = director alone with weapon A (newspaper sword + draw/parry). Placeholder companions may be deleted freely (user said so).
- Only keyboard; no gamepad/touch.
- A dev-only `window.__rift` handle exists for automated play-testing (stripped in production builds).

## Pending ARCHITECTURE changes (apply when Gate 2 hub work starts)
(a) Day hub becomes a walkable Phaser scene with React panels on top, so §1 and Rule 4 phase wording must change; (b) InputManager needs a touch context; (c) night combat limited to ≤4 action buttons (current build follows this).

## Design decisions this session (see docs/design/)
- `world.md` (new): free "anything-goes" Seoul (Korean yokai 7 : Western 3) but tone guardrails are mandatory: real Seoul life places, Seoul vibe + city-pop, lazy-genius director, Gintama-style comedy, rent pressure.
- `protagonist.md`: weapons A (newspaper-wrapped 사인검, draw/parry 일섬) as starter, B (talisman label gun, stack 5+ then ignite) unlocked later. C dropped for now.
- `hub.md`: rooftop office in an Euljiro printing-alley building; main cast = bookkeeper/part-timer (ordinary person, not a shaman) + spirit cat, both story-unlocked; menus open by clicking cast members; landlady on hold.
- `party.md` (new): solo start; later party slots + trait decks (each weapon and companion adds its own trait cards; offer cards show their source). Gate 1 = base + weapon deck only.
- `ARCHITECTURE.md` §5 Gate 1/2 text updated to match.

## Next step
1. Rework Gate 1 combat to the decided design: remove placeholder companions, add weapon A (melee swings, newspaper sheath, draw/parry strike on enemy attack timing), split traits into base + weapon decks (`source` field).
2. User plays and gives feel feedback; tune `src/data/`.
3. Then: Tiled room layouts, SaveManager (schemaVersion 1).
