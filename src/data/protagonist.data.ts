import type { ExorcistId } from '../types/ids';

// Distances are in TILES, times in SECONDS.
export interface ExorcistBaseData {
  maxHp: number;
  radius: number;
  moveSpeed: number; // tiles per second
  swingMoveMult: number; // move speed multiplier at the start of a swing or while recovering
  swingSlowTime: number; // how long into a swing the slowdown lasts (holding attack must not feel sticky)
  cornerNudge: number; // tiles the director is slid sideways around a wall corner instead of stopping
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
    radius: 0.32,
    moveSpeed: 5,
    swingMoveMult: 0.7,
    swingSlowTime: 0.1,
    cornerNudge: 0.4,
    dashSpeed: 15,
    dashTime: 0.18,
    dashIframes: 0.14,
    dashCooldown: 0.45,
    hurtIframes: 0.7,
    darknessVision: 3,
  },
};
