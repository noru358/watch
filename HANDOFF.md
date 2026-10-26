# HANDOFF

Branch: `main`. The old `claude/admiring-keller-rdwk4w` and `claude/vigilant-turing-c8w4ga` branches are fully contained in main (checked with `merge-base --is-ancestor`); deleting them from the sandbox was refused (HTTP 403), so the user deletes them on GitHub. Never work on them; work on main.
Read order: `ARCHITECTURE.md` → this file → `docs/design/1-foundation/direction.md` (decided vs open) → `docs/design/roadmap.md` (per-gate plan, gaps). The human's map is `GUIDE.md` (Korean, keep in sync). What the code actually computes (formulas, where each number lives) is in `docs/rules/` — update it in the same commit as any rule change.

## Status (2026-10-26)
- **Gate 1** (night combat): feature-complete, waits on the user's playtest. Story contract 「불 꺼지는 동네」 = 4 sealed floors (alley → basement → arcade ☎ → rooftop) + gumiho.
- **Gate 2** (office & growth): 2-A day loop is mostly in — walkable office, day counter, weekly rent (450) with debt, contract board (story / generated general / bounty, bundling), Euljiro operations map (6 nodes, contamination rise + spread, fog), bookkeeper ledger with a morning report, save v2. Left in 2-A: dialogue box, title / new game, retuning the numbers after a week of play. 2-B (growth) waits on user decisions.
- Floors: room roles (start / exit = farthest walk with 2 guards / treasure heap / side rooms), **sealed stairs** until the floor's strong ghosts are down (fodder does not count), bounty **arena** last floor, per-floor **themes** (code-drawn colours).
- Art: the user does **not** draw pixels; they judge only. Procedure in `docs/design/5-business/art-pipeline.md`: frames come from one master (`assets/master/director-master.png`, palette `assets/palette/master.gpl`), PixelLab for animation (user trials the web app first), AI does mechanical pixel fixes by script. None of the new art tools exist yet.
- 2026-10-26 afternoon (docs only, no code change): rule ledger `docs/rules/` (office, floor, night, hub); design docs `2-night/objectives.md` (objective types reshaped for real time: rescue, chase, ward, escort; "return on objective done"; board shows one indicator set) and `3-growth/progression.md` (money sinks: director training, weapon, office facilities, supplies; trauma effects and recovery; reputation rank); references `mission-structures.md`, `progression-systems.md`, `indie-ui.md`. Screen mockups (12 artboards: board ×3, night HUD ×3, dialogue ×3, title ×3) on the Design canvas https://claude.ai/artifact/FVdNQucCLJbcmNqo3DKhzf — the user picks one per row.
- Flow: office hub (walk, `E`) → front door → contract board + map (A/D or click, Enter) → night on the chosen offer → settlement (bundle fees) → next morning (rent, contamination, new offers) → hub. Bookkeeper appears after 1 solved contract. Autosave.

