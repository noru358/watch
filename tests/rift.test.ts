import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { CARDS } from '../src/data/cards.data';
import { BOSSES, GHOSTS } from '../src/data/ghosts.data';
import { EXORCISTS } from '../src/data/protagonist.data';
import { WEAPONS } from '../src/data/weapons.data';
import { answerPayphone, generateFloor, isFloor, takeTurn, type Floor } from '../src/systems/rift';
import { computeExorcistStats } from '../src/systems/run';
import { duel, floorWith } from './helpers';

const W = WEAPONS.newspaper_sword;
const MAX = EXORCISTS.director.maxHp;
const right = { kind: 'move', dir: { x: 1, y: 0 } } as const;

function reachable(f: Floor, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
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

describe('floor generation', () => {
  it('stairs and every enemy are reachable from the start', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { f } = floorWith(seed);
      expect(reachable(f, f.player, f.stairs!)).toBe(true);
      for (const e of f.enemies) expect(reachable(f, f.player, e)).toBe(true);
      expect(f.enemies).toHaveLength(4);
    }
  });

  it('the boss floor is one room with the boss and no stairs', () => {
    const stats = computeExorcistStats('director', 1, [], 'newspaper_sword');
    const f = generateFloor(3, { kind: 'boss', boss: 'printer' }, new SeededRNG(1), { hp: MAX, focus: 0, loot: 0, weapon: 'newspaper_sword', stats, cards: [] });
    expect(f.stairs).toBeNull();
    expect(f.enemies.map((e) => e.kind)).toEqual(['printer']);
    expect(reachable(f, f.player, f.enemies[0]!)).toBe(true);
  });
});

describe('turns', () => {
  it('walking into a wall does not spend a turn', () => {
    const { f, rng } = floorWith();
    f.tiles.fill('wall');
    f.tiles[f.player.y * f.cols + f.player.x] = 'floor';
    expect(takeTurn(f, right, rng)).toBe(false);
    expect(f.turn).toBe(0);
  });

  it('an adjacent ghost telegraphs, then hits if the director stays', () => {
    const { f, rng, e } = duel();
    takeTurn(f, { kind: 'wait' }, rng);
    expect(e.windup).toEqual([{ x: 10, y: 8 }]);
    takeTurn(f, { kind: 'wait' }, rng);
    expect(f.player.hp).toBe(MAX - GHOSTS.cheonyeo.damage);
  });

  it('stepping off the marked tile dodges the hit', () => {
    const { f, rng } = duel();
    takeTurn(f, { kind: 'wait' }, rng);
    takeTurn(f, { kind: 'move', dir: { x: 0, y: 1 } }, rng);
    expect(f.player.hp).toBe(MAX);
  });

  it('발도 on an adjacent telegraph parries it, deals draw damage and bares the blade', () => {
    const { f, rng, e } = duel('dalgyal');
    takeTurn(f, { kind: 'wait' }, rng);
    takeTurn(f, { kind: 'draw' }, rng);
    expect(f.player.hp).toBe(MAX);
    expect(e.hp).toBe(GHOSTS.dalgyal.hp - W.draw);
    expect(f.player.bare).toBe(W.bareTurns);
  });

  it('a bare blade adds slash damage and wears off', () => {
    const { f, rng, e } = duel('dalgyal');
    e.hp = 999;
    f.player.bare = 2;
    takeTurn(f, right, rng);
    expect(e.hp).toBe(999 - W.slash - W.bareSlashBonus);
    takeTurn(f, { kind: 'wait' }, rng);
    expect(f.player.bare).toBe(0);
  });

  it('every 3rd consecutive hit is heavy; a miss resets the combo', () => {
    const { f, rng, e } = duel('dalgyal');
    e.hp = 999;
    for (let i = 0; i < W.comboEvery; i++) takeTurn(f, right, rng);
    expect(e.hp).toBe(999 - W.slash * W.comboEvery - W.comboBonus);
    takeTurn(f, { kind: 'wait' }, rng);
    expect(f.player.combo).toBe(0);
  });

  it('a full focus gauge allows a free draw strike', () => {
    const { f, rng, e } = duel('dalgyal');
    e.hp = 999;
    f.player.focus = f.stats.focusMax;
    takeTurn(f, { kind: 'draw' }, rng);
    expect(e.hp).toBe(999 - W.draw);
    expect(f.player.focus).toBe(0);
  });

  it('a dash from afar cannot be parried, only side-stepped', () => {
    const a = duel('subway');
    a.e.x = 14;
    takeTurn(a.f, { kind: 'wait' }, a.rng);
    takeTurn(a.f, { kind: 'draw' }, a.rng);
    expect(a.f.player.hp).toBe(MAX - GHOSTS.subway.damage);
    expect(a.e.x).toBe(11); // stopped right before the director

    const b = duel('subway');
    b.e.x = 14;
    takeTurn(b.f, { kind: 'wait' }, b.rng);
    takeTurn(b.f, { kind: 'move', dir: { x: 0, y: 1 } }, b.rng);
    expect(b.f.player.hp).toBe(MAX);
  });

  it('kills drop spirit; reaching the stairs ends the floor', () => {
    const { f, rng, e } = duel();
    e.hp = 1;
    takeTurn(f, right, rng);
    expect(f.enemies).toHaveLength(0);
    expect(f.loot).toBe(GHOSTS.cheonyeo.drop);
    f.stairs = { x: 10, y: 9 };
    takeTurn(f, { kind: 'move', dir: { x: 0, y: 1 } }, rng);
    expect(f.status).toBe('stairs');
  });

  it('the payphone pauses the floor until the director chooses', () => {
    const { f, rng } = duel();
    f.enemies = [];
    f.payphone = { x: 10, y: 9 };
    takeTurn(f, { kind: 'move', dir: { x: 0, y: 1 } }, rng);
    expect(f.status).toBe('payphone');
    expect(takeTurn(f, { kind: 'wait' }, rng)).toBe(false);
    answerPayphone(f, false);
    expect(f.status).toBe('playing');
    answerPayphone(f, true); // not on prompt: ignored
    expect(f.status).toBe('playing');
  });
});

