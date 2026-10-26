import type { ActiveId, FacilityId, SkillSlotId, SupplyId } from '../../types/ids';
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
  passives: Partial<Record<SkillSlotId, 'a' | 'b'>>; // opened skill slots and the side that is on
  actives: ActiveId[]; // learned
  active: ActiveId | null; // on the L key
}

export const NO_FACILITIES: Record<FacilityId, number> = { desk: 0, bench: 0, sofa: 0 };
