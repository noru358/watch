// Economy check for the 인수 빚 (docs/design/4-day/economy.md). Runs the real day loop (board, rent,
// wages, loan, envelopes, seizures, 원정 days) with the night replaced by a dice roll: success odds
// by 난이도 and loot per floor are rough figures from the reading bot (tests/bots.ts), not measured
// per offer. Usage: npx vite-node tools/econ/sim.ts
import { SeededRNG } from '../../src/core/SeededRNG';
import { OFFICE } from '../../src/data/office.data';
import { GameStore } from '../../src/store/gameStore';
import { offerDifficulty, offerLength, type ContractOffer } from '../../src/systems/office';

const BASE_WIN = [0, 0.92, 0.85, 0.75, 0.6, 0.45]; // by 난이도 1..5
let WIN = BASE_WIN;
const LOOT_PER_FLOOR = 55;
type Policy = 'safe' | 'mixed' | 'greedy';

function value(o: ContractOffer, p: Policy): number {
  const days = OFFICE.lengths[offerLength(o)].days;
  const win = WIN[offerDifficulty(o)] ?? 0.4;
  const ev = (o.envelope ? OFFICE.loan.envelopeCredit : o.fee) * win + o.floors * LOOT_PER_FLOOR * (0.5 + 0.5 * win);
  if (p === 'safe') return offerDifficulty(o) <= 2 && days === 1 ? ev : ev * 0.2;
  if (p === 'greedy') return ev;
  return ev / days;
}

// `share`: of the money above `buffer` on a rent morning, how much goes to extra payments; the rest is
// spent on growth (training, gear, facilities) and leaves the wallet.
function run(seed: number, policy: Policy, weeks: number, buffer: number, share: number) {
  const store = new GameStore({ seedBase: seed, money: 300 });
  const rng = new SeededRNG(seed * 7 + 1);
  const log = { envWeeks: [] as number[], tight: 0, envelopes: 0, envelopesDone: 0, seized: 0, paidOffWeek: null as number | null, minMoney: Infinity, nights: 0 };
  const endDay = weeks * OFFICE.rentEvery;
  while (store.getState().day < endDay) {
    const s = store.getState();
    const offers = s.board.filter((o) => o.kind === 'general' && (o.deadline ?? 99) >= s.day && offerLength(o) !== 'long' || (o.kind === 'general' && s.rankReached >= OFFICE.lengths.long.rank));
    const pick = offers.sort((a, b) => value(b, policy) - value(a, policy))[0];
    if (!pick) { store.restToday(); continue; }
    store.selectOffer(pick.id);
    const win = rng.chance(WIN[offerDifficulty(pick)] ?? 0.4);
    const loot = Math.round(pick.floors * LOOT_PER_FLOOR * (win ? 1 : 0.5));
    store.applyRunResult({ offerId: pick.id, outcome: win ? 'success' : 'failed', loot, fee: win ? pick.fee : 0, shards: 0, offers: [pick.id], completed: win ? [pick.id] : [], reached: [pick.id], drops: [] });
    log.nights += 1;
    const m = store.getState().lastMorning;
    if (m?.loan?.envelope) { log.envelopes += 1; log.envWeeks.push(Math.ceil(store.getState().day / OFFICE.rentEvery)); }
    if (m?.rentDue && m.loan && !m.loan.short && store.getState().money < 300) log.tight += 1;
    if (m?.loan?.credit) log.envelopesDone += 1;
    if (m?.loan?.seized || m?.loan?.missedSeized) log.seized += 1;
    if (m?.rentDue) {
      const spare = Math.max(0, store.getState().money - buffer);
      const toLoan = Math.floor(spare * share);
      const target = store.getState().money - toLoan;
      while (store.getState().money - Math.min(OFFICE.loan.minPayment, store.getState().loan.left) >= target && store.payLoan());
      const spent = Math.floor(spare * (1 - share));
      (store as unknown as { set(p: object): void }).set({ money: store.getState().money - spent });
    }
    const now = store.getState();
    log.minMoney = Math.min(log.minMoney, now.money);
    if (now.loan.left <= 0 && log.paidOffWeek === null) log.paidOffWeek = Math.ceil(now.day / OFFICE.rentEvery);
    // A player buys the 경리 책상 and 네온 간판 early (so there is something to seize).
    if (now.money > 900 && now.facilities.desk === 0) store.buildFacility('desk');
    if (store.getState().money > 900 && store.getState().facilities.sign === 0) store.buildFacility('sign');
  }
  const end = store.getState();
  return { ...log, left: end.loan.left, money: end.money, rentDebt: end.debt, rank: end.rankReached };
}

const WEEKS = 30;
const loan = OFFICE.loan as { total: number; minPayment: number; envelopeCredit: number };
const sets = (process.env.SETS ?? `${loan.total}:${loan.minPayment}:${loan.envelopeCredit}`).split(',').map((x) => x.split(':').map(Number) as [number, number, number]);
for (const [total, min, credit] of sets) {
  Object.assign(OFFICE.loan, { total, minPayment: min, envelopeCredit: credit });
  console.log(`--- 빚 ${total} · 최소 ${min} · 봉투 ${credit}`);
  for (const luck of [0, -0.15]) {
    WIN = BASE_WIN.map((w) => (w ? Math.max(0.1, w + luck) : 0));
    for (const policy of ['safe', 'mixed'] as Policy[]) {
      for (const share of [0.3, 0.6]) {
        const rows = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => run(seed, policy, WEEKS, 600, share));
        const avg = (f: (r: (typeof rows)[number]) => number) => Math.round((rows.reduce((a, r) => a + f(r), 0) / rows.length) * 10) / 10;
        const paid = rows.filter((r) => r.paidOffWeek !== null).map((r) => r.paidOffWeek!);
        console.log(`${luck ? '못하는' : '잘하는'} ${policy.padEnd(5)} 빚에 ${share * 100}% | 완납 ${paid.length}/8 ${paid.length ? `(${Math.min(...paid)}~${Math.max(...paid)}주)` : ''} | 남은 빚 ${avg((r) => r.left)} | 봉투 ${avg((r) => r.envelopes)} 깸 ${avg((r) => r.envelopesDone)} | 압류 ${avg((r) => r.seized)} | 아슬 ${avg((r) => r.tight)} | 봉투 온 주 ${rows.flatMap((r) => r.envWeeks).sort((a, b) => a - b).join(',')}`);
      }
    }
  }
}
