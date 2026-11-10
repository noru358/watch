import { DUNGEON } from '../../data/dungeon.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { ROOMS, type RoomId } from '../../data/rooms.data';
import type { FloorTheme } from '../../types/ids';
import type { Pos, Tile } from './types';

// Floor layout only: which tiles are floor, where the rooms are and what each room is for.
// What stands in the rooms (ghosts, stairs, pickups) is placed by mapgen.ts.

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  tpl?: RoomCells; // a hand-made room (rooms.data.ts); plain rectangles have none
}

// Where things can stand in a hand-made room, by its letters.
export type SpotMark = 'e' | 't' | 's' | 'o' | '~';
export interface RoomCells {
  id: RoomId;
  mirrored: boolean;
  floor: Pos[]; // every walkable cell (tile centres)
  doors: Pos[]; // '+' cells: corridors join here
  spots: Partial<Record<SpotMark, Pos[]>>;
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
  if (room.tpl) {
    // Keep off the outline (doors), like a plain room keeps `margin` from its walls.
    const inner = room.tpl.floor.filter((p) => p.x >= room.x + margin && p.x < room.x + room.w - margin && p.y >= room.y + margin && p.y < room.y + room.h - margin);
    return rng.pick(inner.length > 0 ? inner : room.tpl.floor);
  }
  return centre(rng.int(room.x + margin, room.x + room.w - 1 - margin), rng.int(room.y + margin, room.y + room.h - 1 - margin));
}

// The middle of a room for walking distances (a hand-made room may have a prop in its centre).
export function roomMid(r: Room): Pos {
  const c = centre(r.x + Math.floor(r.w / 2), r.y + Math.floor(r.h / 2));
  if (!r.tpl) return c;
  return r.tpl.floor.reduce((best, p) => (Math.hypot(p.x - c.x, p.y - c.y) < Math.hypot(best.x - c.x, best.y - c.y) ? p : best), r.tpl.floor[0]!);
}

const templateIds = (theme: FloorTheme | undefined): RoomId[] =>
  theme ? (Object.keys(ROOMS) as RoomId[]).filter((id) => (ROOMS[id].themes as readonly FloorTheme[]).includes(theme)) : [];

// The letters of a template, flipped left–right if asked.
export function templateRows(id: RoomId, mirrored: boolean): string[] {
  const rows = ROOMS[id].rows as readonly string[];
  return mirrored ? rows.map((r) => [...r].reverse().join('')) : [...rows];
}

// Carves a hand-made room at (x, y) and lists its cells.
function carveTemplate(tiles: Tile[], room: Room, id: RoomId, mirrored: boolean, rng: SeededRNG): RoomCells {
  const cells: RoomCells = { id, mirrored, floor: [], doors: [], spots: {} };
  templateRows(id, mirrored).forEach((row, dy) => {
    [...row].forEach((ch, dx) => {
      const x = room.x + dx;
      const y = room.y + dy;
      if (ch === '#' || ch === 'p') return;
      if (ch === '?' && !rng.chance(DUNGEON.templateHalf)) return;
      carve(tiles, x, y);
      const at = centre(x, y);
      cells.floor.push(at);
      if (ch === '+') cells.doors.push(at);
      if (ch === 'e' || ch === 't' || ch === 's' || ch === 'o' || ch === '~') (cells.spots[ch] ??= []).push(at);
    });
  });
  return cells;
}

// Where a corridor leaves a room toward another: a plain room picks a random tile (as it always did,
// so plain floors keep their maps), a hand-made room its door nearest to the other room.
function anchor(room: Room, toward: Room, rng: SeededRNG): Pos {
  if (!room.tpl) return roomTile(room, rng);
  const t = roomMid(toward);
  return room.tpl.doors.reduce((best, d) => (Math.hypot(d.x - t.x, d.y - t.y) < Math.hypot(best.x - t.x, best.y - t.y) ? d : best), room.tpl.doors[0]!);
}

// Random non-overlapping rooms joined in sequence by L-shaped corridors, so every room is reachable.
// With a theme that has hand-made rooms, some rooms (never the first, the start) are one of those.
// A theme without any draws exactly the same numbers as before, so its maps do not change.
export function randomRooms(rng: SeededRNG, theme?: FloorTheme): { tiles: Tile[]; rooms: Room[] } {
  const { cols, rows, corridorWidth: cw } = DUNGEON;
  const tiles = solid();
  const rooms: Room[] = [];
  const pending: { room: Room; id: RoomId; mirrored: boolean }[] = [];
  const ids = templateIds(theme);
  for (let i = 0; i < DUNGEON.roomAttempts && rooms.length < DUNGEON.roomCount; i++) {
    let pick: { id: RoomId; mirrored: boolean } | null = null;
    if (rooms.length > 0 && ids.length > 0 && rng.chance(DUNGEON.templateChance)) {
      const id = weightedId(ids, rng);
      pick = { id, mirrored: ROOMS[id].mirror && rng.chance(0.5) };
    }
    const w = pick ? ROOMS[pick.id].rows[0].length : rng.int(DUNGEON.roomMin, DUNGEON.roomMax);
    const h = pick ? ROOMS[pick.id].rows.length : rng.int(DUNGEON.roomMin, DUNGEON.roomMax - 2);
    if (w > cols - 2 || h > rows - 2) continue;
    const room: Room = { x: rng.int(1, cols - w - 1), y: rng.int(1, rows - h - 1), w, h };
    if (rooms.some((r) => overlaps(r, room))) continue;
    rooms.push(room);
    if (pick) pending.push({ room, ...pick });
  }
  rooms.forEach((r) => {
    const p = pending.find((q) => q.room === r);
    if (p) r.tpl = carveTemplate(tiles, r, p.id, p.mirrored, rng);
    else carveRoom(tiles, r);
  });
  for (let i = 1; i < rooms.length; i++) {
    const a = anchor(rooms[i - 1]!, rooms[i]!, rng);
    const b = anchor(rooms[i]!, rooms[i - 1]!, rng);
    const ax = Math.floor(a.x);
    const ay = Math.floor(a.y);
    const bx = Math.floor(b.x);
    const by = Math.floor(b.y);
    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx) + cw - 1; x++) for (let k = 0; k < cw; k++) carve(tiles, x, ay + k);
    for (let y = Math.min(ay, by); y <= Math.max(ay, by) + cw - 1; y++) for (let k = 0; k < cw; k++) carve(tiles, bx + k, y);
  }
  return { tiles, rooms };
}

function weightedId(ids: RoomId[], rng: SeededRNG): RoomId {
  const total = ids.reduce((n, id) => n + ROOMS[id].weight, 0);
  let roll = rng.range(0, total);
  for (const id of ids) {
    roll -= ROOMS[id].weight;
    if (roll <= 0) return id;
  }
  return ids[ids.length - 1]!;
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
  const walk = (r: Room) => {
    const m = roomMid(r);
    return dist[Math.floor(m.y) * DUNGEON.cols + Math.floor(m.x)] ?? -1;
  };
  const others = rooms.length > 1 ? rooms.slice(1) : rooms;
  const exit = others.reduce((best, r) => (walk(r) > walk(best) ? r : best), others[0]!);
  const side = others.filter((r) => r !== exit);
  const treasure = side.length > 0 ? rng.pick(side) : null;
  return { start, exit, treasure, side: side.length > 0 ? side : others };
}
