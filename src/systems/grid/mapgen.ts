import { GRID_ENEMIES, GRID_ENEMY_POOL, GRID_MAP } from '../../data/grid.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { GridCardId } from '../../types/ids';
import type { GridFloor, GridStats, Pos, Tile } from './types';

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlaps = (a: Room, b: Room) =>
  a.x - 1 < b.x + b.w && b.x - 1 < a.x + a.w && a.y - 1 < b.y + b.h && b.y - 1 < a.y + a.h;

function carve(tiles: Tile[], cols: number, x: number, y: number): void {
  tiles[y * cols + x] = 'floor';
}

function roomTile(room: Room, rng: SeededRNG): Pos {
  return { x: rng.int(room.x, room.x + room.w - 1), y: rng.int(room.y, room.y + room.h - 1) };
}

// Random rooms joined in sequence by L-shaped corridors, so every room is reachable.
export function generateFloor(
  floor: number,
  rng: SeededRNG,
  carry: { hp: number; stats: GridStats; cards: GridCardId[]; loot: number; focus: number },
): GridFloor {
  const { cols, rows } = GRID_MAP;
  const tiles: Tile[] = new Array(cols * rows).fill('wall');
  const rooms: Room[] = [];
  for (let i = 0; i < GRID_MAP.roomAttempts && rooms.length < GRID_MAP.roomCount; i++) {
    const w = rng.int(GRID_MAP.roomMin, GRID_MAP.roomMax);
    const h = rng.int(GRID_MAP.roomMin - 1, GRID_MAP.roomMax - 2);
    const room = { x: rng.int(1, cols - w - 1), y: rng.int(1, rows - h - 1), w, h };
    if (rooms.some((r) => overlaps(r, room))) continue;
    rooms.push(room);
  }
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(tiles, cols, x, y);
  for (let i = 1; i < rooms.length; i++) {
    const a = roomTile(rooms[i - 1]!, rng);
    const b = roomTile(rooms[i]!, rng);
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) carve(tiles, cols, x, a.y);
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) carve(tiles, cols, b.x, y);
  }

  const first = rooms[0]!;
  const last = rooms[rooms.length - 1]!;
  const start = { x: first.x + Math.floor(first.w / 2), y: first.y + Math.floor(first.h / 2) };
  const used = new Set<string>([`${start.x},${start.y}`]);
  const free = (from: Room[]): Pos => {
    for (let i = 0; i < 50; i++) {
      const p = roomTile(rng.pick(from), rng);
      if (!used.has(`${p.x},${p.y}`)) {
        used.add(`${p.x},${p.y}`);
        return p;
      }
    }
    return roomTile(rng.pick(from), rng);
  };
  const stairs = free([last]);
  const others = rooms.length > 1 ? rooms.slice(1) : rooms;

  const f: GridFloor = {
    floor,
    cols,
    rows,
    tiles,
    stairs,
    player: { ...start, hp: carry.hp, facing: { x: 0, y: 1 }, focus: carry.focus, darkness: 0 },
    enemies: [],
    pickups: [],
    stats: carry.stats,
    cards: [...carry.cards],
    turn: 0,
    loot: carry.loot,
    status: 'playing',
    nextId: 1,
    events: [],
  };
  const pool = GRID_ENEMY_POOL[Math.min(floor, GRID_ENEMY_POOL.length - 1)]!;
  const count = GRID_MAP.enemiesPerFloor[Math.min(floor, GRID_MAP.enemiesPerFloor.length - 1)]!;
  for (let i = 0; i < count; i++) {
    const kind = rng.pick(pool);
    const p = free(others);
    f.enemies.push({ id: f.nextId++, kind, ...p, hp: GRID_ENEMIES[kind].hp, awake: false, windup: null, dashTo: null, timer: GRID_ENEMIES[kind].teleportEvery });
  }
  for (let i = 0; i < GRID_MAP.spiritPickupsPerFloor; i++) f.pickups.push({ ...free(rooms), value: GRID_MAP.spiritPickupValue });
  return f;
}

export function isFloor(f: GridFloor, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < f.cols && y < f.rows && f.tiles[y * f.cols + x] === 'floor';
}
