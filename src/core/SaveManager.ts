// Versioned save file (Rule 6). Every change to SaveData bumps SAVE_VERSION and adds
// a step to MIGRATIONS plus a test. Only long-lived office state is saved; a night in
// progress is not (quitting mid-night = the night never happened).

export const SAVE_VERSION = 1;

export interface SaveData {
  schemaVersion: typeof SAVE_VERSION;
  money: number;
  trauma: number;
  solved: number;
  seedBase: number;
  runCounter: number;
}

// The part of localStorage we use; tests pass a Map-backed fake.
export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type Raw = Record<string, unknown>;

// MIGRATIONS[n] turns a version-n save into version n+1. Empty while we are on v1.
const MIGRATIONS: Record<number, (old: Raw) => Raw> = {};

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
  const { money, trauma, solved, seedBase, runCounter } = data;
  if (![money, trauma, solved, seedBase, runCounter].every(isNum)) return null;
  return { schemaVersion: SAVE_VERSION, money, trauma, solved, seedBase, runCounter } as SaveData;
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
