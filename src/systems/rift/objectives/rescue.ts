import { GHOSTS } from '../../../data/ghosts.data';
import { OBJECTIVES } from '../../../data/objectives.data';
import { dist, moveBody, steer } from '../physics';
import type { Floor, Pos } from '../types';
import type { ObjectiveState, Survivor } from './types';

type Rescue = Extract<ObjectiveState, { kind: 'rescue' }>;
const R = OBJECTIVES.rescue;

export function setupRescue(at: Pos): Rescue {
  const survivor: Survivor = { x: at.x, y: at.y, prevX: at.x, prevY: at.y, r: R.radius, hp: R.hp, maxHp: R.hp, iframes: 0, state: 'hidden' };
  return { kind: 'rescue', done: false, survivor, fear: 0, cryT: R.cryEvery / 2, sinceCry: 99 };
}

const strongNear = (f: Floor, p: Pos) =>
  f.enemies.some((e) => e.hp > 0 && e.kind !== 'gumiho' && !GHOSTS[e.kind].fodder && dist(e, p) <= R.nearRange);

// Hidden: fear rises (faster with ghosts close) and they cry now and then. Found: they follow the
// director's hand along the same flow field the ghosts use, so they never get stuck on corners.
export function updateRescue(f: Floor, o: Rescue, dt: number): void {
  const s = o.survivor;
  s.prevX = s.x;
  s.prevY = s.y;
  s.iframes = Math.max(0, s.iframes - dt);
  o.sinceCry += dt;
  if (s.state === 'hidden') {
    o.fear = Math.min(1, o.fear + R.fearPerSecond * (strongNear(f, s) ? R.fearNearMult : 1) * dt);
    o.cryT -= dt;
    if (o.cryT <= 0) {
      o.cryT = R.cryEvery;
      o.sinceCry = 0;
      f.events.push({ type: 'survivorCry', x: s.x, y: s.y });
    }
    if (dist(s, f.player) <= R.findRange) {
      s.state = 'following';
      f.events.push({ type: 'survivorFound', x: s.x, y: s.y });
    }
  } else {
    o.fear = Math.max(0, o.fear - R.fearRelief * dt);
    const gap = dist(s, f.player);
    if (gap > R.followGap) {
      const dir = steer(f, s);
      const step = Math.min(R.followSpeed * dt, gap - R.followGap);
      moveBody(f, s, dir.x * step, dir.y * step);
    }
  }
  if (o.fear >= 1 || s.hp <= 0) f.status = 'failed';
}

export function hurtSurvivor(f: Floor, o: Rescue, amount: number): void {
  const s = o.survivor;
  if (s.iframes > 0 || s.hp <= 0 || amount <= 0) return;
  s.hp = Math.max(0, s.hp - amount);
  s.iframes = R.hurtIframes;
  f.events.push({ type: 'survivorHurt', x: s.x, y: s.y, amount });
}
