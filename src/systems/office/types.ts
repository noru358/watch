import type { ChapterId, ContractId, ContractKind, GhostId, ModifierId, NodeId, ObjectiveKind, RequestId } from '../../types/ids';

// The named ghost of a 현상수배 or 추격 contract.
export interface OfferTarget {
  ghost: GhostId;
  name: [number, number]; // indices into the name tables (i18n wanted.pre.N / wanted.suf.N)
  level: number; // 0 = first posting; +1 every time it got away
}

// One card on the contract board. Everything a night needs is derived from it (offerFloors).
export interface ContractOffer {
  id: number;
  kind: ContractKind;
  node: NodeId;
  story: ContractId | null; // 메인 스토리 only
  objective: ObjectiveKind | null; // 일반 의뢰: its one main objective (null for main story)
  request: RequestId | null; // 일반 의뢰: the client's story frame
  mods: ModifierId[]; // 현장 변형
  target: OfferTarget | null; // 현상수배 / 추격
  pool: GhostId[]; // strong ghosts on the floors
  risk: number; // node contamination when posted (0..5): ghost density and swarm only
  floors: number;
  goalFloor: number; // 0-based floor the objective ends on (추격: the last floor, it may end sooner)
  fee: number;
  shards: number; // 심연 파편 for finishing the objective
  deadline: number | null; // last day it can be taken; null = stays until done
}

export type Contamination = Record<NodeId, number>;

// One main-story chapter's progress (save v5).
export interface ChapterState {
  started: number; // day it started
  clues: number; // 단서 gathered
  done: number | null; // day its main contract was finished
}

// A named 현상수배 target whose offer expired: it comes back on the board, one level stronger.
export interface WantedTarget extends OfferTarget {
  node: NodeId;
}

// The long-lived office state this module reads and writes (a slice of GameState).
export interface OfficeState {
  day: number;
  money: number;
  debt: number;
  contamination: Contamination;
  known: NodeId[]; // nodes visited at least once (their ghosts are no longer "?")
  board: ContractOffer[];
  nextOfferId: number;
  storyDone: ContractId[];
  wanted: WantedTarget[];
  chapters: Partial<Record<ChapterId, ChapterState>>; // 메인 스토리 장 (chapters.ts)
  deskLevel: number; // 경리 책상 (facilities.data.ts): more offers, longer deadlines
  reputation: number; // 평판 points (reputation module)
  rankReached: number;
}

// What happened overnight, for the bookkeeper's morning line.
export interface MorningReport {
  day: number;
  rentDue: boolean;
  rentPaid: number;
  debtAdded: number;
  expired: number;
  worsened: NodeId[]; // nodes whose contamination rose
  newOffers: number;
  rankUp: number | null; // the rank reached last night (a text comes in the morning)
}

export interface NightResolution {
  completed: number[]; // offer ids finished tonight (합동 출동 can finish several)
  fee: number; // all of their fees together (0 unless success)
  clue: { chapter: ChapterId; have: number; need: number } | null; // 메인 스토리 단서 gained tonight
  reputation: number; // 평판 gained (or lost) tonight
  rankUp: number | null;
}
