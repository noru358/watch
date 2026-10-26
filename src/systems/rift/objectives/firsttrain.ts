import { OBJECTIVES } from '../../../data/objectives.data';
import type { SeededRNG } from '../../../core/SeededRNG';
import type { GhostId } from '../../../types/ids';
import { makeEnemy } from '../enemyFactory';
import { isFloor } from '../physics';
import type { Floor } from '../types';
import type { ObjectiveState } from './types';

type Train = Extract<ObjectiveState, { kind: 'firsttrain' }>;
const T = OBJECTIVES.firsttrain;

// 첫차까지 (docs/rules/floor.md): hold out until the first train. A strong ghost walks in from far
// away every so often and the swarm cap grows; when time is up the stairs (the platform) open.
export function setupFirstTrain(time: number, pool: readonly GhostId[]): Train {
  return { kind: 'firsttrain', done: false, left: time, total: time, spawnT: T.spawnEvery, growT: T.capGrowthEvery, pool };
}

export function updateFirstTrain(f: Floor, o: Train, dt: number, rng: SeededRNG): void {
  if (o.done) return;
  o.left -= dt;
  o.spawnT -= dt;
  o.growT -= dt;
  if (o.growT <= 0 && f.swarm) {
    o.growT = T.capGrowthEvery;
    f.swarm.cap += 1;
  }
  if (o.spawnT <= 0) {
    o.spawnT = T.spawnEvery;
    const p = f.player;
    for (let tries = 0; tries < 80; tries++) {
      const x = rng.int(1, f.cols - 2);
      const y = rng.int(1, f.rows - 2);
      if (!isFloor(f, x, y) || Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) < 10 || (f.flow[y * f.cols + x] ?? -1) < 0) continue;
      makeEnemy(f, rng.pick(o.pool), { x: x + 0.5, y: y + 0.5 }).state = 'chase';
      break;
    }
  }
  if (o.left <= 0) {
    o.left = 0;
    o.done = true;
    f.events.push({ type: 'objectiveDone', x: f.player.x, y: f.player.y });
  }
}
