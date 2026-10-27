import type { PartFn } from '../types';

// Multiplies a number the hook passes along: damage about to land (onBeforeAttack), damage taken
// (onTakeDamage.amount), walking speed (onMove.mult). The simplest "+n % while …" effect.
export const scale: PartFn<'scale'> = (ctx, p) => {
  const v = ctx.args[p.arg];
  if (typeof v === 'number') (ctx.args as Record<string, number>)[p.arg] = v * p.by;
};
