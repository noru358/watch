import { SAVE_VERSION, type SaveData } from '../core/SaveManager';
import { SeededRNG } from '../core/SeededRNG';
import type { ActiveId, ContractId, FacilityId, NodeId, Phase, SceneId, SkillSlotId, SupplyId, TrainingId } from '../types/ids';
import type { TrainingLevels } from '../systems/run';
import * as growth from '../systems/growth';
import { settleRun, type RunResult, type Settlement } from '../systems/run';
import {
  advanceDay,
  morningSeed,
  offerFloors,
  refillBoard,
  resolveNight,
  startingContamination,
  type Contamination,
  type ContractOffer,
  type MorningReport,
  type OfficeState,
  type WantedTarget,
} from '../systems/office';
import type { FloorPlan } from '../data/contracts.data';

export interface LastRun {
  result: RunResult;
  settlement: Settlement;
  bundled: number; // offers finished together (1 = just the one taken)
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
  contamination: Contamination;
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
  passives: Partial<Record<SkillSlotId, 'a' | 'b'>>;
  actives: ActiveId[];
  active: ActiveId | null;
  wanted: WantedTarget[]; // named bounties that got away
  // not saved
  activeOfferId: number | null; // chosen on the board, played tonight
  lastRun: LastRun | null;
  lastMorning: MorningReport | null;
}

// What a night needs from the chosen offer.
export interface NightPlan {
  offerId: number;
  floors: readonly FloorPlan[];
  fee: number;
}

const growthOf = (s: GameState): growth.GrowthState => ({
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
});

type Listener = () => void;

const office = (s: GameState): OfficeState => ({
  day: s.day,
  money: s.money,
  debt: s.debt,
  contamination: { ...s.contamination },
  known: [...s.known],
  board: s.board.map((o) => ({ ...o, pool: [...o.pool] })),
  nextOfferId: s.nextOfferId,
  storyDone: [...s.storyDone],
  wanted: s.wanted.map((w) => ({ ...w, name: [...w.name] as [number, number] })),
  deskLevel: s.facilities.desk,
});

// Single source of truth shared by React (useSyncExternalStore) and Phaser (Rule 3).
export class GameStore {
  private state: GameState;
  private listeners = new Set<Listener>();

  constructor(initial: Partial<GameState> = {}) {
    this.state = GameStore.fresh(initial);
  }

