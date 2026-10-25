# HANDOFF

Branch: all work is on `claude/admiring-keller-rdwk4w` (not `main`). Read `ARCHITECTURE.md` first, then this file. The human's map is `GUIDE.md` (Korean, keep in sync).

## Status (2026-10-25, session 2) — Gate 2 started; Gate 1 art/feel polish continues in parallel
User decision this session: start Gate 2 now and keep finishing Gate 1 alongside ("병행"). CLAUDE.md scope line and ARCHITECTURE v1.2 updated accordingly (pending changes a/b/c applied).
Day = walkable rooftop hub (Phaser `hub` scene) → iron door `E` → sortie panel (React) → night `lights_out` (3 floors + gumiho) → settlement → back to the hub. Bookkeeper appears after 1 solved contract; `E` → ledger panel. Autosave unchanged (save v1).

### This session
- Director motion (Gate 1 feedback "평시에 번쩍이며 너무 움직임, 공격·회피·발도 어색"): single idle frame + 1px head-only breathing; walk frames reuse the idle head (`stableHead`) so only limbs change; frames anchored on the body column (`bodyColumn`) instead of bbox centre (was up to 2.5px sideways jumps); attack = strike frame first then recovery (hit lands on press), attackShow 0.26 ≤ swingTime so held attack never pops to idle; 발도 = lunge first then hand-on-hilt; per-frame sword grip measured from the fists; sword rests at a fixed angle from facing (no longer tracks the mouse, no front/behind swapping at rest); swing direction alternates through the combo; 발도 lunge points the blade at the aim; dash trails the sword; post-hit i-frame blink dims to 45% at 12 Hz instead of vanishing at 20 Hz, and a counter's i-frames do not blink. Files: `src/data/sprites.data.ts`, `draw/director.ts`, `draw/directorFrames.ts` (`directorSprite`), `draw/pixelSprite.ts` (`anchorX`, `stackSprites`, head lift).
- Gate 2 hub: `src/systems/hub/` (walk, slide on walls/furniture, spot in reach, unlocks; 6 tests), `src/data/lobby.data.ts` (layout, `HUB_SPOTS`, `LOBBY_FEATURES`), `src/scenes/hub/HubScene.ts` + `HubView.ts` (shapes; director sprite reused), `src/app/features.ts` (`openFeature`/`closeFeature` push/pop `modal`), `src/ui/FeatureHost.tsx` + `ui/features/{sortie,ledger}/`. `OfficeApp.tsx` removed. New action `interact` = `E`. `HUB_LOOK` in `feel.data.ts`.

## Functional modules (where things live)
| Function | Code | Design doc |
|----------|------|------------|
| Input (single owner, context stack, mouse as `Mouse0/2`, `pause`=Esc) | `src/core/InputManager.ts`, `src/data/input.data.ts` | `docs/design/1-foundation/platform.md` |
| Save (schemaVersion 1, migrate, `.bad` backup, autosave on store change) | `src/core/SaveManager.ts`, `src/app/services.ts`, `src/store/gameStore.ts` | `1-foundation/save.md` |
| One floor (pure, fixed 1/60 tick, tile units) | `src/systems/rift/` — `mapgen`, `physics` (AABB, corner nudge, LOS, flow field), `player` (move/dash/swing/발도 tiers), `enemies`, `boss` (sweep band / pounce / summon `summonCount` / phase 2), `spawner` (swarm waves), `combat`, `step` (+ `giveUp`), `hooks` | `2-night/combat.md`, `enemies.md`, `contract.md` |
| One night (floors, cards, stats, settlement) | `src/systems/run/` | `2-night/run-result.md`, `3-growth/party.md` |
| Card effects (fixed hook points) | `src/registry/cardEffects.ts`, `src/data/cards.data.ts` | `3-growth/party.md` |
| Night screen flow (fixed step, hit-stop, cameras, aim, pause/cards/payphone/end modes) | `src/scenes/rift/RiftScene.ts`, `RiftHud.ts`, `src/scenes/shared/Overlay.ts` | `2-night/combat.md` |
| Day hub (walk, `E` spots, unlocks, panels) | `src/systems/hub/`, `src/data/lobby.data.ts`, `src/scenes/hub/`, `src/app/features.ts`, `src/ui/FeatureHost.tsx`, `src/ui/features/` | `4-day/hub.md` |
| Drawing (layers, y-sort, night lighting) | `src/scenes/rift/RiftView.ts`; per-thing files in `draw/` (`tiles`, `director`, `directorFrames`, `ghosts`, `props`, `telegraph`, `pixelSprite`, `art/ghostArt`, `art/propArt`) | `5-business/art.md` |
| Director sprite anims (frames "set:number", idle/walk/attack/draw/dash/hurt/ko, stable head, body anchor, per-frame hands) | `src/data/sprites.data.ts`, `draw/directorFrames.ts` | `5-business/director-sprite-spec.md` |
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
- Scope: Gate 2 (current) with Gate 1 art/feel polish in parallel (user, 2026-10-25). Gate 3+ is out of scope. Bash calls sometimes fail with an auto-mode classifier error; retry once, otherwise use Read/Edit and retry later.

