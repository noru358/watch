import type { PartFn } from '../types';
import { effectState } from '../state';
import { baseDamage, reached, strike } from './common';

// 스택: count something up (기세 on hits …), optionally +per × stacks on a stat, lost after `decay`
// seconds without a new one. `spend` cashes the stacks in as one big hit and resets them.
export const stack: PartFn<'stack'> = (ctx, p) => {
  const { f } = ctx;
  const s = effectState(f);
  const key = p.key; // stacks are shared by key, so a duo or an active can read them
  const had = s.stacks.get(key) ?? { n: 0, until: 0, stat: p.stat, per: p.per };
  const n = Math.min(p.max, had.n + p.add);
  if (p.stat && p.per) f.stats[p.stat] *= (1 + p.per * n) / (1 + p.per * had.n);
  s.stacks.set(key, { n, until: f.time + p.decay, stat: p.stat, per: p.per });
};

export const spend: PartFn<'spend'> = (ctx, p) => {
  const { f } = ctx;
  const s = effectState(f);
  const key = p.key; // stacks are shared by key, so a duo or an active can read them
  const had = s.stacks.get(key);
  if (!had || had.n <= 0) return;
  for (const e of reached(ctx, p.shape, p.range)) strike(ctx, e, baseDamage(ctx, 'slash') * p.multPerStack * had.n);
  if (had.stat && had.per) f.stats[had.stat] /= 1 + had.per * had.n;
  s.stacks.delete(key);
};
