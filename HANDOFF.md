# HANDOFF

Branch: `main` only. The old `claude/admiring-keller-rdwk4w` and `claude/vigilant-turing-c8w4ga` branches are fully contained in main; the sandbox could not delete them (HTTP 403), so the user deletes them on GitHub. Never work on them.

Read order: `ARCHITECTURE.md` → this file → `docs/design/1-foundation/direction.md` (decided vs open) → `docs/design/roadmap.md` (order of work). The human's map is `GUIDE.md` (Korean, keep in sync).

Docs have three homes, one fact in one place: `docs/design/` (what and why, 5 groups, map in `docs/design/README.md`), `docs/rules/` (what the code actually computes: formulas and where each number lives — update it in the same commit as any rule change; design docs link to it instead of repeating numbers), `docs/reference/` (other games, index in its README).

## Status (2026-10-26 evening)
- **Gate 1** (night combat): feature-complete, waits on the user's playtest. Story contract 「불 꺼지는 동네」 = 4 sealed floors (alley → basement → arcade ☎ → rooftop) + gumiho.
- **Gate 2** (office & growth): day loop in (walkable office, day counter, weekly rent with debt, contract board with story / generated / bounty offers and bundling, Euljiro map with contamination and fog, ledger with morning report, save v2). Planned and decided, not built: objective types (`docs/design/2-night/objectives.md`), screen rework (`docs/design/1-foundation/ui.md`), money sinks and trauma (`docs/design/3-growth/progression.md`). Companions wait on user decisions.
- **Screens (user picked 2026-10-26):** board A (map + clipboard offer sheet; fixed button sizes), night HUD = C + A's HP/focus panel + floor counter (canvas artboard "밤 HUD 최종"), dialogue = story A + hub chatter B (C radio parked), title = merged A+B candidate (canvas "타이틀 최종 후보"), user confirmation pending. Canvas: https://claude.ai/artifact/FVdNQucCLJbcmNqo3DKhzf
- **Art:** paused at the current level (user). The user does not draw pixels, only judges. Procedure `docs/design/5-business/art-pipeline.md`, prompts `art-prompts.md`. Open: the protagonist spec (mid-length layered hair, gender undecided) does not match the in-game sprite (long hair, reads female) — user decides which to follow.
- **Docs cleanup (2026-10-26 evening):** merged `gemini-asset-specs.md` + `director-sprite-spec.md` → `5-business/art-prompts.md` (history condensed into `art.md`); removed `1-foundation/playflow.md` (stale controls and day flow; its reference-game list moved to `docs/reference/README.md`); new `1-foundation/ui.md`; numbers removed from design docs in favour of `docs/rules/` (the old per-floor table in `enemies.md` was already wrong); PMD job types moved into `reference/pokemon-mystery-dungeon.md`; `direction.md` and `roadmap.md` rewritten so decisions live in direction and order lives in the roadmap; GUIDE trimmed (combat numbers and duplicated "about the game" removed). Two unreferenced images deleted.

## Functional modules (where things live)
| Function | Code | Design doc |
|----------|------|------------|
| Input (single owner, context stack, `Mouse0/2`, `pause`=Esc, `interact`=E) | `src/core/InputManager.ts`, `src/data/input.data.ts` | `1-foundation/platform.md` |
| Save (v2, v1 → v2 migration, `.bad` backup, autosave on store change) | `src/core/SaveManager.ts`, `src/app/services.ts`, `src/store/gameStore.ts` | `1-foundation/save.md` |
| One floor — layout (rooms, corridors, roles, walk distances) | `src/systems/rift/layout.ts` | `2-night/contract.md` |
| One floor — placement and play (fixed 1/60 tick, tile units, seal, arena) | `src/systems/rift/` — `mapgen`, `physics`, `player`, `enemies`, `boss`, `spawner`, `combat`, `step`, `hooks`; API `index.ts` | `2-night/combat.md`, `enemies.md`, `objectives.md` |
| One night (floor plans from the offer, cards, stats, settlement) | `src/systems/run/` (`RunSetup.floors/fee/offerId`) | `2-night/run-result.md`, `3-growth/party.md` |
| Office day loop (day, rent, debt, board generation, bundling, contamination, offer → floor plans) | `src/systems/office/`, `src/data/office.data.ts`, `nodes.data.ts`, `requests.data.ts`, `contracts.data.ts` (story) | `4-day/contracts-map-ops.md`, `4-day/economy.md` |
| Day panels | `src/ui/FeatureHost.tsx`, `src/ui/features/board/` (board + SVG map), `ledger/` (books + morning report), `panel.ts`, `lastRun.ts` | `1-foundation/ui.md`, `4-day/hub.md` |
| Day hub (walk, `E` spots, unlocks) | `src/systems/hub/`, `src/data/lobby.data.ts`, `hubLook.data.ts`, `src/scenes/hub/`, `src/app/features.ts` | `4-day/hub.md` |
| Card effects (fixed hook points) | `src/registry/cardEffects.ts`, `src/data/cards.data.ts` | `3-growth/party.md` |
| Night screen flow (hit-stop, cameras, aim, pause/cards/payphone/end) | `src/scenes/rift/RiftScene.ts`, `RiftHud.ts`, `src/scenes/shared/Overlay.ts` | `2-night/combat.md`, `1-foundation/ui.md` |
| Night drawing (layers, y-sort, lighting, themes) | `src/scenes/rift/RiftView.ts`; `draw/`: `director`, `sword`, `ghosts` + `art/ghostArt`, `props` + `art/propArt`, `tiles` (`FLOOR_THEMES`), `telegraph` | `5-business/art.md` |
| Shared sprite kit, director sprite tables | `src/scenes/shared/draw/` (`pixelSprite`, `directorFrames`, `common`), `src/data/sprites.data.ts` | `5-business/art.md` |
| Feel numbers, palette, floor themes | `src/data/feel.data.ts` | `2-night/combat.md`, `5-business/art.md` |
| Presentation listeners | `src/scenes/shared/vfx.ts`, `sfx.ts`, `src/data/sfx.data.ts` | — |
| Assets and asset tools | `assets/` (rules in `assets/README.md`), `tools/spritekit/`, `tools/artlab/` | `5-business/art-pipeline.md`, `art-prompts.md` |
| Tests | `tests/core`, `rift`, `mapgen`, `run`, `office`, `save`, `balance`, `hub` (+ `bots.ts`, `helpers.ts` incl. `storySetup`) | — |
| Dev handles (dev builds only) | `window.__rift`, `window.__hub`, `window.__store` | — |

