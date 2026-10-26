import { GHOSTS } from '../../../data/ghosts.data';
import type { ObjectiveKind } from '../../../types/ids';
import type { Floor, Pos } from '../types';
import { hurtSurvivor, setupRescue, updateRescue } from './rescue';
import type { ObjectiveState, Survivor } from './types';

export type { ObjectiveState, Survivor } from './types';

// Strong (non-fodder) ghosts still standing on this floor.
export function strongLeft(f: Floor): number {
  return f.enemies.filter((e) => e.hp > 0 && e.kind !== 'gumiho' && !GHOSTS[e.kind].fodder).length;
}

// `spot()` hands out a free tile in a side room (only objectives that place something call it).
export function setupObjective(kind: ObjectiveKind, spot: () => Pos): ObjectiveState {
  if (kind === 'rescue') return setupRescue(spot());
  return { kind: 'clear', done: false };
}

export function updateObjective(f: Floor, dt: number): void {
  const o = f.objective;
  if (!o) return;
  if (o.kind === 'rescue') return updateRescue(f, o, dt);
  if (!o.done && strongLeft(f) === 0) {
    o.done = true;
    f.events.push({ type: 'roomCleared', boss: false });
  }
}

// May the director take the stairs now?
export function objectiveReady(f: Floor): boolean {
  const o = f.objective;
  if (!o) return true;
  if (o.kind === 'rescue') return o.survivor.state === 'following';
  return o.done;
}

// Reaching the stairs finishes objectives that end there (the rescued person is out).
export function completeAtStairs(f: Floor): void {
  const o = f.objective;
  if (!o || o.done) return;
  o.done = true;
  if (o.kind === 'rescue') f.events.push({ type: 'objectiveDone', x: f.player.x, y: f.player.y });
}

export function survivorOf(f: Floor): Survivor | null {
  return f.objective?.kind === 'rescue' ? f.objective.survivor : null;
}

// Something on the floor struck or touched the survivor (telegraphs, fodder).
export function hurtObjective(f: Floor, amount: number): void {
  if (f.objective?.kind === 'rescue') hurtSurvivor(f, f.objective, amount);
}
