import { describe, expect, it } from 'vitest';
import { migrate, SAVE_VERSION } from '../src/core/SaveManager';
import { SeededRNG } from '../src/core/SeededRNG';
import { CONTRACTS } from '../src/data/contracts.data';
import { MODIFIERS } from '../src/data/modifiers.data';
import { GENERAL_OBJECTIVES } from '../src/data/objectives.data';
import { NODES } from '../src/data/nodes.data';
import { OFFICE } from '../src/data/office.data';
import { GameStore } from '../src/store/gameStore';
import { advanceDay, bundleWith, offerDifficulty, offerFee, offerFloors, offerGoal, refillBoard, resolveNight, startingContamination, type ContractOffer, type OfficeState } from '../src/systems/office';
import type { NodeId, ObjectiveKind } from '../src/types/ids';
import { playNight, skilled } from './bots';

function fresh(): OfficeState {
  const s: OfficeState = { day: 1, money: 0, debt: 0, contamination: startingContamination(), known: [], board: [], nextOfferId: 1, storyDone: [], wanted: [], deskLevel: 0 };
  refillBoard(s, new SeededRNG(5));
  return s;
}

const general = (s: OfficeState, node: NodeId, risk = 1, objective: ObjectiveKind = 'clear', floors = 3): ContractOffer => ({
  id: s.nextOfferId++, kind: 'general', node, story: null, objective, request: 'flicker', mods: [], target: null, pool: [...NODES[node].pool],
  risk, floors, goalFloor: floors - 1, fee: 100, shards: 0, deadline: s.day + 3,
});
const named = (o: ContractOffer, objective: 'bounty' | 'chase', goalFloor = o.floors - 1): ContractOffer => ({
  ...o, objective, goalFloor, target: { ghost: 'cheonyeo', name: [0, 0], level: 0 }, shards: 1,
});

