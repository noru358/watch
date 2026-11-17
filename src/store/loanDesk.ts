// The 인수 빚 side of the store (docs/design/4-day/economy.md "인수 빚과 채권자"). The rules live in
// src/systems/office/loan.ts; this file lists what can be seized, applies a red sticker to the state
// and puts it back when it is bought back.
import { SeededRNG } from '../core/SeededRNG';
import { FACILITIES, FACILITY_IDS } from '../data/facilities.data';
import { OFFICE } from '../data/office.data';
import type { FacilityId } from '../types/ids';
import { dismantleValue, type GearItem, type GearSlot } from '../systems/gear';
import { morningSeed, reclaimPrice, settleLoan, minPaymentDue, type LoanState, type MorningReport, type Seizable } from '../systems/office';

// A seized thing as kept in the save: the 장신구 itself rides along so it can come back whole.
export type Seized = Seizable & { gear?: GearItem };

// What the bookkeeper reads out about the debt this morning.
export interface LoanMorning {
  paid: number;
  left: number;
  short: boolean;
  envelope: boolean;
  seized: Seized | null;
  actUp: number | null; // the act just reached (null = same act)
}

export interface LoanSlice {
  money: number;
  loan: LoanState;
  seized: Seized[];
  facilities: Record<FacilityId, number>;
  gear: GearItem[];
  equipped: Partial<Record<GearSlot, number>>;
}

const copyGear = (x: GearItem): GearItem => ({ ...x, subs: x.subs.map((m) => ({ ...m })) });

// Everything a 집행관 could put a sticker on: each built facility's top level, each 장신구 in the bag.
// Staff contracts are not seized yet (the design lists them; they wait for the creditor scene).
export function seizableOf(s: Pick<LoanSlice, 'facilities' | 'gear'>): Seized[] {
  const out: Seized[] = [];
  for (const id of FACILITY_IDS) {
    const lv = s.facilities[id] ?? 0;
    if (lv > 0) out.push({ kind: 'facility', id, value: FACILITIES[id].costs[lv - 1] ?? 0 });
  }
  for (const g of s.gear) out.push({ kind: 'gear', id: g.id, value: dismantleValue(g), gear: copyGear(g) });
  return out;
}

// Applies a red sticker: a facility drops a level, a 장신구 leaves the bag (and its slot).
function applySeizure(s: LoanSlice, thing: Seized): void {
  if (thing.kind === 'facility') {
    const id = thing.id as FacilityId;
    s.facilities = { ...s.facilities, [id]: Math.max(0, (s.facilities[id] ?? 0) - 1) };
  } else if (thing.kind === 'gear') {
    s.gear = s.gear.filter((g) => g.id !== thing.id);
    s.equipped = Object.fromEntries(Object.entries(s.equipped).filter(([, id]) => id !== thing.id)) as LoanSlice['equipped'];
  }
  s.seized = [...s.seized, thing];
}

// A rent morning, after rent and wages: the creditor comes for the minimum. Mutates and returns `s`'s parts.
export function loanMorning(s: LoanSlice, seedBase: number, day: number, morning: MorningReport): { patch: LoanSlice; report: LoanMorning | null } {
  const patch: LoanSlice = { ...s, loan: { ...s.loan }, seized: [...s.seized], facilities: { ...s.facilities }, gear: s.gear.map(copyGear), equipped: { ...s.equipped } };
  if (!morning.rentDue || minPaymentDue(patch.loan) === 0) return { patch, report: null };
  const rng = new SeededRNG(morningSeed(seedBase, day) ^ 0x10a7);
  const week = settleLoan(patch.loan, patch.money, 0, seizableOf(patch), rng);
  patch.money = week.cashLeft;
  if (week.seized) applySeizure(patch, week.seized as Seized);
  return {
    patch,
    report: { paid: week.paid, left: patch.loan.left, short: week.short, envelope: week.envelope, seized: (week.seized as Seized | null) ?? null, actUp: week.actAfter > week.actBefore ? week.actAfter : null },
  };
}

// 더 갚기 in the ledger: one minimum-payment step at a time, never past the debt or the wallet.
export function payExtra(s: Pick<LoanSlice, 'money' | 'loan'>): Pick<LoanSlice, 'money' | 'loan'> | null {
  const amount = Math.min(OFFICE.loan.minPayment, s.loan.left, s.money);
  if (amount <= 0) return null;
  return { money: s.money - amount, loan: { ...s.loan, left: s.loan.left - amount } };
}

// 되찾기: pay the price and the thing comes back (a facility one level, a 장신구 into the bag if there is room).
export function reclaim(s: LoanSlice, index: number, bag: number): Partial<LoanSlice> | null {
  const thing = s.seized[index];
  if (!thing) return null;
  const price = reclaimPrice(thing);
  if (s.money < price) return null;
  const seized = s.seized.filter((_, i) => i !== index);
  if (thing.kind === 'facility') {
    const id = thing.id as FacilityId;
    const max = FACILITIES[id].costs.length;
    return { money: s.money - price, seized, facilities: { ...s.facilities, [id]: Math.min(max, (s.facilities[id] ?? 0) + 1) } };
  }
  if (thing.kind === 'gear' && thing.gear) {
    if (s.gear.length >= bag) return null;
    return { money: s.money - price, seized, gear: [...s.gear.map(copyGear), copyGear(thing.gear)] };
  }
  return null;
}
