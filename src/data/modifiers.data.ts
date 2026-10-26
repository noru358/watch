import type { TKey } from '../i18n';
import type { ModifierId } from '../types/ids';

// 현장 변형 (docs/rules/floor.md): 0–2 per generated contract, on top of its one objective.
// Each changes the floors it is on and raises the fee (feeBonus is added up, then × fee).
// Adding one = a row here + its ModifierId + i18n; its effect is read where noted.
export interface ModifierData {
  nameKey: TKey;
  descKey: TKey;
  weight: number;
  feeBonus: number;
  difficulty: number; // added to the 난이도 score
  vision?: number; // blackout: tiles visible on the whole floor (RiftView)
  swarm?: { everyMult: number; capMult: number }; // surge: office/contracts.ts offerFloors
  lair?: { pack: number; treasure: number; treasureValue: number; shardChance: number }; // mapgen.ts
}

export const MODIFIERS: Record<ModifierId, ModifierData> = {
  // 정전: the whole floor is dark beyond a few tiles.
  blackout: { nameKey: 'mod.blackout.name', descKey: 'mod.blackout.desc', weight: 1, feeBonus: 0.25, difficulty: 3, vision: 4.5 },
  // 괴이 소굴: one side room is a nest; walk in and the doors seal until the pack is down, then a heap of spirit.
  lair: { nameKey: 'mod.lair.name', descKey: 'mod.lair.desc', weight: 1, feeBonus: 0.2, difficulty: 3, lair: { pack: 5, treasure: 6, treasureValue: 8, shardChance: 0.35 } },
  // 물결 폭증: wisps come much more often and in larger numbers.
  surge: { nameKey: 'mod.surge.name', descKey: 'mod.surge.desc', weight: 1, feeBonus: 0.25, difficulty: 3, swarm: { everyMult: 0.6, capMult: 1.5 } },
};

// How many modifiers a contract gets: chance of 0, 1, 2.
export const MODIFIER_COUNT = [0.45, 0.4, 0.15] as const;
