import type { TKey } from '../i18n';
import type { SceneId } from '../types/ids';

// Story scenes in the dialogue box and hub chatter (docs/design/1-foundation/ui.md "대화창",
// docs/design/1-foundation/bible.md). Lines are i18n keys; who speaks decides name and portrait.

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
  // 2장 막차가 끊기지 않는 역
  ch2_start: [
    { speaker: 'bookkeeper', key: 'scene.ch2_start.1' },
    { speaker: 'director', key: 'scene.ch2_start.2' },
    { speaker: 'bookkeeper', key: 'scene.ch2_start.3' },
    { speaker: 'director', key: 'scene.ch2_start.4' },
  ],
  ch2_ready: [
    { speaker: 'bookkeeper', key: 'scene.ch2_ready.1' },
    { speaker: 'director', key: 'scene.ch2_ready.2' },
    { speaker: 'bookkeeper', key: 'scene.ch2_ready.3' },
  ],
  ch2_done: [
    { speaker: 'director', key: 'scene.ch2_done.1' },
    { speaker: 'bookkeeper', key: 'scene.ch2_done.2' },
    { speaker: 'director', key: 'scene.ch2_done.3' },
  ],
};

// Rent, felt in small ways (user, 2026-10-27): the landlady texts on rent morning, the bookkeeper
// reminds the day before, the wall calendar counts down (HubView). One line picked by the day.
export const RENT_TALK = {
  from: 'name.landlady' as TKey,
  paid: ['rent.paid.1', 'rent.paid.2', 'rent.paid.3'] as readonly TKey[],
  cleared: 'rent.cleared' as TKey, // paid, debt included
  short: ['rent.short.1', 'rent.short.2'] as readonly TKey[],
  reminder: 'chatter.bk.rentTomorrow' as TKey, // the bookkeeper, the day before
} as const;

// Hub chatter: speech bubbles over the bookkeeper (mockup B). Short, never the same twice in a row.
export const CHATTER = {
  bookkeeper: ['chatter.bk.1', 'chatter.bk.2', 'chatter.bk.3', 'chatter.bk.4', 'chatter.bk.5'] as readonly TKey[],
  firstAfter: 4, // seconds in the office before the first bubble
  every: 14, // seconds between bubbles
  show: 3.5, // seconds a bubble stays
} as const;
