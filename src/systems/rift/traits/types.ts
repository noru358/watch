import type { SeededRNG } from '../../../core/SeededRNG';
import type { GhostTrait } from '../../../data/ghosts.data';
import type { HitKind } from '../combat';
import type { Enemy, Floor } from '../types';

// A blow about to land on a ghost, as its traits see it (before damage and on-hit effects).
export interface Blow {
  kind: HitKind;
  empowered: boolean; // a 받아치기 / focus strike / critical
  dir: { x: number; y: number }; // the way the blow travels (attacker → ghost); 0,0 = no direction
}

// One ghost trait (a row in GhostData.traits). Every member is optional: a part fills in what it needs.
// Parts keep their own numbers in `e.vars` and must stay deterministic (rng passed in, no Math.random).
export interface TraitPart<T extends GhostTrait> {
  // Every tick the ghost is alive, whatever its state (turning, growing, timers).
  tick?(f: Floor, e: Enemy, t: T, dt: number, rng: SeededRNG): void;
  // While chasing, before the ghost's ordinary attack and walk. Return true to take over this tick.
  chase?(f: Floor, e: Enemy, t: T, dt: number, rng: SeededRNG): boolean;
  // A blow is about to land. Return true to turn it away (no damage, no on-hit effects).
  hit?(f: Floor, e: Enemy, t: T, blow: Blow): boolean;
  // The ghost was just killed (its drop is already on the floor).
  died?(f: Floor, e: Enemy, t: T, rng: SeededRNG): void;
}
