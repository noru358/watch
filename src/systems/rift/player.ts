import { EXORCISTS } from '../../data/protagonist.data';
import { WEAPONS } from '../../data/weapons.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { OBJECTIVES } from '../../data/objectives.data';
import { hitEnemy } from './combat';
import { runHooks } from './hooks';
import { useActive } from './skills';
import { survivorOf } from './objectives';
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
    if (dist(e, p) - e.r > s.reach || angleDiff(a, p.aim) > w.arc / 2) continue;
    hitEnemy(f, e, 'slash', damage, heavy, dirOf(a), rng);
    landed = true;
  }
  if (landed) p.focus = Math.min(s.focusMax, p.focus + 1);
  runHooks(f, 'onSwing', { heavy, damage, rng });
  p.swingT = heavy ? s.finisherRecovery : s.swingTime;
  p.comboT = p.swingT + w.comboWindow;
  p.swingFx = 0;
  f.events.push({ type: 'slash', x: p.x, y: p.y });
}

// Enemies whose melee telegraph would be countered by a 발도 right now
// (in its last parryWindow seconds, aimed at the director, within drawReach).
export function counterable(f: Floor): Enemy[] {
  const p = f.player;
  const w = WEAPONS[f.weapon];
  const window = f.stats.parryWindow;
  return f.enemies.filter(
    (e) =>
      e.hp > 0 &&
      dist(e, p) - e.r <= w.drawReach &&
      e.teles.some((t) => t.parriable && t.t <= window && inTelegraph(t, p, p.r)),
  );
}

// 발도 — one key, three outcomes, always a visible strike:
// 1) a yellow telegraph is about to land on the director → 받아치기 (counter: cancel, stun, big damage, bared blade);
// 2) else the focus gauge is full → 일섬 (big damage all around, bared blade);
// 3) else a wide slash in front.
// The press decides the outcome (a counter is judged and the attack cancelled at once, so it stays
// responsive); then the director holds the stance for drawStartup and the cut lands (releaseDraw).
function draw(f: Floor): void {
  const p = f.player;
  const w = WEAPONS[f.weapon];
  const s = f.stats;
  p.drawCd = s.drawCooldown;
  p.drawFx = 0;
  p.drawT = w.drawStartup;
  p.drawAim = p.aim;
  p.countered = [];
  f.events.push({ type: 'drawStance', x: p.x, y: p.y });
  const countered = counterable(f);
  if (countered.length > 0) {
    p.drawKind = 'counter';
    for (const e of countered) {
      e.teles = e.teles.filter((t) => !t.parriable);
      e.state = 'stun';
      e.timer = w.drawStun + w.drawStartup;
      p.countered.push(e.id);
    }
    p.iframes = Math.max(p.iframes, s.parryWindow + w.drawStartup);
    runHooks(f, 'onCounter', {});
    return;
  }
  if (p.focus >= s.focusMax) {
    p.drawKind = 'strike';
    p.focus = 0;
    runHooks(f, 'onFocusStrike', {});
    return;
  }
  p.drawKind = 'slash';
}

// The stance ends: the cut lands.
function releaseDraw(f: Floor, rng: SeededRNG): void {
  const p = f.player;
  const w = WEAPONS[f.weapon];
  const s = f.stats;
  const hitAll = (reach: number, inArc: (a: number) => boolean, damage: number, empowered: boolean, skip: readonly number[] = []) => {
    for (const e of [...f.enemies]) {
      if (e.hp <= 0 || skip.includes(e.id)) continue;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      if (dist(e, p) - e.r <= reach && inArc(a)) hitEnemy(f, e, 'draw', damage, empowered, dirOf(a), rng);
    }
  };
  if (p.drawKind === 'slash') {
    f.events.push({ type: 'drawCut', x: p.x, y: p.y });
    hitAll(w.drawReach, (a) => angleDiff(a, p.drawAim) <= w.drawArc / 2, s.drawSlash, false);
    return;
  }
  f.events.push({ type: 'parry', x: p.x, y: p.y });
  if (p.drawKind === 'counter') {
    for (const e of f.enemies) {
      if (!p.countered.includes(e.id) || e.hp <= 0) continue;
      hitEnemy(f, e, 'draw', s.draw, true, dirOf(Math.atan2(e.y - p.y, e.x - p.x)), rng);
    }
  }
  // Counter and focus strike both cut everything around, as hard as each other.
  hitAll(w.burstReach, () => true, s.draw, true, p.countered);
  p.bare = s.bareTime;
}

