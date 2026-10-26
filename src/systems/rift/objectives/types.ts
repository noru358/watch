import type { GhostId } from '../../../types/ids';
import type { Body, Pos } from '../types';

// The missing person on a rescue floor.
export interface Survivor extends Body {
  hp: number;
  maxHp: number;
  iframes: number;
  state: 'hidden' | 'following';
}

// A 결계 site: stand in the circle until it fills.
export interface WardSite extends Pos {
  progress: number; // 0..1
}

// The 추격 quarry between floors (the run carries it).
export interface QuarryCarry {
  hp: number;
  maxHp: number;
  stage: number; // how many times it has fled
  caught: boolean;
}

// What opens this floor's stairs. One state per objective kind (docs/design/2-night/objectives.md,
// numbers in src/data/objectives.data.ts). `done` = the objective itself is finished.
export type ObjectiveState =
  | { kind: 'clear'; done: boolean } // every strong ghost down
  | { kind: 'rescue'; done: boolean; survivor: Survivor; fear: number; cryT: number; sinceCry: number }
  | { kind: 'bounty'; done: boolean; targetId: number; shards: number }
  | { kind: 'chase'; done: boolean; targetId: number | null; fled: boolean; quarry: QuarryCarry; shards: number; last: boolean }
  | { kind: 'ward'; done: boolean; sites: WardSite[]; charging: boolean }
  | { kind: 'firsttrain'; done: boolean; left: number; total: number; spawnT: number; growT: number; pool: readonly GhostId[] };
