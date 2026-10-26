import { describe, expect, it } from 'vitest';
import { migrate, SAVE_VERSION } from '../src/core/SaveManager';
import { SeededRNG } from '../src/core/SeededRNG';
import { CONTRACTS } from '../src/data/contracts.data';
import { NODES } from '../src/data/nodes.data';
import { OFFICE } from '../src/data/office.data';
import { GameStore } from '../src/store/gameStore';
import { advanceDay, bundleWith, offerDifficulty, offerFloors, offerGoal, refillBoard, resolveNight, startingContamination, type ContractOffer, type OfficeState } from '../src/systems/office';
import type { NodeId } from '../src/types/ids';
import { playNight, skilled } from './bots';

function fresh(): OfficeState {
  const s: OfficeState = { day: 1, money: 0, debt: 0, contamination: startingContamination(), known: [], board: [], nextOfferId: 1, storyDone: [], wanted: [], deskLevel: 0 };
  refillBoard(s, new SeededRNG(5));
  return s;
}

const general = (s: OfficeState, node: NodeId, risk = 1): ContractOffer => ({
  id: s.nextOfferId++, kind: 'general', node, story: null, request: 'flicker', target: null, pool: [...NODES[node].pool],
  risk, floors: 3, fee: 100, deadline: s.day + 3,
});

describe('office: contract board', () => {
  it('map links are two-way', () => {
    for (const [id, n] of Object.entries(NODES)) for (const l of n.links) expect(NODES[l].links, `${id}-${l}`).toContain(id);
  });

  it('a new board has the open story contract and a full set of other offers', () => {
    const s = fresh();
    expect(s.board.filter((o) => o.story === 'lights_out')).toHaveLength(1);
    expect(s.board.filter((o) => o.kind !== 'story').length).toBeGreaterThanOrEqual(OFFICE.boardSize);
    for (const o of s.board) expect(o.fee).toBeGreaterThan(0);
  });

  it('the same seed posts the same board (reloads replay the morning)', () => {
    expect(fresh().board).toEqual(fresh().board);
  });

  it('success finishes the offer, bundles general offers on the same node, and calms the node', () => {
    const s = fresh();
    s.board = [];
    s.contamination.motel = 4;
    const a = general(s, 'motel');
    const b = general(s, 'motel');
    const c = general(s, 'station');
    s.board.push(a, b, c);
    expect(bundleWith(s.board, a).map((o) => o.id)).toEqual([a.id, b.id]);
    const night = resolveNight(s, a.id, true);
    expect(night.completed).toEqual([a.id, b.id]);
    expect(night.fee).toBe(a.fee + b.fee);
    expect(s.board.map((o) => o.id)).toEqual([c.id]);
    expect(s.contamination.motel).toBe(4 - OFFICE.contamination.cleanse.general);
    expect(s.known).toContain('motel');
  });

  it('failure keeps the offer but the place is now known', () => {
    const s = fresh();
    const o = s.board.find((x) => x.kind === 'general')!;
    const night = resolveNight(s, o.id, false);
    expect(night.fee).toBe(0);
    expect(s.board.some((x) => x.id === o.id)).toBe(true);
    expect(s.known).toContain(o.node);
  });

  it('finishing the story contract takes it off the board for good', () => {
    const s = fresh();
    const story = s.board.find((o) => o.story === 'lights_out')!;
    expect(resolveNight(s, story.id, true).fee).toBe(CONTRACTS.lights_out.fee);
    advanceDay(s, new SeededRNG(9));
    expect(s.board.some((o) => o.story === 'lights_out')).toBe(false);
    expect(s.storyDone).toEqual(['lights_out']);
  });
});

describe('office: the day loop', () => {
  it('rent is charged every 7th day; a shortfall becomes debt and is collected next time', () => {
    const s = fresh();
    s.day = OFFICE.rentEvery - 1;
    s.money = 100;
    const r = advanceDay(s, new SeededRNG(1));
    expect(r.rentDue).toBe(true);
    expect(r.rentPaid).toBe(100);
    expect(s.money).toBe(0);
    expect(s.debt).toBe(OFFICE.rent - 100);
    s.day = OFFICE.rentEvery * 2 - 1;
    s.money = 5000;
    advanceDay(s, new SeededRNG(2));
    expect(s.debt).toBe(0);
    expect(s.money).toBe(5000 - OFFICE.rent - (OFFICE.rent - 100));
  });

  it('no rent on other days', () => {
    const s = fresh();
    s.money = 300;
    expect(advanceDay(s, new SeededRNG(1)).rentDue).toBe(false);
    expect(s.money).toBe(300);
  });

  it('expired offers leave and make their node worse; contamination stays within 0..max', () => {
    const s = fresh();
    s.board = [];
    s.contamination = { ...startingContamination(), station: 0 };
    const o = general(s, 'station');
    o.deadline = s.day;
    s.board.push(o);
    const r = advanceDay(s, new SeededRNG(3));
    expect(r.expired).toBe(1);
    expect(s.board.some((x) => x.id === o.id)).toBe(false);
    expect(s.contamination.station).toBeGreaterThanOrEqual(OFFICE.contamination.expireRise);
    for (let i = 0; i < 60; i++) advanceDay(s, new SeededRNG(100 + i));
    for (const v of Object.values(s.contamination)) expect(v).toBeLessThanOrEqual(OFFICE.contamination.max);
  });

  it('a badly contaminated node can post a bounty that ends in an arena of the named ghost', () => {
    const s = fresh();
    s.board = [];
    for (const id of Object.keys(s.contamination) as NodeId[]) s.contamination[id] = OFFICE.contamination.max;
    refillBoard(s, new SeededRNG(11));
    const bounty = s.board.find((o) => o.kind === 'bounty')!;
    expect(bounty).toBeDefined();
    const floors = offerFloors(bounty);
    expect(floors).toHaveLength(bounty.floors);
    const last = floors[floors.length - 1]!;
    expect(last.kind).toBe('arena');
    if (last.kind === 'arena') expect(last.pool).toEqual([bounty.target]);
  });

  it('general floors are sealed, themed from the node, and riskier means longer and better paid', () => {
    const s = fresh();
    const lo = { ...general(s, 'arcade', 0), floors: 3 };
    const floors = offerFloors(lo);
    expect(floors).toHaveLength(3);
    for (const f of floors) {
      expect(f.kind).toBe('normal');
      if (f.kind === 'normal') expect(f.objective).toBe('clear');
      expect(NODES.arcade.themes).toContain(f.theme);
    }
  });
});

