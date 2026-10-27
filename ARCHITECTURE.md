# Seoul Nightwatch — Architecture & Development Rules (v1.2)

> 《서울 나이트워치: 을지로 퇴마 사무소》 — City-pop urban fantasy + management RPG.
> Every AI session MUST read this file before writing code. If a request conflicts with a rule here, stop and say so instead of silently breaking the rule.

## 1. Core Tech Stack

- **Language & Bundler:** TypeScript (`strict: true`), Vite
- **Night (Rift combat & exploration):** Phaser 3 — 100% canvas, including the combat HUD and the in-run pause menu
- **Day hub (inside the office):** a walkable Phaser scene (souls-style: walk up to someone, `E` to talk, walk out the front door to sortie). No permanent menu bar or currency bar on screen.
- **Day panels (Office ledger, Roster, Seoul Map, Rental Market):** React (DOM overlay, mounted ONLY in the Day phase), opened from the hub by talking to someone; one panel at a time
- **Shared State:** Vanilla TypeScript store (`GameStore`), independent of both React and Phaser
- **Map Authoring:** Tiled Map Editor (`.json` tilemaps loaded by Phaser)
- **Tests:** Vitest for everything under `src/systems/` and `src/store/`
- **Desktop Packaging:** Electron + `steamworks.js` (Steam first; mobile deferred until after Steam launch)
- **Backend (later gate only):** Supabase — not used before Gate 4

## 2. Hard Rules (MUST FOLLOW)

### Rule 1 — Zero hardcoding, type-safe data (`src/data/*.data.ts`)
- No raw stats, multipliers, cooldowns, drop rates or user-facing strings inside logic files.
- Static game data lives in typed `.ts` constant tables (`Record<ExorcistId, ExorcistData>` etc.) so the compiler catches typos and missing fields. Do NOT use untyped `.json` for game data (Tiled maps are the only exception).
- IDs are string-literal union types declared in `src/types/ids.ts`. Never use a bare `string` where an ID is expected.
- All user-facing text goes through `t(key)` (`src/i18n/`). Keys are typed from `ko.ts`, so an unknown key is a compile error. `en.ts` must have the same key set.

### Rule 2 — Function registry for skills & traits (`src/registry/`)
- No string DSL / effect interpreters (e.g. `["DAMAGE", "STUN"]`).
- Numbers live in `src/data/`. Behaviour lives in small pure functions registered by ID in `src/registry/`.
- Upgrade cards, passive skills and supplies (later traits, gear) hook into fixed timing points only (`src/registry/hookPoints.ts`): `onRunStart`, `onRoomEnter`, `onBeforeAttack`, `onHit`, `onTakeDamage`, `onKill`, `onRunEnd`, and since 2026-10-27 `onAfterHurt`, `onLethal`, `onDashTick`, `onDashEnd`, `onSwing`, `onCounter`, `onFocusStrike`, `onDodge`, `onFloorEnd`, `onMove`. Adding a hook point is an architecture change — note it in `HANDOFF.md`.

### Rule 3 — State mutation vs presentation
- **State changes** (HP, gold, items, trait acquisition, district purification) happen ONLY through direct calls to `src/systems/*` functions or `GameStore` actions. Never mutate state from an EventBus listener.
- **Presentation** (damage numbers, hit-stop, camera shake, SFX, particles) is triggered by typed events on `EventBus` (`src/core/EventBus.ts`). The event map is a single TypeScript type; untyped `emit('SOME_STRING')` is forbidden.
- Rule of thumb: if removing a listener would change the save file, it is not presentation and must not be on the bus.

### Rule 4 — Unified input & focus safety (`src/core/InputManager.ts`)
- Never attach keyboard/gamepad listeners to the Phaser canvas or to React components directly. All input is read from `window` through `InputManager`.
- `InputManager` holds a context stack: `night` / `day` / `modal`. Only the top context receives input.
- Night: React overlay is unmounted, Phaser renders; keyboard and mouse are still read only through `InputManager` (mouse buttons bind like keys: `Mouse0`, `Mouse2`). Day: the rift scene is stopped; the hub scene reads the `day` context, and a React panel opened from it pushes `modal` (the hub then reads as idle). Panels open and close only through `openFeature(id)` / `closeFeature()` (`src/app/features.ts`), which push/pop the context. Title (boot phase): only the title scene runs and reads the `day` context. A story dialogue (`src/app/dialogue.ts`) pushes `modal` like a panel. Switching phase (`title` / `day` / `night`) goes through one function (`setPhase`) — never toggle visibility ad hoc.
- Touch (mobile, after Steam) will be one more input source inside `InputManager` that produces the same actions (tap-to-walk in the hub, on-screen buttons at night). Scenes and panels never read touch events themselves.
- Night combat uses at most 4 action buttons (now: slash J, dash Space, 발도 K, the equipped active skill L — the companion call will have to share or replace that slot) besides movement and mouse aim; `Esc` is menu only. A new combat action must replace one, not add a fifth.
- Regression to prevent: "after closing a window, the game needs a click before keys work." Any UI change must be checked against this.

