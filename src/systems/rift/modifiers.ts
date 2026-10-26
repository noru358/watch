import { MODIFIERS } from '../../data/modifiers.data';
import type { ModifierId } from '../../types/ids';

// The 현장 변형 of a floor folded into one set of numbers (modifiers.data.ts). Multipliers multiply,
// additions add; 1 / 0 = no change.
export interface FloorMods {
  hpMult: number;
  damageAdd: number;
  speedMult: number;
  windupMult: number;
  regen: number; // fraction of max HP per second after a while unhit
  moveMult: number;
  drawMult: number;
  healMult: number;
  pickupMult: number;
  fodderDrop: number;
}

export const NO_MODS: FloorMods = { hpMult: 1, damageAdd: 0, speedMult: 1, windupMult: 1, regen: 0, moveMult: 1, drawMult: 1, healMult: 1, pickupMult: 1, fodderDrop: 0 };

export function foldMods(ids: readonly ModifierId[]): FloorMods {
  const m = { ...NO_MODS };
  for (const id of ids) {
    const d = MODIFIERS[id];
    m.hpMult *= d.enemy?.hpMult ?? 1;
    m.damageAdd += d.enemy?.damageAdd ?? 0;
    m.speedMult *= d.enemy?.speedMult ?? 1;
    m.windupMult *= d.enemy?.windupMult ?? 1;
    m.regen += d.enemy?.regen ?? 0;
    m.moveMult *= d.player?.moveMult ?? 1;
    m.drawMult *= d.player?.drawMult ?? 1;
    m.healMult *= d.player?.healMult ?? 1;
    m.pickupMult *= d.loot?.pickupMult ?? 1;
    m.fodderDrop += d.loot?.fodderDrop ?? 0;
  }
  return m;
}

// Seconds a ghost must go unhit before 사무치는 원한 starts healing it.
export const REGEN_DELAY = 3;
