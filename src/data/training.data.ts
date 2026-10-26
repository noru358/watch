import type { TKey } from '../i18n';
import type { TrainingGroup, TrainingId } from '../types/ids';
import type { Stats } from '../systems/rift';

// 트레이닝 (docs/rules/growth.md): permanent, small steps, bought with money at the director's desk.
// One row = one line on the training panel. A row changes one or more Stats fields:
//   'mult': stat × (1 + per × rank)   — per can be negative (shorter cooldowns)
//   'add':  stat + per × rank
// Adding a line = one row here + its TrainingId + two i18n keys; no code changes.
// Reference pace (docs/reference/progression-systems.md): every line maxed is about
// damage +20 %, HP +33 %, move +10 % — the Vampire Survivors shop range, not a power fantasy.
export interface TrainingLine {
  group: TrainingGroup;
  nameKey: TKey;
  stats: readonly (keyof Stats)[];
  op: 'mult' | 'add';
  per: number;
  max: number;
  cost: number; // base price of this line's first rank
  unit: 'pct' | 'sec' | 'tiles' | 'count'; // how the panel shows the total effect
}

export const TRAINING: Record<TrainingId, TrainingLine> = {
  power_slash: { group: 'power', nameKey: 'training.power_slash', stats: ['slash'], op: 'mult', per: 0.04, max: 5, cost: 180, unit: 'pct' },
  power_draw: { group: 'power', nameKey: 'training.power_draw', stats: ['drawSlash', 'draw'], op: 'mult', per: 0.04, max: 5, cost: 180, unit: 'pct' },
  power_reach: { group: 'power', nameKey: 'training.power_reach', stats: ['reach'], op: 'add', per: 0.05, max: 3, cost: 300, unit: 'tiles' },
  hands_swing: { group: 'hands', nameKey: 'training.hands_swing', stats: ['swingTime'], op: 'mult', per: -0.03, max: 5, cost: 220, unit: 'pct' },
  hands_drawcd: { group: 'hands', nameKey: 'training.hands_drawcd', stats: ['drawCooldown'], op: 'mult', per: -0.05, max: 4, cost: 220, unit: 'pct' },
  hands_finisher: { group: 'hands', nameKey: 'training.hands_finisher', stats: ['finisherRecovery'], op: 'mult', per: -0.05, max: 3, cost: 180, unit: 'pct' },
  feet_move: { group: 'feet', nameKey: 'training.feet_move', stats: ['moveSpeed'], op: 'mult', per: 0.02, max: 5, cost: 180, unit: 'pct' },
  feet_dashcd: { group: 'feet', nameKey: 'training.feet_dashcd', stats: ['dashCooldown'], op: 'mult', per: -0.04, max: 5, cost: 220, unit: 'pct' },
  feet_dashlen: { group: 'feet', nameKey: 'training.feet_dashlen', stats: ['dashSpeed'], op: 'mult', per: 0.05, max: 2, cost: 220, unit: 'pct' },
  nerve_hp: { group: 'nerve', nameKey: 'training.nerve_hp', stats: ['maxHp'], op: 'add', per: 1, max: 4, cost: 220, unit: 'count' },
  nerve_parry: { group: 'nerve', nameKey: 'training.nerve_parry', stats: ['parryWindow'], op: 'add', per: 0.01, max: 3, cost: 380, unit: 'sec' },
  nerve_iframes: { group: 'nerve', nameKey: 'training.nerve_iframes', stats: ['hurtIframes'], op: 'add', per: 0.05, max: 2, cost: 300, unit: 'sec' },
  focus_gauge: { group: 'focus', nameKey: 'training.focus_gauge', stats: ['focusMax'], op: 'add', per: -1, max: 1, cost: 750, unit: 'count' },
  focus_bare: { group: 'focus', nameKey: 'training.focus_bare', stats: ['bareTime'], op: 'add', per: 0.5, max: 2, cost: 220, unit: 'sec' },
  knack_magnet: { group: 'knack', nameKey: 'training.knack_magnet', stats: ['magnet'], op: 'mult', per: 0.1, max: 3, cost: 120, unit: 'pct' },
};

export const TRAINING_GROUPS: readonly TrainingGroup[] = ['power', 'hands', 'feet', 'nerve', 'focus', 'knack'];

// Price of the next rank: base × (ranks already in the line + 1) × (1 + inflation × everything bought).
export const TRAINING_PRICE = { inflation: 0.02, roundTo: 10 } as const;
