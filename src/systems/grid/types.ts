import type { GhostId, GridCardId } from '../../types/ids';
import type { GameEvent } from '../../types/events';

export type Tile = 'wall' | 'floor';

export interface Pos {
  x: number;
  y: number;
}

export type Dir = Pos; // unit step, 4 directions

// One player choice = one turn.
export type GridAction =
  | { kind: 'move'; dir: Dir } // bumping into an enemy attacks it
  | { kind: 'slash' } // hit the faced tile
  | { kind: 'wait' }
  | { kind: 'draw' }; // 발도: counter wound-up enemies, or free strike with full focus

export interface GridEnemy extends Pos {
  id: number;
  kind: GhostId;
  hp: number;
  awake: boolean;
  // Telegraph: tiles this enemy will hit at the end of the next enemy phase.
  windup: Pos[] | null;
  dashTo: Pos | null; // landing tile for a subway dash
  timer: number; // turns until teleport (cheonyeo)
}

export interface GridPlayer extends Pos {
  hp: number;
  facing: Dir;
  focus: number;
  darkness: number; // turns of reduced vision left
}

export interface GridStats {
  maxHp: number;
  slash: number;
  draw: number;
  focusMax: number;
}

export type GridStatus = 'playing' | 'stairs' | 'dead';

export interface GridFloor {
  floor: number; // 0-based
  cols: number;
  rows: number;
  tiles: Tile[]; // row-major
  stairs: Pos;
  player: GridPlayer;
  enemies: GridEnemy[];
  pickups: (Pos & { value: number })[];
  stats: GridStats;
  cards: GridCardId[];
  turn: number;
  loot: number;
  status: GridStatus;
  nextId: number;
  events: GameEvent[]; // x/y are TILE coordinates; the scene converts to pixels
}
