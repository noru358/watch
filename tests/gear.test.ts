import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { GEAR_ECONOMY, GEAR_SLOTS, GEAR_SPECIALS, GRADES, SUB_OPTIONS } from '../src/data/draft/gear.data';
import { TRAINING_V2, NEW_STATS } from '../src/data/draft/training.v2.data';
import { TRAINING } from '../src/data/training.data';
import { dismantleValue, enhance, enhanceCost, fullEnhanceCost, itemMods, itemRows, mainMod, reroll, rerollCost, rollDrop, rollItem } from '../src/systems/gear';
import { PARTS } from '../src/registry/effects';

// 장신구 and 트레이닝 v2 (drafts, not wired).
describe('장신구 draft', () => {
  it('a piece has its slot’s main option and as many subs as its grade, no stat twice', () => {
    const rng = new SeededRNG(7);
    for (let i = 0; i < 300; i++) {
      const item = rollItem(rng, (['bracelet', 'necklace', 'keyring'] as const)[i % 3]!, (['common', 'rare', 'epic', 'legend'] as const)[i % 4]!, i);
      expect(item.subs).toHaveLength(GRADES[item.grade].subs);
      const stats = itemMods(item).map((m) => m.stat);
      expect(new Set(stats).size).toBe(stats.length);
      expect(GEAR_SLOTS[item.slot].mains.map((m) => m.stat)).toContain(mainMod(item).stat);
      expect(item.special !== null).toBe(GRADES[item.grade].special);
      for (const s of item.subs) {
        const o = SUB_OPTIONS.find((x) => x.stat === s.stat)!;
        expect(s.value).toBeGreaterThanOrEqual(o.min - 1e-9);
        expect(s.value).toBeLessThanOrEqual(o.max + 1e-9);
      }
    }
  });

  it('money raises the level (main grows), never fails, stops at the top', () => {
    const item = rollItem(new SeededRNG(1), 'bracelet', 'epic', 1);
    const wallet = { money: 1e6 };
    const v0 = mainMod(item).value;
    let paid = 0;
    while (enhanceCost(item) !== null) paid += enhance(item, wallet);
    expect(item.level).toBe(GEAR_ECONOMY.maxLevel);
    expect(paid).toBe(fullEnhanceCost('epic'));
    expect(mainMod(item).value).toBeGreaterThan(v0);
    expect(enhance(item, wallet)).toBe(0);
  });

  it('shards reroll one sub; the price climbs to 3; the main never changes', () => {
    const rng = new SeededRNG(3);
    const item = rollItem(rng, 'necklace', 'legend', 1);
    const main = mainMod(item).stat;
    const wallet = { shards: 10 };
    expect(rerollCost(item)).toBe(1);
    expect(reroll(item, 0, wallet, rng)).toBe(true);
    expect(reroll(item, 0, wallet, rng)).toBe(true);
    expect(rerollCost(item)).toBe(3);
    expect(wallet.shards).toBe(7);
    expect(mainMod(item).stat).toBe(main);
    expect(item.subs.map((s) => s.stat)).not.toContain(main);
    expect(reroll(item, 9, wallet, rng)).toBe(false);
  });

  it('drops: a boss always gives 귀함 or better; legendary specials are real 효과 부품 rows', () => {
    const rng = new SeededRNG(11);
    for (let i = 0; i < 50; i++) expect(['epic', 'legend']).toContain(rollDrop(rng, 'boss', 3, i)!.grade);
    for (const sp of Object.values(GEAR_SPECIALS)) for (const r of sp.rows) expect(PARTS[r.do]).toBeTypeOf('function');
    const legend = rollItem(rng, 'keyring', 'legend', 1);
    expect(itemRows(legend).length).toBeGreaterThan(0);
    expect(dismantleValue(legend)).toBeGreaterThan(dismantleValue(rollItem(rng, 'keyring', 'common', 2)));
  });
});

describe('트레이닝 v2 draft', () => {
  it('about twice the lines, finer steps; the top stays near today’s', () => {
    const lines = Object.values(TRAINING_V2);
    expect(lines.length).toBeGreaterThanOrEqual(Object.keys(TRAINING).length * 2);
    const total = (stat: string) => lines.filter((l) => l.stat === stat).reduce((s, l) => s + l.per * l.max, 0);
    expect(total('slash')).toBeCloseTo(0.2);
    expect(total('maxHp')).toBe(4);
    expect(total('moveSpeed')).toBeCloseTo(0.1);
    for (const l of lines) if (!(l.stat in NEW_STATS)) expect(['slash', 'drawSlash', 'reach', 'comboBonus', 'swingTime', 'drawCooldown', 'finisherRecovery', 'moveSpeed', 'dashCooldown', 'dashSpeed', 'dashIframes', 'maxHp', 'parryWindow', 'hurtIframes', 'focusMax', 'bareTime', 'magnet']).toContain(l.stat);
  });
});
