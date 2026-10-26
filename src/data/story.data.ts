import type { TKey } from '../i18n';
import type { SceneId } from '../types/ids';

// Story scenes in the dialogue box and hub chatter (docs/design/1-foundation/ui.md "대화창",
// docs/design/1-foundation/story.md). Lines are i18n keys; who speaks decides name and portrait.

export type SpeakerId = 'director' | 'bookkeeper' | 'wolha';

export interface SpeakerData {
  nameKey: TKey;
  side: 'left' | 'right'; // portrait side in the dialogue box
}

export const SPEAKERS: Record<SpeakerId, SpeakerData> = {
  director: { nameKey: 'name.director', side: 'left' },
  bookkeeper: { nameKey: 'name.bookkeeper', side: 'right' },
  wolha: { nameKey: 'name.wolha', side: 'right' },
};

export interface SceneLine {
  speaker: SpeakerId;
  key: TKey;
}

// When a scene plays is decided in src/systems/story/ (first one whose condition holds, once each).
export const SCENES: Record<SceneId, readonly SceneLine[]> = {
  intro: [
    { speaker: 'director', key: 'scene.intro.1' },
    { speaker: 'director', key: 'scene.intro.2' },
    { speaker: 'director', key: 'scene.intro.3' },
  ],
  bookkeeper: [
    { speaker: 'bookkeeper', key: 'scene.bookkeeper.1' },
    { speaker: 'director', key: 'scene.bookkeeper.2' },
    { speaker: 'bookkeeper', key: 'scene.bookkeeper.3' },
  ],
  lights_out_done: [
    { speaker: 'wolha', key: 'scene.lights_out_done.1' },
    { speaker: 'director', key: 'scene.lights_out_done.2' },
    { speaker: 'director', key: 'scene.lights_out_done.3' },
  ],
};

// Hub chatter: speech bubbles over the bookkeeper (mockup B). Short, never the same twice in a row.
export const CHATTER = {
  bookkeeper: ['chatter.bk.1', 'chatter.bk.2', 'chatter.bk.3', 'chatter.bk.4', 'chatter.bk.5'] as readonly TKey[],
  firstAfter: 4, // seconds in the office before the first bubble
  every: 14, // seconds between bubbles
  show: 3.5, // seconds a bubble stays
} as const;
