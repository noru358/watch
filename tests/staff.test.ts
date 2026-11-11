import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { STAFF } from '../src/data/staff.data';
import { OFFICE } from '../src/data/office.data';
import { migrate } from '../src/core/SaveManager';
import { offerDifficulty, refillBoard, type ContractOffer, type OfficeState } from '../src/systems/office';
import { hireCap, hirePool, payWages, staffOdds, trainPrice, workNight, type Staff } from '../src/systems/staff';
import { GameStore } from '../src/store/gameStore';

const office = (patch: Partial<OfficeState> = {}): OfficeState => ({ day: 1, money: 0, debt: 0, known: [], board: [], nextOfferId: 1, storyDone: [], wanted: [], chapters: {}, deskLevel: 0, reputation: 0, rankReached: 0, ...patch });
const offer = (id: number, patch: Partial<ContractOffer> = {}): ContractOffer => ({ id, kind: 'general', node: 'alley', story: null, objective: 'clear', length: 'short', request: null, mods: [], target: null, pool: ['dalgyal'], risk: 0, floors: 2, goalFloor: 1, fee: 150, shards: 0, deadline: 9, ...patch });
const staff = (id: number, patch: Partial<Staff> = {}): Staff => ({ id, origin: 'hire', name: [0, 0], grade: 1, power: 4, knack: null, trauma: 0, trained: 0, ...patch });

describe('직원: odds', () => {
  it('rise with 힘 and fall with 난이도, stay within the bounds, and a 특기 helps', () => {
    const easy = offer(1, { floors: 2 });
    const hard = offer(2, { floors: 4, risk: 3, mods: ['lair', 'blackout'] });
    expect(offerDifficulty(hard)).toBeGreaterThan(offerDifficulty(easy));
    expect(staffOdds(staff(1, { power: 12 }), easy)).toBeGreaterThan(staffOdds(staff(1), easy));
    expect(staffOdds(staff(1), hard)).toBeLessThan(staffOdds(staff(1), easy));
    expect(staffOdds(staff(1, { knack: 'clear' }), hard)).toBeGreaterThan(staffOdds(staff(1), hard));
    for (const p of [0, 4, 40]) for (const o of [easy, hard]) {
      expect(staffOdds(staff(1, { power: p }), o)).toBeGreaterThanOrEqual(STAFF.odds.min);
      expect(staffOdds(staff(1, { power: p }), o)).toBeLessThanOrEqual(STAFF.odds.max);
    }
  });

  it('main story and 원정 are the director\'s: no odds', () => {
    expect(staffOdds(staff(1, { power: 20 }), offer(1, { kind: 'main' }))).toBe(0);
    expect(staffOdds(staff(1, { power: 20 }), offer(1, { length: 'long' }))).toBe(0);
  });
});

describe('직원: a night', () => {
  it('a success pays the fee and finishes the offer; a failure leaves it and adds trauma; the rest rest', () => {
    const o = office({ board: [offer(1), offer(2), offer(3)] });
    const crew = [staff(1, { power: 40 }), staff(2, { power: 0 }), staff(3, { trauma: 2 })];
    const r = workNight(o, crew, { 1: 1, 2: 2 }, [], new SeededRNG(4), 0);
    expect(r.lines.find((l) => l.staffId === 1)!.success).toBe(true);
    expect(r.money).toBe(150 * r.lines.filter((l) => l.success).length);
    expect(o.board.some((x) => x.id === 1)).toBe(false);
    const fail = r.lines.find((l) => l.staffId === 2)!;
    if (!fail.success) {
      expect(o.board.some((x) => x.id === 2)).toBe(true);
      expect(crew[1]!.trauma).toBeGreaterThan(0);
    }
    expect(crew[2]!.trauma).toBe(2 - STAFF.rest);
    expect(o.reputation).toBeGreaterThan(0);
  });

  it('the same seed gives the same night (a reload replays it)', () => {
    const run = () => {
      const o = office({ board: [offer(1), offer(2)] });
      return workNight(o, [staff(1), staff(2)], { 1: 1, 2: 2 }, [], new SeededRNG(9), 0).lines.map((l) => l.success);
    };
    expect(run()).toEqual(run());
  });

  it('an offer the director took, a blocked staff member, or one offer twice: no work', () => {
    const o = office({ board: [offer(1), offer(2)] });
    const crew = [staff(1, { power: 40 }), staff(2, { power: 40, trauma: STAFF.trauma.block })];
    const r = workNight(o, crew, { 1: 1, 2: 2 }, [1], new SeededRNG(1), 0);
    expect(r.lines.every((l) => l.offerId === null)).toBe(true);
    expect(o.board).toHaveLength(2);
  });

  it('staff bring no spirit, 파편 or 장신구: only the fee and 평판', () => {
    const o = office({ board: [offer(1, { shards: 2 })] });
    const r = workNight(o, [staff(1, { power: 40 })], { 1: 1 }, [], new SeededRNG(2), 0);
    expect(r.money).toBe(150);
    expect(Object.keys(r)).not.toContain('shards');
  });
});