### Rule 5 — File size & responsibility
- Keep files under ~400 lines. Split by responsibility, not by line count alone.
- `src/systems/` and `src/store/` MUST NOT import Phaser or React. Rendering code MUST NOT contain game rules.

### Rule 6 — Determinism & save safety
- No `Math.random()` in gameplay. Use `SeededRNG` (`src/core/SeededRNG.ts`), passed in explicitly.
- Night combat is real-time on a tile grid (Core Keeper style, decided 2026-10-25, see `docs/design/2-night/combat.md`). Simulation runs on a fixed timestep in tile units; rendering interpolates. Every enemy attack is a floor telegraph.
- Saves carry `schemaVersion: number` and pass through `SaveManager.migrate()` on load. Any change to the save shape bumps the version and adds a migration + test.

### Rule 7 — Server-authoritative economy (design for it now, build it in Gate 4)
- Exorcist power is ALWAYS derived by a pure function: `computeExorcistStats(exorcist, training, cards, weapon, perks)` in `src/systems/run/stats.ts` (base → 트레이닝 → passive skills → cards). Never store final stats. Every number the director's feel depends on (move, dash, swing interval, 발도 cooldown, parry window, reach, hurt iframes, pickup pull) is a `Stats` field; systems read `f.stats`, never the exorcist / weapon tables directly. (Changed 2026-10-27: `level` → training levels, `Stats` widened.)
- The rental market will only accept the inputs (level, trait IDs, gear IDs). The server recomputes stats with the same shared function and settles fees itself. The client never sends final stats or fee amounts.
- Idle (2nd squad) income and rental fees will use server time once the backend exists. Until then, keep the calculation a pure function of `(startTime, endTime, state)` so it can move server-side unchanged.

### Rule 8 — Work discipline for AI sessions
- Edit surgically. Never rewrite a whole file to change part of it; never leave `// ...rest unchanged` placeholders.
- Before every commit: `npm run check` (= `tsc --noEmit` + `vitest run`) must pass.
- New or changed logic in `src/systems/` ships with tests.
- At the end of a session, update `HANDOFF.md`: what changed, what is verified (and how), what is broken or unverified, next step. Report honestly — "not tested" is acceptable, "should work" is not.

## 3. Directory Structure

```
src/
 ├── app/         # App wiring: singletons (input, store), phase-switch binding, open-panel state (features.ts)
 ├── core/        # Infrastructure: InputManager, EventBus, SeededRNG, SaveManager (schemaVersion 2, live), phase switch
 ├── types/       # Shared interfaces, ID union types (ids.ts), event map (events.ts)
 ├── i18n/        # ko.ts (source of keys), en.ts, t() helper
 ├── data/        # Static typed tables: protagonist, weapons, cards, ghosts, dungeon, contracts,
 │                #   penalties (+ trauma), feel (night presentation), hubLook (day presentation), titleLook, objectives (per-objective numbers + how each shapes a general contract), modifiers (현장 변형), training, skills, facilities (+ supplies), story (scenes, speakers, chatter), settings (volume steps), sfx, input, save, sprites (sprite anim tables), lobby (hub layout + feature registry), office (rent, board, contamination numbers), nodes (operations map), requests (general-contract story frames); later recruit, shop
 ├── registry/    # Behaviour by ID on fixed hook points (hookPoints.ts): cardEffects.ts (upgrade cards), effects/ (effect parts: skills, gear specials and supplies are data rows of when + if → part + numbers); later companion skills
 ├── store/       # GameStore (single source of truth) + actions
 ├── systems/     # Pure gameplay logic, no Phaser/React — one folder per module:
 │                #   rift/ (one floor: layout = rooms + roles, mapgen = what stands in them, objectives/ = one file per floor objective, lair = 괴이 소굴, skills = actives on L, tile physics, player, enemies, boss, swarm spawner, telegraphs), run/ (a night: floors, cards, stats, settlement), hub/ (walking, who is in reach, what is unlocked), story/ (which scene plays next), growth/ (training, skills, facilities, supplies, trauma; `loadoutOf` = what a night takes from the office),
 │                #   office/ (day loop, rent and debt, contract board, node contamination, offer → floor plans); later: recruit/, dispatch/, rental/, shop/
 ├── scenes/      # Phaser, one folder per screen: rift/ (night: scene, view = draw order, HUD; draw/ = one file per drawn thing, the art swap points), hub/ (day: walkable office interior + chatter bubble), title/ (title menu), shared/ (Overlay panels, vfx, sfx, crisp text; draw/ = sprite kit shared by every scene)
 └── ui/          # React: FeatureHost (mounts the open panel + DialogueBox), features/<featureId>/ (one folder per hub panel)
tests/            # Vitest specs mirroring src/systems and src/store
maps/             # Tiled source maps (.tmx/.json) and tilesets
assets/           # source/ = raw generated or commissioned art (never deleted), sprites/ = cleaned game sprites (see assets/README.md)
tools/            # Outside the game build: spritekit/ (clean AI pixel sheets), artlab/ (pixel-art lab)
docs/design/      # Game design in 5 groups: 1-foundation, 2-night, 3-growth, 4-day, 5-business (README.md = module map; each group has its own README)
docs/reference/   # Reference-game teardowns (Pokémon Mystery Dungeon, Girls' Frontline, top-down action, dispatch games, mission structures, progression, indie UI)
docs/rules/       # Rule ledger: what the code actually computes, per module (formulas + where each number lives). Update it in the same commit as a rule change
GUIDE.md          # Plain-Korean map for the human owner — keep in sync with this tree
```