## Functional modules (where things live)
| Function | Code | Design doc |
|----------|------|------------|
| Input (single owner, context stack, `Mouse0/2`, `pause`=Esc, `interact`=E) | `src/core/InputManager.ts`, `src/data/input.data.ts` | `1-foundation/platform.md` |
| Save (v2, v1 → v2 migration, `.bad` backup, autosave on store change) | `src/core/SaveManager.ts`, `src/app/services.ts`, `src/store/gameStore.ts` | `1-foundation/save.md` |
| One floor — layout (rooms, corridors, roles, walk distances) | `src/systems/rift/layout.ts` | `2-night/contract.md` |
| One floor — placement and play (fixed 1/60 tick, tile units, seal, arena) | `src/systems/rift/` — `mapgen`, `physics`, `player`, `enemies`, `boss`, `spawner`, `combat`, `step`, `hooks`; API `index.ts` | `2-night/combat.md`, `enemies.md` |
| One night (floor plans from the offer, cards, stats, settlement) | `src/systems/run/` (`RunSetup.floors/fee/offerId`) | `2-night/run-result.md`, `3-growth/party.md` |
| Office day loop (day, rent, debt, board generation, bundling, contamination, offer → floor plans) | `src/systems/office/`, `src/data/office.data.ts`, `nodes.data.ts`, `requests.data.ts`, `contracts.data.ts` (story) | `4-day/contracts-map-ops.md`, `4-day/economy.md` |
| Day panels | `src/ui/FeatureHost.tsx`, `src/ui/features/board/` (board + SVG map), `ledger/` (books + morning report), `panel.ts`, `lastRun.ts` | `4-day/hub.md` |
| Day hub (walk, `E` spots, unlocks) | `src/systems/hub/`, `src/data/lobby.data.ts`, `hubLook.data.ts`, `src/scenes/hub/`, `src/app/features.ts` | `4-day/hub.md` |
| Card effects (fixed hook points) | `src/registry/cardEffects.ts`, `src/data/cards.data.ts` | `3-growth/party.md` |
| Night screen flow (hit-stop, cameras, aim, pause/cards/payphone/end) | `src/scenes/rift/RiftScene.ts`, `RiftHud.ts` (seal count), `src/scenes/shared/Overlay.ts` | `2-night/combat.md` |
| Night drawing (layers, y-sort, lighting, themes) | `src/scenes/rift/RiftView.ts`; `draw/`: `director`, `sword`, `ghosts` + `art/ghostArt`, `props` (sealed stairs) + `art/propArt`, `tiles` (`FLOOR_THEMES`), `telegraph` | `5-business/art.md` |
| Shared sprite kit | `src/scenes/shared/draw/` — `pixelSprite`, `directorFrames`, `common` | `5-business/art.md` |
| Director sprite tables | `src/data/sprites.data.ts` | `5-business/director-sprite-spec.md` |
| Feel numbers, palette, floor themes | `src/data/feel.data.ts` | `2-night/combat.md`, `5-business/art.md` |
| Presentation listeners | `src/scenes/shared/vfx.ts`, `sfx.ts`, `src/data/sfx.data.ts` | — |
| Assets | `assets/source/` (raw, never delete), `assets/sprites/` (cleaned), `assets/master/`, `assets/palette/`; rules in `assets/README.md` | `5-business/art-pipeline.md` |
| Asset tools (outside the build) | `tools/spritekit/clean_sheet.py`, `face_edit.py`; `tools/artlab/` | `5-business/art-pipeline.md` |
| Tests | `tests/core`, `rift`, `mapgen`, `run`, `office`, `save`, `balance`, `hub` (+ `bots.ts`, `helpers.ts` incl. `storySetup`) | — |
| Dev handles (dev builds only) | `window.__rift`, `window.__hub`, `window.__store` | — |