describe('직원: money', () => {
  it('wages go out in order to whoever the money still covers; the unpaid leave', () => {
    const crew = [staff(1, { grade: 1 }), staff(2, { grade: 2 }), staff(3, { grade: 1 })];
    const w = payWages(crew, 450);
    expect(w.paid).toBe(STAFF.grades[1].wage * 2);
    expect(w.kept.map((x) => x.id)).toEqual([1, 3]);
    expect(w.quit.map((x) => x.id)).toEqual([2]);
  });

  it('training gets dearer and stops at the cap', () => {
    expect(trainPrice(staff(1))).toBe(STAFF.train);
    expect(trainPrice(staff(1, { trained: 2 }))).toBe(STAFF.train * 3);
    expect(trainPrice(staff(1, { trained: STAFF.trainCap }))).toBeNull();
  });

  it('구인: grades up to rank + 1, the same week gives the same names, the cap grows with rank', () => {
    const a = hirePool(3, 0, new SeededRNG(5));
    expect(a.list).toHaveLength(STAFF.candidates);
    expect(a.list.every((c) => c.grade === 1)).toBe(true);
    expect(hirePool(3, 0, new SeededRNG(5))).toEqual(a);
    expect(hirePool(3, 3, new SeededRNG(5)).list.every((c) => c.grade <= 4)).toBe(true);
    expect(hireCap(2)).toBe(STAFF.capBase + 2);
  });
});

describe('직원 in the store', () => {
  it('hire, assign with R, the night settles them, the morning reports them, wages with the rent, and it all saves', () => {
    const store = new GameStore({ money: 5000, seedBase: 3 });
    expect(store.hireStaff(0)).toBe(true);
    const st = store.getState().staff[0]!;
    expect(store.getState().money).toBe(5000 - STAFF.grades[st.grade].wage);
    const target = store.getState().board.find((o) => o.kind === 'general' && o.length !== 'long')!;
    store.cycleAssign(target.id);
    expect(store.getState().assign[target.id]).toBe(st.id);
    store.restToday();
    const m = store.getState().lastMorning!;
    expect(m.staff?.some((l) => l.offerId === target.id)).toBe(true);
    expect(store.getState().assign).toEqual({});
    for (let d = store.getState().day; d % OFFICE.rentEvery !== OFFICE.rentEvery - 1; d++) store.restToday();
    store.restToday();
    expect(store.getState().lastMorning!.wages).toBe(STAFF.grades[st.grade].wage);
    const saved = migrate(JSON.parse(JSON.stringify(store.toSave())))!;
    expect(saved.staff).toHaveLength(1);
    expect(new GameStore(saved).getState().staff[0]!.id).toBe(st.id);
  });

  it('a v8 save gets no staff', () => {
    const now = new GameStore().toSave() as unknown as Record<string, unknown>;
    const { staff: _s, assign: _a, nextStaffId: _n, hirePool: _h, ...rest } = now;
    const v = migrate({ ...rest, schemaVersion: 8 })!;
    expect(v.staff).toEqual([]);
    expect(v.assign).toEqual({});
    expect(v.nextStaffId).toBe(1);
  });

  it('the board grows with the 평판 rank (more work than one director can do)', () => {
    const at = (rank: number) => {
      const o = office({ rankReached: rank });
      refillBoard(o, new SeededRNG(1));
      return o.board.filter((x) => x.kind === 'general').length;
    };
    expect(at(2)).toBe(Math.min(OFFICE.boardMax, OFFICE.boardSize + 2 * OFFICE.boardPerRank));
    expect(at(9)).toBe(OFFICE.boardMax);
  });
});
