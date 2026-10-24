# HANDOFF

## Status (2026-10-24)
- Repository initialized with `ARCHITECTURE.md` (v1.1) and `CLAUDE.md`. No code yet.
- Added `GUIDE.md` (plain-Korean map of the codebase for the human owner; planned folders marked as such).
- Added `docs/design/hub.md` v0 draft: Day lobby = office interior (stage) + bottom dock (≤5 slots) + single `출동` CTA, features opened as bottom sheets / fullscreen, driven by a `LOBBY_FEATURES` data table. **Still under discussion with the user** — open questions listed in section 6. Not yet reflected in `ARCHITECTURE.md`.

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
- Next: settle the open questions in `docs/design/hub.md` §6 with the user, then continue Gate 1 scaffolding above. Gate 1 lobby = office background + `출동` + settings only.
- Added game design decision log (now split into `docs/design/` modules: single fixed protagonist + swappable exorcism tools, 1 contract = 1 run = 10–15 min, rent/debt pressure, ghosts recruitable by purification, PC paid / mobile F2P, asset-light principles).
- **Pending ARCHITECTURE changes (not applied yet, apply when Gate 2 hub work starts):** (a) Day hub becomes a walkable Phaser scene with React panels on top, so §1 "React mounted only in Day" and Rule 4 phase wording must change; (b) InputManager needs a touch context (virtual stick / tap-to-move) since mobile is a confirmed later target; (c) night combat limited to ≤4 action buttons for mobile.

## Session note (2026-10-24, design modularized)
- Design split into per-module docs under `docs/design/` (README index + platform, protagonist, contract, run-result, recruit, economy, hub, monetization, art). `docs/GAME_DESIGN.md` removed; `docs/LOBBY_DESIGN.md` moved to `docs/design/hub.md`.
- Decided this session: failure penalty by risk tier (base = trauma + partial run-loot loss; high-risk opt-in adds gear loss; EXP/currency loss held as data toggles); mobile monetization = cosmetics/convenience/season pass, never penalty removal or rental-market cash; recruitment = normal ghosts low-chance on purification, district boss ghosts guaranteed via story contract.
- `ARCHITECTURE.md` §3 updated: new module folders (contract/, run/, recruit/, shop/, hub/, vfx/, postfx/, ui/features/) and a "Module boundaries" subsection (index.ts-only imports, one design doc per module, platform branching only in core/platform.ts).
- Docs only; `npm run check` still not runnable (no package.json).
- Next: Gate 1 scaffolding (see top).
