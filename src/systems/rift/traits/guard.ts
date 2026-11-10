import type { GhostTrait } from '../../../data/ghosts.data';
import { angleDiff } from '../physics';
import type { TraitPart } from './types';

type Guard = Extract<GhostTrait, { part: 'guard' }>;

// 도깨비: blows from the front bounce off the club. It turns toward the director at a limited rate
// while chasing (so a dash can get behind it) and holds its facing while it winds up or recovers.
export const guard: TraitPart<Guard> = {
  tick(f, e, t, dt) {
    if (e.state !== 'chase') return;
    const want = Math.atan2(f.player.y - e.y, f.player.x - e.x);
    const d = Math.atan2(Math.sin(want - e.aim), Math.cos(want - e.aim)); // shortest signed turn
    const step = t.turn * dt;
    e.aim += Math.abs(d) <= step ? d : Math.sign(d) * step;
  },
  hit(_f, e, t, blow) {
    if (e.state === 'stun' || e.state === 'recover') return false; // open
    if (blow.dir.x === 0 && blow.dir.y === 0) return false;
    const from = Math.atan2(-blow.dir.y, -blow.dir.x); // where the blow comes from, seen from the ghost
    if (angleDiff(from, e.aim) > t.arc / 2) return false; // side or back
    if (blow.kind === 'draw' && blow.empowered) {
      // A 받아치기 knocks the club aside: the blow lands and the ghost is left open.
      e.teles = [];
      e.state = 'stun';
      e.timer = Math.max(e.timer, t.breakStun);
      return false;
    }
    return true;
  },
};
