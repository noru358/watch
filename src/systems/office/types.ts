import type { ContractId, ContractKind, GhostId, NodeId, RequestId } from '../../types/ids';

// One card on the contract board. Everything a night needs is derived from it (offerFloors).
export interface ContractOffer {
  id: number;
  kind: ContractKind;
  node: NodeId;
  story: ContractId | null; // story contracts only
  request: RequestId | null; // general contracts only (the client's story frame)
  target: GhostId | null; // bounty only: the named ghost
  pool: GhostId[]; // strong ghosts on the floors
  risk: number; // node contamination when posted (0..5)
  floors: number; // floors before the end (story: from its table)
  fee: number;
  deadline: number | null; // last day it can be taken; null = stays until done
}

export type Contamination = Record<NodeId, number>;

// A named 현상수배 target that got away (failed night or expired offer): it comes back stronger.
export interface WantedTarget {
  ghost: GhostId;
  name: [number, number]; // indices into the name tables (office.data.ts WANTED_NAMES)
  level: number; // 0 = first posting; +1 every time it gets away (capped)
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
  deskLevel: number; // 경리 책상 (facilities.data.ts): more offers, longer deadlines
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
}

export interface NightResolution {
  completed: number[]; // offer ids finished tonight (a bundle can finish several)
  fee: number; // all of their fees together (0 unless success)
}
