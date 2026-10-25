import type { ExorcistId } from '../types/ids';

// Distances are in TILES, times in SECONDS.
export interface ExorcistBaseData {
  maxHp: number;
  levelHpBonus: number; // max HP per level above 1
  radius: number;
  moveSpeed: number; // tiles per second
  swingMoveMult: number; // move speed multiplier while swinging or recovering
  dashSpeed: number;
  dashTime: number; // how long a dash moves
  dashIframes: number; // invulnerable part at the start of a dash (Gungeon: front half only)
  dashCooldown: number;
  hurtIframes: number;
  darknessVision: number; // tiles visible while darkened
}

export const EXORCISTS: Record<ExorcistId, ExorcistBaseData> = {
  director: {
    maxHp: 12,
    levelHpBonus: 1,
    radius: 0.32,
    moveSpeed: 5,
    swingMoveMult: 0.45,
    dashSpeed: 15,
    dashTime: 0.18,
    dashIframes: 0.14,
    dashCooldown: 0.45,
    hurtIframes: 0.7,
    darknessVision: 3,
  },
};
