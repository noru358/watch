// Failure / extraction settlement numbers (docs/design/run-result.md).
export const RUN_PENALTIES = {
  deathLootKeepRatio: 0.5, // fraction of run loot kept when the director falls
  deathTrauma: 1, // trauma points gained on death
  extractLootKeepRatio: 1, // payphone extraction keeps everything
  // Held as toggles per the design doc; 0 = disabled.
  deathExpLoss: 0,
  deathWalletLossRatio: 0,
} as const;
