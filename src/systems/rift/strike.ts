import { DUNGEON } from '../../data/dungeon.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { hitEnemy, hurtPlayer } from './combat';
import { makeEnemy } from './enemyFactory';
import { hurtObjective, survivorOf } from './objectives';
import { angleDiff, dist, inTelegraph, isFloor, moveBody } from './physics';
import type { Enemy, Floor, TeleEffect, Telegraph } from './types';

// What happens when a telegraph runs out: the hit, plus its effect (ghost traits). `owner` is the ghost
// that made it, or null for a hazard left on the floor (a dead burster's blast).

// Warnings that never hit the director themselves (drawn as cues, not as danger).
export function harmless(t: Telegraph): boolean {
  return t.effect?.kind === 'fire' || t.effect?.kind === 'rally';
}

// A line dash: slide along the telegraph until a wall or its end.
function dashAlong(f: Floor, e: Enemy, t: Telegraph): void {
  const step = DUNGEON.dashStep;
  for (let d = 0; d < t.range; d += step) {
    if (moveBody(f, e, Math.cos(t.angle) * step, Math.sin(t.angle) * step)) break;
  }
}

function grab(f: Floor, owner: Enemy | null, eff: Extract<TeleEffect, { kind: 'grab' }>): void {
  const p = f.player;
  p.rooted = Math.max(p.rooted, eff.hold);
  p.rootBreak = eff.swingFree;
  f.events.push({ type: 'playerGrabbed', x: p.x, y: p.y });
  if (!owner) return;
  const d = dist(p, owner);
  const step = Math.min(eff.pull, d - owner.r - p.r);
  if (d > 0 && step > 0) moveBody(f, p, ((owner.x - p.x) / d) * step, ((owner.y - p.y) / d) * step);
}

function steal(f: Floor, owner: Enemy, eff: Extract<TeleEffect, { kind: 'steal' }>): void {
  if (f.stolen) return;
  if (f.active) {
    f.stolen = { by: owner.id, active: f.active, loot: 0, state: 'carried' };
    f.active = null;
  } else {
    const loot = Math.floor(f.loot * eff.loot);
    if (loot <= 0) return;
    f.loot -= loot;
    f.stolen = { by: owner.id, active: null, loot, state: 'carried' };
  }
  owner.vars.carry = 1;
  f.events.push({ type: 'skillStolen', x: owner.x, y: owner.y });
}

function rally(f: Floor, owner: Enemy, eff: Extract<TeleEffect, { kind: 'rally' }>, rng: SeededRNG): void {
  for (const o of f.enemies) {
    if (o === owner || o.hp <= 0 || o.kind === 'gumiho' || dist(o, owner) > eff.radius) continue;
    o.buffT = eff.time;
    o.buffSpeed = eff.speed;
    o.buffWindup = eff.windupMult;
    o.asleep = false;
    if (o.state === 'idle') o.state = 'chase';
  }
  for (let i = 0; i < eff.count; i++) {
    const a = rng.range(0, Math.PI * 2);
    const at = { x: owner.x + Math.cos(a) * 1.2, y: owner.y + Math.sin(a) * 1.2 };
    if (!isFloor(f, Math.floor(at.x), Math.floor(at.y))) continue;
    makeEnemy(f, eff.summon, at).state = 'chase';
  }
  f.events.push({ type: 'ghostRally', x: owner.x, y: owner.y });
}

export function strike(f: Floor, t: Telegraph, owner: Enemy | null, rng: SeededRNG): void {
  const eff = t.effect;
  if (eff?.kind === 'fire') {
    if (owner) f.enemyShots.push({ x: owner.x, y: owner.y, vx: Math.cos(t.angle) * eff.speed, vy: Math.sin(t.angle) * eff.speed, left: eff.life, damage: t.damage });
    return;
  }
  if (eff?.kind === 'rally') {
    if (owner) rally(f, owner, eff, rng);
    return;
  }
  if (eff?.kind === 'land' && owner && isFloor(f, Math.floor(t.x), Math.floor(t.y))) {
    owner.x = t.x;
    owner.y = t.y;
  }
  const p = f.player;
  if (inTelegraph(t, p, p.r) && hurtPlayer(f, t.damage, t.darkness)) {
    if (eff?.kind === 'grab') grab(f, owner, eff);
    if (eff?.kind === 'steal' && owner) steal(f, owner, eff);
  }
  const s = survivorOf(f);
  if (s && inTelegraph(t, s, s.r)) hurtObjective(f, t.damage);
  if (eff?.kind === 'burst') {
    if (owner) {
      owner.hp = 0;
      owner.teles = [];
    }
    for (const o of [...f.enemies]) {
      if (o === owner || o.hp <= 0 || !inTelegraph(t, o, o.r)) continue;
      const a = Math.atan2(o.y - t.y, o.x - t.x);
      hitEnemy(f, o, 'skill', t.damage * eff.ghostDamage, false, { x: Math.cos(a), y: Math.sin(a) }, rng);
    }
    f.events.push({ type: 'enemyBurst', x: t.x, y: t.y });
  }
  if (t.shape === 'line' && owner && !eff) dashAlong(f, owner, t);
}

// Telegraphs left on the floor with no ghost behind them.
export function updateHazards(f: Floor, dt: number, rng: SeededRNG): void {
  if (f.hazards.length === 0) return;
  for (const t of f.hazards) t.t -= dt;
  const due = f.hazards.filter((t) => t.t <= 0);
  f.hazards = f.hazards.filter((t) => t.t > 0);
  for (const t of due) strike(f, t, null, rng);
}

// Ghost bullets fly straight; walls stop them; touching the director hurts (a dash slips through).
export function updateEnemyShots(f: Floor, dt: number): void {
  if (f.enemyShots.length === 0) return;
  const p = f.player;
  const keep = [];
  for (const s of f.enemyShots) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.left -= Math.hypot(s.vx, s.vy) * dt;
    if (s.left <= 0 || !isFloor(f, Math.floor(s.x), Math.floor(s.y))) continue;
    if (dist(s, p) <= p.r + DUNGEON.enemyShotRadius && hurtPlayer(f, s.damage, 0)) continue;
    keep.push(s);
  }
  f.enemyShots = keep;
}

// A swing cuts the bullets inside its arc.
export function cutShots(f: Floor, reach: number, arc: number, aim: number): void {
  if (f.enemyShots.length === 0) return;
  const p = f.player;
  f.enemyShots = f.enemyShots.filter((s) => {
    const cut = dist(s, p) <= reach + DUNGEON.shotCutPad && angleDiff(Math.atan2(s.y - p.y, s.x - p.x), aim) <= arc / 2;
    if (cut) f.events.push({ type: 'shotCut', x: s.x, y: s.y });
    return !cut;
  });
}
