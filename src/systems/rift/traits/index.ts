import type { SeededRNG } from '../../../core/SeededRNG';
import type { GhostTrait } from '../../../data/ghosts.data';
import type { Enemy, Floor } from '../types';
import { burst } from './burst';
import { deathBurst } from './deathBurst';
import { grab } from './grab';
import { guard } from './guard';
import { leap } from './leap';
import { rally } from './rally';
import { shoot } from './shoot';
import { swell } from './swell';
import { thief } from './thief';
import type { Blow, TraitPart } from './types';

export type { Blow, TraitPart } from './types';

// Ghost traits: what a ghost does besides walking up and attacking (GhostData.traits rows).
// One part per file in this folder, registered here by the row's `part` name.
const PARTS: { [K in GhostTrait['part']]: TraitPart<Extract<GhostTrait, { part: K }>> } = {
  guard,
  grab,
  leap,
  burst,
  deathBurst,
  shoot,
  rally,
  swell,
  thief,
};

const part = (t: GhostTrait): TraitPart<GhostTrait> => PARTS[t.part] as TraitPart<GhostTrait>;

export function traitTick(f: Floor, e: Enemy, dt: number, rng: SeededRNG): void {
  for (const t of e.traits) part(t).tick?.(f, e, t, dt, rng);
}

// True when a trait used up this tick of the chase (the ordinary attack and walk are skipped).
export function traitChase(f: Floor, e: Enemy, dt: number, rng: SeededRNG): boolean {
  for (const t of e.traits) if (part(t).chase?.(f, e, t, dt, rng)) return true;
  return false;
}

// True when a trait turned the blow away.
export function traitHit(f: Floor, e: Enemy, blow: Blow): boolean {
  for (const t of e.traits) if (part(t).hit?.(f, e, t, blow)) return true;
  return false;
}

export function traitDied(f: Floor, e: Enemy, rng: SeededRNG): void {
  for (const t of e.traits) part(t).died?.(f, e, t, rng);
}
