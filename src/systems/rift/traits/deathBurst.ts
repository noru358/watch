import type { GhostTrait } from '../../../data/ghosts.data';
import { damageOf, mark } from './move';
import type { TraitPart } from './types';

type DeathBurst = Extract<GhostTrait, { part: 'deathBurst' }>;

// Leaves a blast where it falls (strike.ts 'burst'); for named targets ("타는 ○○").
export const deathBurst: TraitPart<DeathBurst> = {
  died(f, e, t) {
    f.hazards.push(mark('circle', e, 0, t.radius, 0, t.fuse, damageOf(e), false, { effect: { kind: 'burst', ghostDamage: t.ghostDamage } }));
  },
};
