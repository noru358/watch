import { DUNGEON } from '../../../data/dungeon.data';
import { GHOSTS } from '../../../data/ghosts.data';
import { dist, moveBody } from '../physics';
import type { Enemy, Floor, TeleEffect, Telegraph } from '../types';

// Small helpers shared by the trait parts (and enemies.ts): how fast a ghost walks, how long its warnings
// last (current-floor modifiers and a rally both count), stepping toward or away from the director.

export function ghostSpeed(e: Enemy): number {
  if (e.kind === 'gumiho') return 0;
  return GHOSTS[e.kind].speed * e.speedMult * (e.buffT > 0 ? e.buffSpeed : 1);
}

export function windupOf(e: Enemy, base: number): number {
  return base * e.windupMult * (e.buffT > 0 ? e.buffWindup : 1);
}

export function damageOf(e: Enemy): number {
  return e.kind === 'gumiho' ? 0 : GHOSTS[e.kind].damage + e.damageAdd;
}

// Returns true when a wall stopped the step.
export function stepBy(f: Floor, e: Enemy, dx: number, dy: number, dt: number, speed = ghostSpeed(e)): boolean {
  const len = Math.hypot(dx, dy);
  if (len === 0) return false;
  if (dx !== 0) e.face = dx > 0 ? 1 : -1;
  return moveBody(f, e, (dx / len) * speed * dt, (dy / len) * speed * dt, DUNGEON.ghostNudge);
}

export function stepAway(f: Floor, e: Enemy, dt: number): boolean {
  const p = f.player;
  return dist(e, p) > 0 ? stepBy(f, e, e.x - p.x, e.y - p.y, dt) : false;
}

// A telegraph made by a trait.
export function mark(shape: 'circle' | 'line', at: { x: number; y: number }, angle: number, range: number, width: number, time: number, damage: number, parriable: boolean, extra: { remote?: boolean; effect?: TeleEffect } = {}): Telegraph {
  return { shape, x: at.x, y: at.y, angle, range, width, axis: 'row', t: time, total: time, damage, parriable, darkness: 0, ...extra };
}
