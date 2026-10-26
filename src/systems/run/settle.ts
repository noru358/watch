import { RUN_PENALTIES } from '../../data/penalties.data';
import type { RunResult } from './run';

export interface Settlement {
  moneyDelta: number;
  lootKept: number;
  lootLost: number;
  fee: number;
  traumaDelta: number;
  shards: number; // 심연 파편 kept (all of them, unless the director fell)
}

// Converts a finished run into wallet/trauma changes (docs/design/2-night/run-result.md).
export function settleRun(result: RunResult, wallet: number): Settlement {
  let keepRatio = 1;
  let traumaDelta = 0;
  let walletLoss = 0;
  if (result.outcome === 'extracted') keepRatio = RUN_PENALTIES.extractLootKeepRatio;
  if (result.outcome === 'failed') {
    keepRatio = RUN_PENALTIES.failLootKeepRatio;
    traumaDelta = RUN_PENALTIES.failTrauma;
  }
  if (result.outcome === 'died') {
    keepRatio = RUN_PENALTIES.deathLootKeepRatio;
    traumaDelta = RUN_PENALTIES.deathTrauma;
    walletLoss = Math.floor(wallet * RUN_PENALTIES.deathWalletLossRatio);
  }
  const lootKept = Math.floor(result.loot * keepRatio);
  return {
    moneyDelta: lootKept + result.fee - walletLoss,
    lootKept,
    lootLost: result.loot - lootKept,
    fee: result.fee,
    traumaDelta,
    shards: result.outcome === 'died' ? 0 : result.shards,
  };
}
