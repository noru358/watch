import { ACTIVES, UPGRADES } from '../../data/skills.data';
import { castActive } from '../../registry/effects';
import { activeSource } from './hooks';
import type { SeededRNG } from '../../core/SeededRNG';
import { hitEnemy, isStrong, stunEnemy } from './combat';
import { dist, isFloor } from './physics';
import type { Floor } from './types';

// 액티브 기술 on L (src/data/skills.data.ts ACTIVES) and the things they leave on the floor.

export function useActive(f: Floor, rng: SeededRNG): void {
  const id = f.active;
  if (!id || f.skillCd > 0) return;
  const u = f.upgrade && UPGRADES[f.upgrade].of === id ? UPGRADES[f.upgrade] : null;
  f.skillCd = ACTIVES[id].cooldown * (u?.patch.cooldownMult ?? 1);
  f.events.push({ type: 'skillUsed', x: f.player.x, y: f.player.y, skill: id });
  castActive(f, activeSource(id, f.upgrade), rng);
}

// Talismans fly straight; the first ghost they touch takes the hit, a wall stops them.
export function updateShots(f: Floor, dt: number, rng: SeededRNG): void {
  const keep = [];
  for (const s of f.shots) {
    const step = Math.hypot(s.vx, s.vy) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.left -= step;
    const target = f.enemies.find((e) => e.hp > 0 && !s.hit.includes(e.id) && dist(e, s) <= e.r + 0.25);
    if (target) {
      hitEnemy(f, target, 'skill', s.damage, true, { x: s.vx / (step / dt), y: s.vy / (step / dt) }, rng);
      stunEnemy(target, s.stun);
      f.events.push({ type: 'shotHit', x: s.x, y: s.y });
      s.hit.push(target.id);
      if (!s.pierce) continue;
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
