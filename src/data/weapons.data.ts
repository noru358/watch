import type { WeaponId } from '../types/ids';

// Distances are in TILES, times in SECONDS.
export interface WeaponData {
  slash: number; // damage of a normal hit (still wrapped in newspaper)
  reach: number; // swing radius from the director's centre
  arc: number; // swing width in radians
  swingTime: number; // time between swings while attack is held
  comboWindow: number; // time after a swing in which the next one continues the combo
  comboEvery: number; // every N-th swing of a combo is a heavy hit (the finisher)
  comboBonus: number;
  finisherRecovery: number; // time after the finisher before the next swing (the combo's breath: 탁, 탁, 타악 — pause)
  knockback: number; // tiles an enemy is pushed by a hit
  // 발도 (one key, three outcomes): always a wide slash in front; inside a yellow
  // telegraph's flash it becomes a counter (받아치기); with a full focus gauge, a 360° 일섬.
  drawSlash: number; // damage of the plain wide slash
  draw: number; // damage of a counter or a focus strike
  drawArc: number; // width of the plain wide slash (radians)
  drawReach: number; // reach of the plain wide slash, and how close a ghost must be to be countered
  burstReach: number; // radius of the counter and the focus strike (both are full circles)
  drawStartup: number; // 발도 stance: the director stops, hand on the hilt, then the cut lands (counter is judged on the press)
  drawCooldown: number; // seconds between 발도 uses
  parryWindow: number; // a melee telegraph can be countered in its last N seconds
  drawStun: number; // seconds a countered enemy is stunned
  focusMax: number; // 진심 게이지 size; +1 per swing that lands
  bareTime: number; // seconds the blade stays unwrapped after a successful draw
  bareSlashBonus: number;
}

export const WEAPONS: Record<WeaponId, WeaponData> = {
  // A. 신문지에 둘둘 만 사인검
  newspaper_sword: {
    // Damage order (user, 2026-10-25): any normal hit < plain 발도 < counter = focus strike.
    // Finisher 3+1 = 4 (bared 5) < plain 발도 7 < counter = focus strike 12.
    slash: 3,
    reach: 1.6,
    arc: 2.0,
    swingTime: 0.28,
    comboWindow: 0.45,
    comboEvery: 3,
    comboBonus: 1,
    finisherRecovery: 0.42,
    knockback: 0.35,
    drawSlash: 7,
    draw: 12,
    drawArc: 2.6,
    drawReach: 2.6,
    burstReach: 3.4,
    drawStartup: 0.12,
    drawCooldown: 1.0,
    parryWindow: 0.22,
    drawStun: 0.9,
    focusMax: 5,
    bareTime: 3,
    bareSlashBonus: 1,
  },
};
