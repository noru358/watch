# Seoul Nightwatch — Architecture

How the code is built and the rules every change follows. Structure only: what the game is, the plan and long-term ideas live in `docs/design/` (`roadmap.md` for gates and later systems). If a request conflicts with a rule here, say so instead of breaking it.

## Stack
TypeScript (`strict`) + Vite. Night (floors, combat, night HUD and pause) and the walkable office hub and title are Phaser 3 scenes. Day panels (board, ledger, desk, sofa, bench, morning report) are React, mounted only in the day phase, one at a time. State lives in one plain TypeScript store (`GameStore`) that neither Phaser nor React owns. Floors are generated in code (no map editor). Tests: Vitest. Packaging (later): Electron + Steam.

## Hard rules
1. **No hard-coding.** Numbers, odds, cooldowns and text never sit in logic files. Game data is typed tables in `src/data/*.data.ts`; ids are string-literal unions (`src/types/ids.ts`, or derived from a table's keys); every on-screen string goes through `t(key)` with keys typed from `src/i18n/ko.ts`, and `en.ts` has the same keys. A content addition should be a data row plus its text.
2. **Behaviour by registered parts.** Upgrade cards are functions registered by id (`src/registry/cardEffects.ts`). Skills, gear specials and supplies are typed data rows — `when` (a hook) + `if` (conditions) → `do` (an effect part) + numbers — run by the parts in `src/registry/effects/parts/` (one part per file). Untyped string scripts are not allowed. Hooks are the fixed list in `src/registry/hookPoints.ts`; adding a hook or a part is a design change: note it in `HANDOFF.md`.
3. **State vs presentation.** State changes only through `src/systems/*` functions or `GameStore` actions. Effects, sounds, popups and shakes listen to typed events (`src/types/events.ts`, `EventBus`). If removing a listener would change the save, it does not belong on the bus.
4. **One input owner.** All keys and mouse buttons are read from `window` through `InputManager` with a context stack (`night` / `day` / `modal`); only the top context hears input. Panels open and close only through `openFeature` / `closeFeature`; dialogue pushes `modal` too; phases switch only through `setPhase`. Night combat has at most four action buttons (slash J, dash Space, 발도 K, active skill L); a new one replaces one. After closing any window, keys must work without a click.
5. **Small files, clean layers.** Files stay under ~400 lines, split by responsibility. `src/systems/` and `src/store/` never import Phaser or React; drawing code holds no game rules. Each `src/systems/<module>/` is imported only through its `index.ts`.
6. **Deterministic and save-safe.** No `Math.random()` in gameplay: `SeededRNG`, passed in. Night simulation runs on a fixed tick in tile units; every enemy attack is a floor telegraph. A day's board is fixed by the save's seed and the day. Any change to the save shape bumps `SAVE_VERSION` with a migration and a test (`src/core/SaveManager.ts`).
7. **Stats are computed, never stored.** `computeExorcistStats` (`src/systems/run/stats.ts`) derives the director's numbers from base, training, skills, gear and cards; systems read `f.stats`, never the source tables.
8. **Work discipline.** Edit surgically (no whole-file rewrites for a part, no "rest unchanged" placeholders). New or changed logic in `src/systems/` ships with tests. `npm run check` passes before every commit. Report honestly what was and was not verified.

## Where things live
```
src/app/        wiring: singletons, phase switch, which panel is open, dialogue and phone texts
src/core/       InputManager, EventBus, SeededRNG, SaveManager, phase
src/types/      ids, events, shared types
src/i18n/       ko.ts (key source), en.ts, t()
src/data/       every table: ghosts, objectives, modifiers, requests, nodes, office, chapters, contracts,
                story, training, skills, gear, facilities, cards, weapons, reputation, feel/look tables
src/registry/   hookPoints, cardEffects, effects/ (conditions, runner, parts/)
src/systems/    pure rules, one folder per module: rift (one floor), run (one night), office (board,
                days, contamination, chapters), growth, gear, reputation, hub, story
src/store/      GameStore and its actions
src/scenes/     Phaser screens: rift (night), hub (office), title, shared (overlay, vfx, sfx, sprite kit)
src/ui/         React: FeatureHost + features/<panel>/
tests/          Vitest, plus bots.ts (scripted players) and helpers.ts
tools/          catalog (총괄 장부 + docs/catalog.md), spritekit, artlab
assets/         source/ raw art (never deleted), sprites/ game sprites
docs/           design/ (what and why), rules/ (what the code computes), reference/, catalog.md, history.md
```
React reads the store with `useSyncExternalStore`, Phaser with `subscribe`. Modules talk through store actions and shared types, not each other's state. When platform differences arrive (mobile later), they are decided in one place, never inside game rules.

## Gates
Each gate must be fun before the next starts; if it is not, change the loop instead of polishing. Now: Gate 2 (office & growth), with art and feel polish in parallel. Gates, later systems and what is out of scope: `docs/design/roadmap.md`.
