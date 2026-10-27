import { describe, expect, it } from 'vitest';
import { OFFICE } from '../src/data/office.data';
import { NODES } from '../src/data/nodes.data';
import { canJoin, offerFloors, planNight, resolveNight, startingContamination, type ContractOffer, type OfficeState } from '../src/systems/office';

import { feeSoFar, finishAtGoal, goalReached, leaveFloor, runResult, startRun, enterFloor } from '../src/systems/run';
import { GameStore } from '../src/store/gameStore';
import { SeededRNG } from '../src/core/SeededRNG';
import type { ModifierId, NodeId, ObjectiveKind } from '../src/types/ids';

// 합동 출동 (docs/rules/office.md): same-district general offers in one night, paid per objective.

let nextId = 1;
const offer = (node: NodeId, objective: ObjectiveKind, floors: number, goalFloor: number, mods: ModifierId[] = []): ContractOffer => ({
  id: nextId++, kind: 'general', node, story: null, objective, request: 'flicker', mods, target: objective === 'bounty' || objective === 'chase' ? { ghost: 'cheonyeo', name: [0, 0], level: 0 } : null,
  pool: [...NODES[node].pool], risk: 1, floors, goalFloor, fee: 100 + floors * 10, shards: 0, deadline: 5,
});
const office = (board: ContractOffer[]): OfficeState => ({ day: 1, money: 0, debt: 0, contamination: startingContamination(), known: [], board, nextOfferId: 100, storyDone: [], wanted: [], chapters: {}, deskLevel: 0, reputation: 0, rankReached: 0 });

describe('합동 출동: which offers can go together', () => {
  it('same district general offers yes; other district, 추격, main story, too many: no', () => {
    const a = offer('motel', 'rescue', 3, 2);
    const b = offer('motel', 'ward', 5, 4);
    expect(canJoin([a, b])).toBe(true);
    expect(canJoin([a, offer('station', 'ward', 3, 2)])).toBe(false);
    expect(canJoin([a, offer('motel', 'chase', 3, 2)])).toBe(false);
    expect(canJoin([a, { ...offer('motel', 'clear', 3, 2), kind: 'main' }])).toBe(false);
    expect(canJoin([a, b, offer('motel', 'clear', 3, 0), offer('motel', 'clear', 3, 1)])).toBe(false);
  });

  it('two objectives on the same floor: the later one moves down, at most one floor past the night', () => {
    expect(canJoin([offer('motel', 'rescue', 3, 2), offer('motel', 'ward', 3, 2)])).toBe(true);
    expect(canJoin([offer('motel', 'rescue', 3, 2), offer('motel', 'ward', 3, 2), offer('motel', 'clear', 3, 2)])).toBe(false);
  });
});

describe('합동 출동: the night', () => {
  it('as long as the longest offer; each objective on its own goal floor, the rest 섬멸', () => {
    const a = offer('motel', 'rescue', 3, 1, ['tough']);
    const b = offer('motel', 'ward', 5, 3, ['blackout']);
    const p = planNight([a, b]);
    expect(p.floors).toHaveLength(5);
    expect(p.goals).toEqual([{ offerId: b.id, floor: 3, fee: b.fee }, { offerId: a.id, floor: 1, fee: a.fee }]);
    const obj = p.floors.map((f) => (f.kind === 'normal' ? f.objective : 'boss'));
    expect(obj).toEqual(['clear', 'rescue', 'clear', 'ward', 'clear']);
    // The lead's modifiers everywhere, the other's only on its floor.
    const mods = p.floors.map((f) => (f.kind === 'normal' ? [...(f.mods ?? [])].sort() : []));
    expect(mods[0]).toEqual(['blackout']);
    expect(mods[1]).toEqual(['blackout', 'tough']);
    // Both goal floors before the last offer the way home.
    expect(p.floors.map((f) => f.kind === 'normal' && f.goal)).toEqual([false, true, false, true, false]);
  });

  it('a same-floor clash pushes the second objective down and may lengthen the night by one', () => {
    const a = offer('motel', 'rescue', 3, 2);
    const b = offer('motel', 'ward', 3, 2);
    const p = planNight([a, b]);
    expect(p.floors).toHaveLength(4);
    expect(p.goals.map((g) => g.floor)).toEqual([2, 3]);
  });

  it('one offer plans exactly as before', () => {
    const a = offer('motel', 'rescue', 4, 2);
    expect(planNight([a]).floors).toEqual(offerFloors(a));
  });
});

