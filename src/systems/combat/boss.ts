import { COMBAT } from '../../data/combat.data';
import { BOSS_PATTERNS, ENEMIES } from '../../data/ghosts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { spawnProjectile } from './damage';
import { spawnEnemy } from './enemies';
import { clampToRoom, normalize } from './geometry';
import type { EnemyState, World } from './types';

const data = BOSS_PATTERNS.printer;

function fire(world: World, boss: EnemyState, dirX: number, dirY: number, speed: number): void {
  spawnProjectile(world, boss.x, boss.y, dirX, dirY, {
    owner: 'enemy',
    damage: data.bulletDamage,
    speed,
    radius: data.bulletRadius,
    life: data.bulletLife,
  });
}

function burst(world: World, boss: EnemyState, offset: number): void {
  const n = world.boss?.phase === 2 ? data.phase2BurstBullets : data.burstBullets;
  for (let i = 0; i < n; i++) {
    const a = offset + (i / n) * Math.PI * 2;
    fire(world, boss, Math.cos(a), Math.sin(a), data.burstSpeed);
  }
}

function summon(world: World, boss: EnemyState, rng: SeededRNG): void {
  const n = data.summonCount + (world.boss?.phase === 2 ? data.phase2ExtraSummons : 0);
  for (let i = 0; i < n; i++) {
    const e = spawnEnemy(world, 'cheonyeo', boss.x + rng.range(-data.summonSpreadX, data.summonSpreadX), boss.y + rng.range(...data.summonOffsetY), rng);
    clampToRoom(e, ENEMIES.cheonyeo.radius);
  }
}

// 윤전기 귀신: drifts along the top of the room and cycles burst → stream → summon.
export function updateBoss(world: World, dt: number, rng: SeededRNG): void {
  const b = world.boss;
  const boss = world.enemies.find((e) => e.kind === 'printer' && e.hp > 0);
  if (!b || !boss) return;
  const p = world.player;

  if (b.phase === 1 && boss.hp <= boss.maxHp * data.phase2HpRatio) {
    b.phase = 2;
    world.events.push({ type: 'bossPhase', phase: 2 });
  }
  if (boss.stun > 0) return; // stun is ticked down in updateEnemies

  const dx = p.x - boss.x;
  boss.x += Math.sign(dx) * Math.min(Math.abs(dx), ENEMIES.printer.moveSpeed * dt);
  boss.y = COMBAT.bossSpawnY;

  if (b.streamLeft > 0) {
    b.streamTimer -= dt;
    if (b.streamTimer <= 0) {
      const d = normalize(p.x - boss.x, p.y - boss.y);
      fire(world, boss, d.x, d.y, data.streamSpeed);
      b.streamLeft -= 1;
      b.streamTimer = data.streamGap;
    }
  }

  b.patternTimer -= dt;
  if (b.patternTimer > 0) return;
  const pattern = b.patternIndex % 3;
  b.patternIndex += 1;
  b.patternTimer = data.patternInterval * (b.phase === 2 ? data.phase2IntervalMult : 1);
  if (pattern === 0) burst(world, boss, b.patternIndex * data.burstRotation);
  else if (pattern === 1) {
    b.streamLeft = data.streamBullets;
    b.streamTimer = 0;
  } else summon(world, boss, rng);
}
