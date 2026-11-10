import type { GhostTrait } from '../../../data/ghosts.data';
import { dist, lineOfSight } from '../physics';
import { damageOf, mark, stepAway, windupOf } from './move';
import type { TraitPart } from './types';

type Shoot = Extract<GhostTrait, { part: 'shoot' }>;

// Keeps its distance and fires along a thin line it marks first (the line is a cue, the bullet is the hit).
export const shoot: TraitPart<Shoot> = {
  tick(_f, e, t, dt) {
    if (e.state === 'chase') e.vars.cd = (e.vars.cd ?? t.every / 2) - dt;
  },
  chase(f, e, t, dt) {
    const p = f.player;
    const d = dist(e, p);
    if (d > t.range || !lineOfSight(f, e, p)) return false;
    if ((e.vars.cd ?? t.every / 2) <= 0) {
      const angle = Math.atan2(p.y - e.y, p.x - e.x);
      e.teles = [mark('line', e, angle, t.range, t.width, windupOf(e, t.windup), damageOf(e), false, { effect: { kind: 'fire', speed: t.speed, life: t.life } })];
      e.state = 'windup';
      e.vars.cd = t.every;
      return true;
    }
    if (d < t.keep) stepAway(f, e, dt);
    return true;
  },
};
