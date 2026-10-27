import { GHOSTS } from '../../data/ghosts.data';
import type { Cond, EffectCtx } from './types';
import { effectState } from './state';

// Does one condition hold right now?
export function holds(c: Cond, ctx: EffectCtx, onceKey: string): boolean {
  const { f, args, enemy } = ctx;
  const p = f.player;
  const s = effectState(f);
  if ('chance' in c) return ctx.rng.chance(c.chance);
  if ('hpBelow' in c) return p.hp < f.stats.maxHp * c.hpBelow;
  if ('hpAbove' in c) return p.hp > f.stats.maxHp * c.hpAbove;
  if ('target' in c) {
    if (!enemy) return false;
    if (c.target === 'boss') return enemy.kind === 'gumiho';
    if (c.target === 'named') return enemy.role === 'bounty' || enemy.role === 'quarry';
    const fodder = enemy.kind !== 'gumiho' && GHOSTS[enemy.kind].fodder;
    return c.target === 'fodder' ? fodder : !fodder && enemy.kind !== 'gumiho';
  }
  if ('attack' in c) return args.kind === c.attack;
  if ('plainDraw' in c) return args.kind === 'draw' && p.drawKind === 'slash';
  if ('heavy' in c) return args.heavy === true;
  if ('bare' in c) return p.bare > 0;
  if ('calm' in c) return p.calmT >= c.calm;
  if ('unhurt' in c) return !p.hurtOnFloor;
  if ('stacks' in c) return (s.stacks.get(c.stacks.key)?.n ?? 0) >= c.stacks.atLeast;
  if ('marked' in c) return !!enemy && s.marks.get(enemy.id)?.source === ctx.source;
  if ('firstFloor' in c) return f.index === 0;
  if ('once' in c) {
    if (c.once === 'night') {
      // Night-long "once" uses the floor's carried list (the run banks it between floors).
      const used = f.used as string[];
      if (used.includes(onceKey)) return false;
      used.push(onceKey);
      return true;
    }
    if (s.once.has(onceKey)) return false;
    s.once.add(onceKey);
    return true;
  }
  return true;
}
