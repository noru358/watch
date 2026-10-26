import { CONTRACTS } from '../../data/contracts.data';
import { NODES } from '../../data/nodes.data';
import { OFFICE } from '../../data/office.data';
import { REQUESTS } from '../../data/requests.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { ContractId, NodeId, RequestId } from '../../types/ids';
import { bundleWith, generalFee, generalFloors } from './contracts';
import type { Contamination, ContractOffer, MorningReport, NightResolution, OfficeState } from './types';

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

function generalOffer(s: OfficeState, rng: SeededRNG): ContractOffer {
  const request = rng.pick(Object.keys(REQUESTS) as RequestId[]);
  const frame = REQUESTS[request];
  const node = weightedNode(frame.nodes ?? NODE_IDS, s.contamination, rng);
  const risk = s.contamination[node];
  const floors = generalFloors(risk);
  return {
    id: s.nextOfferId++,
    kind: 'general',
    node,
    story: null,
    request,
    target: null,
    pool: [...(frame.pool ?? NODES[node].pool)],
    risk,
    floors,
    fee: generalFee(risk, floors),
    deadline: s.day + rng.int(OFFICE.deadline.min, OFFICE.deadline.max),
  };
}

function bountyOffer(s: OfficeState, node: NodeId, rng: SeededRNG): ContractOffer {
  const risk = s.contamination[node];
  const floors = generalFloors(risk);
  return {
    id: s.nextOfferId++,
    kind: 'bounty',
    node,
    story: null,
    request: null,
    target: rng.pick(NODES[node].pool),
    pool: [...NODES[node].pool],
    risk,
    floors,
    fee: Math.round(generalFee(risk, floors) * OFFICE.bounty.feeMult),
    deadline: s.day + OFFICE.deadline.max,
  };
}

function storyOffer(s: OfficeState, id: ContractId): ContractOffer {
  const c = CONTRACTS[id];
  return {
    id: s.nextOfferId++,
    kind: 'story',
    node: c.node,
    story: id,
    request: null,
    target: null,
    pool: [],
    risk: s.contamination[c.node],
    floors: c.floors.length,
    fee: c.fee,
    deadline: null,
  };
}

// Tops the board up: open story contracts, a bounty on any badly contaminated node, general offers.
// Returns how many offers were added.
export function refillBoard(s: OfficeState, rng: SeededRNG): number {
  const before = s.board.length;
  for (const id of Object.keys(CONTRACTS) as ContractId[]) {
    if (CONTRACTS[id].unlockDay > s.day || s.storyDone.includes(id) || s.board.some((o) => o.story === id)) continue;
    s.board.push(storyOffer(s, id));
  }
  for (const node of NODE_IDS) {
    const chance = OFFICE.bountyChance[s.contamination[node]] ?? 0;
    if (chance <= 0 || s.board.some((o) => o.kind === 'bounty' && o.node === node)) continue;
    if (rng.chance(chance)) s.board.push(bountyOffer(s, node, rng));
  }
  while (s.board.filter((o) => o.kind !== 'story').length < OFFICE.boardSize) s.board.push(generalOffer(s, rng));
  return s.board.length - before;
}

// The night's contract is settled before the morning: on success the offer (and its bundle) is
// done and its node calmer; any outcome means the director has now seen the place.
export function resolveNight(s: OfficeState, offerId: number, success: boolean): NightResolution {
  const offer = s.board.find((o) => o.id === offerId);
  if (!offer) return { completed: [], fee: 0 };
  if (!s.known.includes(offer.node)) s.known.push(offer.node);
  if (!success) return { completed: [], fee: 0 };
  const done = bundleWith(s.board, offer);
  const ids = done.map((o) => o.id);
  s.board = s.board.filter((o) => !ids.includes(o.id));
  s.contamination[offer.node] = clamp(s.contamination[offer.node] - OFFICE.contamination.cleanse[offer.kind]);
  if (offer.story && !s.storyDone.includes(offer.story)) s.storyDone.push(offer.story);
  return { completed: ids, fee: done.reduce((sum, o) => sum + o.fee, 0) };
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
  for (const o of expired) bump(o.node, c.expireRise);
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
