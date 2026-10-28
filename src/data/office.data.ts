// Day loop, rent, contract board and operations map numbers (docs/design/4-day/contracts-map-ops.md).
// One night played = one day. Fees are in the same money as the night's loot.
export const OFFICE = {
  rentEvery: 7, // rent is charged on days 7, 14, 21, …
  rent: 450,
  boardSize: 4, // 일반 의뢰 kept on the board (메인 스토리 comes on top; +1 with the 경리 책상 level 1)
  deadline: { min: 3, max: 5 }, // days a general offer stays up
  contamination: {
    max: 5,
    // No random rise or spread (user 2026-10-27): a district only gets worse because of the office —
    // an offer left to expire, an objective failed or fallen on there.
    expireRise: 1, // an offer left to expire makes its node worse
    failRise: 1, // the night ended there without its objective done (fallen, failed, gone home before it)
    // 넘침 (Pandemic outbreak, shown like Helldivers supply lines): a district at `at` posts one 긴급
    // 의뢰 (open for `days` nights, fee and 평판 × mult). Let it expire and every open neighbour gets
    // `rise`, and the office loses `rep` 평판.
    overflow: { at: 5, days: 2, feeMult: 1.5, repMult: 1.5, rise: 1, rep: 10 },
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
  // 합동 출동 (docs/rules/office.md): same-district general offers taken in one night. The night is as
  // long as the longest; objectives on the same floor push the later one down, at most `extraFloors`
  // past that length. Not with main story or 추격 (it uses every floor).
  joint: { max: 3, extraFloors: 1 },
} as const;
