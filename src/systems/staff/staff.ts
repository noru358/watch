import { GENERAL_OBJECTIVES } from '../../data/objectives.data';
import { STAFF, type StaffGrade } from '../../data/staff.data';
import { keysWith } from '../../i18n';
import type { SeededRNG } from '../../core/SeededRNG';
import type { ObjectiveKind } from '../../types/ids';
import { offerDifficulty, resolveNight, type ContractOffer, type NightResolution, type OfficeState } from '../office';
import type { HirePool, Staff, StaffCandidate, StaffNightLine } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const OBJECTIVES = Object.keys(GENERAL_OBJECTIVES) as ObjectiveKind[];

export const wageOf = (st: Pick<Staff, 'grade'>): number => STAFF.grades[st.grade].wage;
export const hireCap = (rank: number): number => STAFF.capBase + rank;
export const weekOf = (day: number): number => Math.floor((day - 1) / 7);

// Staff take 일반 의뢰 only, and not 원정 (the director's own).
export function assignable(offer: ContractOffer): boolean {
  return offer.kind === 'general' && offer.length !== 'long';
}

export const canWork = (st: Staff): boolean => st.trauma < STAFF.trauma.block;

// The chance this staff member finishes this offer (shown on the board before the night).
export function staffOdds(st: Staff, offer: ContractOffer): number {
  if (!assignable(offer)) return 0;
  const O = STAFF.odds;
  const power = st.power * (st.knack !== null && st.knack === offer.objective ? O.knack : 1);
  return clamp(O.base + (power - offerDifficulty(offer) * O.perDifficulty + O.offset) * O.perPoint, O.min, O.max);
}

// The night for everyone the director did not take along: assigned staff roll for their offer
// (settled like a night: fee, 평판, clues — no spirit, 파편 or 장신구, those are the director's), the
// rest rest. `taken` = the offers the director played tonight (an assignment there is void).
export function workNight(o: OfficeState, staff: Staff[], assign: Readonly<Record<number, number>>, taken: readonly number[], rng: SeededRNG, sofa: number): { lines: StaffNightLine[]; money: number; rankUp: number | null; clue: NightResolution['clue'] } {
  const lines: StaffNightLine[] = [];
  let money = 0;
  let rankUp: number | null = null;
  let clue: NightResolution['clue'] = null;
  const working = new Map<number, number>(); // staff id → offer id
  for (const [offerId, staffId] of Object.entries(assign)) {
    const offer = o.board.find((x) => x.id === Number(offerId));
    const st = staff.find((x) => x.id === staffId);
    if (offer && st && !taken.includes(offer.id) && assignable(offer) && canWork(st) && !working.has(st.id)) working.set(st.id, offer.id);
  }
  for (const st of staff) {
    const offerId = working.get(st.id);
    const offer = offerId === undefined ? undefined : o.board.find((x) => x.id === offerId);
    if (!offer) {
      const before = st.trauma;
      st.trauma = Math.max(0, st.trauma - STAFF.rest - (sofa > 0 ? STAFF.sofaBonus : 0));
      lines.push({ staffId: st.id, name: st.name, offerId: null, node: null, objective: null, success: false, fee: 0, trauma: st.trauma - before });
      continue;
    }
    const success = rng.chance(staffOdds(st, offer));
    const night = resolveNight(o, { offers: [offer.id], completed: success ? [offer.id] : [], reached: [offer.id] });
    money += night.fee;
    rankUp = night.rankUp ?? rankUp;
    clue = night.clue ?? clue;
    let dt = 0;
    if (!success) {
      const T = STAFF.trauma;
      dt = offerDifficulty(offer) * STAFF.odds.perDifficulty - st.power > T.badGap ? T.badFail : T.fail;
      st.trauma = Math.min(T.max, st.trauma + dt);
    }
    lines.push({ staffId: st.id, name: st.name, offerId: offer.id, node: offer.node, objective: offer.objective, success, fee: night.fee, trauma: dt });
  }
  return { lines, money, rankUp, clue };
}

// Wages with the rent: paid in order to whoever the money still covers; whoever it does not cover leaves.
export function payWages(staff: Staff[], money: number): { paid: number; kept: Staff[]; quit: Staff[] } {
  let paid = 0;
  const kept: Staff[] = [];
  const quit: Staff[] = [];
  for (const st of staff) {
    const w = wageOf(st);
    if (money - paid >= w) {
      paid += w;
      kept.push(st);
    } else quit.push(st);
  }
  return { paid, kept, quit };
}

export const trainPrice = (st: Staff): number | null => (st.trained >= STAFF.trainCap ? null : STAFF.train * (st.trained + 1));

// This week's 구인 list: grades up to the 평판 rank (+1), random names and 특기.
export function hirePool(week: number, rank: number, rng: SeededRNG): HirePool {
  const families = keysWith('staff.family.').length;
  const givens = keysWith('staff.given.').length;
  const list: StaffCandidate[] = [];
  for (let i = 0; i < STAFF.candidates; i++) {
    const grade = rng.int(1, Math.min(4, rank + 1)) as StaffGrade;
    list.push({
      origin: 'hire',
      name: [rng.int(0, families - 1), rng.int(0, givens - 1)],
      grade,
      power: STAFF.grades[grade].power + rng.int(0, STAFF.powerJitter),
      knack: rng.chance(STAFF.knackChance) ? rng.pick(OBJECTIVES) : null,
    });
  }
  return { week, list };
}
