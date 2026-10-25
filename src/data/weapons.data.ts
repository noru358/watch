import type { WeaponId } from '../types/ids';

export interface WeaponData {
  slash: number; // damage of a normal hit (still wrapped in newspaper)
  draw: number; // 발도 damage
  focusMax: number; // 진심 게이지 size; +1 per landed hit, full = free draw strike
  bareTurns: number; // turns the blade stays unwrapped after a draw
  bareSlashBonus: number; // extra slash damage while the blade is bare
  comboEvery: number; // every N-th consecutive landed hit is a heavy hit
  comboBonus: number; // extra damage of that heavy hit
}

export const WEAPONS: Record<WeaponId, WeaponData> = {
  // A. 신문지에 둘둘 만 사인검
  newspaper_sword: { slash: 3, draw: 9, focusMax: 5, bareTurns: 3, bareSlashBonus: 2, comboEvery: 3, comboBonus: 2 },
};
