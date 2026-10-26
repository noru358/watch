import { OBJECTIVES } from '../../../data/objectives.data';
import { dist } from '../physics';
import type { Floor, Pos } from '../types';
import type { ObjectiveState } from './types';

type Ward = Extract<ObjectiveState, { kind: 'ward' }>;
const W = OBJECTIVES.ward;

// 결계 (docs/rules/floor.md): three charm sites in side rooms. Standing in a circle fills it; walking
// out drains it. While one is filling the wisps come twice as fast (spawner.ts reads `charging`).
export function setupWard(spots: Pos[]): Ward {
  return { kind: 'ward', done: false, sites: spots.map((p) => ({ ...p, progress: 0 })), charging: false };
}

export function updateWard(f: Floor, o: Ward, dt: number): void {
  if (o.done) return;
  o.charging = false;
  for (const s of o.sites) {
    if (s.progress >= 1) continue;
    if (dist(s, f.player) <= W.radius) {
      o.charging = true;
      s.progress = Math.min(1, s.progress + dt / W.fillTime);
      if (s.progress >= 1) f.events.push({ type: 'wardSealed', x: s.x, y: s.y });
    } else s.progress = Math.max(0, s.progress - W.drainPerSecond * dt);
  }
  if (o.sites.every((s) => s.progress >= 1)) {
    o.done = true;
    f.events.push({ type: 'objectiveDone', x: f.player.x, y: f.player.y });
  }
}
