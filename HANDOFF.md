# HANDOFF

## Status (2026-10-24)
- Repository initialized with `ARCHITECTURE.md` (v1.1) and `CLAUDE.md`. No code yet.
- Added `GUIDE.md` (plain-Korean map of the codebase for the human owner; planned folders marked as such).
- Added `docs/LOBBY_DESIGN.md` v0 draft: Day lobby = office interior (stage) + bottom dock (≤5 slots) + single `출동` CTA, features opened as bottom sheets / fullscreen, driven by a `LOBBY_FEATURES` data table. **Still under discussion with the user** — open questions listed in section 6. Not yet reflected in `ARCHITECTURE.md`.

## Next step — Gate 1 scaffolding
1. Vite + TypeScript (strict) + Phaser 3 + React + Vitest project setup; `npm run check` script.
2. `src/core/`: InputManager (context stack), typed EventBus, SeededRNG, phase switch (`setPhase`).
3. Minimal `src/data/` + `src/types/ids.ts` for 4 exorcists, 3 ghost types, 1 boss.
4. RiftScene with one Tiled room, leader movement and basic attack, hit-stop + damage popup.

## Verified
- Nothing yet.

## Known issues / unverified
- None.

## Session note (2026-10-24, lobby design)
- Docs only; `npm run check` not run because no `package.json` exists yet.
- Next: settle the open questions in `docs/LOBBY_DESIGN.md` §6 with the user, then continue Gate 1 scaffolding above. Gate 1 lobby = office background + `출동` + settings only.
