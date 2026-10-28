import { CHAPTER_IDS, CHAPTERS } from '../../data/chapters.data';
import type { ChapterId, NodeId } from '../../types/ids';
import type { ChapterState, ContractOffer, OfficeState } from './types';

// 메인 스토리 장의 진행 (docs/rules/story.md). Pure: reads and writes OfficeState.chapters.

export type ChapterStatus = 'locked' | 'gathering' | 'ready' | 'done';

export function chapterStatus(s: Pick<OfficeState, 'chapters'>, id: ChapterId): ChapterStatus {
  const c = s.chapters[id];
  if (!c) return 'locked';
  if (c.done !== null) return 'done';
  return c.clues >= CHAPTERS[id].clues ? 'ready' : 'gathering';
}

// The chapter whose clues are being gathered right now (at most one at a time by design).
export function activeChapter(s: Pick<OfficeState, 'chapters'>): ChapterId | null {
  return CHAPTER_IDS.find((id) => chapterStatus(s, id) === 'gathering' || chapterStatus(s, id) === 'ready') ?? null;
}

// Each morning (and at a new game): start every chapter whose turn has come.
export function startChapters(s: OfficeState): ChapterId[] {
  const started: ChapterId[] = [];
  for (const id of CHAPTER_IDS) {
    if (s.chapters[id]) continue;
    const ch = CHAPTERS[id];
    const prev = ch.after ? s.chapters[ch.after] : null;
    if (ch.after && (prev?.done ?? null) === null) continue;
    if (s.rankReached < ch.rank) continue;
    const since = prev?.done ?? 1;
    const due = s.day >= since + ch.startAfterDays;
    const hot = ch.startHeat > 0 && ch.clueNodes.some((n) => s.contamination[n] >= ch.startHeat);
    const known = (ch.startReputation ?? 0) > 0 && s.reputation >= ch.startReputation!;
    if (!due && !hot && !known) continue;
    s.chapters = { ...s.chapters, [id]: { started: s.day, clues: 0, done: null } };
    started.push(id);
  }
  return started;
}

// A night is settled: a general success in the running chapter's districts is a clue; the main
// contract done ends its chapter. Returns the clue gained, if any.
export function chapterAfterNight(s: OfficeState, offer: ContractOffer, success: boolean): { chapter: ChapterId; have: number; need: number } | null {
  if (!success) return null;
  if (offer.kind === 'main') {
    const id = CHAPTER_IDS.find((c) => CHAPTERS[c].contract === offer.story);
    const c = id ? s.chapters[id] : undefined;
    if (id && c) s.chapters = { ...s.chapters, [id]: { ...c, done: s.day } };
    return null;
  }
  const id = activeChapter(s);
  if (!id || chapterStatus(s, id) !== 'gathering') return null;
  const ch = CHAPTERS[id];
  if (!ch.clueNodes.includes(offer.node as NodeId)) return null;
  const c = s.chapters[id]!;
  const next: ChapterState = { ...c, clues: c.clues + 1 };
  s.chapters = { ...s.chapters, [id]: next };
  return { chapter: id, have: next.clues, need: ch.clues };
}

// Main contracts that belong on the board: their chapter has started and has its clues.
export function mainContractsDue(s: OfficeState) {
  return CHAPTER_IDS.filter((id) => chapterStatus(s, id) === 'ready').map((id) => CHAPTERS[id].contract);
}
