# HANDOFF

## Status (2026-10-24) — Gate 1, two night prototypes side by side
Day placeholder screen → choose a night prototype → play → settlement → back to Day (money/trauma/solved updated).
- **Action prototype** (teal button): 7-room Euljiro contract, real-time, talisman thrower (≈ weapon B draft), 3 placeholder companions, boss with phase 2.
- **Grid turn-based prototype** (yellow button): Mystery Dungeon style, 3 random floors, bump attacks, telegraphed ghost attacks, 발도 parry (adjacent only), focus gauge, upgrade cards between floors.
- The user must play both and pick the combat model (see `docs/design/combat.md`).

## Code map
| Area | Path |
|------|------|
| Wiring / singletons / night-mode choice | `src/app/services.ts`, `src/main.ts` |
| Infrastructure | `src/core/` (InputManager, EventBus, SeededRNG, PhaseController) |
| Numbers & text | `src/data/*.data.ts`, `src/i18n/` |
| Behaviour by ID | `src/registry/` (traitHooks = upgrade cards for the action prototype, skillEffects = companion + tool skills) |
| Action rules | `src/systems/combat/` (pure fixed-step) |
| Grid rules | `src/systems/grid/` (pure turn-based) |
| Shared run rules | `src/systems/contract/`, `src/systems/run/` (room flow, settlement) |
| State | `src/store/gameStore.ts` |
| Screens | `src/scenes/rift/`, `src/scenes/grid/`, `src/scenes/shared/` (Overlay, vfx, sfx), `src/ui/OfficeApp.tsx` |
| Tests | `tests/` (core, combat, traits, run, grid) |

Naming note: in code, `trait`/`TraitId` currently means the per-run **upgrade card (강화 카드)**. "기질" is reserved for future permanent companion personality/trauma.

## Verified
- `npm run check`: tsc clean, 40 Vitest tests pass.
- `vite build` succeeds (warning: bundle > 500 kB because of Phaser).
- Playwright bots (scripts in the session scratchpad, not committed): action prototype cleared twice, death path + return to Day + second sortie OK; grid prototype cleared 3 floors. No page errors.
- Bugs fixed during play-tests: phase switch inside `update` killed the game loop; grid walls were invisible; grid distant-dash parry allowed an infinite free block.
- This session (reorganisation only): `src/scenes/` split into `rift/`, `grid/`, `shared/`; docs reorganised. Type-check and tests re-run after the move.

## Known issues / unverified
- **No human has played either prototype.** Bots took little damage → both are probably too easy.
- No Tiled maps, no SaveManager (refresh resets), keyboard only, shapes + synth beeps only.
- Action prototype still has the 3 placeholder companions and the talisman thrower; decided design is the director alone with weapon A (newspaper sword + 발도). Not built yet in either prototype beyond the grid 발도.
- Dev-only `window.__rift` / `window.__grid` handles exist for bots (stripped in production builds).

## Pending ARCHITECTURE changes (apply when Gate 2 hub work starts)
(a) Day hub becomes a walkable Phaser scene (souls-style, talk with `E`) with React panels on top → §1 and Rule 4 wording must change; (b) InputManager needs a touch context; (c) ≤4 combat buttons (both prototypes follow this).

## Decisions so far → `docs/design/README.md` (module index with status)

## Next step
1. User plays both prototypes and picks the combat model.
2. Apply weapon A (newspaper sword + 발도) to the winner, delete placeholder companions, split upgrade cards into base + weapon decks; remove or archive the losing prototype.
3. Then Tiled/handmade room variety, SaveManager (schemaVersion 1), tuning from user feedback.
