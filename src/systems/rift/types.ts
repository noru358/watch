import type { SwarmPlan } from '../../data/contracts.data';
import type { AttackShape } from '../../data/ghosts.data';
import type { ActiveId, CardId, EnemyId, FloorTheme, PerkId, WeaponId } from '../../types/ids';
import type { GameEvent } from '../../types/events';
import type { ObjectiveState } from './objectives/types';

// Positions are in TILE units (floats); tile (x, y) covers [x, x+1) × [y, y+1).
export type Tile = 'wall' | 'floor';

export interface Pos {
  x: number;
  y: number;
}

export interface Body extends Pos {
  prevX: number; // position at the previous tick, for render interpolation
  prevY: number;
  r: number;
}

// One fixed-step tick of player intent.
export interface RiftInput {
  moveX: number; // -1..1
  moveY: number;
  aim: number; // radians, world space
  attack: boolean; // held
  dash: boolean; // pressed this tick
  draw: boolean; // pressed this tick
  skill: boolean; // pressed this tick (L: the equipped active)
}

export const NO_INPUT: RiftInput = { moveX: 0, moveY: 0, aim: 0, attack: false, dash: false, draw: false, skill: false };

// A floor marking that strikes when its timer runs out.
export interface Telegraph {
  shape: Exclude<AttackShape, 'none'> | 'band';
  x: number; // origin
  y: number;
  angle: number; // cone/line direction
  range: number; // cone/circle radius, line length
  width: number; // line/band thickness
  axis: 'row' | 'col'; // band orientation
  t: number; // seconds left
  total: number;
  damage: number;
  parriable: boolean;
  darkness: number;
}

export type EnemyState = 'idle' | 'chase' | 'windup' | 'recover' | 'stun' | 'warp';

export interface Enemy extends Body {
  id: number;
  kind: EnemyId;
  hp: number;
  maxHp: number;
  state: EnemyState;
  timer: number; // time left in the current state
  teles: Telegraph[]; // active telegraphs (boss may have several)
  warpTimer: number; // countdown to the next teleport (cheonyeo)
  warpTo: Pos | null;
  knockX: number; // knockback velocity, tiles/s
  knockY: number;
  face: number; // -1 left, 1 right (render hint)
  // Per-enemy multipliers: 1 / 0 for ordinary ghosts; the 현상수배 elite and the chase quarry change them.
  speedMult: number;
  damageAdd: number;
  windupMult: number;
  role: 'normal' | 'bounty' | 'quarry' | 'lair'; // what the floor's objective cares about
  asleep: boolean; // lair pack before the director walks in; quarry resting in its nest
}

// Something on the floor for a while: salt from a dash, a barrier circle.
export interface Zone extends Pos {
  kind: 'salt' | 'barrier';
  r: number;
  t: number; // seconds left
}

// A thrown talisman.
export interface Shot extends Pos {
  vx: number;
  vy: number;
  left: number; // tiles it may still fly
  damage: number;
  stun: number;
}

export interface Player extends Body {
  hp: number;
  aim: number;
  moving: boolean; // render hint
  swingT: number; // time until the next swing may start
  swingFx: number; // render hint: time since the last swing started
  combo: number; // swings in the current combo
  comboT: number; // window left to continue the combo
  dashT: number;
  dashCd: number;
  dashX: number;
  dashY: number;
  iframes: number;
  drawCd: number; // 발도 cooldown left
  drawFx: number; // render hint: time since the last 발도
  drawKind: 'slash' | 'counter' | 'strike'; // what the current / last 발도 is
  drawT: number; // seconds until the 발도 in stance lands (0 = none pending)
  drawAim: number; // aim locked when the 발도 key was pressed
  countered: number[]; // enemy ids caught by the pending counter
  focus: number; // 진심 게이지
  bare: number; // seconds left with the sword unwrapped
  shield: number; // salt_ward charges
  dashCharges: number; // dashes ready (refill one per dashCooldown)
  darkness: number; // seconds of reduced vision
  hurtOnFloor: boolean; // took damage on this floor (숨 고르기)
  calmT: number; // seconds moving without attacking (질주)
  dodged: boolean; // the current dash already slipped past a hit (스치기)
}

// Derived from exorcist + training + weapon + cards + passive skills (Rule 7); never saved.
// Every number the director's feel depends on lives here, so training and skills can change it.
export interface Stats {
  maxHp: number;
  slash: number;
  drawSlash: number; // plain 발도
  draw: number; // counter / focus strike
  focusMax: number;
  bareTime: number;
  bareSlashBonus: number;
  comboEvery: number;
  comboBonus: number;
  reach: number; // swing radius (tiles)
  swingTime: number; // seconds between swings
  finisherRecovery: number; // pause after the combo finisher
  drawCooldown: number;
  parryWindow: number;
  moveSpeed: number; // tiles / s
  dashSpeed: number; // tiles / s while dashing (dash length = dashSpeed × dashTime)
  dashTime: number;
  dashIframes: number;
  dashCooldown: number;
  dashCharges: number;
  hurtIframes: number;
  magnet: number; // spirit pickup pull radius (tiles)
}

export interface BossState {
  id: number;
  phase: 1 | 2;
  sweepTimer: number;
  summonTimer: number;
}

// 'payphone': the director reached the payphone and must choose (extract / continue).
// 'failed': the floor's objective was lost (e.g. the missing person) — the night ends without the fee.
export type FloorStatus = 'playing' | 'stairs' | 'payphone' | 'extracted' | 'dead' | 'failed' | 'bossDefeated';

export interface Floor {
  index: number;
  cols: number;
  rows: number;
  tiles: Tile[]; // row-major
  theme: FloorTheme; // which tile look this floor uses
  stairs: Pos | null; // tile centre; null on boss / arena floors
  objective: ObjectiveState | null; // what opens the stairs (normal floors); null = open from the start
  goal: boolean; // the contract's main objective is on this floor (finishing it offers to go home)
  arena: boolean; // bounty arena: clearing every strong ghost ends the night
  payphone: Pos | null;
  payphoneArmed: boolean; // re-arms once the director walks away
  player: Player;
  enemies: Enemy[];
  pickups: (Pos & { value: number })[];
  boss: BossState | null;
  swarm: SwarmPlan | null;
  swarmTimer: number; // seconds to the next swarm wave
  weapon: WeaponId;
  stats: Stats;
  cards: CardId[];
  perks: PerkId[]; // passive skills + tonight's supply (registry/perkEffects.ts)
  used: PerkId[]; // once-a-night perks already spent (carried between floors)
  active: ActiveId | null; // the skill on L
  skillCd: number; // seconds until L works again
  zones: Zone[];
  shots: Shot[];
  vision: number | null; // tiles visible on the whole floor (정전); null = normal
  time: number;
  loot: number;
  status: FloorStatus;
  nextId: number;
  flow: Int16Array; // tile distance to the director (enemy pathing)
  flowFrom: number; // tile index the flow field was built from
  events: GameEvent[]; // x/y in TILE units; the scene converts to pixels
}
