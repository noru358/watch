# HANDOFF

## Status (2026-10-25) — Gate 1: combat model decided (grid turn-based), full night playable
Day placeholder → 출동 → Euljiro contract: 3 random floors (☎ payphone on floor 2) → boss room (윤전기 귀신) → settlement → Day.

### Decision this session (user delegated it)
Compared the two prototypes with identical bots, 8 seeds each:
- Action: a bot that stands still holding attack won 6/8 → skill barely mattered.
- Grid: a bump-only bot won 1/8; a bot that reads telegraphs and uses 발도 won 8/8 → skill matters.
Plus cost / mobile / party fit → **grid turn-based (Mystery Dungeon style)**. Action prototype deleted; recoverable from commit `d170e4b`.

### What changed
- Removed: `systems/combat`, `scenes/rift` (action), `registry/traitHooks.ts`, `registry/skillEffects.ts`, placeholder companions, tools/traits/combat data, `systems/contract`.
- `systems/grid` → `systems/rift` (one floor: `mapgen.ts`, `turn.ts`, `boss.ts`, `space.ts`, `hooks.ts`); `systems/run` now = a night (`run.ts` floors + cards, `stats.ts` computeExorcistStats, `settle.ts`).
- Weapon A (newspaper sword) in `data/weapons.data.ts`: slash, every 3rd consecutive hit heavy, focus gauge, 발도 (parry adjacent MELEE telegraphs only, or free 8-neighbour strike at full focus), bared blade for N turns after a draw (+slash).
- Upgrade cards renamed in code: `CardId`, `data/cards.data.ts` (`source` = base | weapon deck), `registry/cardEffects.ts` (fixed hook points). Offer = base deck + equipped weapon deck.
- Contract floors in `data/contracts.data.ts`; map numbers in `data/dungeon.data.ts`; ghosts + boss in `data/ghosts.data.ts`.
- Boss 윤전기 귀신: row sweep (phase 2: row + column), summons, adjacent strike. Sweeps and subway dashes are unparriable (`windupParriable`) — fixed after a bot trivialised the boss by hugging it.
- Payphone: stepping on it pauses the floor (`status: 'payphone'`); overlay 1 = go home (extract), 2 = keep going.
- Input actions renamed: `wait` (K/Space), `draw` (L). Night-mode switch removed.

## Code map
| Area | Path |
|------|------|
| Wiring / singletons | `src/app/services.ts`, `src/main.ts` |
| Infrastructure | `src/core/` (InputManager, EventBus, SeededRNG, PhaseController) |
| Numbers & text | `src/data/*.data.ts`, `src/i18n/` |
| Card behaviour | `src/registry/cardEffects.ts` |
| One floor | `src/systems/rift/` |
| One night | `src/systems/run/` |
| State | `src/store/gameStore.ts` |
| Screens | `src/scenes/rift/` (RiftScene, RiftView), `src/scenes/shared/` (Overlay, vfx, sfx), `src/ui/OfficeApp.tsx` |
| Tests | `tests/core.test.ts`, `tests/rift.test.ts`, `tests/run.test.ts` (+ `helpers.ts`) |

## Verified
- `npm run check`: tsc clean, 34 tests pass. `vite build` OK.
- Playwright bot (session scratchpad, not committed): full night cleared twice (boss now costs the bot HP); payphone prompt → go home → extracted result, no page errors. Floor label during card pick fixed (`f.index`).

## Known issues / unverified
- **No human has played it yet.** Tempo (`FEEL.moveRepeat`) and difficulty are bot-tuned only.
- No SaveManager (refresh resets), keyboard only, shapes + synth beeps, no Tiled maps (floors are random rooms+corridors — Tiled may not be needed).
- Dev-only `window.__rift` handle for bots (stripped in production builds).
- `docs/design/playflow.md` controls table is the pre-decision action draft (marked as such).

## Pending ARCHITECTURE changes (apply when Gate 2 hub work starts)
(a) Day hub = walkable Phaser scene (souls-style, `E` to talk) with React panels → §1 and Rule 4 wording; (b) touch context in InputManager; (c) keep ≤4 combat buttons (now: move, slash, wait, draw).

## Next step
1. User plays and gives feedback (tempo, 발도 feel, difficulty, boss).
2. Tune `src/data/`; then SaveManager (schemaVersion 1) and Gate 1 polish (hit feel for grid: lunge on attack, blade-tear effect on 발도).
3. Gate 2 prep: walkable rooftop hub, bookkeeper/cat, companions with one party slot.
