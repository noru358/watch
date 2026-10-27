// Public API of the growth module: training, skills, facilities, supplies, trauma (pure).
// docs/rules/growth.md has the numbers and where each lives.
import type { ActiveId, PerkId, UpgradeId } from '../../types/ids';
import type { EffectRow } from '../../registry/effects';
import type { GearMod } from '../gear';
import type { TrainingLevels } from '../run/stats';
import { activeDuos, activePassives, upgradeOf } from './skills';
import { wornMods, wornRows } from './gear';
import { traumaEffects } from './trauma';
import type { GrowthState } from './types';

export { trainingPrice, trainingRank, buyTraining, trainingCapped } from './training';
export { slotOpenable, openSlot, setSlotSide, activePassives, activeDuos, learnActive, equipActive, chooseUpgrade, upgradeOf } from './skills';
export { worn, wornMods, wornRows, toggleWear, enhanceGear, rerollGear, meltGear, stowDrops } from './gear';
export { facilityPrice, facilityRankNeeded, buildFacility, suppliesOffered, packSupply, deskEffects } from './facilities';
export { traumaEffects, restAmount, capitalTherapy, type TraumaEffects } from './trauma';
export { NO_FACILITIES, type GrowthState } from './types';

// What a night takes from the office: permanent training, skills, the packed supply, trauma.
export interface Loadout {
  training: TrainingLevels;
  perks: PerkId[]; // passive skills + duos + the supply (효과 부품 rows, registry/effects)
  active: ActiveId | null;
  upgrade: UpgradeId | null; // the active's 개조
  gear: GearMod[]; // 장신구 worn: their numbers
  gearRows: EffectRow[]; // 장신구 worn: legendary specials
  cardOffer: number;
  hpPenalty: number;
}

export function loadoutOf(g: GrowthState): Loadout {
  const t = traumaEffects(g.trauma);
  return {
    training: { ...g.training },
    perks: [...activePassives(g), ...activeDuos(g), ...(g.supply ? [g.supply] : [])],
    active: g.active,
    upgrade: upgradeOf(g),
    gear: wornMods(g),
    gearRows: wornRows(g),
    cardOffer: t.cardOffer,
    hpPenalty: t.hpPenalty,
  };
}

export const EMPTY_LOADOUT: Loadout = { training: {}, perks: [], active: null, upgrade: null, gear: [], gearRows: [], cardOffer: 3, hpPenalty: 0 };
