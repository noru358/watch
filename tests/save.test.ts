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
    expect(loaded).toEqual(a.toSave());
    expect(loaded?.schemaVersion).toBe(SAVE_VERSION);
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

describe('save v7 (skills v2, training v2, 장신구)', () => {
  it('a v6 save keeps its skill sides and turns v1 training into v2 ranks', () => {
    const now = new GameStore().toSave() as unknown as Record<string, unknown>;
    const { upgrades: _u, gear: _g, equipped: _e, nextGearId: _n, ...rest } = now;
    const v6 = { ...rest, schemaVersion: 6, passives: { blade1: 'b', step1: 'a' }, training: { power_slash: 3, nerve_hp: 2, focus_gauge: 1 }, trainingBought: 6 };
    const v = migrate(v6)!;
    expect(v.schemaVersion).toBe(SAVE_VERSION);
    expect(v.passives).toEqual({ blade1: 1, step1: 0 });
    expect(v.training).toEqual({ slash: 6, hp: 2, gauge: 1 });
    expect(v.trainingBought).toBe(9);
    expect(v.gear).toEqual([]);
    expect(v.equipped).toEqual({});
    expect(v.nextGearId).toBe(1);
  });
});
