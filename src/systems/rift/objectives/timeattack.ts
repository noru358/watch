import { OBJECTIVES } from '../../../data/objectives.data';
import type { Floor } from '../types';
import { strongLeft } from './strong';
import type { ObjectiveState } from './types';

type TimeAttack = Extract<ObjectiveState, { kind: 'timeattack' }>;
const T = OBJECTIVES.timeattack;

// 속전속결 (docs/rules/floor.md): every strong ghost down before the clock runs out. The clock starts
// from the floor's strong ghosts (counted on the first tick, after mapgen placed them); each strong
// kill puts time back. Finishing pays the seconds left as spirit around the director; running out
// loses the objective (no fee) but opens the stairs.
export function setupTimeAttack(): TimeAttack {
  return { kind: 'timeattack', done: false, failed: false, started: false, left: 0, top: 0, strong: 0, paid: 0 };
}

export function updateTimeAttack(f: Floor, o: TimeAttack, dt: number): void {
  if (o.done || o.failed) return;
  const now = strongLeft(f);
  if (!o.started) {
    o.started = true;
    o.strong = now;
    o.left = o.top = T.startBase + T.startPerStrong * now;
  }
  if (now < o.strong) {
    const sec = T.perKill * (o.strong - now);
    o.left += sec;
    o.top = Math.max(o.top, o.left);
    f.events.push({ type: 'clockAdded', x: f.player.x, y: f.player.y, sec });
  }
  o.strong = now;
  if (now === 0) {
    o.done = true;
    o.paid = Math.min(T.spiritCap, Math.round(o.left * T.spiritPerSecond));
    const each = Math.max(1, Math.round(o.paid / T.bonusPieces));
    for (let i = 0, left = o.paid; left > 0; i++, left -= each) {
      const a = (i / T.bonusPieces) * Math.PI * 2;
      f.pickups.push({ x: f.player.x + Math.cos(a) * 1.2, y: f.player.y + Math.sin(a) * 1.2, value: Math.min(each, left) });
    }
    f.events.push({ type: 'objectiveDone', x: f.player.x, y: f.player.y });
    return;
  }
  o.left -= dt;
  if (o.left <= 0) {
    o.left = 0;
    o.failed = true;
    f.events.push({ type: 'clockOut', x: f.player.x, y: f.player.y });
  }
}
