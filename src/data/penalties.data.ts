// Failure / extraction settlement numbers (docs/design/2-night/run-result.md).
export const RUN_PENALTIES = {
  deathLootKeepRatio: 0.5, // fraction of run loot kept when the director falls
  deathTrauma: 1, // trauma points gained on death
  extractLootKeepRatio: 1, // payphone extraction keeps everything
  failLootKeepRatio: 1, // the objective was lost (missing person): loot kept, no fee
  failTrauma: 1,
  // Held as toggles per the design doc; 0 = disabled.
  deathExpLoss: 0,
  deathWalletLossRatio: 0,
} as const;

// 트라우마 (docs/rules/growth.md): effects by level, and the ways down.
export const TRAUMA = {
  cards: 3, // cards offered after a floor (normally)
  fewerCardsAt: 2,
  fewerCards: 2,
  weakAt: 4,
  weakHp: 2, // the night starts this much below max HP
  groundedAt: 6, // no sortie until it drops
  rest: 2, // 휴식하기 (+ sofa level)
  capitalCost: 1000, // 자본 치료
  capitalAmount: 2,
} as const;