## Decisions to respect
- Art: chunky Soul Knight–style pixels, 2-head chibi; Gemini sheet v1 is the style master; frames are edited from one master; right-facing only, left mirrored; blade and smear rotate to the aim; only upward attacks use the back view. Judge art in the game screen. The user does not draw: never hand them an editing task; give them a comparison image.
- Damage order: any normal hit < plain 발도 < counter = focus strike (tested). 발도 outcome is judged on the press; damage after the stance. Attacks show the strike pose first.
- Hub is the office interior. The front door opens the contract board; the bookkeeper appears after 1 solve.
- A day's board is fixed by `seedBase` + day (`morningSeed`); a reload replays it.
- Objective types are reshaped for real time by changing floor structure, not by tuning numbers (user). The board shows no "contamination"/"risk" words: map colour for districts, four indicators per offer (objective, difficulty computed from the real floor plan, length, fee).
- Boss/story: visual appeal first, not tied to real places/industries. Personal reference photos and third-party screenshots are not committed.
- Open, not decided (do not build as if decided): title (merged candidate pending), protagonist look, big story and ending, first companion, recruiting method, human exorcist companions, squad-operation weight, keeping per-run cards, night length target, the cat's role, rental market, weapon B.
- Scope: Gate 2 + the art/sound track (art paused by the user). Gate 3+ out of scope.
- Shell: do not `pkill -f` a pattern matching your own command; kill a dev server by port (`kill $(lsof -ti :5199)`). Vitest hides `console.log` of passing tests: write to a file to inspect bot runs. Headless Chromium is at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` in the cloud sandbox.

## Verified (2026-10-26)
- `npm run check`: tsc clean, 75 tests pass (no code changed this evening; docs only). Balance (story contract, 8 seeds): naive 0/8, skilled 8/8, skilled clear 137–237 s.
- Every relative markdown link in the repo resolves (script check after the cleanup).
- Playwright smoke (earlier today): board opens from the door, A/D changes selection, Enter starts a night; after 6 simulated nights the board shows day 7 with bounties; the ledger shows rent and the morning report. No page errors.
- Not verified: human play of sealed floors / arena / themes; economy pacing; the map at phone width.

## Known issues
- Story offers show the node's current contamination as risk, but story floors are fixed, so that number is cosmetic (fixed by the board indicator rework).
- Money has no sink besides rent (~400–500 per night vs 450 per week, estimate).
- No human playtest: parry window, stance, speeds, run length and all office numbers are bot-tuned or guessed.
- No volume / mute, title / new game, or dialogue box yet (unlocks use "solved ≥ N").
- Trauma is a number with no effect. Squad operations not built.
- Hub art is shapes; subway ghost, sword, stairs are shapes; gumiho one static frame; walls not y-sorted with bodies; black jacket can sink into dark floors; floor themes are colour swaps only. Hero outline has purple fringe (`#22011e`, `#40043a`) from magenta keying.

## Next steps (order and reasons in `docs/design/roadmap.md`)
1. Objectives: `FloorPlan.objective` with 섬멸 moved into it (no behaviour change, tests stay green) → "return on objective done" (payphone rings in that room) → 수색·구조 + generated offers with objective kinds. Plan: `docs/design/2-night/objectives.md`.
2. Screens per `docs/design/1-foundation/ui.md`: board A with the four indicators (write the difficulty formula into `docs/rules/office.md`), night HUD final, dialogue box (story A, chatter B), title + new game + settings with volume (after the user confirms the merged title).
3. Money sinks per `docs/design/3-growth/progression.md`: save v3 → director training (new input to `computeExorcistStats` = architecture change; replace the unused `level`) → trauma effects + sofa rest → facilities → reputation rank.
4. After a week of user play: retune `office.data.ts` and growth numbers.
5. Companions (2-B) after the user's decisions.

## History (short)
Action prototype (auto-aim) lost to a stand-still bot → turn-based grid → user disliked it → Core Keeper–style real-time on a tile grid (old code: `d170e4b`, `0278d77`). 2026-10-25: swarm fodder, 발도 tiers, design docs in 5 groups, save, art lab, Gemini pipeline, 24px tiles, gumiho boss, director poses, walkable office hub, feel pass. 2026-10-26: design review; Gate 2-A day loop + board + map + save v2; floor roles, seal, arena, themes; hero master + palette; art roles. Afternoon: rule ledger, objective and progression designs, reference research, 12 screen mockups. Evening: mockups picked, docs cleanup.
