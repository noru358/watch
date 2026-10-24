import type { CompanionId, EnemyId, RoomKind, ToolId, TraitId } from '../../types/ids';
import type { GameEvent } from '../../types/events';
import type { Wave } from '../../data/contracts.data';
import type { ExorcistStats } from './stats';

export interface InputFrame {
  moveX: number; // -1..1
  moveY: number;
  attack: boolean; // held
  roll: boolean; // pressed this step
  tool: boolean;
  call: boolean;
  interact: boolean;
}

export const NO_INPUT: InputFrame = {
  moveX: 0,
  moveY: 0,
  attack: false,
  roll: false,
  tool: false,
  call: false,
  interact: false,
};

export interface Body {
  x: number;
  y: number;
  prevX: number; // previous step position, for render interpolation
  prevY: number;
}

export interface PlayerState extends Body {
  hp: number;
  facingX: number;
  facingY: number;
  attackCd: number;
  rollTime: number; // > 0 while rolling
  rollCd: number;
  rollDirX: number;
  rollDirY: number;
  iframes: number;
  toolCd: number;
  rolledSinceAttack: boolean; // read by the roll_empower trait
  shield: number; // salt_ward charges
  darkness: number; // seconds of darkened vision left
}

export type EnemyMode = 'chase' | 'telegraph' | 'windup' | 'dash' | 'recover';

export interface EnemyState extends Body {
  id: number;
  kind: EnemyId;
  hp: number;
  maxHp: number;
  mode: EnemyMode;
  timer: number; // time left in the current mode / until the next ability
  dirX: number;
  dirY: number;
  targetX: number; // teleport destination
  targetY: number;
  stun: number;
}

export interface Projectile extends Body {
  id: number;
  owner: 'player' | 'enemy';
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  pierce: boolean;
  stun: number;
  canRicochet: boolean;
  empowered: boolean;
  hitIds: number[];
}

export interface Zone {
  id: number;
  x: number;
  y: number;
  radius: number;
  life: number;
  tickTimer: number;
}

export interface Pickup {
  id: number;
  x: number;
  y: number;
  value: number;
}

export interface CompanionSlot {
  id: CompanionId;
  cooldown: number;
}

export interface BossState {
  phase: 1 | 2;
  patternTimer: number;
  patternIndex: number;
  streamLeft: number;
  streamTimer: number;
}

export type RoomStatus = 'fighting' | 'cleared' | 'exited' | 'extracted' | 'dead' | 'bossDefeated';

export interface World {
  tick: number;
  roomKind: RoomKind;
  tool: ToolId;
  traits: TraitId[];
  stats: ExorcistStats;
  player: PlayerState;
  enemies: EnemyState[];
  projectiles: Projectile[];
  zones: Zone[];
  pickups: Pickup[];
  companions: CompanionSlot[];
  nextCompanion: number;
  waves: Wave[];
  waveIndex: number;
  boss: BossState | null;
  loot: number;
  status: RoomStatus;
  nextId: number;
  events: GameEvent[]; // drained by the scene each frame and sent to EventBus
}
