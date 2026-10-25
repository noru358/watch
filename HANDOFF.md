# HANDOFF

## Status (2026-10-25) — Gate 1: Core Keeper–style real-time night, full contract playable
Day placeholder → 출동 → Euljiro contract: 3 random floors (rooms + 2-tile corridors, ☎ payphone on floor 2) → boss room (윤전기 귀신) → settlement → Day.

### How we got here (read `docs/design/combat.md`)
1. Action prototype (auto-aim) lost: a stand-still bot won 6/8 → switched to grid turn-based.
2. User played the turn-based greybox: felt flat, and turn-based isn't their taste; Argon proposed Core Keeper style → real-time on a tile grid, keeping the lessons: mouse aim (no auto-aim), every enemy attack is a floor telegraph, only melee telegraphs can be countered (발도 in the last 0.22 s), dashes/sweeps must be dodged, no contact damage.
3. Acceptance test `tests/balance.test.ts` (8 seeds): stand-and-swing bot ≤ 2 wins (now 0/8), telegraph-reading bot ≥ 6 (now 7/8).
Old code: action prototype `d170e4b`, turn-based `0278d77`.

### Code map
| Area | Path |
|------|------|
| Wiring | `src/app/services.ts`, `src/main.ts` |
| Infrastructure | `src/core/` (InputManager now also reads mouse buttons as `Mouse0`/`Mouse2` + pointer position; EventBus, SeededRNG, PhaseController) |
| Numbers & text | `src/data/*.data.ts` (units: tiles, seconds), `src/i18n/` |
| Card behaviour | `src/registry/cardEffects.ts` |
| One floor | `src/systems/rift/`: `types.ts`, `mapgen.ts`, `physics.ts` (tile collision, LOS, flow field, telegraph geometry), `player.ts` (move/dash/swing/draw), `enemies.ts` (ghost AI + telegraph resolution), `boss.ts`, `combat.ts` (damage), `step.ts` (fixed tick, pickups, exits), `hooks.ts` |
| One night | `src/systems/run/` (floors, cards, `stats.ts`, `settle.ts`) |
| Screens | `src/scenes/rift/` (RiftScene: fixed step, hit-stop, world camera ×2.5 following the director + 1:1 UI camera via layers, mouse→world aim; RiftView: 3/4 walls, shadows, y-sort, separate sword, telegraph shapes), `src/scenes/shared/` (Overlay on UI layer, vfx on world layer, sfx) |
| Tests | `tests/core`, `tests/rift` (rules), `tests/run`, `tests/balance` (+ `bots.ts`, `helpers.ts`) |

### This session's follow-up (user feedback on the real-time build)
- User: "much better, go with this". Added swarm fodder: `dokkaebibul` (2 HP, contact 1 dmg, no telegraph, `fodder: true`), waves from `src/systems/rift/spawner.ts` driven by `swarm` in each floor plan (`contracts.data.ts`), spawned 7–12 tiles away on reachable tiles, capped. Fodder kills don't hit-stop.
- Feel ("sticky"): swing slowdown only for the first 0.1 s at 70% (was the whole swing at 45%), small hit-stops 0.012 s with a 0.15 s cooldown in `RiftScene.freeze`, corner correction in `physics.moveBody(…, nudge)`.
- Keyboard-only: Z/X/C and Shift added; keyboard aim = move direction, or nearest ghost within 3 tiles when standing still.
- HUD split into `src/scenes/rift/RiftHud.ts`: top info + bottom key bar (dash cooldown, 발도 "지금!" cue from `counterable()` in `systems/rift/player.ts`, "일섬 가능"). UI text rendered via `scenes/shared/text.ts` `crisp()` (resolution 3) — fixes blurry text when the canvas is scaled.
- New design module `docs/design/enemies.md` (roles: strong / swarm / boss).

## Verified
- `npm run check`: tsc clean, 40 tests pass (incl. balance: naive 0/8, skilled 8/8 with swarm). `vite build` OK.
- Keyboard-only browser run (Playwright, DPR 2): swarm waves appear, HUD bar readable and sharp, no page errors.
- Playwright (scratchpad scripts, not committed): day → night start, camera/walls render, staged close fight (yellow telegraph, swing, parry → "검신 노출", darkness after a dalgyal hit), boss floor row sweep. No page errors.

## Known issues / unverified
- **No human has played the real-time version.** Parry window 0.22 s, move speed, teleport frequency are bot-tuned only. Bot clears a night in ~1 min of game time; a human will be slower — check run length.
- Visuals are shapes; cheonyeo looks crude. Walls are not y-sorted with bodies (bodies always draw over raised wall tops).
- No SaveManager, keyboard+mouse only (no gamepad/touch), synth SFX.
- Dev-only `window.__rift` handle for bots (stripped in production builds).

## Pending ARCHITECTURE changes (apply when Gate 2 hub work starts)
(a) Day hub = walkable Phaser scene (souls-style, `E` to talk) with React panels → §1 and Rule 4 wording; (b) touch context in InputManager; (c) keep ≤4 combat buttons (now: move, slash, dash, draw + mouse aim).

## Next step
1. User plays and reports feel (movement, swing, 발도 timing, dash, boss).
2. Tune `src/data/`; add hit feel (lunge/knockback visuals, slash trail polish), y-sort walls.
3. SaveManager (schemaVersion 1); then Gate 2: walkable rooftop hub (bookkeeper, cat), companions with one party slot, weapon B.
