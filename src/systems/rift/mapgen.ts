import { BOSSES, GHOSTS } from '../../data/ghosts.data';
import { DUNGEON } from '../../data/dungeon.data';
import { EXORCISTS } from '../../data/protagonist.data';
import type { FloorPlan } from '../../data/contracts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { CardId, EnemyId, WeaponId } from '../../types/ids';
import { runCardHooks } from './hooks';
import { isFloor } from './physics';
import type { Enemy, Floor, Pos, Stats, Tile } from './types';

export { isFloor };

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
  a.x - 2 < b.x + b.w && b.x - 2 < a.x + a.w && a.y - 2 < b.y + b.h && b.y - 2 < a.y + a.h;

function carve(tiles: Tile[], x: number, y: number): void {
  if (x > 0 && y > 0 && x < DUNGEON.cols - 1 && y < DUNGEON.rows - 1) tiles[y * DUNGEON.cols + x] = 'floor';
}

function carveRoom(tiles: Tile[], r: Room): void {
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(tiles, x, y);
}

const centre = (x: number, y: number): Pos => ({ x: x + 0.5, y: y + 0.5 });

function roomTile(room: Room, rng: SeededRNG, margin = 1): Pos {
  return centre(rng.int(room.x + margin, room.x + room.w - 1 - margin), rng.int(room.y + margin, room.y + room.h - 1 - margin));
}

export function makeEnemy(f: Floor, kind: EnemyId, at: Pos): Enemy {
  const boss = kind === 'gumiho';
  const hp = boss ? BOSSES[kind].hp : GHOSTS[kind].hp;
  const e: Enemy = {
    id: f.nextId++,
    kind,
    x: at.x,
    y: at.y,
    prevX: at.x,
    prevY: at.y,
    r: boss ? BOSSES[kind].radius : GHOSTS[kind].radius,
    hp,
    maxHp: hp,
    state: boss ? 'chase' : 'idle',
    timer: 0,
    teles: [],
    warpTimer: boss ? 0 : GHOSTS[kind].teleportEvery,
    warpTo: null,
    knockX: 0,
    knockY: 0,
    face: 1,
  };
  f.enemies.push(e);
  return e;
}

function baseFloor(index: number, tiles: Tile[], start: Pos, carry: FloorCarry, plan: FloorPlan): Floor {
  const d = EXORCISTS.director;
  return {
    index,
    cols: DUNGEON.cols,
    rows: DUNGEON.rows,
    tiles,
    theme: plan.theme,
    stairs: null,
    seal: plan.kind === 'normal' && plan.seal,
    sealOpen: false,
    arena: plan.kind === 'arena',
    payphone: null,
    payphoneArmed: true,
    player: {
      ...start,
      prevX: start.x,
      prevY: start.y,
      r: d.radius,
      hp: carry.hp,
      aim: -Math.PI / 2,
      moving: false,
      swingT: 0,
      swingFx: 99,
      combo: 0,
      comboT: 0,
      dashT: 0,
      dashCd: 0,
      dashX: 0,
      dashY: 0,
      iframes: 0,
      drawCd: 0,
      drawFx: 99,
      drawKind: 'slash',
      drawT: 0,
      drawAim: 0,
      countered: [],
      focus: carry.focus,
      bare: 0,
      shield: 0,
      darkness: 0,
    },
    enemies: [],
    pickups: [],
    boss: null,
    swarm: plan.swarm,
    swarmTimer: plan.swarm ? plan.swarm.every / 2 : 0,
    weapon: carry.weapon,
    stats: carry.stats,
    cards: [...carry.cards],
    time: 0,
    loot: carry.loot,
    status: 'playing',
    nextId: 1,
    flow: new Int16Array(DUNGEON.cols * DUNGEON.rows).fill(-1),
    flowFrom: -1,
    events: [],
  };
}

