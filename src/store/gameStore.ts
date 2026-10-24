import type { Phase } from '../types/ids';
import { settleRun, type RunResult, type Settlement } from '../systems/run';

export interface LastRun {
  result: RunResult;
  settlement: Settlement;
}

export interface GameState {
  phase: Phase;
  money: number;
  trauma: number;
  solved: number;
  seedBase: number;
  runCounter: number;
  lastRun: LastRun | null;
}

type Listener = () => void;

// Single source of truth shared by React (useSyncExternalStore) and Phaser (Rule 3).
export class GameStore {
  private state: GameState;
  private listeners = new Set<Listener>();

  constructor(initial: Partial<GameState> = {}) {
    this.state = {
      phase: 'day',
      money: 0,
      trauma: 0,
      solved: 0,
      seedBase: 1,
      runCounter: 0,
      lastRun: null,
      ...initial,
    };
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

  // ---- actions ----

  setPhase(phase: Phase): void {
    this.set({ phase });
  }

  // Seed for the next night; advances the counter so every run differs.
  takeRunSeed(): number {
    const seed = (this.state.seedBase * 7919 + this.state.runCounter * 104729) >>> 0;
    this.set({ runCounter: this.state.runCounter + 1 });
    return seed;
  }

  applyRunResult(result: RunResult): Settlement {
    const settlement = settleRun(result, this.state.money);
    this.set({
      money: this.state.money + settlement.moneyDelta,
      trauma: this.state.trauma + settlement.traumaDelta,
      solved: this.state.solved + (result.outcome === 'success' ? 1 : 0),
      lastRun: { result, settlement },
    });
    return settlement;
  }
}
