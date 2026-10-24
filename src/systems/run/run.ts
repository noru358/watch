import { COMPANIONS } from '../../data/companions.data';
import { TRAIT_OFFER_COUNT, TRAITS } from '../../data/traits.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { CompanionId, ContractId, ToolId, TraitId } from '../../types/ids';
import { computeExorcistStats, createWorld, type CompanionSlot, type ExorcistStats, type World } from '../combat';
import { buildRoomPlan, contractFee, type RoomPlan } from '../contract';

export type RunOutcome = 'success' | 'extracted' | 'died';

export interface RunState {
  contractId: ContractId;
  plan: RoomPlan[];
  roomIndex: number;
  level: number;
  tool: ToolId;
  traits: TraitId[];
  hp: number;
  loot: number; // banked from finished rooms
  companions: CompanionSlot[];
  offered: boolean; // trait offer already made for the current room
  outcome: RunOutcome | null;
}

export interface RunResult {
  contractId: ContractId;
  outcome: RunOutcome;
  loot: number;
  fee: number;
}

export interface RunSetup {
  contractId: ContractId;
  level: number;
  tool: ToolId;
  party: readonly CompanionId[];
}

export function runStats(run: RunState): ExorcistStats {
  return computeExorcistStats('director', run.level, run.traits, run.tool);
}

export function startRun(setup: RunSetup, rng: SeededRNG): RunState {
  const run: RunState = {
    contractId: setup.contractId,
    plan: buildRoomPlan(setup.contractId, rng),
    roomIndex: 0,
    level: setup.level,
    tool: setup.tool,
    traits: [],
    hp: 0,
    loot: 0,
    companions: setup.party.map((id) => ({ id, cooldown: 0 })),
    offered: false,
    outcome: null,
  };
  run.hp = runStats(run).maxHp;
  return run;
}

export function enterRoom(run: RunState, rng: SeededRNG): World {
  const room = run.plan[run.roomIndex];
  if (!room) throw new Error(`No room at index ${run.roomIndex}`);
  run.offered = false;
  return createWorld(
    {
      roomKind: room.kind,
      waves: room.waves,
      tool: run.tool,
      traits: run.traits,
      stats: runStats(run),
      hp: run.hp,
      companions: run.companions,
    },
    rng,
  );
}

// Up to TRAIT_OFFER_COUNT traits the director doesn't have yet.
export function offerTraits(run: RunState, rng: SeededRNG): TraitId[] {
  run.offered = true;
  const all = Object.keys(TRAITS) as TraitId[];
  return rng.sample(all.filter((id) => !run.traits.includes(id)), TRAIT_OFFER_COUNT);
}

// Adds a trait to the run and to the live room.
export function pickTrait(run: RunState, world: World, id: TraitId): void {
  if (run.traits.includes(id)) return;
  const before = runStats(run).maxHp;
  run.traits.push(id);
  const stats = runStats(run);
  world.traits = [...run.traits];
  world.stats = stats;
  world.player.hp = Math.min(stats.maxHp, world.player.hp + Math.max(0, stats.maxHp - before));
}

// True when the room just cleared and a trait offer should be shown.
export function shouldOfferTraits(run: RunState, world: World): boolean {
  return world.roomKind === 'combat' && world.status === 'cleared' && !run.offered;
}

// Banks the room's results into the run. Returns the outcome if the run ended.
export function leaveRoom(run: RunState, world: World): RunOutcome | null {
  run.hp = world.player.hp;
  run.loot += world.loot;
  run.companions = world.companions.map((c) => ({ ...c }));
  if (world.status === 'dead') run.outcome = 'died';
  else if (world.status === 'extracted') run.outcome = 'extracted';
  else if (world.status === 'bossDefeated') run.outcome = 'success';
  else if (world.status === 'exited') run.roomIndex += 1;
  return run.outcome;
}

export function runResult(run: RunState): RunResult {
  if (!run.outcome) throw new Error('Run has not ended');
  return {
    contractId: run.contractId,
    outcome: run.outcome,
    loot: run.loot,
    fee: run.outcome === 'success' ? contractFee(run.contractId) : 0,
  };
}

export function companionReadyRatio(slot: CompanionSlot): number {
  const max = COMPANIONS[slot.id].cooldown;
  return max > 0 ? 1 - slot.cooldown / max : 1;
}
