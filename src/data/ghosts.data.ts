import type { BossId, GhostId } from '../types/ids';

export interface GhostData {
  hp: number;
  damage: number;
  moveEvery: number; // acts every N turns (2 = slow)
  sight: number; // manhattan tiles at which it notices the director
  drop: number; // spirit gained on kill
  teleportEvery: number; // 0 = never
  dashRange: number; // 0 = no dash
  darknessTurns: number; // vision loss on hit
}

export const GHOSTS: Record<GhostId, GhostData> = {
  // 처녀귀신: walks toward the director and periodically blinks next to them.
  cheonyeo: { hp: 7, damage: 2, moveEvery: 1, sight: 9, drop: 3, teleportEvery: 6, dashRange: 0, darknessTurns: 0 },
  // 달걀귀신: slow and tanky; a hit darkens vision.
  dalgyal: { hp: 14, damage: 2, moveEvery: 2, sight: 7, drop: 5, teleportEvery: 0, dashRange: 0, darknessTurns: 8 },
  // 지하철 망령: telegraphs a straight-line dash (cannot be parried from afar).
  subway: { hp: 9, damage: 3, moveEvery: 1, sight: 9, drop: 4, teleportEvery: 0, dashRange: 6, darknessTurns: 0 },
};

export interface BossData {
  hp: number;
  damage: number; // adjacent strike (parriable)
  moveEvery: number;
  drop: number;
  lineEvery: number; // turns between paper-roller line attacks (must be dodged)
  lineDamage: number;
  summonEvery: number;
  summon: GhostId;
  phase2Ratio: number; // HP ratio that triggers phase 2
  phase2LineEvery: number;
  phase2SummonEvery: number;
}

export const BOSSES: Record<BossId, BossData> = {
  // 윤전기 귀신: sweeps a row (phase 2: row + column) with paper rollers, summons maidens.
  printer: {
    hp: 90,
    damage: 3,
    moveEvery: 2,
    drop: 40,
    lineEvery: 4,
    lineDamage: 3,
    summonEvery: 7,
    summon: 'cheonyeo',
    phase2Ratio: 0.5,
    phase2LineEvery: 3,
    phase2SummonEvery: 5,
  },
};
