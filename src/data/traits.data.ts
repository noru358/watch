import type { TraitId } from '../types/ids';

export interface TraitData {
  // Flat stat modifiers applied by computeExorcistStats.
  moveSpeedMult: number;
  damageMult: number;
  maxHpBonus: number;
  // Numbers read by the trait's hook in registry/traitHooks.ts.
  chance: number;
  amount: number;
}

const BASE: TraitData = { moveSpeedMult: 1, damageMult: 1, maxHpBonus: 0, chance: 0, amount: 0 };

export const TRAITS: Record<TraitId, TraitData> = {
  ricochet: { ...BASE, chance: 0.25 }, // a hit may bounce to another enemy
  roll_empower: { ...BASE, amount: 2 }, // next attack after a roll deals x amount
  vampiric: { ...BASE, chance: 0.35, amount: 1 }, // heal on kill (chance)
  thick_skin: { ...BASE, maxHpBonus: 3 },
  swift: { ...BASE, moveSpeedMult: 1.15 },
  sharp_talisman: { ...BASE, damageMult: 1.3 },
  salt_ward: { ...BASE, amount: 1 }, // shield charges granted on room enter
};

export const TRAIT_OFFER_COUNT = 3;
