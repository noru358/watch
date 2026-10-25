import { BOSSES, GHOSTS } from '../../data/ghosts.data';
import { DUNGEON } from '../../data/dungeon.data';
import type { FloorPlan } from '../../data/contracts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { CardId, EnemyId, WeaponId } from '../../types/ids';
import { runCardHooks } from './hooks';
import type { Enemy, Floor, Pos, Stats, Tile } from './types';

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FloorCarry {
  hp: number;
  focus: number;
  loot: number;
  weapon: WeaponId;
  stats: Stats;
  cards: CardId[];
}

const overlaps = (a: Room, b: Room) =>
  a.x - 1 < b.x + b.w && b.x - 1 < a.x + a.w && a.y - 1 < b.y + b.h && b.y - 1 < a.y + a.h;

function carveRoom(tiles: Tile[], r: Room): void {
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) tiles[y * DUNGEON.cols + x] = 'floor';
}

function roomTile(room: Room, rng: SeededRNG): Pos {
  return { x: rng.int(room.x, room.x + room.w - 1), y: rng.int(room.y, room.y + room.h - 1) };
}

export function isFloor(f: Pick<Floor, 'cols' | 'rows' | 'tiles'>, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < f.cols && y < f.rows && f.tiles[y * f.cols + x] === 'floor';
}

export function makeEnemy(f: Floor, kind: EnemyId, at: Pos): Enemy {
  const boss = kind === 'printer';
  const hp = boss ? BOSSES.printer.hp : GHOSTS[kind].hp;
  const e: Enemy = {
    id: f.nextId++,
    kind,
    ...at,
    hp,
    maxHp: hp,
    awake: boss,
    windup: null,
    windupDamage: 0,
    windupParriable: false,
    dashTo: null,
    timer: boss ? 0 : GHOSTS[kind].teleportEvery,
  };
  f.enemies.push(e);
  return e;
}

function baseFloor(index: number, tiles: Tile[], start: Pos, carry: FloorCarry): Floor {
  return {
    index,
    cols: DUNGEON.cols,
    rows: DUNGEON.rows,
    tiles,
    stairs: null,
    payphone: null,
    player: { ...start, hp: carry.hp, facing: { x: 0, y: -1 }, focus: carry.focus, combo: 0, bare: 0, shield: 0, darkness: 0 },
    enemies: [],
    pickups: [],
    boss: null,
    weapon: carry.weapon,
    stats: carry.stats,
    cards: [...carry.cards],
    turn: 0,
    loot: carry.loot,
    status: 'playing',
    nextId: 1,
    events: [],
  };
}

// Random rooms joined in sequence by L-shaped corridors, so every room is reachable.
function normalFloor(index: number, plan: Extract<FloorPlan, { kind: 'normal' }>, rng: SeededRNG, carry: FloorCarry): Floor {
  const { cols, rows } = DUNGEON;
  const tiles: Tile[] = new Array(cols * rows).fill('wall');
  const rooms: Room[] = [];
  for (let i = 0; i < DUNGEON.roomAttempts && rooms.length < DUNGEON.roomCount; i++) {
    const w = rng.int(DUNGEON.roomMin, DUNGEON.roomMax);
    const h = rng.int(DUNGEON.roomMin - 1, DUNGEON.roomMax - 2);
    const room = { x: rng.int(1, cols - w - 1), y: rng.int(1, rows - h - 1), w, h };
    if (!rooms.some((r) => overlaps(r, room))) rooms.push(room);
  }
  rooms.forEach((r) => carveRoom(tiles, r));
  for (let i = 1; i < rooms.length; i++) {
    const a = roomTile(rooms[i - 1]!, rng);
    const b = roomTile(rooms[i]!, rng);
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) tiles[a.y * cols + x] = 'floor';
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) tiles[y * cols + b.x] = 'floor';
  }

  const first = rooms[0]!;
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
  const others = rooms.length > 1 ? rooms.slice(1) : rooms;
  const f = baseFloor(index, tiles, start, carry);
  f.stairs = free([rooms[rooms.length - 1]!]);
  if (plan.payphone) f.payphone = free(others);
  for (let i = 0; i < plan.enemies; i++) makeEnemy(f, rng.pick(plan.pool), free(others));
  for (let i = 0; i < DUNGEON.spiritPickupsPerFloor; i++) f.pickups.push({ ...free(rooms), value: DUNGEON.spiritPickupValue });
  return f;
}

// One big room: the director enters at the bottom, the source waits at the top.
function bossFloor(index: number, plan: Extract<FloorPlan, { kind: 'boss' }>, carry: FloorCarry): Floor {
  const { cols, rows, bossRoom } = DUNGEON;
  const tiles: Tile[] = new Array(cols * rows).fill('wall');
  const room = { x: Math.floor((cols - bossRoom.w) / 2), y: Math.floor((rows - bossRoom.h) / 2), w: bossRoom.w, h: bossRoom.h };
  carveRoom(tiles, room);
  const cx = room.x + Math.floor(room.w / 2);
  const f = baseFloor(index, tiles, { x: cx, y: room.y + room.h - 1 }, carry);
  const boss = makeEnemy(f, plan.boss, { x: cx, y: room.y + 1 });
  const data = BOSSES[plan.boss];
  f.boss = { id: boss.id, phase: 1, lineTimer: data.lineEvery, summonTimer: data.summonEvery };
  return f;
}

export function generateFloor(index: number, plan: FloorPlan, rng: SeededRNG, carry: FloorCarry): Floor {
  const f = plan.kind === 'boss' ? bossFloor(index, plan, carry) : normalFloor(index, plan, rng, carry);
  runCardHooks(f, 'onRoomEnter', {});
  return f;
}
