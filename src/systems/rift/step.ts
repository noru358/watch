import { DUNGEON } from '../../data/dungeon.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { updateEnemies } from './enemies';
import { completeAtStairs, objectiveReady, strongLeft, updateObjective } from './objectives';
import { dist, savePrev, updateFlow } from './physics';
import { updatePlayer } from './player';
import { updateSwarm } from './spawner';
import { runHooks } from './hooks';
import { updateShots, updateZones } from './skills';
import { updateLair } from './lair';
import type { Floor, RiftInput } from './types';

function updatePickups(f: Floor, dt: number): void {
  const p = f.player;
  const keep = [];
  for (const k of f.pickups) {
    const d = dist(k, p);
    if (d <= p.r + 0.3) {
      if (k.shard) {
        f.shards += 1;
        f.events.push({ type: 'shardCollected', x: k.x, y: k.y });
        continue;
      }
      f.loot += k.value;
      f.events.push({ type: 'pickupCollected', x: k.x, y: k.y, value: k.value });
      continue;
    }
    if (d <= f.stats.magnet) {
      k.x += ((p.x - k.x) / d) * DUNGEON.pickupSpeed * dt;
      k.y += ((p.y - k.y) / d) * DUNGEON.pickupSpeed * dt;
    }
    keep.push(k);
  }
  f.pickups = keep;
}

export { strongLeft };

// The stairs open once the floor's objective allows it (docs/design/2-night/objectives.md).
export function stairsOpen(f: Floor): boolean {
  return objectiveReady(f);
}

// The floor's objective, and a 괴이 소굴 if there is one.
function updateGoal(f: Floor, dt: number, rng: SeededRNG): void {
  updateObjective(f, dt, rng);
  updateLair(f);
}

function updateExits(f: Floor): void {
  const p = f.player;
  if (f.stairs && stairsOpen(f) && dist(p, f.stairs) <= DUNGEON.touchRange) {
    completeAtStairs(f);
    runHooks(f, 'onFloorEnd', {});
    f.status = 'stairs';
  }
  if (!f.payphone) return;
  const d = dist(p, f.payphone);
  if (f.payphoneArmed && d <= DUNGEON.touchRange) {
    f.payphoneArmed = false;
    f.status = 'payphone';
  } else if (!f.payphoneArmed && d > DUNGEON.touchRange * 2) f.payphoneArmed = true;
}

// One fixed-step tick of a floor. Pure apart from mutating `f` and `rng`.
export function stepFloor(f: Floor, input: RiftInput, dt: number, rng: SeededRNG): void {
  if (f.status !== 'playing') return;
  f.time += dt;
  savePrev(f.player);
  for (const e of f.enemies) savePrev(e);
  updateFlow(f);
  updatePlayer(f, input, dt, rng);
  updateEnemies(f, dt, rng);
  if (f.status !== 'playing') return;
  updateGoal(f, dt, rng);
  if (f.status !== 'playing') return;
  updateSwarm(f, dt, rng);
  updateShots(f, dt, rng);
  updateZones(f, dt, rng);
  updatePickups(f, dt);
  updateExits(f);
}

// The director answered the payphone prompt.
// Giving up the contract from the pause menu counts as a failed night (same penalties as falling).
export function giveUp(f: Floor): void {
  if (f.status === 'playing') f.status = 'dead';
}

export function answerPayphone(f: Floor, goHome: boolean): void {
  if (f.status !== 'payphone') return;
  f.status = goHome ? 'extracted' : 'playing';
}
