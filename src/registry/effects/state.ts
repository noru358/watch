import { SeededRNG } from '../../core/SeededRNG';
import type { Floor, Stats } from '../../systems/rift';

// Per-floor bookkeeping the parts need (timers, stacks, marks, buffs). Kept beside the floor in a
// WeakMap so the draft does not change the Floor type; adopting it would move this onto Floor.
export interface Buff {
  source: string;
  stat: keyof Stats;
  op: 'add' | 'mult';
  value: number;
  until: number;
}
export interface EffectState {
  rng: SeededRNG; // for hooks that carry none (onCounter, onAfterHurt …); seeded from the floor
  depth: number; // > 0 while a part is running: parts never trigger parts (no loops)
  ready: Map<string, number>; // source#row → floor time it may fire again
  once: Set<string>;
  stacks: Map<string, { n: number; until: number; stat?: keyof Stats; per?: number }>;
  marks: Map<number, { source: string; until: number }>; // enemy id → mark
  slows: Map<number, { until: number; factor: number }>;
  curses: Map<number, { until: number; stacks: number; dps: number; acc: number }>;
  buffs: Buff[];
  echo: { until: number; mult: number };
  lastZone: { x: number; y: number } | null;
}

const STATES = new WeakMap<Floor, EffectState>();

export function effectState(f: Floor): EffectState {
  let s = STATES.get(f);
  if (!s) {
    s = {
      rng: new SeededRNG(f.index * 7919 + f.nextId * 104729 + 17),
      depth: 0,
      ready: new Map(),
      once: new Set(),
      stacks: new Map(),
      marks: new Map(),
      slows: new Map(),
      curses: new Map(),
      buffs: [],
      echo: { until: -1, mult: 0 },
      lastZone: null,
    };
    STATES.set(f, s);
  }
  return s;
}
