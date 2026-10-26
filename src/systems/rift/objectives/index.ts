import { GHOSTS } from '../../../data/ghosts.data';
import type { FloorPlan } from '../../../data/contracts.data';
import type { SeededRNG } from '../../../core/SeededRNG';
import type { Floor, Pos } from '../types';
import { setupBounty, updateBounty } from './bounty';
import { setupChase, updateChase } from './chase';
import { setupFirstTrain, updateFirstTrain } from './firsttrain';
import { hurtSurvivor, setupRescue, updateRescue } from './rescue';
import type { ObjectiveState, QuarryCarry, Survivor } from './types';
import { setupWard, updateWard } from './ward';
import { OBJECTIVES } from '../../../data/objectives.data';

export type { ObjectiveState, Survivor, QuarryCarry, WardSite } from './types';

// Strong (non-fodder) ghosts still standing on this floor that 섬멸 asks for. A 괴이 소굴 pack is
// optional (you may walk past the nest), so it does not count.
export function strongLeft(f: Floor): number {
  return f.enemies.filter((e) => e.hp > 0 && e.kind !== 'gumiho' && !GHOSTS[e.kind].fodder && e.role !== 'lair').length;
}

// Where things go on a normal floor (mapgen hands these out).
export interface ObjectiveSpots {
  quiet: () => Pos; // a free tile in a side room away from the start
  nest: () => Pos; // a free tile in the side room farthest from the start
  apart: (n: number, gap: number) => Pos[]; // n tiles in different rooms, spread out
  quarry: QuarryCarry | null; // 추격: the quarry as it left the last floor
  last: boolean; // this is the contract's last floor
  rng: SeededRNG;
}

// Builds the floor's objective. A clear objective draws no RNG, so main-story maps stay the same.
export function setupObjective(f: Floor, plan: Extract<FloorPlan, { kind: 'normal' }>, at: ObjectiveSpots): ObjectiveState | null {
  const kind = plan.objective;
  const brief = plan.brief ?? { target: null, shards: 0, time: OBJECTIVES.firsttrain.time };
  switch (kind) {
    case null:
      return null;
    case 'clear':
      return { kind: 'clear', done: false };
    case 'rescue':
      return setupRescue(at.quiet());
    case 'bounty':
      return setupBounty(f, brief, at.quiet());
    case 'chase':
      return setupChase(f, brief, at.quarry, at.quiet(), at.nest(), at.last);
    case 'ward':
      return setupWard(at.apart(OBJECTIVES.ward.sites, OBJECTIVES.ward.minApart));
    case 'firsttrain':
      return setupFirstTrain(brief.time, plan.pool);
  }
}

export function updateObjective(f: Floor, dt: number, rng: SeededRNG): void {
  const o = f.objective;
  if (!o) return;
  switch (o.kind) {
    case 'rescue':
      return updateRescue(f, o, dt);
    case 'bounty':
      return updateBounty(f, o);
    case 'chase':
      return updateChase(f, o, dt);
    case 'ward':
      return updateWard(f, o, dt);
    case 'firsttrain':
      return updateFirstTrain(f, o, dt, rng);
    case 'clear':
      if (!o.done && strongLeft(f) === 0) {
        o.done = true;
        f.events.push({ type: 'roomCleared', boss: false });
      }
  }
}

// May the director take the stairs now?
export function objectiveReady(f: Floor): boolean {
  const o = f.objective;
  if (!o) return true;
  if (o.kind === 'rescue') return o.survivor.state === 'following';
  if (o.kind === 'chase') return o.done || o.fled;
  return o.done;
}

// Reaching the stairs finishes objectives that end there (the rescued person is out).
export function completeAtStairs(f: Floor): void {
  const o = f.objective;
  if (!o || o.done || o.kind !== 'rescue') return;
  o.done = true;
  f.events.push({ type: 'objectiveDone', x: f.player.x, y: f.player.y });
}

export function survivorOf(f: Floor): Survivor | null {
  return f.objective?.kind === 'rescue' ? f.objective.survivor : null;
}

// Something on the floor struck or touched the survivor (telegraphs, fodder).
export function hurtObjective(f: Floor, amount: number): void {
  if (f.objective?.kind === 'rescue') hurtSurvivor(f, f.objective, amount);
}

// The ward objective is filling a circle right now (the swarm comes faster).
export function wardCharging(f: Floor): boolean {
  return f.objective?.kind === 'ward' && f.objective.charging;
}
