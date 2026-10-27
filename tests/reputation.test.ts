import { describe, expect, it } from 'vitest';
import { migrate, SAVE_VERSION } from '../src/core/SaveManager';
import { SeededRNG } from '../src/core/SeededRNG';
import { GENERAL_OBJECTIVES } from '../src/data/objectives.data';
import { MODIFIERS } from '../src/data/modifiers.data';
import { NODES } from '../src/data/nodes.data';
import { RANKS, REPUTATION } from '../src/data/reputation.data';
import { TRAINING } from '../src/data/training.data';
import { advanceDay, offerDifficulty, refillBoard, resolveNight, startingContamination, type ContractOffer, type OfficeState } from '../src/systems/office';
import { addReputation, rankFor, trainingCap } from '../src/systems/reputation';
import { buildFacility, buyTraining, NO_FACILITIES, trainingCapped, type GrowthState } from '../src/systems/growth';
import { GameStore } from '../src/store/gameStore';

// 평판 (docs/rules/reputation.md).
const office = (patch: Partial<OfficeState> = {}): OfficeState => ({
  day: 1, money: 0, debt: 0, contamination: startingContamination(), known: [], board: [], nextOfferId: 1, storyDone: [], wanted: [], chapters: {}, deskLevel: 0, reputation: 0, rankReached: 0, ...patch,
});
const general = (s: OfficeState, patch: Partial<ContractOffer> = {}): ContractOffer => {
  const o: ContractOffer = { id: s.nextOfferId++, kind: 'general', node: 'alley', story: null, objective: 'clear', request: 'flicker', mods: [], target: null, pool: ['cheonyeo'], risk: 1, floors: 3, goalFloor: 2, fee: 100, shards: 0, deadline: 4, ...patch };
  s.board.push(o);
  return o;
};

describe('평판: points and ranks', () => {
  it('ranks by thresholds; points never fall below the rank reached', () => {
    expect(rankFor(0)).toBe(0);
    expect(rankFor(RANKS[2]!.at)).toBe(2);
    const s = { reputation: 90, rankReached: 0 };
    expect(addReputation(s, 20)).toBe(1);
    expect(addReputation(s, -500)).toBeNull();
    expect(s.reputation).toBe(RANKS[1]!.at);
    expect(s.rankReached).toBe(1);
  });

  it('a finished job pays difficulty × 10 (+5 in a hot district); falling or failing costs', () => {
    const s = office();
    const o = general(s);
    const want = offerDifficulty(o) * REPUTATION.perDifficulty;
    expect(resolveNight(s, { offers: [o.id], completed: [o.id], reached: [o.id], outcome: 'success' }).reputation).toBe(want);
    s.contamination.alley = REPUTATION.hotAt;
    const hot = general(s);
    expect(resolveNight(s, { offers: [hot.id], completed: [hot.id], reached: [hot.id] }).reputation).toBe(want + REPUTATION.hotBonus);
    const lost = general(s);
    expect(resolveNight(s, { offers: [lost.id], completed: [], reached: [lost.id], outcome: 'died' }).reputation).toBe(-REPUTATION.died);
  });

  it('an offer left to expire costs a little', () => {
    const s = office({ reputation: 50 });
    general(s, { deadline: 1 });
    advanceDay(s, new SeededRNG(1));
    expect(s.reputation).toBe(50 - REPUTATION.expired);
  });
});

describe('평판: what a rank opens on the board', () => {
  it('rank 0 posts only rank-0 objectives, modifiers and districts', () => {
    for (let seed = 1; seed < 60; seed++) {
      const s = office();
      refillBoard(s, new SeededRNG(seed));
      for (const o of s.board.filter((x) => x.kind === 'general')) {
        expect(GENERAL_OBJECTIVES[o.objective!].rank).toBe(0);
        expect(NODES[o.node].rank).toBe(0);
        for (const m of o.mods) expect(MODIFIERS[m].rank).toBe(0);
      }
    }
  });

  it('a locked district does not get worse until it opens', () => {
    const s = office();
    const before = s.contamination.rooftop;
    for (let d = 0; d < 30; d++) advanceDay(s, new SeededRNG(d + 1));
    expect(s.contamination.rooftop).toBe(before);
  });
});

describe('평판: growth', () => {
  const g0 = (rank: number): GrowthState => ({ money: 1e6, trauma: 0, shards: 0, training: {}, trainingBought: 0, facilities: { ...NO_FACILITIES }, supply: null, passives: {}, actives: [], active: null, rank });
  it('training lines stop at the rank cap and open as the rank rises', () => {
    const g = g0(0);
    for (let i = 0; i < 10; i++) buyTraining(g, 'power_slash');
    expect(g.training.power_slash).toBe(trainingCap(0, 'power_slash'));
    expect(trainingCapped(g, 'power_slash')).toBe(true);
    g.rank = 3;
    for (let i = 0; i < 10; i++) buyTraining(g, 'power_slash');
    expect(g.training.power_slash).toBe(TRAINING.power_slash.max);
  });

  it('facility levels need their rank', () => {
    const g = g0(0);
    expect(buildFacility(g, 'desk')).toBeGreaterThan(0);
    expect(buildFacility(g, 'desk')).toBe(0);
    g.rank = 1;
    expect(buildFacility(g, 'desk')).toBeGreaterThan(0);
  });
});

describe('평판: store and save', () => {
  it('a rank reached at night is in the morning report', () => {
    const store = new GameStore({ seedBase: 2, reputation: RANKS[1]!.at - 1 });
    const o = store.getState().board.find((x) => x.kind === 'general')!;
    store.applyRunResult({ offerId: o.id, outcome: 'success', loot: 0, fee: o.fee, shards: 0, offers: [o.id], completed: [o.id], reached: [o.id] });
    expect(store.getState().rankReached).toBe(1);
    expect(store.getState().lastMorning?.rankUp).toBe(1);
  });

  it('a v5 save gets 평판 from the jobs it solved', () => {
    const v5 = {
      schemaVersion: 5, money: 0, trauma: 0, solved: 8, seedBase: 1, runCounter: 1, day: 9, debt: 0, contamination: null, known: [], board: [], nextOfferId: 1, storyDone: [], seen: [],
      shards: 0, training: {}, trainingBought: 0, facilities: { desk: 0, bench: 0, sofa: 0 }, supply: null, passives: {}, actives: [], active: null, wanted: [], chapters: {},
    };
    const v = migrate(v5)!;
    expect(v.schemaVersion).toBe(SAVE_VERSION);
    expect(v.reputation).toBe(160);
    expect(v.rankReached).toBe(1);
  });
});
