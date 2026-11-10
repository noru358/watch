import type { GhostTrait } from '../../../data/ghosts.data';
import { dist, lineOfSight } from '../physics';
import { damageOf, mark, stepBy, windupOf } from './move';
import type { TraitPart } from './types';

type Leap = Extract<GhostTrait, { part: 'leap' }>;

// Circles the director between `min` and `max` tiles; when its timer is up it marks where they stand
// and lands there (strike.ts 'land'). Out of sight it walks in like any ghost.
export const leap: TraitPart<Leap> = {
  tick(_f, e, t, dt) {
    if (e.state === 'chase') e.vars.cd = (e.vars.cd ?? t.every) - dt;
  },
  chase(f, e, t, dt) {
    const p = f.player;
    const d = dist(e, p);
    if (d === 0 || !lineOfSight(f, e, p)) return false;
    if ((e.vars.cd ?? t.every) <= 0 && d <= t.max + 1) {
      e.teles = [mark('circle', p, 0, t.radius, 0, windupOf(e, t.windup), damageOf(e), true, { remote: true, effect: { kind: 'land' } })];
      e.state = 'windup';
      e.vars.cd = t.every;
      return true;
    }
    const tx = (p.x - e.x) / d;
    const ty = (p.y - e.y) / d;
    const radial = d < t.min ? -1 : d > t.max ? 1 : 0;
    const side = e.vars.side ?? 1;
    if (stepBy(f, e, tx * radial - ty * side * 0.8, ty * radial + tx * side * 0.8, dt)) e.vars.side = -side;
    return true;
  },
};
