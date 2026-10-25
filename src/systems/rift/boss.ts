import { BOSSES } from '../../data/ghosts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { isFloor, makeEnemy } from './mapgen';
import { dist, freeNeighbours, stepToward } from './space';
import type { Enemy, Floor, Pos } from './types';

// Called after the boss takes damage.
export function checkBossPhase(f: Floor, e: Enemy): void {
  const b = f.boss;
  if (!b || b.id !== e.id || b.phase === 2) return;
  if (e.hp <= e.maxHp * BOSSES.printer.phase2Ratio) {
    b.phase = 2;
    f.events.push({ type: 'bossPhase', phase: 2 });
  }
}

function lineTiles(f: Floor, phase: 1 | 2): Pos[] {
  const p = f.player;
  const tiles: Pos[] = [];
  for (let x = 0; x < f.cols; x++) if (isFloor(f, x, p.y)) tiles.push({ x, y: p.y });
  if (phase === 2) for (let y = 0; y < f.rows; y++) if (y !== p.y && isFloor(f, p.x, y)) tiles.push({ x: p.x, y });
  return tiles;
}

// 윤전기 귀신: paper-roller line sweep (cannot be parried — dodge it) > adjacent strike (parriable)
// > summon > slow walk. The sweep comes even when the director hugs the boss.
export function updateBoss(f: Floor, e: Enemy, rng: SeededRNG): void {
  const b = f.boss;
  if (!b) return;
  const data = BOSSES.printer;
  b.lineTimer -= 1;
  b.summonTimer -= 1;
  if (b.lineTimer <= 0) {
    e.windup = lineTiles(f, b.phase);
    e.windupDamage = data.lineDamage;
    e.windupParriable = false;
    b.lineTimer = b.phase === 2 ? data.phase2LineEvery : data.lineEvery;
    return;
  }
  if (dist(e, f.player) === 1) {
    e.windup = [{ x: f.player.x, y: f.player.y }];
    e.windupDamage = data.damage;
    e.windupParriable = true;
    return;
  }
  if (b.summonTimer <= 0) {
    const spots = freeNeighbours(f, e);
    if (spots.length > 0) makeEnemy(f, data.summon, rng.pick(spots)).awake = true;
    b.summonTimer = b.phase === 2 ? data.phase2SummonEvery : data.summonEvery;
    return;
  }
  if (f.turn % data.moveEvery === 0) stepToward(f, e);
}
