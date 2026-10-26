import type { SeededRNG } from '../core/SeededRNG';
import type { Enemy } from '../systems/rift';

// Fixed hook points (Rule 2) shared by 강화 카드 (cardEffects.ts) and perks — passive skills and
// supplies (perkEffects.ts). Adding one is an architecture change: say so in HANDOFF.
// 2026-10-27: onAfterHurt … onMove added for the skill tree and supplies.
export interface HookArgs {
  onRunStart: Record<string, never>;
  onRoomEnter: Record<string, never>; // a new floor begins
  onBeforeAttack: { damage: number; kind: 'slash' | 'draw' | 'skill' };
  onHit: { enemy: Enemy; damage: number; kind: 'slash' | 'draw' | 'skill'; rng: SeededRNG };
  onTakeDamage: { amount: number };
  onKill: { enemy: Enemy; rng: SeededRNG };
  onRunEnd: Record<string, never>;
  onAfterHurt: Record<string, never>; // damage landed and HP went down
  onLethal: { prevent: boolean }; // HP is about to hit 0; set prevent to stay at 1
  onDashTick: Record<string, never>; // every tick of a dash
  onDashEnd: { rng: SeededRNG };
  onSwing: { heavy: boolean; damage: number; rng: SeededRNG }; // after a swing's hits
  onCounter: Record<string, never>; // a 받아치기 was judged
  onFocusStrike: Record<string, never>; // an 일섬 was judged
  onDodge: Record<string, never>; // a hit passed through the dash
  onFloorEnd: Record<string, never>; // the director takes the stairs
  onMove: { mult: number; moving: boolean; attacking: boolean; dt: number }; // walking speed multiplier
}
export type HookName = keyof HookArgs;
