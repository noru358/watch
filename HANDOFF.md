# HANDOFF

Branch: work continues on `claude/vigilant-turing-c8w4ga` (fast-forwarded from `claude/admiring-keller-rdwk4w`, which holds everything up to `e500602`; `main` is still only the first docs commit). Read `ARCHITECTURE.md` first, then this file. The human's map is `GUIDE.md` (Korean, keep in sync). The plan per gate, what is missing and why: `docs/design/roadmap.md`.

## Status (2026-10-25)
- **Gate 1** (night combat) is feature-complete and waits on the user's playtest; art/sound polish is a parallel track, not a gate condition.
- **Gate 2** (office & growth) has started: only the walkable office hub exists. Next is 2-A, the day loop (see Next steps).
- Flow now: office hub (walk, `E`) → front door → sortie panel → night `lights_out` (3 floors + gumiho) → settlement → back to the hub. The bookkeeper appears after 1 solved contract (`E` → ledger). Autosave, save v1.

## Functional modules (where things live)
| Function | Code | Design doc |
|----------|------|------------|
| Input (single owner, context stack, mouse as `Mouse0/2`, `pause`=Esc, `interact`=E) | `src/core/InputManager.ts`, `src/data/input.data.ts` | `docs/design/1-foundation/platform.md` |
| Save (schemaVersion 1, migrate, `.bad` backup, autosave on store change) | `src/core/SaveManager.ts`, `src/app/services.ts`, `src/store/gameStore.ts` | `1-foundation/save.md` |
| One floor (pure, fixed 1/60 tick, tile units) | `src/systems/rift/` — `mapgen`, `physics`, `player` (move / dash / 3-hit combo with finisher recovery / 발도: outcome on press, `drawStartup` stance, `releaseDraw`), `enemies`, `boss`, `spawner`, `combat`, `step`, `hooks`; public API `index.ts` (incl. `makeEnemy` for tests) | `2-night/combat.md`, `enemies.md`, `contract.md` |
| One night (floors, cards, stats incl. `drawSlash`, settlement) | `src/systems/run/` | `2-night/run-result.md`, `3-growth/party.md` |
| Card effects (fixed hook points) | `src/registry/cardEffects.ts`, `src/data/cards.data.ts` | `3-growth/party.md` |
| Night screen flow (fixed step, hit-stop, cameras, aim, pause/cards/payphone/end modes) | `src/scenes/rift/RiftScene.ts`, `RiftHud.ts`, `src/scenes/shared/Overlay.ts` | `2-night/combat.md` |
| Night drawing (layers, y-sort, lighting) | `src/scenes/rift/RiftView.ts`; `draw/` per thing: `director` (pose picking: combo steps, back view, 발도 stance/cut/sheathe), `sword` (blade, smear, 발도 FX), `ghosts` + `art/ghostArt` (incl. `GUMIHO_ART` phase 1/2), `props` + `art/propArt`, `tiles`, `telegraph` | `5-business/art.md` |
| Shared sprite kit (both scenes) | `src/scenes/shared/draw/` — `pixelSprite` (runs, anchors, `stackSprites`, `gridSprite` cached per rows + palette), `directorFrames` (load + `directorSprite`: body anchor, stable head), `common` | `5-business/art.md` |
| Director sprite tables | `src/data/sprites.data.ts` (frames, `combo`, `back`, hands, 발도 show times) | `5-business/director-sprite-spec.md` |
| Day hub (walk, `E` spots, unlocks, panels) | `src/systems/hub/`, `src/data/lobby.data.ts`, `src/data/hubLook.data.ts`, `src/scenes/hub/`, `src/app/features.ts`, `src/ui/FeatureHost.tsx`, `src/ui/features/{sortie,ledger}/` | `4-day/hub.md` |
| Feel numbers (tile 24px, zoom 1.75, hit-stop incl. `hitStopDraw`, shake, smear, popups, palette, lights) | `src/data/feel.data.ts` | `2-night/combat.md`, `5-business/art.md` |
| Presentation listeners (popups, shake, sfx incl. `stance`/`cut`) | `src/scenes/shared/vfx.ts`, `sfx.ts`, `src/data/sfx.data.ts` | — |
| Assets | `assets/source/` (raw, never delete), `assets/sprites/` (cleaned; v3 has `face_edit.done`); rules in `assets/README.md` | `5-business/art.md` |
| Asset tools (outside the build) | `tools/spritekit/clean_sheet.py`, `tools/spritekit/face_edit.py` (open eyes, hurt frown; run once per cleaned folder); `tools/artlab/` (letter-grid lab, `gumiho_grid.py`) | `5-business/art.md` |
| Tests | `tests/core`, `rift`, `run`, `save`, `balance`, `hub` (+ `bots.ts`, `helpers.ts`) | — |

