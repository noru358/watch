import { GHOSTS } from '../../data/ghosts.data';
import { keysWith } from '../../i18n';
import { CONTRACTS } from '../../data/contracts.data';
import { FACILITY_EFFECTS } from '../../data/facilities.data';
import { MODIFIER_COUNT, MODIFIERS } from '../../data/modifiers.data';
import { NODES } from '../../data/nodes.data';
import { GENERAL_OBJECTIVES, OBJECTIVES } from '../../data/objectives.data';
import { OFFICE, type SortieLength } from '../../data/office.data';
import { REQUESTS } from '../../data/requests.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { ContractId, GhostId, ModifierId, NodeId, ObjectiveKind, RequestId } from '../../types/ids';
import { goalFloorFor, offerFee } from './contracts';
import { chapterAfterNight, mainContractsDue, startChapters } from './chapters';
import { addReputation } from '../reputation';
import { REPUTATION } from '../../data/reputation.data';
import { offerDifficulty } from './contracts';
import type { ContractOffer, MorningReport, NightResolution, OfferTarget, OfficeState, WantedTarget } from './types';

const NODE_IDS = Object.keys(NODES) as NodeId[];
// Districts the office's 평판 rank lets it work in.
export const openNodes = (s: Pick<OfficeState, 'rankReached'>) => NODE_IDS.filter((id) => NODES[id].rank <= s.rankReached);

const OBJECTIVE_IDS = Object.keys(GENERAL_OBJECTIVES) as (keyof typeof GENERAL_OBJECTIVES)[];
const MODIFIER_IDS = Object.keys(MODIFIERS) as ModifierId[];

function weighted<T>(items: readonly T[], weight: (t: T) => number, rng: SeededRNG): T {
  const total = items.reduce((s, t) => s + weight(t), 0);
  let r = rng.range(0, total);
  for (const t of items) {
    r -= weight(t);
    if (r < 0) return t;
  }
  return items[items.length - 1]!;
}

function rollMods(rng: SeededRNG, rank: number): ModifierId[] {
  let r = rng.range(0, 1);
  let count = 0;
  for (; count < MODIFIER_COUNT.length - 1; count++) {
    r -= MODIFIER_COUNT[count]!;
    if (r < 0) break;
  }
  const mods: ModifierId[] = [];
  while (mods.length < count) {
    const left = MODIFIER_IDS.filter((id) => !mods.includes(id) && MODIFIERS[id].rank <= rank);
    if (left.length === 0) break;
    const m = weighted(left, (id) => MODIFIERS[id].weight, rng);
    mods.push(m);
  }
  return mods;
}

// Named 현상수배 / 추격 targets: "<앞말> <뒷말>" from the numbered i18n tables wanted.pre.N / wanted.suf.N
// (ko.ts). Adding a word = one line there (and en.ts); the count follows. Saves keep the indices.
const WANTED_PRE = keysWith('wanted.pre.').length;
const WANTED_SUF = keysWith('wanted.suf.').length;
const newTarget = (pool: readonly GhostId[], rng: SeededRNG): OfferTarget => ({
  ghost: rng.pick(pool.some((g) => GHOSTS[g].named) ? pool.filter((g) => GHOSTS[g].named) : pool),
  name: [rng.int(0, WANTED_PRE - 1), rng.int(0, WANTED_SUF - 1)],
  level: 0,
});

// One 일반 의뢰 (docs/rules/office.md "의뢰 한 장 만드는 법"): roll the objective, then one of its story
// frames, the node (contaminated ones post more), length, goal floor, modifiers; the fee comes last.
// A 현상수배 target that got away before comes back first (`wanted`).
// 단타 / 보통 / 원정 for a new offer: the objective's allowed lengths, open at this 평판 등급, at most one
// 원정 on the board. A re-posted target or an urgent offer is always short.
function rollLength(s: OfficeState, objective: ObjectiveKind, rng: SeededRNG, short: boolean): SortieLength {
  if (short) return 'short';
  const allowed = GENERAL_OBJECTIVES[objective].lengths.filter((id) => OFFICE.lengths[id].rank <= s.rankReached && (id !== 'long' || !s.board.some((o) => o.length === 'long')));
  return allowed.length > 1 ? weighted(allowed, (id) => OFFICE.lengths[id].weight, rng) : (allowed[0] ?? 'short');
}