describe('office: contract board', () => {
  it('map links are two-way', () => {
    for (const [id, n] of Object.entries(NODES)) for (const l of n.links) expect(NODES[l].links, `${id}-${l}`).toContain(id);
  });

  it('a new board has the open main story contract and a full set of general offers, one objective each', () => {
    const s = fresh();
    expect(s.board.filter((o) => o.story === 'lights_out')).toHaveLength(1);
    expect(s.board.filter((o) => o.kind === 'general')).toHaveLength(OFFICE.boardSize);
    for (const o of s.board) expect(o.fee).toBeGreaterThan(0);
    for (const o of s.board.filter((x) => x.kind === 'general')) {
      expect(Object.keys(GENERAL_OBJECTIVES)).toContain(o.objective);
      expect(o.mods.length).toBeLessThanOrEqual(2);
      expect(new Set(o.mods).size).toBe(o.mods.length);
      const r = GENERAL_OBJECTIVES[o.objective!];
      expect(o.floors).toBeGreaterThanOrEqual(r.floors[0]);
      expect(o.floors).toBeLessThanOrEqual(r.floors[1]);
      expect(o.goalFloor).toBeLessThan(o.floors);
      expect(!!o.target).toBe(o.objective === 'bounty' || o.objective === 'chase');
    }
  });

  it('over many mornings every objective and every modifier shows up', () => {
    const seen = new Set<string>();
    const mods = new Set<string>();
    for (let seed = 1; seed < 120; seed++) {
      const s: OfficeState = { day: 1, money: 0, debt: 0, contamination: startingContamination(), known: [], board: [], nextOfferId: 1, storyDone: [], wanted: [], deskLevel: 0 };
      refillBoard(s, new SeededRNG(seed));
      for (const o of s.board) {
        if (o.objective) seen.add(o.objective);
        o.mods.forEach((m) => mods.add(m));
      }
    }
    expect([...seen].sort()).toEqual(Object.keys(GENERAL_OBJECTIVES).sort());
    expect([...mods].sort()).toEqual(Object.keys(MODIFIERS).sort());
  });

  it('the 경리 책상 adds an offer and a day to deadlines', () => {
    const s: OfficeState = { day: 1, money: 0, debt: 0, contamination: startingContamination(), known: [], board: [], nextOfferId: 1, storyDone: [], wanted: [], deskLevel: 3 };
    refillBoard(s, new SeededRNG(5));
    expect(s.board.filter((o) => o.kind === 'general')).toHaveLength(OFFICE.boardSize + 1);
    for (const o of s.board.filter((x) => x.kind === 'general')) expect(o.deadline! - s.day).toBeGreaterThanOrEqual(OFFICE.deadline.min + 1);
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
    expect(s.contamination.motel).toBe(4 - GENERAL_OBJECTIVES.clear.cleanse);
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

  it('named targets are never bundled, and get stronger (and pricier) when they get away', () => {
    const s = fresh();
    s.board = [];
    const b = named(general(s, 'motel', 2), 'bounty');
    b.fee = offerFee(b);
    const c = general(s, 'motel');
    s.board.push(b, c);
    expect(bundleWith(s.board, b)).toHaveLength(1);
    expect(bundleWith(s.board, c)).toHaveLength(1);
    const fee = b.fee;
    resolveNight(s, b.id, false);
    expect(b.target!.level).toBe(1);
    expect(b.fee).toBeGreaterThan(fee);
    expect(b.shards).toBe(GENERAL_OBJECTIVES.bounty.shards + 1);
  });

  it('an expired 현상수배 comes back on the next board, one level up, on the same node', () => {
    const s = fresh();
    s.board = [];
    const b = named(general(s, 'rooftop', 1), 'bounty');
    b.deadline = s.day;
    s.board.push(b);
    advanceDay(s, new SeededRNG(3));
    const back = s.board.find((o) => o.objective === 'bounty' && o.target?.name.join() === b.target!.name.join() && o.node === 'rooftop');
    expect(back?.target?.level).toBe(1);
    expect(s.wanted).toHaveLength(0);
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

  it('the objective sits on its goal floor only; floors past it are deep (more ghosts)', () => {
    const s = fresh();
    const b = named(general(s, 'arcade', 1, 'clear', 4), 'bounty', 1);
    const plans = offerFloors(b);
    plans.forEach((p, i) => {
      if (p.kind !== 'normal') throw new Error('normal floors only');
      expect(p.objective).toBe(i === 1 ? 'bounty' : 'clear');
      expect(p.goal).toBe(i === 1);
      expect(p.deep).toBe(Math.max(0, i - 1));
      if (i === 1) expect(p.brief?.target?.ghost).toBe('cheonyeo');
    });
    const p2 = plans[2]!;
    const p0 = plans[0]!;
    if (p2.kind === 'normal' && p0.kind === 'normal') expect(p2.enemies).toBe(p0.enemies + 2 + 1);
  });

  it('a chase puts the quarry on every floor and may end on any of them', () => {
    const s = fresh();
    const c = named(general(s, 'alley', 1, 'clear', 3), 'chase');
    const plans = offerFloors(c);
    for (const p of plans) if (p.kind === 'normal') expect(p.objective).toBe('chase');
    expect(plans.filter((p) => p.kind === 'normal' && p.goal)).toHaveLength(2);
  });

  it('modifiers change the floors and pay more: surge speeds the swarm, the fee rises', () => {
    const s = fresh();
    const plain = general(s, 'station', 2);
    const surge = { ...plain, mods: ['surge' as const] };
    const a = offerFloors(plain)[0]!;
    const b = offerFloors(surge)[0]!;
    if (a.kind === 'normal' && b.kind === 'normal') {
      expect(b.swarm!.every).toBeLessThan(a.swarm!.every);
      expect(b.swarm!.cap).toBeGreaterThan(a.swarm!.cap);
      expect(b.mods).toEqual(['surge']);
    }
    expect(offerFee(surge)).toBeGreaterThan(offerFee(plain));
  });

  it('general floors are themed from the node; 섬멸 everywhere on a clear contract', () => {
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
    store.applyRunResult({ offerId: offer.id, outcome: 'success', loot: 10, fee: offer.fee, shards: 0 });
    const st = store.getState();
    expect(st.day).toBe(2);
    expect(st.lastMorning?.day).toBe(2);
    expect(st.activeOfferId).toBeNull();
    expect(st.money).toBeGreaterThanOrEqual(10 + offer.fee);
  });

  it('migrates a v1 save: calendar from day 1, the main story contract remembered if anything was solved', () => {
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
  it('a rescue puts the missing person on the goal floor and ends the contract there', () => {
    const s = fresh();
    const rescue = { ...general(s, 'arcade', 2, 'rescue', 4), request: 'crying' as const, goalFloor: GENERAL_OBJECTIVES.rescue.goal as number };
    const goal = offerGoal(rescue);
    expect(goal).toEqual({ kind: 'rescue', floor: GENERAL_OBJECTIVES.rescue.goal });
    const plans = offerFloors(rescue);
    plans.forEach((p, i) => {
      if (p.kind !== 'normal') return;
      expect(p.objective).toBe(i === goal.floor ? 'rescue' : 'clear');
      expect(p.goal).toBe(i === goal.floor);
    });
  });

  it('clear contracts end on the last floor; the main story ends at the boss', () => {
    const s = fresh();
    expect(offerGoal(general(s, 'alley', 1))).toEqual({ kind: 'clear', floor: 2 });
    const story = s.board.find((o) => o.kind === 'main')!;
    expect(offerGoal(story)).toEqual({ kind: 'boss', floor: CONTRACTS.lights_out.floors.length - 1 });
  });

  it('difficulty follows what the night really holds: risk, length, objective, target level, modifiers', () => {
    const s = fresh();
    const easy = offerDifficulty(general(s, 'alley', 0));
    const hard = offerDifficulty(general(s, 'alley', 5, 'clear', 5));
    expect(easy).toBe(1);
    expect(hard).toBe(5);
    const base = general(s, 'alley', 2, 'clear', 3);
    const withMods = { ...base, mods: ['blackout' as const, 'lair' as const] };
    expect(offerDifficulty(withMods)).toBeGreaterThanOrEqual(offerDifficulty(base));
    const story = offerDifficulty(s.board.find((o) => o.kind === 'main')!);
    expect(story).toBeGreaterThanOrEqual(4);
    for (const o of s.board) {
      expect(offerDifficulty(o)).toBeGreaterThanOrEqual(1);
      expect(offerDifficulty(o)).toBeLessThanOrEqual(5);
    }
  });
});

describe('office: generated nights are playable', () => {
  const setup = (o: ContractOffer) => ({ offerId: o.id, floors: offerFloors(o), fee: o.fee, weapon: 'newspaper_sword' as const });
  const wins = (o: ContractOffer, seeds: number[]) => seeds.map((seed) => playNight(seed, skilled, setup(o)));

  it('a reading bot clears most low-risk clear contracts', () => {
    const runs = wins(general(fresh(), 'alley', 1), [1, 2, 3, 4]);
    expect(runs.filter((r) => r.outcome === 'success').length, JSON.stringify(runs)).toBeGreaterThanOrEqual(3);
  });

  it.each(['bounty', 'chase', 'ward', 'firsttrain'] as const)('a reading bot can finish a %s contract', (objective) => {
    const s = fresh();
    let o = general(s, 'alley', 1, objective, objective === 'firsttrain' ? 1 : objective === 'chase' ? 3 : 2);
    if (objective === 'bounty' || objective === 'chase') o = named(o, objective);
    const runs = wins(o, [1, 2, 3]);
    expect(runs.filter((r) => r.outcome === 'success').length, JSON.stringify(runs)).toBeGreaterThanOrEqual(2);
  });
});
