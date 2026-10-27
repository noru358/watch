import type { SeededRNG } from '../../core/SeededRNG';
import { DROPS, GEAR_ECONOMY, GEAR_SLOT_IDS, GEAR_SLOTS, GEAR_SPECIALS, GRADE_IDS, GRADE_WEIGHTS, GRADES, SUB_OPTIONS, type DropSource, type GearSlot, type GearStat, type Grade } from '../../data/gear.data';
import type { EffectRow } from '../../registry/effects';

// 장신구 (DRAFT, not wired): rolling a drop, raising the level with money, rerolling a sub with
// 심연 파편, melting it down. Pure; the numbers are all in data/draft/gear.data.ts.

export interface GearMod {
  stat: GearStat;
  op: 'add' | 'mult';
  value: number;
}
export interface GearItem {
  id: number;
  slot: GearSlot;
  grade: Grade;
  main: number; // index into GEAR_SLOTS[slot].mains
  level: number;
  subs: GearMod[];
  special: string | null;
  rerolls: number;
}

const round10 = (v: number) => Math.round(v / 10) * 10;
const snap = (v: number, step: number) => Math.round(v / step) * step;

function weighted<T>(items: readonly T[], w: (t: T) => number, rng: SeededRNG): T {
  const total = items.reduce((s, t) => s + w(t), 0);
  let r = rng.range(0, total);
  for (const t of items) {
    r -= w(t);
    if (r < 0) return t;
  }
  return items[items.length - 1]!;
}

function rollSub(rng: SeededRNG, taken: readonly GearStat[]): GearMod {
  const o = weighted(SUB_OPTIONS.filter((x) => !taken.includes(x.stat)), (x) => x.weight, rng);
  const steps = Math.round((o.max - o.min) / o.step);
  return { stat: o.stat, op: o.op, value: snap(o.min + o.step * rng.int(0, steps), o.step) };
}

export function rollGrade(rng: SeededRNG, source: DropSource, difficulty: number): Grade {
  const d = DROPS[source];
  const w = GRADE_WEIGHTS[Math.max(0, Math.min(GRADE_WEIGHTS.length - 1, difficulty - 1))]!;
  const idx = GRADE_IDS.indexOf(weighted(GRADE_IDS, (g) => w[GRADE_IDS.indexOf(g)]!, rng));
  const shifted = Math.min(GRADE_IDS.length - 1, idx + (rng.chance(0.5) ? d.shift : 0));
  const min = d.minGrade ? GRADE_IDS.indexOf(d.minGrade) : 0;
  return GRADE_IDS[Math.max(min, shifted)]!;
}

// A drop from `source` on a night of `difficulty`, or null if nothing fell.
export function rollDrop(rng: SeededRNG, source: DropSource, difficulty: number, id: number): GearItem | null {
  if (!rng.chance(DROPS[source].chance)) return null;
  return rollItem(rng, rng.pick(GEAR_SLOT_IDS), rollGrade(rng, source, difficulty), id);
}

export function rollItem(rng: SeededRNG, slot: GearSlot, grade: Grade, id: number): GearItem {
  const mains = GEAR_SLOTS[slot].mains;
  const main = mains.indexOf(weighted(mains, (m) => m.weight, rng));
  const subs: GearMod[] = [];
  for (let i = 0; i < GRADES[grade].subs; i++) subs.push(rollSub(rng, [mains[main]!.stat, ...subs.map((s) => s.stat)]));
  const special = GRADES[grade].special ? rng.pick(Object.keys(GEAR_SPECIALS)) : null;
  return { id, slot, grade, main, level: 0, subs, special, rerolls: 0 };
}

export function mainMod(item: GearItem): GearMod {
  const m = GEAR_SLOTS[item.slot].mains[item.main]!;
  return { stat: m.stat, op: m.op, value: m.base + m.perLevel * item.level };
}

// Everything the piece adds (main + subs); `mult` values are fractions (+0.04 = ×1.04).
export function itemMods(item: GearItem): GearMod[] {
  return [mainMod(item), ...item.subs];
}

export function itemRows(item: GearItem): readonly EffectRow[] {
  return item.special ? GEAR_SPECIALS[item.special]!.rows : [];
}

export function enhanceCost(item: GearItem): number | null {
  if (item.level >= GEAR_ECONOMY.maxLevel) return null;
  return round10(GEAR_ECONOMY.enhanceBase * Math.pow(item.level + 1, GEAR_ECONOMY.enhancePow) * GRADES[item.grade].costMult);
}

// Level +1 if the money is there. Returns the price paid (0 = nothing done).
export function enhance(item: GearItem, wallet: { money: number }): number {
  const cost = enhanceCost(item);
  if (cost === null || wallet.money < cost) return 0;
  wallet.money -= cost;
  item.level += 1;
  return cost;
}

export function rerollCost(item: GearItem): number {
  return Math.min(GEAR_ECONOMY.rerollMax, 1 + item.rerolls);
}

// Rerolls sub option `index` (never into the main stat or another sub's stat).
export function reroll(item: GearItem, index: number, wallet: { shards: number }, rng: SeededRNG): boolean {
  const cost = rerollCost(item);
  if (!item.subs[index] || wallet.shards < cost) return false;
  wallet.shards -= cost;
  const taken = [mainMod(item).stat, ...item.subs.filter((_, i) => i !== index).map((s) => s.stat)];
  item.subs[index] = rollSub(rng, taken);
  item.rerolls += 1;
  return true;
}

export function dismantleValue(item: GearItem): number {
  return round10(GEAR_ECONOMY.dismantleBase * GRADES[item.grade].costMult * (1 + 0.5 * item.level));
}

// Money to take a piece from 0 to the top.
export function fullEnhanceCost(grade: Grade): number {
  let total = 0;
  for (let l = 0; l < GEAR_ECONOMY.maxLevel; l++) total += round10(GEAR_ECONOMY.enhanceBase * Math.pow(l + 1, GEAR_ECONOMY.enhancePow) * GRADES[grade].costMult);
  return total;
}

export type { GearSlot, Grade, DropSource } from '../../data/gear.data';
