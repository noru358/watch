import { GHOSTS } from '../../../data/ghosts.data';
import { dist } from '../../../systems/rift';
import type { PartFn } from '../types';
import { strike } from './common';

// 정화: every swarm wisp within the radius is gone.
export const cleanse: PartFn<'cleanse'> = (ctx, p) => {
  const { f } = ctx;
  for (const e of f.enemies) {
    if (e.hp <= 0 || e.kind === 'gumiho' || !GHOSTS[e.kind].fodder || dist(e, f.player) > p.radius) continue;
    strike(ctx, e, e.hp);
  }
};
