// Versioned save file (Rule 6). Every change to SaveData bumps SAVE_VERSION and adds
// a step to MIGRATIONS plus a test. Only long-lived office state is saved; a night in
// progress is not (quitting mid-night = the night never happened).

import { startingContamination, type ContractOffer, type Contamination } from '../systems/office';
import type { ContractId, NodeId, SceneId } from '../types/ids';

export const SAVE_VERSION = 3;

export interface SaveData {
  schemaVersion: typeof SAVE_VERSION;
  money: number;
  trauma: number;
  solved: number;
  seedBase: number;
  runCounter: number;
  // v2: day loop, contract board, operations map
  day: number;
  debt: number;
  contamination: Contamination;
  known: NodeId[];
  board: ContractOffer[];
  nextOfferId: number;
  storyDone: ContractId[];
  // v3: story scenes already shown (dialogue box)
  seen: SceneId[];
}

// The part of localStorage we use; tests pass a Map-backed fake.
export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type Raw = Record<string, unknown>;

// MIGRATIONS[n] turns a version-n save into version n+1.
const MIGRATIONS: Record<number, (old: Raw) => Raw> = {
  // v1 → v2: the office gets a calendar and a board. A finished story contract is remembered from
  // the solved count (the only story contract then was lights_out). The board is refilled on load.
  1: (old) => ({
    ...old,
    day: 1,
    debt: 0,
    contamination: null, // null = starting contamination (filled by the store)
    known: [],
    board: [],
    nextOfferId: 1,
    storyDone: isNum(old.solved) && old.solved > 0 ? ['lights_out'] : [],
  }),
  // v2 → v3: story scenes. Anyone who has already played a night has seen the opening.
  2: (old) => ({ ...old, seen: isNum(old.runCounter) && old.runCounter > 0 ? ['intro'] : [] }),
};

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// Brings any older save up to the current version. Returns null for anything unreadable
// or from a newer game version (never guess at those).
export function migrate(raw: unknown): SaveData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  let data = raw as Raw;
  let v = data.schemaVersion;
  if (!isNum(v) || v > SAVE_VERSION) return null;
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) return null;
    data = { ...step(data), schemaVersion: v + 1 };
    v += 1;
  }
  const { money, trauma, solved, seedBase, runCounter, day, debt, contamination, known, board, nextOfferId, storyDone, seen } = data;
  if (![money, trauma, solved, seedBase, runCounter, day, debt, nextOfferId].every(isNum)) return null;
  if (!Array.isArray(known) || !Array.isArray(board) || !Array.isArray(storyDone) || !Array.isArray(seen)) return null;
  if (contamination !== null && (typeof contamination !== 'object' || Array.isArray(contamination))) return null;
  return {
    schemaVersion: SAVE_VERSION,
    money,
    trauma,
    solved,
    seedBase,
    runCounter,
    day,
    debt,
    contamination: contamination ?? startingContamination(),
    known,
    board,
    nextOfferId,
    storyDone,
    seen,
  } as SaveData;
}

export class SaveManager {
  constructor(
    private readonly storage: SaveStorage | null,
    private readonly key: string,
    private readonly badSuffix: string,
  ) {}

  // null = no save yet (or storage unavailable / unreadable save, which is backed up first).
  load(): SaveData | null {
    let text: string | null = null;
    try {
      text = this.storage?.getItem(this.key) ?? null;
    } catch {
      return null;
    }
    if (text === null) return null;
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    const data = migrate(parsed);
    if (!data) this.write(this.key + this.badSuffix, text);
    return data;
  }

  save(data: SaveData): void {
    this.write(this.key, JSON.stringify(data));
  }

  private write(key: string, text: string): void {
    try {
      this.storage?.setItem(key, text);
    } catch {
      // Private mode / quota: the game keeps running, it just won't remember.
    }
  }
}
