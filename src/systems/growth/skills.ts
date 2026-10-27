import { ACTIVES, DUOS, SKILL_SLOTS, UPGRADES } from '../../data/skills.data';
import type { ActiveId, DuoId, PassiveId, SkillSlotId, UpgradeId } from '../../types/ids';
import type { GrowthState } from './types';

// 기술 (docs/rules/growth.md): slots opened with 심연 파편, one side on per slot (free to swap),
// duos on by themselves, actives learned and one on L, one 개조 per active.

const tierOf = (slot: SkillSlotId) => Number(slot.slice(-1));
const branchOf = (slot: SkillSlotId) => slot.slice(0, -1);

// Tier N of a branch opens only after tier N-1 of the same branch.
export function slotOpenable(g: GrowthState, slot: SkillSlotId): boolean {
  if (g.passives[slot] !== undefined) return false;
  const tier = tierOf(slot);
  if (tier > 1 && g.passives[`${branchOf(slot)}${tier - 1}` as SkillSlotId] === undefined) return false;
  return g.shards >= SKILL_SLOTS[slot].cost;
}

export function openSlot(g: GrowthState, slot: SkillSlotId): boolean {
  if (!slotOpenable(g, slot)) return false;
  g.shards -= SKILL_SLOTS[slot].cost;
  g.passives = { ...g.passives, [slot]: 0 };
  return true;
}

// Swapping sides is free (office only).
export function setSlotSide(g: GrowthState, slot: SkillSlotId, side: number): void {
  if (g.passives[slot] === undefined || !SKILL_SLOTS[slot].sides[side]) return;
  g.passives = { ...g.passives, [slot]: side };
}

export function activePassives(g: Pick<GrowthState, 'passives'>): PassiveId[] {
  return (Object.keys(g.passives) as SkillSlotId[]).map((slot) => SKILL_SLOTS[slot].sides[g.passives[slot]!]!).filter(Boolean);
}

// Duos switch on while both of their passives are on.
export function activeDuos(g: Pick<GrowthState, 'passives'>): DuoId[] {
  const on = activePassives(g);
  return (Object.keys(DUOS) as DuoId[]).filter((id) => DUOS[id].requires.every((p) => on.includes(p)));
}

export function learnActive(g: GrowthState, id: ActiveId): boolean {
  if (g.actives.includes(id) || g.shards < ACTIVES[id].cost) return false;
  g.shards -= ACTIVES[id].cost;
  g.actives = [...g.actives, id];
  if (!g.active) g.active = id;
  return true;
}

export function equipActive(g: GrowthState, id: ActiveId): void {
  if (g.actives.includes(id)) g.active = id;
}

// One 개조 per learned active; choosing (or changing) costs its shards.
export function chooseUpgrade(g: GrowthState, id: UpgradeId): boolean {
  const u = UPGRADES[id];
  if (!g.actives.includes(u.of) || g.upgrades[u.of] === id || g.shards < u.cost) return false;
  g.shards -= u.cost;
  g.upgrades = { ...g.upgrades, [u.of]: id };
  return true;
}

export function upgradeOf(g: Pick<GrowthState, 'upgrades' | 'active'>): UpgradeId | null {
  return g.active ? (g.upgrades[g.active] ?? null) : null;
}
