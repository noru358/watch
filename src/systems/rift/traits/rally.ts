import type { GhostTrait } from '../../../data/ghosts.data';
import { dist, lineOfSight } from '../physics';
import { mark, stepAway, windupOf } from './move';
import type { TraitPart } from './types';

type Rally = Extract<GhostTrait, { part: 'rally' }>;

// Hangs back and calls the others (strike.ts 'rally'). A hit while it calls cuts the call short.
export const rally: TraitPart<Rally> = {
  tick(_f, e, t, dt) {
    if (e.state === 'chase') e.vars.cd = (e.vars.cd ?? t.every / 2) - dt;
  },
  chase(f, e, t, dt) {
    const p = f.player;
    const d = dist(e, p);
    if (d > t.keep + 3 || !lineOfSight(f, e, p)) return false;
    if ((e.vars.cd ?? t.every / 2) <= 0) {
      const eff = { kind: 'rally' as const, radius: t.radius, time: t.time, speed: t.speed, windupMult: t.windupMult, summon: t.summon, count: t.count };
      e.teles = [mark('circle', e, 0, t.radius, 0, windupOf(e, t.windup), 0, false, { effect: eff })];
      e.state = 'windup';
      e.vars.cd = t.every;
      return true;
    }
    if (d < t.keep) stepAway(f, e, dt);
    return true;
  },
  hit(_f, e, t) {
    if (e.state === 'windup' && e.teles.some((x) => x.effect?.kind === 'rally')) {
      e.teles = [];
      e.state = 'stun';
      e.timer = Math.max(e.timer, t.breakStun);
    }
    return false;
  },
};
