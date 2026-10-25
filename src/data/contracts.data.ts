import type { BossId, ContractId, GhostId } from '../types/ids';

export type FloorPlan =
  | { kind: 'normal'; enemies: number; pool: readonly GhostId[]; payphone: boolean }
  | { kind: 'boss'; boss: BossId };

export interface ContractData {
  floors: readonly FloorPlan[];
  fee: number; // paid when the source (boss) is purified
}

export const CONTRACTS: Record<ContractId, ContractData> = {
  // 을지로3가 인쇄소 지하, 밤마다 윤전기가 혼자 돈다
  euljiro_printer: {
    fee: 300,
    floors: [
      { kind: 'normal', enemies: 4, pool: ['cheonyeo', 'dalgyal'], payphone: false },
      { kind: 'normal', enemies: 6, pool: ['cheonyeo', 'dalgyal', 'subway'], payphone: true },
      { kind: 'normal', enemies: 7, pool: ['cheonyeo', 'dalgyal', 'subway'], payphone: false },
      { kind: 'boss', boss: 'printer' },
    ],
  },
};
