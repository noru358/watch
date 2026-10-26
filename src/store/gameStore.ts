import { SAVE_VERSION, type SaveData } from '../core/SaveManager';
import { SeededRNG } from '../core/SeededRNG';
import type { ContractId, NodeId, Phase, SceneId } from '../types/ids';
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
    };
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
