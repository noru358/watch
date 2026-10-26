import { describe, expect, it } from 'vitest';
import { SCENES } from '../src/data/story.data';
import { nextScene } from '../src/systems/story';
import { GameStore } from '../src/store/gameStore';

describe('story: which scene plays in the office', () => {
  it('opens with the intro, once', () => {
    expect(nextScene({ seen: [], solved: 0, chapters: {} })).toBe('intro');
    expect(nextScene({ seen: ['intro'], solved: 0, chapters: {} })).toBeNull();
  });

  it('the bookkeeper arrives after the first solve; then chapter scenes in order', () => {
    expect(nextScene({ seen: ['intro'], solved: 1, chapters: { ch1: 'ready' } })).toBe('bookkeeper');
    expect(nextScene({ seen: ['intro', 'bookkeeper'], solved: 1, chapters: { ch1: 'done' } })).toBe('lights_out_done');
    const seen = ['intro', 'bookkeeper', 'lights_out_done'] as const;
    expect(nextScene({ seen, solved: 3, chapters: { ch1: 'done' } })).toBeNull();
    expect(nextScene({ seen, solved: 3, chapters: { ch1: 'done', ch2: 'gathering' } })).toBe('ch2_start');
    expect(nextScene({ seen: [...seen, 'ch2_start'], solved: 3, chapters: { ch1: 'done', ch2: 'gathering' } })).toBeNull();
    expect(nextScene({ seen: [...seen, 'ch2_start'], solved: 3, chapters: { ch1: 'done', ch2: 'ready' } })).toBe('ch2_ready');
    expect(nextScene({ seen: [...seen, 'ch2_start', 'ch2_ready'], solved: 3, chapters: { ch1: 'done', ch2: 'done' } })).toBe('ch2_done');
  });

  it('every scene has lines, and the store remembers what was seen (saved)', () => {
    for (const lines of Object.values(SCENES)) expect(lines.length).toBeGreaterThan(0);
    const store = new GameStore({ seedBase: 3 });
    store.markSeen('intro');
    store.markSeen('intro');
    expect(store.toSave().seen).toEqual(['intro']);
  });

  it('a new game starts over but keeps nothing from before', () => {
    const store = new GameStore({ seedBase: 3, money: 500, day: 9, seen: ['intro'] });
    store.newGame(42);
    const s = store.getState();
    expect([s.money, s.day, s.seen.length, s.seedBase]).toEqual([0, 1, 0, 42]);
    expect(s.board.length).toBeGreaterThan(0);
  });
});