// Tile distances from `from` over floor tiles (-1 = unreachable).
function distances(tiles: Tile[], from: Pos): Int32Array {
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

// Random rooms joined in sequence by L-shaped corridors, so every room is reachable.
// Room roles: the start room; the exit room (farthest walk from the start: stairs + guards);
// a treasure room (a heap of spirit); everything else holds the rest of the strong ghosts.
function normalFloor(index: number, plan: Extract<FloorPlan, { kind: 'normal' }>, rng: SeededRNG, carry: FloorCarry): Floor {
  const { cols, rows, corridorWidth: cw } = DUNGEON;
  const tiles: Tile[] = new Array(cols * rows).fill('wall');
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

  const first = rooms[0]!;
  const start = centre(first.x + Math.floor(first.w / 2), first.y + Math.floor(first.h / 2));
  const dist = distances(tiles, start);
  const walk = (r: Room) => dist[Math.floor(r.y + r.h / 2) * cols + Math.floor(r.x + r.w / 2)] ?? -1;
  const others = rooms.length > 1 ? rooms.slice(1) : rooms;
  const exit = others.reduce((best, r) => (walk(r) > walk(best) ? r : best), others[0]!);
  const side = others.filter((r) => r !== exit);
  const treasure = side.length > 0 ? rng.pick(side) : null;
  const fill = side.length > 0 ? side : others;

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
  const f = baseFloor(index, tiles, start, carry, plan);
  f.stairs = free([exit]);
  if (plan.payphone) f.payphone = free(fill);
  for (let i = 0; i < plan.enemies; i++) makeEnemy(f, rng.pick(plan.pool), free(i < DUNGEON.exitGuards ? [exit] : fill));
  for (let i = 0; i < DUNGEON.spiritPickupsPerFloor; i++) f.pickups.push({ ...free(rooms), value: DUNGEON.spiritPickupValue });
  if (treasure) for (let i = 0; i < DUNGEON.treasurePickups; i++) f.pickups.push({ ...free([treasure]), value: DUNGEON.treasureValue });
  return f;
}

// A bounty's last floor: one big room, the pack waits in the top half and comes at once.
function arenaFloor(index: number, plan: Extract<FloorPlan, { kind: 'arena' }>, rng: SeededRNG, carry: FloorCarry): Floor {
  const { cols, rows, arenaRoom } = DUNGEON;
  const tiles: Tile[] = new Array(cols * rows).fill('wall');
  const room = { x: Math.floor((cols - arenaRoom.w) / 2), y: Math.floor((rows - arenaRoom.h) / 2), w: arenaRoom.w, h: arenaRoom.h };
  carveRoom(tiles, room);
  const f = baseFloor(index, tiles, centre(room.x + Math.floor(room.w / 2), room.y + room.h - 2), carry, plan);
  const top = { ...room, h: Math.floor(room.h / 2) };
  for (let i = 0; i < plan.enemies; i++) makeEnemy(f, rng.pick(plan.pool), roomTile(top, rng)).state = 'chase';
  return f;
}

// One big room: the director enters at the bottom, the source waits at the top.
function bossFloor(index: number, plan: Extract<FloorPlan, { kind: 'boss' }>, carry: FloorCarry): Floor {
  const { cols, rows, bossRoom } = DUNGEON;
  const tiles: Tile[] = new Array(cols * rows).fill('wall');
  const room = { x: Math.floor((cols - bossRoom.w) / 2), y: Math.floor((rows - bossRoom.h) / 2), w: bossRoom.w, h: bossRoom.h };
  carveRoom(tiles, room);
  const cx = room.x + Math.floor(room.w / 2);
  const f = baseFloor(index, tiles, centre(cx, room.y + room.h - 2), carry, plan);
  const boss = makeEnemy(f, plan.boss, centre(cx, room.y + 2));
  const data = BOSSES[plan.boss];
  f.boss = { id: boss.id, phase: 1, sweepTimer: data.sweepEvery, summonTimer: data.summonEvery };
  return f;
}

export function generateFloor(index: number, plan: FloorPlan, rng: SeededRNG, carry: FloorCarry): Floor {
  const f =
    plan.kind === 'boss' ? bossFloor(index, plan, carry) : plan.kind === 'arena' ? arenaFloor(index, plan, rng, carry) : normalFloor(index, plan, rng, carry);
  runCardHooks(f, 'onRoomEnter', {});
  return f;
}
