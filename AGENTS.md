# Seoul Nightwatch — instructions for any coding agent

Same rules for Claude (reads `CLAUDE.md`, which mirrors this file) and Codex or others (read this file). Keep the two identical in substance.

Start of a session, in this order and no more unless the task needs it:
1. `HANDOFF.md` — what is true now and the next tasks (short on purpose).
2. `ARCHITECTURE.md` — read in full before any code change; its Hard Rules are mandatory.
3. For a question about numbers or text in the game, `docs/catalog.md` (generated from the code) instead of opening data files one by one. For a rule's formula, the matching file in `docs/rules/`.
Do not read `docs/history.md`, `docs/reference/` or old design docs unless the task is about them.

- Respond to the user in Korean. Prose first; the user dislikes AI-looking walls of tables, bold text and numbered lists — use them only where they truly help.
- Short replies like "ㅇㅇ" / "ㅇㅋ" mean "go ahead": do not ask again; state your interpretation in one line and proceed.
- Reference research must be deep enough to reproduce the system from the description, not a surface list.
- The user is on a MacBook (zsh): give terminal commands one per line without inline `#` comments.
- Current scope: Fun Gate 2 (office & growth; plan in `docs/design/roadmap.md`), with Gate 1 art/feel polish in parallel. Do not build anything listed as out of scope.
- No hard-coding: content is data rows (`src/data/`), behaviour is registered parts; text goes through `t()` (`src/i18n/ko.ts`, `en.ts`).
- Run `npm run check` before every commit. After changing data, run `npm run catalog` and commit `docs/catalog.md`.
- End of every session: update `HANDOFF.md` (Now + Next tasks only; move finished detail to `docs/history.md`) and keep `GUIDE.md` (the owner's Korean map) in sync when folders or responsibilities change.
