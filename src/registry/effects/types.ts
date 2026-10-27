import type { SeededRNG } from '../../core/SeededRNG';
import type { Enemy, Floor, Stats } from '../../systems/rift';
import type { HookArgs, HookName } from '../hookPoints';

// 효과 부품 (draft 2026-10-28, docs/design/3-growth/effects-draft.md). NOT wired into the game yet:
// skills, gear specials and later cards are meant to be written as rows of these parts instead of
// hand-written hook bodies (registry/perkEffects.ts stays in use until the user decides).
//
// A row reads: WHEN (a hook point, or 'onCast' for an active) + IF (conditions, all must hold)
// → DO (one part) WITH (that part's numbers), at most once every `cd` seconds.

export type EffectTrigger = HookName | 'onCast';

export type Cond =
  | { chance: number } // 0..1
  | { hpBelow: number } // fraction of max HP
  | { hpAbove: number }
  | { target: 'strong' | 'fodder' | 'boss' | 'named' } // the enemy in the hook (onHit / onKill)
  | { attack: 'slash' | 'draw' | 'skill' }
  | { plainDraw: true } // the 발도 was a plain one (not a counter / focus strike)
  | { heavy: true } // onSwing: the combo finisher
  | { bare: true } // the blade is unwrapped (검신 노출)
  | { calm: number } // seconds moving without attacking
  | { unhurt: true } // not hurt on this floor yet
  | { stacks: { key: string; atLeast: number } }
  | { marked: true } // the enemy carries this source's mark
  | { once: 'floor' | 'night' };

export type Shape = 'front' | 'around' | 'target' | 'chain';

// Every part's numbers. Damage `mult` is × the base named by `of`:
//   'hit' = the damage of the hit that triggered it (falls back to slash), 'slash' / 'drawSlash' = the stat.
export interface PartParams {
  hit: { shape: Shape; range: number; mult: number; of: 'hit' | 'slash' | 'drawSlash'; count?: number; dir?: 'aim' | 'dash'; consumeMark?: boolean };
  status: { kind: 'stun' | 'slow' | 'curse' | 'mark'; sec: number; power?: number; max?: number; radius?: number };
  shot: { speed: number; range: number; mult: number; stun: number; count?: number; spread?: number };
  zone: { kind: 'salt' | 'barrier'; radius: number; sec: number; spacing?: number };
  gain: { res: 'focus' | 'hp' | 'spirit' | 'dash' | 'shield' | 'bare'; amount: number; cap?: number };
  buff: { stat: keyof Stats; op: 'add' | 'mult'; value: number; sec: number };
  scale: { arg: 'damage' | 'amount' | 'mult'; by: number }; // multiplies a number in the hook's args
  cleanse: { radius: number };
  stack: { key: string; add: number; max: number; decay: number; stat?: keyof Stats; per?: number };
  spend: { key: string; shape: Shape; range: number; multPerStack: number };
  echo: { sec: number; mult: number }; // 그림자 분신: every hit repeats at `mult` for `sec`
  blink: { range: number };
  burst: { radius: number; mult: number }; // 영력 터뜨리기: spirit on the floor → damage
  save: { hp: number }; // onLethal: stay at `hp`
}
export type PartId = keyof PartParams;

export type EffectRow = { [P in PartId]: { when: EffectTrigger; if?: readonly Cond[]; do: P; with: PartParams[P]; cd?: number } }[PartId];

// What a part sees when it runs.
export interface EffectCtx {
  f: Floor;
  args: Partial<HookArgs[HookName]> & Record<string, unknown>;
  enemy: Enemy | null;
  rng: SeededRNG;
  source: string; // which skill / item row this came from (marks, stacks, cooldowns are per source)
}

export type PartFn<P extends PartId> = (ctx: EffectCtx, p: PartParams[P]) => void;