// 의뢰 등급 0..3: a higher 평판 등급 sees harder (and better-paid) offers more often.
function rollGrade(s: OfficeState, rng: SeededRNG): number {
  const table = OFFICE.gradeWeights[Math.min(s.rankReached, OFFICE.gradeWeights.length - 1)]!;
  return weighted([0, 1, 2, 3], (g) => table[g]!, rng);
}

function generalOffer(s: OfficeState, rng: SeededRNG, wanted: WantedTarget | null): ContractOffer {
  const objective = wanted ? 'bounty' : weighted(OBJECTIVE_IDS.filter((id) => GENERAL_OBJECTIVES[id].rank <= s.rankReached), (id) => GENERAL_OBJECTIVES[id].weight, rng);
  const frames = (Object.keys(REQUESTS) as RequestId[]).filter((id) => REQUESTS[id].objective === objective);
  const request = rng.pick(frames);
  const frame = REQUESTS[request];
  const open = openNodes(s);
  const framed = (frame.nodes ?? NODE_IDS).filter((id) => open.includes(id));
  const node = wanted?.node ?? rng.pick(framed.length > 0 ? framed : open);
  const rule = GENERAL_OBJECTIVES[objective];
  const length = rollLength(s, objective, rng, !!wanted);
  const range = OFFICE.lengths[length].floors ?? rule.floors;
  const floors = rng.int(range[0], range[1]);
  const pool = wanted ? [wanted.ghost] : [...(frame.pool ?? NODES[node].pool)];
  const target = wanted ? { ghost: wanted.ghost, name: wanted.name, level: wanted.level } : objective === 'bounty' || objective === 'chase' ? newTarget(pool, rng) : null;
  const offer: ContractOffer = {
    id: s.nextOfferId++,
    kind: 'general',
    node,
    story: null,
    objective,
    length,
    request,
    mods: rollMods(rng, s.rankReached),
    target,
    pool,
    risk: rollGrade(s, rng),
    floors,
    // Longer contracts end on their last floor (추격: wherever the quarry is caught).
    goalFloor: length === 'short' ? goalFloorFor(objective, floors, () => rng.range(0, 1)) : floors - 1,
    fee: 0,
    shards: rule.shards + (objective === 'bounty' ? (target?.level ?? 0) : 0),
    deadline: s.day + rng.int(OFFICE.deadline.min, OFFICE.deadline.max) + deskBonus(s).deadline,
  };
  offer.fee = offerFee(offer);
  return offer;
}

function mainOffer(s: OfficeState, id: ContractId): ContractOffer {
  const c = CONTRACTS[id];
  return {
    id: s.nextOfferId++,
    kind: 'main',
    node: c.node,
    story: id,
    objective: null,
    request: null,
    mods: [],
    target: null,
    pool: [],
    risk: 0,
    floors: c.floors.length,
    goalFloor: c.floors.length - 1,
    fee: c.fee,
    shards: 0,
    deadline: null,
  };
}

// 경리 책상 (facilities.data.ts): a bigger board, longer deadlines.
function deskBonus(s: OfficeState) {
  const d = FACILITY_EFFECTS.desk;
  return { board: s.deskLevel >= d.boardPlusAt ? 1 : 0, deadline: s.deskLevel >= d.deadlinePlusAt ? 1 : 0 };
}

// Tops the board up: open main story contracts, then 일반 의뢰 (targets that got away first).
// Returns how many offers were added.
export function refillBoard(s: OfficeState, rng: SeededRNG): number {
  const before = s.board.length;
  startChapters(s);
  for (const id of mainContractsDue(s)) {
    if (s.storyDone.includes(id) || s.board.some((o) => o.story === id)) continue;
    s.board.push(mainOffer(s, id));
  }
  const size = Math.min(OFFICE.boardMax, OFFICE.boardSize + deskBonus(s).board + s.rankReached * OFFICE.boardPerRank);
  const u = OFFICE.urgent;
  while (s.board.filter((x) => x.kind === 'general').length < size) {
    const offer = generalOffer(s, rng, s.wanted.shift() ?? null);
    // 긴급 의뢰: now and then a graded offer has to be taken tonight (at most one on the board).
    if (offer.risk >= u.fromGrade && !offer.target && !s.board.some((x) => x.urgent) && rng.chance(u.chance)) {
      offer.urgent = true;
      offer.deadline = s.day + u.days - 1;
      offer.fee = Math.round((offer.fee * u.feeMult) / 10) * 10;
    }
    s.board.push(offer);
  }
  return s.board.length - before;
}

