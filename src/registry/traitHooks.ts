import type { SeededRNG } from '../core/SeededRNG';
import type { TraitData } from '../data/traits.data';
import type { TraitId } from '../types/ids';
import { TOOLS } from '../data/tools.data';
import { healPlayer, spawnProjectile } from '../systems/combat/damage';
import { nearestEnemy, normalize } from '../systems/combat/geometry';
import type { EnemyState, Projectile, World } from '../systems/combat/types';

// Fixed hook points (Rule 2). Adding one is an architecture change.
export interface TraitHookArgs {
  onRunStart: Record<string, never>;
  onRoomEnter: Record<string, never>;
  onBeforeAttack: { damage: number; empowered: boolean };
  onHit: { projectile: Projectile; enemy: EnemyState; rng: SeededRNG };
  onTakeDamage: { amount: number };
  onKill: { enemy: EnemyState; rng: SeededRNG };
  onRunEnd: Record<string, never>;
}
export type TraitHookName = keyof TraitHookArgs;

type Hook<K extends TraitHookName> = (world: World, data: TraitData, args: TraitHookArgs[K]) => void;
export type TraitHooks = { [K in TraitHookName]?: Hook<K> };

export const TRAIT_HOOKS: Record<TraitId, TraitHooks> = {
  ricochet: {
    onHit(world, data, { projectile, enemy, rng }) {
      if (!projectile.canRicochet || !rng.chance(data.chance)) return;
      const tool = TOOLS[world.tool];
      const target = nearestEnemy(world, enemy.x, enemy.y, tool.autoAimRange, [enemy.id]);
      if (!target) return;
      const dir = normalize(target.x - enemy.x, target.y - enemy.y);
      spawnProjectile(world, enemy.x, enemy.y, dir.x, dir.y, {
        damage: projectile.damage,
        speed: tool.projectileSpeed,
        radius: tool.projectileRadius,
        life: tool.projectileLife,
      });
      // The bounce must not hit the enemy it came from.
      world.projectiles[world.projectiles.length - 1]?.hitIds.push(enemy.id);
    },
  },
  roll_empower: {
    onBeforeAttack(world, data, atk) {
      if (!world.player.rolledSinceAttack) return;
      atk.damage *= data.amount;
      atk.empowered = true;
    },
  },
  vampiric: {
    onKill(world, data, { rng }) {
      if (rng.chance(data.chance)) healPlayer(world, data.amount);
    },
  },
  thick_skin: {}, // stat-only (computeExorcistStats)
  swift: {},
  sharp_talisman: {},
  salt_ward: {
    onRoomEnter(world, data) {
      world.player.shield = data.amount;
    },
    onTakeDamage(world, _data, dmg) {
      const p = world.player;
      if (p.shield <= 0 || dmg.amount <= 0) return;
      p.shield -= 1;
      dmg.amount = 0;
      world.events.push({ type: 'shieldBlocked', x: p.x, y: p.y });
    },
  },
};
