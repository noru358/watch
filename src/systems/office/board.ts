import { CONTRACTS } from '../../data/contracts.data';
import { FACILITY_EFFECTS } from '../../data/facilities.data';
import { MODIFIER_COUNT, MODIFIERS } from '../../data/modifiers.data';
import { NODES } from '../../data/nodes.data';
import { GENERAL_OBJECTIVES, OBJECTIVES } from '../../data/objectives.data';
import { OFFICE } from '../../data/office.data';
import { REQUESTS } from '../../data/requests.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { ContractId, GhostId, ModifierId, NodeId, RequestId } from '../../types/ids';
import { goalFloorFor, offerFee } from './contracts';
import { chapterAfterNight, mainContractsDue, startChapters } from './chapters';
import { addReputation } from '../reputation';
import { REPUTATION } from '../../data/reputation.data';
import { offerDifficulty } from './contracts';
import type { Contamination, ContractOffer, MorningReport, NightResolution, OfferTarget, OfficeState, WantedTarget } from './types';

const NODE_IDS = Object.keys(NODES) as NodeId[];
// Districts the office's 평판 rank lets it work in (the rest wait, their contamination still).
export const openNodes = (s: Pick<OfficeState, 'rankReached'>) => NODE_IDS.filter((id) => NODES[id].rank <= s.rankReached);
const clamp = (v: number) => Math.max(0, Math.min(OFFICE.contamination.max, v));

export function startingContamination(): Contamination {
  const c = {} as Contamination;
  for (const id of NODE_IDS) c[id] = NODES[id].startContamination;
  return c;
}

// Higher contamination = more likely to post (people notice).
function weightedNode(candidates: readonly NodeId[], c: Contamination, rng: SeededRNG): NodeId {
  const total = candidates.reduce((s, id) => s + c[id] + 1, 0);
  let r = rng.range(0, total);
  for (const id of candidates) {
    r -= c[id] + 1;
    if (r < 0) return id;
  }
  return candidates[candidates.length - 1]!;
}

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

const newTarget = (pool: readonly GhostId[], rng: SeededRNG): OfferTarget => ({
  ghost: rng.pick(pool),
  name: [rng.int(0, OFFICE.wantedNames.pre - 1), rng.int(0, OFFICE.wantedNames.suf - 1)],
  level: 0,
});

// One 일반 의뢰 (docs/rules/office.md "의뢰 한 장 만드는 법"): roll the objective, then one of its story
// frames, the node (contaminated ones post more), length, goal floor, modifiers; the fee comes last.
// A 현상수배 target that got away before comes back first (`wanted`).
function generalOffer(s: OfficeState, rng: SeededRNG, wanted: WantedTarget | null, at: NodeId | null = null): ContractOffer {
  const objective = wanted ? 'bounty' : weighted(OBJECTIVE_IDS.filter((id) => GENERAL_OBJECTIVES[id].rank <= s.rankReached), (id) => GENERAL_OBJECTIVES[id].weight, rng);
  const frames = (Object.keys(REQUESTS) as RequestId[]).filter((id) => REQUESTS[id].objective === objective);
  const fitting = at ? frames.filter((id) => !REQUESTS[id].nodes || REQUESTS[id].nodes!.includes(at)) : frames;
  const request = rng.pick(fitting.length > 0 ? fitting : frames);
  const frame = REQUESTS[request];
  const open = openNodes(s);
  const framed = (frame.nodes ?? NODE_IDS).filter((id) => open.includes(id));
  const node = at ?? wanted?.node ?? weightedNode(framed.length > 0 ? framed : open, s.contamination, rng);
  const rule = GENERAL_OBJECTIVES[objective];
  const floors = rng.int(rule.floors[0], rule.floors[1]);
  const pool = wanted ? [wanted.ghost] : [...(frame.pool ?? NODES[node].pool)];
  const target = wanted ? { ghost: wanted.ghost, name: wanted.name, level: wanted.level } : objective === 'bounty' || objective === 'chase' ? newTarget(pool, rng) : null;
  const offer: ContractOffer = {
    id: s.nextOfferId++,
    kind: 'general',
    node,
    story: null,
    objective,
    request,
    mods: rollMods(rng, s.rankReached),
    target,
    pool,
    risk: s.contamination[node],
    floors,
    goalFloor: goalFloorFor(objective, floors, () => rng.range(0, 1)),
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
    risk: s.contamination[c.node],
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
  // 넘침: one 긴급 의뢰 per overflowing district, on top of the board size.
  const o = OFFICE.contamination.overflow;
  for (const id of openNodes(s)) {
    if (s.contamination[id] < o.at || s.board.some((x) => x.urgent && x.node === id)) continue;
    const urgent = generalOffer(s, rng, null, id);
    urgent.urgent = true;
    urgent.deadline = s.day + o.days - 1;
    urgent.fee = Math.round((urgent.fee * o.feeMult) / 10) * 10;
    s.board.push(urgent);
  }
  const size = OFFICE.boardSize + deskBonus(s).board;
  while (s.board.filter((x) => x.kind === 'general' && !x.urgent).length < size) s.board.push(generalOffer(s, rng, s.wanted.shift() ?? null));
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
function reputationFor(s: OfficeState, offer: ContractOffer): number {
  if (offer.kind === 'main') return REPUTATION.main;
  const hot = s.contamination[offer.node] >= REPUTATION.hotAt ? REPUTATION.hotBonus : 0;
  const base = offerDifficulty(offer) * REPUTATION.perDifficulty + hot;
  return offer.urgent ? Math.round(base * OFFICE.contamination.overflow.repMult) : base;
}

// The night is settled before the morning: every finished offer is done, paid and calms its node;
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
      // Reached and not done: the district gets worse (nothing happens to offers never reached).
      if (n.reached.includes(offer.id) && openNodes(s).includes(offer.node)) s.contamination[offer.node] = clamp(s.contamination[offer.node] + OFFICE.contamination.failRise);
      // The named ghost got away tonight: it is stronger next time (and pays more).
      if (offer.target && n.reached.includes(offer.id)) {
        offer.target = { ...offer.target, level: Math.min(OBJECTIVES.bounty.maxLevel, offer.target.level + 1) };
        if (offer.objective === 'bounty') offer.shards = GENERAL_OBJECTIVES.bounty.shards + offer.target.level;
        offer.fee = offerFee(offer);
      }
      continue;
    }
    clue = chapterAfterNight(s, offer, true) ?? clue;
    rep += reputationFor(s, offer);
    const cleanse = offer.kind === 'main' ? OFFICE.contamination.cleanse.main : GENERAL_OBJECTIVES[offer.objective ?? 'clear'].cleanse;
    s.contamination[offer.node] = clamp(s.contamination[offer.node] - cleanse);
    if (offer.story && !s.storyDone.includes(offer.story)) s.storyDone.push(offer.story);
    done.push(offer);
  }
  const ids = done.map((o) => o.id);
  s.board = s.board.filter((o) => !ids.includes(o.id));
  const before = s.reputation;
  const rankUp = addReputation(s, rep);
  return { completed: ids, fee: done.reduce((sum, o) => sum + o.fee, 0), clue, reputation: s.reputation - before, rankUp };
}

