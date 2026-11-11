import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { NODES } from '../src/data/nodes.data';
import { OFFICE } from '../src/data/office.data';
import { offerFee, offerFloors, offerLength, refillBoard, type ContractOffer, type OfficeState } from '../src/systems/office';
import { generateFloor } from '../src/systems/rift';
import { enterFloor, leaveFloor, runResult, saveAtCheckpoint, settleRun, startRun } from '../src/systems/run';
import { playNight, skilled } from './bots';
import { carry } from './helpers';

const offer = (patch: Partial<ContractOffer>): ContractOffer => ({
  id: 7, kind: 'general', node: 'alley', story: null, objective: 'clear', request: 'flicker', mods: [], target: null, pool: [...NODES.alley.pool],
  risk: 0, floors: 3, goalFloor: 2, fee: 0, shards: 0, deadline: 4, ...patch,
});
const office = (rank: number): OfficeState => ({ day: 1, money: 0, debt: 0, known: [], board: [], nextOfferId: 1, storyDone: [], wanted: [], chapters: {}, deskLevel: 0, reputation: 0, rankReached: rank });

describe('의뢰 길이 세 단계', () => {
  it('an old saved offer (no length) is short, and short floors are as before', () => {
    const o = offer({ floors: 4, goalFloor: 3 });
    expect(offerLength(o)).toBe('short');
    const plans = offerFloors(o);
    expect(plans.map((p) => (p.kind === 'normal' ? p.enemies : 0))).toEqual([5, 6, 7, 8]);
    expect(plans.some((p) => p.kind === 'normal' && (p.checkpoint || p.depth || p.affixChance || p.bonusShards))).toBe(false);
  });

  it('원정: mid-bosses every 5 floors with two words, a 귀환 지점 after each, shards at the end, rare gear from floor 10', () => {
    const o = offer({ length: 'long', floors: 17, goalFloor: 16 });
    const plans = offerFloors(o);
    const at = (i: number) => plans[i]!.kind === 'normal' ? (plans[i] as Extract<(typeof plans)[number], { kind: 'normal' }>) : null;
    for (const i of [4, 9, 14]) {
      expect(at(i)!.objective, `floor ${i + 1}`).toBe('bounty');
      expect(at(i)!.brief?.target?.affix).toBeDefined();
      expect(at(i)!.brief?.shards).toBe(OFFICE.lengths.long.midBossShards);
    }
    expect(at(4)!.brief?.drop).toBe('bounty');
    expect(at(9)!.brief?.drop).toBe('midboss');
    expect([5, 10, 15].every((i) => at(i)!.checkpoint && at(i)!.payphone)).toBe(true);
    expect(plans.filter((p) => p.kind === 'normal' && p.payphone).length).toBe(3);
    expect(at(16)!.bonusShards).toBe(OFFICE.lengths.long.endShards);
    expect(at(16)!.objective).toBe('clear');
    expect(at(10)!.affixChance).toBeGreaterThan(0);
    expect(at(5)!.affixChance).toBeUndefined();
    // A graded offer shows words from the first floor, more for a higher grade.
    const g1 = offerFloors({ ...offer({ floors: 3, goalFloor: 2 }), risk: 1 })[0]!;
    const g3 = offerFloors({ ...offer({ floors: 3, goalFloor: 2 }), risk: 3 })[0]!;
    expect(g1.kind === 'normal' && g1.affixChance).toBe(OFFICE.affixByGrade[1]);
    expect(g3.kind === 'normal' && g3.affixChance).toBe(OFFICE.affixByGrade[3]);
    expect(offerFee(o)).toBeGreaterThan(offerFee({ ...o, length: 'short' }) * 3);
  });

  it('보통: one 귀환 지점 in the middle, a shard at the end', () => {
    const plans = offerFloors(offer({ length: 'normal', floors: 7, goalFloor: 6 }));
    expect(plans.filter((p) => p.kind === 'normal' && p.checkpoint).length).toBe(1);
    expect((plans[3] as { checkpoint?: boolean }).checkpoint).toBe(true);
    expect((plans[6] as { bonusShards?: number }).bonusShards).toBe(1);
  });

  it('the board posts 원정 only from 평판 등급 2, never two at once', () => {
    const low = office(0);
    const high = office(4);
    for (let d = 0; d < 30; d++) {
      low.board = [];
      refillBoard(low, new SeededRNG(d));
      expect(low.board.some((o) => o.length === 'long')).toBe(false);
      high.board = [];
      refillBoard(high, new SeededRNG(d));
      expect(high.board.filter((o) => o.length === 'long').length).toBeLessThanOrEqual(1);
    }
    const all = Array.from({ length: 40 }, (_, d) => {
      high.board = [];
      refillBoard(high, new SeededRNG(100 + d));
      return high.board;
    }).flat();
    expect(all.some((o) => o.length === 'long')).toBe(true);
    expect(all.some((o) => o.length === 'normal')).toBe(true);
    for (const o of all.filter((x) => x.length !== 'short')) expect(o.goalFloor).toBe(o.floors - 1);
  });

  it('deep floors are richer and some strong ghosts carry a word', () => {
    const base = { kind: 'normal', enemies: 8, pool: ['dalgyal'], payphone: false, swarm: null, objective: 'clear', goal: false, theme: 'lot' } as const;
    const shallow = generateFloor(0, base, new SeededRNG(3), carry());
    const deep = generateFloor(0, { ...base, depth: 12, affixChance: 1, bonusShards: 2 }, new SeededRNG(3), carry());
    const sum = (f: typeof deep) => f.pickups.filter((p) => !p.shard).reduce((n, p) => n + p.value, 0);
    expect(sum(deep)).toBeGreaterThan(sum(shallow));
    expect(deep.pickups.filter((p) => p.shard).length).toBe(2);
    const changed = deep.enemies.filter((e, i) => e.maxHp !== shallow.enemies[i]?.maxHp || e.damageAdd !== shallow.enemies[i]?.damageAdd || e.traits.length > 0 || e.speedMult !== 1 || e.windupMult !== 1 || e.reachMult !== 1);
    expect(changed.length).toBeGreaterThan(0);
  });

  it('a 귀환 지점 keeps what it saved when the director falls later', () => {
    const run = startRun({ offerId: 7, floors: offerFloors(offer({ length: 'normal', floors: 6, goalFloor: 5 })), fee: 500, weapon: 'newspaper_sword' });
    const rng = new SeededRNG(1);
    const f = enterFloor(run, rng);
    f.loot = 200;
    f.shards = 1;
    f.drops.push('bounty');
    saveAtCheckpoint(run, f);
    f.loot = 300;
    f.status = 'dead';
    leaveFloor(run, f);
    const result = runResult(run);
    expect(result.drops).toEqual(['bounty']);
    const s = settleRun(result, 1000);
    expect(s.lootKept).toBe(200 + 50); // saved 200 whole + half of the 100 after
    expect(s.shards).toBe(1);
  });

  it('a reading bot can play a 보통 contract through', () => {
    const o = offer({ length: 'normal', floors: 6, goalFloor: 5, pool: ['cheonyeo', 'dalgyal'] });
    const runs = [1, 2, 3, 4].map((seed) => playNight(seed, skilled, { offerId: o.id, floors: offerFloors(o), fee: 100, weapon: 'newspaper_sword' }));
    expect(runs.filter((r) => r.outcome === 'success').length, JSON.stringify(runs)).toBeGreaterThanOrEqual(2);
  }, 120000);
});
