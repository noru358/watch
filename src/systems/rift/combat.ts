import { DUNGEON } from '../../data/dungeon.data';
import { BOSSES, GHOSTS } from '../../data/ghosts.data';
import { EXORCISTS } from '../../data/protagonist.data';
import { WEAPONS } from '../../data/weapons.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { runCardHooks } from './hooks';
import type { Enemy, Floor } from './types';


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
  kind: 'slash' | 'draw',
  base: number,
  empowered: boolean,
  dir: { x: number; y: number },
  rng: SeededRNG,
): void {
  if (e.hp <= 0 || e.state === 'warp') return;
  const atk = { damage: base, kind };
  runCardHooks(f, 'onBeforeAttack', atk);
  e.hp -= atk.damage;
  const push = WEAPONS[f.weapon].knockback * (empowered ? 2 : 1) * (e.kind === 'gumiho' ? 0.2 : 1);
  e.knockX = (dir.x * push) / DUNGEON.knockTime;
  e.knockY = (dir.y * push) / DUNGEON.knockTime;
  f.events.push({ type: 'enemyHit', x: e.x, y: e.y, amount: atk.damage, entityId: e.id, empowered, kind: e.kind });
  runCardHooks(f, 'onHit', { enemy: e, damage: atk.damage, rng });
  checkBossPhase(f, e);
  if (e.hp > 0) return;

  e.teles = [];
  const kindId = e.kind;
  const drop = kindId === 'gumiho' ? BOSSES[kindId].drop : GHOSTS[kindId].drop;
  f.pickups.push({ x: e.x, y: e.y, value: drop });
  f.events.push({ type: 'enemyKilled', x: e.x, y: e.y, kind: e.kind, entityId: e.id });
  runCardHooks(f, 'onKill', { enemy: e, rng });
  if (kindId === 'gumiho') {
    // The source is purified: everything else in the room goes with it.
    for (const k of f.pickups) f.loot += k.value;
    f.pickups = [];
    f.enemies.forEach((o) => {
      o.hp = 0;
      o.teles = [];
    });
    f.status = 'bossDefeated';
    f.events.push({ type: 'roomCleared', boss: true });
  }
}

export function hurtPlayer(f: Floor, amount: number, darkness: number): void {
  const p = f.player;
  if (p.iframes > 0 || p.hp <= 0) return;
  const dmg = { amount };
  runCardHooks(f, 'onTakeDamage', dmg);
  p.iframes = EXORCISTS.director.hurtIframes;
  if (dmg.amount <= 0) return;
  p.hp = Math.max(0, p.hp - dmg.amount);
  f.events.push({ type: 'playerHurt', x: p.x, y: p.y, amount: dmg.amount });
  if (darkness > 0) {
    p.darkness = Math.max(p.darkness, darkness);
    f.events.push({ type: 'darkness', duration: darkness });
  }
  if (p.hp <= 0) f.status = 'dead';
}
