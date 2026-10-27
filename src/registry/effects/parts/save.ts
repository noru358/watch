import type { PartFn } from '../types';

// 마지막 숨: an onLethal row keeps the director standing.
export const save: PartFn<'save'> = (ctx) => {
  if ('prevent' in ctx.args) (ctx.args as { prevent: boolean }).prevent = true;
};
