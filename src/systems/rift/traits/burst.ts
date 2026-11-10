import type { GhostTrait } from '../../../data/ghosts.data';
import { dist } from '../physics';
import { damageOf, mark, windupOf } from './move';
import type { TraitPart } from './types';

type Burst = Extract<GhostTrait, { part: 'burst' }>;

// Runs in and blows up next to the director (not counterable). Killed first, it still goes off a moment
// later where it fell. The blast hurts ghosts as well (strike.ts 'burst').
export const burst: TraitPart<Burst> = {
  chase(f, e, t) {
    const p = f.player;
    if (dist(e, p) - p.r > t.trigger) return false;
    e.teles = [mark('circle', e, 0, t.radius, 0, windupOf(e, t.fuse), damageOf(e), false, { effect: { kind: 'burst', ghostDamage: t.ghostDamage } })];
    e.state = 'windup';
    return true;
  },
  died(f, e, t) {
    f.hazards.push(mark('circle', e, 0, t.radius, 0, t.deathFuse, damageOf(e), false, { effect: { kind: 'burst', ghostDamage: t.ghostDamage } }));
  },
};
