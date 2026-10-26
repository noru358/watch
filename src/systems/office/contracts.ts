import { CONTRACTS, wisps, type FloorPlan, type SwarmPlan } from '../../data/contracts.data';
import { NODES } from '../../data/nodes.data';
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
  const plans: FloorPlan[] = [];
  for (let i = 0; i < normals; i++) {
    plans.push({
      kind: 'normal',
      enemies: g.enemiesBase + offer.risk + i,
      pool: offer.pool,
      payphone: i === payphoneAt && i < offer.floors - 1,
      swarm: swarmFor(offer.risk, i),
      seal: true,
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
