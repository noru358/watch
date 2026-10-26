import { CONTRACTS } from '../../data/contracts.data';
import { FACILITY_EFFECTS } from '../../data/facilities.data';
import { MODIFIER_COUNT, MODIFIERS } from '../../data/modifiers.data';
import { NODES } from '../../data/nodes.data';
import { GENERAL_OBJECTIVES, OBJECTIVES } from '../../data/objectives.data';
import { OFFICE } from '../../data/office.data';
import { REQUESTS } from '../../data/requests.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { ContractId, GhostId, ModifierId, NodeId, RequestId } from '../../types/ids';
import { bundleWith, goalFloorFor, offerFee } from './contracts';
import { chapterAfterNight, mainContractsDue, startChapters } from './chapters';
import type { Contamination, ContractOffer, MorningReport, NightResolution, OfferTarget, OfficeState, WantedTarget } from './types';

const NODE_IDS = Object.keys(NODES) as NodeId[];
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

function rollMods(rng: SeededRNG): ModifierId[] {
  let r = rng.range(0, 1);
  let count = 0;
  for (; count < MODIFIER_COUNT.length - 1; count++) {
    r -= MODIFIER_COUNT[count]!;
    if (r < 0) break;
  }
  const mods: ModifierId[] = [];
  while (mods.length < count) {
    const m = weighted(MODIFIER_IDS.filter((id) => !mods.includes(id)), (id) => MODIFIERS[id].weight, rng);
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
function generalOffer(s: OfficeState, rng: SeededRNG, wanted: WantedTarget | null): ContractOffer {
  const objective = wanted ? 'bounty' : weighted(OBJECTIVE_IDS, (id) => GENERAL_OBJECTIVES[id].weight, rng);
  const request = rng.pick((Object.keys(REQUESTS) as RequestId[]).filter((id) => REQUESTS[id].objective === objective));
  const frame = REQUESTS[request];
  const node = wanted?.node ?? weightedNode(frame.nodes ?? NODE_IDS, s.contamination, rng);
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
    mods: rollMods(rng),
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
  const size = OFFICE.boardSize + deskBonus(s).board;
  while (s.board.filter((o) => o.kind === 'general').length < size) s.board.push(generalOffer(s, rng, s.wanted.shift() ?? null));
  return s.board.length - before;
}

// The night's contract is settled before the morning: on success the offer (and its bundle) is
// done and its node calmer; any outcome means the director has now seen the place.
export function resolveNight(s: OfficeState, offerId: number, success: boolean): NightResolution {
  const offer = s.board.find((o) => o.id === offerId);
  if (!offer) return { completed: [], fee: 0, clue: null };
  const clue = chapterAfterNight(s, offer, success);
  if (!s.known.includes(offer.node)) s.known.push(offer.node);
  if (!success) {
    // The named ghost got away tonight: it is stronger next time (and pays more).
    if (offer.target) {
      offer.target = { ...offer.target, level: Math.min(OBJECTIVES.bounty.maxLevel, offer.target.level + 1) };
      if (offer.objective === 'bounty') offer.shards = GENERAL_OBJECTIVES.bounty.shards + offer.target.level;
      offer.fee = offerFee(offer);
    }
    return { completed: [], fee: 0, clue: null };
  }
  const done = bundleWith(s.board, offer);
  const ids = done.map((o) => o.id);
  s.board = s.board.filter((o) => !ids.includes(o.id));
  const cleanse = offer.kind === 'main' ? OFFICE.contamination.cleanse.main : GENERAL_OBJECTIVES[offer.objective ?? 'clear'].cleanse;
  s.contamination[offer.node] = clamp(s.contamination[offer.node] - cleanse);
  if (offer.story && !s.storyDone.includes(offer.story)) s.storyDone.push(offer.story);
  return { completed: ids, fee: done.reduce((sum, o) => sum + o.fee, 0), clue };
}

// Overnight → the next morning: rent, the city getting worse, expired offers, a fresh board.
export function advanceDay(s: OfficeState, rng: SeededRNG): MorningReport {
  const c = OFFICE.contamination;
  s.day += 1;
  const report: MorningReport = { day: s.day, rentDue: false, rentPaid: 0, debtAdded: 0, expired: 0, worsened: [], newOffers: 0 };

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
  const bump = (id: NodeId, by: number) => {
    const next = clamp(s.contamination[id] + by);
    if (next > s.contamination[id]) worse.add(id);
    s.contamination[id] = next;
  };
  for (const id of NODE_IDS) if (rng.chance(c.riseChance)) bump(id, 1);
  for (const id of NODE_IDS) {
    if (s.contamination[id] < c.spreadAt || !rng.chance(c.spreadChance)) continue;
    bump(rng.pick(NODES[id].links), 1);
  }

  const expired = s.board.filter((o) => o.deadline !== null && o.deadline < s.day);
  for (const o of expired) {
    bump(o.node, c.expireRise);
    // A 현상수배 left too long comes back one level stronger.
    if (o.objective === 'bounty' && o.target) s.wanted.push({ ...o.target, level: Math.min(OBJECTIVES.bounty.maxLevel, o.target.level + 1), node: o.node });
  }
  s.board = s.board.filter((o) => !expired.includes(o));
  report.expired = expired.length;
  report.worsened = NODE_IDS.filter((id) => worse.has(id));
  report.newOffers = refillBoard(s, rng);
  return report;
}

// The RNG for a given morning: fixed by the save's base seed and the day, so a reload replays it.
export function morningSeed(seedBase: number, day: number): number {
  return (seedBase * 2654435761 + day * 40503) >>> 0;
}
