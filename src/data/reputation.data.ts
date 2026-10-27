import type { TKey } from '../i18n';

// 평판 (docs/rules/reputation.md): experience the office earns, never spent. It only rises with work
// and falls a little with failure, never below the rank already reached. Ranks open what the
// office may take on; the rows that say "needs rank n" sit with their own data (objectives,
// modifiers, nodes, facilities, chapters) as a `rank` field, and training caps are below.
export interface RankData {
  at: number; // points to reach this rank
  nameKey: TKey;
  // The morning after the rank is reached: a text from someone who noticed.
  from: TKey;
  textKey: TKey;
}

export const RANKS: readonly RankData[] = [
  { at: 0, nameKey: 'rank.0', from: 'name.landlady', textKey: 'rank.0.text' },
  { at: 100, nameKey: 'rank.1', from: 'rank.1.from', textKey: 'rank.1.text' },
  { at: 300, nameKey: 'rank.2', from: 'rank.2.from', textKey: 'rank.2.text' },
  { at: 650, nameKey: 'rank.3', from: 'rank.3.from', textKey: 'rank.3.text' },
  { at: 1200, nameKey: 'rank.4', from: 'rank.4.from', textKey: 'rank.4.text' },
];

export const REPUTATION = {
  // Earned per finished offer: 일반 의뢰 = 난이도 × perDifficulty (+ hotBonus if its district was at
  // hotAt or more), 메인 스토리 = main.
  perDifficulty: 10,
  hotAt: 4,
  hotBonus: 5,
  main: 60,
  // Lost: the director fell / the objective was lost (per night), an offer left to expire (each).
  died: 15,
  failed: 10,
  expired: 5,
  // 트레이닝: share of each line's maximum open at each rank (at least 1 rank per line).
  trainingCap: [0.4, 0.6, 0.8, 1, 1],
} as const;
