import type { TKey } from '../i18n';
import type { TrainingGroup, TrainingId } from '../types/ids';
import type { Stats } from '../systems/rift';

// 트레이닝 (docs/rules/growth.md): permanent, small steps, bought with money at the director's desk.
// v2 (2026-10-28, user "스탯 더 쪼개고 촘촘하게"): about twice the lines of v1, half the step, twice the
// ranks; the whole tree maxed is still about damage +20 %, HP +4, move +10 % (the Vampire Survivors
// shop range). One row = one line on the panel; a row changes one or more Stats fields:
//   'mult': stat × (1 + per × rank)   — per can be negative (shorter cooldowns)
//   'add':  stat + per × rank
// Adding a line = one row here + its TrainingId + one i18n key; no code changes. Every Stats field
// is read in exactly one place (systems/rift/types.ts says where).
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
  slash: { group: 'power', nameKey: 'training.slash', stats: ['slash'], op: 'mult', per: 0.02, max: 10, cost: 60, unit: 'pct' },
  draw: { group: 'power', nameKey: 'training.draw', stats: ['drawSlash', 'draw'], op: 'mult', per: 0.02, max: 10, cost: 60, unit: 'pct' },
  reach: { group: 'power', nameKey: 'training.reach', stats: ['reach'], op: 'add', per: 0.025, max: 6, cost: 100, unit: 'tiles' },
  finisher: { group: 'power', nameKey: 'training.finisher', stats: ['comboBonus'], op: 'mult', per: 0.05, max: 6, cost: 50, unit: 'pct' },
  strong: { group: 'power', nameKey: 'training.strong', stats: ['strongDamage'], op: 'add', per: 0.02, max: 5, cost: 80, unit: 'pct' },
  fodder: { group: 'power', nameKey: 'training.fodder', stats: ['fodderDamage'], op: 'add', per: 0.05, max: 4, cost: 40, unit: 'pct' },
  boss: { group: 'power', nameKey: 'training.boss', stats: ['bossDamage'], op: 'add', per: 0.02, max: 5, cost: 90, unit: 'pct' },
  swing: { group: 'hands', nameKey: 'training.swing', stats: ['swingTime'], op: 'mult', per: -0.015, max: 10, cost: 70, unit: 'pct' },
  drawcd: { group: 'hands', nameKey: 'training.drawcd', stats: ['drawCooldown'], op: 'mult', per: -0.025, max: 8, cost: 70, unit: 'pct' },
  recover: { group: 'hands', nameKey: 'training.recover', stats: ['finisherRecovery'], op: 'mult', per: -0.025, max: 6, cost: 60, unit: 'pct' },
  attackMove: { group: 'hands', nameKey: 'training.attackMove', stats: ['attackMove'], op: 'add', per: 0.03, max: 5, cost: 60, unit: 'pct' },
  move: { group: 'feet', nameKey: 'training.move', stats: ['moveSpeed'], op: 'mult', per: 0.01, max: 10, cost: 60, unit: 'pct' },
  dashcd: { group: 'feet', nameKey: 'training.dashcd', stats: ['dashCooldown'], op: 'mult', per: -0.02, max: 10, cost: 70, unit: 'pct' },
  dashlen: { group: 'feet', nameKey: 'training.dashlen', stats: ['dashSpeed'], op: 'mult', per: 0.025, max: 4, cost: 70, unit: 'pct' },
  dashguard: { group: 'feet', nameKey: 'training.dashguard', stats: ['dashIframes'], op: 'add', per: 0.01, max: 4, cost: 80, unit: 'sec' },
  hp: { group: 'nerve', nameKey: 'training.hp', stats: ['maxHp'], op: 'add', per: 1, max: 4, cost: 140, unit: 'count' },
  parry: { group: 'nerve', nameKey: 'training.parry', stats: ['parryWindow'], op: 'add', per: 0.005, max: 6, cost: 120, unit: 'sec' },
  iframes: { group: 'nerve', nameKey: 'training.iframes', stats: ['hurtIframes'], op: 'add', per: 0.025, max: 4, cost: 100, unit: 'sec' },
  guard: { group: 'nerve', nameKey: 'training.guard', stats: ['damageTaken'], op: 'add', per: -0.02, max: 5, cost: 100, unit: 'pct' },
  dark: { group: 'nerve', nameKey: 'training.dark', stats: ['darkResist'], op: 'add', per: 0.08, max: 4, cost: 90, unit: 'pct' },
  heal: { group: 'nerve', nameKey: 'training.heal', stats: ['healMult'], op: 'add', per: 0.05, max: 4, cost: 60, unit: 'pct' },
  gauge: { group: 'focus', nameKey: 'training.gauge', stats: ['focusMax'], op: 'add', per: -1, max: 1, cost: 490, unit: 'count' },
  bare: { group: 'focus', nameKey: 'training.bare', stats: ['bareTime'], op: 'add', per: 0.25, max: 4, cost: 70, unit: 'sec' },
  focusGain: { group: 'focus', nameKey: 'training.focusGain', stats: ['focusGain'], op: 'add', per: 0.05, max: 4, cost: 80, unit: 'pct' },
  crit: { group: 'eye', nameKey: 'training.crit', stats: ['critChance'], op: 'add', per: 0.01, max: 10, cost: 60, unit: 'pct' },
  critDmg: { group: 'eye', nameKey: 'training.critDmg', stats: ['critDamage'], op: 'add', per: 0.05, max: 6, cost: 70, unit: 'pct' },
  magnet: { group: 'knack', nameKey: 'training.magnet', stats: ['magnet'], op: 'mult', per: 0.05, max: 6, cost: 40, unit: 'pct' },
  spirit: { group: 'knack', nameKey: 'training.spirit', stats: ['spiritGain'], op: 'add', per: 0.02, max: 10, cost: 60, unit: 'pct' },
  shard: { group: 'knack', nameKey: 'training.shard', stats: ['shardChance'], op: 'add', per: 0.02, max: 5, cost: 130, unit: 'pct' },
  fee: { group: 'knack', nameKey: 'training.fee', stats: ['feeBonus'], op: 'add', per: 0.01, max: 10, cost: 80, unit: 'pct' },
  ward: { group: 'trade', nameKey: 'training.ward', stats: ['wardSpeed'], op: 'add', per: 0.04, max: 5, cost: 50, unit: 'pct' },
  survivor: { group: 'trade', nameKey: 'training.survivor', stats: ['survivorHp'], op: 'add', per: 0.06, max: 5, cost: 50, unit: 'pct' },
  train: { group: 'trade', nameKey: 'training.train', stats: ['trainTime'], op: 'add', per: -0.02, max: 5, cost: 50, unit: 'pct' },
};

export const TRAINING_GROUPS: readonly TrainingGroup[] = ['power', 'hands', 'feet', 'nerve', 'focus', 'eye', 'knack', 'trade'];

// Price of the next rank: base × (ranks already in the line + 1) × (1 + inflation × everything bought).
// v2 has four times the ranks, so it inflates a quarter as fast (whole tree ≈ 96k, v1 was ≈ 46k).
export const TRAINING_PRICE = { inflation: 0.005, roundTo: 10 } as const;

// Save v6 → v7: v1 lines → v2 lines and how many v2 ranks one v1 rank is worth.
export const TRAINING_V1_TO_V2: Record<string, [TrainingId, number]> = {
  power_slash: ['slash', 2], power_draw: ['draw', 2], power_reach: ['reach', 2],
  hands_swing: ['swing', 2], hands_drawcd: ['drawcd', 2], hands_finisher: ['recover', 2],
  feet_move: ['move', 2], feet_dashcd: ['dashcd', 2], feet_dashlen: ['dashlen', 2],
  nerve_hp: ['hp', 1], nerve_parry: ['parry', 2], nerve_iframes: ['iframes', 2],
  focus_gauge: ['gauge', 1], focus_bare: ['bare', 2], knack_magnet: ['magnet', 2],
};