## Decisions to respect
- Art: chunky Soul Knight–style pixels, 2-head chibi; the user likes the mob ghosts' pixel density. Director Gemini sheet v1 is the style master. Right-facing frames only, left mirrored; blade and smear rotate to the aim; only upward attacks use the back view. Judge art in the game screen.
- Damage order: any normal hit < plain 발도 < counter = focus strike (tested). 발도 outcome is judged on the press; damage lands after the 0.12 s stance.
- Hub is the office interior (not the rooftop outside); the rooftop is only where the office is.
- Boss/story: visual appeal first, not tied to real places/industries.
- Gemini prompts: `docs/design/5-business/gemini-asset-specs.md` (0-B = director combo / back view / face).
- Personal reference photos and third-party screenshots are not committed.
- Scope: Gate 2 + the art/sound track. Gate 3+ out of scope. Bash calls sometimes fail with an auto-mode classifier error; retry once. Do not `pkill -f` a pattern that matches your own shell command (it kills the shell); kill by port (`kill $(lsof -ti :5199)`).

## Verified (last, 2026-10-25)
- `npm run check`: tsc clean, 56 tests pass (balance: naive ≤ 2/8, skilled ≥ 6/8).
- After the module cleanup (file moves only) the check passes and a Playwright smoke run re-rendered the night poses and the hub flow without page errors. Earlier renders covered: combo 1/2/3 strike + recovery, up / down attacks, 발도 stance / cut / sheathe / counter, hurt frown, gumiho phase 1/2, hub flows (E, Esc, click-outside, keys right after closing, night → hub). No page errors. Scripts live in the scratchpad, not committed.
- Skilled bot clears a night in 22–95 s (≈70 s average). Humans will be slower, but the design target is 10–15 min: see roadmap Gate 1 item 2.
- Not verified: real-time feel in a real browser (headless runs slow); the user has not played the new combo / 발도 stance yet.

## Known issues / unverified
- No human playtest: parry window 0.22 s, 발도 stance 0.12 s, speeds, run length are bot-tuned.
- Run length far below the 10–15 min design target (decide: more floors/rooms or a shorter target) — needed before the Gate 2 day loop.
- No volume / mute setting.
- Hub art is shapes; cat, Esc full menu, rent, contract board, dialogue not built; unlocks use "solved ≥ N".
- Trauma is only a number with no effect.
- Subway ghost, sword, stairs still shapes; gumiho has one static frame; combo reuses v3 frames; no back-view walk; walls not y-sorted with bodies; black jacket can sink into dark floors.
- Keyboard + mouse only; synth SFX; dev-only `window.__rift` / `window.__hub`.

## Next steps (detail and reasoning in `docs/design/roadmap.md`)
Gate 1 (pass):
1. User playtest → retune; decide the night length target; add a volume/mute line to the pause menu.
Gate 2-A (day loop):
2. `systems/economy/`: day counter, weekly rent due, debt (pure functions + tests).
3. 2–3 contracts: generated general contracts from data + SeededRNG; bookkeeper contract board panel; sortie uses the chosen contract.
4. Minimal dialogue box (name, portrait slot, lines) for story beats (bookkeeper arrival, gumiho recruit).
5. Save v2 (day, debt, board, …) with migration + test; title / new game.
Gate 2-B (growth):
6. Gumiho as the first companion (recruited on clearing `lights_out`): party slot, call skill on the 4th combat button, 3 companion cards.
7. Trauma effects (card hooks) + recovery; companion traits (기질).
8. Reputation rank unlocking contracts; weapon B (label gun) + deck.
9. Ask the user: cat's Gate 2 role (proposal: trauma recovery now, appraisal/black market with relics in Gate 3).
Art/sound track (parallel): Gemini 0-B frames → subway ghost, sword, tiles, props → gumiho pattern poses → office/bookkeeper/cat art → signs → real SFX/BGM; spritekit master palette / target height / in-game comparison.

## History (short)
Action prototype (auto-aim) lost to a stand-still bot → turn-based grid → user disliked it → Core Keeper–style real-time on a tile grid (old code: `d170e4b`, `0278d77`). Then: swarm fodder, keyboard-only play, one key per action, 발도 tiers, quieter effects, design docs in 5 groups, SaveManager, `draw/` split, art lab, Gemini pipeline, 24px tiles, pause menu, boss → gumiho, director poses. 2026-10-25: director motion cleanup (stable head, anchors) → Gate 2 start with a walkable hub, then the office interior → feel pass (damage order, 3-hit combo + smears, back-view attacks, 발도 stance, face fixes, gumiho pixel art) → module cleanup (shared sprite kit, hub look data, tests via module index) and the gate roadmap review.
