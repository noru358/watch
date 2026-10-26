// Floor objectives (docs/design/2-night/objectives.md, rules in docs/rules/floor.md).
// Distances are in TILES, times in SECONDS, fear is 0..1.
export const OBJECTIVES = {
  rescue: {
    hp: 6, // the missing person's health; telegraphs and fodder hurt them too
    radius: 0.3,
    hurtIframes: 0.7,
    findRange: 1.4, // walk this close to find them; they take the director's hand
    fearPerSecond: 1 / 75, // fear while hidden and alone (full = lost to the ghosts)
    fearNearMult: 2.5, // fear rises this much faster with a strong ghost close by
    nearRange: 4.5,
    fearRelief: 0.04, // fear falls per second once they are with the director
    cryEvery: 5, // seconds between cries while hidden (the HUD points the way)
    followSpeed: 5.6,
    followGap: 0.9, // they stop this close behind the director
    carryMoveMult: 0.85, // the director walks slower holding someone's hand
  },
  // 현상수배: a named strong ghost, stronger every time it got away (level 0..maxLevel).
  bounty: {
    hpMult: 4, // × the ghost's normal HP
    hpPerLevel: 1, // + this × level (as an HP multiplier)
    damageAdd: 1,
    speedMult: 1.1,
    windupMult: 0.85, // shorter telegraphs and recovery
    maxLevel: 3,
  },
  // 추격: the quarry flees to the next floor at each threshold, then sleeps in a nest and heals.
  chase: {
    hpMult: 5,
    damageAdd: 1,
    speedMult: 1.15,
    windupMult: 0.9,
    fleeAt: [2 / 3, 1 / 3], // fraction of max HP: drop below → it bolts down the stairs
    regenPerSecond: 0.02, // fraction of max HP regained per second while asleep in the nest
    wakeRange: 3, // the director walking this close wakes it
  },
  // 결계: stand in each circle until it fills; leaving drains it. Wisps come faster while it fills.
  ward: {
    sites: 3,
    radius: 1.6,
    fillTime: 9, // seconds standing inside to finish one site
    drainPerSecond: 0.06, // progress lost per second outside (0..1)
    swarmFaster: 2, // swarm interval ÷ this while the director is charging a site
  },
  // 첫차까지: survive on the floor until the first train; strong ghosts keep arriving.
  firsttrain: {
    time: 75, // seconds
    timePerRisk: 6,
    spawnEvery: 11, // a strong ghost walks in this often, from far away
    capGrowthEvery: 15, // the swarm cap +1 this often
    startEnemies: 3, // strong ghosts already on the floor (+ risk)
  },
} as const;

// How each objective shapes a generated 일반 의뢰 (docs/rules/office.md "의뢰 한 장 만드는 법").
// weight: how often the board rolls it. floors: length range. goal: which floor it ends on
// ('last', 'random' = any floor, a number = that 0-based floor capped to the last, 'any' = wherever
// it is caught). feeMult: on top of the fee formula. shards: 심연 파편 for finishing it.
// cleanse: node contamination removed on success. difficulty: extra points for the 난이도 score.
export interface ObjectiveRule {
  weight: number;
  floors: readonly [number, number];
  goal: 'last' | 'random' | 'any' | number;
  feeMult: number;
  shards: number;
  cleanse: number;
  difficulty: number;
}

export const GENERAL_OBJECTIVES: Record<'clear' | 'rescue' | 'bounty' | 'chase' | 'ward' | 'firsttrain', ObjectiveRule> = {
  clear: { weight: 3, floors: [2, 4], goal: 'last', feeMult: 1, shards: 0, cleanse: 2, difficulty: 0 },
  rescue: { weight: 2, floors: [2, 4], goal: 1, feeMult: 1.1, shards: 0, cleanse: 2, difficulty: 2 },
  bounty: { weight: 2, floors: [2, 4], goal: 'random', feeMult: 1.5, shards: 1, cleanse: 3, difficulty: 8 },
  chase: { weight: 1.5, floors: [3, 4], goal: 'any', feeMult: 1.4, shards: 1, cleanse: 2, difficulty: 8 },
  ward: { weight: 1.5, floors: [2, 3], goal: 'random', feeMult: 0.8, shards: 0, cleanse: 4, difficulty: 4 },
  firsttrain: { weight: 1.5, floors: [1, 2], goal: 'last', feeMult: 1.2, shards: 0, cleanse: 2, difficulty: 6 },
};

// "계속" after the goal: floors past the goal floor are richer and harder; the last one hides a shard.
export const DEEP = {
  lootPerFloor: 0.25, // spirit pickups × (1 + this × floors past the goal)
  enemiesPerFloor: 1, // strong ghosts + this × floors past the goal
  shardOnLast: 1, // 심연 파편 in the treasure room of the last floor, when it is past the goal
} as const;
