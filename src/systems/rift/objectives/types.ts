import type { Body } from '../types';

// The missing person on a rescue floor.
export interface Survivor extends Body {
  hp: number;
  maxHp: number;
  iframes: number;
  state: 'hidden' | 'following';
}

// What opens this floor's stairs. One state per objective kind (docs/design/2-night/objectives.md).
export type ObjectiveState =
  | { kind: 'clear'; done: boolean } // every strong ghost down (the old "seal")
  | { kind: 'rescue'; done: boolean; survivor: Survivor; fear: number; cryT: number; sinceCry: number };
