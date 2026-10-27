import { RANKS, REPUTATION } from '../../data/reputation.data';
import { TRAINING } from '../../data/training.data';
import type { TrainingId } from '../../types/ids';

// Public API of the reputation module (docs/rules/reputation.md). Pure.

export interface ReputationState {
  reputation: number;
  rankReached: number; // highest rank ever reached (points never drop below its threshold)
}

export const MAX_RANK = RANKS.length - 1;

export function rankFor(points: number): number {
  let r = 0;
  RANKS.forEach((k, i) => {
    if (points >= k.at) r = i;
  });
  return r;
}

// Adds (or takes) points. Returns the new rank if one was reached just now.
export function addReputation(s: ReputationState, delta: number): number | null {
  const floor = RANKS[s.rankReached]!.at;
  s.reputation = Math.max(floor, s.reputation + delta);
  const r = rankFor(s.reputation);
  if (r <= s.rankReached) return null;
  s.rankReached = r;
  return r;
}

// Points still needed for the next rank (null at the top).
export function toNextRank(s: ReputationState): { next: number; need: number } | null {
  const next = RANKS[s.rankReached + 1];
  return next ? { next: s.rankReached + 1, need: next.at - s.reputation } : null;
}

// The highest training rank a line may reach at this office rank.
export function trainingCap(rank: number, id: TrainingId): number {
  const share = REPUTATION.trainingCap[Math.min(rank, REPUTATION.trainingCap.length - 1)]!;
  const max = TRAINING[id].max;
  return Math.max(1, Math.min(max, Math.ceil(max * share)));
}

// The first rank at which a training line opens one more step (null if it is at its maximum).
export function trainingCapRaisedAt(rank: number, id: TrainingId): number | null {
  const now = trainingCap(rank, id);
  if (now >= TRAINING[id].max) return null;
  for (let r = rank + 1; r <= MAX_RANK; r++) if (trainingCap(r, id) > now) return r;
  return null;
}
