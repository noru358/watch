import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { OFFICE } from '../src/data/office.data';
import { freshLoan, loanAct, reclaimPrice, resolveEnvelope, settleLoan, type Seizable } from '../src/systems/office';
import { migrate } from '../src/core/SaveManager';
import { GameStore } from '../src/store/gameStore';

const L = OFFICE.loan;
const things: Seizable[] = [
  { kind: 'facility', id: 'sofa', value: 800 },
  { kind: 'gear', id: 3, value: 400 },
  { kind: 'staff', id: 1, value: 200 },
];

describe('인수 빚: 정산', () => {
  it('meeting the minimum never seizes and never hands an envelope', () => {
    const loan = freshLoan();
    for (let w = 0; w < 10; w += 1) {
      const week = settleLoan(loan, L.minPayment, 0, things, new SeededRNG(w));
      expect(week.short).toBe(false);
      expect(week.seized).toBeNull();
      expect(week.envelope).toBe(false);
    }
    expect(loan.left).toBe(L.total - 10 * L.minPayment);
  });

  it('extra goes on top but never past the cash or the debt', () => {
    const loan = freshLoan();
    const week = settleLoan(loan, 1000, 5000, things, new SeededRNG(1));
    expect(week.paid).toBe(1000);
    expect(week.cashLeft).toBe(0);
    const almost = { ...freshLoan(), left: 350 };
    expect(settleLoan(almost, 9999, 9999, things, new SeededRNG(1)).paid).toBe(350);
    expect(almost.left).toBe(0);
  });

  it('first short week: envelope, no seizure; short again: seizure, never two envelopes running', () => {
    const loan = freshLoan();
    const w1 = settleLoan(loan, 100, 0, things, new SeededRNG(2));
    expect(w1.short).toBe(true);
    expect(w1.envelope).toBe(true);
    expect(w1.seized).toBeNull();
    expect(w1.paid).toBe(100);
    const w2 = settleLoan(loan, 0, 0, things, new SeededRNG(2));
    expect(w2.envelope).toBe(false);
    expect(w2.seized).not.toBeNull();
    expect(loan.envelope).toBe('none');
  });

  it('a paid week clears an unanswered envelope and the miss count', () => {
    const loan = freshLoan();
    settleLoan(loan, 0, 0, things, new SeededRNG(3));
    settleLoan(loan, L.minPayment, 0, things, new SeededRNG(3));
    expect(loan.envelope).toBe('none');
    expect(loan.missed).toBe(0);
    expect(settleLoan(loan, 0, 0, things, new SeededRNG(3)).envelope).toBe(true);
  });

  it('seizure only takes what exists; with nothing to take nothing happens', () => {
    const loan = { ...freshLoan(), envelope: 'offered' as const, missed: 1 };
    const week = settleLoan(loan, 0, 0, [], new SeededRNG(4));
    expect(week.seized).toBeNull();
    for (let s = 0; s < 30; s += 1) {
      const l = { ...freshLoan(), envelope: 'offered' as const, missed: 1 };
      const got = settleLoan(l, 0, 0, things, new SeededRNG(s)).seized;
      expect(things).toContain(got);
    }
  });

  it('same seed, same morning', () => {
    const a = settleLoan({ ...freshLoan(), envelope: 'offered', missed: 1 }, 0, 0, things, new SeededRNG(77));
    const b = settleLoan({ ...freshLoan(), envelope: 'offered', missed: 1 }, 0, 0, things, new SeededRNG(77));
    expect(a).toEqual(b);
  });
});

describe('인수 빚: 봉투 의뢰', () => {
  it('accepted then cleared takes the credit off the debt', () => {
    const loan = freshLoan();
    settleLoan(loan, 0, 0, things, new SeededRNG(5));
    resolveEnvelope(loan, 'accepted', things, new SeededRNG(5));
    expect(loan.envelope).toBe('taken');
    const r = resolveEnvelope(loan, 'cleared', things, new SeededRNG(5));
    expect(r.credit).toBe(L.envelopeCredit);
    expect(r.seized).toBeNull();
    expect(loan.left).toBe(L.total - L.envelopeCredit);
    expect(loan.envelope).toBe('none');
  });

  it('declined or failed brings the 집행관', () => {
    for (const outcome of ['declined', 'failed'] as const) {
      const loan = freshLoan();
      settleLoan(loan, 0, 0, things, new SeededRNG(6));
      if (outcome === 'failed') resolveEnvelope(loan, 'accepted', things, new SeededRNG(6));
      const r = resolveEnvelope(loan, outcome, things, new SeededRNG(6));
      expect(r.credit).toBe(0);
      expect(r.seized).not.toBeNull();
      expect(loan.envelope).toBe('none');
    }
  });

  it('no envelope out: answering does nothing', () => {
    const loan = freshLoan();
    expect(resolveEnvelope(loan, 'failed', things, new SeededRNG(7))).toEqual({ credit: 0, seized: null });
    expect(loan.left).toBe(L.total);
  });
});

