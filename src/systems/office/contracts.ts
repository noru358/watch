import { CONTRACTS, wisps, type FloorPlan, type SwarmPlan } from '../../data/contracts.data';
import { MODIFIERS } from '../../data/modifiers.data';
import { NODES } from '../../data/nodes.data';
import { DEEP, GENERAL_OBJECTIVES, OBJECTIVES } from '../../data/objectives.data';
import { OFFICE } from '../../data/office.data';
import type { ObjectiveKind } from '../../types/ids';
import type { ContractOffer } from './types';

// A contract → its floors, goal, 난이도 and fee (docs/rules/office.md). Pure: same offer, same answer.

function swarmFor(offer: ContractOffer, floor: number): SwarmPlan {
  const s = OFFICE.swarm;
  let every = Math.max(3, s.every + s.everyPerRisk * (offer.risk + floor));
  let cap = s.cap + s.capPerRisk * offer.risk;
  for (const m of offer.mods) {
    const sw = MODIFIERS[m].swarm;
    if (!sw) continue;
    every *= sw.everyMult;
    cap = Math.round(cap * sw.capMult);
  }
  return wisps(Math.max(2, every), s.group, cap);
}

// The floor a generated objective ends on.
export function goalFloorFor(objective: ObjectiveKind, floors: number, roll: () => number): number {
  const goal = GENERAL_OBJECTIVES[objective].goal;
  const last = floors - 1;
  if (goal === 'last' || goal === 'any') return last;
  if (goal === 'random') return Math.min(last, Math.floor(roll() * floors));
  return Math.min(goal, last);
}

// The floors a night on this offer is played through.
// 일반 의뢰: the objective sits on its goal floor (추격: on every floor until it is caught), every other
// floor is 섬멸. Floors past the goal are "deep": +strong ghosts, richer, the last hides a shard.
export function offerFloors(offer: ContractOffer): readonly FloorPlan[] {
  if (offer.kind === 'main' && offer.story) return CONTRACTS[offer.story].floors;
  const objective = offer.objective ?? 'clear';
  const themes = NODES[offer.node].themes;
  const payphoneAt = offer.floors >= OFFICE.general.payphoneFrom ? Math.floor(offer.floors / 2) : -1;
  const chase = objective === 'chase';
  const plans: FloorPlan[] = [];
  for (let i = 0; i < offer.floors; i++) {
    const here = chase || i === offer.goalFloor;
    const deep = chase ? 0 : Math.max(0, i - offer.goalFloor);
    const train = here && objective === 'firsttrain';
    const T = OBJECTIVES.firsttrain;
    plans.push({
      kind: 'normal',
      enemies: train ? T.startEnemies + offer.risk : OFFICE.general.enemiesBase + offer.risk + i + deep * DEEP.enemiesPerFloor,
      pool: offer.mods.map((m) => MODIFIERS[m].pool).find((p) => p) ?? offer.pool,
      payphone: i === payphoneAt && i < offer.floors - 1 && i !== offer.goalFloor,
      swarm: swarmFor(offer, i),
      objective: here ? objective : 'clear',
      goal: here && i < offer.floors - 1,
      theme: themes[i % themes.length]!,
      mods: offer.mods,
      deep,
      brief: here
        ? { target: offer.target ? { ghost: offer.target.ghost, level: offer.target.level } : null, shards: offer.shards, time: T.time + T.timePerRisk * offer.risk }
        : undefined,
    });
  }
  return plans;
}

// What the contract asks and on which floor (0-based) it is done. The board shows this as the
// objective icon and the "ends on floor N" bar.
export type GoalKind = ObjectiveKind | 'boss';
export function offerGoal(offer: ContractOffer): { kind: GoalKind; floor: number } {
  if (offer.kind === 'main') return { kind: 'boss', floor: offer.floors - 1 };
  return { kind: offer.objective ?? 'clear', floor: offer.goalFloor };
}

// 난이도 1..5 from what the night really holds up to its goal (not the node's contamination):
// strong ghosts up to the goal floor + the objective's points (+ the target's level) + modifiers.
export function offerDifficulty(offer: ContractOffer): number {
  const d = OFFICE.difficulty;
  const goal = offerGoal(offer);
  let score = 0;
  offerFloors(offer).forEach((p, i) => {
    if (i > goal.floor) return;
    if (p.kind === 'boss') score += d.bossWeight;
    else score += p.enemies;
  });
  if (offer.kind === 'general' && offer.objective) {
    score += GENERAL_OBJECTIVES[offer.objective].difficulty + (offer.target?.level ?? 0) * d.bountyPerLevel;
    for (const m of offer.mods) score += MODIFIERS[m].difficulty;
  }
  return 1 + d.steps.filter((s) => score >= s).length;
}

