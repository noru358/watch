import type { SwarmPlan } from '../../data/contracts.data';
import type { AttackShape } from '../../data/ghosts.data';
import type { ActiveId, CardId, EnemyId, FloorTheme, PerkId, UpgradeId, WeaponId } from '../../types/ids';
import type { EffectRow } from '../../registry/effects';
import type { DropSource } from '../../data/gear.data';
import type { GameEvent } from '../../types/events';
import type { ObjectiveState } from './objectives/types';
import type { LairState } from './lair';
import type { FloorMods } from './modifiers';

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
  regen: number; // 사무치는 원한: fraction of max HP healed per second after a while unhit
  sinceHit: number; // seconds since it was last hit
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
  pierce: boolean; // flies on through ghosts (부적: 관통)
  hit: number[]; // ghosts already hit (a piercing charm hits each once)
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
  hurtCarry: number; // fraction of a point of damage carried over (damageTaken)
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
  // Added 2026-10-28 (training v2 / gear). All are fractions, 0 = no change; each is read in one place.
  strongDamage: number; // combat.hitEnemy: strong ghosts take × (1 + this)
  fodderDamage: number; // combat.hitEnemy: swarm wisps
  bossDamage: number; // combat.hitEnemy: the boss and named targets (현상수배 / 추격)
  critChance: number; // combat.hitEnemy: chance of a critical hit
  critDamage: number; // combat.hitEnemy: a critical hit does × (1.5 + this)
  attackMove: number; // player.ts: walking speed while swinging × (1 + this), up to normal speed
  damageTaken: number; // combat.hurtPlayer: damage × (1 + this) (negative = less), fractions carried over
  darkResist: number; // combat.hurtPlayer: the darkness after a hit is × (1 - this) as long
  healMult: number; // cardEffects.heal: healing × (1 + this)
  focusGain: number; // player.ts: focus per landed swing × (1 + this)
  spiritGain: number; // step.ts: spirit picked up × (1 + this)
  shardChance: number; // lair.ts: + this to the nest's shard chance
  feeBonus: number; // store.applyRunResult: fees × (1 + this)
  wardSpeed: number; // objectives/ward.ts: circles fill × (1 + this)
  survivorHp: number; // objectives/index.ts: the rescued person's HP × (1 + this)
  trainTime: number; // objectives/index.ts: 첫차까지 time × (1 + this) (negative = shorter)
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
  lair: LairState | null; // 괴이 소굴 (현장 변형)
  payphone: Pos | null;
  payphoneArmed: boolean; // re-arms once the director walks away
  player: Player;
  enemies: Enemy[];
  pickups: (Pos & { value: number; shard?: boolean })[];
  boss: BossState | null;
  swarm: SwarmPlan | null;
  swarmTimer: number; // seconds to the next swarm wave
  weapon: WeaponId;
  stats: Stats;
  cards: CardId[];
  perks: PerkId[]; // passive skills + tonight's supply (registry/perkEffects.ts)
  used: PerkId[]; // once-a-night perks already spent (carried between floors)
  active: ActiveId | null; // the skill on L
  upgrade: UpgradeId | null; // its 개조
  gearRows: EffectRow[]; // 장신구 specials
  skillCd: number; // seconds until L works again
  zones: Zone[];
  shots: Shot[];
  vision: number | null; // tiles visible on the whole floor (정전); null = normal
  mods: FloorMods; // 현장 변형 folded into numbers (modifiers.ts)
  time: number;
  loot: number;
  shards: number; // 심연 파편 earned on this floor (banked by the run)
  drops: DropSource[]; // 장신구 that fell on this floor (rolled at settlement — systems/gear)
  bossShards: number; // paid when this floor's boss is purified
  status: FloorStatus;
  nextId: number;
  flow: Int16Array; // tile distance to the director (enemy pathing)
  flowFrom: number; // tile index the flow field was built from
  events: GameEvent[]; // x/y in TILE units; the scene converts to pixels
}