describe('합동 출동: pay per objective', () => {
  it('going home after the first objective pays it; the other stays on the board', () => {
    const a = offer('motel', 'clear', 2, 0);
    const b = offer('motel', 'clear', 4, 3);
    const p = planNight([a, b]);
    const run = startRun({ offerId: b.id, floors: p.floors, fee: a.fee + b.fee, weapon: 'newspaper_sword', goals: p.goals });
    const f = enterFloor(run, new SeededRNG(3));
    for (const e of f.enemies) e.hp = 0;
    f.objective!.done = true;
    f.status = 'stairs';
    expect(goalReached(run, f)).toBe(true);
    finishAtGoal(run, f);
    expect(feeSoFar(run)).toBe(a.fee);
    const r = runResult(run);
    expect(r.completed).toEqual([a.id]);
    expect(r.reached).toEqual([]); // finished, so not "reached and lost"
    const s = office([a, b]);
    const night = resolveNight(s, { offers: r.offers, completed: r.completed, reached: r.reached });
    expect(night.fee).toBe(a.fee);
    expect(s.board.map((o) => o.id)).toEqual([b.id]);
  });

  it('falling loses every fee of the night', () => {
    const a = offer('motel', 'clear', 2, 0);
    const b = offer('motel', 'clear', 4, 3);
    const p = planNight([a, b]);
    const run = startRun({ offerId: b.id, floors: p.floors, fee: 0, weapon: 'newspaper_sword', goals: p.goals });
    const f = enterFloor(run, new SeededRNG(3));
    f.objective!.done = true;
    f.status = 'stairs';
    leaveFloor(run, f);
    const g = enterFloor(run, new SeededRNG(4));
    g.status = 'dead';
    leaveFloor(run, g);
    const r = runResult(run);
    expect(r.fee).toBe(0);
    expect(r.completed).toEqual([]);
  });

  it('the store builds tonight from the set made on the board', () => {
    const store = new GameStore({ seedBase: 9 });
    const s = store.getState();
    s.board.push(offer('rooftop', 'clear', 3, 1), offer('rooftop', 'ward', 4, 3), offer('station', 'clear', 3, 2));
    const [a, b, c] = s.board.slice(-3);
    store.selectOffer(a!.id);
    expect(store.toggleJoin()).toBe(true);
    store.selectOffer(b!.id);
    expect(store.toggleJoin()).toBe(true);
    expect(store.tonightOffers().map((o) => o.id)).toEqual([a!.id, b!.id]);
    expect(store.nightPlan()!.goals).toHaveLength(2);
    store.selectOffer(c!.id);
    expect(store.getState().joined).toEqual([]);
  });

  it('what the board shows goes out: a sheet outside the set (main story, 추격, unmarked) goes alone', () => {
    const store = new GameStore({ seedBase: 9 });
    const s = store.getState();
    s.board.push(offer('alley', 'clear', 3, 1), offer('alley', 'ward', 4, 3));
    const [a, b] = s.board.slice(-2);
    store.selectOffer(a!.id);
    store.toggleJoin();
    store.selectOffer(b!.id);
    store.toggleJoin();
    const main = s.board.find((o) => o.kind === 'main' && o.node === 'alley')!;
    store.selectOffer(main.id);
    expect(store.getState().joined).toHaveLength(2);
    expect(store.tonightOffers().map((o) => o.id)).toEqual([main.id]);
    store.selectOffer(a!.id);
    expect(store.tonightOffers()).toHaveLength(2);
  });

  it('a target caught before the director falls does not come back stronger', () => {
    const a = offer('motel', 'bounty', 4, 0);
    const b = offer('motel', 'clear', 4, 3);
    const p = planNight([a, b]);
    const run = startRun({ offerId: a.id, floors: p.floors, fee: 0, weapon: 'newspaper_sword', goals: p.goals });
    const f = enterFloor(run, new SeededRNG(3));
    f.objective!.done = true;
    f.status = 'stairs';
    leaveFloor(run, f);
    const g = enterFloor(run, new SeededRNG(4));
    g.status = 'dead';
    leaveFloor(run, g);
    const r = runResult(run);
    const s = office([a, b]);
    resolveNight(s, { offers: r.offers, completed: r.completed, reached: r.reached, outcome: r.outcome });
    expect(a.target!.level).toBe(0);
    expect(s.board).toHaveLength(2);
    expect(OFFICE.joint.max).toBeGreaterThanOrEqual(2);
  });
});

describe('합동 출동: a bot can play one', () => {
  it('rescue on floor 2 + ward on floor 4 in one night', async () => {
    const { playNight, skilled } = await import('./bots');
    const a = offer('motel', 'rescue', 3, 1);
    const b = offer('motel', 'ward', 4, 3);
    const p = planNight([a, b]);
    const runs = [1, 2, 3, 4].map((seed) => playNight(seed, skilled, { offerId: b.id, floors: p.floors, fee: 0, weapon: 'newspaper_sword', goals: p.goals }));
    expect(runs.filter((r) => r.outcome === 'success').length).toBeGreaterThanOrEqual(2);
  }, 120000);
});

describe('의뢰판: what contamination adds, the sortie slip', () => {
  it('the heat part is the same offer at contamination 0 subtracted', async () => {
    const { offerHeat, offerFee, offerDifficulty } = await import('../src/systems/office');
    const calm = { ...offer('station', 'clear', 4, 3), risk: 0 };
    calm.fee = offerFee(calm);
    expect(offerHeat(calm)).toEqual({ risk: 0, dots: 0, fee: 0, ghosts: 0 });
    const hot = { ...calm, risk: 4 };
    hot.fee = offerFee(hot);
    const h = offerHeat(hot);
    expect(h.ghosts).toBe(4);
    expect(h.dots).toBe(offerDifficulty(hot) - offerDifficulty(calm));
    expect(h.dots).toBeGreaterThan(0);
    expect(h.fee).toBe(hot.fee - calm.fee);
  });

  it('the slip lists each objective on its floor with its fee, the rest as walked-through / deep', async () => {
    const { slipRows } = await import('../src/ui/features/board/SortieSlip');
    const a = offer('motel', 'rescue', 4, 1);
    const b = offer('motel', 'ward', 3, 2);
    const rows = slipRows([a, b]);
    const paid = rows.filter((r) => r.fee !== null);
    expect(paid.map((r) => [r.from, r.fee])).toEqual([[1, a.fee], [2, b.fee]]);
    expect(rows[0]!.from).toBe(0);
    expect(rows[rows.length - 1]!.to).toBe(planNight([a, b]).floors.length - 1);
  });
});
