import { ROOM_SIZE } from '../../data/contracts.data';
import type { Body, World } from './types';

export function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y);
  return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}

export function clampToRoom(b: Body, radius: number): void {
  const w = ROOM_SIZE.wall;
  b.x = Math.min(Math.max(b.x, w + radius), ROOM_SIZE.width - w - radius);
  b.y = Math.min(Math.max(b.y, w + radius), ROOM_SIZE.height - w - radius);
}

export function savePrev(b: Body): void {
  b.prevX = b.x;
  b.prevY = b.y;
}

export function nextId(world: World): number {
  return world.nextId++;
}

// Nearest living enemy within range, optionally excluding some IDs.
export function nearestEnemy(world: World, x: number, y: number, range: number, exclude: readonly number[] = []) {
  let best = null as World['enemies'][number] | null;
  let bestD = range * range;
  for (const e of world.enemies) {
    if (e.hp <= 0 || exclude.includes(e.id)) continue;
    const d = dist2(x, y, e.x, e.y);
    if (d <= bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

export const ROOM_CENTER = { x: ROOM_SIZE.width / 2, y: ROOM_SIZE.height / 2 } as const;

export function isAtDoor(b: Body): boolean {
  return Math.abs(b.x - ROOM_CENTER.x) < ROOM_SIZE.doorWidth / 2 && b.y <= ROOM_SIZE.wall + 20;
}
