import type { PartFn } from '../types';

// 문턱 자석: every spirit orb still on the floor is picked up (shards stay where they are).
export const collect: PartFn<'collect'> = (ctx) => {
  const { f } = ctx;
  for (const k of f.pickups) if (!k.shard) f.loot += k.value * (1 + f.stats.spiritGain);
  f.pickups = f.pickups.filter((k) => k.shard);
};
