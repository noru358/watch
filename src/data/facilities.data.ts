import type { EffectRow } from '../registry/effects';
import type { TKey } from '../i18n';
import type { FacilityId, SupplyId } from '../types/ids';

// 사무소 시설 (docs/rules/growth.md). Ordered from the ledger's 시설 page; used at their own spot.
// `costs[n]` = price of going from level n to n+1. Effects per level are read where they apply:
//   desk  — office/board.ts (board size, deadlines) and the board panel (ghost lists)
//   bench — which supplies the 부적 작업대 offers (level 0 = not built: no spot in the office)
//   sofa  — 휴식하기 recovery
export interface FacilityData {
  nameKey: TKey;
  costs: readonly number[];
  levelKeys: readonly TKey[]; // one line per level: what that level adds
  ranks: readonly number[]; // 평판 rank each level needs (same order as costs)
}

export const FACILITIES: Record<FacilityId, FacilityData> = {
  desk: { nameKey: 'facility.desk', costs: [600, 1200, 2000], ranks: [0, 1, 2], levelKeys: ['facility.desk.1', 'facility.desk.2', 'facility.desk.3'] },
  bench: { nameKey: 'facility.bench', costs: [500, 1000, 1800], ranks: [0, 1, 2], levelKeys: ['facility.bench.1', 'facility.bench.2', 'facility.bench.3'] },
  sofa: { nameKey: 'facility.sofa', costs: [800, 1500], ranks: [0, 1], levelKeys: ['facility.sofa.1', 'facility.sofa.2'] },
};

export const FACILITY_IDS: readonly FacilityId[] = ['desk', 'bench', 'sofa'];

// What the levels do (read by the systems that apply them).
export const FACILITY_EFFECTS = {
  desk: { boardPlusAt: 1, revealAt: 2, deadlinePlusAt: 3 },
  sofa: { restPerLevel: 1 },
} as const;

// 보급품: one per night, paid when picked, used up when the night starts (kept if the director rests instead).
export interface SupplyData {
  nameKey: TKey;
  descKey: TKey;
  cost: number;
  benchLevel: number; // 부적 작업대 level that offers it
  rows: readonly EffectRow[]; // what it does that night (효과 부품, like skills)
  hud?: 'mapFirst';
}

export const SUPPLIES: Record<SupplyId, SupplyData> = {
  // two salt charges on the first floor (each blocks one hit — combat.hurtPlayer)
  salt_pack: { nameKey: 'supply.salt_pack.name', descKey: 'supply.salt_pack.desc', cost: 60, benchLevel: 1, rows: [{ when: 'onRoomEnter', if: [{ firstFloor: true }], do: 'gain', with: { res: 'shield', amount: 2 } }] },
  // heal 6 once, the first time HP drops below half
  bacchus: { nameKey: 'supply.bacchus.name', descKey: 'supply.bacchus.desc', cost: 100, benchLevel: 2, rows: [{ when: 'onAfterHurt', if: [{ hpBelow: 0.5 }, { once: 'night' }], do: 'gain', with: { res: 'hp', amount: 6 } }] },
  // first floor: arrow to the stairs (HUD)
  map_copy: { nameKey: 'supply.map_copy.name', descKey: 'supply.map_copy.desc', cost: 120, benchLevel: 3, rows: [], hud: 'mapFirst' },
};

export const SUPPLY_IDS: readonly SupplyId[] = ['salt_pack', 'bacchus', 'map_copy'];
