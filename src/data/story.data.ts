import type { TKey } from '../i18n';
import type { SceneId } from '../types/ids';

// Story scenes in the dialogue box and hub chatter (docs/design/1-foundation/ui.md "대화창",
// docs/design/1-foundation/bible.md). Lines are i18n keys; who speaks decides name and portrait.

export type SpeakerId = 'director' | 'bookkeeper' | 'guest' | 'creditor';

export interface SpeakerData {
  nameKey: TKey;
  side: 'left' | 'right'; // portrait side in the dialogue box
  inset?: number; // px further in from that side (a second portrait on the same side)
}

export const SPEAKERS: Record<SpeakerId, SpeakerData> = {
  director: { nameKey: 'name.director', side: 'left' },
  bookkeeper: { nameKey: 'name.bookkeeper', side: 'right' },
  guest: { nameKey: 'name.guest', side: 'right' }, // the chapter's own character (story TBD)
  creditor: { nameKey: 'name.creditor', side: 'right', inset: 200 }, // 인수 빚 채권자 (bible.md "인물"; name TBD)
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
    { speaker: 'guest', key: 'scene.lights_out_done.1' },
    { speaker: 'director', key: 'scene.lights_out_done.2' },
    { speaker: 'director', key: 'scene.lights_out_done.3' },
  ],
  // 채권자, 월세 날 아침 (bible.md "작업 중" 톤 ㄷ+ㄱ: 두 번 본 지인, 웃는데 선은 확실). Picked by CREDITOR.
  creditor_first: [
    { speaker: 'creditor', key: 'scene.creditor_first.1' },
    { speaker: 'director', key: 'scene.creditor_first.2' },
    { speaker: 'creditor', key: 'scene.creditor_first.3' },
    { speaker: 'bookkeeper', key: 'scene.creditor_first.4' },
    { speaker: 'director', key: 'scene.creditor_first.5' },
    { speaker: 'creditor', key: 'scene.creditor_first.6' },
  ],
  creditor_paid_1: [
    { speaker: 'creditor', key: 'scene.creditor_paid_1.1' },
    { speaker: 'director', key: 'scene.creditor_paid_1.2' },
    { speaker: 'creditor', key: 'scene.creditor_paid_1.3' },
    { speaker: 'bookkeeper', key: 'scene.creditor_paid_1.4' },
  ],
  creditor_paid_2: [
    { speaker: 'creditor', key: 'scene.creditor_paid_2.1' },
    { speaker: 'director', key: 'scene.creditor_paid_2.2' },
    { speaker: 'creditor', key: 'scene.creditor_paid_2.3' },
    { speaker: 'director', key: 'scene.creditor_paid_2.4' },
  ],
  creditor_paid_3: [
    { speaker: 'creditor', key: 'scene.creditor_paid_3.1' },
    { speaker: 'bookkeeper', key: 'scene.creditor_paid_3.2' },
    { speaker: 'creditor', key: 'scene.creditor_paid_3.3' },
  ],
  creditor_envelope_1: [
    { speaker: 'creditor', key: 'scene.creditor_envelope_1.1' },
    { speaker: 'creditor', key: 'scene.creditor_envelope_1.2' },
    { speaker: 'director', key: 'scene.creditor_envelope_1.3' },
    { speaker: 'creditor', key: 'scene.creditor_envelope_1.4' },
    { speaker: 'bookkeeper', key: 'scene.creditor_envelope_1.5' },
  ],
  creditor_envelope_2: [
    { speaker: 'creditor', key: 'scene.creditor_envelope_2.1' },
    { speaker: 'creditor', key: 'scene.creditor_envelope_2.2' },
    { speaker: 'director', key: 'scene.creditor_envelope_2.3' },
    { speaker: 'creditor', key: 'scene.creditor_envelope_2.4' },
  ],
  creditor_seized_1: [
    { speaker: 'creditor', key: 'scene.creditor_seized_1.1' },
    { speaker: 'bookkeeper', key: 'scene.creditor_seized_1.2' },
    { speaker: 'creditor', key: 'scene.creditor_seized_1.3' },
    { speaker: 'director', key: 'scene.creditor_seized_1.4' },
    { speaker: 'creditor', key: 'scene.creditor_seized_1.5' },
  ],
  creditor_seized_2: [
    { speaker: 'creditor', key: 'scene.creditor_seized_2.1' },
    { speaker: 'director', key: 'scene.creditor_seized_2.2' },
    { speaker: 'creditor', key: 'scene.creditor_seized_2.3' },
  ],
  creditor_credit_1: [
    { speaker: 'creditor', key: 'scene.creditor_credit_1.1' },
    { speaker: 'creditor', key: 'scene.creditor_credit_1.2' },
    { speaker: 'director', key: 'scene.creditor_credit_1.3' },
    { speaker: 'creditor', key: 'scene.creditor_credit_1.4' },
  ],
  creditor_done: [
    { speaker: 'creditor', key: 'scene.creditor_done.1' },
    { speaker: 'director', key: 'scene.creditor_done.2' },
    { speaker: 'creditor', key: 'scene.creditor_done.3' },
    { speaker: 'creditor', key: 'scene.creditor_done.4' },
  ],
  // 2장 (story TBD)
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

// Which creditor scene plays on a morning with 인수 빚 news (systems/story creditorScene).
export const CREDITOR = {
  first: 'creditor_first',
  paid: ['creditor_paid_1', 'creditor_paid_2', 'creditor_paid_3'],
  envelope: ['creditor_envelope_1', 'creditor_envelope_2'],
  seized: ['creditor_seized_1', 'creditor_seized_2'],
  credit: ['creditor_credit_1'],
  done: 'creditor_done',
} as const satisfies Record<string, SceneId | readonly SceneId[]>;

// Hub chatter: speech bubbles over the bookkeeper (mockup B). Short, never the same twice in a row.
export const CHATTER = {
  bookkeeper: ['chatter.bk.1', 'chatter.bk.2', 'chatter.bk.3', 'chatter.bk.4', 'chatter.bk.5'] as readonly TKey[],
  firstAfter: 4, // seconds in the office before the first bubble
  every: 14, // seconds between bubbles
  show: 3.5, // seconds a bubble stays
} as const;