## Decisions to respect
- Art: chunky Soul Knight–style pixels, 2-head chibi; director Gemini sheet v1 is the style master; right-facing frames only, left mirrored; blade and smear rotate to the aim; only upward attacks use the back view. Judge art in the game screen. The user does not draw: never hand them an editing task; give them a comparison image to judge.
- Damage order: any normal hit < plain 발도 < counter = focus strike (tested). 발도 outcome is judged on the press; damage after the 0.12 s stance. Attacks show the strike pose first (no wind-up frame).
- Hub is the office interior. The front door opens the contract board (not the bookkeeper, who only appears after 1 solve).
- A day's board is fixed by `seedBase` + day (`morningSeed`); a reload replays it. Generated offers keep the risk they were posted with; the story offer shows the node's current contamination.
- Boss/story: visual appeal first, not tied to real places/industries. Personal reference photos and third-party screenshots are not committed.
- Open, not decided (do not build as if decided): the big story and ending, the first companion (gumiho undecided; tutorial-like first sortie considered), recruiting by episodes vs chance, human exorcist companions, squad operation weight (design in `contracts-map-ops.md` §3, waits for a companion), keeping per-run cards, night length target, the cat's role, rental market, weapon B.
- Scope: Gate 2 + the art/sound track. Gate 3+ out of scope.
- Shell: do not `pkill -f` a pattern matching your own command; kill a dev server by port (`kill $(lsof -ti :5199)`). Vitest hides `console.log` of passing tests: write to a file to inspect bot runs. Headless Chromium is at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` in the cloud sandbox.

## Verified (2026-10-26)
- `npm run check`: tsc clean, 75 tests pass. Balance (story contract, 8 seeds): naive 0/8, skilled 8/8, skilled clear 137–237 s.
- Playwright smoke: board opens from the door, A/D changes selection, Enter starts a night on the chosen offer (HUD "계단 봉인 · 강적 n", alley theme); after 6 simulated nights the board shows day 7, bounties on contaminated nodes; the ledger shows rent paid and the morning report. No page errors (one 404 = missing favicon).
- The `layout.ts` split (2026-10-26 cleanup) kept the RNG call order: same seeds, same maps (tests unchanged and passing).
- Not verified: human play of sealed floors / arena / themes; economy pacing; the map at phone width.

## Known issues
- Story offers show the node's current contamination as risk, but story floors are fixed in `contracts.data.ts`, so that number is cosmetic (see `docs/rules/office.md`).
- Money has no sink besides rent (~400–500 per night vs rent 450 per week, estimate): see `progression.md`.
- No human playtest: parry window, stance, speeds, run length and all office numbers are bot-tuned or guessed.
- No volume / mute setting. No title / new game. No dialogue box (unlocks use "solved ≥ N").
- Trauma is a number with no effect. Squad operations not built.
- Hub art is shapes; subway ghost, sword, stairs are shapes; gumiho one static frame; combo reuses v3 frames; walls not y-sorted with bodies; black jacket can sink into dark floors; floor themes are colour swaps only.
- Hero outline has purple fringe (`#22011e`, `#40043a`) from magenta keying.

## Next steps (reasons in `docs/design/roadmap.md`)
0. User picks mockups (board / HUD / dialogue / title). Then build in this order: `FloorPlan.objective` with 섬멸 moved into it (no behaviour change) → "return on objective done" → 수색·구조 objective + generated offers with objective kinds → board indicator rework (difficulty computed from the real floor plan, so story offers stop showing a cosmetic risk) → chosen HUD / dialogue box / title (with volume). Plan: `docs/design/2-night/objectives.md`.
1. User: play a few nights and a week of days → retune `office.data.ts`, combat feel, and decide the night length target.
2. Money sinks (`docs/design/3-growth/progression.md`): save v3 → director training (needs a new input to `computeExorcistStats` = architecture change; replace the unused `level`) → trauma effects + sofa rest → facilities → reputation rank.
3. Art tools (user judges, AI builds): master palette enforcement in `clean_sheet.py`, size/thickness/off-palette check, in-game comparison image, master part split; then the walk-cycle trial (PixelLab result from the user vs AI part script).
4. Floor generation: hand-made room templates per theme, monster-house room — only if the human run length says more content is needed.
5. 2-B after user decisions (recruit method, first companion, first sortie, story): party slot + call skill + companion cards → squad operations (scout / seal) → trauma effects and recovery.

## History (short)
Action prototype (auto-aim) lost to a stand-still bot → turn-based grid → user disliked it → Core Keeper–style real-time on a tile grid (old code: `d170e4b`, `0278d77`). 2026-10-25: swarm fodder, 발도 tiers, design docs in 5 groups, save, art lab, Gemini pipeline, 24px tiles, gumiho boss, director poses, walkable office hub, feel pass, module cleanup. 2026-10-26: design review (`direction.md`, `story.md`); art pipeline and dispatch-game research; Gate 2-A day loop + board + map + save v2; floor roles, seal, arena, themes; hero master + palette; user does not draw → art roles; cleanup (`rift/layout.ts` split, doc consolidation, main as the only working branch). Afternoon: rule ledger, objective and progression designs, reference research, 12 screen mockups (docs only).
