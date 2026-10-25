# HANDOFF

Branch: all work is on `claude/admiring-keller-rdwk4w` (not `main`). Read `ARCHITECTURE.md` first, then this file. The human's map is `GUIDE.md` (Korean, keep in sync).

## Status (2026-10-25) — Gate 1 feature-complete, art/sound polish in progress
Day placeholder (React `OfficeApp`) → 출동 → contract `lights_out` 「불 꺼지는 동네」: 3 random floors (rooms + corridors, ☎ payphone on floor 2) → boss room (구미호 「월하」, id `gumiho`) → settlement → Day. Autosave of office state. Not yet human-played at length; all tuning is bot-based.

## Functional modules (where things live)
| Function | Code | Design doc |
|----------|------|------------|
| Input (single owner, context stack, mouse as `Mouse0/2`, `pause`=Esc) | `src/core/InputManager.ts`, `src/data/input.data.ts` | `docs/design/1-foundation/platform.md` |
| Save (schemaVersion 1, migrate, `.bad` backup, autosave on store change) | `src/core/SaveManager.ts`, `src/app/services.ts`, `src/store/gameStore.ts` | `1-foundation/save.md` |
| One floor (pure, fixed 1/60 tick, tile units) | `src/systems/rift/` — `mapgen`, `physics` (AABB, corner nudge, LOS, flow field), `player` (move/dash/swing/발도 tiers), `enemies`, `boss` (sweep band / pounce / summon `summonCount` / phase 2), `spawner` (swarm waves), `combat`, `step` (+ `giveUp`), `hooks` | `2-night/combat.md`, `enemies.md`, `contract.md` |
| One night (floors, cards, stats, settlement) | `src/systems/run/` | `2-night/run-result.md`, `3-growth/party.md` |
| Card effects (fixed hook points) | `src/registry/cardEffects.ts`, `src/data/cards.data.ts` | `3-growth/party.md` |
| Night screen flow (fixed step, hit-stop, cameras, aim, pause/cards/payphone/end modes) | `src/scenes/rift/RiftScene.ts`, `RiftHud.ts`, `src/scenes/shared/Overlay.ts` | `2-night/combat.md` |
| Drawing (layers, y-sort, night lighting) | `src/scenes/rift/RiftView.ts`; per-thing files in `draw/` (`tiles`, `director`, `directorFrames`, `ghosts`, `props`, `telegraph`, `pixelSprite`, `art/ghostArt`, `art/propArt`) | `5-business/art.md` |
| Director sprite anims (frames "set:number", idle/walk/attack/draw/dash/hurt/ko, hand offsets) | `src/data/sprites.data.ts` | `5-business/director-sprite-spec.md` |
| Feel & look numbers (tile 24px, zoom 1.75, hit-stop, shake, popups, palette, lights) | `src/data/feel.data.ts` | `2-night/combat.md`, `5-business/art.md` |
| Presentation listeners (popups, shake, sfx) | `src/scenes/shared/vfx.ts`, `sfx.ts` | — |
| Assets | `assets/source/` (raw, never delete), `assets/sprites/` (cleaned); rules in `assets/README.md` | `5-business/art.md` |
| Asset tools (outside the build) | `tools/spritekit/clean_sheet.py` (grid detect, median resample, flood-fill + magenta-fringe removal, blob crop, shared k-means palette); `tools/artlab/` (letter-grid pixel art lab, Galmuri OFL font) | `5-business/art.md` |
| Tests | `tests/core`, `rift`, `run`, `save`, `balance` (+ `bots.ts`, `helpers.ts`) | — |

## Decisions to respect
- Art: chunky Soul Knight–style pixels, 2-head chibi, director Gemini sheet v1 is the style master (`assets/source/gemini/director-sheet-v1.png`). Right-facing frames only, left mirrored. Judge new art in the game screen, not on the magenta background. My own letter-grid director attempts were rejected and removed; ghosts drawn in the art lab are temporary.
- Boss/story: visual appeal first, story second; not tied to real places/industries (gumiho replaced a printing-press concept).
- Gemini prompts: `docs/design/5-business/gemini-asset-specs.md` (common rules require the director sheet + a game screenshot, same proportions / pixel size / muted colours). Item 0 = director extra frames.
- Personal reference photos and third-party game screenshots are not committed.
- Scope: Gate 1 only until the user says "Gate 1 통과". Bash calls sometimes fail with an auto-mode classifier error; retry once, otherwise use Read/Edit and retry later.

## Verified (last)
- `npm run check`: tsc clean, 47 tests pass (balance: naive ≤ 2/8, skilled ≥ 6/8 held through every change).
- Playwright (scratchpad scripts, not committed): idle / attack / 발도 / dash poses switch, sword at hip height; Esc pause opens/closes, give up → end screen; boss floor renders the gumiho placeholder and phase-2 colours; no page errors.

## Known issues / unverified
- No long human playtest: parry window 0.22 s, speeds, run length are bot-tuned.
- Ghost pixel density (art-lab sprites at 2x) differs from the director; subway ghost, boss, sword, stairs still shapes. Walls are not y-sorted with bodies.
- Black jacket can sink into the dark floor (needs a rim light).
- Keyboard + mouse only; synth SFX; dev-only `window.__rift` handle (stripped in production).

## Pending ARCHITECTURE changes (apply when Gate 2 hub work starts)
(a) Day hub = walkable Phaser scene (souls-style, `E` to talk) with React panels → §1 and Rule 4 wording; (b) touch context in InputManager; (c) keep ≤ 4 combat buttons (now: move, slash, dash, draw + mouse aim; Esc is menu only).

## Next steps
1. When the user sends Gemini files (subway ghost, cheonyeo, sword, a game screenshot): archive in `assets/source/gemini/`, clean with `clean_sheet.py`, and extend the tool with (a) a master palette option (from the director sheet + screenshot), (b) target height per asset, (c) an in-game comparison image (paste cleaned sprites into a game screenshot). Show the comparison; connect what the user picks (`draw/art/` or a sprites table like `sprites.data.ts`).
2. Then the rest of Gate 1 art from the spec (boss frames for sweep/pounce/summon/phase 2/defeat, dalgyal, dokkaebibul, tiles, props), director rim light, Hangul pixel-font signs and props on the map, real SFX + one night BGM slot.
3. Ask the user to play; retune from feedback.
4. On "Gate 1 통과": Gate 2 — walkable rooftop hub (bookkeeper + cat, React panels) → one companion slot → weapon B (label gun) → persistent traits/traumas + recovery → save v2. Apply the pending ARCHITECTURE changes first.

## History (short)
Action prototype (auto-aim) lost to a stand-still bot → turn-based grid → user disliked it → Core Keeper–style real-time on a tile grid (old code: `d170e4b`, `0278d77`). Then: swarm fodder, keyboard-only play, smoother feel, one key per action, 발도 tiers (slash < counter = focus strike), quieter effects, design docs grouped into 5 folders, SaveManager, `draw/` split, art lab samples, Gemini pipeline, scale fix (24px tiles), pause menu, boss → gumiho, director attack/발도 poses.
