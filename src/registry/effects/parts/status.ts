import { dist, stunEnemy, type Enemy } from '../../../systems/rift';
import type { PartFn } from '../types';
import { effectState } from '../state';

// 상태이상 on the hit enemy (or everything within `radius`): stun / slow / curse (damage over
// time, stacks) / mark (a later row with the `marked` condition cashes it in).
export const status: PartFn<'status'> = (ctx, p) => {
  const { f } = ctx;
  const s = effectState(f);
  const targets: Enemy[] = p.radius ? f.enemies.filter((e) => e.hp > 0 && dist(e, f.player) <= p.radius!) : ctx.enemy ? [ctx.enemy] : [];
  for (const e of targets) {
    if (p.kind === 'stun') stunEnemy(e, p.sec);
    if (p.kind === 'slow') {
      const factor = 1 - (p.power ?? 0.3);
      const had = s.slows.get(e.id);
      if (!had) e.speedMult *= factor;
      s.slows.set(e.id, { until: f.time + p.sec, factor: had?.factor ?? factor });
    }
    if (p.kind === 'curse') {
      const had = s.curses.get(e.id);
      const stacks = Math.min(p.max ?? 3, (had?.stacks ?? 0) + 1);
      s.curses.set(e.id, { until: f.time + p.sec, stacks, dps: p.power ?? 1, acc: had?.acc ?? 0 });
    }
    if (p.kind === 'mark') s.marks.set(e.id, { source: ctx.source, until: f.time + p.sec });
  }
};
