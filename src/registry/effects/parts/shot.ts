import type { PartFn } from '../types';

// 투사체: talismans along the aim (fanned out when count > 1); flown by rift/skills.ts updateShots.
export const shot: PartFn<'shot'> = (ctx, p) => {
  const { f } = ctx;
  const pl = f.player;
  const n = p.count ?? 1;
  for (let i = 0; i < n; i++) {
    const a = pl.aim + (n > 1 ? ((i / (n - 1)) - 0.5) * (p.spread ?? 0.5) : 0);
    f.shots.push({ x: pl.x, y: pl.y, vx: Math.cos(a) * p.speed, vy: Math.sin(a) * p.speed, left: p.range, damage: f.stats.slash * p.mult, stun: p.stun });
  }
};
