# HANDOFF

The one file a new session (Claude, Codex or anyone) reads after `AGENTS.md` / `CLAUDE.md` and `ARCHITECTURE.md`. Keep it short: what is true now and what to do next. Finished work goes to `docs/history.md`, not here.

Branch: `main` only. Docs: `docs/design/` (what and why, map in its README), `docs/rules/` (what the code computes, updated with every rule change), `docs/reference/` (other games). The owner's Korean map is `GUIDE.md`. Every number and text in the game, as one generated file: `docs/catalog.md` (`npm run catalog`) — read it instead of opening the data files one by one.

## Now (2026-11-11)
- The owner has played Gate 1 + Gate 2. Verdict: night combat is fun and "one more run" holds, but the content ends after one round of sorties.
- Direction (owner, 2026-11-10; `docs/design/1-foundation/direction.md` "2026-11-10 방향"): a real management game. Roster of exorcists, more jobs a night than the office can cover, the director plays one and assigns staff to the rest, payroll, staff trauma, hiring, lending. Companion = staff = story character = lendable unit. Older repo decisions are considerations, not absolutes.
- Working mode: recommend a default, the owner confirms or vetoes; never park work on an open decision. Menu-side additions (skills, training lines, modifiers) are frozen.
- Built 2026-11-11: ghost traits (`src/systems/rift/traits/`, one part per file, hooks tick / chase / hit / died, rows in `GhostData.traits`, copied to `Enemy.traits`) and the first new ghost 도깨비 (front guard; placeholder shape; in the 폐모텔 and 옥탑 달동네 pools). `npm run check` green (217 tests). Not looked at in a browser yet.
- Designed, not built (specs are written to be implemented as they stand): seven more ghosts and named-target affixes (`2-night/enemies.md`), text room templates and three sortie lengths (`2-night/objectives.md`), management core (`4-day/economy.md` "경영 뼈대 설계"), contamination removal plan (`4-day/contracts-map-ops.md`), six person + enemy story cards (`1-foundation/bible.md` "작업 중").
- Awaiting the owner (defaults in `direction.md`; build on the default unless vetoed, except contamination): delete contamination; ghost rule (folklore as is, the future only in the city and people); thief steals the active skill; length numbers; which four of the six story cards.
- Save is still v7. Canvas of screen drafts: https://claude.ai/artifact/SZksbAdYMtCzoup7wyBzEE. 총괄 장부: https://claude.ai/artifact/YFeE4XiaLTBUWSPg1Hrm8X (republish after `npm run catalog`; its 괴이 "특징" column in `tools/catalog/template.html` does not show traits yet).

## Next tasks (in order)
The owner runs cheaper models on work that only needs a spec followed. `[Opus]` = implement the written spec; ask only if the spec contradicts the code. `[Fable]` = needs design judgment; leave it unless you are that model or the owner says otherwise.
1. `[Opus]` Seven ghosts from `2-night/enemies.md` "역할 8종", in the order given there (grab → leap → burst → shoot → rally → swell → thief). One commit each: data row, part file, tests in `tests/traits.test.ts`, placeholder shape, names, catalog. Fix `tests/bots.ts` before putting a ghost the bot cannot handle into a district pool. Then assign pools once for all (3–4 kinds a district, never themed to the place).
2. `[Opus]` Text room templates and the preview page (`2-night/objectives.md` "글자 틀 방"): format, generator hook, tests, `npm run rooms`, the first 16 rooms. Publish the preview as an artifact for the owner's pass/fail.
3. `[Opus]` Sortie lengths (`2-night/objectives.md` "길이 세 단계"): `lengths` table, board mix, depth scaling, return points as save points, mid-boss floors. Needs task 1's affixes for the mid-boss; build affixes (`enemies.md` "수식어에 효과 붙이기") first.
4. `[Opus]` Management core steps 1–3 (`4-day/economy.md` "경영 뼈대 설계"): `src/systems/staff/` pure functions and tests, save v8, one hired freelancer, assignment strip, roster page, morning report lines. Delete contamination in the same save bump only if the owner has confirmed it.
5. `[Fable]` After the owner picks four story cards: order them into four acts, find what the four enemies share (the through-line), write each chapter's five scenes, and turn each person into a staff row + call skill and each enemy into a boss spec.
6. `[Fable]` Lending and rival offices (economy.md step 4): the spec is a sketch; it needs a pass on why borrowing and lending are interesting choices before building.
7. `[Opus]` Feedback coverage table generated from `src/types/events.ts` × `src/scenes/shared/vfx.ts` / `sfx.ts` listeners × channels (hit-stop, shake, flash, particles, sound, HUD), as a page like the catalog. Check against "The Art of Screenshake" (Nijman), "Juice it or lose it" (Jonasson & Purho) and Swink's Game Feel; mark gaps and excess (anything that hides a telegraph). Same for day panels: screen × state (empty, full, cannot afford, first visit). Report findings before changing feel.
8. `[Opus]` Small fixes: black jacket sinking into dark floors, morning report lost on reload, the disabled sedative row, traits in the catalog page's 특징 column. First-night guidance needs a short proposal first.
9. Art (later, one pass): fix a per-entity spec (canvas size, anchor, frame names and counts) before content depends on it; placeholders until then.

