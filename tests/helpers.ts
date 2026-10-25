import { SeededRNG } from '../src/core/SeededRNG';
import { GHOSTS } from '../src/data/ghosts.data';
import type { CardId, GhostId } from '../src/types/ids';
import { generateFloor, type Floor } from '../src/systems/rift';
import { computeExorcistStats } from '../src/systems/run';

export function floorWith(seed = 1, cards: CardId[] = []): { f: Floor; rng: SeededRNG } {
  const rng = new SeededRNG(seed);
  const stats = computeExorcistStats('director', 1, cards, 'newspaper_sword');
  const f = generateFloor(0, { kind: 'normal', enemies: 4, pool: ['cheonyeo', 'dalgyal'], payphone: false }, rng, {
    hp: stats.maxHp,
    focus: 0,
    loot: 0,
    weapon: 'newspaper_sword',
    stats,
    cards,
  });
  return { f, rng };
}

// An open floor with the director at (10,8) and one awake ghost right next to them.
export function duel(kind: GhostId = 'cheonyeo', cards: CardId[] = []) {
  const { f, rng } = floorWith(3, cards);
  f.tiles.fill('floor');
  f.player.x = 10;
  f.player.y = 8;
  f.stairs = { x: 0, y: 0 };
  f.payphone = null;
  f.pickups = [];
  const hp = GHOSTS[kind].hp;
  f.enemies = [{ id: 99, kind, x: 11, y: 8, hp, maxHp: hp, awake: true, windup: null, windupDamage: 0, windupParriable: false, dashTo: null, timer: 99 }];
  return { f, rng, e: f.enemies[0]! };
}
