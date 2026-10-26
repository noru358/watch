import type { TKey } from '../i18n';
import type { GhostId, NodeId, ObjectiveKind, RequestId } from '../types/ids';

// Story frames for generated general contracts: who asks and what they saw.
// `nodes` limits where the frame can appear; `pool` overrides the node's ghosts (null = the node's own).
// `objective`: what the night asks (docs/design/2-night/objectives.md); a rescue sits on OFFICE.rescue.goalFloor.
export interface RequestData {
  clientKey: TKey;
  textKey: TKey;
  nodes: readonly NodeId[] | null;
  pool: readonly GhostId[] | null;
  objective: ObjectiveKind;
}

export const REQUESTS: Record<RequestId, RequestData> = {
  flicker: { clientKey: 'request.flicker.client', textKey: 'request.flicker.text', nodes: null, pool: null, objective: 'clear' },
  footsteps: { clientKey: 'request.footsteps.client', textKey: 'request.footsteps.text', nodes: ['printshop', 'motel', 'rooftop'], pool: null, objective: 'clear' },
  cold_spot: { clientKey: 'request.cold_spot.client', textKey: 'request.cold_spot.text', nodes: ['alley', 'printshop', 'motel'], pool: ['dalgyal'], objective: 'clear' },
  crying: { clientKey: 'request.crying.client', textKey: 'request.crying.text', nodes: null, pool: ['cheonyeo'], objective: 'rescue' },
  last_train: { clientKey: 'request.last_train.client', textKey: 'request.last_train.text', nodes: ['station', 'arcade'], pool: ['subway', 'cheonyeo'], objective: 'clear' },
  faceless: { clientKey: 'request.faceless.client', textKey: 'request.faceless.text', nodes: ['alley', 'arcade', 'rooftop'], pool: ['dalgyal', 'cheonyeo'], objective: 'clear' },
  missing: { clientKey: 'request.missing.client', textKey: 'request.missing.text', nodes: ['arcade', 'station', 'motel'], pool: null, objective: 'rescue' },
  smoke: { clientKey: 'request.smoke.client', textKey: 'request.smoke.text', nodes: ['rooftop', 'motel', 'alley'], pool: null, objective: 'clear' },
};
