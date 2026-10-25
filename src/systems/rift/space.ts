import { isFloor } from './mapgen';
import type { Dir, Enemy, Floor, Pos } from './types';

export const DIRS: readonly Dir[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export const dist = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const same = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;

export function enemyAt(f: Floor, x: number, y: number): Enemy | undefined {
  return f.enemies.find((e) => e.hp > 0 && e.x === x && e.y === y);
}

export function blocked(f: Floor, x: number, y: number): boolean {
  return !isFloor(f, x, y) || !!enemyAt(f, x, y) || (f.player.x === x && f.player.y === y);
}

// Free tiles next to `at`, in a fixed order.
export function freeNeighbours(f: Floor, at: Pos): Pos[] {
  return DIRS.map((d) => ({ x: at.x + d.x, y: at.y + d.y })).filter((t) => !blocked(f, t.x, t.y));
}

export function stepToward(f: Floor, e: Enemy): void {
  const best = freeNeighbours(f, e).sort((a, b) => dist(a, f.player) - dist(b, f.player))[0];
  if (best && dist(best, f.player) < dist(e, f.player)) {
    e.x = best.x;
    e.y = best.y;
  }
}
