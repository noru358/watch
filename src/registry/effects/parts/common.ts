import { dist, hitEnemy, type Enemy } from '../../../systems/rift';
import type { EffectCtx, Shape } from '../types';

// Shared bits for parts: the damage base, and which enemies a shape reaches.
export function baseDamage(ctx: EffectCtx, of: 'hit' | 'slash' | 'drawSlash'): number {
  if (of === 'hit') return typeof ctx.args.damage === 'number' ? ctx.args.damage : ctx.f.stats.slash;
  return ctx.f.stats[of];
}

export function reached(ctx: EffectCtx, shape: Shape, range: number, count = 3, dir: 'aim' | 'dash' = 'aim'): Enemy[] {
  const { f, enemy } = ctx;
  const p = f.player;
  const alive = f.enemies.filter((e) => e.hp > 0 && e.state !== 'warp');
  if (shape === 'target') return enemy && enemy.hp > 0 ? [enemy] : [];
  if (shape === 'around') return alive.filter((e) => dist(e, p) - e.r <= range);
  if (shape === 'front') {
    const aim = dir === 'dash' ? Math.atan2(p.dashY, p.dashX) : p.aim;
    return alive.filter((e) => {
      if (dist(e, p) - e.r > range) return false;
      const d = Math.atan2(e.y - p.y, e.x - p.x) - aim;
      return Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) <= 1.1;
    });
  }
  // chain: from the hit enemy to the nearest others within range, one hop each.
  const out: Enemy[] = [];
  let from = enemy;
  while (from && out.length < count) {
    const at = from;
    const next = alive.filter((e) => e !== enemy && !out.includes(e) && dist(e, at) <= range).sort((a, b) => dist(a, at) - dist(b, at))[0];
    if (!next) break;
    out.push(next);
    from = next;
  }
  return out;
}

export function strike(ctx: EffectCtx, e: Enemy, damage: number): void {
  const p = ctx.f.player;
  const a = Math.atan2(e.y - p.y, e.x - p.x);
  hitEnemy(ctx.f, e, 'skill', Math.max(1, Math.round(damage * 10) / 10), false, { x: Math.cos(a), y: Math.sin(a) }, ctx.rng);
}
