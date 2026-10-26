import type { TKey } from '../i18n';
import type { BossId, ContractId, FloorTheme, GhostId, NodeId } from '../types/ids';

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

// normal: random rooms; with `seal` the stairs stay shut until every strong ghost on the floor is down.
// arena: one big room of strong ghosts (a bounty's last floor); clearing it ends the night.
// boss: the source's room.
export type FloorPlan =
  | { kind: 'normal'; enemies: number; pool: readonly GhostId[]; payphone: boolean; swarm: SwarmPlan | null; seal: boolean; theme: FloorTheme }
  | { kind: 'arena'; enemies: number; pool: readonly GhostId[]; swarm: SwarmPlan | null; theme: FloorTheme }
  | { kind: 'boss'; boss: BossId; swarm: SwarmPlan | null; theme: FloorTheme };

export const wisps = (every: number, group: number, cap: number): SwarmPlan => ({ kind: 'dokkaebibul', every, group, cap, near: 7, far: 12 });

export interface ContractData {
  nameKey: TKey;
  textKey: TKey;
  node: NodeId; // where it sits on the operations map
  floors: readonly FloorPlan[];
  fee: number; // paid when the source (boss) is purified
  unlockDay: number; // first day it shows on the board
}

// Hand-written story contracts. General and bounty contracts are generated (src/systems/office/).
export const CONTRACTS: Record<ContractId, ContractData> = {
  // 불 꺼지는 동네: 구미호 「월하」 (docs/design/2-night/contract.md)
  // 불 꺼진 골목 → 인쇄소 지하 → 지하상가(☎) → 옥상 → 불이 전부 꺼진 공터
  lights_out: {
    nameKey: 'board.storyName.lights_out',
    textKey: 'board.storyText.lights_out',
    node: 'alley',
    fee: 300,
    unlockDay: 1,
    floors: [
      { kind: 'normal', enemies: 5, pool: ['cheonyeo', 'dalgyal'], payphone: false, swarm: wisps(6.5, 4, 10), seal: true, theme: 'alley' },
      { kind: 'normal', enemies: 6, pool: ['cheonyeo', 'dalgyal'], payphone: false, swarm: wisps(6, 4, 12), seal: true, theme: 'basement' },
      { kind: 'normal', enemies: 7, pool: ['cheonyeo', 'dalgyal', 'subway'], payphone: true, swarm: wisps(5.5, 4, 14), seal: true, theme: 'arcade' },
      { kind: 'normal', enemies: 7, pool: ['cheonyeo', 'dalgyal', 'subway'], payphone: false, swarm: wisps(5, 5, 16), seal: true, theme: 'rooftop' },
      { kind: 'boss', boss: 'gumiho', swarm: wisps(7, 4, 10), theme: 'lot' },
    ],
  },
};
