// The game state's shape and the plain functions over it: a fresh state, the save copy, and the
// projections the store hands to the systems (office, growth, night plan). Kept apart from
// gameStore.ts, which only holds the actions.
import { SAVE_VERSION, type SaveData } from '../core/SaveManager';
import { SeededRNG } from '../core/SeededRNG';
import type { HirePool, Staff } from '../systems/staff';
import type { Morning } from './staffDesk';
import type { ActiveId, ChapterId, ContractId, FacilityId, NodeId, Phase, SceneId, SkillSlotId, SupplyId, UpgradeId } from '../types/ids';
import type { GearItem, GearSlot } from '../systems/gear';
import type { TrainingLevels, RunGoal, RunResult, Settlement } from '../systems/run';
import * as growth from '../systems/growth';
import { morningSeed, planNight, refillBoard, type ContractOffer, type OfficeState, type WantedTarget, type ChapterState, type NightResolution } from '../systems/office';
import type { FloorPlan } from '../data/contracts.data';

export interface LastRun {
  result: RunResult;
  settlement: Settlement;
  completed: number; // offers finished tonight (합동 출동 can finish several)
  clue?: NightResolution['clue']; // 메인 스토리 단서 gained that night
  // For the morning report (아침 보고): the offers taken as they were, what each paid, the rest.
  offers?: ContractOffer[];
  paid?: Record<number, number>;
  reputation?: number;
  gear?: GearItem[];
  gearMelted?: number;
  shown?: boolean; // the report was opened this morning
}

export interface GameState {
  phase: Phase;
  money: number;
  trauma: number;
  solved: number;
  seedBase: number;
  runCounter: number;
  // office (Gate 2-A day loop)
  day: number;
  debt: number;
  known: NodeId[];
  board: ContractOffer[];
  nextOfferId: number;
  storyDone: ContractId[];
  seen: SceneId[]; // story scenes already shown
  // growth (save v4)
  shards: number; // 심연 파편
  training: TrainingLevels;
  trainingBought: number;
  facilities: Record<FacilityId, number>;
  supply: SupplyId | null;
  passives: Partial<Record<SkillSlotId, number>>; // side index per opened slot (save v7)
  actives: ActiveId[];
  active: ActiveId | null;
  upgrades: Partial<Record<ActiveId, UpgradeId>>; // 개조 (save v7)
  gear: GearItem[]; // 장신구 bag (save v7)
  equipped: Partial<Record<GearSlot, number>>;
  nextGearId: number;
  wanted: WantedTarget[]; // named bounties that got away
  chapters: Partial<Record<ChapterId, ChapterState>>; // 메인 스토리 장 (save v5)
  reputation: number; // 평판 (save v6)
  rankReached: number;
  staff: Staff[]; // 직원 (save v9)
  assign: Record<number, number>; // tonight: offer id → staff id
  nextStaffId: number;
  hirePool: HirePool | null; // this week's 구인 list
  // not saved
  activeOfferId: number | null; // chosen on the board, played tonight
  joined: number[]; // 합동 출동: offers put in tonight's set on the board (empty = just the chosen one)
  lastRun: LastRun | null;
  lastMorning: Morning | null;
}

// What the end-of-night panel shows.
export type NightSettlement = Settlement & { clue: NightResolution['clue']; completed: number; reputation: number; gear: GearItem[]; gearMelted: number };

// What a night needs from the chosen offer.
export interface NightPlan {
  offerId: number;
  floors: readonly FloorPlan[];
  fee: number;
  goals: readonly RunGoal[];
}

export const planOf = (offers: readonly ContractOffer[]): NightPlan => {
  const p = planNight(offers);
  const lead = offers.length === 1 ? offers[0]! : offers.find((o) => o.id === p.goals[0]!.offerId)!;
  return { offerId: lead.id, floors: p.floors, fee: p.goals.reduce((sum, g) => sum + g.fee, 0), goals: p.goals };
};

