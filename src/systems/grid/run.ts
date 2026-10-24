import { CONTRACTS } from '../../data/contracts.data';
import { GRID_CARDS, GRID_MAP, GRID_PLAYER } from '../../data/grid.data';
import { TRAIT_OFFER_COUNT } from '../../data/traits.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { GridCardId } from '../../types/ids';
import type { RunOutcome, RunResult } from '../run';
import { generateFloor } from './mapgen';
import type { GridFloor, GridStats } from './types';

export interface GridRun {
  floorIndex: number;
  hp: number;
  focus: number;
  loot: number;
  cards: GridCardId[];
  outcome: RunOutcome | null;
}

// Stats are derived from picked cards, never stored (Rule 7).
export function gridStats(cards: readonly GridCardId[]): GridStats {
  const s: GridStats = { maxHp: GRID_PLAYER.maxHp, slash: GRID_PLAYER.slashDamage, draw: GRID_PLAYER.drawDamage, focusMax: GRID_PLAYER.focusMax };
  for (const id of cards) {
    const c = GRID_CARDS[id];
    s.maxHp += c.maxHp;
    s.slash += c.slash;
    s.draw += c.draw;
    s.focusMax = Math.max(1, s.focusMax + c.focusMax);
  }
  return s;
}

export function startGridRun(): GridRun {
  return { floorIndex: 0, hp: GRID_PLAYER.maxHp, focus: 0, loot: 0, cards: [], outcome: null };
}

export function enterFloor(run: GridRun, rng: SeededRNG): GridFloor {
  return generateFloor(run.floorIndex, rng, {
    hp: run.hp,
    stats: gridStats(run.cards),
    cards: run.cards,
    loot: run.loot,
    focus: run.focus,
  });
}

export function totalFloors(): number {
  return GRID_MAP.floors;
}

// Banks a finished floor. Returns the outcome if the run ended.
export function leaveFloor(run: GridRun, f: GridFloor): RunOutcome | null {
  run.hp = f.player.hp;
  run.focus = f.player.focus;
  run.loot = f.loot;
  if (f.status === 'dead') run.outcome = 'died';
  else if (f.status === 'stairs') {
    run.floorIndex += 1;
    if (run.floorIndex >= GRID_MAP.floors) run.outcome = 'success';
  }
  return run.outcome;
}

export function offerGridCards(rng: SeededRNG): GridCardId[] {
  return rng.sample(Object.keys(GRID_CARDS) as GridCardId[], TRAIT_OFFER_COUNT);
}

export function pickGridCard(run: GridRun, id: GridCardId): void {
  const before = gridStats(run.cards).maxHp;
  run.cards.push(id);
  const after = gridStats(run.cards);
  run.hp = Math.min(after.maxHp, run.hp + (after.maxHp - before) + GRID_CARDS[id].heal);
}

export function gridResult(run: GridRun): RunResult {
  if (!run.outcome) throw new Error('Grid run has not ended');
  return {
    contractId: 'euljiro_printer',
    outcome: run.outcome,
    loot: run.loot,
    fee: run.outcome === 'success' ? CONTRACTS.euljiro_printer.fee : 0,
  };
}
