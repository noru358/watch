import type { Knack, StaffGrade } from '../../data/staff.data';
import type { NodeId, ObjectiveKind } from '../../types/ids';

// One exorcist on the office's books (save v9). Names are indices into the i18n tables
// staff.family.N / staff.given.N.
export interface Staff {
  id: number;
  origin: 'hire'; // 'story' members join with the chapters (not yet)
  name: [number, number];
  grade: StaffGrade;
  power: number; // 힘: the same unit as 난이도 × STAFF.odds.perDifficulty
  knack: Knack; // 특기: that objective goes better
  trauma: number;
  trained: number; // times trained (the price rises)
}

export type StaffCandidate = Omit<Staff, 'id' | 'trauma' | 'trained'>;

// This week's 구인 list (it changes every 7 days).
export interface HirePool {
  week: number;
  list: StaffCandidate[];
}

// What one staff member did last night, for the morning report.
export interface StaffNightLine {
  staffId: number;
  name: [number, number]; // as it was (they may leave in the morning)
  offerId: number | null; // null = rested
  node: NodeId | null;
  objective: ObjectiveKind | null;
  success: boolean;
  fee: number;
  trauma: number; // change
}

// The staff part of the morning report.
export interface StaffMorning {
  staff?: StaffNightLine[];
  wages?: number; // paid this morning
  quit?: Staff[]; // left because their wage could not be paid
}
