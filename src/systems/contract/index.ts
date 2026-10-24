import { CONTRACTS, type Wave } from '../../data/contracts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { ContractId, RoomKind } from '../../types/ids';

export interface RoomPlan {
  kind: RoomKind;
  waves: Wave[];
}

// Turns a contract's layout into concrete rooms, drawing combat waves by tier.
export function buildRoomPlan(contractId: ContractId, rng: SeededRNG): RoomPlan[] {
  const c = CONTRACTS[contractId];
  let combatIndex = 0;
  return c.layout.map((kind) => {
    if (kind !== 'combat') return { kind, waves: [] };
    const tiers = c.combatTierByIndex;
    const tier = tiers[Math.min(combatIndex, tiers.length - 1)] ?? 0;
    combatIndex += 1;
    const pool = c.wavePools[Math.min(tier, c.wavePools.length - 1)] ?? [];
    return { kind, waves: [...rng.pick(pool)] };
  });
}

export function contractFee(contractId: ContractId): number {
  return CONTRACTS[contractId].fee;
}
