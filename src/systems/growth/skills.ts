import { ACTIVES, SKILL_SLOTS } from '../../data/skills.data';
import type { ActiveId, PassiveId, SkillSlotId } from '../../types/ids';
import type { GrowthState } from './types';

// Tier N of a branch opens only after tier N-1 of the same branch.
export function slotOpenable(g: GrowthState, slot: SkillSlotId): boolean {
  if (g.passives[slot]) return false;
  const tier = Number(slot.slice(-1));
  if (tier > 1 && !g.passives[`${slot.slice(0, -1)}${tier - 1}` as SkillSlotId]) return false;
  return g.shards >= SKILL_SLOTS[slot].cost;
}

export function openSlot(g: GrowthState, slot: SkillSlotId): boolean {
  if (!slotOpenable(g, slot)) return false;
  g.shards -= SKILL_SLOTS[slot].cost;
  g.passives = { ...g.passives, [slot]: 'a' };
  return true;
}

// Swapping sides is free (office only).
export function setSlotSide(g: GrowthState, slot: SkillSlotId, side: 'a' | 'b'): void {
  if (!g.passives[slot]) return;
  g.passives = { ...g.passives, [slot]: side };
}

export function activePassives(g: Pick<GrowthState, 'passives'>): PassiveId[] {
  return (Object.keys(g.passives) as SkillSlotId[]).map((slot) => SKILL_SLOTS[slot][g.passives[slot]!]);
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