### Module boundaries
- Each `src/systems/<module>/` exposes its public functions through `index.ts`. Other code imports only from that `index.ts`, never from a module's internal files.
- Modules talk to each other through `GameStore` actions and shared types in `src/types/`, not by reaching into each other's state.
- Every module has a matching design doc in `docs/design/`. When a design decision changes, update that doc; when a new module is added, add a row to `docs/design/README.md` and to its group README.
- Platform differences (PC vs mobile, paid vs F2P) are resolved in one place (`src/core/platform.ts`). Gameplay rules never branch on platform.

React reads `GameStore` via `useSyncExternalStore`. Phaser reads it via `GameStore.subscribe`. Neither owns state.

## 4. Game Loop (reference)

- **Day (macro):** office management, 2nd squad auto-dispatch to already-purified districts (capped, secondary income), trauma recovery (굿/rest), rental market, Seoul map → choose tonight's rift.
- **Night (micro):** room-based top-down rift run, control the leader directly + tag skills of squad members, hit-feedback-heavy combat, trait/trauma events, extract via boss kill or the return payphone.
- Main progression comes from Night play. Day automation must never out-earn active play.

## 5. Fun Gates

Each gate must be fun on its own before the next starts. If a gate fails, change the loop — do not polish.

- **Gate 1 — Night combat prototype (feature-complete; passes on the user's playtest; art/sound polish is a parallel track, not a gate condition):** one Euljiro contract as real-time top-down floors on a tile grid (Core Keeper style), the director alone (weapon A: newspaper-wrapped sword with combo, bared blade and 발도 — one key: wide slash / counter in the flash window / 360° strike on full focus), dash with front-loaded i-frames, base + weapon upgrade-card decks, a few ghost types, 1 boss, hit-stop / damage popups / drop sounds, payphone extraction. Day screen = a single placeholder menu. No backend, no idle dispatch, no furniture.
- **Gate 2 — Office & growth (CURRENT, started 2026-10-25):** the day loop first (2-A: walkable office hub, day counter and weekly rent, 2–3 contracts to choose from on a contract board / map, a minimal dialogue box, save v2 with title / new game), then growth (2-B: the first companion with 1 party slot — call skill + companion card deck, see `docs/design/3-growth/party.md`; a minimal squad operation that makes "take along or send out" a real choice; companion traits (기질) and traumas persisting across runs with real effects + recovery). Which companion comes first, how recruiting works (story episodes vs chance), how heavy squad operations are, the big story, reputation rank, weapon B and the cat's role are open: `docs/design/1-foundation/direction.md`. Plan and gap review: `docs/design/roadmap.md`.
- **Gate 3 — Seoul map & 2nd squad:** multiple districts, purification progress, capped idle dispatch.
- **Gate 4 — Rental market:** NPC offices first (works fully offline), then Supabase with server-side stat recompute and fee settlement (Rule 7). Popularity-based fee diminishing applied per office account, not per exorcist.
- **Gate 5 — Steam build:** Electron packaging, Steamworks (achievements, cloud save), English localization pass.

## 6. Out of Scope (until stated otherwise)

Mobile builds, real-money purchases tied to the rental economy, real-time multiplayer.
