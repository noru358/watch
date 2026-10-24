import { COMBAT } from '../../data/combat.data';
import { ROOM_SIZE, type Wave } from '../../data/contracts.data';
import { BOSS_PATTERNS } from '../../data/ghosts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { RoomKind, ToolId, TraitId } from '../../types/ids';
import { spawnEnemy } from './enemies';
import { ROOM_CENTER } from './geometry';
import { runTraitHooks } from './hooks';
import type { ExorcistStats } from './stats';
import type { CompanionSlot, World } from './types';

export interface RoomParams {
  roomKind: RoomKind;
  waves: Wave[];
  tool: ToolId;
  traits: TraitId[];
  stats: ExorcistStats;
  hp: number;
  companions: CompanionSlot[];
}

export function createWorld(params: RoomParams, rng: SeededRNG): World {
  const startY = ROOM_SIZE.height - ROOM_SIZE.wall - COMBAT.playerStartOffset;
  const world: World = {
    tick: 0,
    roomKind: params.roomKind,
    tool: params.tool,
    traits: [...params.traits],
    stats: params.stats,
    player: {
      x: ROOM_CENTER.x,
      y: startY,
      prevX: ROOM_CENTER.x,
      prevY: startY,
      hp: Math.min(params.hp, params.stats.maxHp),
      facingX: 0,
      facingY: -1,
      attackCd: 0,
      rollTime: 0,
      rollCd: 0,
      rollDirX: 0,
      rollDirY: -1,
      iframes: 0,
      toolCd: 0,
      rolledSinceAttack: false,
      shield: 0,
      darkness: 0,
    },
    enemies: [],
    projectiles: [],
    zones: [],
    pickups: [],
    companions: params.companions.map((c) => ({ ...c })),
    nextCompanion: 0,
    waves: params.waves,
    waveIndex: 0,
    boss: null,
    loot: 0,
    status: params.roomKind === 'payphone' ? 'cleared' : 'fighting',
    nextId: 1,
    events: [],
  };
  if (params.roomKind === 'boss') {
    spawnEnemy(world, 'printer', ROOM_CENTER.x, COMBAT.bossSpawnY, rng);
    world.boss = { phase: 1, patternTimer: BOSS_PATTERNS.printer.firstPatternDelay, patternIndex: 0, streamLeft: 0, streamTimer: 0 };
  }
  runTraitHooks(world, 'onRoomEnter', {});
  return world;
}
