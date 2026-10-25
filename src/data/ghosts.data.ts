import type { BossId, GhostId } from '../types/ids';

// Distances are in TILES, times in SECONDS. Two roles:
// - strong ghosts: every attack is telegraphed on the floor; only 'cone'/'circle' melee can be countered with 발도.
// - swarm fodder ('none' attack): weak, many, hurt by touch only. They come in waves (see contracts.data.ts).
export type AttackShape = 'cone' | 'circle' | 'line' | 'none';

export interface GhostData {
  hp: number;
  damage: number;
  speed: number;
  radius: number;
  sight: number;
  drop: number; // spirit gained on kill
  attack: AttackShape;
  attackRange: number; // starts an attack when this close (line: dash length)
  attackSize: number; // cone/circle radius, or line width
  attackArc: number; // cone width in radians (0 for other shapes)
  windup: number; // telegraph time
  recover: number; // helpless time after attacking
  teleportEvery: number; // 0 = never
  teleportWarn: number;
  teleportBehind: number; // tiles behind the director it reappears
  teleportJitter: number; // random extra seconds between blinks
  dashSpeed: number;
  darkness: number; // seconds of darkened vision on hit
  contactDamage: number; // swarm fodder only: damage on touch
  fodder: boolean; // swarm fodder: no hit-stop on kill, counted against the swarm cap
}

export const GHOSTS: Record<GhostId, GhostData> = {
  // 처녀귀신: floats in, swipes with her hair (cone), sometimes blinks behind the director.
  cheonyeo: { hp: 9, damage: 2, speed: 2.4, radius: 0.38, sight: 9, drop: 3, attack: 'cone', attackRange: 1.1, attackSize: 1.5, attackArc: 1.6, windup: 0.6, recover: 0.6, teleportEvery: 6, teleportWarn: 0.6, teleportBehind: 1.3, teleportJitter: 1, dashSpeed: 0, darkness: 0, contactDamage: 0, fodder: false },
  // 달걀귀신: slow and tanky, a body slam around itself (circle); a hit darkens vision.
  dalgyal: { hp: 18, damage: 2, speed: 1.3, radius: 0.48, sight: 7, drop: 5, attack: 'circle', attackRange: 1.1, attackSize: 1.6, attackArc: 0, windup: 0.9, recover: 0.9, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 4, contactDamage: 0, fodder: false },
  // 지하철 망령: telegraphs a straight dash (line) — cannot be countered, only dodged.
  subway: { hp: 11, damage: 3, speed: 1.8, radius: 0.42, sight: 10, drop: 4, attack: 'line', attackRange: 6, attackSize: 0.9, attackArc: 0, windup: 0.7, recover: 1.0, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 14, darkness: 0, contactDamage: 0, fodder: false },
  // 도깨비불: swarm fodder. Fragile will-o'-wisps that rush in packs and burn on touch.
  dokkaebibul: { hp: 2, damage: 0, speed: 3.1, radius: 0.24, sight: 30, drop: 1, attack: 'none', attackRange: 0, attackSize: 0, attackArc: 0, windup: 0, recover: 0, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 0, contactDamage: 1, fodder: true },
};

export interface BossData {
  hp: number;
  damage: number;
  speed: number;
  radius: number;
  drop: number;
  slamRange: number; // close-range pounce (parriable circle)
  slamTrigger: number; // starts a slam when the director is this close (edge to edge)
  slamWindup: number;
  sweepEvery: number; // tail sweep: a band across the room (cannot be countered)
  sweepWindup: number;
  sweepWidth: number;
  sweepDamage: number;
  summonEvery: number;
  summon: GhostId;
  summonCount: number; // ghosts per summon
  summonSpread: number; // ± tiles sideways from the boss
  summonBelow: readonly [number, number]; // tiles below the boss
  recover: number;
  phase2Ratio: number;
  phase2Mult: number; // phase 2 timers × this (faster)
}

export const BOSSES: Record<BossId, BossData> = {
  // 구미호 「월하」: nine tails sweep a row (phase 2: row + column), pounces up close, scatters fox-fire wisps.
  gumiho: {
    hp: 120,
    damage: 3,
    speed: 1.1,
    radius: 0.9,
    drop: 40,
    slamRange: 1.9,
    slamTrigger: 1.3,
    slamWindup: 0.8,
    sweepEvery: 4.5,
    sweepWindup: 1.0,
    sweepWidth: 1.3,
    sweepDamage: 3,
    summonEvery: 8,
    summon: 'dokkaebibul',
    summonCount: 3,
    summonSpread: 2,
    summonBelow: [1, 2.5],
    recover: 0.9,
    phase2Ratio: 0.5,
    phase2Mult: 0.7,
  },
};
