// Day loop, rent, contract board and operations map numbers (docs/design/4-day/contracts-map-ops.md).
// One night played = one day. Fees are in the same money as the night's loot.
export const OFFICE = {
  rentEvery: 7, // rent is charged on days 7, 14, 21, …
  rent: 450,
  boardSize: 4, // 일반 의뢰 kept on the board (메인 스토리 comes on top; +1 with the 경리 책상 level 1)
  deadline: { min: 3, max: 5 }, // days a general offer stays up
  // 의뢰 등급 0..3 (replaced district contamination, owner 2026-11-11): rolled per offer; a higher
  // 평판 등급 sees higher grades more often. Grade adds strong ghosts per floor and a denser swarm, and
  // pays for it (offer.risk holds it). gradeWeights[min(rank, last)][grade].
  gradeWeights: [[6, 3, 1, 0], [4, 4, 2, 1], [2, 4, 3, 2], [1, 3, 4, 3]],
  // 긴급 의뢰: a new offer of grade `fromGrade`+ is urgent with this chance (at most one on the board):
  // one night to take it, fee and 평판 × mult; letting it expire costs `rep` 평판 on top.
  urgent: { chance: 0.1, fromGrade: 1, days: 1, feeMult: 1.5, repMult: 1.5, rep: 10 },
  general: {
    enemiesBase: 5, // strong ghosts per floor = base + grade + floor index (+ floors past the goal)
    // fee = (feeBase + 난이도 × feePerDifficulty + floors × feePerFloor) × objective feeMult × (1 + modifier bonuses)
    feeBase: 60,
    feePerDifficulty: 30,
    feePerFloor: 20,
    feePerTargetLevel: 0.15, // a named target that got away: +15 % per level
    payphoneFrom: 3, // contracts with this many floors or more get a payphone halfway
  },
  // 의뢰 길이 세 단계 (docs/design/2-night/objectives.md "길이 세 단계"). 단타 keeps each objective's
  // own floor range (objectives.data.ts). Longer ones end on their last floor and pay steeply more.
  //   weight: how often the board rolls it · rank: 평판 등급 needed · feeMult: on top of the fee formula
  //   checkpoint: where the 귀환 지점 (a payphone that also saves) stands: 'middle' floor, or the floor
  //   after each mid-boss · midBossEvery: a named target with two affixes every N floors (0 = none)
  //   endShards: 심연 파편 in the last floor's treasure room · rareGearFrom: mid-bosses from this floor
  //   (1-based) drop a rare-or-better 장신구
  lengths: {
    short: { floors: null, weight: 6, rank: 0, feeMult: 1, checkpoint: 'none', midBossEvery: 0, midBossShards: 0, endShards: 0, rareGearFrom: 0 },
    normal: { floors: [6, 8], weight: 3, rank: 0, feeMult: 1.6, checkpoint: 'middle', midBossEvery: 0, midBossShards: 0, endShards: 1, rareGearFrom: 0 },
    long: { floors: [15, 20], weight: 1, rank: 2, feeMult: 4, checkpoint: 'afterBoss', midBossEvery: 5, midBossShards: 1, endShards: 2, rareGearFrom: 10 },
  },
  // Floors past the 4th get harder slowly and richer (the first four are as they always were).
  depth: { from: 3, enemiesEvery: 2, lootPerFloor: 0.12, affixFrom: 7, affixChance: 0.25, affixChancePerFloor: 0.03, affixChanceMax: 0.6 },
  swarm: { every: 6.5, everyPerRisk: -0.4, group: 4, cap: 12, capPerRisk: 2 },
  // 의뢰판 난이도 1..5 (docs/rules/office.md): strong ghosts the player must get through up to the
  // goal floor + the objective's and modifiers' points (+ bossWeight for a boss), against these steps.
  difficulty: { steps: [20, 30, 42, 55], bossWeight: 20, bountyPerLevel: 4 },
  // 합동 출동 (docs/rules/office.md): same-district general offers taken in one night. The night is as
  // long as the longest; objectives on the same floor push the later one down, at most `extraFloors`
  // past that length. Not with main story or 추격 (it uses every floor).
  joint: { max: 3, extraFloors: 1 },
} as const;

export type SortieLength = keyof typeof OFFICE.lengths;
