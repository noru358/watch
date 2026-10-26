import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { GHOSTS } from '../src/data/ghosts.data';
import { generateFloor, NO_INPUT, stairsOpen, stepFloor, strongLeft, type Floor } from '../src/systems/rift';
import { carry, DT } from './helpers';

const sealed = { kind: 'normal', enemies: 6, pool: ['cheonyeo', 'dalgyal'], payphone: true, swarm: null, objective: 'clear', goal: false, theme: 'alley' } as const;

// Walking distance (tiles) from the start to every floor tile.
function walk(f: Floor): Int32Array {
  const d = new Int32Array(f.cols * f.rows).fill(-1);
  const s = Math.floor(f.player.y) * f.cols + Math.floor(f.player.x);
  d[s] = 0;
  const q = [s];
  for (let h = 0; h < q.length; h++) {
    const i = q[h]!;
    for (const j of [i + 1, i - 1, i + f.cols, i - f.cols]) {
      if (j < 0 || j >= d.length || d[j] !== -1 || f.tiles[j] !== 'floor') continue;
      d[j] = d[i]! + 1;
      q.push(j);
    }
  }
  return d;
}

const at = (d: Int32Array, f: Floor, p: { x: number; y: number }) => d[Math.floor(p.y) * f.cols + Math.floor(p.x)]!;

describe('floor generation: room roles', () => {
  it('the stairs sit far from the start (the farthest room), guarded, and every ghost is reachable', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const f = generateFloor(0, sealed, new SeededRNG(seed), carry());
      const d = walk(f);
      const max = Math.max(...d);
      expect(at(d, f, f.stairs!)).toBeGreaterThanOrEqual(max * 0.6);
      for (const e of f.enemies) expect(at(d, f, e)).toBeGreaterThan(0);
      const nearStairs = f.enemies.filter((e) => Math.hypot(e.x - f.stairs!.x, e.y - f.stairs!.y) < 8);
      expect(nearStairs.length).toBeGreaterThanOrEqual(1);
      expect(f.theme).toBe('alley');
    }
  });

  it('a treasure room heaps extra spirit', () => {
    const f = generateFloor(0, sealed, new SeededRNG(3), carry());
    expect(f.pickups.filter((p) => p.value > 5).length).toBeGreaterThan(0);
  });
});

describe('floor generation: the seal', () => {
  it('sealed stairs do nothing until every strong ghost is down, then open', () => {
    const rng = new SeededRNG(7);
    const f = generateFloor(0, { ...sealed, payphone: false }, rng, carry());
    f.swarm = null;
    expect(stairsOpen(f)).toBe(false);
    Object.assign(f.player, { x: f.stairs!.x, y: f.stairs!.y, prevX: f.stairs!.x, prevY: f.stairs!.y });
    f.enemies.forEach((e) => (e.state = 'idle'));
    f.enemies.forEach((e) => Object.assign(e, { x: 1.5, y: 1.5 })); // out of the way
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.status).toBe('playing');
    expect(strongLeft(f)).toBeGreaterThan(0);
    f.enemies.forEach((e) => (e.hp = 0));
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.objective?.done).toBe(true);
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.status).toBe('stairs');
  });

  it('fodder does not hold the seal', () => {
    const rng = new SeededRNG(2);
    const f = generateFloor(0, { ...sealed, enemies: 1, payphone: false }, rng, carry());
    f.enemies.forEach((e) => (e.hp = 0));
    f.enemies.push({ ...f.enemies[0]!, id: 999, kind: 'dokkaebibul', hp: GHOSTS.dokkaebibul.hp });
    f.player.iframes = 99;
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.objective?.done).toBe(true);
  });

  it('an arena ends the night when its pack is cleared', () => {
    const rng = new SeededRNG(4);
    const f = generateFloor(2, { kind: 'arena', enemies: 5, pool: ['cheonyeo'], swarm: null, theme: 'basement' }, rng, carry());
    expect(f.arena).toBe(true);
    expect(f.stairs).toBeNull();
    expect(strongLeft(f)).toBe(5);
    f.enemies.forEach((e) => (e.hp = 0));
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.status).toBe('bossDefeated');
  });
});
