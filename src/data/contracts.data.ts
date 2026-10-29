import type { TKey } from '../i18n';
import type { BossId, ContractId, FloorTheme, GhostId, ModifierId, NodeId, ObjectiveKind } from '../types/ids';

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

// What a floor's objective needs beyond its kind: the named target (현상수배 / 추격), the 심연 파편
// it pays, the time to hold out (첫차까지).
export interface ObjectiveBrief {
  target: { ghost: GhostId; level: number } | null;
  shards: number;
  time: number;
}

// normal: random rooms; the stairs stay shut until the floor's objective is met (null = open from the start).
// `goal`: the contract's main objective is on this floor, so finishing it offers to go home with the fee.
// `mods`: 현장 변형 (modifiers.data.ts). `deep`: floors past the goal ("계속": richer, harder).
// boss: the source's room (main story); `shards` are paid when it is purified.
export type FloorPlan =
  | {
      kind: 'normal';
      enemies: number;
      pool: readonly GhostId[];
      payphone: boolean;
      swarm: SwarmPlan | null;
      objective: ObjectiveKind | null;
      goal: boolean;
      theme: FloorTheme;
      mods?: readonly ModifierId[];
      deep?: number;
      brief?: ObjectiveBrief;
    }
  | { kind: 'boss'; boss: BossId; swarm: SwarmPlan | null; theme: FloorTheme; shards?: number };

export const wisps = (every: number, group: number, cap: number): SwarmPlan => ({ kind: 'dokkaebibul', every, group, cap, near: 7, far: 12 });

export interface ContractData {
  nameKey: TKey;
  textKey: TKey;
  node: NodeId; // where it sits on the operations map
  floors: readonly FloorPlan[];
  fee: number; // paid when the source (boss) is purified
  targetNameKey?: TKey; // the named ghost of the last floor, when it is not a boss (HUD)
}

// 메인 스토리: hand-written contracts. 일반 의뢰 are generated (src/systems/office/).
export const CONTRACTS: Record<ContractId, ContractData> = {
  // 1장 main contract (story TBD): alley → basement → arcade (☎) → rooftop → gumiho boss
  lights_out: {
    nameKey: 'board.storyName.lights_out',
    textKey: 'board.storyText.lights_out',
    node: 'alley',
    fee: 300,
    floors: [
      { kind: 'normal', enemies: 5, pool: ['cheonyeo', 'dalgyal'], payphone: false, swarm: wisps(6.5, 4, 10), objective: 'clear', goal: false, theme: 'alley' },
      { kind: 'normal', enemies: 6, pool: ['cheonyeo', 'dalgyal'], payphone: false, swarm: wisps(6, 4, 12), objective: 'clear', goal: false, theme: 'basement' },
      { kind: 'normal', enemies: 7, pool: ['cheonyeo', 'dalgyal', 'subway'], payphone: true, swarm: wisps(5.5, 4, 14), objective: 'clear', goal: false, theme: 'arcade' },
      { kind: 'normal', enemies: 7, pool: ['cheonyeo', 'dalgyal', 'subway'], payphone: false, swarm: wisps(5, 5, 16), objective: 'clear', goal: false, theme: 'rooftop' },
      { kind: 'boss', boss: 'gumiho', swarm: wisps(7, 4, 10), theme: 'lot', shards: 3 },
    ],
  },
  // 2장 main contract (story TBD): arcade → basement (blackout, ☎) → arcade (haste) → named subway wraith as a 현상수배-style target.
  last_line: {
    nameKey: 'board.storyName.last_line',
    textKey: 'board.storyText.last_line',
    node: 'station',
    fee: 450,
    targetNameKey: 'name.storyTarget',
    floors: [
      { kind: 'normal', enemies: 5, pool: ['cheonyeo', 'dalgyal', 'subway'], payphone: false, swarm: wisps(6.5, 4, 10), objective: 'clear', goal: false, theme: 'arcade' },
      { kind: 'normal', enemies: 5, pool: ['dalgyal', 'subway'], payphone: true, swarm: wisps(6, 4, 12), objective: 'clear', goal: false, theme: 'basement', mods: ['blackout'] },
      { kind: 'normal', enemies: 6, pool: ['cheonyeo', 'dalgyal', 'subway'], payphone: false, swarm: wisps(5.5, 4, 14), objective: 'clear', goal: false, theme: 'arcade', mods: ['haste'] },
      { kind: 'normal', enemies: 3, pool: ['dalgyal', 'cheonyeo'], payphone: false, swarm: wisps(6, 4, 10), objective: 'bounty', goal: false, theme: 'basement', brief: { target: { ghost: 'subway', level: 2 }, shards: 3, time: 0 } },
    ],
  },
};
