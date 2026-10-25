import type { CardId, EnemyId, WeaponId } from '../../types/ids';
import type { GameEvent } from '../../types/events';

export type Tile = 'wall' | 'floor';

export interface Pos {
  x: number;
  y: number;
}

export type Dir = Pos; // unit step, 4 directions

// One player choice = one turn.
export type RiftAction =
  | { kind: 'move'; dir: Dir } // bumping into an enemy attacks it
  | { kind: 'slash' } // hit the faced tile
  | { kind: 'wait' }
  | { kind: 'draw' }; // 발도: counter adjacent wound-up enemies, or free strike with full focus

export interface Enemy extends Pos {
  id: number;
  kind: EnemyId;
  hp: number;
  maxHp: number;
  awake: boolean;
  // Telegraph: tiles this enemy will hit at the end of the next enemy phase.
  windup: Pos[] | null;
  windupDamage: number;
  windupParriable: boolean; // false for line sweeps and dashes: those must be dodged
  dashTo: Pos | null; // subway dash marker
  timer: number; // teleport countdown (cheonyeo)
}

export interface Player extends Pos {
  hp: number;
  facing: Dir;
  focus: number; // 진심 게이지
  combo: number; // consecutive turns with a landed hit
  bare: number; // turns left with the sword unwrapped (after a draw)
  shield: number; // salt_ward charges
  darkness: number; // turns of reduced vision left
}

// Derived from weapon + cards + level (Rule 7); never saved.
export interface Stats {
  maxHp: number;
  slash: number;
  draw: number;
  focusMax: number;
  bareTurns: number;
  bareSlashBonus: number;
  comboEvery: number;
  comboBonus: number;
}

export interface BossState {
  id: number;
  phase: 1 | 2;
  lineTimer: number;
  summonTimer: number;
}

// 'payphone': the director stepped on the payphone and must choose (extract / continue).
export type FloorStatus = 'playing' | 'stairs' | 'payphone' | 'extracted' | 'dead' | 'bossDefeated';

export interface Floor {
  index: number;
  cols: number;
  rows: number;
  tiles: Tile[]; // row-major
  stairs: Pos | null; // null on the boss floor
  payphone: Pos | null;
  player: Player;
  enemies: Enemy[];
  pickups: (Pos & { value: number })[];
  boss: BossState | null;
  weapon: WeaponId;
  stats: Stats;
  cards: CardId[];
  turn: number;
  loot: number;
  status: FloorStatus;
  nextId: number;
  events: GameEvent[]; // x/y are TILE coordinates; the scene converts to pixels
}
