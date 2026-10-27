// Versioned save file (Rule 6). Every change to SaveData bumps SAVE_VERSION and adds
// a step to MIGRATIONS plus a test. Only long-lived office state is saved; a night in
// progress is not (quitting mid-night = the night never happened).

import { startingContamination, type ChapterState, type ContractOffer, type Contamination, type WantedTarget } from '../systems/office';
import type { ActiveId, ChapterId, ContractId, FacilityId, NodeId, SceneId, SkillSlotId, SupplyId, UpgradeId } from '../types/ids';
import type { GearItem, GearSlot } from '../systems/gear';
import { TRAINING, TRAINING_V1_TO_V2 } from '../data/training.data';
import type { TrainingLevels } from '../systems/run';
import { rankFor } from '../systems/reputation';

export const SAVE_VERSION = 7;

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
  // v4: growth (training, skills, facilities, supply, 심연 파편) and named bounties that got away
  shards: number;
  training: TrainingLevels;
  trainingBought: number;
  facilities: Record<FacilityId, number>;
  supply: SupplyId | null;
  passives: Partial<Record<SkillSlotId, number>>;
  actives: ActiveId[];
  active: ActiveId | null;
  wanted: WantedTarget[];
  // v5: main-story chapters (clues, done days)
  chapters: Partial<Record<ChapterId, ChapterState>>;
  // v6: 평판 (points and the highest rank reached)
  reputation: number;
  rankReached: number;
  // v7: skills as sides by index, 개조, 장신구; training v2 lines
  upgrades: Partial<Record<ActiveId, UpgradeId>>;
  gear: GearItem[];
  equipped: Partial<Record<GearSlot, number>>;
  nextGearId: number;
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
  // v3 → v4: nothing grown yet. Contract offers changed shape (main/general + objectives), so the
  // board is cleared and refilled on load for the same day.
  3: (old) => ({
    ...old,
    board: [],
    shards: 0,
    training: {},
    trainingBought: 0,
    facilities: { desk: 0, bench: 0, sofa: 0 },
    supply: null,
    passives: {},
    actives: [],
    active: null,
    wanted: [],
  }),
  // v4 → v5: chapters. Chapter 1 is under way (or done, if its contract was finished).
  4: (old) => ({
    ...old,
    chapters: { ch1: { started: 1, clues: 0, done: Array.isArray(old.storyDone) && old.storyDone.includes('lights_out') ? (isNum(old.day) ? old.day : 1) : null } },
  }),
  // v5 → v6: 평판 from the jobs already solved (20 each), so an older office keeps what it reached.
  5: (old) => {
    const reputation = (isNum(old.solved) ? old.solved : 0) * MIGRATE_REP_PER_SOLVED;
    return { ...old, reputation, rankReached: rankFor(reputation) };
  },
  6: toV7,
};
const MIGRATE_REP_PER_SOLVED = 20;

// v6 → v7: skill sides 'a' / 'b' → 0 / 1; training v1 lines → v2 lines (TRAINING_V1_TO_V2, each v1
// rank is worth the v2 ranks given there, capped at the v2 maximum); no 개조 or 장신구 yet.
function toV7(old: Raw): Raw {
  const passives = Object.fromEntries(Object.entries((old.passives as Record<string, string>) ?? {}).map(([k, v]) => [k, v === 'b' ? 1 : 0]));
  const training: Record<string, number> = {};
  for (const [id, r] of Object.entries((old.training as Record<string, number>) ?? {})) {
    const to = TRAINING_V1_TO_V2[id];
    if (!to || !isNum(r)) continue;
    training[to[0]] = Math.min(TRAINING[to[0]].max, (training[to[0]] ?? 0) + r * to[1]);
  }
  const bought = Object.values(training).reduce((a, b) => a + b, 0);
  return { ...old, passives, training, trainingBought: bought, upgrades: {}, gear: [], equipped: {}, nextGearId: 1 };
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObj = (v: unknown): v is object => typeof v === 'object' && v !== null && !Array.isArray(v);

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
  const { shards, training, trainingBought, facilities, supply, passives, actives, active, wanted, chapters, reputation, rankReached, upgrades, gear, equipped, nextGearId } = data;
  if (![money, trauma, solved, seedBase, runCounter, day, debt, nextOfferId, shards, trainingBought, reputation, rankReached, nextGearId].every(isNum)) return null;
  if (!isObj(upgrades) || !Array.isArray(gear) || !isObj(equipped)) return null;
  if (!Array.isArray(known) || !Array.isArray(board) || !Array.isArray(storyDone) || !Array.isArray(seen)) return null;
  if (!Array.isArray(actives) || !Array.isArray(wanted) || !isObj(training) || !isObj(facilities) || !isObj(passives) || !isObj(chapters)) return null;
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
    shards,
    training,
    trainingBought,
    facilities: { desk: 0, bench: 0, sofa: 0, ...(facilities as object) },
    supply: supply ?? null,
    passives,
    actives,
    active: active ?? null,
    wanted,
    chapters,
    reputation,
    rankReached,
    upgrades,
    gear,
    equipped,
    nextGearId,
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
