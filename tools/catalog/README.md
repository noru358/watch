# 총괄 장부 (tools/catalog)

The owner's one-page view of every game table, generated from the code (never edited by hand).

- `npm run catalog` → `docs/catalog.md` (committed; the text version any agent reads; a test fails when it is stale) and `dist-catalog/index.html` (gitignored; open it in a browser on your own computer, memos then stay in that browser and "전부 복사" turns them into text for any AI).
- Published at https://claude.ai/artifact/YFeE4XiaLTBUWSPg1Hrm8X — republish the built file to that URL after data changes (`Artifact` publish with `url`, keep `capabilities` as stored: `db`).
- The page keeps the owner's per-row memos in its artifact database, collection `notes` (doc id `<section>__<row id>`, fields `label`, `text`, `done`, `at`). When the owner says "장부 메모 반영해": read `notes` with ArtifactData, apply what is asked in the code, then set `done: true` on each applied memo.
- `export.ts` collects the tables (add a new data file there), `template.html` draws one tab per area.
