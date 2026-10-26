import { FACILITIES, FACILITY_EFFECTS, SUPPLIES, SUPPLY_IDS } from '../../data/facilities.data';
import type { FacilityId, SupplyId } from '../../types/ids';
import type { GrowthState } from './types';

export function facilityPrice(g: Pick<GrowthState, 'facilities'>, id: FacilityId): number | null {
  return FACILITIES[id].costs[g.facilities[id]] ?? null;
}

export function buildFacility(g: GrowthState, id: FacilityId): number {
  const price = facilityPrice(g, id);
  if (price === null || g.money < price) return 0;
  g.money -= price;
  g.facilities = { ...g.facilities, [id]: g.facilities[id] + 1 };
  return price;
}

// Supplies the 부적 작업대 offers at its level.
export function suppliesOffered(g: Pick<GrowthState, 'facilities'>): SupplyId[] {
  return SUPPLY_IDS.filter((id) => SUPPLIES[id].benchLevel <= g.facilities.bench);
}

// Packs one supply for the next night (paid now). Picking another refunds the first; null unpacks.
export function packSupply(g: GrowthState, id: SupplyId | null): boolean {
  const refund = g.supply ? SUPPLIES[g.supply].cost : 0;
  if (id === null) {
    g.money += refund;
    g.supply = null;
    return true;
  }
  if (!suppliesOffered(g).includes(id) || g.money + refund < SUPPLIES[id].cost) return false;
  g.money += refund - SUPPLIES[id].cost;
  g.supply = id;
  return true;
}

export function deskEffects(g: Pick<GrowthState, 'facilities'>) {
  const d = FACILITY_EFFECTS.desk;
  const lv = g.facilities.desk;
  return { boardPlus: lv >= d.boardPlusAt ? 1 : 0, reveal: lv >= d.revealAt, deadlinePlus: lv >= d.deadlinePlusAt ? 1 : 0 };
}
