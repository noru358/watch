import type { GhostId, GridCardId } from '../types/ids';

// Grid turn-based prototype (Pokémon Mystery Dungeon style). One tile = one step.
export const GRID_MAP = {
  cols: 32,
  rows: 17,
  roomAttempts: 40,
  roomCount: 6,
  roomMin: 4,
  roomMax: 8,
  floors: 3,
  enemiesPerFloor: [4, 6, 8],
  spiritPickupsPerFloor: 4,
  spiritPickupValue: 5,
} as const;

export const GRID_ENEMY_POOL: readonly (readonly GhostId[])[] = [
  ['cheonyeo', 'dalgyal'],
  ['cheonyeo', 'dalgyal', 'subway'],
  ['cheonyeo', 'dalgyal', 'subway'],
];

export const GRID_PLAYER = {
  maxHp: 12,
  slashDamage: 3,
  drawDamage: 9, // 발도 (draw strike / parry)
  focusMax: 5, // 진심 게이지: +1 per landed slash; full = free draw strike
  darknessVision: 3, // tiles visible while darkened
} as const;

export interface GridEnemyData {
  hp: number;
  damage: number;
  moveEvery: number; // acts every N turns (2 = slow)
  sight: number; // manhattan tiles at which it notices the director
  drop: number; // spirit gained on kill
  teleportEvery: number; // 0 = never
  dashRange: number; // 0 = no dash
  darknessTurns: number; // vision loss on hit
}

export const GRID_ENEMIES: Record<GhostId, GridEnemyData> = {
  cheonyeo: { hp: 7, damage: 2, moveEvery: 1, sight: 9, drop: 3, teleportEvery: 6, dashRange: 0, darknessTurns: 0 },
  dalgyal: { hp: 14, damage: 2, moveEvery: 2, sight: 7, drop: 5, teleportEvery: 0, dashRange: 0, darknessTurns: 8 },
  subway: { hp: 9, damage: 3, moveEvery: 1, sight: 9, drop: 4, teleportEvery: 0, dashRange: 6, darknessTurns: 0 },
};

export interface GridCardData {
  maxHp: number;
  heal: number;
  slash: number;
  draw: number;
  focusMax: number; // negative = fills faster
}

const NONE: GridCardData = { maxHp: 0, heal: 0, slash: 0, draw: 0, focusMax: 0 };

// Upgrade cards offered after each floor.
export const GRID_CARDS: Record<GridCardId, GridCardData> = {
  tough: { ...NONE, maxHp: 4, heal: 4 },
  sharp: { ...NONE, slash: 1 },
  focus: { ...NONE, focusMax: -1 },
  medicine: { ...NONE, heal: 8 },
  lightning: { ...NONE, draw: 4 },
};

// Presentation tuning for the grid scene.
export const GRID_FEEL = {
  tile: 30,
  offsetY: 30, // HUD strip above the map
  moveRepeat: 0.13, // seconds between steps while a direction is held
  slideSpeed: 14, // display lerp factor per second
  lunge: 8, // px an attacker leans toward its target
} as const;
