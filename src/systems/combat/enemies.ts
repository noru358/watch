import { COMBAT } from '../../data/combat.data';
import { ROOM_SIZE } from '../../data/contracts.data';
import { ENEMIES } from '../../data/ghosts.data';
import { TOOLS } from '../../data/tools.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { EnemyId } from '../../types/ids';
import { damagePlayer } from './damage';
import { clampToRoom, dist2, nextId, normalize } from './geometry';
import type { EnemyState, World } from './types';

export function spawnEnemy(world: World, kind: EnemyId, x: number, y: number, rng: SeededRNG): EnemyState {
  const data = ENEMIES[kind];
  const e: EnemyState = {
    id: nextId(world),
    kind,
    x,
    y,
    prevX: x,
    prevY: y,
    hp: data.maxHp,
    maxHp: data.maxHp,
    mode: 'chase',
    // Stagger first abilities so a wave doesn't act in lockstep.
    timer: kind === 'cheonyeo' ? rng.range(1, data.teleportInterval) : rng.range(0.3, 1),
    dirX: 0,
    dirY: 0,
    targetX: x,
    targetY: y,
    stun: 0,
  };
  world.enemies.push(e);
  return e;
}

// A random point inside the room, at least spawnMinDistance from the director.
export function randomSpawnPoint(world: World, rng: SeededRNG): { x: number; y: number } {
  const m = ROOM_SIZE.wall + COMBAT.spawnMargin;
  const p = world.player;
  let best = { x: m, y: m };
  let bestD = -1;
  for (let i = 0; i < 12; i++) {
    const c = { x: rng.range(m, ROOM_SIZE.width - m), y: rng.range(m, ROOM_SIZE.height - m) };
    const d = dist2(c.x, c.y, p.x, p.y);
    if (d >= COMBAT.spawnMinDistance ** 2) return c;
    if (d > bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function speedMult(world: World, e: EnemyState): number {
  const slow = TOOLS[world.tool].wardSlow;
  for (const z of world.zones) {
    if (dist2(z.x, z.y, e.x, e.y) <= z.radius * z.radius) return slow;
  }
  return 1;
}

function moveToward(e: EnemyState, tx: number, ty: number, speed: number, dt: number): void {
  const d = normalize(tx - e.x, ty - e.y);
  e.x += d.x * speed * dt;
  e.y += d.y * speed * dt;
}

function updateCheonyeo(world: World, e: EnemyState, dt: number, rng: SeededRNG, mult: number): void {
  const data = ENEMIES.cheonyeo;
  const p = world.player;
  e.timer -= dt;
  if (e.mode === 'telegraph') {
    if (e.timer > 0) return;
    e.x = e.targetX;
    e.y = e.targetY;
    e.mode = 'chase';
    e.timer = data.teleportInterval;
    world.events.push({ type: 'enemyTeleport', x: e.x, y: e.y });
    return;
  }
  moveToward(e, p.x, p.y, data.moveSpeed * mult, dt);
  if (e.timer <= 0) {
    const a = rng.range(0, Math.PI * 2);
    const target = { x: p.x + Math.cos(a) * data.teleportDistance, y: p.y + Math.sin(a) * data.teleportDistance, prevX: 0, prevY: 0 };
    clampToRoom(target, data.radius);
    e.targetX = target.x;
    e.targetY = target.y;
    e.mode = 'telegraph';
    e.timer = data.teleportTelegraph;
  }
}

function updateSubway(world: World, e: EnemyState, dt: number, mult: number): void {
  const data = ENEMIES.subway;
  const p = world.player;
  e.timer -= dt;
  switch (e.mode) {
    case 'windup':
      if (e.timer <= 0) {
        e.mode = 'dash';
        e.timer = data.dashDuration;
      }
      return;
    case 'dash':
      e.x += e.dirX * data.dashSpeed * mult * dt;
      e.y += e.dirY * data.dashSpeed * mult * dt;
      if (e.timer <= 0) {
        e.mode = 'recover';
        e.timer = data.dashRecover;
      }
      return;
    case 'recover':
      if (e.timer <= 0) {
        e.mode = 'chase';
        e.timer = COMBAT.subwayChaseCooldown;
      }
      return;
    default:
      moveToward(e, p.x, p.y, data.moveSpeed * mult, dt);
      if (e.timer <= 0 && dist2(e.x, e.y, p.x, p.y) <= data.dashTriggerRange ** 2) {
        const d = normalize(p.x - e.x, p.y - e.y);
        e.dirX = d.x;
        e.dirY = d.y;
        e.mode = 'windup';
        e.timer = data.dashWindup;
      }
  }
}

function separate(world: World): void {
  const list = world.enemies;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]!;
      const b = list[j]!;
      const min = ENEMIES[a.kind].radius + ENEMIES[b.kind].radius;
      const d2 = dist2(a.x, a.y, b.x, b.y);
      if (d2 >= min * min || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const push = ((min - d) / 2) * COMBAT.separationStrength;
      const nx = (a.x - b.x) / d;
      const ny = (a.y - b.y) / d;
      if (a.kind !== 'printer') {
        a.x += nx * push;
        a.y += ny * push;
      }
      if (b.kind !== 'printer') {
        b.x -= nx * push;
        b.y -= ny * push;
      }
    }
  }
}

// Moves regular ghosts and applies contact damage. The boss moves in boss.ts.
export function updateEnemies(world: World, dt: number, rng: SeededRNG): void {
  const p = world.player;
  for (const e of world.enemies) {
    if (e.hp <= 0) continue;
    const data = ENEMIES[e.kind];
    if (e.stun > 0) {
      e.stun -= dt;
    } else {
      const mult = speedMult(world, e);
      if (e.kind === 'cheonyeo') updateCheonyeo(world, e, dt, rng, mult);
      else if (e.kind === 'subway') updateSubway(world, e, dt, mult);
      else if (e.kind === 'dalgyal') moveToward(e, p.x, p.y, data.moveSpeed * mult, dt);
    }
    clampToRoom(e, data.radius);

    // Teleport telegraph is intangible.
    if (e.mode === 'telegraph') continue;
    const r = data.radius + world.stats.radius;
    if (dist2(e.x, e.y, p.x, p.y) <= r * r && damagePlayer(world, data.contactDamage) && data.darknessOnHit > 0) {
      p.darkness = Math.max(p.darkness, data.darknessOnHit);
      world.events.push({ type: 'darkness', duration: data.darknessOnHit });
    }
  }
  separate(world);
}
