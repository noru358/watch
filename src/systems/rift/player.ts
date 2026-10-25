import { EXORCISTS } from '../../data/protagonist.data';
import { WEAPONS } from '../../data/weapons.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { hitEnemy } from './combat';
import { angleDiff, dist, inTelegraph, moveBody } from './physics';
import type { Enemy, Floor, RiftInput } from './types';

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

// Enemies whose melee telegraph would be countered by a 발도 right now
// (in its last parryWindow seconds, aimed at the director, within drawReach).
export function counterable(f: Floor): Enemy[] {
  const p = f.player;
  const w = WEAPONS[f.weapon];
  return f.enemies.filter(
    (e) =>
      e.hp > 0 &&
      dist(e, p) - e.r <= w.drawReach &&
      e.teles.some((t) => t.parriable && t.t <= w.parryWindow && inTelegraph(t, p, p.r)),
  );
}

// 발도 — one key, three outcomes, always a visible strike:
// 1) a yellow telegraph is about to land on the director → 받아치기 (counter: cancel, stun, big damage, bared blade);
// 2) else the focus gauge is full → 일섬 (big damage all around, bared blade);
// 3) else a wide slash in front.
function draw(f: Floor, rng: SeededRNG): void {
  const p = f.player;
  const w = WEAPONS[f.weapon];
  const s = f.stats;
  const hitAll = (inArc: (a: number) => boolean, damage: number, empowered: boolean) => {
    for (const e of [...f.enemies]) {
      if (e.hp <= 0) continue;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      if (dist(e, p) - e.r <= w.drawReach && inArc(a)) hitEnemy(f, e, 'draw', damage, empowered, dirOf(a), rng);
    }
  };
  p.drawCd = w.drawCooldown;
  p.drawFx = 0;
  const countered = counterable(f);
  if (countered.length > 0) {
    p.drawKind = 'counter';
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
    p.drawKind = 'strike';
    p.focus = 0;
    p.bare = s.bareTime;
    f.events.push({ type: 'parry', x: p.x, y: p.y });
    hitAll(() => true, s.draw, true);
    return;
  }
  p.drawKind = 'slash';
  f.events.push({ type: 'slash', x: p.x, y: p.y });
  hitAll((a) => angleDiff(a, p.aim) <= w.drawArc / 2, w.drawSlash, false);
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
  p.drawCd = Math.max(0, p.drawCd - dt);
  p.drawFx += dt;
  p.bare = Math.max(0, p.bare - dt);
  p.darkness = Math.max(0, p.darkness - dt);
  p.aim = input.aim;

  if (input.dash && p.dashCd <= 0 && p.dashT <= 0) {
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
    moveBody(f, p, p.dashX * d.dashSpeed * dt, p.dashY * d.dashSpeed * dt, d.cornerNudge);
    p.moving = true;
  } else {
    const len = Math.hypot(input.moveX, input.moveY);
    p.moving = len > 0;
    if (len > 0) {
      const slowed = p.swingFx < d.swingSlowTime;
      const speed = d.moveSpeed * (slowed ? d.swingMoveMult : 1);
      moveBody(f, p, (input.moveX / len) * speed * dt, (input.moveY / len) * speed * dt, d.cornerNudge);
    }
  }

  if (p.dashT > 0) return;
  if (input.draw && p.drawCd <= 0) draw(f, rng);
  else if (input.attack && p.swingT <= 0) swing(f, rng);
}
