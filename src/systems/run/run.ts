import { CARDS } from '../../data/cards.data';
import type { FloorPlan } from '../../data/contracts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { ActiveId, CardId, PerkId, UpgradeId, WeaponId } from '../../types/ids';
import type { EffectRow } from '../../registry/effects';
import type { GearMod } from '../gear';
import type { DropSource } from '../../data/gear.data';
import { EMPTY_LOADOUT, type Loadout } from '../growth';
import { generateFloor, type Floor, type QuarryCarry } from '../rift';
import { computeExorcistStats, type TrainingLevels } from './stats';

// 'failed': the contract's objective was lost (e.g. the missing person) — no fee, loot kept.
export type RunOutcome = 'success' | 'extracted' | 'died' | 'failed';

export interface RunResult {
  offerId: number; // the contract-board offer this night was for (합동 출동: the lead)
  outcome: RunOutcome;
  loot: number;
  fee: number;
  shards: number; // 심연 파편 earned tonight (the settlement decides what is kept)
  drops: DropSource[]; // 장신구 that fell (none if the director fell)
  offers: number[]; // every offer taken tonight
  completed: number[]; // offers whose objective was finished (paid unless the director fell)
  reached: number[]; // offers whose objective floor was entered
}

// One objective of the night (office planNight): which offer, which floor (-1: any, 추격), its fee.
export interface RunGoal {
  offerId: number;
  floor: number;
  fee: number;
}

export interface RunSetup {
  offerId: number;
  floors: readonly FloorPlan[]; // from the office module's offerFloors()
  fee: number;
  weapon: WeaponId;
  loadout?: Loadout; // from the office (growth module); tests may leave it out
  goals?: readonly RunGoal[]; // 합동 출동 and per-objective pay; left out = one goal on the last floor
}

// One night: a contract's floors played in order.
export interface RunState {
  offerId: number;
  floors: readonly FloorPlan[];
  fee: number;
  weapon: WeaponId;
  training: TrainingLevels;
  perks: PerkId[];
  active: ActiveId | null;
  upgrade: UpgradeId | null;
  gear: GearMod[];
  gearRows: EffectRow[];
  drops: DropSource[]; // 장신구 that fell tonight (lost if the director falls)
  cardOffer: number;
  used: PerkId[]; // once-a-night perks spent
  quarry: QuarryCarry | null; // 추격: the quarry between floors
  shards: number;
  floorIndex: number;
  hp: number;
  focus: number;
  loot: number;
  cards: CardId[];
  outcome: RunOutcome | null;
  goals: readonly RunGoal[];
  completed: number[]; // offer ids whose objective is done
}

export function runStats(run: RunState) {
  return computeExorcistStats('director', run.training, run.cards, run.weapon, run.perks, run.gear);
}

// Without planned goals: the first floor marked as a goal, else the last.
const defaultGoal = (floors: readonly FloorPlan[]) => {
  const i = floors.findIndex((p) => p.kind === 'normal' && p.goal);
  return i >= 0 ? i : floors.length - 1;
};

export function startRun(setup: RunSetup): RunState {
  const l = setup.loadout ?? EMPTY_LOADOUT;
  const run: RunState = {
    offerId: setup.offerId,
    floors: setup.floors,
    fee: setup.fee,
    weapon: setup.weapon,
    training: { ...l.training },
    perks: [...l.perks],
    active: l.active,
    upgrade: l.upgrade,
    gear: [...l.gear],
    gearRows: [...l.gearRows],
    drops: [],
    cardOffer: l.cardOffer,
    used: [],
    quarry: null,
    shards: 0,
    floorIndex: 0,
    hp: 0,
    focus: 0,
    loot: 0,
    cards: [],
    outcome: null,
    goals: setup.goals ?? [{ offerId: setup.offerId, floor: defaultGoal(setup.floors), fee: setup.fee }],
    completed: [],
  };
  run.hp = Math.max(1, runStats(run).maxHp - l.hpPenalty);
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
    perks: run.perks,
    used: run.used,
    active: run.active,
    upgrade: run.upgrade,
    gearRows: run.gearRows,
    quarry: run.quarry,
    last: run.floorIndex === run.floors.length - 1,
  });
}

// Banks a finished floor. Returns the outcome if the run ended.
// What every way off a floor banks: HP, focus, loot, shards, spent perks, the chase quarry.
// The objective of this floor is finished as the director leaves it (stairs, boss, home).
function markGoals(run: RunState, f: Floor): void {
  const done = f.objective ? f.objective.done : f.status !== 'dead' && f.status !== 'failed';
  const left = f.status === 'stairs' || f.status === 'bossDefeated';
  if (!done || !left) return;
  for (const g of run.goals) {
    const here = g.floor === run.floorIndex || (g.floor === -1 && f.objective?.kind === 'chase');
    if (here && !run.completed.includes(g.offerId)) run.completed.push(g.offerId);
  }
}

// Objectives still ahead tonight (for the HUD and the return prompt).
export function goalsLeft(run: RunState): RunGoal[] {
  return run.goals.filter((g) => !run.completed.includes(g.offerId));
}

function bank(run: RunState, f: Floor): void {
  markGoals(run, f);
  run.used = [...f.used];
  run.hp = f.player.hp;
  run.focus = f.player.focus;
  run.loot = f.loot;
  run.shards += f.shards;
  f.shards = 0;
  run.drops.push(...f.drops);
  f.drops = [];
  if (f.objective?.kind === 'chase') run.quarry = f.objective.quarry;
}

export function leaveFloor(run: RunState, f: Floor): RunOutcome | null {
  bank(run, f);
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
  return f.status === 'stairs' && plan?.kind === 'normal' && plan.goal && f.objective?.done === true && run.floorIndex < totalFloors(run) - 1;
}

// Fees of the objectives finished so far (what going home now pays).
export function feeSoFar(run: RunState): number {
  return run.goals.filter((g) => run.completed.includes(g.offerId)).reduce((sum, g) => sum + g.fee, 0);
}

// Go home after the goal: a success, fee included.
export function finishAtGoal(run: RunState, f: Floor): RunOutcome {
  bank(run, f);
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
  return rng.sample(cardPool(run), run.cardOffer);
}

export function pickCard(run: RunState, id: CardId): void {
  const before = runStats(run).maxHp;
  run.cards.push(id);
  const after = runStats(run).maxHp;
  run.hp = Math.min(after, run.hp + (after - before) + CARDS[id].heal);
}

export function runResult(run: RunState): RunResult {
  if (!run.outcome) throw new Error('Run has not ended');
  const deepest = run.floorIndex; // the floor the night ended on (past the last after the last stairs)
  return {
    offerId: run.offerId,
    outcome: run.outcome,
    loot: run.loot,
    fee: run.outcome === 'died' ? 0 : feeSoFar(run),
    shards: run.shards,
    drops: run.outcome === 'died' ? [] : [...run.drops],
    offers: run.goals.map((g) => g.offerId),
    completed: run.outcome === 'died' ? [] : [...run.completed],
    // A named target already caught does not count as one that got away, even if the night is lost later.
    reached: run.goals.filter((g) => (g.floor === -1 || g.floor <= deepest) && !run.completed.includes(g.offerId)).map((g) => g.offerId),
  };
}
