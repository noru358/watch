import { CHAPTER_IDS, CHAPTERS } from '../../data/chapters.data';
import { CREDITOR } from '../../data/story.data';
import type { ChapterId, SceneId } from '../../types/ids';
import type { ChapterStatus } from '../office';

// Public API of the story module: which scene plays next when the director is in the office.
// Pure; scenes play once each, the first one (in this order) whose condition holds.

export interface StoryProgress {
  seen: readonly SceneId[];
  solved: number;
  chapters: Partial<Record<ChapterId, ChapterStatus>>;
}

type Rule = { id: SceneId; when: (p: StoryProgress) => boolean };

// Chapter scenes come from chapters.data.ts: done (of the last chapter) → start → ready.
const chapterRules: Rule[] = CHAPTER_IDS.flatMap((id) => {
  const sc = CHAPTERS[id].scenes;
  const st = (p: StoryProgress) => p.chapters[id] ?? 'locked';
  const out: Rule[] = [];
  if (sc.done) out.push({ id: sc.done, when: (p) => st(p) === 'done' });
  if (sc.start) out.push({ id: sc.start, when: (p) => st(p) !== 'locked' });
  if (sc.ready) out.push({ id: sc.ready, when: (p) => st(p) === 'ready' || st(p) === 'done' });
  return out;
});

const RULES: readonly Rule[] = [
  { id: 'intro', when: () => true },
  { id: 'bookkeeper', when: (p) => p.solved >= 1 },
  ...chapterRules,
];

export function nextScene(p: StoryProgress): SceneId | null {
  return RULES.find((r) => !p.seen.includes(r.id) && r.when(p))?.id ?? null;
}

// The creditor on a morning with 인수 빚 news (store/loanDesk.ts LoanMorning, read through this shape).
// Plays every such morning, not once: the first visit introduces him, the rest follow what happened.
export interface CreditorNews {
  paid: number;
  left: number;
  short: boolean;
  envelope: boolean;
  seized: unknown | null;
  credit?: number;
  missedSeized?: unknown | null;
}

export function creditorScene(news: CreditorNews | undefined, day: number, seen: readonly SceneId[]): SceneId | null {
  if (!news) return null;
  const pick = (list: readonly SceneId[]) => list[day % list.length]!;
  if (!seen.includes(CREDITOR.first)) return CREDITOR.first;
  if (news.left <= 0) return seen.includes(CREDITOR.done) ? null : CREDITOR.done;
  if (news.credit) return pick(CREDITOR.credit);
  if (news.seized || news.missedSeized) return pick(CREDITOR.seized);
  if (news.envelope) return pick(CREDITOR.envelope);
  if (news.short) return pick(CREDITOR.seized);
  return news.paid > 0 ? pick(CREDITOR.paid) : null;
}
