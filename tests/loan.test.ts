import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { OFFICE } from '../src/data/office.data';
import { freshLoan, loanAct, minPaymentDue, reclaimPrice, resolveEnvelope, settleLoan, type Seizable } from '../src/systems/office';
import { migrate } from '../src/core/SaveManager';
import { GameStore } from '../src/store/gameStore';
import { loanMorning, seizableOf } from '../src/store/loanDesk';
import { pantryBonus } from '../src/store/staffDesk';
import { FACILITY_EFFECTS, FACILITY_IDS } from '../src/data/facilities.data';
import { STAFF } from '../src/data/staff.data';
import { REQUESTS } from '../src/data/requests.data';
import { assignable, staffOdds } from '../src/systems/staff';
import { creditorScene, type CreditorNews } from '../src/systems/story';
import { CREDITOR, SCENES } from '../src/data/story.data';

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
    const week = settleLoan(loan, L.minPayment + 100, 500, things, new SeededRNG(8));
    expect(week.actBefore).toBe(0);
    expect(week.actAfter).toBe(1);
  });

  it('the minimum rises with the act and never asks for more than is owed', () => {
    expect(minPaymentDue(freshLoan())).toBe(L.minPayments[0]);
    expect(minPaymentDue({ ...freshLoan(), left: L.total * 0.5 })).toBe(L.minPayments[2]);
    expect(minPaymentDue({ ...freshLoan(), left: 50 })).toBe(50);
    for (let i = 1; i < L.minPayments.length; i += 1) expect(L.minPayments[i]!).toBeGreaterThan(L.minPayments[i - 1]!);
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
    const store = new GameStore({ money: 0, seedBase: 2, facilities: { desk: 0, bench: 0, sofa: 1, sign: 0, pantry: 0 } });
    toRentMorning(store);
    expect(store.getState().lastMorning!.loan?.envelope).toBe(true);
    expect(store.getState().loan.envelope).toBe('taken');
    toRentMorning(store);
    const m = store.getState().lastMorning!;
    expect(m.loan?.missedSeized?.kind).toBe('facility');
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
    const store = new GameStore({ money: 0, seedBase: 2, facilities: { desk: 0, bench: 0, sofa: 1, sign: 0, pantry: 0 } });
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

describe('봉투 의뢰', () => {
  const toRentMorning = (store: GameStore) => {
    for (let d = store.getState().day; (d + 1) % OFFICE.rentEvery !== 0; d++) store.restToday();
    store.restToday();
  };

  it('normal boards never roll an envelope frame', () => {
    for (let seed = 1; seed < 40; seed += 1) {
      const store = new GameStore({ seedBase: seed, rankReached: 3 });
      expect(store.getState().board.some((o) => o.envelope || (o.request ?? '').startsWith('envelope'))).toBe(false);
    }
  });

  it('a broke rent morning posts one envelope job: no fee, outside the board size, the director\'s own, due before next rent', () => {
    const store = new GameStore({ money: 0, seedBase: 4 });
    const generals = store.getState().board.filter((o) => o.kind === 'general').length;
    toRentMorning(store);
    const s = store.getState();
    const env = s.board.filter((o) => o.envelope);
    expect(env).toHaveLength(1);
    expect(env[0]!.fee).toBe(0);
    expect(REQUESTS[env[0]!.request!].envelope).toBe(true);
    expect(s.board.filter((o) => o.kind === 'general' && !o.envelope).length).toBe(generals);
    expect(assignable(env[0]!)).toBe(false);
    expect(env[0]!.deadline).toBe(s.day + OFFICE.rentEvery - 1);
    expect(s.loan.envelope).toBe('taken');
  });

  it('left undone: it runs out on the next rent morning and the 집행관 takes something', () => {
    const store = new GameStore({ money: 0, seedBase: 4, facilities: { desk: 0, bench: 0, sofa: 1, sign: 0, pantry: 0 } });
    toRentMorning(store);
    toRentMorning(store);
    const m = store.getState().lastMorning!;
    expect(m.envelopeMissed).toBe(true);
    expect(m.loan?.missedSeized?.kind).toBe('facility');
    expect(store.getState().board.some((o) => o.envelope && o.deadline! < store.getState().day)).toBe(false);
  });

  it('done: the credit comes off the debt the next morning', () => {
    const loan = { ...freshLoan(), envelope: 'taken' as const, missed: 1 };
    const morning = { day: 3, rentDue: false, rentPaid: 0, debtAdded: 0, expired: 0, urgentMissed: 0, newOffers: 0, rankUp: null };
    const r = loanMorning({ money: 0, loan, seized: [], facilities: { desk: 0, bench: 0, sofa: 0, sign: 0, pantry: 0 }, gear: [], equipped: {} }, 1, 3, morning, true);
    expect(r.report?.credit).toBe(L.envelopeCredit);
    expect(r.patch.loan.left).toBe(L.total - L.envelopeCredit);
    expect(r.patch.loan.envelope).toBe('none');
  });
});

describe('채권자 장면', () => {
  const news = (patch: Partial<CreditorNews> = {}): CreditorNews => ({ paid: 300, left: 9000, short: false, envelope: false, seized: null, ...patch });
  it('first visit introduces him, then the scene follows what happened', () => {
    expect(creditorScene(undefined, 7, [])).toBeNull();
    expect(creditorScene(news(), 7, [])).toBe(CREDITOR.first);
    const seen = [CREDITOR.first];
    expect(CREDITOR.paid).toContain(creditorScene(news(), 14, seen));
    expect(CREDITOR.envelope).toContain(creditorScene(news({ short: true, envelope: true, paid: 0 }), 14, seen));
    expect(CREDITOR.seized).toContain(creditorScene(news({ short: true, seized: {} }), 14, seen));
    expect(CREDITOR.seized).toContain(creditorScene(news({ missedSeized: {} }), 14, seen));
    expect(CREDITOR.credit).toContain(creditorScene(news({ credit: 1000, paid: 0 }), 15, seen));
    expect(creditorScene(news({ left: 0 }), 21, seen)).toBe(CREDITOR.done);
    expect(creditorScene(news({ left: 0 }), 21, [...seen, CREDITOR.done])).toBeNull();
  });
  it('every creditor scene has lines', () => {
    for (const id of [CREDITOR.first, CREDITOR.done, ...CREDITOR.paid, ...CREDITOR.envelope, ...CREDITOR.seized, ...CREDITOR.credit]) expect(SCENES[id].length).toBeGreaterThan(0);
  });
});

describe('새 시설: 네온 간판, 탕비실', () => {
  it('탕비실 adds to staff odds, still within the cap', () => {
    const st = { id: 1, origin: 'hire' as const, name: [0, 0] as [number, number], grade: 1 as const, power: 4, knack: null, trauma: 0, trained: 0 };
    const offer = new GameStore({ seedBase: 3 }).getState().board.find((o) => o.kind === 'general' && o.length !== 'long')!;
    expect(staffOdds(st, offer, pantryBonus(2))).toBeCloseTo(Math.min(STAFF.odds.max, staffOdds(st, offer) + 2 * FACILITY_EFFECTS.pantry.oddsPerLevel));
    expect(staffOdds({ ...st, power: 99 }, offer, pantryBonus(2))).toBe(STAFF.odds.max);
  });
  it('both are listed, built from the ledger, and can be seized', () => {
    expect(FACILITY_IDS).toContain('sign');
    expect(FACILITY_IDS).toContain('pantry');
    const store = new GameStore({ money: 5000 });
    expect(store.buildFacility('sign')).toBe(true);
    expect(store.getState().facilities.sign).toBe(1);
    expect(seizableOf(store.getState()).some((x) => x.kind === 'facility' && x.id === 'sign')).toBe(true);
  });
});

describe('원정은 사흘', () => {
  const run = (store: GameStore, id: number) => store.applyRunResult({ offerId: id, outcome: 'success', loot: 0, fee: 0, shards: 0, offers: [id], completed: [id], reached: [id], drops: [] });

  it('a 원정 passes three mornings; a 단타 one', () => {
    const store = new GameStore({ money: 9000, seedBase: 5, rankReached: 3 });
    const long = { ...store.getState().board.find((o) => o.kind === 'general')!, length: 'long' as const };
    const short = { ...store.getState().board.find((o) => o.kind === 'general' && o.id !== long.id)!, length: 'short' as const };
    const s1 = new GameStore({ ...store.getState(), board: [long, short] });
    const day = s1.getState().day;
    s1.selectOffer(long.id);
    run(s1, long.id);
    expect(s1.getState().day).toBe(day + OFFICE.lengths.long.days);
    expect(s1.getState().lastMorning!.away).toBe(OFFICE.lengths.long.days);
    const s2 = new GameStore({ ...store.getState(), board: [long, short] });
    s2.selectOffer(short.id);
    run(s2, short.id);
    expect(s2.getState().day).toBe(day + 1);
    expect(s2.getState().lastMorning!.away).toBeUndefined();
  });

  it('rent that falls inside the 원정 is still charged and reported', () => {
    const base = new GameStore({ money: 9000, seedBase: 6, rankReached: 3 });
    for (let d = base.getState().day; (d + 2) % OFFICE.rentEvery !== 0; d++) base.restToday();
    const long = { ...base.getState().board.find((o) => o.kind === 'general')!, length: 'long' as const };
    const s = new GameStore({ ...base.getState(), board: [long] });
    const before = s.getState().money;
    s.selectOffer(long.id);
    run(s, long.id);
    const m = s.getState().lastMorning!;
    expect(m.rentDue).toBe(true);
    expect(m.loan?.paid).toBe(L.minPayment);
    expect(s.getState().money).toBeLessThan(before);
  });
});
