# HANDOFF

Branch: `main` (the user merged all work into main on 2026-10-26; work directly there unless told otherwise). Read `ARCHITECTURE.md` first, then this file. The human's map is `GUIDE.md` (Korean, keep in sync). What is decided vs open (2026-10-26 design review): `docs/design/1-foundation/direction.md`. The plan per gate, what is missing and why: `docs/design/roadmap.md`. Story frame and open questions: `docs/design/1-foundation/story.md`.

## Status (2026-10-26)
- 2026-10-26 (third session, code): **Gate 2-A day loop + contract board + operations map built**, and floors reworked. New `src/systems/office/` (pure): day counter, rent every 7 days (450) with debt, generated general contracts (7 story frames × 6 Euljiro nodes) and bounties (node contamination 4–5), bundling (a success also finishes general offers on the same node), node contamination (daily rise, spread along links, expired offers), fog (a node's ghosts show once visited). The front door now opens the board + SVG map (`src/ui/features/board/`), the bookkeeper's ledger shows day / rent / debt and a morning report. Runs take floor plans from the chosen offer (`RunSetup.floors/fee/offerId`, `store.nightPlan()`). Save v2 with v1 migration. Floors: room roles (start / exit = farthest walk with 2 guards / treasure heap / rest), **sealed stairs** until the floor's strong ghosts are down, bounty **arena** floor, per-floor **themes** (code-drawn colours in `FLOOR_THEMES`). Story contract is now 4 floors + boss. Master sprite + 26-colour palette in `assets/master/`, `assets/palette/master.gpl`; master-frame procedure and the Soul Knight review in `art-pipeline.md`.
- 2026-10-26 (second session, docs only): proposals written, none decided — art pipeline steps `docs/design/5-business/art-pipeline.md` (master-frame editing instead of regenerating, fixed palette + checks, editor pass, PixelLab trial), contract board + operations map with node contamination + squad operations `docs/design/4-day/contracts-map-ops.md`, reference `docs/reference/dispatch-games.md` (MGSV, XCOM 2, AC Brotherhood, Dragon Age). User asked whether more floors fix run length: yes as one data edit in `contracts.data.ts`, but measure a human run first (bot 70 s ≈ 23 s/floor).
- 2026-10-26 was a design review only (no code change): the user compared our plan with another AI's summary. Recorded in `direction.md`; open items must not be treated as decided (see Decisions to respect).
- **Gate 1** (night combat) is feature-complete and waits on the user's playtest; art/sound polish is a parallel track, not a gate condition.
- **Gate 2** (office & growth): hub + 2-A day loop (board, map, rent) are in. Left in 2-A: dialogue box, title / new game.
- Flow now: office hub (walk, `E`) → front door → contract board + map (A/D or click, Enter) → night on the chosen offer (sealed floors, then boss / arena / last stairs) → settlement (bundle fees) → next morning (rent, contamination, new offers) → hub. The bookkeeper appears after 1 solved contract (`E` → ledger). Autosave, save v2.

## Functional modules (where things live)
| Function | Code | Design doc |
|----------|------|------------|
| Input (single owner, context stack, mouse as `Mouse0/2`, `pause`=Esc, `interact`=E) | `src/core/InputManager.ts`, `src/data/input.data.ts` | `docs/design/1-foundation/platform.md` |
| Save (schemaVersion 2, v1 → v2 migration, migrate, `.bad` backup, autosave on store change) | `src/core/SaveManager.ts`, `src/app/services.ts`, `src/store/gameStore.ts` | `1-foundation/save.md` |
| One floor (pure, fixed 1/60 tick, tile units) | `src/systems/rift/` — `mapgen`, `physics`, `player` (move / dash / 3-hit combo with finisher recovery / 발도: outcome on press, `drawStartup` stance, `releaseDraw`), `enemies`, `boss`, `spawner`, `combat`, `step`, `hooks`; public API `index.ts` (incl. `makeEnemy` for tests) | `2-night/combat.md`, `enemies.md`, `contract.md` |
| One night (floors, cards, stats incl. `drawSlash`, settlement) | `src/systems/run/` | `2-night/run-result.md`, `3-growth/party.md` |
| Office day loop (day, rent, debt, board generation, bundling, contamination, offer → floor plans) | `src/systems/office/`, `src/data/office.data.ts`, `nodes.data.ts`, `requests.data.ts`, `contracts.data.ts` (story), `src/ui/features/board/`, `src/ui/features/ledger/` | `4-day/contracts-map-ops.md`, `2-night/contract.md` |
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
- Open, not decided (do not build as if decided): the big story and ending (decide together with the user), the first companion (gumiho as companion is undecided; the user is considering a tutorial-like first sortie that just defeats one strong ghost), recruiting by story episodes vs chance/rarity (monetization trade-off), human exorcist companions, how heavy squad operations are (for now: Girls' Frontline–style logistics that bring back resources; may change; tied to the "take along or send out" choice), keeping per-run cards, night length, the cat's role, rental market and weapon B.
- Scope: Gate 2 + the art/sound track. Gate 3+ out of scope. Bash calls sometimes fail with an auto-mode classifier error; retry once. Do not `pkill -f` a pattern that matches your own shell command (it kills the shell); kill by port (`kill $(lsof -ti :5199)`).

## Verified (last, 2026-10-26)
- `npm run check`: tsc clean, 75 tests pass (new: `tests/office.test.ts` board / rent / expiry / bounty / bundling / store / v1→v2 migration / generated nights playable by the bot; `tests/mapgen.test.ts` exit room far from start, treasure, seal, fodder does not hold the seal, arena end).
- Balance (story contract, 8 seeds): naive 0/8, skilled 8/8, skilled clear time 137–237 s (was 22–95 s with 3 open-stairs floors).
- Playwright smoke (headless Chromium, dev server): board opens from the door, A/D changes the selection, Enter starts a night on the chosen general offer (alley theme, "계단 봉인 · 강적 6" in the HUD); after 6 simulated nights the board shows day 7, bounties on contaminated nodes, and the ledger shows the rent paid and the morning report. No page errors (one 404 is the missing favicon).
- Not verified: real-time play by a human of sealed floors / arena / themes; contamination pacing and rent size; the map on a phone-sized window.

## Known issues / unverified
- No human playtest: parry window 0.22 s, 발도 stance 0.12 s, speeds, run length are bot-tuned.
- Run length: bot ≈ 3 min on the story contract after the seal + 4th floor; the 10–15 min target is still unmet and may be the wrong target (user measured 1–2 min before this change). Decide after a human run.
- Economy numbers (rent 450, fees, contamination 25%/day) are guesses; a week of play is needed.
- Squad operations (3 in `contracts-map-ops.md`) not built: waits for the first companion.
- No volume / mute setting.
- Hub art is shapes; cat, Esc full menu, rent, contract board, dialogue not built; unlocks use "solved ≥ N".
- Trauma is only a number with no effect.
- Subway ghost, sword, stairs still shapes; gumiho has one static frame; combo reuses v3 frames; no back-view walk; walls not y-sorted with bodies; black jacket can sink into dark floors.
- Keyboard + mouse only; synth SFX; dev-only `window.__rift` / `window.__hub`.

## Next steps (detail and reasoning in `docs/design/roadmap.md`)
Gate 1 (pass):
1. User playtest → retune; decide the night length target; add a volume/mute line to the pause menu.
Gate 2-A (day loop):
2. ✅ day counter, rent, debt, generated contracts, board + map (2026-10-26). Next: playtest a week, retune `office.data.ts`.
3. Floor-gen next steps: hand-made room templates per theme (Spelunky / Isaac style prefabs), monster-house room, tileset art per theme.
4. Minimal dialogue box (name, portrait slot, lines) for story beats (bookkeeper arrival, a recruit).
5. ✅ Save v2. Title / new game still open.
Gate 2-B (growth) — needs the user's decisions first (recruit method, first companion, first sortie, story):
6. First companion: party slot, call skill on the 4th combat button, 3 companion cards.
7. Minimal squad operation (send a companion out, resources come back; capped below night income) so "take along or send out" becomes a choice.
8. Trauma effects (card hooks) + recovery; companion traits (기질). Reputation and weapon B only after the above proves fun.
9. Ask the user: cat's Gate 2 role (proposal: trauma recovery now, appraisal/black market with relics in Gate 3).
Design (with the user): big story and ending (`story.md` questions), recruit method (`3-growth/recruit.md` table).
Art/sound track (parallel): Gemini 0-B frames → subway ghost, sword, tiles, props → gumiho pattern poses → office/bookkeeper/cat art → signs → real SFX/BGM; spritekit master palette / target height / in-game comparison.

## History (short)
Action prototype (auto-aim) lost to a stand-still bot → turn-based grid → user disliked it → Core Keeper–style real-time on a tile grid (old code: `d170e4b`, `0278d77`). Then: swarm fodder, keyboard-only play, one key per action, 발도 tiers, quieter effects, design docs in 5 groups, SaveManager, `draw/` split, art lab, Gemini pipeline, 24px tiles, pause menu, boss → gumiho, director poses. 2026-10-25: director motion cleanup (stable head, anchors) → Gate 2 start with a walkable hub, then the office interior → feel pass (damage order, 3-hit combo + smears, back-view attacks, 발도 stance, face fixes, gumiho pixel art) → module cleanup (shared sprite kit, hub look data, tests via module index) and the gate roadmap review. 2026-10-26: design review against another AI's summary → `direction.md` (decided / open), `story.md` (frame only), recruit / economy / contract / roadmap updated; gumiho-as-first-companion withdrawn as undecided.
