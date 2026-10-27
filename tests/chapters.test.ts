import { describe, expect, it } from 'vitest';
import { migrate, SAVE_VERSION } from '../src/core/SaveManager';
import { SeededRNG } from '../src/core/SeededRNG';
import { CHAPTERS } from '../src/data/chapters.data';
import { NODES } from '../src/data/nodes.data';
import { chapterStatus, offerFloors, refillBoard, resolveNight, startingContamination, type ContractOffer, type OfficeState } from '../src/systems/office';

import type { NodeId } from '../src/types/ids';

// 메인 스토리 장 (docs/rules/story.md): ch1 opens at once; the next opens N days after the last one
// ends (or sooner when its districts get hot), gathers clues from general successes in its
// districts, then posts its main contract.

function fresh(day = 1): OfficeState {
  const s: OfficeState = { day, money: 0, debt: 0, contamination: startingContamination(), known: [], board: [], nextOfferId: 1, storyDone: [], wanted: [], chapters: {}, deskLevel: 0, reputation: 0, rankReached: 0 };
  refillBoard(s, new SeededRNG(5));
  return s;
}
const general = (s: OfficeState, node: NodeId): ContractOffer => {
  const o: ContractOffer = {
    id: s.nextOfferId++, kind: 'general', node, story: null, objective: 'clear', request: 'flicker', mods: [], target: null, pool: [...NODES[node].pool],
    risk: 1, floors: 2, goalFloor: 1, fee: 100, shards: 0, deadline: s.day + 3,
  };
  s.board.push(o);
  return o;
};
const finishCh1 = (s: OfficeState) => {
  const main = s.board.find((o) => o.story === 'lights_out')!;
  resolveNight(s, main.id, true);
};

describe('main story chapters', () => {
  it('chapter 1 is open from day one, its contract on the board', () => {
    const s = fresh();
    expect(chapterStatus(s, 'ch1')).toBe('ready');
    expect(s.board.some((o) => o.story === 'lights_out')).toBe(true);
    expect(chapterStatus(s, 'ch2')).toBe('locked');
  });

  it('chapter 2 starts a few days after chapter 1, even if nothing gets hot', () => {
    const s = fresh();
    finishCh1(s);
    expect(chapterStatus(s, 'ch1')).toBe('done');
    s.day += CHAPTERS.ch2.startAfterDays - 1;
    refillBoard(s, new SeededRNG(1));
    expect(chapterStatus(s, 'ch2')).toBe('locked');
    s.day += 1;
    refillBoard(s, new SeededRNG(1));
    expect(chapterStatus(s, 'ch2')).toBe('gathering');
  });

  it('…or at once, when one of its districts is hot enough', () => {
    const s = fresh();
    finishCh1(s);
    s.contamination.station = CHAPTERS.ch2.startHeat;
    refillBoard(s, new SeededRNG(1));
    expect(chapterStatus(s, 'ch2')).toBe('gathering');
  });

  it('never before the chapter before it is done', () => {
    const s = fresh(30);
    s.contamination.station = 4;
    refillBoard(s, new SeededRNG(1));
    expect(chapterStatus(s, 'ch2')).toBe('locked');
  });

  it('general successes in its districts are clues; elsewhere or failed are not; then the contract is posted', () => {
    const s = fresh();
    finishCh1(s);
    s.day += CHAPTERS.ch2.startAfterDays;
    refillBoard(s, new SeededRNG(1));
    expect(resolveNight(s, general(s, 'alley').id, true).clue).toBeNull();
    expect(resolveNight(s, general(s, 'station').id, false).clue).toBeNull();
    for (let i = 1; i <= CHAPTERS.ch2.clues; i++) {
      const node = CHAPTERS.ch2.clueNodes[i % CHAPTERS.ch2.clueNodes.length]!;
      expect(resolveNight(s, general(s, node).id, true).clue).toEqual({ chapter: 'ch2', have: i, need: CHAPTERS.ch2.clues });
    }
    expect(chapterStatus(s, 'ch2')).toBe('ready');
    expect(resolveNight(s, general(s, 'station').id, true).clue).toBeNull();
    refillBoard(s, new SeededRNG(1));
    const main = s.board.find((o) => o.story === 'last_line')!;
    expect(main.kind).toBe('main');
    const last = offerFloors(main).at(-1)!;
    expect(last.kind === 'normal' && last.objective).toBe('bounty');
    resolveNight(s, main.id, true);
    expect(chapterStatus(s, 'ch2')).toBe('done');
  });
});

describe('save v5', () => {
  it('a v4 save gets chapter 1 under way, or done if its contract was finished', () => {
    const base = {
      schemaVersion: 4, money: 50, trauma: 0, solved: 2, seedBase: 4, runCounter: 3, day: 7, debt: 0, contamination: null, known: [], board: [], nextOfferId: 2,
      seen: ['intro'], shards: 0, training: {}, trainingBought: 0, facilities: { desk: 0, bench: 0, sofa: 0 }, supply: null, passives: {}, actives: [], active: null, wanted: [],
    };
    const open = migrate({ ...base, storyDone: [] })!;
    expect(open.schemaVersion).toBe(SAVE_VERSION);
    expect(open.chapters).toEqual({ ch1: { started: 1, clues: 0, done: null } });
    const done = migrate({ ...base, storyDone: ['lights_out'] })!;
    expect(done.chapters.ch1?.done).toBe(7);
  });
});

describe('chapter 2 contract is playable', () => {
  it('a reading bot finishes 막차 most nights, a careless one does not', async () => {
    const { playNight, skilled, naive } = await import('./bots');
    const { CONTRACTS } = await import('../src/data/contracts.data');
    const setup = { offerId: 0, floors: CONTRACTS.last_line.floors, fee: CONTRACTS.last_line.fee, weapon: 'newspaper_sword' } as const;
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
    const good = seeds.map((s) => playNight(s, skilled, setup));
    const bad = seeds.map((s) => playNight(s, naive, setup));
    expect(good.filter((r) => r.outcome === 'success').length).toBeGreaterThanOrEqual(5);
    expect(bad.filter((r) => r.outcome === 'success').length).toBeLessThanOrEqual(1);
  }, 120000);
});
