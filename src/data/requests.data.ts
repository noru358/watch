import type { TKey } from '../i18n';
import type { GhostId, NodeId, ObjectiveKind, RequestId } from '../types/ids';

// Story frames for generated general contracts: who asks and what they saw.
// `nodes` limits where the frame can appear; `pool` overrides the node's ghosts (null = the node's own).
// `objective`: the contract's one main objective. The board first rolls the objective (objectives.data.ts
// weights), then one of that objective's frames (docs/rules/office.md).
export interface RequestData {
  clientKey: TKey;
  textKey: TKey;
  nodes: readonly NodeId[] | null;
  pool: readonly GhostId[] | null;
  objective: ObjectiveKind;
}

export const REQUESTS: Record<RequestId, RequestData> = {
  // 섬멸
  flicker: { clientKey: 'request.flicker.client', textKey: 'request.flicker.text', nodes: null, pool: null, objective: 'clear' },
  smoke: { clientKey: 'request.smoke.client', textKey: 'request.smoke.text', nodes: ['rooftop', 'motel', 'alley'], pool: null, objective: 'clear' },
  karaoke: { clientKey: 'request.karaoke.client', textKey: 'request.karaoke.text', nodes: ['arcade', 'printshop', 'station'], pool: null, objective: 'clear' },
  // 구조
  crying: { clientKey: 'request.crying.client', textKey: 'request.crying.text', nodes: null, pool: ['cheonyeo'], objective: 'rescue' },
  missing: { clientKey: 'request.missing.client', textKey: 'request.missing.text', nodes: ['arcade', 'station', 'motel'], pool: null, objective: 'rescue' },
  // 현상수배
  faceless: { clientKey: 'request.faceless.client', textKey: 'request.faceless.text', nodes: ['alley', 'arcade', 'rooftop'], pool: ['dalgyal', 'cheonyeo'], objective: 'bounty' },
  poster: { clientKey: 'request.poster.client', textKey: 'request.poster.text', nodes: null, pool: null, objective: 'bounty' },
  // 추격
  footsteps: { clientKey: 'request.footsteps.client', textKey: 'request.footsteps.text', nodes: ['printshop', 'motel', 'rooftop'], pool: null, objective: 'chase' },
  snatcher: { clientKey: 'request.snatcher.client', textKey: 'request.snatcher.text', nodes: ['alley', 'printshop', 'arcade'], pool: null, objective: 'chase' },
  // 결계
  cold_spot: { clientKey: 'request.cold_spot.client', textKey: 'request.cold_spot.text', nodes: ['alley', 'printshop', 'motel'], pool: ['dalgyal'], objective: 'ward' },
  shrine: { clientKey: 'request.shrine.client', textKey: 'request.shrine.text', nodes: ['alley', 'rooftop', 'motel'], pool: null, objective: 'ward' },
  // 첫차까지
  last_train: { clientKey: 'request.last_train.client', textKey: 'request.last_train.text', nodes: ['station', 'arcade'], pool: ['subway', 'cheonyeo'], objective: 'firsttrain' },
  taxi: { clientKey: 'request.taxi.client', textKey: 'request.taxi.text', nodes: ['station', 'printshop', 'rooftop'], pool: null, objective: 'firsttrain' },
};
