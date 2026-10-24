// Room-level combat tuning shared by all contracts.
export const COMBAT = {
  pickupMagnetRange: 130,
  pickupCollectRadius: 18,
  pickupSpeed: 420,
  spawnMinDistance: 220, // enemies never spawn closer than this to the director
  spawnMargin: 60, // distance from the walls
  separationStrength: 0.5, // how hard overlapping enemies push apart
  subwayChaseCooldown: 0.6, // pause before a subway wraith may wind up again
  payphoneRadius: 18,
  payphoneInteractRange: 60,
  bossSpawnY: 130,
  playerStartOffset: 40, // director enters this far above the bottom wall
} as const;
