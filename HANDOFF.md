# HANDOFF

Branch: `main` only. The old `claude/admiring-keller-rdwk4w` and `claude/vigilant-turing-c8w4ga` branches are fully contained in main; the sandbox could not delete them (HTTP 403), so the user deletes them on GitHub. Never work on them.

Read order: `ARCHITECTURE.md` → this file → `docs/design/1-foundation/direction.md` (decided vs open) → `docs/design/roadmap.md` (order of work). The human's map is `GUIDE.md` (Korean, keep in sync).

Docs have three homes, one fact in one place: `docs/design/` (what and why, 5 groups, map in `docs/design/README.md`), `docs/rules/` (what the code actually computes: formulas and where each number lives — update it in the same commit as any rule change; design docs link to it instead of repeating numbers), `docs/reference/` (other games, index in its README).

## Status (2026-10-26 night)
- **Gate 1** (night combat): feature-complete, waits on the user's playtest. Story contract 「불 꺼지는 동네」 = 4 floors (alley → basement → arcade ☎ → rooftop) + gumiho.
- **Gate 2** (office & growth): day loop in (walkable office, day counter, weekly rent with debt, contract board with story / generated / bounty offers and bundling, Euljiro map with contamination and fog, ledger with morning report). **Tonight (user: "ㅇㅇ 구현해봐"):** floor objective frame (`clear` / `rescue`) with 섬멸 moved into it, 수색·구조, return on objective done (goal floor), new outcome `failed`; board A with four indicators (goal, difficulty from the real floor plan, length, fee); night HUD final; dialogue box (story scenes) + bookkeeper chatter bubbles; title (merged A+B) with continue / new game (overwrite confirm) / volume; pause menu has a sound card; save v3 (`seen`). Not built: money sinks and trauma (`docs/design/3-growth/progression.md`), remaining objectives (chase, ward, escort). Companions wait on user decisions.
- **Screens:** built as picked on the canvas (https://claude.ai/artifact/FVdNQucCLJbcmNqo3DKhzf). The title went ahead as the merged candidate; the user may still ask to change it.
- **Art:** paused at the current level (user). The user does not draw pixels, only judges. Procedure `docs/design/5-business/art-pipeline.md`, prompts `art-prompts.md`. Open: the protagonist spec (mid-length layered hair, gender undecided) does not match the in-game sprite (long hair, reads female) — user decides which to follow. Dialogue portraits: director uses the master @8x; bookkeeper and Wolha are silhouettes.

## Functional modules (where things live)
| Function | Code | Design doc |
|----------|------|------------|
| Input (single owner, context stack, `Mouse0/2`, `pause`=Esc, `interact`=E) | `src/core/InputManager.ts`, `src/data/input.data.ts` | `1-foundation/platform.md` |
| Save (v3 with `seen`, migrations 1→2→3, `.bad` backup, autosave on store change; `startedWithSave` for the title) | `src/core/SaveManager.ts`, `src/app/services.ts`, `src/store/gameStore.ts` (`newGame`, `markSeen`) | `1-foundation/save.md` |
| Phases (`title` boot → `day` ↔ `night`) | `src/core/phase.ts`, `src/main.ts` | ARCHITECTURE Rule 4 |
| Settings (volume, own localStorage key, separate from the save) | `src/app/settings.ts`, `src/data/settings.data.ts`; `sfx.ts` multiplies by it | `1-foundation/ui.md` |
| One floor — layout (rooms, corridors, roles, walk distances) | `src/systems/rift/layout.ts` | `2-night/contract.md` |
| One floor — placement and play (fixed 1/60 tick, tile units, arena) | `src/systems/rift/` — `mapgen`, `physics`, `player`, `enemies`, `boss`, `spawner`, `combat`, `step`, `hooks`; API `index.ts` |
| Floor objectives (`clear`, `rescue`: setup / update / ready / complete at stairs; survivor follows via flow field) | `src/systems/rift/objectives/`, `src/data/objectives.data.ts` | `2-night/objectives.md`, rules `floor.md` | `2-night/combat.md`, `enemies.md`, `objectives.md` |
| One night (floor plans from the offer, cards, stats, settlement, `goalReached` / `finishAtGoal`, outcome `failed`) | `src/systems/run/` (`RunSetup.floors/fee/offerId`) | `2-night/run-result.md`, `3-growth/party.md` |
| Office day loop (day, rent, debt, board generation, bundling, contamination, offer → floor plans, `offerGoal`, `offerDifficulty`) | `src/systems/office/`, `src/data/office.data.ts`, `nodes.data.ts`, `requests.data.ts`, `contracts.data.ts` (story) | `4-day/contracts-map-ops.md`, `4-day/economy.md` |
| Day panels | `src/ui/FeatureHost.tsx`, `src/ui/features/board/` (`BoardPanel`, `OpsMap`, `OfferSheet`, `look.ts`), `ledger/` (books + morning report), `panel.ts`, `lastRun.ts` | `1-foundation/ui.md`, `4-day/hub.md` |
| Day hub (walk, `E` spots, unlocks, chatter bubble) | `src/systems/hub/`, `src/data/lobby.data.ts`, `hubLook.data.ts`, `src/scenes/hub/`, `src/app/features.ts` | `4-day/hub.md` |
| Story scenes (which plays next, dialogue box, `modal` context) | `src/systems/story/`, `src/data/story.data.ts`, `src/app/dialogue.ts`, `src/ui/DialogueBox.tsx` | `1-foundation/ui.md`, rules `hub.md` |
| Title | `src/scenes/title/TitleScene.ts`, `src/data/titleLook.data.ts` | `1-foundation/ui.md` |
| Card effects (fixed hook points) | `src/registry/cardEffects.ts`, `src/data/cards.data.ts` | `3-growth/party.md` |
| Night screen flow (hit-stop, cameras, aim, pause (4 cards incl. sound)/cards/payphone/goal prompt/end) | `src/scenes/rift/RiftScene.ts`, `RiftHud.ts`, `src/scenes/shared/Overlay.ts` | `2-night/combat.md`, `1-foundation/ui.md` |
| Night drawing (layers, y-sort, lighting, themes) | `src/scenes/rift/RiftView.ts`; `draw/`: `director`, `sword`, `ghosts` + `art/ghostArt`, `props` + `art/propArt`, `tiles` (`FLOOR_THEMES`), `telegraph` | `5-business/art.md` |
| Shared sprite kit, director sprite tables | `src/scenes/shared/draw/` (`pixelSprite`, `directorFrames`, `common`), `src/data/sprites.data.ts` | `5-business/art.md` |
| Feel numbers, palette, floor themes | `src/data/feel.data.ts` | `2-night/combat.md`, `5-business/art.md` |
| Presentation listeners | `src/scenes/shared/vfx.ts`, `sfx.ts`, `src/data/sfx.data.ts` | — |
| Assets and asset tools | `assets/` (rules in `assets/README.md`), `tools/spritekit/`, `tools/artlab/` | `5-business/art-pipeline.md`, `art-prompts.md` |
| Tests | `tests/core`, `rift`, `mapgen`, `run`, `office`, `save`, `balance`, `hub`, `objectives`, `story` (+ `bots.ts`, `helpers.ts` incl. `storySetup`) | — |
| Dev handles (dev builds only) | `window.__rift`, `window.__hub`, `window.__store` | — |

## Decisions to respect
- Art: chunky Soul Knight–style pixels, 2-head chibi; Gemini sheet v1 is the style master; frames are edited from one master; right-facing only, left mirrored; blade and smear rotate to the aim; only upward attacks use the back view. Judge art in the game screen. The user does not draw: never hand them an editing task; give them a comparison image.
- Damage order: any normal hit < plain 발도 < counter = focus strike (tested). 발도 outcome is judged on the press; damage after the stance. Attacks show the strike pose first.
- Hub is the office interior. The front door opens the contract board; the bookkeeper appears after 1 solve.
- A day's board is fixed by `seedBase` + day (`morningSeed`); a reload replays it.
- Objective types are reshaped for real time by changing floor structure, not by tuning numbers (user). Rescue as built: survivor follows on contact (no E grab / drop), dash allowed, the return prompt appears at the goal floor's stairs. The board shows no "contamination"/"risk" words: map colour for districts, four indicators per offer (objective, difficulty computed from the real floor plan, length, fee).
- Boss/story: visual appeal first, not tied to real places/industries. Personal reference photos and third-party screenshots are not committed.
- Open, not decided (do not build as if decided): protagonist look, big story and ending, first companion, recruiting method, human exorcist companions, squad-operation weight, keeping per-run cards, night length target, the cat's role, rental market, weapon B.
- Scope: Gate 2 + the art/sound track (art paused by the user). Gate 3+ out of scope.
- Shell: do not `pkill -f` a pattern matching your own command; kill a dev server by port (`kill $(lsof -ti :5199)`). Vitest hides `console.log` of passing tests: write to a file to inspect bot runs. Headless Chromium is at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` in the cloud sandbox.

## Verified (2026-10-26 night)
- `npm run check`: tsc clean, 91 tests pass (objectives 8, story 4, office goal / difficulty / v2→v3 migration added).
- Playwright smoke (headless, dev server): title renders (2 rows without a save, 3 with; continue shows day · money), volume A/D changes, new-game confirm overlay, new game → intro dialogue; board A with the rescue offer sheet; night HUD (goal panel, floor counter, slots); rescue floor (cry arrow, fear gauge, found banner, following); goal prompt; pause 4 cards; bookkeeper scene and chatter bubble. No page errors.
- Not verified: human play of rescue (fear speed, survivor hp, how often it fails), sealed floors, arena; economy pacing; the board at phone width.

## Known issues
- Headless Chromium runs the game slow, so screenshot scripts must wait longer than game-time numbers suggest (chatter first bubble took ~9 s real time).
- Money has no sink besides rent (~400–500 per night vs 450 per week, estimate).
- No human playtest: parry window, stance, speeds, run length, rescue numbers and all office numbers are bot-tuned or guessed.
- Trauma is a number with no effect (now also +1 on a failed objective). Squad operations not built.
- Bookkeeper / Wolha portraits are silhouettes; the chatter bubble has no tail. Unlocks still use "solved ≥ N".
- Hub art is shapes; subway ghost, sword, stairs, survivor are shapes; gumiho one static frame; walls not y-sorted with bodies; black jacket can sink into dark floors; floor themes are colour swaps only. Hero outline has purple fringe (`#22011e`, `#40043a`) from magenta keying.

## Next steps (order and reasons in `docs/design/roadmap.md`)
1. User looks at the new screens and plays a rescue offer; adjust `objectives.data.ts` / layout from feedback.
2. Money sinks per `docs/design/3-growth/progression.md`: save v4 → director training (new input to `computeExorcistStats` = architecture change; replace the unused `level`) → trauma effects + sofa rest → facilities → reputation rank.
3. After a week of user play: retune `office.data.ts` and growth numbers.
4. Remaining objectives: chase → ward → escort (`docs/design/2-night/objectives.md`); each one = one file in `rift/objectives/` + a request frame.
5. Companions (2-B) after the user's decisions.

## History (short)
Action prototype (auto-aim) lost to a stand-still bot → turn-based grid → user disliked it → Core Keeper–style real-time on a tile grid (old code: `d170e4b`, `0278d77`). 2026-10-25: swarm fodder, 발도 tiers, design docs in 5 groups, save, art lab, Gemini pipeline, 24px tiles, gumiho boss, director poses, walkable office hub, feel pass. 2026-10-26: design review; Gate 2-A day loop + board + map + save v2; floor roles, seal, arena, themes; hero master + palette; art roles. Afternoon: rule ledger, objective and progression designs, reference research, 12 screen mockups. Evening: mockups picked, docs cleanup. Night: objectives + rescue, board A, HUD, dialogue, title, save v3.
