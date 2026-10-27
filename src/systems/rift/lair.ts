import { MODIFIERS } from '../../data/modifiers.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { GhostId } from '../../types/ids';
import { makeEnemy } from './enemyFactory';
import { roomTile, type Room } from './layout';
import type { Floor } from './types';

// 괴이 소굴 (현장 변형 'lair', docs/rules/floor.md): one side room holds a sleeping pack. Walk all the way
// in and the doorways seal (their tiles turn to wall) until the pack is down; then the doors open and
// a heap of spirit (sometimes a 심연 파편) appears. Walking past the room is allowed.
export interface LairState {
  room: Room;
  doors: number[]; // tile indices sealed while locked
  locked: boolean;
  cleared: boolean;
  shard: boolean; // decided when the floor is made
}

const L = MODIFIERS.lair.lair!;

export function setupLair(f: Floor, room: Room, pool: readonly GhostId[], rng: SeededRNG): LairState {
  for (let i = 0; i < L.pack; i++) {
    const e = makeEnemy(f, rng.pick(pool), roomTile(room, rng));
    e.role = 'lair';
    e.asleep = true;
  }
  // Doorways: floor tiles just outside the room's edge.
  const doors: number[] = [];
  const at = (x: number, y: number) => y * f.cols + x;
  for (let x = room.x - 1; x <= room.x + room.w; x++) {
    for (const y of [room.y - 1, room.y + room.h]) if (f.tiles[at(x, y)] === 'floor') doors.push(at(x, y));
  }
  for (let y = room.y; y < room.y + room.h; y++) {
    for (const x of [room.x - 1, room.x + room.w]) if (f.tiles[at(x, y)] === 'floor') doors.push(at(x, y));
  }
  return { room, doors, locked: false, cleared: false, shard: rng.chance(L.shardChance + f.stats.shardChance) };
}

const inside = (r: Room, x: number, y: number, margin: number) => x >= r.x + margin && x <= r.x + r.w - margin && y >= r.y + margin && y <= r.y + r.h - margin;

export function updateLair(f: Floor): void {
  const l = f.lair;
  if (!l || l.cleared) return;
  const pack = f.enemies.filter((e) => e.role === 'lair' && e.hp > 0);
  const p = f.player;
  if (!l.locked && pack.length > 0 && inside(l.room, p.x, p.y, 1)) {
    l.locked = true;
    for (const i of l.doors) f.tiles[i] = 'wall';
    f.flowFrom = -1;
    for (const e of pack) {
      e.asleep = false;
      e.state = 'chase';
    }
    f.events.push({ type: 'lairLocked', x: p.x, y: p.y });
  }
  if (pack.length > 0) return;
  l.cleared = true;
  f.drops.push('lair');
  if (l.locked) {
    for (const i of l.doors) f.tiles[i] = 'floor';
    f.flowFrom = -1;
  }
  const cx = l.room.x + l.room.w / 2;
  const cy = l.room.y + l.room.h / 2;
  for (let i = 0; i < L.treasure; i++) {
    const a = (i / L.treasure) * Math.PI * 2;
    f.pickups.push({ x: cx + Math.cos(a) * 0.9, y: cy + Math.sin(a) * 0.9, value: L.treasureValue });
  }
  if (l.shard) f.pickups.push({ x: cx, y: cy, value: 0, shard: true });
  f.events.push({ type: 'lairOpened', x: cx, y: cy });
}
