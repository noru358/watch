// Floor generation (random rooms joined by 2-tile-wide corridors). Units: tiles.
export const DUNGEON = {
  cols: 48,
  rows: 30,
  roomAttempts: 80,
  roomCount: 8,
  roomMin: 5,
  roomMax: 10,
  corridorWidth: 2,
  spiritPickupsPerFloor: 6,
  spiritPickupValue: 5,
  pickupMagnet: 2.2, // tiles
  pickupSpeed: 9,
  touchRange: 0.6, // stairs / payphone trigger distance
  bossRoom: { w: 24, h: 14 }, // the boss floor is one big room
  arenaRoom: { w: 22, h: 13 }, // a bounty's last floor is one big room too
  exitGuards: 2, // strong ghosts placed in the stairs room first (it is the farthest room)
  treasurePickups: 5, // extra spirit pickups heaped in one side room
  treasureValue: 6,
  knockTime: 0.12, // seconds a knockback impulse is spread over
  knockDecay: 12, // knockback velocity decay per second
  dashStep: 0.2, // tiles per collision check during an enemy line dash
  losStep: 0.25, // tiles per sample when checking line of sight
} as const;
