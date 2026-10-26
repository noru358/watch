import { ACTIVES } from '../../data/skills.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { hitEnemy, isStrong, stunEnemy } from './combat';
import { dist, isFloor } from './physics';
import type { Floor } from './types';

// 액티브 기술 on L (src/data/skills.data.ts ACTIVES) and the things they leave on the floor.

export function useActive(f: Floor, rng: SeededRNG): void {
  const id = f.active;
  if (!id || f.skillCd > 0) return;
  const a = ACTIVES[id];
  const p = f.player;
  f.skillCd = a.cooldown;
  f.events.push({ type: 'skillUsed', x: p.x, y: p.y, skill: id });
  if (id === 'talisman') {
    f.shots.push({ x: p.x, y: p.y - 0.4, vx: Math.cos(p.aim) * a.speed, vy: Math.sin(p.aim) * a.speed, left: a.range, damage: a.damage, stun: a.stun });
  } else if (id === 'barrier') {
    p.iframes = Math.max(p.iframes, a.time);
    f.zones.push({ kind: 'barrier', x: p.x, y: p.y, r: a.range, t: a.time });
  } else {
    for (const e of [...f.enemies]) {
      if (e.hp <= 0 || dist(e, p) > a.range) continue;
      if (isStrong(e)) stunEnemy(e, a.stun);
      else if (e.kind !== 'gumiho') hitEnemy(f, e, 'skill', e.hp, false, { x: 0, y: 0 }, rng);
    }
  }
}

// Talismans fly straight; the first ghost they touch takes the hit, a wall stops them.
export function updateShots(f: Floor, dt: number, rng: SeededRNG): void {
  const keep = [];
  for (const s of f.shots) {
    const step = Math.hypot(s.vx, s.vy) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.left -= step;
    const target = f.enemies.find((e) => e.hp > 0 && dist(e, s) <= e.r + 0.25);
    if (target) {
      hitEnemy(f, target, 'skill', s.damage, true, { x: s.vx / (step / dt), y: s.vy / (step / dt) }, rng);
      stunEnemy(target, s.stun);
      f.events.push({ type: 'shotHit', x: s.x, y: s.y });
      continue;
    }
    if (s.left > 0 && isFloor(f, Math.floor(s.x), Math.floor(s.y))) keep.push(s);
  }
  f.shots = keep;
}

// Salt and barriers burn away the wisps that touch them.
export function updateZones(f: Floor, dt: number, rng: SeededRNG): void {
  for (const z of f.zones) {
    z.t -= dt;
    for (const e of [...f.enemies]) {
      if (e.hp <= 0 || isStrong(e) || e.kind === 'gumiho') continue;
      if (dist(e, z) <= z.r + e.r) hitEnemy(f, e, 'skill', e.hp, false, { x: 0, y: 0 }, rng);
    }
  }
  f.zones = f.zones.filter((z) => z.t > 0);
}
