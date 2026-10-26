import { CARD_OFFER_COUNT, CARDS } from '../../data/cards.data';
import type { FloorPlan } from '../../data/contracts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { CardId, WeaponId } from '../../types/ids';
import { generateFloor, type Floor } from '../rift';
import { computeExorcistStats } from './stats';

// 'failed': the contract's objective was lost (e.g. the missing person) — no fee, loot kept.
export type RunOutcome = 'success' | 'extracted' | 'died' | 'failed';

export interface RunResult {
  offerId: number; // the contract-board offer this night was for
  outcome: RunOutcome;
  loot: number;
  fee: number;
}

export interface RunSetup {
  offerId: number;
  floors: readonly FloorPlan[]; // from the office module's offerFloors()
  fee: number;
  level: number;
  weapon: WeaponId;
}

// One night: a contract's floors played in order.
export interface RunState {
  offerId: number;
  floors: readonly FloorPlan[];
  fee: number;
  level: number;
  weapon: WeaponId;
  floorIndex: number;
  hp: number;
  focus: number;
  loot: number;
  cards: CardId[];
  outcome: RunOutcome | null;
}

export function runStats(run: RunState) {
  return computeExorcistStats('director', run.level, run.cards, run.weapon);
}

export function startRun(setup: RunSetup): RunState {
  const run: RunState = { ...setup, floorIndex: 0, hp: 0, focus: 0, loot: 0, cards: [], outcome: null };
  run.hp = runStats(run).maxHp;
  return run;
}

export function totalFloors(run: RunState): number {
  return run.floors.length;
}

export function enterFloor(run: RunState, rng: SeededRNG): Floor {
  const plan = run.floors[run.floorIndex];
  if (!plan) throw new Error(`No floor ${run.floorIndex}`);
  return generateFloor(run.floorIndex, plan, rng, {
    hp: run.hp,
    focus: run.focus,
    loot: run.loot,
    weapon: run.weapon,
    stats: runStats(run),
    cards: run.cards,
  });
}

// Banks a finished floor. Returns the outcome if the run ended.
export function leaveFloor(run: RunState, f: Floor): RunOutcome | null {
  run.hp = f.player.hp;
  run.focus = f.player.focus;
  run.loot = f.loot;
  if (f.status === 'dead') run.outcome = 'died';
  else if (f.status === 'failed') run.outcome = 'failed';
  else if (f.status === 'extracted') run.outcome = 'extracted';
  else if (f.status === 'bossDefeated') run.outcome = 'success';
  else if (f.status === 'stairs') {
    run.floorIndex += 1;
    if (run.floorIndex >= totalFloors(run)) run.outcome = 'success';
  }
  return run.outcome;
}

// The director just finished the contract's main objective on a floor that is not the last one:
// the night may end here with the fee (docs/design/2-night/objectives.md "목표 달성 시 귀환").
export function goalReached(run: RunState, f: Floor): boolean {
  const plan = run.floors[run.floorIndex];
  return f.status === 'stairs' && plan?.kind === 'normal' && plan.goal && run.floorIndex < totalFloors(run) - 1;
}

// Go home after the goal: a success, fee included.
export function finishAtGoal(run: RunState, f: Floor): RunOutcome {
  run.hp = f.player.hp;
  run.focus = f.player.focus;
  run.loot = f.loot;
  run.outcome = 'success';
  return run.outcome;
}

// Cards come from the base deck plus the equipped weapon's deck (companion decks: Gate 2).
export function cardPool(run: RunState): CardId[] {
  return (Object.keys(CARDS) as CardId[]).filter((id) => {
    const src = CARDS[id].source;
    return (src === 'base' || src === run.weapon) && !run.cards.includes(id);
  });
}

export function offerCards(run: RunState, rng: SeededRNG): CardId[] {
  return rng.sample(cardPool(run), CARD_OFFER_COUNT);
}

export function pickCard(run: RunState, id: CardId): void {
  const before = runStats(run).maxHp;
  run.cards.push(id);
  const after = runStats(run).maxHp;
  run.hp = Math.min(after, run.hp + (after - before) + CARDS[id].heal);
}

export function runResult(run: RunState): RunResult {
  if (!run.outcome) throw new Error('Run has not ended');
  return {
    offerId: run.offerId,
    outcome: run.outcome,
    loot: run.loot,
    fee: run.outcome === 'success' ? run.fee : 0,
  };
}
