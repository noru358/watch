import type { BossData } from '../../data/ghosts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { resolveTelegraphs } from './enemies';
import { makeEnemy } from './enemyFactory';
import { dist, isFloor, moveBody, steer } from './physics';
import type { Enemy, Floor, Telegraph } from './types';

function band(f: Floor, axis: 'row' | 'col', data: BossData, time: number): Telegraph {
  const p = f.player;
  return { shape: 'band', x: p.x, y: p.y, angle: 0, range: 0, width: data.sweepWidth, axis, t: time, total: time, damage: data.sweepDamage, parriable: false, darkness: 0 };
}

// 구미호 「월하」: nine-tail sweep across the room (cannot be countered — dodge it),
// close-range pounce (counter it with 발도), scatters fox-fire wisps. Phase 2 sweeps row + column, faster.
export function updateBoss(f: Floor, e: Enemy, dt: number, rng: SeededRNG, data: BossData): void {
  const b = f.boss;
  if (!b) return;
  const mult = b.phase === 2 ? data.phase2Mult : 1;
  b.sweepTimer -= dt;
  b.summonTimer -= dt;
  switch (e.state) {
    case 'stun':
    case 'recover':
      e.timer -= dt;
      if (e.timer <= 0) e.state = 'chase';
      return;
    case 'windup':
      if (resolveTelegraphs(f, e, dt)) {
        e.state = 'recover';
        e.timer = data.recover * mult;
      }
      return;
    default:
      break;
  }
  if (b.sweepTimer <= 0) {
    const time = data.sweepWindup * mult;
    e.teles = b.phase === 2 ? [band(f, 'row', data, time), band(f, 'col', data, time)] : [band(f, 'row', data, time)];
    e.state = 'windup';
    b.sweepTimer = data.sweepEvery * mult;
    return;
  }
  if (b.summonTimer <= 0) {
    b.summonTimer = data.summonEvery * mult;
    let placed = 0;
    for (let i = 0; i < 6 * data.summonCount && placed < data.summonCount; i++) {
      const spot = { x: e.x + rng.range(-data.summonSpread, data.summonSpread), y: e.y + rng.range(...data.summonBelow) };
      if (isFloor(f, Math.floor(spot.x), Math.floor(spot.y))) {
        makeEnemy(f, data.summon, spot).state = 'chase';
        placed++;
      }
    }
  }
  if (dist(e, f.player) - e.r - f.player.r <= data.slamTrigger) {
    const time = data.slamWindup * mult;
    e.teles = [{ shape: 'circle', x: e.x, y: e.y, angle: 0, range: data.slamRange, width: 0, axis: 'row', t: time, total: time, damage: data.damage, parriable: true, darkness: 0 }];
    e.state = 'windup';
    return;
  }
  const dir = steer(f, e);
  moveBody(f, e, dir.x * data.speed * dt, dir.y * data.speed * dt);
  if (dir.x !== 0) e.face = dir.x > 0 ? 1 : -1;
}
