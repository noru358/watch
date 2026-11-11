import type { ObjectiveKind } from '../types/ids';

// 직원 (docs/design/4-day/economy.md "경영 뼈대 설계", rules in docs/rules/staff.md). One night the
// director plays one offer and assigns staff to others; they succeed or fail on a roll (odds shown).
// Every number here is a first value, to be tuned by playing.
export const STAFF = {
  // By 급수 (1–4): weekly wage (paid with the rent; also the signing fee) and starting 힘.
  grades: {
    1: { wage: 200, power: 4 },
    2: { wage: 400, power: 8 },
    3: { wage: 600, power: 12 },
    4: { wage: 800, power: 16 },
  },
  // Odds = clamp(base + (힘 × knack − 난이도 × perDifficulty + offset) × perPoint, min, max).
  // 1급(4) on a 난이도 1 offer ≈ 74 %, on 난이도 3 ≈ 26 %; 2급(8) on 난이도 3 ≈ 50 %.
  odds: { base: 0.5, perPoint: 0.06, perDifficulty: 4, offset: 4, min: 0.05, max: 0.95, knack: 1.3 },
  // 트라우마 0..max; from `block` on, a staff member cannot be assigned. A failed job adds `fail`
  // (`badFail` when 난이도 × perDifficulty is more than `badGap` above their 힘).
  trauma: { max: 6, block: 4, fail: 1, badFail: 2, badGap: 8 },
  // A night not assigned is rest: trauma −rest (−rest −sofaBonus once the 소파 is built).
  rest: 1,
  sofaBonus: 1,
  // Training: +1 힘 for train × (times trained + 1) money, up to `trainCap` times.
  train: 60,
  trainCap: 6,
  // Hiring: `candidates` new names each week; at most capBase + 평판 rank staff at once.
  candidates: 3,
  capBase: 1,
  knackChance: 0.7, // a candidate has a 특기 (one objective) this often
  powerJitter: 2, // starting 힘 = the grade's + 0..this
} as const;

export type StaffGrade = keyof typeof STAFF.grades;
export type Knack = ObjectiveKind | null;
