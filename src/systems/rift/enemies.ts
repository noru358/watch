import { DUNGEON } from '../../data/dungeon.data';
import { BOSSES, GHOSTS } from '../../data/ghosts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { updateBoss } from './boss';
import { hurtPlayer } from './combat';
import { hurtObjective, survivorOf } from './objectives';
import { dist, inTelegraph, isFloor, lineOfSight, moveBody, steer } from './physics';
import type { Enemy, Floor, Telegraph } from './types';


// A line dash: slide along the telegraph until a wall or its end.
function dashAlong(f: Floor, e: Enemy, t: Telegraph): void {
  const step = DUNGEON.dashStep;
  for (let d = 0; d < t.range; d += step) {
    if (moveBody(f, e, Math.cos(t.angle) * step, Math.sin(t.angle) * step)) break;
  }
}

// Counts telegraphs down; when one runs out it strikes. Returns true when the last one struck.
export function resolveTelegraphs(f: Floor, e: Enemy, dt: number): boolean {
  if (e.teles.length === 0) return false;
  for (const t of e.teles) t.t -= dt;
  const due = e.teles.filter((t) => t.t <= 0);
  if (due.length === 0) return false;
  e.teles = e.teles.filter((t) => t.t > 0);
  for (const t of due) {
    if (inTelegraph(t, f.player, f.player.r)) hurtPlayer(f, t.damage, t.darkness);
    const s = survivorOf(f);
    if (s && inTelegraph(t, s, s.r)) hurtObjective(f, t.damage);
    if (t.shape === 'line') dashAlong(f, e, t);
  }
  return e.teles.length === 0;
}

function tele(shape: Telegraph['shape'], e: Enemy, angle: number, range: number, width: number, time: number, damage: number, parriable: boolean, darkness: number): Telegraph {
  return { shape, x: e.x, y: e.y, angle, range, width, axis: 'row', t: time, total: time, damage, parriable, darkness };
}

function updateGhost(f: Floor, e: Enemy, dt: number, rng: SeededRNG): void {
  if (e.kind === 'gumiho') return;
  const data = GHOSTS[e.kind];
  const p = f.player;
  const d = dist(e, p);
  const toP = Math.atan2(p.y - e.y, p.x - e.x);
  // A sleeping lair pack or a quarry resting in its nest does nothing until woken (lair.ts, chase.ts).
  if (e.asleep) return;
  const damage = data.damage + e.damageAdd;
  const windup = data.windup * e.windupMult;
  switch (e.state) {
    case 'idle':
      if (d <= data.sight && lineOfSight(f, e, p)) e.state = 'chase';
      return;
    case 'stun':
    case 'recover':
      e.timer -= dt;
      if (e.timer <= 0) e.state = 'chase';
      return;
    case 'warp':
      e.timer -= dt;
      if (e.timer <= 0 && e.warpTo) {
        e.x = e.warpTo.x;
        e.y = e.warpTo.y;
        e.warpTo = null;
        e.state = 'chase';
        f.events.push({ type: 'enemyTeleport', x: e.x, y: e.y });
      }
      return;
    case 'windup':
      if (resolveTelegraphs(f, e, dt)) {
        e.state = 'recover';
        e.timer = data.recover * e.windupMult;
      }
      return;
    case 'chase':
      break;
  }

  if (data.teleportEvery > 0 && (e.warpTimer -= dt) <= 0) {
    // Blink to just behind the director (opposite their aim), if there is floor there.
    const back = { x: p.x - Math.cos(p.aim) * data.teleportBehind, y: p.y - Math.sin(p.aim) * data.teleportBehind };
    e.warpTimer = data.teleportEvery + rng.range(0, data.teleportJitter);
    if (isFloor(f, Math.floor(back.x), Math.floor(back.y))) {
      e.state = 'warp';
      e.timer = data.teleportWarn;
      e.warpTo = back;
      return;
    }
  }
  if (data.attack === 'none') {
    // Swarm fodder: just rushes in; touching the director burns.
    if (d <= e.r + p.r) hurtPlayer(f, data.contactDamage + e.damageAdd, 0);
    const s = survivorOf(f);
    if (s && dist(e, s) <= e.r + s.r) hurtObjective(f, data.contactDamage);
  } else if (data.attack === 'line') {
    if (d <= data.attackRange && lineOfSight(f, e, p)) {
      e.teles = [tele('line', e, toP, data.attackRange, data.attackSize, windup, damage, false, data.darkness)];
      e.state = 'windup';
      return;
    }
  } else if (d - e.r - p.r <= data.attackRange) {
    e.teles = [tele(data.attack, e, toP, data.attackSize, data.attackArc, windup, damage, true, data.darkness)];
    e.state = 'windup';
    return;
  }
  const dir = steer(f, e);
  moveBody(f, e, dir.x * data.speed * e.speedMult * dt, dir.y * data.speed * e.speedMult * dt);
  if (dir.x !== 0) e.face = dir.x > 0 ? 1 : -1;
}

function separate(f: Floor): void {
  const list = f.enemies;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]!;
      const b = list[j]!;
      const min = a.r + b.r;
      const d = dist(a, b);
      if (d >= min || d === 0) continue;
      const push = (min - d) / 2;
      const nx = (a.x - b.x) / d;
      const ny = (a.y - b.y) / d;
      if (a.kind !== 'gumiho') moveBody(f, a, nx * push, ny * push);
      if (b.kind !== 'gumiho') moveBody(f, b, -nx * push, -ny * push);
    }
  }
}

export function updateEnemies(f: Floor, dt: number, rng: SeededRNG): void {
  for (const e of [...f.enemies]) {
    if (e.hp <= 0 || f.status !== 'playing') continue;
    if (e.knockX || e.knockY) {
      moveBody(f, e, e.knockX * dt, e.knockY * dt);
      const k = Math.max(0, 1 - DUNGEON.knockDecay * dt);
      e.knockX = Math.abs(e.knockX * k) < 0.05 ? 0 : e.knockX * k;
      e.knockY = Math.abs(e.knockY * k) < 0.05 ? 0 : e.knockY * k;
    }
    if (e.kind === 'gumiho') updateBoss(f, e, dt, rng, BOSSES.gumiho);
    else updateGhost(f, e, dt, rng);
  }
  f.enemies = f.enemies.filter((e) => e.hp > 0);
  separate(f);
}
