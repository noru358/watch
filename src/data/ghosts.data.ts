import type { BossId, EnemyId } from '../types/ids';

export interface EnemyData {
  maxHp: number;
  moveSpeed: number;
  radius: number;
  contactDamage: number;
  dropValue: number; // spirit (money) dropped on kill
  // Behaviour tuning; unused fields are 0 for enemies that don't need them.
  teleportInterval: number;
  teleportTelegraph: number;
  teleportDistance: number;
  dashWindup: number;
  dashSpeed: number;
  dashDuration: number;
  dashRecover: number;
  dashTriggerRange: number;
  darknessOnHit: number; // seconds of darkened vision applied to the player
}

const ZERO = {
  teleportInterval: 0,
  teleportTelegraph: 0,
  teleportDistance: 0,
  dashWindup: 0,
  dashSpeed: 0,
  dashDuration: 0,
  dashRecover: 0,
  dashTriggerRange: 0,
  darknessOnHit: 0,
};

export const ENEMIES: Record<EnemyId, EnemyData> = {
  // 처녀귀신: drifts toward the player, periodically blinks next to them.
  cheonyeo: {
    ...ZERO,
    maxHp: 9,
    moveSpeed: 70,
    radius: 13,
    contactDamage: 1,
    dropValue: 3,
    teleportInterval: 3.2,
    teleportTelegraph: 0.55,
    teleportDistance: 70,
  },
  // 달걀귀신: slow and tanky; a hit darkens the player's vision.
  dalgyal: {
    ...ZERO,
    maxHp: 20,
    moveSpeed: 45,
    radius: 17,
    contactDamage: 1,
    dropValue: 5,
    darknessOnHit: 3,
  },
  // 지하철 망령: winds up, then charges in a straight line.
  subway: {
    ...ZERO,
    maxHp: 12,
    moveSpeed: 55,
    radius: 14,
    contactDamage: 2,
    dropValue: 4,
    dashWindup: 0.6,
    dashSpeed: 560,
    dashDuration: 0.45,
    dashRecover: 0.9,
    dashTriggerRange: 320,
  },
  // 윤전기 귀신 (boss of the Euljiro printing-shop contract).
  printer: {
    ...ZERO,
    maxHp: 220,
    moveSpeed: 40,
    radius: 34,
    contactDamage: 2,
    dropValue: 40,
  },
};

export interface BossPatternData {
  firstPatternDelay: number;
  patternInterval: number; // seconds between patterns
  burstBullets: number;
  burstSpeed: number;
  streamBullets: number;
  streamGap: number; // seconds between stream bullets
  streamSpeed: number;
  summonCount: number;
  summonSpreadX: number; // summons appear within ±this of the boss
  summonOffsetY: readonly [number, number]; // min/max distance below the boss
  bulletDamage: number;
  bulletRadius: number;
  bulletLife: number;
  phase2ExtraSummons: number;
  phase2HpRatio: number;
  phase2IntervalMult: number;
  phase2BurstBullets: number;
  burstRotation: number; // radians added to each successive burst
}

export const BOSS_PATTERNS: Record<BossId, BossPatternData> = {
  printer: {
    firstPatternDelay: 1.5,
    patternInterval: 2.2,
    burstBullets: 14,
    burstSpeed: 190,
    streamBullets: 6,
    streamGap: 0.12,
    streamSpeed: 300,
    summonCount: 2,
    summonSpreadX: 80,
    summonOffsetY: [40, 90],
    bulletDamage: 1,
    bulletRadius: 7,
    bulletLife: 4,
    phase2ExtraSummons: 1,
    phase2HpRatio: 0.5,
    phase2IntervalMult: 0.7,
    phase2BurstBullets: 22,
    burstRotation: 0.2,
  },
};