describe('office: store and save', () => {
  it('a night moves the calendar on and posts the morning report', () => {
    const store = new GameStore({ seedBase: 4 });
    const offer = store.getState().board.find((o) => o.kind === 'general')!;
    store.selectOffer(offer.id);
    expect(store.nightPlan()?.offerId).toBe(offer.id);
    store.applyRunResult({ offerId: offer.id, outcome: 'success', loot: 10, fee: offer.fee });
    const st = store.getState();
    expect(st.day).toBe(2);
    expect(st.lastMorning?.day).toBe(2);
    expect(st.activeOfferId).toBeNull();
    expect(st.money).toBeGreaterThanOrEqual(10 + offer.fee);
  });

  it('migrates a v1 save: calendar from day 1, the story contract remembered if anything was solved', () => {
    const v2 = migrate({ schemaVersion: 1, money: 50, trauma: 1, solved: 3, seedBase: 7, runCounter: 4 });
    expect(v2?.schemaVersion).toBe(SAVE_VERSION);
    expect(v2?.day).toBe(1);
    expect(v2?.storyDone).toEqual(['lights_out']);
    expect(v2?.contamination).toEqual(startingContamination());
    const store = new GameStore(v2 ?? {});
    expect(store.getState().board.length).toBeGreaterThan(0);
    expect(store.getState().board.some((o) => o.story === 'lights_out')).toBe(false);
  });

  it('migrates a v2 save to v3: the opening counts as seen once a night was played', () => {
    const base = { money: 1, trauma: 0, solved: 0, seedBase: 2, day: 3, debt: 0, contamination: startingContamination(), known: [], board: [], nextOfferId: 1, storyDone: [] };
    expect(migrate({ schemaVersion: 2, ...base, runCounter: 2 })?.seen).toEqual(['intro']);
    expect(migrate({ schemaVersion: 2, ...base, runCounter: 0 })?.seen).toEqual([]);
  });
});

describe('office: objectives on the board', () => {
  it('a rescue request puts the missing person on the goal floor and ends the contract there', () => {
    const s = fresh();
    const rescue = { ...general(s, 'arcade', 2), request: 'crying' as const, floors: 4 };
    const goal = offerGoal(rescue);
    expect(goal).toEqual({ kind: 'rescue', floor: OFFICE.rescue.goalFloor });
    const plans = offerFloors(rescue);
    plans.forEach((p, i) => {
      if (p.kind !== 'normal') return;
      expect(p.objective).toBe(i === goal.floor ? 'rescue' : 'clear');
      expect(p.goal).toBe(i === goal.floor);
    });
  });

  it('clear contracts end on the last floor; bounty and story goals are the arena and the boss', () => {
    const s = fresh();
    expect(offerGoal({ ...general(s, 'alley', 1), floors: 3 })).toEqual({ kind: 'clear', floor: 2 });
    const story = s.board.find((o) => o.kind === 'story')!;
    expect(offerGoal(story)).toEqual({ kind: 'boss', floor: CONTRACTS.lights_out.floors.length - 1 });
  });

  it('difficulty follows what the night really holds: more risk is harder, the story is hard', () => {
    const s = fresh();
    const easy = offerDifficulty({ ...general(s, 'alley', 0), floors: 3 });
    const hard = offerDifficulty({ ...general(s, 'alley', 5), floors: 5 });
    expect(easy).toBe(1);
    expect(hard).toBe(5);
    const story = offerDifficulty(s.board.find((o) => o.kind === 'story')!);
    expect(story).toBeGreaterThanOrEqual(4);
    for (const o of s.board) {
      expect(offerDifficulty(o)).toBeGreaterThanOrEqual(1);
      expect(offerDifficulty(o)).toBeLessThanOrEqual(5);
    }
  });
});

describe('office: generated nights are playable', () => {
  it('a reading bot clears most low-risk general contracts and a bounty', () => {
    const s = fresh();
    const offer = { ...general(s, 'alley', 1), floors: 3 };
    const setup = (o: ContractOffer) => ({ offerId: o.id, floors: offerFloors(o), fee: o.fee, weapon: 'newspaper_sword' as const });
    const runs = [1, 2, 3, 4].map((seed) => playNight(seed, skilled, setup(offer)));
    expect(runs.filter((r) => r.outcome === 'success').length, JSON.stringify(runs)).toBeGreaterThanOrEqual(3);
    const bounty: ContractOffer = { ...offer, id: 99, kind: 'bounty', target: 'cheonyeo', floors: 2, risk: 1 };
    const b = [1, 2, 3].map((seed) => playNight(seed, skilled, setup(bounty)));
    expect(b.filter((r) => r.outcome === 'success').length, JSON.stringify(b)).toBeGreaterThanOrEqual(2);
  });
});
