import type { SeededRNG } from '../../core/SeededRNG';
import { OFFICE } from '../../data/office.data';

// 인수 빚 (docs/design/4-day/economy.md "인수 빚과 채권자"). Pure: the caller passes the cash on hand
// after rent and wages, what the director wants to pay on top, and what could be seized. Nothing here
// touches the store or the save yet (build step 1 of the design doc).

// Where the creditor's envelope stands. 'none': no envelope out. 'offered': handed over this week,
// the director has not answered. 'taken': accepted, the envelope job sits on the board.
export type EnvelopeState = 'none' | 'offered' | 'taken';

export interface LoanState {
  left: number; // debt still owed
  envelope: EnvelopeState;
  missed: number; // rent mornings in a row the minimum was not met
}

// Something the 집행관 could put a red sticker on. The caller lists only what the office really has.
export interface Seizable {
  kind: 'facility' | 'gear' | 'staff';
  id: number | string;
  value: number; // what it cost (facility level price, gear value, staff signing fee)
}

export interface LoanWeek {
  paid: number; // taken off the debt this morning
  short: boolean; // the minimum was not met
  envelope: boolean; // the creditor hands over an envelope this morning
  seized: Seizable | null; // red sticker this morning
  cashLeft: number;
  actBefore: number;
  actAfter: number;
}

export function freshLoan(): LoanState {
  return { left: OFFICE.loan.total, envelope: 'none', missed: 0 };
}

// Which act the story is in, from how much is paid: 0 .. acts-1 while owing, `acts` once paid off.
export function loanAct(left: number): number {
  const { total, acts } = OFFICE.loan;
  if (left <= 0) return acts;
  const paid = total - left;
  return Math.min(acts - 1, Math.floor((paid / total) * acts));
}

export function minPaymentDue(loan: LoanState): number {
  const { minPayments, acts } = OFFICE.loan;
  const act = Math.min(acts - 1, loanAct(loan.left));
  return Math.min(minPayments[act] ?? OFFICE.loan.minPayment, Math.max(0, loan.left));
}

export function reclaimPrice(item: Seizable): number {
  return Math.round(item.value * OFFICE.loan.reclaimRate);
}

// The 집행관 takes one thing at random. Nothing to take → nothing happens (no game over).
function seize(seizable: readonly Seizable[], rng: SeededRNG): Seizable | null {
  return seizable.length > 0 ? rng.pick(seizable) : null;
}

// A rent morning: pay the minimum (and `extra` on top if there is cash), or fall short.
// Short with no envelope out → an envelope. Short again while one is out, or short twice running → seizure.
export function settleLoan(loan: LoanState, cash: number, extra: number, seizable: readonly Seizable[], rng: SeededRNG): LoanWeek {
  const actBefore = loanAct(loan.left);
  const due = minPaymentDue(loan);
  const week: LoanWeek = { paid: 0, short: false, envelope: false, seized: null, cashLeft: cash, actBefore, actAfter: actBefore };
  if (due === 0) return week;

  if (cash >= due) {
    const top = Math.max(0, Math.min(extra, cash - due, loan.left - due));
    week.paid = due + top;
    loan.missed = 0;
    if (loan.envelope === 'offered') loan.envelope = 'none';
  } else {
    week.paid = Math.max(0, cash);
    week.short = true;
    loan.missed += 1;
    if (loan.envelope === 'none' && loan.missed === 1) {
      loan.envelope = 'offered';
      week.envelope = true;
    } else {
      week.seized = seize(seizable, rng);
      loan.envelope = 'none';
      loan.missed = 0;
    }
  }
  loan.left -= week.paid;
  week.cashLeft = cash - week.paid;
  week.actAfter = loanAct(loan.left);
  return week;
}

// The director answers the envelope ('declined'), or the envelope job ends ('cleared' / 'failed').
export function resolveEnvelope(loan: LoanState, outcome: 'accepted' | 'declined' | 'cleared' | 'failed', seizable: readonly Seizable[], rng: SeededRNG): { credit: number; seized: Seizable | null } {
  if (outcome === 'accepted') {
    if (loan.envelope === 'offered') loan.envelope = 'taken';
    return { credit: 0, seized: null };
  }
  if (outcome === 'cleared' && loan.envelope === 'taken') {
    const credit = Math.min(OFFICE.loan.envelopeCredit, Math.max(0, loan.left));
    loan.left -= credit;
    loan.envelope = 'none';
    loan.missed = 0;
    return { credit, seized: null };
  }
  if (loan.envelope === 'none') return { credit: 0, seized: null };
  loan.envelope = 'none';
  loan.missed = 0;
  return { credit: 0, seized: seize(seizable, rng) };
}