## Open decisions (do not build as if decided)
Companion call key, protagonist look, big story and ending, first companion and recruiting, squad-operation weight, keeping per-run cards, night length target, the cat's role, rental market, weapon B, final map style.

## Decisions to respect
Read these through the 2026-11-10 direction above: where they disagree (light management, day income capped under night income, paper UI as fixed, Gate 2 scope), the new direction wins.
- Art: chunky Soul Knight–style pixels, 2-head chibi; Gemini sheet v1 is the style master; frames are edited from one master; right-facing only, left mirrored; blade and smear rotate to the aim; only upward attacks use the back view. Judge art in the game screen. The user does not draw: never hand them an editing task; give them a comparison image.
- Damage order: any normal hit < plain 발도 < counter = focus strike (tested). 발도 outcome is judged on the press; damage after the stance. Attacks show the strike pose first.
- Hub is the office interior. Spots: front door (board), director's desk (training + skills), sofa (rest), bookkeeper after 1 solve (ledger + facilities), talisman bench once built (supplies).
- Growth pace (user): slower than typical growth RPGs; stats split per number; one line = one data row. Currencies: money, 심연 파편 (skills, gear rerolls). Trauma recovery names: 휴식하기 / 진정제 사용 / 자본 치료. Active skill on L.
- Contracts (user): 메인 스토리 separate; every 일반 의뢰 gets exactly one random objective. 현상수배 = a recoloured, stronger named ghost on a random floor, return/continue after it. No arena objective (lair modifier instead). No hard-coding: objectives, modifiers, frames are data rows.
- A day's board is fixed by `seedBase` + day (`morningSeed`); a reload replays it.
- Joint sortie, not bundling (user 2026-10-27): nothing is paid for an objective that was not played. Reputation is XP (never spent), gates content; story pacing and the bookkeeper unlock are not tied to it yet (user).
- Objective types are reshaped for real time by changing floor structure, not by tuning numbers (user). Rescue as built: survivor follows on contact (no E grab / drop), dash allowed, the return prompt appears at the goal floor's stairs. The board shows no "contamination"/"risk" words: map colour for districts, four indicators per offer (objective, difficulty computed from the real floor plan, length, fee).
- Boss/story: visual appeal first, not tied to real places/industries. Personal reference photos and third-party screenshots are not committed.
- Open, not decided (do not build as if decided): where the companion call goes now that L is the active skill, protagonist look, big story and ending, first companion, recruiting method, human exorcist companions, squad-operation weight, keeping per-run cards, night length target, the cat's role, rental market, weapon B.
- Scope: Gate 2 + the art/sound track (art paused by the user). Gate 3+ out of scope.
- Shell: do not `pkill -f` a pattern matching your own command; kill a dev server by port (`kill $(lsof -ti :5199)`). Vitest hides `console.log` of passing tests: write to a file to inspect bot runs. Headless Chromium is at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` in the cloud sandbox.

## Functional modules (where things live)
| Function | Code | Design doc |
|----------|------|------------|
| Input (single owner, context stack, `Mouse0/2`, `pause`=Esc, `interact`=E) | `src/core/InputManager.ts`, `src/data/input.data.ts` | `1-foundation/platform.md` |
| Save (v7: skills v2 sides as numbers, training v2, + `upgrades`, `gear`, `equipped`, `nextGearId`; v6: + `reputation`, `rankReached`; v5: + `chapters`; v4: growth fields + `wanted`; migrations 1→…→7, v3 board cleared; `.bad` backup, autosave on store change; `startedWithSave` for the title) | `src/core/SaveManager.ts`, `src/app/services.ts`, `src/store/gameStore.ts` (`newGame`, `markSeen`, growth actions, `restToday`, `startNight`) | `1-foundation/save.md` |
| Phases (`title` boot → `day` ↔ `night`) | `src/core/phase.ts`, `src/main.ts` | ARCHITECTURE Rule 4 |
| Settings (volume, own localStorage key, separate from the save) | `src/app/settings.ts`, `src/data/settings.data.ts`; `sfx.ts` multiplies by it | `1-foundation/ui.md` |
| One floor — layout (rooms, corridors, roles, walk distances) | `src/systems/rift/layout.ts` | `2-night/objectives.md` |
| One floor — placement and play (fixed 1/60 tick, tile units; per-enemy multipliers, sleep, roles) | `src/systems/rift/` — `mapgen`, `enemyFactory`, `physics`, `player`, `enemies`, `boss`, `spawner`, `combat` (`cutAround`, `stunEnemy`, `isStrong`), `step`, `hooks`, `lair` (괴이 소굴), `skills` (actives, shots, zones); API `index.ts` | `2-night/combat.md`, `enemies.md`, rules `floor.md` |
| Floor objectives (one file each: `rescue`, `bounty`, `chase`, `ward`, `firsttrain`; `index.ts` = setup / update / ready / complete at stairs) | `src/systems/rift/objectives/`, `src/data/objectives.data.ts` | `2-night/objectives.md`, rules `floor.md` |
| Modifiers (현장 변형, 12: warnings + boons) | `src/data/modifiers.data.ts` (one row each; fields say what changes), folded per floor by `src/systems/rift/modifiers.ts`; applied in `enemyFactory` (ghost multipliers, regen), `mapgen` (vision, floor stats, pickup values, lair), `combat` (wisp drops), `cardEffects.heal` (heal mult), `office/contracts.ts` (swarm, pool) | rules `floor.md` |
| Growth (training, skills, facilities, supplies, trauma, `loadoutOf`) | `src/systems/growth/`, `src/data/training.data.ts`, `skills.data.ts`, `facilities.data.ts`, `penalties.data.ts` `TRAUMA`; gear `src/systems/gear/` + `growth/gear.ts`, `gear.data.ts`; skills/gear/supplies run as effect rows (`src/registry/effects/`) | `3-growth/progression.md`, rules `growth.md` |
| One night (floor plans from the offer, loadout, cards, stats, quarry carry, shards, settlement, `goalReached` (needs the objective done) / `finishAtGoal`, outcome `failed`) | `src/systems/run/` (`RunSetup.floors/fee/offerId/loadout`) | `2-night/objectives.md`, `3-growth/party.md` |
| Office day loop (day, rent, debt, board generation by objective, bundling, contamination, wanted targets, offer → floor plans, `offerGoal`, `offerDifficulty`, `offerFee`) | `src/systems/office/`, `src/data/office.data.ts`, `nodes.data.ts`, `requests.data.ts`, `objectives.data.ts`, `modifiers.data.ts`, `contracts.data.ts` (main story) | `4-day/contracts-map-ops.md`, `4-day/economy.md` |
| Day panels | `src/ui/FeatureHost.tsx`, `src/ui/features/board/` (`BoardPanel`, `OpsMap`, `OfferSheet`, `look.ts`), `ledger/` (books, morning report, facilities), `training/` (training + skills + gear tabs), `sofa/`, `bench/`, `useNav.ts` (W/S/Enter lists), `panel.ts`, `lastRun.ts`; names `src/app/names.ts` | `1-foundation/ui.md`, `4-day/hub.md` |
| Day hub (walk, `E` spots, unlocks, chatter bubble) | `src/systems/hub/`, `src/data/lobby.data.ts`, `hubLook.data.ts`, `src/scenes/hub/`, `src/app/features.ts` | `4-day/hub.md` |
| Story scenes (which plays next — chapter scenes derived from `CHAPTERS`; dialogue box, `modal` context; phone toast) | `src/systems/story/`, `src/data/story.data.ts`, `src/app/dialogue.ts`, `src/ui/DialogueBox.tsx`, `src/app/toast.ts`, `src/ui/PhoneToast.tsx` | `1-foundation/ui.md`, rules `hub.md` |
| Reputation (points → rank, training caps; gains / losses in `office/board.ts`; rank fields on data rows) | `src/systems/reputation/`, `src/data/reputation.data.ts` | rules `reputation.md` |
| Main story chapters (start by days or heat, clues, posting the main contract) | `src/systems/office/chapters.ts`, `src/data/chapters.data.ts`, `contracts.data.ts` | `1-foundation/bible.md`, rules `story.md` |
| Title | `src/scenes/title/TitleScene.ts`, `src/data/titleLook.data.ts` | `1-foundation/ui.md` |
| Card and perk effects (fixed hook points, `registry/hookPoints.ts`; 10 points added 2026-10-27) | `src/registry/cardEffects.ts`, `src/registry/effects/` (parts), `src/systems/rift/hooks.ts`, `src/data/cards.data.ts` | `3-growth/party.md`, rules `growth.md` |
| Night screen flow (hit-stop, cameras, aim, pause (4 cards incl. sound)/cards/payphone/goal prompt/end) | `src/scenes/rift/RiftScene.ts`, `RiftHud.ts`, `src/scenes/shared/Overlay.ts` | `2-night/combat.md`, `1-foundation/ui.md` |
| Night drawing (layers, y-sort, lighting, themes, blackout fog) | `src/scenes/rift/RiftView.ts`; `draw/`: `director`, `sword`, `ghosts` + `art/ghostArt`, `props` + `art/propArt`, `tiles` (`FLOOR_THEMES`), `telegraph`, `marks` (ward sites, zones, talismans, lair doors, shards, named-ghost rings) | `5-business/art.md` |
| Shared sprite kit, director sprite tables | `src/scenes/shared/draw/` (`pixelSprite`, `directorFrames`, `common`), `src/data/sprites.data.ts` | `5-business/art.md` |
| Feel numbers, palette, floor themes | `src/data/feel.data.ts` | `2-night/combat.md`, `5-business/art.md` |
| Presentation listeners | `src/scenes/shared/vfx.ts`, `sfx.ts`, `src/data/sfx.data.ts` | — |
| Assets and asset tools | `assets/` (rules in `assets/README.md`), `tools/spritekit/`, `tools/artlab/` | `5-business/art-pipeline.md`, `art-prompts.md` |
| 총괄 장부 (owner's page) | `tools/catalog/` (`npm run catalog`, README there) | — |
| Tests | `tests/core`, `rift`, `mapgen`, `run`, `office`, `save`, `balance` (+ fully trained), `hub`, `objectives` (all six + modifiers + deep), `story`, `growth` (+ `bots.ts`, `helpers.ts` incl. `storySetup`) | — |
| Dev handles (dev builds only) | `window.__rift`, `window.__hub`, `window.__store` | — |

## Tools
`npm run check` before every commit. `npm run catalog` rebuilds `docs/catalog.md` and `dist-catalog/index.html` after data changes (republish the HTML to the 총괄 장부 URL from Claude). Dev server `npx vite --port 5199 --strictPort`, stop with `kill $(lsof -ti :5199)`. Dev handles `window.__store`, `__hub`, `__rift`. Headless Chromium (cloud sandbox) `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`; it runs the game slowly, wait longer than game time.