describe('인수 빚: 막과 되찾기', () => {
  it('acts step every quarter paid and reach the end only when paid off', () => {
    expect(loanAct(L.total)).toBe(0);
    expect(loanAct(L.total * 0.76)).toBe(0);
    expect(loanAct(L.total * 0.75)).toBe(1);
    expect(loanAct(L.total * 0.5)).toBe(2);
    expect(loanAct(1)).toBe(L.acts - 1);
    expect(loanAct(0)).toBe(L.acts);
  });

  it('a settle reports the act change', () => {
    const loan = { ...freshLoan(), left: L.total * 0.75 + 100 };
    const week = settleLoan(loan, 500, 500, things, new SeededRNG(8));
    expect(week.actBefore).toBe(0);
    expect(week.actAfter).toBe(1);
  });

  it('buying back costs the rate × value', () => {
    expect(reclaimPrice(things[0]!)).toBe(Math.round(800 * L.reclaimRate));
  });
});

describe('인수 빚 in the store', () => {
  const toRentMorning = (store: GameStore) => {
    for (let d = store.getState().day; (d + 1) % OFFICE.rentEvery !== 0; d++) store.restToday();
    store.restToday();
  };

  it('rent morning with enough money: the minimum goes, the morning says so', () => {
    const store = new GameStore({ money: 5000, seedBase: 2 });
    toRentMorning(store);
    const m = store.getState().lastMorning!;
    expect(m.loan?.short).toBe(false);
    expect(store.getState().loan.left).toBe(L.total - L.minPayment);
    expect(store.getState().money).toBe(5000 - OFFICE.rent - L.minPayment);
  });

  it('broke twice: an envelope, then a red sticker on a facility, bought back for the reclaim price', () => {
    const store = new GameStore({ money: 0, seedBase: 2, facilities: { desk: 0, bench: 0, sofa: 1 } });
    toRentMorning(store);
    expect(store.getState().lastMorning!.loan?.envelope).toBe(true);
    expect(store.getState().loan.envelope).toBe('offered');
    toRentMorning(store);
    const m = store.getState().lastMorning!;
    expect(m.loan?.seized?.kind).toBe('facility');
    expect(store.getState().facilities.sofa).toBe(0);
    expect(store.getState().seized).toHaveLength(1);
    const price = reclaimPrice(store.getState().seized[0]!);
    expect(store.reclaim(0)).toBe(false);
    const rich = new GameStore({ ...store.getState(), money: price });
    expect(rich.reclaim(0)).toBe(true);
    expect(rich.getState().facilities.sofa).toBe(1);
    expect(rich.getState().money).toBe(0);
    expect(rich.getState().seized).toHaveLength(0);
  });

  it('더 갚기 takes one step, never past the wallet', () => {
    const store = new GameStore({ money: 100 });
    expect(store.payLoan()).toBe(true);
    expect(store.getState().money).toBe(0);
    expect(store.getState().loan.left).toBe(L.total - 100);
    expect(store.payLoan()).toBe(false);
  });

  it('saves and loads; a v10 save starts owing the whole debt', () => {
    const store = new GameStore({ money: 0, seedBase: 2, facilities: { desk: 0, bench: 0, sofa: 1 } });
    toRentMorning(store);
    toRentMorning(store);
    const saved = migrate(JSON.parse(JSON.stringify(store.toSave())))!;
    expect(saved.seized).toHaveLength(1);
    expect(new GameStore(saved).getState().loan).toEqual(store.getState().loan);
    const { loan: _l, seized: _s, ...rest } = new GameStore().toSave() as unknown as Record<string, unknown>;
    const v = migrate({ ...rest, schemaVersion: 10 })!;
    expect(v.loan).toEqual(freshLoan());
    expect(v.seized).toEqual([]);
  });
});