// 일반 의뢰 fee: (base + 난이도 × per + floors × per) × objective × (1 + modifier bonuses).
export function offerFee(offer: ContractOffer): number {
  if (offer.kind === 'main' && offer.story) return CONTRACTS[offer.story].fee;
  const g = OFFICE.general;
  const rule = GENERAL_OBJECTIVES[offer.objective ?? 'clear'];
  const bonus = offer.mods.reduce((sum, m) => sum + MODIFIERS[m].feeBonus, 0);
  const level = (offer.target?.level ?? 0) * g.feePerTargetLevel;
  const raw = (g.feeBase + offerDifficulty(offer) * g.feePerDifficulty + offer.floors * g.feePerFloor) * rule.feeMult * (1 + bonus + level);
  return Math.round(raw / 10) * 10;
}

// ---- 합동 출동 (docs/rules/office.md) ----

// One objective of the night: which offer, on which floor (-1 = any floor, 추격), what it pays.
export interface NightGoal {
  offerId: number;
  floor: number;
  fee: number;
}
export interface NightPlanned {
  floors: readonly FloorPlan[];
  goals: readonly NightGoal[];
}

const soloOnly = (o: ContractOffer) => o.kind !== 'general' || o.objective === 'chase';

// The offer whose length (and modifiers) the whole night takes: the longest, then the oldest.
export function jointLead(offers: readonly ContractOffer[]): ContractOffer {
  return [...offers].sort((a, b) => b.floors - a.floors || a.id - b.id)[0]!;
}

// Goal floor of every offer in a joint night: the lead keeps its own, the rest in goal order,
// each pushed one floor down while its floor is taken. null if it does not fit.
function assignGoals(offers: readonly ContractOffer[]): { offer: ContractOffer; floor: number }[] | null {
  const lead = jointLead(offers);
  const rest = offers.filter((o) => o !== lead).sort((a, b) => a.goalFloor - b.goalFloor || a.id - b.id);
  const taken = new Set<number>();
  const out: { offer: ContractOffer; floor: number }[] = [];
  for (const o of [lead, ...rest]) {
    let f = o.goalFloor;
    while (taken.has(f)) f++;
    if (f >= lead.floors + OFFICE.joint.extraFloors) return null;
    taken.add(f);
    out.push({ offer: o, floor: f });
  }
  return out;
}

// Can these offers go out together? Same district, general, none of them 추격, within the limits.
export function canJoin(offers: readonly ContractOffer[]): boolean {
  if (offers.length <= 1) return true;
  if (offers.length > OFFICE.joint.max) return false;
  if (offers.some(soloOnly) || new Set(offers.map((o) => o.node)).size > 1) return false;
  return assignGoals(offers) !== null;
}

// The floors and goals of a night on one or more offers.
// One offer: exactly offerFloors. Several: the lead's night stretched to fit, each offer's objective
// floor taken from its own plan (its modifiers on that floor only, the lead's everywhere).
export function planNight(offers: readonly ContractOffer[]): NightPlanned {
  if (offers.length === 1) {
    const o = offers[0]!;
    return { floors: offerFloors(o), goals: [{ offerId: o.id, floor: o.objective === 'chase' ? -1 : offerGoal(o).floor, fee: o.fee }] };
  }
  const goals = assignGoals(offers);
  if (!goals || !canJoin(offers)) throw new Error('These offers cannot go out together');
  const lead = jointLead(offers);
  const length = Math.max(lead.floors, ...goals.map((g) => g.floor + 1));
  const lastGoal = Math.max(...goals.map((g) => g.floor));
  const floors = [...offerFloors({ ...lead, floors: length, goalFloor: lastGoal, objective: 'clear', target: null })];
  for (const { offer, floor } of goals) {
    const mods = [...new Set([...lead.mods, ...offer.mods])];
    floors[floor] = offerFloors({ ...offer, mods, floors: length, goalFloor: floor })[floor]!;
  }
  return { floors, goals: goals.map(({ offer, floor }) => ({ offerId: offer.id, floor, fee: offer.fee })) };
}

// Other offers that could join `offer` tonight (same district, and the set still fits).
export function joinCandidates(board: readonly ContractOffer[], offer: ContractOffer): ContractOffer[] {
  if (soloOnly(offer)) return [];
  return board.filter((o) => o.id !== offer.id && canJoin([offer, o]));
}
