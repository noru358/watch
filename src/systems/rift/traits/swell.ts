import type { GhostTrait } from '../../../data/ghosts.data';
import { angleDiff, blockedBox, dist, lineOfSight } from '../physics';
import type { TraitPart } from './types';

type Swell = Extract<GhostTrait, { part: 'swell' }>;

// Grows while the director looks at it and shrinks when they look away. Size changes its body, its reach
// and its damage; fully grown, its warnings cannot be countered. It does not grow into walls.
export const swell: TraitPart<Swell> = {
  tick(f, e, t, dt) {
    const v = e.vars;
    if (v.r0 === undefined) {
      v.r0 = e.r;
      v.d0 = e.damageAdd;
      v.size = 0;
    }
    const p = f.player;
    const looking = dist(e, p) <= t.range && angleDiff(Math.atan2(e.y - p.y, e.x - p.x), p.aim) <= t.look / 2 && lineOfSight(f, p, e);
    const next = Math.max(0, Math.min(t.max, (v.size ?? 0) + (looking ? t.grow : -t.shrink) * dt));
    const k = 1 + t.sizePer * next;
    if (next > (v.size ?? 0) && blockedBox(f, e.x, e.y, (v.r0 ?? e.r) * k)) return;
    v.size = next;
    e.r = (v.r0 ?? e.r) * k;
    e.reachMult = k;
    e.damageAdd = (v.d0 ?? 0) + Math.floor(next) * t.damagePer;
    e.parryable = next < t.max;
  },
};
