import type { PartFn } from '../types';
import { effectState } from '../state';

// 장판 at the director's feet (salt, barrier); `spacing` keeps a trail from stacking up.
export const zone: PartFn<'zone'> = (ctx, p) => {
  const { f } = ctx;
  const pl = f.player;
  const s = effectState(f);
  if (p.spacing && s.lastZone && Math.hypot(s.lastZone.x - pl.x, s.lastZone.y - pl.y) < p.spacing) return;
  s.lastZone = { x: pl.x, y: pl.y };
  f.zones.push({ kind: p.kind, x: pl.x, y: pl.y, r: p.radius, t: p.sec });
};
