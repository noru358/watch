import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { OFFICE } from '../src/data/office.data';
import { freshLoan, loanAct, reclaimPrice, resolveEnvelope, settleLoan, type Seizable } from '../src/systems/office';

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
