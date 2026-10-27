import { isFloor } from '../../../systems/rift';
import type { PartFn } from '../types';

// 축지법: step along the aim up to `range` tiles, stopping before a wall.
export const blink: PartFn<'blink'> = (ctx, p) => {
  const { f } = ctx;
  const pl = f.player;
  const dx = Math.cos(pl.aim);
  const dy = Math.sin(pl.aim);
  let go = 0;
  for (let d = 0.25; d <= p.range; d += 0.25) {
    if (!isFloor(f, Math.floor(pl.x + dx * d), Math.floor(pl.y + dy * d))) break;
    go = d;
  }
  pl.x += dx * go;
  pl.y += dy * go;
};
