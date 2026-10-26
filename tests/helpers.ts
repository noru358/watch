import { SeededRNG } from '../src/core/SeededRNG';
import { CONTRACTS } from '../src/data/contracts.data';
import { GHOSTS } from '../src/data/ghosts.data';
import type { ActiveId, CardId, GhostId, PerkId } from '../src/types/ids';
import type { TrainingLevels } from '../src/systems/run';
import { generateFloor, type Floor } from '../src/systems/rift';
import { makeEnemy } from '../src/systems/rift';
import { computeExorcistStats } from '../src/systems/run';

export const DT = 1 / 60;

// What the office sends along (training, skills, the supply, the active on L).
export interface Kit {
  perks?: PerkId[];
  training?: TrainingLevels;
  active?: ActiveId | null;
}

export function carry(cards: CardId[] = [], kit: Kit = {}) {
  const perks = kit.perks ?? [];
  const stats = computeExorcistStats('director', kit.training ?? {}, cards, 'newspaper_sword', perks);
  return { hp: stats.maxHp, focus: 0, loot: 0, weapon: 'newspaper_sword' as const, stats, cards, perks, used: [] as PerkId[], active: kit.active ?? null };
}

export function floorWith(seed = 1, cards: CardId[] = [], kit: Kit = {}): { f: Floor; rng: SeededRNG } {
  const rng = new SeededRNG(seed);
  const f = generateFloor(0, { kind: 'normal', enemies: 4, pool: ['cheonyeo', 'dalgyal'], payphone: false, swarm: null, objective: null, goal: false, theme: 'basement' }, rng, carry(cards, kit));
  return { f, rng };
}

// An open arena with the director at (10.5, 10.5) and one awake ghost `gap` tiles to the right.
export function duel(kind: GhostId = 'cheonyeo', gap = 1.2, cards: CardId[] = [], kit: Kit = {}) {
  const { f, rng } = floorWith(3, cards, kit);
  for (let y = 1; y < f.rows - 1; y++) for (let x = 1; x < f.cols - 1; x++) f.tiles[y * f.cols + x] = 'floor';
  Object.assign(f.player, { x: 10.5, y: 10.5, prevX: 10.5, prevY: 10.5 });
  f.stairs = { x: 1.5, y: 1.5 };
  f.payphone = null;
  f.pickups = [];
  f.enemies = [];
  const e = makeEnemy(f, kind, { x: 10.5 + gap, y: 10.5 });
  e.state = 'chase';
  e.warpTimer = 999;
  f.flowFrom = -1;
  return { f, rng, e, hp: GHOSTS[kind].hp };
}

// The story contract as a run setup (offer id 0 = not from a board).
export const storySetup = { offerId: 0, floors: CONTRACTS.lights_out.floors, fee: CONTRACTS.lights_out.fee, weapon: 'newspaper_sword' } as const;
