// Floor generation (random rooms joined by corridors).
export const DUNGEON = {
  cols: 32,
  rows: 17,
  roomAttempts: 40,
  roomCount: 6,
  roomMin: 4,
  roomMax: 8,
  spiritPickupsPerFloor: 4,
  spiritPickupValue: 5,
  bossRoom: { w: 20, h: 11 }, // the boss floor is one big room
} as const;
