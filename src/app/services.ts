import { InputManager } from '../core/InputManager';
import { SaveManager, type SaveStorage } from '../core/SaveManager';
import { SAVE } from '../data/save.data';
import { GameStore } from '../store/gameStore';
import type { Phase } from '../types/ids';

// localStorage can be missing or throw (private mode, blocked site data).
function browserStorage(): SaveStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// App-wide singletons. Created once; scenes and UI import them from here.
export const input = new InputManager(window);
export const saves = new SaveManager(browserStorage(), SAVE.key, SAVE.badSuffix);
const saved = saves.load();
// No save yet: the wall clock only picks the base seed; gameplay uses SeededRNG from it.
export const store = new GameStore(saved ?? { seedBase: Date.now() >>> 0 });
// Dev-only handle for automated play-testing (like window.__rift / __hub); stripped from production builds.
if (import.meta.env.DEV) (window as unknown as { __store?: unknown }).__store = store;
// Save whenever office state changes (a night's result, a new run seed).
let last = JSON.stringify(store.toSave());
store.subscribe(() => {
  const next = JSON.stringify(store.toSave());
  if (next === last) return;
  last = next;
  saves.save(store.toSave());
});

let phaseSwitch: (phase: Phase) => void = () => {};

export function bindPhaseSwitch(fn: (phase: Phase) => void): void {
  phaseSwitch = fn;
}

export function requestPhase(phase: Phase): void {
  phaseSwitch(phase);
}