  // A full game state: defaults, then `initial` (a loaded save or test values), then the first board.
  private static fresh(initial: Partial<GameState>): GameState {
    let state: GameState = {
      phase: 'day',
      money: 0,
      trauma: 0,
      solved: 0,
      seedBase: 1,
      runCounter: 0,
      day: 1,
      debt: 0,
      contamination: startingContamination(),
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
      wanted: [],
      activeOfferId: null,
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

  // 새로 시작 (title screen): everything back to day 1 with a new base seed. The autosave
  // then overwrites the old save.
  newGame(seedBase: number): void {
    this.state = GameStore.fresh({ seedBase, phase: this.state.phase });
    this.listeners.forEach((fn) => fn());
  }

  getState = (): GameState => this.state;

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private set(patch: Partial<GameState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  // What goes into the save file (long-lived office state only).
  toSave(): SaveData {
    const { money, trauma, solved, seedBase, runCounter, day, debt, contamination, known, board, nextOfferId, storyDone, seen } = this.state;
    const s = this.state;
    return {
      schemaVersion: SAVE_VERSION,
      money,
      trauma,
      solved,
      seedBase,
      runCounter,
      day,
      debt,
      contamination: { ...contamination },
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
      wanted: s.wanted.map((w) => ({ ...w, name: [...w.name] as [number, number] })),
    };
  }

  // ---- growth (systems/growth does the rules; the store only applies the result) ----

  private grow(fn: (g: growth.GrowthState) => unknown): boolean {
    const g = growthOf(this.state);
    const ok = fn(g);
    if (!ok) return false;
    this.set({ ...g });
    return true;
  }

  train(id: TrainingId): boolean {
    return this.grow((g) => growth.buyTraining(g, id) > 0);
  }

  openSkill(slot: SkillSlotId): boolean {
    return this.grow((g) => growth.openSlot(g, slot));
  }

  setSkillSide(slot: SkillSlotId, side: 'a' | 'b'): void {
    this.grow((g) => (growth.setSlotSide(g, slot, side), true));
  }

  learnActive(id: ActiveId): boolean {
    return this.grow((g) => growth.learnActive(g, id));
  }

  equipActive(id: ActiveId): void {
    this.grow((g) => (growth.equipActive(g, id), true));
  }

  buildFacility(id: FacilityId): boolean {
    return this.grow((g) => growth.buildFacility(g, id) > 0);
  }

  packSupply(id: SupplyId | null): boolean {
    return this.grow((g) => growth.packSupply(g, id));
  }

  capitalTherapy(): boolean {
    return this.grow((g) => growth.capitalTherapy(g));
  }

  // 휴식하기: no night out; the day passes (rent, the city, deadlines) and trauma comes down.
  restToday(): void {
    const o = office(this.state);
    const morning = advanceDay(o, new SeededRNG(morningSeed(this.state.seedBase, o.day + 1)));
    this.set({
      ...o,
      trauma: Math.max(0, this.state.trauma - growth.restAmount(this.state)),
      activeOfferId: null,
      lastRun: null,
      lastMorning: morning,
    });
  }

  // The night starts: tonight's seed and loadout; the packed supply is used up.
  startNight(): { seed: number; loadout: growth.Loadout } {
    const loadout = growth.loadoutOf(growthOf(this.state));
    const seed = this.takeRunSeed();
    if (this.state.supply) this.set({ supply: null });
    return { seed, loadout };
  }

  // ---- actions ----

  markSeen(id: SceneId): void {
    if (this.state.seen.includes(id)) return;
    this.set({ seen: [...this.state.seen, id] });
  }

  setPhase(phase: Phase): void {
    this.set({ phase });
  }

  selectOffer(id: number | null): void {
    if (id !== null && !this.state.board.some((o) => o.id === id)) return;
    this.set({ activeOfferId: id });
  }

  // The chosen offer as a night plan (null if nothing valid is chosen).
  nightPlan(): NightPlan | null {
    const offer = this.state.board.find((o) => o.id === this.state.activeOfferId);
    if (!offer) return null;
    return { offerId: offer.id, floors: offerFloors(offer), fee: offer.fee };
  }

  // Fallback when nothing is chosen (e.g. dev reload straight into the night): the first offer.
  firstPlan(): NightPlan {
    const offer = this.state.board[0]!;
    return { offerId: offer.id, floors: offerFloors(offer), fee: offer.fee };
  }

  // Seed for the next night; advances the counter so every run differs.
  takeRunSeed(): number {
    const seed = (this.state.seedBase * 7919 + this.state.runCounter * 104729) >>> 0;
    this.set({ runCounter: this.state.runCounter + 1 });
    return seed;
  }

  // Night over: settle the contract (and its bundle), pay out, then it is the next morning.
  applyRunResult(result: RunResult): Settlement {
    const o = office(this.state);
    const night = resolveNight(o, result.offerId, result.outcome === 'success');
    const settlement = settleRun({ ...result, fee: night.fee }, this.state.money);
    o.money = this.state.money + settlement.moneyDelta;
    const morning = advanceDay(o, new SeededRNG(morningSeed(this.state.seedBase, o.day + 1)));
    this.set({
      ...o,
      trauma: this.state.trauma + settlement.traumaDelta,
      solved: this.state.solved + (result.outcome === 'success' ? 1 : 0),
      activeOfferId: null,
      lastRun: { result, settlement, bundled: Math.max(1, night.completed.length) },
      lastMorning: morning,
    });
    return settlement;
  }
}
