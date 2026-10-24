import { COMBAT } from '../../data/combat.data';
import { COMPANIONS } from '../../data/companions.data';
import { EXORCISTS } from '../../data/protagonist.data';
import { TOOLS } from '../../data/tools.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { callCompanion, useToolSkill } from '../../registry/skillEffects';
import { spawnProjectile } from './damage';
import { runTraitHooks } from './hooks';
import { clampToRoom, dist2, isAtDoor, nearestEnemy, normalize, ROOM_CENTER } from './geometry';
import type { InputFrame, World } from './types';

function tryRoll(world: World, input: InputFrame): void {
  const p = world.player;
  const base = EXORCISTS.director;
  if (!input.roll || p.rollCd > 0 || p.rollTime > 0) return;
  const dir = input.moveX || input.moveY ? normalize(input.moveX, input.moveY) : { x: p.facingX, y: p.facingY };
  p.rollDirX = dir.x;
  p.rollDirY = dir.y;
  p.rollTime = base.rollDuration;
  p.rollCd = base.rollCooldown;
  p.rolledSinceAttack = true;
  world.events.push({ type: 'playerRolled', x: p.x, y: p.y });
}

function tryAttack(world: World, input: InputFrame): void {
  const p = world.player;
  const tool = TOOLS[world.tool];
  if (!input.attack || p.attackCd > 0 || p.rollTime > 0) return;
  const target = nearestEnemy(world, p.x, p.y, tool.autoAimRange);
  const dir = target ? normalize(target.x - p.x, target.y - p.y) : { x: p.facingX, y: p.facingY };
  const atk = { damage: world.stats.attackDamage, empowered: false };
  runTraitHooks(world, 'onBeforeAttack', atk);
  spawnProjectile(world, p.x, p.y, dir.x, dir.y, {
    damage: atk.damage,
    speed: tool.projectileSpeed,
    radius: tool.projectileRadius,
    life: tool.projectileLife,
    canRicochet: true,
    empowered: atk.empowered,
  });
  p.rolledSinceAttack = false;
  p.attackCd = tool.attackCooldown;
  world.events.push({ type: 'talismanThrown', x: p.x, y: p.y });
}

function tryCall(world: World, input: InputFrame, rng: SeededRNG): void {
  if (!input.call) return;
  const n = world.companions.length;
  // Calls the next ready companion in rotation.
  for (let i = 0; i < n; i++) {
    const idx = (world.nextCompanion + i) % n;
    const slot = world.companions[idx]!;
    if (slot.cooldown > 0) continue;
    callCompanion(world, slot.id, rng);
    slot.cooldown = COMPANIONS[slot.id].cooldown;
    world.nextCompanion = (idx + 1) % n;
    return;
  }
}

export function updatePlayer(world: World, input: InputFrame, dt: number, rng: SeededRNG): void {
  const p = world.player;
  const base = EXORCISTS.director;
  p.attackCd = Math.max(0, p.attackCd - dt);
  p.rollCd = Math.max(0, p.rollCd - dt);
  p.rollTime = Math.max(0, p.rollTime - dt);
  p.iframes = Math.max(0, p.iframes - dt);
  p.toolCd = Math.max(0, p.toolCd - dt);
  p.darkness = Math.max(0, p.darkness - dt);
  for (const c of world.companions) c.cooldown = Math.max(0, c.cooldown - dt);

  tryRoll(world, input);
  if (p.rollTime > 0) {
    p.x += p.rollDirX * base.rollSpeed * dt;
    p.y += p.rollDirY * base.rollSpeed * dt;
  } else if (input.moveX || input.moveY) {
    const d = normalize(input.moveX, input.moveY);
    p.x += d.x * world.stats.moveSpeed * dt;
    p.y += d.y * world.stats.moveSpeed * dt;
    p.facingX = d.x;
    p.facingY = d.y;
  }
  clampToRoom(p, world.stats.radius);

  tryAttack(world, input);
  if (input.tool && p.toolCd <= 0) {
    useToolSkill(world, rng);
    p.toolCd = TOOLS[world.tool].skillCooldown;
  }
  tryCall(world, input, rng);

  if (world.roomKind === 'payphone' && input.interact) {
    const r = COMBAT.payphoneInteractRange;
    if (dist2(p.x, p.y, ROOM_CENTER.x, ROOM_CENTER.y) <= r * r) world.status = 'extracted';
  }
  if (world.status === 'cleared' && isAtDoor(p)) world.status = 'exited';
}
