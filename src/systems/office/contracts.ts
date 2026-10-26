import { CONTRACTS, wisps, type FloorPlan, type SwarmPlan } from '../../data/contracts.data';
import { NODES } from '../../data/nodes.data';
import { REQUESTS } from '../../data/requests.data';
import { OFFICE } from '../../data/office.data';
import type { ContractOffer } from './types';

function swarmFor(risk: number, floor: number): SwarmPlan {
  const s = OFFICE.swarm;
  return wisps(Math.max(3, s.every + s.everyPerRisk * (risk + floor)), s.group, s.cap + s.capPerRisk * risk);
}

// The floors a night on this offer is played through. Pure: same offer, same plan.
export function offerFloors(offer: ContractOffer): readonly FloorPlan[] {
  if (offer.kind === 'story' && offer.story) return CONTRACTS[offer.story].floors;
  const g = OFFICE.general;
  const themes = NODES[offer.node].themes;
  const normals = offer.kind === 'bounty' ? offer.floors - 1 : offer.floors;
  const payphoneAt = offer.floors >= g.payphoneFrom ? Math.floor(offer.floors / 2) : -1;
  const goal = offerGoal(offer);
  const plans: FloorPlan[] = [];
  for (let i = 0; i < normals; i++) {
    const rescueHere = goal.kind === 'rescue' && i === goal.floor;
    plans.push({
      kind: 'normal',
      enemies: g.enemiesBase + offer.risk + i,
      pool: offer.pool,
      payphone: i === payphoneAt && i < offer.floors - 1,
      swarm: swarmFor(offer.risk, i),
      objective: rescueHere ? 'rescue' : 'clear',
      goal: rescueHere && i < offer.floors - 1,
      theme: themes[i % themes.length]!,
    });
  }
  if (offer.kind === 'bounty') {
    plans.push({
      kind: 'arena',
      enemies: OFFICE.bounty.arenaEnemiesBase + offer.risk,
      pool: offer.target ? [offer.target] : offer.pool,
      swarm: swarmFor(offer.risk, normals),
      theme: themes[normals % themes.length]!,
    });
  }
  return plans;
}

// What the contract asks and on which floor (0-based) it is done. The board shows this as the
// objective icon and the "ends on floor N" bar.
export type GoalKind = 'clear' | 'rescue' | 'arena' | 'boss';
export function offerGoal(offer: ContractOffer): { kind: GoalKind; floor: number } {
  const last = offer.floors - 1;
  if (offer.kind === 'story') return { kind: 'boss', floor: last };
  if (offer.kind === 'bounty') return { kind: 'arena', floor: last };
  const objective = offer.request ? REQUESTS[offer.request].objective : 'clear';
  if (objective === 'rescue') return { kind: 'rescue', floor: Math.min(OFFICE.rescue.goalFloor, last) };
  return { kind: 'clear', floor: last };
}

// 난이도 1..5 from what the night really holds up to its goal (not the node's contamination).
export function offerDifficulty(offer: ContractOffer): number {
  const d = OFFICE.difficulty;
  const goal = offerGoal(offer);
  let score = 0;
  offerFloors(offer).forEach((p, i) => {
    if (i > goal.floor) return;
    if (p.kind === 'boss') score += d.bossWeight;
    else score += p.enemies;
  });
  return 1 + d.steps.filter((s) => score >= s).length;
}

export function generalFee(risk: number, floors: number): number {
  const g = OFFICE.general;
  return g.feeBase + risk * g.feePerRisk + floors * g.feePerFloor;
}

export function generalFloors(risk: number): number {
  return OFFICE.general.floorsBase + Math.floor(risk / 2);
}

// Offers finished together with `offer` on a success: everything general on the same node.
// Story contracts and bounties are only finished by taking them.
export function bundleWith(board: readonly ContractOffer[], offer: ContractOffer): ContractOffer[] {
  if (offer.kind !== 'general') return [offer];
  return [offer, ...board.filter((o) => o.id !== offer.id && o.node === offer.node && o.kind === 'general')];
}
