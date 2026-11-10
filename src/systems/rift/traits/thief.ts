import type { GhostTrait } from '../../../data/ghosts.data';
import { dist, isFloor } from '../physics';
import { damageOf, mark, stepBy, windupOf } from './move';
import type { TraitPart } from './types';

type Thief = Extract<GhostTrait, { part: 'thief' }>;

// Snatches the active skill (strike.ts 'steal'), then runs to wherever is farthest from the director.
// Caught, it gives the skill back sharper; given time, it is gone and the skill with it for the night.
export const thief: TraitPart<Thief> = {
  chase(f, e, t, dt) {
    if (e.vars.carry) {
      e.vars.fled = (e.vars.fled ?? 0) + dt;
      if (e.vars.fled >= t.escape) {
        e.hp = 0;
        if (f.stolen?.by === e.id) f.stolen.state = 'escaped';
        f.events.push({ type: 'thiefEscaped', x: e.x, y: e.y });
        return true;
      }
      // One step down the director's distance field: the neighbour tile farthest from them.
      const tx = Math.floor(e.x);
      const ty = Math.floor(e.y);
      let best = f.flow[ty * f.cols + tx] ?? -1;
      let goal = { x: e.x, y: e.y };
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = tx + dx;
          const ny = ty + dy;
          if ((dx === 0 && dy === 0) || !isFloor(f, nx, ny)) continue;
          const v = f.flow[ny * f.cols + nx] ?? -1;
          if (v > best) {
            best = v;
            goal = { x: nx + 0.5, y: ny + 0.5 };
          }
        }
      }
      stepBy(f, e, goal.x - e.x, goal.y - e.y, dt, t.flee);
      return true;
    }
    if (f.stolen) return false; // the floor's one theft is spent: an ordinary ghost now
    const p = f.player;
    if (dist(e, p) - e.r - p.r > t.reach) return false;
    e.teles = [mark('circle', e, 0, t.radius, 0, windupOf(e, t.windup), damageOf(e), true, { effect: { kind: 'steal', loot: t.loot } })];
    e.state = 'windup';
    return true;
  },
  died(f, e, t) {
    const s = f.stolen;
    if (!s || s.by !== e.id || s.state !== 'carried') return;
    s.state = 'recovered';
    if (s.active) {
      f.active = s.active;
      f.skillCd = 0;
      f.skillBoost = t.boost;
    }
    if (s.loot > 0) f.pickups.push({ x: e.x, y: e.y, value: Math.round(s.loot * t.lootDrop) });
    f.events.push({ type: 'skillRecovered', x: e.x, y: e.y });
  },
};
