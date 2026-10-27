import type { PartFn } from '../types';
import { effectState } from '../state';
import { baseDamage, reached, strike } from './common';

// 추가타: front / around / the hit enemy / a chain to nearby ones.
export const hit: PartFn<'hit'> = (ctx, p) => {
  const damage = baseDamage(ctx, p.of) * p.mult;
  if (p.shape === 'front' && p.dir === 'dash') {
    const pl = ctx.f.player;
    pl.aim = Math.atan2(pl.dashY, pl.dashX);
    pl.swingFx = 0;
    ctx.f.events.push({ type: 'slash', x: pl.x, y: pl.y });
  }
  for (const e of reached(ctx, p.shape, p.range, p.count, p.dir)) strike(ctx, e, damage);
  if (p.consumeMark && ctx.enemy) effectState(ctx.f).marks.delete(ctx.enemy.id);
};
