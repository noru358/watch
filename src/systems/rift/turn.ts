import { BOSSES, GHOSTS } from '../../data/ghosts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { checkBossPhase, updateBoss } from './boss';
import { runCardHooks } from './hooks';
import { isFloor } from './mapgen';
import { dist, enemyAt, freeNeighbours, same, stepToward } from './space';
import type { Enemy, Floor, Pos, RiftAction } from './types';

function hitEnemy(f: Floor, e: Enemy, kind: 'slash' | 'draw', base: number, empowered: boolean, rng: SeededRNG): void {
  const atk = { damage: base, kind };
  runCardHooks(f, 'onBeforeAttack', atk);
  e.hp -= atk.damage;
  f.events.push({ type: 'enemyHit', x: e.x, y: e.y, amount: atk.damage, entityId: e.id, empowered });
  runCardHooks(f, 'onHit', { enemy: e, damage: atk.damage, rng });
  checkBossPhase(f, e);
  if (e.hp > 0) return;
  e.windup = null;
  const enemyKind = e.kind;
  const isBoss = enemyKind === 'printer';
  f.loot += enemyKind === 'printer' ? BOSSES[enemyKind].drop : GHOSTS[enemyKind].drop;
  f.events.push({ type: 'enemyKilled', x: e.x, y: e.y, kind: e.kind, entityId: e.id });
  runCardHooks(f, 'onKill', { enemy: e, rng });
  if (isBoss) {
    // The source is purified: everything else in the room goes with it.
    for (const k of f.pickups) f.loot += k.value;
    f.pickups = [];
    f.enemies.forEach((o) => (o.hp = 0));
    f.status = 'bossDefeated';
    f.events.push({ type: 'roomCleared', boss: true });
  }
}

function hurtPlayer(f: Floor, amount: number, darknessTurns: number): void {
  const p = f.player;
  const dmg = { amount };
  runCardHooks(f, 'onTakeDamage', dmg);
  if (dmg.amount <= 0) return;
  p.hp = Math.max(0, p.hp - dmg.amount);
  f.events.push({ type: 'playerHurt', x: p.x, y: p.y, amount: dmg.amount });
  if (darknessTurns > 0) {
    p.darkness = Math.max(p.darkness, darknessTurns);
    f.events.push({ type: 'darkness', duration: darknessTurns });
  }
  if (p.hp <= 0) f.status = 'dead';
}

// A normal hit with the newspaper-wrapped sword. Returns true if it landed.
function slash(f: Floor, target: Pos, rng: SeededRNG): boolean {
  const p = f.player;
  f.events.push({ type: 'slash', x: p.x, y: p.y });
  const e = enemyAt(f, target.x, target.y);
  if (!e) return false;
  const s = f.stats;
  const combo = p.combo + 1;
  const heavy = combo % s.comboEvery === 0;
  const damage = s.slash + (p.bare > 0 ? s.bareSlashBonus : 0) + (heavy ? s.comboBonus : 0);
  hitEnemy(f, e, 'slash', damage, heavy, rng);
  p.combo = combo;
  p.focus = Math.min(s.focusMax, p.focus + 1);
  return true;
}

// 발도: counters every parriable (melee) wound-up attack an ADJACENT enemy aims at
// the director (dashes and line sweeps must be dodged); with a full focus gauge it is a free
// strike on all 8 neighbours; otherwise it whiffs. Either success unwraps the blade.
function draw(f: Floor, rng: SeededRNG): void {
  const p = f.player;
  const countered = f.enemies.filter((e) => e.hp > 0 && e.windupParriable && dist(e, p) <= 1 && e.windup?.some((t) => same(t, p)));
  if (countered.length > 0) {
    for (const e of countered) {
      e.windup = null;
      e.dashTo = null;
      f.events.push({ type: 'parry', x: e.x, y: e.y });
      hitEnemy(f, e, 'draw', f.stats.draw, true, rng);
    }
    p.bare = f.stats.bareTurns;
    return;
  }
  if (p.focus < f.stats.focusMax) return;
  p.focus = 0;
  p.bare = f.stats.bareTurns;
  f.events.push({ type: 'parry', x: p.x, y: p.y });
  for (const e of [...f.enemies]) {
    if (e.hp > 0 && Math.abs(e.x - p.x) <= 1 && Math.abs(e.y - p.y) <= 1) hitEnemy(f, e, 'draw', f.stats.draw, true, rng);
  }
}

