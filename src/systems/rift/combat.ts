import { DUNGEON } from '../../data/dungeon.data';
import { BOSSES, GHOSTS } from '../../data/ghosts.data';
import { WEAPONS } from '../../data/weapons.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { runHooks } from './hooks';
import { angleDiff, dist } from './physics';
import type { Enemy, Floor } from './types';

export type HitKind = 'slash' | 'draw' | 'skill';

// A real ghost (not swarm fodder, not the boss): what 섬멸 counts and kill-rewards look at.
export function isStrong(e: Enemy): boolean {
  return e.kind !== 'gumiho' && !GHOSTS[e.kind].fodder;
}

// Freezes a ghost for `time` (the boss only flinches: no stun).
export function stunEnemy(e: Enemy, time: number): void {
  if (e.kind === 'gumiho' || e.hp <= 0 || time <= 0) return;
  e.teles = [];
  e.state = 'stun';
  e.timer = Math.max(e.timer, time);
  e.asleep = false;
}


// Called after the boss takes damage.
function checkBossPhase(f: Floor, e: Enemy): void {
  const b = f.boss;
  if (!b || b.id !== e.id || b.phase === 2) return;
  if (e.hp <= e.maxHp * BOSSES.gumiho.phase2Ratio) {
    b.phase = 2;
    f.events.push({ type: 'bossPhase', phase: 2 });
  }
}

export function hitEnemy(
  f: Floor,
  e: Enemy,
  kind: HitKind,
  base: number,
  empowered: boolean,
  dir: { x: number; y: number },
  rng: SeededRNG,
): void {
  if (e.hp <= 0 || e.state === 'warp') return;
  const atk = { damage: base, kind };
  runHooks(f, 'onBeforeAttack', atk);
  e.asleep = false;
  e.sinceHit = 0;
  e.hp -= atk.damage;
  const push = WEAPONS[f.weapon].knockback * (empowered ? 2 : 1) * (e.kind === 'gumiho' ? 0.2 : 1);
  e.knockX = (dir.x * push) / DUNGEON.knockTime;
  e.knockY = (dir.y * push) / DUNGEON.knockTime;
  f.events.push({ type: 'enemyHit', x: e.x, y: e.y, amount: atk.damage, entityId: e.id, empowered, kind: e.kind });
  runHooks(f, 'onHit', { enemy: e, damage: atk.damage, kind, rng });
  checkBossPhase(f, e);
  if (e.hp > 0) return;

  e.teles = [];
  const kindId = e.kind;
  const drop = kindId === 'gumiho' ? BOSSES[kindId].drop : GHOSTS[kindId].drop + (GHOSTS[kindId].fodder ? f.mods.fodderDrop : 0);
  f.pickups.push({ x: e.x, y: e.y, value: drop });
  f.events.push({ type: 'enemyKilled', x: e.x, y: e.y, kind: e.kind, entityId: e.id });
  runHooks(f, 'onKill', { enemy: e, rng });
  if (kindId === 'gumiho') {
    // The source is purified: everything else in the room goes with it.
    for (const k of f.pickups) f.loot += k.value;
    f.pickups = [];
    f.enemies.forEach((o) => {
      o.hp = 0;
      o.teles = [];
    });
    f.shards += f.bossShards;
    f.status = 'bossDefeated';
    f.events.push({ type: 'roomCleared', boss: true });
  }
}

export function hurtPlayer(f: Floor, amount: number, darkness: number): void {
  const p = f.player;
  if (p.hp <= 0) return;
  if (p.iframes > 0) {
    // A hit that passed through a dash (스치기).
    if (p.dashT > 0 && !p.dodged && amount > 0) {
      p.dodged = true;
      runHooks(f, 'onDodge', {});
    }
    return;
  }
  const dmg = { amount };
  runHooks(f, 'onTakeDamage', dmg);
  p.iframes = f.stats.hurtIframes;
  if (dmg.amount <= 0) return;
  if (p.hp - dmg.amount <= 0) {
    const lethal = { prevent: false };
    runHooks(f, 'onLethal', lethal);
    if (lethal.prevent) {
      dmg.amount = p.hp - 1;
      f.events.push({ type: 'lastBreath', x: p.x, y: p.y });
    }
  }
  p.hp = Math.max(0, p.hp - dmg.amount);
  p.hurtOnFloor = true;
  f.events.push({ type: 'playerHurt', x: p.x, y: p.y, amount: dmg.amount });
  runHooks(f, 'onAfterHurt', {});
  if (darkness > 0) {
    p.darkness = Math.max(p.darkness, darkness);
    f.events.push({ type: 'darkness', duration: darkness });
  }
  if (p.hp <= 0) f.status = 'dead';
}

// Every live ghost within `reach` and inside the arc around `aim` takes `damage` (skills, ripples).
export function cutAround(f: Floor, rng: SeededRNG, reach: number, arc: number, aim: number, damage: number, kind: HitKind = 'skill'): number {
  const p = f.player;
  let hits = 0;
  for (const e of [...f.enemies]) {
    if (e.hp <= 0) continue;
    const a = Math.atan2(e.y - p.y, e.x - p.x);
    if (dist(e, p) - e.r > reach || (arc < Math.PI * 2 && angleDiff(a, aim) > arc / 2)) continue;
    hitEnemy(f, e, kind, damage, false, { x: Math.cos(a), y: Math.sin(a) }, rng);
    hits += 1;
  }
  return hits;
}