export function updatePlayer(f: Floor, input: RiftInput, dt: number, rng: SeededRNG): void {
  const p = f.player;
  const d = EXORCISTS.director;
  p.swingT = Math.max(0, p.swingT - dt);
  p.swingFx += dt;
  p.comboT = Math.max(0, p.comboT - dt);
  if (p.comboT <= 0) p.combo = 0;
  const s = f.stats;
  if (p.dashCharges < s.dashCharges) {
    p.dashCd -= dt;
    if (p.dashCd <= 0) {
      p.dashCharges += 1;
      p.dashCd = p.dashCharges < s.dashCharges ? s.dashCooldown : 0;
    }
  } else p.dashCd = 0;
  p.iframes = Math.max(0, p.iframes - dt);
  p.drawCd = Math.max(0, p.drawCd - dt);
  p.drawFx += dt;
  p.bare = Math.max(0, p.bare - dt);
  p.darkness = Math.max(0, p.darkness - dt);
  f.skillCd = Math.max(0, f.skillCd - dt);
  p.aim = input.aim;

  // 발도 stance: rooted, no other action until the cut lands.
  if (p.drawT > 0) {
    p.drawT -= dt;
    p.moving = false;
    if (p.drawT <= 0) {
      p.drawT = 0;
      releaseDraw(f, rng);
    }
    return;
  }

  if (input.dash && p.dashCharges > 0 && p.dashT <= 0) {
    const len = Math.hypot(input.moveX, input.moveY);
    const dir = len > 0 ? { x: input.moveX / len, y: input.moveY / len } : dirOf(p.aim);
    p.dashX = dir.x;
    p.dashY = dir.y;
    p.dashT = s.dashTime;
    if (p.dashCharges === s.dashCharges) p.dashCd = s.dashCooldown + s.dashTime;
    p.dashCharges -= 1;
    p.iframes = Math.max(p.iframes, s.dashIframes);
    p.dodged = false;
    f.events.push({ type: 'dash', x: p.x, y: p.y });
  }

  if (p.dashT > 0) {
    p.dashT -= dt;
    moveBody(f, p, p.dashX * s.dashSpeed * dt, p.dashY * s.dashSpeed * dt, d.cornerNudge);
    p.moving = true;
    runHooks(f, 'onDashTick', {});
    if (p.dashT <= 0) runHooks(f, 'onDashEnd', { rng });
  } else {
    const len = Math.hypot(input.moveX, input.moveY);
    p.moving = len > 0;
    const move = { mult: 1, moving: p.moving, attacking: input.attack || input.draw, dt };
    runHooks(f, 'onMove', move);
    if (len > 0) {
      const slowed = p.swingFx < d.swingSlowTime;
      const carrying = survivorOf(f)?.state === 'following';
      const speed = s.moveSpeed * move.mult * (slowed ? d.swingMoveMult : 1) * (carrying ? OBJECTIVES.rescue.carryMoveMult : 1);
      moveBody(f, p, (input.moveX / len) * speed * dt, (input.moveY / len) * speed * dt, d.cornerNudge);
    }
  }

  if (p.dashT > 0) return;
  if (input.skill) useActive(f, rng);
  if (input.draw && p.drawCd <= 0) draw(f);
  else if (input.attack && p.swingT <= 0) swing(f, rng);
}
