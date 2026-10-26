// Day loop, rent, contract board and operations map numbers (docs/design/4-day/contracts-map-ops.md).
// One night played = one day. Fees are in the same money as the night's loot.
export const OFFICE = {
  rentEvery: 7, // rent is charged on days 7, 14, 21, …
  rent: 450,
  boardSize: 4, // offers kept on the board (story contracts come on top)
  deadline: { min: 3, max: 5 }, // days a general offer stays up
  bountyChance: [0, 0, 0, 0, 0.5, 1], // per morning, by node contamination 0..5 (if it has no bounty up)
  contamination: {
    max: 5,
    riseChance: 0.25, // each morning, per node
    spreadAt: 3, // a node at this level or more may spread to a neighbour
    spreadChance: 0.4,
    expireRise: 1, // an offer left to expire makes its node worse
    cleanse: { story: 3, general: 2, bounty: 3 },
  },
  general: {
    floorsBase: 3, // floors = floorsBase + floor(risk / 2)
    enemiesBase: 5, // strong ghosts per floor = base + risk + floor index
    feeBase: 70,
    feePerRisk: 30,
    feePerFloor: 25,
    payphoneFrom: 3, // contracts with this many floors or more get a payphone halfway
  },
  bounty: {
    feeMult: 1.8,
    arenaEnemiesBase: 4, // + risk
  },
  swarm: { every: 6.5, everyPerRisk: -0.4, group: 4, cap: 12, capPerRisk: 2 },
} as const;
