import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { NODES } from '../src/data/nodes.data';
import { OFFICE } from '../src/data/office.data';
import { REPUTATION } from '../src/data/reputation.data';
import { advanceDay, offerDifficulty, overflowTargets, refillBoard, resolveNight, startingContamination, type OfficeState } from '../src/systems/office';

// 번짐 개편 (docs/rules/office.md "오염"): no random rise or spread; a district at the top posts a
// 긴급 의뢰, and missing it spills into its open neighbours.
const O = OFFICE.contamination.overflow;
const office = (patch: Partial<OfficeState> = {}): OfficeState => ({
  day: 1, money: 0, debt: 0, contamination: startingContamination(), known: [], board: [], nextOfferId: 1, storyDone: [], wanted: [], chapters: {}, deskLevel: 0, reputation: 50, rankReached: 0, ...patch,
});

describe('넘침', () => {
  it('nothing rises by itself: with every offer taken care of, the city stays as it is', () => {
    const s = office();
    const before = { ...s.contamination };
    for (let d = 0; d < 20; d++) {
      s.board = [];
      advanceDay(s, new SeededRNG(d + 1));
    }
    expect(s.contamination).toEqual(before);
  });

  it('a district at the top posts one 긴급 의뢰 on top of the board, short and better paid', () => {
    const s = office();
    s.contamination.station = O.at;
    refillBoard(s, new SeededRNG(4));
    const urgent = s.board.filter((o) => o.urgent);
    expect(urgent).toHaveLength(1);
    expect(urgent[0]!.node).toBe('station');
    expect(urgent[0]!.deadline).toBe(s.day + O.days - 1);
    expect(s.board.filter((o) => o.kind === 'general' && !o.urgent)).toHaveLength(OFFICE.boardSize);
    refillBoard(s, new SeededRNG(5));
    expect(s.board.filter((o) => o.urgent)).toHaveLength(1);
  });

  it('missing it spills +1 into each open neighbour and costs 평판', () => {
    const s = office({ contamination: { ...startingContamination(), station: O.at } });
    refillBoard(s, new SeededRNG(4));
    const targets = overflowTargets(s, 'station');
    expect(targets.length).toBeGreaterThan(0);
    for (const n of targets) expect(NODES.station.links).toContain(n);
    expect(targets).not.toContain('motel'); // locked at rank 0
    const before = { ...s.contamination };
    let report = advanceDay(s, new SeededRNG(5));
    for (let d = 1; d < O.days && report.overflowed.length === 0; d++) report = advanceDay(s, new SeededRNG(6 + d));
    expect(report.overflowed).toEqual(['station']);
    for (const n of targets) expect(s.contamination[n]).toBeGreaterThanOrEqual(before[n] + O.rise);
    expect(s.reputation).toBeLessThan(50);
  });

  it('finishing it pays 평판 × 1.5', () => {
    const s = office({ contamination: { ...startingContamination(), station: O.at } });
    refillBoard(s, new SeededRNG(4));
    const u = s.board.find((o) => o.urgent)!;
    const want = Math.round((offerDifficulty(u) * REPUTATION.perDifficulty + REPUTATION.hotBonus) * O.repMult);
    expect(resolveNight(s, { offers: [u.id], completed: [u.id], reached: [u.id] }).reputation).toBe(want);
  });

  it('a night lost on a district makes it worse; one never reached does not', () => {
    const s = office();
    refillBoard(s, new SeededRNG(2));
    const [a, b] = s.board.filter((o) => o.kind === 'general');
    const ca = s.contamination[a!.node];
    resolveNight(s, { offers: [a!.id], completed: [], reached: [a!.id], outcome: 'died' });
    expect(s.contamination[a!.node]).toBe(Math.min(OFFICE.contamination.max, ca + OFFICE.contamination.failRise));
    const cb = s.contamination[b!.node];
    resolveNight(s, { offers: [b!.id], completed: [], reached: [], outcome: 'extracted' });
    expect(s.contamination[b!.node]).toBe(cb);
  });
});
