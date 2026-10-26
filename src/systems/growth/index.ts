// Public API of the growth module: training, skills, facilities, supplies, trauma (pure).
// docs/rules/growth.md has the numbers and where each lives.
import type { ActiveId, PerkId } from '../../types/ids';
import type { TrainingLevels } from '../run/stats';
import { activePassives } from './skills';
import { traumaEffects } from './trauma';
import type { GrowthState } from './types';

export { trainingPrice, trainingRank, buyTraining } from './training';
export { slotOpenable, openSlot, setSlotSide, activePassives, learnActive, equipActive } from './skills';
export { facilityPrice, buildFacility, suppliesOffered, packSupply, deskEffects } from './facilities';
export { traumaEffects, restAmount, capitalTherapy, type TraumaEffects } from './trauma';
export { NO_FACILITIES, type GrowthState } from './types';

// What a night takes from the office: permanent training, skills, the packed supply, trauma.
export interface Loadout {
  training: TrainingLevels;
  perks: PerkId[]; // passive skills + the supply
  active: ActiveId | null;
  cardOffer: number;
  hpPenalty: number;
}

export function loadoutOf(g: GrowthState): Loadout {
  const t = traumaEffects(g.trauma);
  return {
    training: { ...g.training },
    perks: [...activePassives(g), ...(g.supply ? [g.supply] : [])],
    active: g.active,
    cardOffer: t.cardOffer,
    hpPenalty: t.hpPenalty,
  };
}

export const EMPTY_LOADOUT: Loadout = { training: {}, perks: [], active: null, cardOffer: 3, hpPenalty: 0 };
