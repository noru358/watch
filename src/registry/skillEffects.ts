import type { SeededRNG } from '../core/SeededRNG';
import { COMPANIONS, type CompanionData } from '../data/companions.data';
import { TOOLS, type ToolData } from '../data/tools.data';
import type { CompanionId, ToolId } from '../types/ids';
import { damageEnemy, healPlayer, spawnProjectile } from '../systems/combat/damage';
import { dist2, nearestEnemy, nextId, normalize } from '../systems/combat/geometry';
import type { World } from '../systems/combat/types';

type Effect<D> = (world: World, data: D, rng: SeededRNG) => void;

// Companion call skills, by ID (Rule 2).
export const COMPANION_SKILLS: Record<CompanionId, Effect<CompanionData>> = {
  grandma_shaman(world, data) {
    healPlayer(world, data.heal);
  },
  ex_detective(world, data) {
    const p = world.player;
    const target = nearestEnemy(world, p.x, p.y, Infinity);
    const base = target ? normalize(target.x - p.x, target.y - p.y) : { x: p.facingX, y: p.facingY };
    const baseAngle = Math.atan2(base.y, base.x);
    const half = (data.projectileCount - 1) / 2;
    for (let i = 0; i < data.projectileCount; i++) {
      const a = baseAngle + (i - half) * data.spread;
      spawnProjectile(world, p.x, p.y, Math.cos(a), Math.sin(a), {
        damage: data.damage,
        speed: data.projectileSpeed,
        radius: data.projectileRadius,
        life: data.projectileLife,
        pierce: true,
        stun: data.stun,
      });
    }
  },
  streamer(world, data, rng) {
    const p = world.player;
    for (const e of world.enemies) {
      if (e.hp > 0 && dist2(p.x, p.y, e.x, e.y) <= data.radius * data.radius) {
        damageEnemy(world, e, data.damage, rng, { stun: data.stun });
      }
    }
  },
};

// Tool skills, by ID.
export const TOOL_SKILLS: Record<ToolId, Effect<ToolData>> = {
  talisman(world, data) {
    const p = world.player;
    world.zones.push({ id: nextId(world), x: p.x, y: p.y, radius: data.wardRadius, life: data.wardDuration, tickTimer: 0 });
    world.events.push({ type: 'wardPlaced', x: p.x, y: p.y, radius: data.wardRadius });
  },
};

export function callCompanion(world: World, id: CompanionId, rng: SeededRNG): void {
  COMPANION_SKILLS[id](world, COMPANIONS[id], rng);
  world.events.push({ type: 'companionCalled', companion: id, x: world.player.x, y: world.player.y });
}

export function useToolSkill(world: World, rng: SeededRNG): void {
  TOOL_SKILLS[world.tool](world, TOOLS[world.tool], rng);
}
