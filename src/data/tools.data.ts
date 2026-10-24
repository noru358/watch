import type { ToolId } from '../types/ids';

export interface ToolData {
  attackDamage: number;
  attackCooldown: number; // seconds between throws while attack is held
  projectileSpeed: number;
  projectileRadius: number;
  projectileLife: number; // seconds
  autoAimRange: number; // attack aims at the nearest enemy within this range
  skillCooldown: number;
  // Talisman ward (tool skill): a zone that damages and slows enemies inside.
  wardRadius: number;
  wardDuration: number;
  wardTickInterval: number;
  wardTickDamage: number;
  wardSlow: number; // enemy speed multiplier inside the ward
}

export const TOOLS: Record<ToolId, ToolData> = {
  talisman: {
    attackDamage: 3,
    attackCooldown: 0.28,
    projectileSpeed: 520,
    projectileRadius: 6,
    projectileLife: 0.9,
    autoAimRange: 420,
    skillCooldown: 6,
    wardRadius: 90,
    wardDuration: 4,
    wardTickInterval: 0.5,
    wardTickDamage: 2,
    wardSlow: 0.4,
  },
};
