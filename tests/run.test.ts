import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { CONTRACTS } from '../src/data/contracts.data';
import { RUN_PENALTIES } from '../src/data/penalties.data';
import { PARTY } from '../src/data/companions.data';
import { buildRoomPlan } from '../src/systems/contract';
import { enterRoom, leaveRoom, offerTraits, pickTrait, runResult, settleRun, shouldOfferTraits, startRun } from '../src/systems/run';
import { GameStore } from '../src/store/gameStore';

const setup = { contractId: 'euljiro_printer', level: 1, tool: 'talisman', party: PARTY } as const;

describe('contract plan', () => {
  it('follows the contract layout and fills combat rooms with waves', () => {
    const plan = buildRoomPlan('euljiro_printer', new SeededRNG(3));
    expect(plan.map((r) => r.kind)).toEqual(CONTRACTS.euljiro_printer.layout);
    for (const r of plan) expect(r.waves.length > 0).toBe(r.kind === 'combat');
  });
});

describe('run flow', () => {
  it('offers new traits once per cleared combat room and applies picks', () => {
    const rng = new SeededRNG(5);
    const run = startRun(setup, rng);
    const world = enterRoom(run, rng);
    world.status = 'cleared';
    expect(shouldOfferTraits(run, world)).toBe(true);
    const offer = offerTraits(run, rng);
    expect(offer).toHaveLength(3);
    expect(shouldOfferTraits(run, world)).toBe(false);
    pickTrait(run, world, 'thick_skin');
    expect(world.stats.maxHp).toBe(run.hp + 3);
    expect(world.player.hp).toBe(world.stats.maxHp);
  });

  it('banks loot and advances rooms, then ends on death', () => {
    const rng = new SeededRNG(5);
    const run = startRun(setup, rng);
    const w1 = enterRoom(run, rng);
    w1.loot = 10;
    w1.status = 'exited';
    expect(leaveRoom(run, w1)).toBeNull();
    expect(run.roomIndex).toBe(1);
    const w2 = enterRoom(run, rng);
    w2.loot = 6;
    w2.status = 'dead';
    expect(leaveRoom(run, w2)).toBe('died');
    expect(runResult(run)).toEqual({ contractId: 'euljiro_printer', outcome: 'died', loot: 16, fee: 0 });
  });
});

describe('settlement', () => {
  it('success pays fee + loot, death keeps part of loot and adds trauma', () => {
    const fee = CONTRACTS.euljiro_printer.fee;
    expect(settleRun({ contractId: 'euljiro_printer', outcome: 'success', loot: 50, fee }, 0).moneyDelta).toBe(50 + fee);
    const died = settleRun({ contractId: 'euljiro_printer', outcome: 'died', loot: 50, fee: 0 }, 100);
    expect(died.lootKept).toBe(Math.floor(50 * RUN_PENALTIES.deathLootKeepRatio));
    expect(died.traumaDelta).toBe(RUN_PENALTIES.deathTrauma);
    const ext = settleRun({ contractId: 'euljiro_printer', outcome: 'extracted', loot: 50, fee: 0 }, 0);
    expect(ext.moneyDelta).toBe(50);
  });

  it('store applies results and notifies subscribers', () => {
    const store = new GameStore();
    let calls = 0;
    store.subscribe(() => calls++);
    store.applyRunResult({ contractId: 'euljiro_printer', outcome: 'success', loot: 20, fee: 300 });
    expect(store.getState().money).toBe(320);
    expect(store.getState().solved).toBe(1);
    expect(calls).toBe(1);
    const s1 = store.takeRunSeed();
    const s2 = store.takeRunSeed();
    expect(s1).not.toBe(s2);
  });
});
