import { TRAINING, TRAINING_PRICE } from '../../data/training.data';
import type { TrainingId } from '../../types/ids';
import type { GrowthState } from './types';
import { trainingCap } from '../reputation';

export function trainingRank(g: GrowthState, id: TrainingId): number {
  return g.training[id] ?? 0;
}

// The office's 평판 rank holds each line below its maximum until it rises (reputation module).
export function trainingCapped(g: GrowthState, id: TrainingId): boolean {
  const rank = trainingRank(g, id);
  return rank < TRAINING[id].max && rank >= trainingCap(g.rank, id);
}

// Price of the next rank of a line, or null when the line is full (or capped by 평판).
// base × (ranks already in the line + 1) × (1 + inflation × ranks bought in all lines).
export function trainingPrice(g: GrowthState, id: TrainingId): number | null {
  const line = TRAINING[id];
  const rank = trainingRank(g, id);
  if (rank >= line.max || rank >= trainingCap(g.rank, id)) return null;
  const raw = line.cost * (rank + 1) * (1 + TRAINING_PRICE.inflation * g.trainingBought);
  return Math.round(raw / TRAINING_PRICE.roundTo) * TRAINING_PRICE.roundTo;
}

// Buys one rank if the line has room and the money is there. Returns the price paid (0 = nothing bought).
export function buyTraining(g: GrowthState, id: TrainingId): number {
  const price = trainingPrice(g, id);
  if (price === null || g.money < price) return 0;
  g.money -= price;
  g.training = { ...g.training, [id]: trainingRank(g, id) + 1 };
  g.trainingBought += 1;
  return price;
}
