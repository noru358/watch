import type { ActiveId, FacilityId, SkillSlotId, SupplyId, UpgradeId } from '../../types/ids';
import type { GearItem, GearSlot } from '../gear';
import type { TrainingLevels } from '../run/stats';

// The long-lived growth state this module reads and writes (a slice of GameState, saved since v4).
export interface GrowthState {
  money: number;
  trauma: number;
  shards: number; // 심연 파편
  training: TrainingLevels;
  trainingBought: number; // every training rank bought so far (prices inflate with it)
  facilities: Record<FacilityId, number>;
  supply: SupplyId | null; // packed for the next night (already paid)
  passives: Partial<Record<SkillSlotId, number>>; // opened skill slots and the side that is on (index)
  actives: ActiveId[]; // learned
  active: ActiveId | null; // on the L key
  upgrades: Partial<Record<ActiveId, UpgradeId>>; // 개조 chosen per active (save v7)
  gear: GearItem[]; // 장신구 in the bag (save v7)
  equipped: Partial<Record<GearSlot, number>>; // gear id worn in each slot
  nextGearId: number;
  rank: number; // 평판 rank reached (caps training, gates facility levels); read-only here
}

export const NO_FACILITIES: Record<FacilityId, number> = { desk: 0, bench: 0, sofa: 0 };
