import type { ExorcistId } from '../types/ids';

export interface ExorcistBaseData {
  maxHp: number;
  moveSpeed: number; // px per second
  radius: number;
  rollSpeed: number;
  rollDuration: number; // seconds
  rollCooldown: number;
  hurtIframes: number; // seconds of invulnerability after being hit
  levelHpBonus: number; // max HP per level above 1
}

export const EXORCISTS: Record<ExorcistId, ExorcistBaseData> = {
  director: {
    maxHp: 10,
    moveSpeed: 190,
    radius: 12,
    rollSpeed: 480,
    rollDuration: 0.22,
    rollCooldown: 0.55,
    hurtIframes: 0.8,
    levelHpBonus: 1,
  },
};
