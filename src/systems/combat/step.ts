import { COMBAT } from '../../data/combat.data';
import { ROOM_SIZE } from '../../data/contracts.data';
import { ENEMIES } from '../../data/ghosts.data';
import { TOOLS } from '../../data/tools.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { updateBoss } from './boss';
import { damageEnemy, damagePlayer } from './damage';
import { randomSpawnPoint, spawnEnemy, updateEnemies } from './enemies';
import { dist2, normalize, savePrev } from './geometry';
import { runTraitHooks } from './hooks';
import { updatePlayer } from './player';
import type { InputFrame, World } from './types';

function updateProjectiles(world: World, dt: number, rng: SeededRNG): void {
  const p = world.player;
  const keep = [];
  for (const pr of world.projectiles) {
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    pr.life -= dt;
    let alive = pr.life > 0 && pr.x > 0 && pr.x < ROOM_SIZE.width && pr.y > 0 && pr.y < ROOM_SIZE.height;
    if (alive && pr.owner === 'player') {
      for (const e of world.enemies) {
        if (e.hp <= 0 || e.mode === 'telegraph' || pr.hitIds.includes(e.id)) continue;
        const r = pr.radius + ENEMIES[e.kind].radius;
        if (dist2(pr.x, pr.y, e.x, e.y) > r * r) continue;
        pr.hitIds.push(e.id);
        damageEnemy(world, e, pr.damage, rng, { empowered: pr.empowered, stun: pr.stun });
        runTraitHooks(world, 'onHit', { projectile: pr, enemy: e, rng });
        if (!pr.pierce) {
          alive = false;
          break;
        }
      }
    } else if (alive && pr.owner === 'enemy') {
      const r = pr.radius + world.stats.radius;
      if (dist2(pr.x, pr.y, p.x, p.y) <= r * r && damagePlayer(world, pr.damage)) alive = false;
    }
    if (alive) keep.push(pr);
  }
  world.projectiles = keep;
}

function updateZones(world: World, dt: number, rng: SeededRNG): void {
  const tool = TOOLS[world.tool];
  for (const z of world.zones) {
    z.life -= dt;
    z.tickTimer -= dt;
    if (z.tickTimer > 0) continue;
    z.tickTimer = tool.wardTickInterval;
    for (const e of world.enemies) {
      if (e.hp > 0 && e.mode !== 'telegraph' && dist2(z.x, z.y, e.x, e.y) <= z.radius * z.radius) {
        damageEnemy(world, e, tool.wardTickDamage, rng);
      }
    }
  }
  world.zones = world.zones.filter((z) => z.life > 0);
}

function updatePickups(world: World, dt: number): void {
  const p = world.player;
  const magnetAll = world.status !== 'fighting';
  const keep = [];
  for (const pk of world.pickups) {
    const d2 = dist2(pk.x, pk.y, p.x, p.y);
    if (d2 <= COMBAT.pickupCollectRadius ** 2) {
      world.loot += pk.value;
      world.events.push({ type: 'pickupCollected', x: pk.x, y: pk.y, value: pk.value });
      continue;
    }
    if (magnetAll || d2 <= COMBAT.pickupMagnetRange ** 2) {
      const d = normalize(p.x - pk.x, p.y - pk.y);
      pk.x += d.x * COMBAT.pickupSpeed * dt;
      pk.y += d.y * COMBAT.pickupSpeed * dt;
    }
    keep.push(pk);
  }
  world.pickups = keep;
}

function advanceWaves(world: World, rng: SeededRNG): void {
  if (world.status !== 'fighting' || world.roomKind !== 'combat' || world.enemies.length > 0) return;
  const wave = world.waves[world.waveIndex];
  if (!wave) {
    world.status = 'cleared';
    world.projectiles = world.projectiles.filter((pr) => pr.owner === 'player');
    world.events.push({ type: 'roomCleared', boss: false });
    return;
  }
  world.waveIndex += 1;
  for (const spawn of wave) {
    for (let i = 0; i < spawn.count; i++) {
      const pt = randomSpawnPoint(world, rng);
      spawnEnemy(world, spawn.ghost, pt.x, pt.y, rng);
    }
  }
}

function finishBoss(world: World): void {
  // Everything left in the room is purified along with the source.
  for (const pk of world.pickups) world.loot += pk.value;
  world.pickups = [];
  world.enemies = [];
  world.projectiles = [];
  world.events.push({ type: 'roomCleared', boss: true });
}

const TERMINAL = new Set<World['status']>(['exited', 'extracted', 'dead', 'bossDefeated']);

// One fixed-timestep tick of a room. Pure apart from mutating `world` and `rng`.
export function step(world: World, input: InputFrame, dt: number, rng: SeededRNG): void {
  if (TERMINAL.has(world.status)) return;
  world.tick += 1;
  savePrev(world.player);
  for (const e of world.enemies) savePrev(e);
  for (const pr of world.projectiles) savePrev(pr);

  updatePlayer(world, input, dt, rng);
  if (world.roomKind === 'boss') updateBoss(world, dt, rng);
  updateEnemies(world, dt, rng);
  updateProjectiles(world, dt, rng);
  updateZones(world, dt, rng);
  if (TERMINAL.has(world.status)) {
    if (world.status === 'bossDefeated') finishBoss(world);
    return;
  }
  world.enemies = world.enemies.filter((e) => e.hp > 0);
  updatePickups(world, dt);
  advanceWaves(world, rng);
}
