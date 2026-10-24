import { InputManager } from '../core/InputManager';
import { GameStore } from '../store/gameStore';
import type { Phase } from '../types/ids';

// App-wide singletons. Created once; scenes and UI import them from here.
export const input = new InputManager(window);
// Wall-clock seed only picks the save's base seed; gameplay uses SeededRNG from it.
export const store = new GameStore({ seedBase: Date.now() >>> 0 });

let phaseSwitch: (phase: Phase) => void = () => {};

export function bindPhaseSwitch(fn: (phase: Phase) => void): void {
  phaseSwitch = fn;
}

export function requestPhase(phase: Phase): void {
  phaseSwitch(phase);
}