export const growthOf = (s: GameState): growth.GrowthState => ({
  money: s.money,
  trauma: s.trauma,
  shards: s.shards,
  training: { ...s.training },
  trainingBought: s.trainingBought,
  facilities: { ...s.facilities },
  supply: s.supply,
  passives: { ...s.passives },
  actives: [...s.actives],
  active: s.active,
  upgrades: { ...s.upgrades },
  gear: s.gear.map((x) => ({ ...x, subs: x.subs.map((m) => ({ ...m })) })),
  equipped: { ...s.equipped },
  nextGearId: s.nextGearId,
  rank: s.rankReached,
});

export const office = (s: GameState): OfficeState => ({
  day: s.day,
  money: s.money,
  debt: s.debt,
  known: [...s.known],
  board: s.board.map((o) => ({ ...o, pool: [...o.pool] })),
  nextOfferId: s.nextOfferId,
  storyDone: [...s.storyDone],
  wanted: s.wanted.map((w) => ({ ...w, name: [...w.name] as [number, number] })),
  chapters: { ...s.chapters },
  deskLevel: s.facilities.desk,
  reputation: s.reputation,
  rankReached: s.rankReached,
});

// A full game state: defaults, then `initial` (a loaded save or test values), then the first board.
export function freshState(initial: Partial<GameState>): GameState {
  let state: GameState = {
    phase: 'day',
    money: 0,
    trauma: 0,
    solved: 0,
    seedBase: 1,
    runCounter: 0,
    day: 1,
    debt: 0,
    known: [],
    board: [],
    nextOfferId: 1,
    storyDone: [],
    seen: [],
    shards: 0,
    training: {},
    trainingBought: 0,
    facilities: { ...growth.NO_FACILITIES },
    supply: null,
    passives: {},
    actives: [],
    active: null,
    upgrades: {},
    gear: [],
    equipped: {},
    nextGearId: 1,
    wanted: [],
    chapters: {},
    reputation: 0,
    rankReached: 0,
    staff: [],
    assign: {},
    nextStaffId: 1,
    hirePool: null,
    activeOfferId: null,
    joined: [],
    lastRun: null,
    lastMorning: null,
    ...initial,
  };
  // A new game (or a migrated v1 save) starts with an empty board: post the first offers.
  if (state.board.length === 0) {
    const o = office(state);
    refillBoard(o, new SeededRNG(morningSeed(state.seedBase, state.day)));
    state = { ...state, ...o };
  }
  return state;
}

// What goes into the save file (long-lived office state only).
export function toSave(s: GameState): SaveData {
  const { money, trauma, solved, seedBase, runCounter, day, debt, known, board, nextOfferId, storyDone, seen } = s;
  return {
    schemaVersion: SAVE_VERSION,
    money,
    trauma,
    solved,
    seedBase,
    runCounter,
    day,
    debt,
    known: [...known],
    board: board.map((o) => ({ ...o, pool: [...o.pool] })),
    nextOfferId,
    storyDone: [...storyDone],
    seen: [...seen],
    shards: s.shards,
    training: { ...s.training },
    trainingBought: s.trainingBought,
    facilities: { ...s.facilities },
    supply: s.supply,
    passives: { ...s.passives },
    actives: [...s.actives],
    active: s.active,
    upgrades: { ...s.upgrades },
    gear: s.gear.map((x) => ({ ...x, subs: x.subs.map((m) => ({ ...m })) })),
    equipped: { ...s.equipped },
    nextGearId: s.nextGearId,
    wanted: s.wanted.map((w) => ({ ...w, name: [...w.name] as [number, number] })),
    chapters: { ...s.chapters },
    reputation: s.reputation,
    rankReached: s.rankReached,
    staff: s.staff.map((x) => ({ ...x, name: [...x.name] as [number, number] })),
    assign: { ...s.assign },
    nextStaffId: s.nextStaffId,
    hirePool: s.hirePool ? { week: s.hirePool.week, list: s.hirePool.list.map((c) => ({ ...c, name: [...c.name] as [number, number] })) } : null,
    // The morning report survives a reload (it is plain data; a deep copy keeps the save apart).
    lastRun: s.lastRun ? JSON.parse(JSON.stringify(s.lastRun)) : null,
    lastMorning: s.lastMorning ? JSON.parse(JSON.stringify(s.lastMorning)) : null,
  };
}
