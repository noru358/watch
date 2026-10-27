import { heal } from '../../cardEffects';
import type { PartFn } from '../types';

// 자원: focus, HP, spirit (dropped where the enemy was), dash charges, salt shield, bare-blade time.
export const gain: PartFn<'gain'> = (ctx, p) => {
  const { f } = ctx;
  const pl = f.player;
  if (p.res === 'focus') pl.focus = Math.min(f.stats.focusMax, pl.focus + p.amount);
  if (p.res === 'hp') heal(f, p.amount);
  if (p.res === 'spirit') {
    const at = ctx.enemy ?? pl;
    f.pickups.push({ x: at.x + 0.3, y: at.y, value: p.amount });
  }
  if (p.res === 'dash') {
    pl.dashCharges = Math.min(f.stats.dashCharges, pl.dashCharges + p.amount);
    if (pl.dashCharges >= f.stats.dashCharges) pl.dashCd = 0;
  }
  if (p.res === 'shield') pl.shield = Math.max(pl.shield, p.amount);
  if (p.res === 'bare' && pl.bare > 0) pl.bare = Math.min(p.cap ?? f.stats.bareTime * 2, pl.bare + p.amount);
};
