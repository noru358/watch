import type { TKey } from '../i18n';
import type { ChapterId, ContractId, NodeId, SceneId } from '../types/ids';

// 메인 스토리 장 (docs/rules/story.md). A chapter is a hand-written main contract plus how it comes up:
// 1. it starts once the chapter before it is done, at the latest `startAfterDays` days later — or
//    sooner, the morning its district first reaches `startHeat` contamination (so the story never
//    stalls, and a neglected district pulls it forward);
// 2. while it runs, each 일반 의뢰 succeeded in `clueNodes` gives one 단서; with `clues` of them the
//    main contract is posted (no deadline);
// 3. finishing the main contract ends the chapter.
// Before the first chapter opens the game is in "0장" (never shown): general offers only.
// Scenes play in the office at each step (src/systems/story). Adding a chapter = a row here, its
// contract in contracts.data.ts, its scenes in story.data.ts, ids, i18n.
export interface ChapterData {
  nameKey: TKey;
  contract: ContractId;
  after: ChapterId | null;
  startAfterDays: number; // after the chapter before it ends (the first chapter: after day 1)
  startHeat: number;
  startReputation?: number; // …or sooner, once the office has this many 평판 points (0 / none = off)
  rank: number; // 평판 rank the office needs before it starts (0 for now: pacing kept as is, user 2026-10-27)
  clues: number;
  clueNodes: readonly NodeId[];
  scenes: { start: SceneId | null; ready: SceneId | null; done: SceneId | null };
}

export const CHAPTERS: Record<ChapterId, ChapterData> = {
  // 1장 (story TBD): after 0장 (provisional, user 2026-10-29 "0장은 둬야 해, 날짜냐 조건이냐는 같이 고민"):
  // opens on day 4 or once the office has 30 평판 (about two or three general offers), no clues needed.
  ch1: { nameKey: 'chapter.ch1', contract: 'lights_out', after: null, startAfterDays: 3, startHeat: 0, startReputation: 30, rank: 0, clues: 0, clueNodes: ['alley'], scenes: { start: null, ready: null, done: 'lights_out_done' } },
  // 2장 (story TBD).
  ch2: { nameKey: 'chapter.ch2', contract: 'last_line', after: 'ch1', startAfterDays: 4, startHeat: 4, rank: 0, clues: 3, clueNodes: ['station', 'arcade'], scenes: { start: 'ch2_start', ready: 'ch2_ready', done: 'ch2_done' } },
};

export const CHAPTER_IDS = Object.keys(CHAPTERS) as ChapterId[];
