import type { GhostTrait } from '../../../data/ghosts.data';
import { dist, lineOfSight } from '../physics';
import { damageOf, mark, windupOf } from './move';
import type { TraitPart } from './types';

type Grab = Extract<GhostTrait, { part: 'grab' }>;

// Lies under (the 'warp' state: blows pass through) and never walks. When the director is within reach it
// surfaces and marks the ground under them; the hit roots and pulls (strike.ts). It stays up for its
// recover time, then goes under again.
export const grab: TraitPart<Grab> = {
  tick(f, e, t) {
    if (e.state !== 'warp' || e.warpTo || e.timer > 0) return;
    const p = f.player;
    if (dist(e, p) > t.reach || !lineOfSight(f, e, p)) return;
    const time = windupOf(e, t.windup);
    e.teles = [mark('circle', p, 0, t.radius, 0, time, damageOf(e), true, { remote: true, effect: { kind: 'grab', hold: t.hold, pull: t.pull, swingFree: t.swingFree } })];
    e.state = 'windup';
  },
  chase(_f, e, t) {
    e.state = 'warp';
    e.warpTo = null;
    e.timer = t.under;
    e.teles = [];
    return true;
  },
};
