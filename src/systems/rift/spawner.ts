import { GHOSTS } from '../../data/ghosts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { makeEnemy } from './mapgen';
import { isFloor } from './physics';
import type { Floor } from './types';

// Swarm waves (뱀서류-lite): fodder keeps arriving from out of sight while the
// strong ghosts hold their rooms. Spawns only on tiles the flow field can reach.
export function updateSwarm(f: Floor, dt: number, rng: SeededRNG): void {
  const s = f.swarm;
  if (!s) return;
  f.swarmTimer -= dt;
  if (f.swarmTimer > 0) return;
  f.swarmTimer = s.every;
  const alive = f.enemies.filter((e) => e.kind !== 'printer' && GHOSTS[e.kind].fodder).length;
  const room = Math.min(s.group, s.cap - alive);
  const p = f.player;
  let placed = 0;
  for (let tries = 0; tries < 60 && placed < room; tries++) {
    const a = rng.range(0, Math.PI * 2);
    const d = rng.range(s.near, s.far);
    const tx = Math.floor(p.x + Math.cos(a) * d);
    const ty = Math.floor(p.y + Math.sin(a) * d);
    if (!isFloor(f, tx, ty) || (f.flow[ty * f.cols + tx] ?? -1) < 0) continue;
    makeEnemy(f, s.kind, { x: tx + 0.5, y: ty + 0.5 }).state = 'chase';
    placed++;
  }
}
