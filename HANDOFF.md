# HANDOFF

## Status (2026-10-25) — Gate 1: Core Keeper–style real-time night, full contract playable
Day placeholder → 출동 → Euljiro contract: 3 random floors (rooms + 2-tile corridors, ☎ payphone on floor 2) → boss room (구미호 「월하」, id printer) → settlement → Day.

### How we got here (read `docs/design/2-night/combat.md`)
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
- New design module `docs/design/2-night/enemies.md` (roles: strong / swarm / boss).

### Round 3 (2026-10-25): docs grouped, 발도 simplified, one key per action, quieter effects
- User feedback: docs too fragmented; hit effects too busy; 발도 unclear (range?); "which key counters?"; too many keys per action.
- Design docs regrouped into `docs/design/1-foundation`, `2-night`, `3-growth`, `4-day`, `5-business`, each with a README; `docs/design/README.md` is the module map (status + code location per sub-module).
- 발도 (`player.ts draw()`): always does something — wide front slash (~150°, 5 dmg); inside the 0.22 s flash window = counter (cancel, 0.9 s stun, 10 dmg, bare blade); full focus = 360° strike. 1.0 s cooldown, whiff penalty removed. Range flashes on use (0.3 s); faint circle when focus is full; HUD slot says what the next press will do.
- Keys (`input.data.ts`): WASD, J/left-click slash (hold), Space dash, K/right-click 발도, 1/2/3 choices. Arrow keys, Z/X/C/L/Shift removed.
- Effects (`feel.data.ts`, `vfx.ts`): weaker shakes, no full-screen flashes (hurt = faint red screen edge), smaller numbers (fodder numbers were removed, then restored at a smaller size after the user clarified that the problem was the hurt shake).
- Follow-up: 발도 tiers — plain slash 5 dmg / 2.6-tile front arc < counter = focus strike 10 dmg / 3.4-tile full circle (`burstReach`); the counter now also cuts everything around. Hurt shake 0.0015 / hit-stop 0.035 s. Fodder already drops 1 영력 (strong 3–5, boss 40).

### Round 4 (2026-10-25): cleanup + SaveManager, ready for the art slice
- User accepted the feel as a hypothesis ("가설적으로 ㅇㅋ, 다음 단계").
- `RiftView.ts` now only owns layers and draw order; each drawn thing has its own file in `src/scenes/rift/draw/` (`tiles`, `director`, `ghosts`, `props`, `telegraph`, `common`). These are the art swap points. Effect timings moved to `FEEL.drawFxTime` / `FEEL.swingTrailTime`.
- `src/registry/cardEffects.ts` imports rift types via the module index (was reaching into `rift/types`).
- SaveManager (`src/core/SaveManager.ts`, schemaVersion 1, `migrate()`, unreadable saves kept under `key.bad`), `GameStore.toSave()`, autosave on store change in `src/app/services.ts`, key in `src/data/save.data.ts`. Only office state is saved; a night in progress is not. Tests: `tests/save.test.ts`. Design doc: `docs/design/1-foundation/save.md`.
- Art vertical-slice asset list and sourcing options: `docs/design/5-business/art.md`.

### Round 5 (2026-10-25): art direction sample
- User wants chunky pixel art like Soul Knight / Rusty's Retirement (not dense LimeZu/Pokémon-style), worried about editing packs and conveying Seoul.
- Built `tools/artlab/` (outside the game build): sprites as letter grids in `sprites.js`, `lab.html` renders a lit printing-house basement scene + a sprite sheet, `render.cjs` screenshots it. Galmuri pixel font (OFL) in `tools/artlab/fonts/`. Output in `docs/design/5-business/img/`, notes in `art.md`.
- v1 feedback: pixel size and lighting OK. v2: director redesigned in a cheollik-style coat, male and female variants (`directorM`, `directorF`), 24px tall. v3: user's own spec — the director is an office worker by day, exorcism office director by night (투잡); sprite `directorW` (bob haircut, ink jacket, ID badge with talisman, crossbag with norigae, beige wide slacks). Docs: protagonist.md (외형), world.md, hub.md (evening hub), module map one-liner, GUIDE. v3 rejected (poor readability). v4 in `tools/artlab/v4.js`: redrawn from rules measured off Soul Knight sprites (dark outline, head ~60%, small face, 2×2 eyes, one accent), variants v4a/v4b (sword on back)/v4c (black hair); lab sprites can now carry their own palette and composites. v4 feedback: ugly legs/eyes, hair not layered, chin shadow read as a beard, why a back sword. v5 in `tools/artlab/v5.js` from reference 4 measured at native pixels (slim legs, thick upper lash eyes, layered strands, no chin shade, sword in hand). v6: long straight hair (user photo) in a 3/4 front-diagonal view; proposed facing scheme = 2 drawings (front-diagonal, back-diagonal) + flips = 4 facings (art.md). Facings decided: 4 (two diagonal drawings + flips). v6 rejected (distorted 3/4, heavy hair). v7 in `tools/artlab/v5.js` follows Soul Knight ref 4 structure (near-frontal face, hair curtains, narrow body) with the user's photo hairstyle. v7 also rejected (frontal, helmet bangs, no waves). Decision: the director sprite is made externally (user asks Gemini) from `docs/design/5-business/director-sprite-spec.md` (style rules, hex palette, 2 drawn facings + flips, 10 frames per facing, 32×32 cells, English prompt); ghosts/props/signs/lighting stay in `tools/artlab/`. Gemini sheet v1 reviewed (spec §11): baked effects and weapon, checkerboard background that matches the dark jacket, off-grid ~4.9px blocks with 5k colours per cell, frontal angles, short back hair. Revision prompt in spec §12 (magenta bg, exact 8× grid, 4×10 layout, dash angle for all ↘ frames). Gemini hit a usage limit; meanwhile built `tools/spritekit/clean_sheet.py` (grid detection, median resample, border flood-fill background removal, blob cropping, shared k-means palette) and cleaned sheet v1 into `assets/sprites/director-gemini-v1/` (usable frames listed in spec §13). User discarded my pixel edits and chose the Gemini frames as-is.
- In game now: `src/data/sprites.data.ts` (director anims → frame numbers), `draw/directorFrames.ts` (Vite glob of `assets/sprites/director-gemini-v1/frame_*.png`, loaded in `RiftScene.preload`), `draw/pixelSprite.ts` (texture or letter grid → colour runs drawn into the shared Graphics, keeps y-sort; flip, white flash, scale), `draw/director.ts` (picks idle/walk/dash/hurt/up frames from aim and render hints, mirrors for left, sword at `DIRECTOR_SPRITE.hand`; shape fallback if frames are missing).
- Ghost pixel art at 2x for cheonyeo / dokkaebibul / dalgyal (`draw/art/ghostArt.ts`); subway and printer still shapes.
- Basement tileset in `draw/tiles.ts` (colours in `PALETTE`), night lighting in `RiftView.drawLights` (multiply ambient + banded add pools, `FEEL.lights`); telegraphs draw on their own Graphics above the lighting.
- My art-lab director attempts (v2–v7) removed from `tools/artlab/`.

