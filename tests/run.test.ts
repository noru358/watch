import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { CARDS } from '../src/data/cards.data';
import { CONTRACTS } from '../src/data/contracts.data';
import { EXORCISTS } from '../src/data/protagonist.data';
import { RUN_PENALTIES } from '../src/data/penalties.data';
import { WEAPONS } from '../src/data/weapons.data';
import { cardPool, computeExorcistStats, enterFloor, leaveFloor, offerCards, pickCard, runResult, settleRun, startRun } from '../src/systems/run';
import { GameStore } from '../src/store/gameStore';

const setup = { contractId: 'euljiro_printer', level: 1, weapon: 'newspaper_sword' } as const;

describe('computeExorcistStats', () => {
  it('derives stats from level, cards and weapon', () => {
    const s = computeExorcistStats('director', 3, ['tough', 'double_newspaper', 'lazy_but_serious'], 'newspaper_sword');
    expect(s.maxHp).toBe(EXORCISTS.director.maxHp + 2 * EXORCISTS.director.levelHpBonus + CARDS.tough.maxHp);
    expect(s.slash).toBe(WEAPONS.newspaper_sword.slash + CARDS.double_newspaper.slash);
    expect(s.focusMax).toBe(WEAPONS.newspaper_sword.focusMax + CARDS.lazy_but_serious.focusMax);
  });
});

describe('run flow', () => {
  it('plays the contract floors in order and ends in success after the last', () => {
    const rng = new SeededRNG(2);
    const run = startRun(setup);
    const kinds: string[] = [];
    for (let i = 0; i < CONTRACTS.euljiro_printer.floors.length; i++) {
      const f = enterFloor(run, rng);
      kinds.push(f.boss ? 'boss' : 'normal');
      f.status = f.boss ? 'bossDefeated' : 'stairs';
      const out = leaveFloor(run, f);
      if (out) break;
      pickCard(run, offerCards(run, rng)[0]!);
    }
    expect(kinds).toEqual(CONTRACTS.euljiro_printer.floors.map((p) => p.kind));
    expect(run.outcome).toBe('success');
    expect(runResult(run).fee).toBe(CONTRACTS.euljiro_printer.fee);
  });

  it('the payphone floor exists and extraction ends the run without a fee', () => {
    const rng = new SeededRNG(5);
    const run = startRun(setup);
    run.floorIndex = CONTRACTS.euljiro_printer.floors.findIndex((p) => p.kind === 'normal' && p.payphone);
    const f = enterFloor(run, rng);
    expect(f.payphone).not.toBeNull();
    f.loot = 30;
    f.status = 'extracted';
    expect(leaveFloor(run, f)).toBe('extracted');
    expect(runResult(run)).toMatchObject({ outcome: 'extracted', loot: 30, fee: 0 });
  });

  it('offers only base + equipped-weapon cards the director does not own', () => {
    const run = startRun(setup);
    pickCard(run, 'tough');
    const pool = cardPool(run);
    expect(pool).not.toContain('tough');
    for (const id of pool) expect(['base', 'newspaper_sword']).toContain(CARDS[id].source);
    expect(offerCards(run, new SeededRNG(1))).toHaveLength(3);
  });

  it('picking tough raises max HP and heals', () => {
    const run = startRun(setup);
    run.hp = 5;
    pickCard(run, 'tough');
    expect(run.hp).toBe(5 + CARDS.tough.maxHp + CARDS.tough.heal);
  });
});

describe('settlement', () => {
  it('success pays fee + loot, death keeps part of loot and adds trauma', () => {
    const fee = CONTRACTS.euljiro_printer.fee;
    expect(settleRun({ contractId: 'euljiro_printer', outcome: 'success', loot: 50, fee }, 0).moneyDelta).toBe(50 + fee);
    const died = settleRun({ contractId: 'euljiro_printer', outcome: 'died', loot: 50, fee: 0 }, 100);
    expect(died.lootKept).toBe(Math.floor(50 * RUN_PENALTIES.deathLootKeepRatio));
    expect(died.traumaDelta).toBe(RUN_PENALTIES.deathTrauma);
    expect(settleRun({ contractId: 'euljiro_printer', outcome: 'extracted', loot: 50, fee: 0 }, 0).moneyDelta).toBe(50);
  });

  it('store applies results and notifies subscribers', () => {
    const store = new GameStore();
    let calls = 0;
    store.subscribe(() => calls++);
    store.applyRunResult({ contractId: 'euljiro_printer', outcome: 'success', loot: 20, fee: 300 });
    expect(store.getState().money).toBe(320);
    expect(store.getState().solved).toBe(1);
    expect(calls).toBe(1);
    expect(store.takeRunSeed()).not.toBe(store.takeRunSeed());
  });
});