// Returns null if the action was invalid (no turn passes), else whether a hit landed.
function playerPhase(f: Floor, action: RiftAction, rng: SeededRNG): { landed: boolean } | null {
  const p = f.player;
  switch (action.kind) {
    case 'move': {
      p.facing = action.dir;
      const t = { x: p.x + action.dir.x, y: p.y + action.dir.y };
      if (enemyAt(f, t.x, t.y)) return { landed: slash(f, t, rng) }; // bump attack
      if (!isFloor(f, t.x, t.y)) return null;
      p.x = t.x;
      p.y = t.y;
      const i = f.pickups.findIndex((k) => same(k, p));
      if (i >= 0) {
        const [k] = f.pickups.splice(i, 1);
        f.loot += k!.value;
        f.events.push({ type: 'pickupCollected', x: p.x, y: p.y, value: k!.value });
      }
      if (f.stairs && same(p, f.stairs)) f.status = 'stairs';
      else if (f.payphone && same(p, f.payphone)) f.status = 'payphone';
      return { landed: false };
    }
    case 'slash':
      return { landed: slash(f, { x: p.x + p.facing.x, y: p.y + p.facing.y }, rng) };
    case 'draw':
      draw(f, rng);
      return { landed: false };
    case 'wait':
      return { landed: false };
  }
}

function resolveWindup(f: Floor, e: Enemy): void {
  const p = f.player;
  const tiles = e.windup ?? [];
  if (e.dashTo) {
    // Dash along the line, stopping just before the director if they're in it.
    let land: Pos = { x: e.x, y: e.y };
    for (const t of tiles) {
      if (same(t, p) || enemyAt(f, t.x, t.y)) break;
      land = t;
    }
    e.x = land.x;
    e.y = land.y;
  }
  if (tiles.some((t) => same(t, p))) hurtPlayer(f, e.windupDamage, e.kind === 'printer' ? 0 : GHOSTS[e.kind].darknessTurns);
  e.windup = null;
  e.dashTo = null;
}

function dashLine(f: Floor, e: Enemy, range: number): Pos[] | null {
  const p = f.player;
  if ((e.x !== p.x && e.y !== p.y) || dist(e, p) > range) return null;
  const dx = Math.sign(p.x - e.x);
  const dy = Math.sign(p.y - e.y);
  const line: Pos[] = [];
  for (let i = 1; i <= range; i++) {
    const t = { x: e.x + dx * i, y: e.y + dy * i };
    if (!isFloor(f, t.x, t.y)) break;
    line.push(t);
  }
  return line.some((t) => same(t, p)) ? line : null;
}

function updateGhost(f: Floor, e: Enemy, rng: SeededRNG): void {
  if (e.kind === 'printer') return;
  const p = f.player;
  const data = GHOSTS[e.kind];
  if (!e.awake) {
    if (dist(e, p) > data.sight) return;
    e.awake = true;
  }
  if (f.turn % data.moveEvery !== 0) return;
  if (dist(e, p) === 1) {
    e.windup = [{ x: p.x, y: p.y }];
    e.windupDamage = data.damage;
    e.windupParriable = true;
    return;
  }
  if (data.teleportEvery > 0 && --e.timer <= 0) {
    const spots = freeNeighbours(f, p);
    if (spots.length > 0) {
      const t = rng.pick(spots);
      e.x = t.x;
      e.y = t.y;
      e.timer = data.teleportEvery;
      f.events.push({ type: 'enemyTeleport', x: e.x, y: e.y });
      return;
    }
  }
  if (data.dashRange > 0) {
    const line = dashLine(f, e, data.dashRange);
    if (line) {
      e.windup = line;
      e.windupDamage = data.damage;
      e.windupParriable = false;
      e.dashTo = line[line.length - 1]!;
      return;
    }
  }
  stepToward(f, e);
}

function enemyPhase(f: Floor, rng: SeededRNG): void {
  for (const e of [...f.enemies]) {
    if (e.hp <= 0 || f.status !== 'playing') continue;
    if (e.windup) resolveWindup(f, e);
    else if (e.kind === 'printer') updateBoss(f, e, rng);
    else updateGhost(f, e, rng);
  }
  f.enemies = f.enemies.filter((e) => e.hp > 0);
}

// One full turn: the director acts, then every enemy acts. Returns false if no turn passed.
export function takeTurn(f: Floor, action: RiftAction, rng: SeededRNG): boolean {
  if (f.status !== 'playing') return false;
  const p = f.player;
  const bareBefore = p.bare;
  const result = playerPhase(f, action, rng);
  if (!result) return false;
  if (!result.landed) p.combo = 0;
  if (p.bare === bareBefore) p.bare = Math.max(0, p.bare - 1); // a fresh draw keeps its full duration
  f.enemies = f.enemies.filter((e) => e.hp > 0);
  if (f.status === 'playing') enemyPhase(f, rng);
  f.turn += 1;
  p.darkness = Math.max(0, p.darkness - 1);
  return true;
}

// The director answered the payphone prompt.
export function answerPayphone(f: Floor, goHome: boolean): void {
  if (f.status !== 'payphone') return;
  f.status = goHome ? 'extracted' : 'playing';
}