// Overnight → the next morning: rent, the city getting worse, expired offers, a fresh board.
export function advanceDay(s: OfficeState, rng: SeededRNG): MorningReport {
  const c = OFFICE.contamination;
  s.day += 1;
  const report: MorningReport = { day: s.day, rentDue: false, rentPaid: 0, debtAdded: 0, expired: 0, worsened: [], overflowed: [], newOffers: 0, rankUp: null };

  if (s.day % OFFICE.rentEvery === 0) {
    const due = OFFICE.rent + s.debt;
    const paid = Math.min(s.money, due);
    s.money -= paid;
    report.rentDue = true;
    report.rentPaid = paid;
    report.debtAdded = due - paid - s.debt;
    s.debt = due - paid;
  }

  const worse = new Set<NodeId>();
  const open = openNodes(s);
  const bump = (id: NodeId, by: number) => {
    if (!open.includes(id)) return; // not the office's patch yet
    const next = clamp(s.contamination[id] + by);
    if (next > s.contamination[id]) worse.add(id);
    s.contamination[id] = next;
  };
  const expired = s.board.filter((o) => o.deadline !== null && o.deadline < s.day);
  for (const o of expired) {
    bump(o.node, c.expireRise);
    // A missed 긴급 의뢰: the district spills into every open neighbour.
    if (o.urgent) {
      for (const n of overflowTargets(s, o.node)) bump(n, c.overflow.rise);
      addReputation(s, -c.overflow.rep);
      report.overflowed.push(o.node);
    }
    // A 현상수배 left too long comes back one level stronger.
    if (o.objective === 'bounty' && o.target) s.wanted.push({ ...o.target, level: Math.min(OBJECTIVES.bounty.maxLevel, o.target.level + 1), node: o.node });
  }
  s.board = s.board.filter((o) => !expired.includes(o));
  if (expired.length > 0) addReputation(s, -REPUTATION.expired * expired.length);
  report.expired = expired.length;
  report.worsened = NODE_IDS.filter((id) => worse.has(id));
  report.newOffers = refillBoard(s, rng);
  return report;
}

// Where a district spills if its 긴급 의뢰 is missed: its open neighbours not already at the top.
export function overflowTargets(s: Pick<OfficeState, 'contamination' | 'rankReached'>, id: NodeId): NodeId[] {
  const open = openNodes(s);
  return NODES[id].links.filter((n) => open.includes(n) && s.contamination[n] < OFFICE.contamination.max);
}

// The RNG for a given morning: fixed by the save's base seed and the day, so a reload replays it.
export function morningSeed(seedBase: number, day: number): number {
  return (seedBase * 2654435761 + day * 40503) >>> 0;
}
