import type { WeaponId } from '../types/ids';

// Distances are in TILES, times in SECONDS.
export interface WeaponData {
  slash: number; // damage of a normal hit (still wrapped in newspaper)
  reach: number; // swing radius from the director's centre
  arc: number; // swing width in radians
  swingTime: number; // time between swings while attack is held
  comboWindow: number; // time after a swing in which the next one continues the combo
  comboEvery: number; // every N-th swing of a combo is a heavy hit
  comboBonus: number;
  knockback: number; // tiles an enemy is pushed by a hit
  draw: number; // 발도 damage
  parryWindow: number; // a melee telegraph can be countered in its last N seconds
  drawReach: number; // how far a 발도 reaches (parry or focus strike)
  drawStun: number; // seconds a countered enemy is stunned
  whiffRecover: number; // seconds of helplessness after a 발도 that hit nothing
  focusMax: number; // 진심 게이지 size; +1 per swing that lands
  bareTime: number; // seconds the blade stays unwrapped after a successful draw
  bareSlashBonus: number;
}

export const WEAPONS: Record<WeaponId, WeaponData> = {
  // A. 신문지에 둘둘 만 사인검
  newspaper_sword: {
    slash: 3,
    reach: 1.6,
    arc: 2.0,
    swingTime: 0.28,
    comboWindow: 0.45,
    comboEvery: 3,
    comboBonus: 3,
    knockback: 0.35,
    draw: 10,
    parryWindow: 0.22,
    drawReach: 2.2,
    drawStun: 0.9,
    whiffRecover: 0.45,
    focusMax: 5,
    bareTime: 3,
    bareSlashBonus: 2,
  },
};