describe('cards (registry hooks)', () => {
  it('salt_ward blocks one hit per floor', () => {
    const { f, rng } = duel('cheonyeo', ['salt_ward']);
    f.player.shield = CARDS.salt_ward.amount; // duel() replaced the floor after onRoomEnter
    takeTurn(f, { kind: 'wait' }, rng);
    takeTurn(f, { kind: 'wait' }, rng);
    expect(f.player.hp).toBe(f.stats.maxHp);
    expect(f.player.shield).toBe(0);
  });

  it('spirit_nose adds spirit per kill', () => {
    const { f, rng, e } = duel('cheonyeo', ['spirit_nose']);
    e.hp = 1;
    takeTurn(f, right, rng);
    expect(f.loot).toBe(GHOSTS.cheonyeo.drop + CARDS.spirit_nose.amount);
  });
});

describe('boss', () => {
  function bossDuel() {
    const stats = computeExorcistStats('director', 1, [], 'newspaper_sword');
    const rng = new SeededRNG(4);
    const f = generateFloor(3, { kind: 'boss', boss: 'printer' }, rng, { hp: MAX, focus: 0, loot: 0, weapon: 'newspaper_sword', stats, cards: [] });
    return { f, rng, boss: f.enemies[0]! };
  }

  it('telegraphs a row sweep that hits unless dodged', () => {
    const { f, rng, boss } = bossDuel();
    for (let i = 0; i < BOSSES.printer.lineEvery; i++) takeTurn(f, { kind: 'wait' }, rng);
    expect(boss.windup?.some((t) => t.y === f.player.y)).toBe(true);
    expect(boss.windup!.length).toBeGreaterThan(5);
    takeTurn(f, { kind: 'move', dir: { x: 0, y: -1 } }, rng); // leave the row
    expect(f.player.hp).toBe(MAX);
  });

  it('the sweep also comes when hugging the boss, and 발도 cannot parry it', () => {
    const { f, rng, boss } = bossDuel();
    f.player.x = boss.x;
    f.player.y = boss.y + 1;
    const b = f.boss!;
    b.lineTimer = 1;
    takeTurn(f, { kind: 'wait' }, rng);
    expect(boss.windup!.length).toBeGreaterThan(1);
    takeTurn(f, { kind: 'draw' }, rng);
    expect(f.player.hp).toBe(MAX - BOSSES.printer.lineDamage);
  });

  it('enters phase 2 at half HP and its death ends the floor', () => {
    const { f, rng, boss } = bossDuel();
    f.player.x = boss.x;
    f.player.y = boss.y + 1;
    f.player.facing = { x: 0, y: -1 };
    boss.hp = boss.maxHp * BOSSES.printer.phase2Ratio + 1;
    takeTurn(f, { kind: 'slash' }, rng);
    expect(f.boss?.phase).toBe(2);
    boss.hp = 1;
    boss.windup = null;
    takeTurn(f, { kind: 'slash' }, rng);
    expect(f.status).toBe('bossDefeated');
    expect(f.loot).toBeGreaterThanOrEqual(BOSSES.printer.drop);
  });
});
