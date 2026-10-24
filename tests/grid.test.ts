import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { GRID_ENEMIES, GRID_MAP, GRID_PLAYER } from '../src/data/grid.data';
import { enterFloor, gridStats, isFloor, leaveFloor, pickGridCard, startGridRun, takeTurn, type GridFloor } from '../src/systems/grid';

function floorWith(seed = 1): { f: GridFloor; rng: SeededRNG } {
  const rng = new SeededRNG(seed);
  const f = enterFloor(startGridRun(), rng);
  return { f, rng };
}

// Clears the floor and places one enemy next to the director in an open spot.
function duel(kind: 'cheonyeo' | 'dalgyal' | 'subway' = 'cheonyeo') {
  const { f, rng } = floorWith(3);
  f.tiles.fill('floor');
  f.player.x = 10;
  f.player.y = 8;
  f.stairs = { x: 0, y: 0 };
  f.pickups = [];
  f.enemies = [{ id: 99, kind, x: 11, y: 8, hp: GRID_ENEMIES[kind].hp, awake: true, windup: null, dashTo: null, timer: 99 }];
  return { f, rng, e: f.enemies[0]! };
}

function reachable(f: GridFloor, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const seen = new Set<string>();
  const q = [from];
  while (q.length) {
    const p = q.shift()!;
    if (p.x === to.x && p.y === to.y) return true;
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const n = { x: p.x + d[0], y: p.y + d[1] };
      const k = `${n.x},${n.y}`;
      if (!seen.has(k) && isFloor(f, n.x, n.y)) {
        seen.add(k);
        q.push(n);
      }
    }
  }
  return false;
}

describe('grid map generation', () => {
  it('stairs and every enemy are reachable from the start', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { f } = floorWith(seed);
      expect(reachable(f, f.player, f.stairs)).toBe(true);
      for (const e of f.enemies) expect(reachable(f, f.player, e)).toBe(true);
      expect(f.enemies).toHaveLength(GRID_MAP.enemiesPerFloor[0]);
    }
  });
});

describe('grid turns', () => {
  it('walking into a wall does not spend a turn', () => {
    const { f, rng } = floorWith();
    f.tiles.fill('wall');
    f.tiles[f.player.y * f.cols + f.player.x] = 'floor';
    expect(takeTurn(f, { kind: 'move', dir: { x: 1, y: 0 } }, rng)).toBe(false);
    expect(f.turn).toBe(0);
  });

  it('an adjacent ghost telegraphs, then hits if the director stays', () => {
    const { f, rng, e } = duel();
    takeTurn(f, { kind: 'wait' }, rng);
    expect(e.windup).toEqual([{ x: 10, y: 8 }]);
    expect(f.player.hp).toBe(GRID_PLAYER.maxHp);
    takeTurn(f, { kind: 'wait' }, rng);
    expect(f.player.hp).toBe(GRID_PLAYER.maxHp - GRID_ENEMIES.cheonyeo.damage);
  });

  it('stepping off the marked tile dodges the hit', () => {
    const { f, rng } = duel();
    takeTurn(f, { kind: 'wait' }, rng);
    takeTurn(f, { kind: 'move', dir: { x: 0, y: 1 } }, rng);
    expect(f.player.hp).toBe(GRID_PLAYER.maxHp);
  });

  it('발도 on a wound-up attack parries it and deals draw damage', () => {
    const { f, rng, e } = duel('dalgyal');
    takeTurn(f, { kind: 'wait' }, rng);
    expect(e.windup).not.toBeNull();
    takeTurn(f, { kind: 'draw' }, rng);
    expect(f.player.hp).toBe(GRID_PLAYER.maxHp);
    expect(e.hp).toBe(GRID_ENEMIES.dalgyal.hp - GRID_PLAYER.drawDamage);
    expect(f.events.some((ev) => ev.type === 'parry')).toBe(true);
  });

  it('bump attacks fill focus; a full gauge allows a free draw strike', () => {
    const { f, rng, e } = duel('dalgyal');
    e.hp = 999;
    for (let i = 0; i < GRID_PLAYER.focusMax; i++) takeTurn(f, { kind: 'move', dir: { x: 1, y: 0 } }, rng);
    expect(f.player.focus).toBe(GRID_PLAYER.focusMax);
    e.windup = null;
    const hp = e.hp;
    takeTurn(f, { kind: 'draw' }, rng);
    expect(e.hp).toBe(hp - GRID_PLAYER.drawDamage);
    expect(f.player.focus).toBe(0);
  });

  it('a dash from afar cannot be parried, only side-stepped', () => {
    const { f, rng, e } = duel('subway');
    e.x = 14;
    takeTurn(f, { kind: 'wait' }, rng);
    takeTurn(f, { kind: 'draw' }, rng);
    expect(f.player.hp).toBe(GRID_PLAYER.maxHp - GRID_ENEMIES.subway.damage);

    const b = duel('subway');
    b.e.x = 14;
    takeTurn(b.f, { kind: 'wait' }, b.rng);
    takeTurn(b.f, { kind: 'move', dir: { x: 0, y: 1 } }, b.rng);
    expect(b.f.player.hp).toBe(GRID_PLAYER.maxHp);
  });

  it('subway wraith telegraphs a line dash and hits through it', () => {
    const { f, rng, e } = duel('subway');
    e.x = 14;
    takeTurn(f, { kind: 'wait' }, rng);
    expect(e.windup?.length).toBeGreaterThan(1);
    takeTurn(f, { kind: 'wait' }, rng);
    expect(f.player.hp).toBe(GRID_PLAYER.maxHp - GRID_ENEMIES.subway.damage);
    expect(e.x).toBe(11); // stopped right before the director
  });

  it('killing drops spirit; reaching the stairs ends the floor', () => {
    const { f, rng, e } = duel();
    e.hp = 1;
    takeTurn(f, { kind: 'move', dir: { x: 1, y: 0 } }, rng);
    expect(f.enemies).toHaveLength(0);
    expect(f.loot).toBe(GRID_ENEMIES.cheonyeo.drop);
    f.stairs = { x: 10, y: 9 };
    takeTurn(f, { kind: 'move', dir: { x: 0, y: 1 } }, rng);
    expect(f.status).toBe('stairs');
  });
});

describe('grid run', () => {
  it('advances floors, applies cards and ends in success', () => {
    const rng = new SeededRNG(2);
    const run = startGridRun();
    for (let i = 0; i < GRID_MAP.floors; i++) {
      const f = enterFloor(run, rng);
      f.status = 'stairs';
      const out = leaveFloor(run, f);
      if (i < GRID_MAP.floors - 1) {
        expect(out).toBeNull();
        pickGridCard(run, 'tough');
      } else expect(out).toBe('success');
    }
    expect(gridStats(run.cards).maxHp).toBe(GRID_PLAYER.maxHp + 8);
  });
});