### Round 6 (2026-10-25): scale fix, pause menu, 2 facings
- Bodies were too big for the map and effects (37px director on 16px tiles = 2.3 tiles; ghosts at 2x), damage numbers too small. Now `FEEL.tile` 24, `FEEL.zoom` 1.75 (same tiles on screen), wall face 13px, popups 20/16/26px. Director ~1.5 tiles; ghosts 2x ≈ director height, hitboxes unchanged (in tiles). Payphone uses the art-lab pixel art (`draw/art/propArt.ts`).
- Pause: `pause` action (Esc). `RiftScene` mode `paused` (sim doesn't step), Overlay shows 계속하기 / 조작 안내 / 의뢰 포기; give up = `giveUp(f)` in `systems/rift/step.ts` (floor → dead → normal failure settlement). Test in `tests/rift.test.ts`.
- Director: right-facing frames only, left mirrored (no back view for now). Gemini sheet v2 rejected (off-style); targeted v1-based prompt in spec §15.

### Round 7 (2026-10-25): boss → 구미호, asset specs
- User: story second, visual appeal first; don't tie to Euljiro/printing. Boss is now 구미호 「월하」 (IDs renamed: boss `printer`→`gumiho`, contract `euljiro_printer`→`lights_out`). Summons 3 fox-fire wisps (`BossData.summonCount`, test added). Placeholder drawing: nine fanned tails with fire tips (pink in phase 2). Short story in `docs/design/2-night/contract.md`.
- Director shows the KO frame (21) when HP hits 0.
- Gemini prompts for the remaining Gate 1 art: `docs/design/5-business/gemini-asset-specs.md`.

### Asset storage
- Raw generated sheets are kept in `assets/source/gemini/` (v1 in use, v2 rejected), cleaned frames in `assets/sprites/`; rules in `assets/README.md`. Personal reference photos and third-party game screenshots (Soul Knight) are NOT committed.
- All work lives on branch `claude/admiring-keller-rdwk4w` (not `main`).

## Verified
- Round 6: `npm run check` 46 tests pass; Playwright: new scale renders, Esc opens/closes pause, 3 = give up → end screen, no page errors.
- Art pass: `npm run check` 45 tests pass; Playwright: director faces ↘/↙ (mirror)/↑ and dashes correctly, staged ghosts render with lighting, no page errors. Not human-played yet.
- Round 4: `npm run check` 45 tests pass. Playwright: new game writes a v1 save on 출동; a hand-written v1 save (money 777, solved 4) shows in the office after reload; keyboard run after the view split renders as before, no page errors.
- `npm run check`: tsc clean, 40 tests pass (incl. balance: naive 0/8, skilled 8/8 after the 발도 rework). All relative links in *.md resolve.
- Playwright keyboard-only run with the new keys (J/Space/K/WASD): swarm appears, 발도 slot shows "앞 크게 베기" + cooldown, a counter cue appeared once, no page errors.
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
1. User plays the art + scale pass. Gate 1 is feature-complete per ARCHITECTURE §5; what's left is the user's call that it is fun (plus polish: subway/printer art, real SFX, signs/props on the map, Gemini frames from spec §15).
2. Proposed (needs the user's go, CLAUDE.md scope rule): declare Gate 1 passed and start Gate 2 — walkable rooftop office hub first (Phaser scene, souls-style, E to talk, bookkeeper + cat, React panels), then companion with one party slot, weapon B (label gun), persistent traits/traumas + recovery, save v2. Apply the pending ARCHITECTURE changes listed above when the hub starts.
