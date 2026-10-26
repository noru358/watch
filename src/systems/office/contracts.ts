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
      pool: offer.pool,
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

// Offers finished together with `offer` on a success: everything general on the same node.
// Main story contracts and named targets are only finished by taking them.
export function bundleWith(board: readonly ContractOffer[], offer: ContractOffer): ContractOffer[] {
  // Named targets (현상수배, 추격) are only finished by catching them.
  if (offer.kind !== 'general' || offer.target) return [offer];
  return [offer, ...board.filter((o) => o.id !== offer.id && o.node === offer.node && o.kind === 'general' && !o.target)];
}
