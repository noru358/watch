import { ENEMIES } from '../../data/ghosts.data';
import { EXORCISTS } from '../../data/protagonist.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { runTraitHooks } from './hooks';
import { nextId } from './geometry';
import type { EnemyState, World } from './types';

export interface ProjectileOptions {
  damage: number;
  speed: number;
  radius: number;
  life: number;
  pierce?: boolean;
  stun?: number;
  canRicochet?: boolean;
  empowered?: boolean;
  owner?: 'player' | 'enemy';
}

export function spawnProjectile(world: World, x: number, y: number, dirX: number, dirY: number, o: ProjectileOptions): void {
  world.projectiles.push({
    id: nextId(world),
    owner: o.owner ?? 'player',
    x,
    y,
    prevX: x,
    prevY: y,
    vx: dirX * o.speed,
    vy: dirY * o.speed,
    radius: o.radius,
    damage: o.damage,
    life: o.life,
    pierce: o.pierce ?? false,
    stun: o.stun ?? 0,
    canRicochet: o.canRicochet ?? false,
    empowered: o.empowered ?? false,
    hitIds: [],
  });
}

export function damageEnemy(
  world: World,
  enemy: EnemyState,
  amount: number,
  rng: SeededRNG,
  opts: { empowered?: boolean; stun?: number } = {},
): void {
  if (enemy.hp <= 0) return;
  enemy.hp -= amount;
  if (opts.stun) enemy.stun = Math.max(enemy.stun, opts.stun);
  world.events.push({
    type: 'enemyHit',
    x: enemy.x,
    y: enemy.y,
    amount: Math.round(amount * 10) / 10,
    entityId: enemy.id,
    empowered: opts.empowered ?? false,
  });
  if (enemy.hp > 0) return;

  world.events.push({ type: 'enemyKilled', x: enemy.x, y: enemy.y, kind: enemy.kind, entityId: enemy.id });
  world.pickups.push({ id: nextId(world), x: enemy.x, y: enemy.y, value: ENEMIES[enemy.kind].dropValue });
  runTraitHooks(world, 'onKill', { enemy, rng });
  if (enemy.kind === 'printer') world.status = 'bossDefeated';
}

// Returns true if the hit landed.
export function damagePlayer(world: World, amount: number): boolean {
  const p = world.player;
  if (p.iframes > 0 || p.rollTime > 0 || p.hp <= 0) return false;
  const ctx = { amount };
  runTraitHooks(world, 'onTakeDamage', ctx);
  p.iframes = EXORCISTS.director.hurtIframes;
  if (ctx.amount <= 0) return false;
  p.hp = Math.max(0, p.hp - ctx.amount);
  world.events.push({ type: 'playerHurt', x: p.x, y: p.y, amount: ctx.amount });
  if (p.hp <= 0) world.status = 'dead';
  return true;
}

export function healPlayer(world: World, amount: number): void {
  const p = world.player;
  const healed = Math.min(amount, world.stats.maxHp - p.hp);
  if (healed <= 0) return;
  p.hp += healed;
  world.events.push({ type: 'playerHealed', x: p.x, y: p.y, amount: healed });
}
