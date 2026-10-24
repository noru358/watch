# Seoul Nightwatch — Architecture & Development Rules (v1.1)

> 《서울 나이트워치: 을지로 퇴마 사무소》 — City-pop urban fantasy + management RPG.
> Every AI session MUST read this file before writing code. If a request conflicts with a rule here, stop and say so instead of silently breaking the rule.

## 1. Core Tech Stack

- **Language & Bundler:** TypeScript (`strict: true`), Vite
- **Night (Rift combat & exploration):** Phaser 3 — 100% canvas, including the combat HUD and the in-run pause menu
- **Day (Office, Roster, Seoul Map, Rental Market):** React (DOM overlay, mounted ONLY in the Day phase)
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
- Traits, traumas and gear effects hook into fixed timing points only: `onRunStart`, `onRoomEnter`, `onBeforeAttack`, `onHit`, `onTakeDamage`, `onKill`, `onRunEnd`. Adding a hook point is an architecture change — note it in `HANDOFF.md`.

### Rule 3 — State mutation vs presentation
- **State changes** (HP, gold, items, trait acquisition, district purification) happen ONLY through direct calls to `src/systems/*` functions or `GameStore` actions. Never mutate state from an EventBus listener.
- **Presentation** (damage numbers, hit-stop, camera shake, SFX, particles) is triggered by typed events on `EventBus` (`src/core/EventBus.ts`). The event map is a single TypeScript type; untyped `emit('SOME_STRING')` is forbidden.
- Rule of thumb: if removing a listener would change the save file, it is not presentation and must not be on the bus.

### Rule 4 — Unified input & focus safety (`src/core/InputManager.ts`)
- Never attach keyboard/gamepad listeners to the Phaser canvas or to React components directly. All input is read from `window` through `InputManager`.
- `InputManager` holds a context stack: `night` / `day` / `modal`. Only the top context receives input.
- Night: React overlay is unmounted, Phaser has input. Day: Phaser scene is paused and its input disabled. Switching phase goes through one function (`setPhase`) — never toggle visibility ad hoc.
- Regression to prevent: "after closing a window, the game needs a click before keys work." Any UI change must be checked against this.

### Rule 5 — File size & responsibility
- Keep files under ~400 lines. Split by responsibility, not by line count alone.
- `src/systems/` and `src/store/` MUST NOT import Phaser or React. Rendering code MUST NOT contain game rules.

### Rule 6 — Determinism & save safety
- No `Math.random()` in gameplay. Use `SeededRNG` (`src/core/SeededRNG.ts`), passed in explicitly.
- Combat logic runs on a fixed timestep; rendering interpolates.
- Saves carry `schemaVersion: number` and pass through `SaveManager.migrate()` on load. Any change to the save shape bumps the version and adds a migration + test.

### Rule 7 — Server-authoritative economy (design for it now, build it in Gate 4)
- Exorcist power is ALWAYS derived by a pure function: `computeExorcistStats(level, traits, gear)` in `src/systems/`. Never store final stats.
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
 ├── core/        # Infrastructure: InputManager, EventBus, SeededRNG, SaveManager, phase switch
 ├── types/       # Shared interfaces, ID union types (ids.ts), event map (events.ts)
 ├── i18n/        # ko.ts (source of keys), en.ts, t() helper
 ├── data/        # Static typed tables: exorcists, ghosts, skills, traits, districts, items,
 │                #   tools, contracts, penalties, recruit, economy, lobby, shop
 ├── registry/    # Behaviour by ID: skillEffects.ts (companion + tool skills), traitHooks.ts
 ├── store/       # GameStore (single source of truth) + actions
 ├── systems/     # Pure gameplay logic, no Phaser/React — one folder per module:
 │                #   combat/, trait/, contract/, run/, recruit/, economy/, dispatch/, rental/, shop/
 ├── scenes/      # Phaser: RiftScene, hub/, CombatHud, entity views, vfx/, postfx/
 └── ui/          # React panels: features/<featureId>/ (roster, recovery, dispatch, rental, settings…)
tests/            # Vitest specs mirroring src/systems and src/store
maps/             # Tiled source maps (.tmx/.json) and tilesets
assets/           # Sprites, portraits, audio
docs/design/      # Game design split by module (README.md = module index; human-readable, Korean)
```

### Module boundaries
- Each `src/systems/<module>/` exposes its public functions through `index.ts`. Other code imports only from that `index.ts`, never from a module's internal files.
- Modules talk to each other through `GameStore` actions and shared types in `src/types/`, not by reaching into each other's state.
- Every module has a matching design doc in `docs/design/`. When a design decision changes, update that doc; when a new module is added, add a row to `docs/design/README.md`.
- Platform differences (PC vs mobile, paid vs F2P) are resolved in one place (`src/core/platform.ts`). Gameplay rules never branch on platform.

React reads `GameStore` via `useSyncExternalStore`. Phaser reads it via `GameStore.subscribe`. Neither owns state.

## 4. Game Loop (reference)

- **Day (macro):** office management, 2nd squad auto-dispatch to already-purified districts (capped, secondary income), trauma recovery (굿/rest), rental market, Seoul map → choose tonight's rift.
- **Night (micro):** room-based top-down rift run, control the leader directly + tag skills of squad members, hit-feedback-heavy combat, trait/trauma events, extract via boss kill or the return payphone.
- Main progression comes from Night play. Day automation must never out-earn active play.

## 5. Fun Gates

Each gate must be fun on its own before the next starts. If a gate fails, change the loop — do not polish.

- **Gate 1 — Night combat prototype (CURRENT):** one Euljiro rift, 4 exorcists, a few ghost types, 1 boss, leader control + tag skills, hit-stop / damage popups / drop sounds, trait acquisition, extraction. Day screen = a single placeholder menu. No backend, no idle dispatch, no furniture.
- **Gate 2 — Roster & growth:** office hub, roster management, traits/traumas persisting across runs, recovery.
- **Gate 3 — Seoul map & 2nd squad:** multiple districts, purification progress, capped idle dispatch.
- **Gate 4 — Rental market:** NPC offices first (works fully offline), then Supabase with server-side stat recompute and fee settlement (Rule 7). Popularity-based fee diminishing applied per office account, not per exorcist.
- **Gate 5 — Steam build:** Electron packaging, Steamworks (achievements, cloud save), English localization pass.

## 6. Out of Scope (until stated otherwise)

Mobile builds, real-money purchases tied to the rental economy, real-time multiplayer.
