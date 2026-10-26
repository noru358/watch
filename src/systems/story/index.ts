import { CHAPTER_IDS, CHAPTERS } from '../../data/chapters.data';
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
