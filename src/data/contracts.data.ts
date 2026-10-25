import type { BossId, ContractId, GhostId } from '../types/ids';

// Swarm waves: every `every` seconds `group` fodder spawn out of sight (between
// `near` and `far` tiles from the director), while fewer than `cap` are alive.
export interface SwarmPlan {
  kind: GhostId;
  every: number;
  group: number;
  cap: number;
  near: number;
  far: number;
}

export type FloorPlan =
  | { kind: 'normal'; enemies: number; pool: readonly GhostId[]; payphone: boolean; swarm: SwarmPlan | null }
  | { kind: 'boss'; boss: BossId; swarm: SwarmPlan | null };

const wisps = (every: number, group: number, cap: number): SwarmPlan => ({ kind: 'dokkaebibul', every, group, cap, near: 7, far: 12 });

export interface ContractData {
  floors: readonly FloorPlan[];
  fee: number; // paid when the source (boss) is purified
}

export const CONTRACTS: Record<ContractId, ContractData> = {
  // 을지로3가 인쇄소 지하, 밤마다 윤전기가 혼자 돈다
  euljiro_printer: {
    fee: 300,
    floors: [
      { kind: 'normal', enemies: 6, pool: ['cheonyeo', 'dalgyal'], payphone: false, swarm: wisps(6, 4, 12) },
      { kind: 'normal', enemies: 8, pool: ['cheonyeo', 'dalgyal', 'subway'], payphone: true, swarm: wisps(5, 5, 16) },
      { kind: 'normal', enemies: 9, pool: ['cheonyeo', 'dalgyal', 'subway'], payphone: false, swarm: wisps(4, 6, 22) },
      { kind: 'boss', boss: 'printer', swarm: wisps(7, 4, 10) },
    ],
  },
};
