import type { CompanionId } from '../types/ids';

export interface CompanionData {
  cooldown: number;
  // Skill numbers; each skill reads only the fields it needs.
  heal: number;
  damage: number;
  radius: number;
  stun: number; // seconds
  projectileCount: number;
  projectileSpeed: number;
  projectileRadius: number;
  projectileLife: number;
  spread: number; // radians between fan shots
}

const ZERO = { heal: 0, damage: 0, radius: 0, stun: 0, projectileCount: 0, projectileSpeed: 0, projectileRadius: 0, projectileLife: 0, spread: 0 };

export const COMPANIONS: Record<CompanionId, CompanionData> = {
  // 무당 할머니: heals the director.
  grandma_shaman: { ...ZERO, cooldown: 14, heal: 3 },
  // 전직 형사: fires a fan of piercing shots that stun.
  ex_detective: { ...ZERO, cooldown: 9, damage: 5, stun: 1.2, projectileCount: 5, projectileSpeed: 620, projectileRadius: 5, projectileLife: 1, spread: 0.18 },
  // 유튜버 대학생: camera flash that damages every enemy around the director.
  streamer: { ...ZERO, cooldown: 11, damage: 6, radius: 200, stun: 0.6 },
};

export const PARTY: readonly CompanionId[] = ['grandma_shaman', 'ex_detective', 'streamer'];
