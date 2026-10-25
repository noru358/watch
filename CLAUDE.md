# Seoul Nightwatch

Read `ARCHITECTURE.md` in full before any code change — its Hard Rules are mandatory.
Then read `HANDOFF.md` for the current state and next step.
`GUIDE.md` is the plain-Korean map for the human owner — keep it in sync when folders or responsibilities change.

- Respond to the user in Korean. Prose first; the user dislikes AI-looking walls of tables, bold text and numbered lists — use them only where they truly help.
- Short replies like "ㅇㅇ" / "ㅇㅋ" mean "go ahead": do not ask again; state your interpretation in one line and proceed.
- Reference research must be deep enough to reproduce the system from the description, not a surface list.
- The user is on a MacBook (zsh): give terminal commands one per line without inline `#` comments.
- Current scope: Fun Gate 2 (office & growth; plan in `docs/design/roadmap.md`), with Gate 1 art/feel polish continuing in parallel (user decision 2026-10-25). Do not build anything listed as out of scope for the current gate.
- Run `npm run check` before every commit. Update `HANDOFF.md` at the end of every session.