## Verified (last)
- `npm run check`: tsc clean, 53 tests pass (47 old incl. balance + 6 hub).
- Playwright (scratchpad scripts, not committed), dev server: exact poses rendered with the scene paused (idle, walk, attack strike ×2 combo directions, recovery, 발도 lunge/sheathe, dash, left-facing, up-aim) — sword sits in the fist, body no longer shifts between poses. Hub: renders; E with nothing in reach does nothing; at the door E opens the sortie panel; Esc closes; WASD works right after closing (no click); E + Enter starts the night; a dead run returns to the hub; with a save of solved=1 the bookkeeper and prompt appear, ledger shows money/trauma/solved; clicking outside closes the panel and keys still work. No page errors.
- Not verified: real-time feel of the new animation at full frame rate in a real browser (headless runs slow); how it looks to the user.

## Known issues / unverified
- No long human playtest: parry window 0.22 s, speeds, run length are bot-tuned.
- Hub art is shapes (roof, hut, desk, 평상, AC, bookkeeper placeholder figure). Cat, Esc full menu, rent, contract board not built. Unlock rule is "solved contracts ≥ N" until a story system exists.
- Headless Chromium runs slow, so hub/night step caps (5 steps per frame) drop time there; normal browsers are unaffected.
- Ghost pixel density (art-lab sprites at 2x) differs from the director; subway ghost, boss, sword, stairs still shapes. Walls are not y-sorted with bodies.
- Black jacket can sink into the dark floor (needs a rim light).
- Keyboard + mouse only; synth SFX; dev-only `window.__rift` / `window.__hub` handles (stripped in production).

## Next steps
Gate 2 (main line):
1. Companion slot: `companions.data.ts` (2–3 companions, call skill + 3 cards each, `source` = companion), whiteboard spot in the hub → party panel (`ui/features/party/`), call skill on the free 4th combat button, companion cards in `cardPool`. Design: `docs/design/3-growth/party.md`, recruit rules `3-growth/recruit.md`.
2. Weapon B (talisman label gun) + its card deck; weapon choice in the sortie panel.
3. Traits/traumas persisting across runs + recovery (rest/굿) → save v2 (bump `SAVE_VERSION`, migration + test).
4. Cat (appraisal) once relics exist; Esc full menu in the hub.
Gate 1 polish (parallel):
5. User feedback on the new director motion; Gemini files when sent (subway ghost, cheonyeo, sword, a game screenshot) → `clean_sheet.py` (master palette, target height, in-game comparison image).
6. Boss frames, dalgyal, dokkaebibul, tiles, props; director rim light; Hangul pixel signs; real SFX + BGM slot. Add hub art (rooftop, bookkeeper, cat) to the Gemini spec.

## History (short)
Action prototype (auto-aim) lost to a stand-still bot → turn-based grid → user disliked it → Core Keeper–style real-time on a tile grid (old code: `d170e4b`, `0278d77`). Then: swarm fodder, keyboard-only play, smoother feel, one key per action, 발도 tiers (slash < counter = focus strike), quieter effects, design docs grouped into 5 folders, SaveManager, `draw/` split, art lab samples, Gemini pipeline, scale fix (24px tiles), pause menu, boss → gumiho, director attack/발도 poses, director motion cleanup (stable head, anchors, strike-first), Gate 2 start: walkable hub with React panels.
