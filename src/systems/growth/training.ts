import { TRAINING, TRAINING_PRICE } from '../../data/training.data';
import type { TrainingId } from '../../types/ids';
import type { GrowthState } from './types';

export function trainingRank(g: GrowthState, id: TrainingId): number {
  return g.training[id] ?? 0;
}

// Price of the next rank of a line, or null when the line is full.
// base × (ranks already in the line + 1) × (1 + inflation × ranks bought in all lines).
export function trainingPrice(g: GrowthState, id: TrainingId): number | null {
  const line = TRAINING[id];
  const rank = trainingRank(g, id);
  if (rank >= line.max) return null;
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
