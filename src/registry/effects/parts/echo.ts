import type { PartFn } from '../types';
import { effectState } from '../state';

// 그림자 분신: for `sec`, every hit the director lands repeats at `mult` (runEffects does the repeat).
export const echo: PartFn<'echo'> = (ctx, p) => {
  const s = effectState(ctx.f);
  s.echo = { until: ctx.f.time + p.sec, mult: p.mult };
};
