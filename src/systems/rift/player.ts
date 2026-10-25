import { EXORCISTS } from '../../data/protagonist.data';
import { WEAPONS } from '../../data/weapons.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { hitEnemy } from './combat';
import { angleDiff, dist, inTelegraph, moveBody } from './physics';
import type { Floor, RiftInput } from './types';

const dirOf = (a: number) => ({ x: Math.cos(a), y: Math.sin(a) });

// A swing of the newspaper-wrapped sword: a cone in front, every N-th swing of a combo is heavy.
function swing(f: Floor, rng: SeededRNG): void {
  const p = f.player;
  const w = WEAPONS[f.weapon];
  const s = f.stats;
  p.combo = p.comboT > 0 ? p.combo + 1 : 1;
  const heavy = p.combo % s.comboEvery === 0;
  const damage = s.slash + (p.bare > 0 ? s.bareSlashBonus : 0) + (heavy ? s.comboBonus : 0);
  let landed = false;
  for (const e of [...f.enemies]) {
    if (e.hp <= 0) continue;
    const a = Math.atan2(e.y - p.y, e.x - p.x);
    if (dist(e, p) - e.r > w.reach || angleDiff(a, p.aim) > w.arc / 2) continue;
    hitEnemy(f, e, 'slash', damage, heavy, dirOf(a), rng);
    landed = true;
  }
  if (landed) p.focus = Math.min(s.focusMax, p.focus + 1);
  p.swingT = w.swingTime;
  p.comboT = w.swingTime + w.comboWindow;
  p.swingFx = 0;
  f.events.push({ type: 'slash', x: p.x, y: p.y });
}

// 발도: counters melee telegraphs about to land on the director (last parryWindow seconds,
// enemy within drawReach). With a full focus gauge it is a free strike all around.
// Otherwise it whiffs and leaves the director open for a moment.
function draw(f: Floor, rng: SeededRNG): void {
  const p = f.player;
  const w = WEAPONS[f.weapon];
  const s = f.stats;
  const countered = f.enemies.filter(
    (e) =>
      e.hp > 0 &&
      dist(e, p) - e.r <= w.drawReach &&
      e.teles.some((t) => t.parriable && t.t <= w.parryWindow && inTelegraph(t, p, p.r)),
  );
  if (countered.length > 0) {
    for (const e of countered) {
      e.teles = e.teles.filter((t) => !t.parriable);
      e.state = 'stun';
      e.timer = w.drawStun;
      f.events.push({ type: 'parry', x: e.x, y: e.y });
      hitEnemy(f, e, 'draw', s.draw, true, dirOf(Math.atan2(e.y - p.y, e.x - p.x)), rng);
    }
    p.bare = s.bareTime;
    p.iframes = Math.max(p.iframes, w.parryWindow);
    return;
  }
  if (p.focus >= s.focusMax) {
    p.focus = 0;
    p.bare = s.bareTime;
    f.events.push({ type: 'parry', x: p.x, y: p.y });
    for (const e of [...f.enemies]) {
      if (e.hp > 0 && dist(e, p) - e.r <= w.drawReach) hitEnemy(f, e, 'draw', s.draw, true, dirOf(Math.atan2(e.y - p.y, e.x - p.x)), rng);
    }
    return;
  }
  p.recoverT = w.whiffRecover;
}

export function updatePlayer(f: Floor, input: RiftInput, dt: number, rng: SeededRNG): void {
  const p = f.player;
  const d = EXORCISTS.director;
  p.swingT = Math.max(0, p.swingT - dt);
  p.swingFx += dt;
  p.comboT = Math.max(0, p.comboT - dt);
  if (p.comboT <= 0) p.combo = 0;
  p.dashCd = Math.max(0, p.dashCd - dt);
  p.iframes = Math.max(0, p.iframes - dt);
  p.recoverT = Math.max(0, p.recoverT - dt);
  p.bare = Math.max(0, p.bare - dt);
  p.darkness = Math.max(0, p.darkness - dt);
  p.aim = input.aim;

  const busy = p.recoverT > 0;
  if (input.dash && p.dashCd <= 0 && p.dashT <= 0 && !busy) {
    const len = Math.hypot(input.moveX, input.moveY);
    const dir = len > 0 ? { x: input.moveX / len, y: input.moveY / len } : dirOf(p.aim);
    p.dashX = dir.x;
    p.dashY = dir.y;
    p.dashT = d.dashTime;
    p.dashCd = d.dashCooldown + d.dashTime;
    p.iframes = Math.max(p.iframes, d.dashIframes);
    f.events.push({ type: 'dash', x: p.x, y: p.y });
  }

  if (p.dashT > 0) {
    p.dashT -= dt;
    moveBody(f, p, p.dashX * d.dashSpeed * dt, p.dashY * d.dashSpeed * dt);
    p.moving = true;
  } else {
    const len = Math.hypot(input.moveX, input.moveY);
    p.moving = len > 0;
    if (len > 0) {
      const speed = d.moveSpeed * (p.swingT > 0 || busy ? d.swingMoveMult : 1);
      moveBody(f, p, (input.moveX / len) * speed * dt, (input.moveY / len) * speed * dt);
    }
  }

  if (p.dashT > 0 || busy) return;
  if (input.draw) draw(f, rng);
  else if (input.attack && p.swingT <= 0) swing(f, rng);
}
