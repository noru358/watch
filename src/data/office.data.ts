// Day loop, rent, contract board and operations map numbers (docs/design/4-day/contracts-map-ops.md).
// One night played = one day. Fees are in the same money as the night's loot.
export const OFFICE = {
  rentEvery: 7, // rent is charged on days 7, 14, 21, …
  rent: 450,
  boardSize: 4, // 일반 의뢰 kept on the board (메인 스토리 comes on top; +1 with the 경리 책상 level 1)
  deadline: { min: 3, max: 5 }, // days a general offer stays up
  contamination: {
    max: 5,
    riseChance: 0.25, // each morning, per node
    spreadAt: 3, // a node at this level or more may spread to a neighbour
    spreadChance: 0.4,
    expireRise: 1, // an offer left to expire makes its node worse
    cleanse: { main: 3 }, // general contracts: by objective (objectives.data.ts GENERAL_OBJECTIVES.cleanse)
  },
  general: {
    enemiesBase: 5, // strong ghosts per floor = base + risk + floor index (+ floors past the goal)
    // fee = (feeBase + 난이도 × feePerDifficulty + floors × feePerFloor) × objective feeMult × (1 + modifier bonuses)
    feeBase: 60,
    feePerDifficulty: 30,
    feePerFloor: 20,
    feePerTargetLevel: 0.15, // a named target that got away: +15 % per level
    payphoneFrom: 3, // contracts with this many floors or more get a payphone halfway
  },
  swarm: { every: 6.5, everyPerRisk: -0.4, group: 4, cap: 12, capPerRisk: 2 },
  // 의뢰판 난이도 1..5 (docs/rules/office.md): strong ghosts the player must get through up to the
  // goal floor + the objective's and modifiers' points (+ bossWeight for a boss), against these steps.
  difficulty: { steps: [20, 30, 42, 55], bossWeight: 20, bountyPerLevel: 4 },
  // Named 현상수배 targets: "<pre> <suf>" from these i18n tables (wanted.pre.N / wanted.suf.N).
  wantedNames: { pre: 6, suf: 6 },
} as const;
