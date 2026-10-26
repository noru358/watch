import type { ContractId, SceneId } from '../../types/ids';

// Public API of the story module: which scene plays next when the director is in the office.
// Pure; scenes play once each, in this order of priority.

export interface StoryProgress {
  seen: readonly SceneId[];
  solved: number;
  storyDone: readonly ContractId[];
}

const RULES: readonly { id: SceneId; when: (p: StoryProgress) => boolean }[] = [
  { id: 'intro', when: () => true },
  { id: 'lights_out_done', when: (p) => p.storyDone.includes('lights_out') },
  { id: 'bookkeeper', when: (p) => p.solved >= 1 },
];

export function nextScene(p: StoryProgress): SceneId | null {
  return RULES.find((r) => !p.seen.includes(r.id) && r.when(p))?.id ?? null;
}
