import { SeededRNG } from '../../core/SeededRNG';
import { GEAR_ECONOMY } from '../../data/gear.data';
import { dismantleValue, enhance, itemMods, itemRows, reroll, type GearItem, type GearMod, type GearSlot } from '../gear';
import type { EffectRow } from '../../registry/effects';
import type { GrowthState } from './types';

// 장신구 in the office (docs/rules/growth.md): the bag, the three worn slots, and what money and
// 심연 파편 do to a piece. The rolls and prices themselves are systems/gear.

export function worn(g: Pick<GrowthState, 'gear' | 'equipped'>): GearItem[] {
  return (Object.values(g.equipped) as number[]).map((id) => g.gear.find((x) => x.id === id)).filter((x): x is GearItem => !!x);
}

export function wornMods(g: Pick<GrowthState, 'gear' | 'equipped'>): GearMod[] {
  return worn(g).flatMap(itemMods);
}

export function wornRows(g: Pick<GrowthState, 'gear' | 'equipped'>): EffectRow[] {
  return worn(g).flatMap((x) => [...itemRows(x)]);
}

// Wear a piece (it replaces whatever was in its slot) or take it off.
export function toggleWear(g: GrowthState, id: number): boolean {
  const item = g.gear.find((x) => x.id === id);
  if (!item) return false;
  const slot: GearSlot = item.slot;
  g.equipped = { ...g.equipped, [slot]: g.equipped[slot] === id ? undefined : id };
  return true;
}

export function enhanceGear(g: GrowthState, id: number): number {
  const item = g.gear.find((x) => x.id === id);
  if (!item) return 0;
  const wallet = { money: g.money };
  const paid = enhance(item, wallet);
  g.money = wallet.money;
  g.gear = [...g.gear];
  return paid;
}

export function rerollGear(g: GrowthState, id: number, sub: number, seed: number): boolean {
  const item = g.gear.find((x) => x.id === id);
  if (!item) return false;
  const wallet = { shards: g.shards };
  const ok = reroll(item, sub, wallet, new SeededRNG(seed ^ (item.id * 7919) ^ (item.rerolls * 104729)));
  g.shards = wallet.shards;
  g.gear = [...g.gear];
  return ok;
}

export function meltGear(g: GrowthState, id: number): number {
  const item = g.gear.find((x) => x.id === id);
  if (!item) return 0;
  const value = dismantleValue(item);
  g.money += value;
  g.gear = g.gear.filter((x) => x.id !== id);
  g.equipped = Object.fromEntries(Object.entries(g.equipped).filter(([, v]) => v !== id));
  return value;
}

// New pieces from a night go into the bag; when it is full they are melted down for money.
export function stowDrops(g: GrowthState, items: readonly GearItem[]): { kept: GearItem[]; melted: number } {
  const kept: GearItem[] = [];
  let melted = 0;
  for (const it of items) {
    if (g.gear.length < GEAR_ECONOMY.bag) {
      g.gear = [...g.gear, it];
      kept.push(it);
    } else {
      const v = dismantleValue(it);
      g.money += v;
      melted += v;
    }
  }
  return { kept, melted };
}
