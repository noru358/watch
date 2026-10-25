import { describe, expect, it } from 'vitest';
import { migrate, SAVE_VERSION, SaveManager, type SaveStorage } from '../src/core/SaveManager';
import { GameStore } from '../src/store/gameStore';

const memory = (): SaveStorage & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
};

describe('SaveManager', () => {
  it('round-trips the office state through the store', () => {
    const disk = memory();
    const saves = new SaveManager(disk, 'save', '.bad');
    const a = new GameStore({ money: 120, solved: 2, seedBase: 9, runCounter: 3 });
    saves.save(a.toSave());
    const loaded = saves.load();
    expect(loaded).toEqual({ schemaVersion: SAVE_VERSION, money: 120, trauma: 0, solved: 2, seedBase: 9, runCounter: 3 });
    const b = new GameStore(loaded ?? {});
    expect(b.takeRunSeed()).toBe(a.takeRunSeed());
  });

  it('returns null with no save, and keeps an unreadable save aside instead of losing it', () => {
    const disk = memory();
    const saves = new SaveManager(disk, 'save', '.bad');
    expect(saves.load()).toBeNull();
    disk.map.set('save', '{broken');
    expect(saves.load()).toBeNull();
    expect(disk.map.get('save.bad')).toBe('{broken');
  });

  it('refuses saves from a newer version and saves with missing fields', () => {
    expect(migrate({ schemaVersion: SAVE_VERSION + 1, money: 1, trauma: 0, solved: 0, seedBase: 1, runCounter: 0 })).toBeNull();
    expect(migrate({ schemaVersion: SAVE_VERSION, money: 1 })).toBeNull();
    expect(migrate('nope')).toBeNull();
  });

  it('keeps working when storage throws', () => {
    const angry: SaveStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const saves = new SaveManager(angry, 'save', '.bad');
    expect(saves.load()).toBeNull();
    expect(() => saves.save(new GameStore().toSave())).not.toThrow();
  });
});
