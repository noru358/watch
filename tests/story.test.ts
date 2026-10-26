import { describe, expect, it } from 'vitest';
import { SCENES } from '../src/data/story.data';
import { nextScene } from '../src/systems/story';
import { GameStore } from '../src/store/gameStore';

describe('story: which scene plays in the office', () => {
  it('opens with the intro, once', () => {
    expect(nextScene({ seen: [], solved: 0, storyDone: [] })).toBe('intro');
    expect(nextScene({ seen: ['intro'], solved: 0, storyDone: [] })).toBeNull();
  });

  it('the bookkeeper arrives after the first solve; the story epilogue comes first if both are due', () => {
    expect(nextScene({ seen: ['intro'], solved: 1, storyDone: [] })).toBe('bookkeeper');
    expect(nextScene({ seen: ['intro'], solved: 1, storyDone: ['lights_out'] })).toBe('lights_out_done');
    expect(nextScene({ seen: ['intro', 'lights_out_done'], solved: 1, storyDone: ['lights_out'] })).toBe('bookkeeper');
    expect(nextScene({ seen: ['intro', 'lights_out_done', 'bookkeeper'], solved: 3, storyDone: ['lights_out'] })).toBeNull();
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
