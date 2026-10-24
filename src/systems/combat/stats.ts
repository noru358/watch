import { EXORCISTS } from '../../data/protagonist.data';
import { TOOLS } from '../../data/tools.data';
import { TRAITS } from '../../data/traits.data';
import type { ExorcistId, ToolId, TraitId } from '../../types/ids';

export interface ExorcistStats {
  maxHp: number;
  moveSpeed: number;
  attackDamage: number;
  radius: number;
}

// Final stats are always derived, never stored (Rule 7). Gear is the tool for now.
export function computeExorcistStats(
  exorcist: ExorcistId,
  level: number,
  traits: readonly TraitId[],
  tool: ToolId,
): ExorcistStats {
  const base = EXORCISTS[exorcist];
  let maxHp = base.maxHp + base.levelHpBonus * Math.max(0, level - 1);
  let moveSpeed = base.moveSpeed;
  let attackDamage = TOOLS[tool].attackDamage;
  for (const id of traits) {
    const tr = TRAITS[id];
    maxHp += tr.maxHpBonus;
    moveSpeed *= tr.moveSpeedMult;
    attackDamage *= tr.damageMult;
  }
  return { maxHp, moveSpeed, attackDamage, radius: base.radius };
}
