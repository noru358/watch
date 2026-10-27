import { dist } from '../../../systems/rift';
import type { PartFn } from '../types';
import { strike } from './common';

// 영력 터뜨리기: every spirit orb within `radius` bursts (the money is gone) and hurts what stands by it.
export const burst: PartFn<'burst'> = (ctx, p) => {
  const { f } = ctx;
  const orbs = f.pickups.filter((k) => !k.shard && dist(k, f.player) <= p.radius);
  f.pickups = f.pickups.filter((k) => !orbs.includes(k));
  for (const o of orbs) {
    for (const e of f.enemies) if (e.hp > 0 && dist(e, o) <= 1.5) strike(ctx, e, f.stats.slash * p.mult * o.value);
  }
};
