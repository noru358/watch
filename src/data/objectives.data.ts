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
} as const;
