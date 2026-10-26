import { DUNGEON } from '../../data/dungeon.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { Pos, Tile } from './types';

// Floor layout only: which tiles are floor, where the rooms are and what each room is for.
// What stands in the rooms (ghosts, stairs, pickups) is placed by mapgen.ts.

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Start = where the director arrives; exit = farthest walk from the start (stairs + guards);
// treasure = a side room with a spirit heap (null if there is no side room); side = every other room.
export interface RoomRoles {
  start: Pos;
  exit: Room;
  treasure: Room | null;
  side: Room[];
}

const overlaps = (a: Room, b: Room) =>
  a.x - 2 < b.x + b.w && b.x - 2 < a.x + a.w && a.y - 2 < b.y + b.h && b.y - 2 < a.y + a.h;

function carve(tiles: Tile[], x: number, y: number): void {
  if (x > 0 && y > 0 && x < DUNGEON.cols - 1 && y < DUNGEON.rows - 1) tiles[y * DUNGEON.cols + x] = 'floor';
}

function carveRoom(tiles: Tile[], r: Room): void {
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(tiles, x, y);
}

const solid = (): Tile[] => new Array(DUNGEON.cols * DUNGEON.rows).fill('wall');

export const centre = (x: number, y: number): Pos => ({ x: x + 0.5, y: y + 0.5 });

export function roomTile(room: Room, rng: SeededRNG, margin = 1): Pos {
  return centre(rng.int(room.x + margin, room.x + room.w - 1 - margin), rng.int(room.y + margin, room.y + room.h - 1 - margin));
}

// Random non-overlapping rooms joined in sequence by L-shaped corridors, so every room is reachable.
export function randomRooms(rng: SeededRNG): { tiles: Tile[]; rooms: Room[] } {
  const { cols, rows, corridorWidth: cw } = DUNGEON;
  const tiles = solid();
  const rooms: Room[] = [];
  for (let i = 0; i < DUNGEON.roomAttempts && rooms.length < DUNGEON.roomCount; i++) {
    const w = rng.int(DUNGEON.roomMin, DUNGEON.roomMax);
    const h = rng.int(DUNGEON.roomMin, DUNGEON.roomMax - 2);
    const room = { x: rng.int(1, cols - w - 1), y: rng.int(1, rows - h - 1), w, h };
    if (!rooms.some((r) => overlaps(r, room))) rooms.push(room);
  }
  rooms.forEach((r) => carveRoom(tiles, r));
  for (let i = 1; i < rooms.length; i++) {
    const a = roomTile(rooms[i - 1]!, rng);
    const b = roomTile(rooms[i]!, rng);
    const ax = Math.floor(a.x);
    const ay = Math.floor(a.y);
    const bx = Math.floor(b.x);
    const by = Math.floor(b.y);
    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx) + cw - 1; x++) for (let k = 0; k < cw; k++) carve(tiles, x, ay + k);
    for (let y = Math.min(ay, by); y <= Math.max(ay, by) + cw - 1; y++) for (let k = 0; k < cw; k++) carve(tiles, bx + k, y);
  }
  return { tiles, rooms };
}

// One room of the given size in the middle of the map (boss and bounty floors).
export function bigRoom(size: { w: number; h: number }): { tiles: Tile[]; room: Room } {
  const tiles = solid();
  const room = { x: Math.floor((DUNGEON.cols - size.w) / 2), y: Math.floor((DUNGEON.rows - size.h) / 2), w: size.w, h: size.h };
  carveRoom(tiles, room);
  return { tiles, room };
}

// Tile distances from `from` over floor tiles (-1 = unreachable).
export function distances(tiles: Tile[], from: Pos): Int32Array {
  const { cols, rows } = DUNGEON;
  const d = new Int32Array(cols * rows).fill(-1);
  const start = Math.floor(from.y) * cols + Math.floor(from.x);
  d[start] = 0;
  const q = [start];
  for (let h = 0; h < q.length; h++) {
    const i = q[h]!;
    const x = i % cols;
    for (const j of [i + 1, i - 1, i + cols, i - cols]) {
      if (j < 0 || j >= cols * rows || d[j] !== -1 || tiles[j] !== 'floor') continue;
      if ((j === i + 1 && x === cols - 1) || (j === i - 1 && x === 0)) continue;
      d[j] = d[i]! + 1;
      q.push(j);
    }
  }
  return d;
}

// The first room is the start; the exit is the room farthest to walk to; one side room holds treasure.
export function assignRoles(tiles: Tile[], rooms: Room[], rng: SeededRNG): RoomRoles {
  const first = rooms[0]!;
  const start = centre(first.x + Math.floor(first.w / 2), first.y + Math.floor(first.h / 2));
  const dist = distances(tiles, start);
  const walk = (r: Room) => dist[Math.floor(r.y + r.h / 2) * DUNGEON.cols + Math.floor(r.x + r.w / 2)] ?? -1;
  const others = rooms.length > 1 ? rooms.slice(1) : rooms;
  const exit = others.reduce((best, r) => (walk(r) > walk(best) ? r : best), others[0]!);
  const side = others.filter((r) => r !== exit);
  const treasure = side.length > 0 ? rng.pick(side) : null;
  return { start, exit, treasure, side: side.length > 0 ? side : others };
}
