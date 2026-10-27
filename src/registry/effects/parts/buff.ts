import type { PartFn } from '../types';
import { effectState } from '../state';

// 잠깐 능력치: changes the floor's stats for `sec`; the same source refreshes instead of stacking.
export const buff: PartFn<'buff'> = (ctx, p) => {
  const { f } = ctx;
  const s = effectState(f);
  const had = s.buffs.find((b) => b.source === ctx.source && b.stat === p.stat);
  if (had) {
    had.until = f.time + p.sec;
    return;
  }
  f.stats[p.stat] = p.op === 'add' ? f.stats[p.stat] + p.value : f.stats[p.stat] * p.value;
  s.buffs.push({ source: ctx.source, stat: p.stat, op: p.op, value: p.value, until: f.time + p.sec });
};
