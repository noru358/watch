// The staff side of the store (kept apart so gameStore.ts stays small). Pure helpers over the game
// state: the rules live in src/systems/staff; this file only wires them to the state and the seeds.
import { SeededRNG } from '../core/SeededRNG';
import { morningSeed, type MorningReport, type OfficeState } from '../systems/office';
import { assignable, canWork, hireCap, hirePool, payWages, staffOdds, trainPrice, wageOf, weekOf, workNight, type HirePool, type Staff, type StaffMorning } from '../systems/staff';

export type Morning = MorningReport & StaffMorning;

export interface StaffState {
  day: number;
  money: number;
  seedBase: number;
  rankReached: number;
  staff: Staff[];
  assign: Record<number, number>;
  nextStaffId: number;
  hirePool: HirePool | null;
}

const copy = (staff: readonly Staff[]): Staff[] => staff.map((x) => ({ ...x, name: [...x.name] as [number, number] }));

// This week's 구인 list (fixed by the save seed and the week: a reload shows the same names).
export function poolFor(s: Pick<StaffState, 'day' | 'seedBase' | 'rankReached' | 'hirePool'>): HirePool {
  const week = weekOf(s.day);
  if (s.hirePool && s.hirePool.week === week) return s.hirePool;
  return hirePool(week, s.rankReached, new SeededRNG(morningSeed(s.seedBase, week * 7 + 1) ^ 0x57a5));
}

export function hire(s: StaffState, index: number): Partial<StaffState> | null {
  const pool = poolFor(s);
  const c = pool.list[index];
  if (!c || s.staff.length >= hireCap(s.rankReached) || s.money < wageOf(c)) return null;
  const st: Staff = { ...c, name: [...c.name] as [number, number], id: s.nextStaffId, trauma: 0, trained: 0 };
  return { staff: [...copy(s.staff), st], money: s.money - wageOf(c), nextStaffId: s.nextStaffId + 1, hirePool: { week: pool.week, list: pool.list.filter((_, i) => i !== index) } };
}

export function train(s: StaffState, id: number): Partial<StaffState> | null {
  const staff = copy(s.staff);
  const st = staff.find((x) => x.id === id);
  const price = st ? trainPrice(st) : null;
  if (!st || price === null || s.money < price) return null;
  st.power += 1;
  st.trained += 1;
  return { staff, money: s.money - price };
}

// R on the board: the next staff member who can take this offer (free tonight), then nobody.
export function cycleAssign(s: StaffState, offerId: number, offer: Parameters<typeof assignable>[0]): Record<number, number> | null {
  if (!assignable(offer)) return null;
  const assign = { ...s.assign };
  const cur = assign[offerId];
  const busy = new Set(Object.entries(assign).filter(([o]) => Number(o) !== offerId).map(([, st]) => st));
  const free = s.staff.filter((x) => canWork(x) && !busy.has(x.id));
  const i = cur === undefined ? -1 : free.findIndex((x) => x.id === cur);
  const next = free[i + 1];
  if (next) assign[offerId] = next.id;
  else delete assign[offerId];
  return assign;
}

export const oddsFor = (staff: readonly Staff[], assign: Readonly<Record<number, number>>, offer: Parameters<typeof staffOdds>[1]) => {
  const st = staff.find((x) => x.id === assign[offer.id]);
  return st ? { staff: st, odds: staffOdds(st, offer) } : null;
};

// After the director's night (or a rest day), before the morning: staff work or rest. Mutates `o`
// (fees, 평판, offers finished) and returns the staff changes and the report lines.
export function staffNight(s: StaffState, o: OfficeState, taken: readonly number[], sofa: number) {
  const staff = copy(s.staff);
  const rng = new SeededRNG(morningSeed(s.seedBase, s.day) ^ 0x57af);
  const r = workNight(o, staff, s.assign, taken, rng, sofa);
  o.money += r.money;
  return { staff, lines: r.lines, rankUp: r.rankUp };
}

// The morning after: wages go out with the rent; whoever cannot be paid leaves.
export function staffMorning(staff: Staff[], o: OfficeState, morning: MorningReport): { staff: Staff[]; report: StaffMorning } {
  if (!morning.rentDue || staff.length === 0) return { staff, report: {} };
  const w = payWages(staff, o.money);
  o.money -= w.paid;
  return { staff: w.kept, report: { wages: w.paid, quit: w.quit } };
}
