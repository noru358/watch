import { CARD_OFFER_COUNT, CARDS } from '../../data/cards.data';
import { CONTRACTS } from '../../data/contracts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { CardId, ContractId, WeaponId } from '../../types/ids';
import { generateFloor, type Floor } from '../rift';
import { computeExorcistStats } from './stats';

export type RunOutcome = 'success' | 'extracted' | 'died';

export interface RunResult {
  contractId: ContractId;
  outcome: RunOutcome;
  loot: number;
  fee: number;
}

export interface RunSetup {
  contractId: ContractId;
  level: number;
  weapon: WeaponId;
}

// One night: a contract's floors played in order.
export interface RunState {
  contractId: ContractId;
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
  return CONTRACTS[run.contractId].floors.length;
}

export function enterFloor(run: RunState, rng: SeededRNG): Floor {
  const plan = CONTRACTS[run.contractId].floors[run.floorIndex];
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
  else if (f.status === 'extracted') run.outcome = 'extracted';
  else if (f.status === 'bossDefeated') run.outcome = 'success';
  else if (f.status === 'stairs') {
    run.floorIndex += 1;
    if (run.floorIndex >= totalFloors(run)) run.outcome = 'success';
  }
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
    contractId: run.contractId,
    outcome: run.outcome,
    loot: run.loot,
    fee: run.outcome === 'success' ? CONTRACTS[run.contractId].fee : 0,
  };
}
