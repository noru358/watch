# Seoul Nightwatch — instructions for any coding agent

The one instruction file for every agent: Codex reads it directly, Claude reads it through `CLAUDE.md` (which only imports this file).

Start of a session, in this order and no more unless the task needs it:
1. `HANDOFF.md` — what is true now and the next tasks (short on purpose).
2. `ARCHITECTURE.md` — read in full before any code change; its Hard Rules are mandatory.
3. For a question about numbers or text in the game, `docs/catalog.md` (generated from the code) instead of opening data files one by one. For a rule's formula, the matching file in `docs/rules/`.
4. For story, dialogue, world or request-text work, `docs/design/1-foundation/bible.md` first (the story bible: world rules, characters, places, how story enters the game, writing style, what is still undecided).
Do not read `docs/history.md`, `docs/reference/` or old design docs unless the task is about them.

- Respond to the user in Korean. Prose first; the user dislikes AI-looking walls of tables, bold text and numbered lists — use them only where they truly help.
- Short replies like "ㅇㅇ" / "ㅇㅋ" mean "go ahead": do not ask again; state your interpretation in one line and proceed.
- Reference research must be deep enough to reproduce the system from the description, not a surface list.
- The user is on a MacBook (zsh): give terminal commands one per line without inline `#` comments.
- Current scope (2026-11-10): the order in `HANDOFF.md` "Next tasks" — fill the screen (ghosts, rooms, longer sorties), then the management core (staff assignment, payroll, lending). Do not add skills, training lines or modifiers.
- Working mode: recommend a default and let the owner confirm or veto; never park work on an "open decision". Record what the owner says about how a play session felt in `docs/history.md` — the docs once claimed nobody had played when the owner had.
- No hard-coding: content is data rows (`src/data/`), behaviour is registered parts; text goes through `t()` (`src/i18n/ko.ts`, `en.ts`).
- Docs: one topic in one file, one fact in one place. Edit the existing doc that owns a topic instead of creating a new one; a new doc only when no doc covers the topic, and then link it from its group README. Design docs say what is true now; dated "we changed X" notes go to `docs/history.md`.
- Run `npm run check` before every commit. After changing data, run `npm run catalog` and commit `docs/catalog.md`.
- End of every session: update `HANDOFF.md` (Now + Next tasks only; move finished detail to `docs/history.md`) and keep `GUIDE.md` (the owner's Korean map) in sync when folders or responsibilities change.
