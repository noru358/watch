import { GRID_ENEMIES } from '../../data/grid.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { isFloor } from './mapgen';
import type { Dir, GridAction, GridEnemy, GridFloor, Pos } from './types';

const DIRS: readonly Dir[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const dist = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const same = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;

export function enemyAt(f: GridFloor, x: number, y: number): GridEnemy | undefined {
  return f.enemies.find((e) => e.hp > 0 && e.x === x && e.y === y);
}

function blocked(f: GridFloor, x: number, y: number): boolean {
  return !isFloor(f, x, y) || !!enemyAt(f, x, y) || (f.player.x === x && f.player.y === y);
}

function hitEnemy(f: GridFloor, e: GridEnemy, amount: number, empowered: boolean): void {
  e.hp -= amount;
  f.events.push({ type: 'enemyHit', x: e.x, y: e.y, amount, entityId: e.id, empowered });
  if (e.hp > 0) return;
  e.windup = null;
  f.loot += GRID_ENEMIES[e.kind].drop;
  f.events.push({ type: 'enemyKilled', x: e.x, y: e.y, kind: e.kind, entityId: e.id });
}

function hurtPlayer(f: GridFloor, e: GridEnemy): void {
  const p = f.player;
  const data = GRID_ENEMIES[e.kind];
  p.hp = Math.max(0, p.hp - data.damage);
  f.events.push({ type: 'playerHurt', x: p.x, y: p.y, amount: data.damage });
  if (data.darknessTurns > 0) {
    p.darkness = Math.max(p.darkness, data.darknessTurns);
    f.events.push({ type: 'darkness', duration: data.darknessTurns });
  }
  if (p.hp <= 0) f.status = 'dead';
}

function slash(f: GridFloor, target: Pos): void {
  const e = enemyAt(f, target.x, target.y);
  f.events.push({ type: 'talismanThrown', x: f.player.x, y: f.player.y });
  if (!e) return;
  hitEnemy(f, e, f.stats.slash, false);
  f.player.focus = Math.min(f.stats.focusMax, f.player.focus + 1);
}

// 발도: counters every wound-up attack an ADJACENT enemy aims at the director
// (a dash from afar must be side-stepped); with a full focus gauge it is a free
// strike on all adjacent enemies; otherwise it whiffs.
function draw(f: GridFloor): void {
  const p = f.player;
  const countered = f.enemies.filter((e) => e.hp > 0 && dist(e, p) <= 1 && e.windup?.some((t) => same(t, p)));
  if (countered.length > 0) {
    for (const e of countered) {
      e.windup = null;
      e.dashTo = null;
      f.events.push({ type: 'parry', x: e.x, y: e.y });
      hitEnemy(f, e, f.stats.draw, true);
    }
    return;
  }
  if (p.focus >= f.stats.focusMax) {
    p.focus = 0;
    f.events.push({ type: 'parry', x: p.x, y: p.y });
    for (const e of f.enemies) {
      if (e.hp > 0 && Math.abs(e.x - p.x) <= 1 && Math.abs(e.y - p.y) <= 1) hitEnemy(f, e, f.stats.draw, true);
    }
  }
}

// Returns false if the action was invalid and no turn passed (e.g. walking into a wall).
function playerPhase(f: GridFloor, action: GridAction): boolean {
  const p = f.player;
  switch (action.kind) {
    case 'move': {
      p.facing = action.dir;
      const tx = p.x + action.dir.x;
      const ty = p.y + action.dir.y;
      if (enemyAt(f, tx, ty)) {
        slash(f, { x: tx, y: ty }); // bump attack
        return true;
      }
      if (!isFloor(f, tx, ty)) return false;
      p.x = tx;
      p.y = ty;
      const i = f.pickups.findIndex((k) => same(k, p));
      if (i >= 0) {
        const [k] = f.pickups.splice(i, 1);
        f.loot += k!.value;
        f.events.push({ type: 'pickupCollected', x: p.x, y: p.y, value: k!.value });
      }
      if (same(p, f.stairs)) f.status = 'stairs';
      return true;
    }
    case 'slash':
      slash(f, { x: p.x + p.facing.x, y: p.y + p.facing.y });
      return true;
    case 'draw':
      draw(f);
      return true;
    case 'wait':
      return true;
  }
}

function resolveWindup(f: GridFloor, e: GridEnemy): void {
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
  if (tiles.some((t) => same(t, p))) hurtPlayer(f, e);
  e.windup = null;
  e.dashTo = null;
}

function dashLine(f: GridFloor, e: GridEnemy, range: number): Pos[] | null {
  const p = f.player;
  if (e.x !== p.x && e.y !== p.y) return null;
  if (dist(e, p) > range) return null;
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

function stepToward(f: GridFloor, e: GridEnemy): void {
  const options = DIRS.map((d) => ({ x: e.x + d.x, y: e.y + d.y }))
    .filter((t) => !blocked(f, t.x, t.y))
    .sort((a, b) => dist(a, f.player) - dist(b, f.player));
  const best = options[0];
  if (best && dist(best, f.player) < dist(e, f.player)) {
    e.x = best.x;
    e.y = best.y;
  }
}

function enemyPhase(f: GridFloor, rng: SeededRNG): void {
  const p = f.player;
  for (const e of f.enemies) {
    if (e.hp <= 0 || f.status === 'dead') continue;
    const data = GRID_ENEMIES[e.kind];
    if (e.windup) {
      resolveWindup(f, e);
      continue;
    }
    if (!e.awake) {
      if (dist(e, p) > data.sight) continue;
      e.awake = true;
    }
    if (f.turn % data.moveEvery !== 0) continue;
    if (dist(e, p) === 1) {
      e.windup = [{ x: p.x, y: p.y }];
      continue;
    }
    if (data.teleportEvery > 0 && --e.timer <= 0) {
      const spots = DIRS.map((d) => ({ x: p.x + d.x, y: p.y + d.y })).filter((t) => !blocked(f, t.x, t.y));
      if (spots.length > 0) {
        const t = rng.pick(spots);
        e.x = t.x;
        e.y = t.y;
        e.timer = data.teleportEvery;
        f.events.push({ type: 'enemyTeleport', x: e.x, y: e.y });
        continue;
      }
    }
    if (data.dashRange > 0) {
      const line = dashLine(f, e, data.dashRange);
      if (line) {
        e.windup = line;
        e.dashTo = line[line.length - 1]!;
        continue;
      }
    }
    stepToward(f, e);
  }
  f.enemies = f.enemies.filter((e) => e.hp > 0);
}

// One full turn: the director acts, then every ghost acts. Returns false if no turn passed.
export function takeTurn(f: GridFloor, action: GridAction, rng: SeededRNG): boolean {
  if (f.status !== 'playing') return false;
  if (!playerPhase(f, action)) return false;
  f.enemies = f.enemies.filter((e) => e.hp > 0);
  if (f.status === 'playing') enemyPhase(f, rng);
  f.turn += 1;
  f.player.darkness = Math.max(0, f.player.darkness - 1);
  return true;
}