// What a night did to the board: the offers taken (1, or several for 합동 출동), the ones whose
// objective was finished, and the ones whose objective floor was reached (a named target there that
// was not caught got away).
export interface NightOutcome {
  offers: readonly number[];
  completed: readonly number[];
  reached: readonly number[];
  outcome?: 'success' | 'extracted' | 'died' | 'failed'; // 평판 loss for 'died' / 'failed'
}

// 평판 for one finished offer (reputation.data.ts).
function reputationFor(offer: ContractOffer): number {
  if (offer.kind === 'main') return REPUTATION.main;
  const base = offerDifficulty(offer) * REPUTATION.perDifficulty;
  return offer.urgent ? Math.round(base * OFFICE.urgent.repMult) : base;
}

// The night is settled before the morning: every finished offer is done and paid;
// any outcome means the director has now seen the place. Unfinished offers stay on the board.
// `resolveNight(s, id, success)` is the one-offer shorthand.
export function resolveNight(s: OfficeState, night: NightOutcome | number, success = false): NightResolution {
  const n: NightOutcome = typeof night === 'number' ? { offers: [night], completed: success ? [night] : [], reached: [night] } : night;
  const offers = n.offers.map((id) => s.board.find((o) => o.id === id)).filter((o): o is ContractOffer => !!o);
  if (offers.length === 0) return { completed: [], fee: 0, clue: null, reputation: 0, rankUp: null };
  let clue: NightResolution['clue'] = null;
  let rep = n.outcome === 'died' ? -REPUTATION.died : n.outcome === 'failed' ? -REPUTATION.failed : 0;
  const done: ContractOffer[] = [];
  for (const offer of offers) {
    if (!s.known.includes(offer.node)) s.known.push(offer.node);
    if (!n.completed.includes(offer.id)) {
      // The named ghost got away tonight: it is stronger next time (and pays more).
      if (offer.target && n.reached.includes(offer.id)) {
        offer.target = { ...offer.target, level: Math.min(OBJECTIVES.bounty.maxLevel, offer.target.level + 1) };
        if (offer.objective === 'bounty') offer.shards = GENERAL_OBJECTIVES.bounty.shards + offer.target.level;
        offer.fee = offerFee(offer);
      }
      continue;
    }
    clue = chapterAfterNight(s, offer, true) ?? clue;
    rep += reputationFor(offer);
    if (offer.story && !s.storyDone.includes(offer.story)) s.storyDone.push(offer.story);
    done.push(offer);
  }
  const ids = done.map((o) => o.id);
  s.board = s.board.filter((o) => !ids.includes(o.id));
  const before = s.reputation;
  const rankUp = addReputation(s, rep);
  return { completed: ids, fee: done.reduce((sum, o) => sum + o.fee, 0), clue, reputation: s.reputation - before, rankUp };
}

// Overnight → the next morning: rent, expired offers (평판 lost), a fresh board.
export function advanceDay(s: OfficeState, rng: SeededRNG): MorningReport {
  s.day += 1;
  const report: MorningReport = { day: s.day, rentDue: false, rentPaid: 0, debtAdded: 0, expired: 0, urgentMissed: 0, newOffers: 0, rankUp: null };

  if (s.day % OFFICE.rentEvery === 0) {
    const due = OFFICE.rent + s.debt;
    const paid = Math.min(s.money, due);
    s.money -= paid;
    report.rentDue = true;
    report.rentPaid = paid;
    report.debtAdded = due - paid - s.debt;
    s.debt = due - paid;
  }

  const expired = s.board.filter((o) => o.deadline !== null && o.deadline < s.day);
  for (const o of expired) {
    if (o.urgent) {
      addReputation(s, -OFFICE.urgent.rep);
      report.urgentMissed += 1;
    }
    // A 현상수배 left too long comes back one level stronger.
    if (o.objective === 'bounty' && o.target) s.wanted.push({ ...o.target, level: Math.min(OBJECTIVES.bounty.maxLevel, o.target.level + 1), node: o.node });
  }
  s.board = s.board.filter((o) => !expired.includes(o));
  if (expired.length > 0) addReputation(s, -REPUTATION.expired * expired.length);
  report.expired = expired.length;
  report.newOffers = refillBoard(s, rng);
  return report;
}

// The RNG for a given morning: fixed by the save's base seed and the day, so a reload replays it.
export function morningSeed(seedBase: number, day: number): number {
  return (seedBase * 2654435761 + day * 40503) >>> 0;
}
