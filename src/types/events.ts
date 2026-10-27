import type { ActiveId, EnemyId, Phase } from './ids';

// Presentation-only events (ARCHITECTURE Rule 3). Removing any listener must
// never change game state. The rift simulation emits x/y in TILE coordinates;
// the scene converts them to pixels before they reach the bus.
export interface GameEventMap {
  enemyHit: { x: number; y: number; amount: number; entityId: number; empowered: boolean; kind: EnemyId };
  enemyKilled: { x: number; y: number; kind: EnemyId; entityId: number };
  enemyTeleport: { x: number; y: number };
  playerHurt: { x: number; y: number; amount: number };
  playerHealed: { x: number; y: number; amount: number };
  shieldBlocked: { x: number; y: number };
  pickupCollected: { x: number; y: number; value: number };
  slash: { x: number; y: number };
  dash: { x: number; y: number };
  parry: { x: number; y: number }; // 발도 counter / focus strike lands
  drawStance: { x: number; y: number }; // 발도 pressed: stance before the cut
  drawCut: { x: number; y: number }; // plain 발도 lands
  bossPhase: { phase: 2 };
  survivorCry: { x: number; y: number }; // rescue: the hidden person cries (HUD points the way)
  survivorFound: { x: number; y: number };
  survivorHurt: { x: number; y: number; amount: number };
  objectiveDone: { x: number; y: number };
  lastBreath: { x: number; y: number }; // 마지막 숨 kept the director at 1 HP
  quarryFled: { x: number; y: number }; // 추격: the quarry bolted to the next floor
  wardSealed: { x: number; y: number }; // 결계: one site finished
  lairLocked: { x: number; y: number }; // 괴이 소굴: the doors sealed (the map redraws)
  lairOpened: { x: number; y: number };
  shardCollected: { x: number; y: number };
  skillUsed: { x: number; y: number; skill: ActiveId };
  shotHit: { x: number; y: number };
  roomCleared: { boss: boolean };
  darkness: { duration: number };
  phaseChanged: { phase: Phase };
}

export type GameEventName = keyof GameEventMap;

// A tagged union of all events, used by the simulation's event queue.
export type GameEvent = { [K in GameEventName]: { type: K } & GameEventMap[K] }[GameEventName];
