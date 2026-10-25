import type { EnemyId, Phase } from './ids';

// Presentation-only events (ARCHITECTURE Rule 3). Removing any listener must
// never change game state. The rift simulation emits x/y in TILE coordinates;
// the scene converts them to pixels before they reach the bus.
export interface GameEventMap {
  enemyHit: { x: number; y: number; amount: number; entityId: number; empowered: boolean };
  enemyKilled: { x: number; y: number; kind: EnemyId; entityId: number };
  enemyTeleport: { x: number; y: number };
  playerHurt: { x: number; y: number; amount: number };
  playerHealed: { x: number; y: number; amount: number };
  shieldBlocked: { x: number; y: number };
  pickupCollected: { x: number; y: number; value: number };
  slash: { x: number; y: number };
  parry: { x: number; y: number }; // 발도 counter / draw strike
  bossPhase: { phase: 2 };
  roomCleared: { boss: boolean };
  darkness: { duration: number };
  phaseChanged: { phase: Phase };
}

export type GameEventName = keyof GameEventMap;

// A tagged union of all events, used by the simulation's event queue.
export type GameEvent = { [K in GameEventName]: { type: K } & GameEventMap[K] }[GameEventName];
