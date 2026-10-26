import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import type { FloorPlan } from '../src/data/contracts.data';
import { OBJECTIVES } from '../src/data/objectives.data';
import { generateFloor, NO_INPUT, stairsOpen, stepFloor, survivorOf, type Floor } from '../src/systems/rift';
import { enterFloor, finishAtGoal, goalReached, leaveFloor, runResult, settleRun, startRun } from '../src/systems/run';
import { carry, DT } from './helpers';

const rescuePlan = { kind: 'normal', enemies: 4, pool: ['cheonyeo', 'dalgyal'], payphone: false, swarm: null, objective: 'rescue', goal: true, theme: 'arcade' } as const;
const clearPlan = { ...rescuePlan, objective: 'clear', goal: false } as const;

function rescueFloor(seed = 5): { f: Floor; rng: SeededRNG } {
  const rng = new SeededRNG(seed);
  const f = generateFloor(0, rescuePlan, rng, carry());
  f.enemies.forEach((e) => Object.assign(e, { x: 1.5, y: 1.5, state: 'idle' })); // out of the way
  return { f, rng };
}

const moveTo = (f: Floor, p: { x: number; y: number }) => Object.assign(f.player, { x: p.x, y: p.y, prevX: p.x, prevY: p.y });

describe('objectives: rescue', () => {
  it('places a hidden survivor in a side room and keeps the stairs shut until they are found', () => {
    const { f, rng } = rescueFloor();
    const s = survivorOf(f)!;
    expect(s.state).toBe('hidden');
    expect(stairsOpen(f)).toBe(false);
    moveTo(f, f.stairs!);
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.status).toBe('playing');
  });

  it('walking up to them makes them follow; bringing them to the stairs completes the goal', () => {
    const { f, rng } = rescueFloor();
    const s = survivorOf(f)!;
    moveTo(f, s);
    stepFloor(f, NO_INPUT, DT, rng);
    expect(s.state).toBe('following');
    expect(stairsOpen(f)).toBe(true);
    moveTo(f, f.stairs!);
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.status).toBe('stairs');
    expect(f.objective?.done).toBe(true);
  });

  it('they follow the director through the floor instead of standing still', () => {
    const { f, rng } = rescueFloor(8);
    const s = survivorOf(f)!;
    moveTo(f, s);
    stepFloor(f, NO_INPUT, DT, rng);
    const start = { x: s.x, y: s.y };
    for (let i = 0; i < 120; i++) stepFloor(f, { ...NO_INPUT, moveX: 1 }, DT, rng);
    expect(Math.hypot(s.x - start.x, s.y - start.y)).toBeGreaterThan(1);
    expect(Math.hypot(s.x - f.player.x, s.y - f.player.y)).toBeLessThan(3);
  });

  it('left alone too long, fear fills and the night fails', () => {
    const { f, rng } = rescueFloor();
    const seconds = 1 / OBJECTIVES.rescue.fearPerSecond + 1;
    for (let i = 0; i < seconds / DT && f.status === 'playing'; i++) stepFloor(f, NO_INPUT, DT, rng);
    expect(f.status).toBe('failed');
  });

  it('cries now and then while hidden (the HUD uses it to point the way)', () => {
    const { f, rng } = rescueFloor();
    let cries = 0;
    for (let i = 0; i < (OBJECTIVES.rescue.cryEvery * 2) / DT; i++) {
      stepFloor(f, NO_INPUT, DT, rng);
      cries += f.events.filter((e) => e.type === 'survivorCry').length;
      f.events = [];
    }
    expect(cries).toBeGreaterThanOrEqual(1);
  });
});

describe('objectives: goal floor and going home early', () => {
  const floors: FloorPlan[] = [clearPlan, rescuePlan, clearPlan];

  it('a finished goal before the last floor offers to end the night with the fee', () => {
    const run = startRun({ offerId: 1, floors, fee: 200, weapon: 'newspaper_sword' });
    run.floorIndex = 1;
    const { f } = rescueFloor();
    f.status = 'stairs';
    expect(goalReached(run, f)).toBe(false); // got to the stairs without the person
    f.objective!.done = true;
    expect(goalReached(run, f)).toBe(true);
    f.loot = 40;
    expect(finishAtGoal(run, f)).toBe('success');
    expect(runResult(run)).toMatchObject({ outcome: 'success', fee: 200, loot: 40 });
  });

  it('keeping going simply moves to the next floor', () => {
    const run = startRun({ offerId: 1, floors, fee: 200, weapon: 'newspaper_sword' });
    run.floorIndex = 1;
    const { f } = rescueFloor();
    f.status = 'stairs';
    expect(leaveFloor(run, f)).toBeNull();
    expect(run.floorIndex).toBe(2);
  });

  it('a lost objective is a failed night: no fee, loot kept, trauma', () => {
    const run = startRun({ offerId: 1, floors, fee: 200, weapon: 'newspaper_sword' });
    const { f } = rescueFloor();
    f.status = 'failed';
    f.loot = 30;
    expect(leaveFloor(run, f)).toBe('failed');
    const s = settleRun(runResult(run), 0);
    expect(s).toMatchObject({ fee: 0, lootKept: 30, traumaDelta: 1 });
  });
});

// ---- 2026-10-27: 현상수배 · 추격 · 결계 · 첫차까지, 현장 변형, deep floors ----
import { GHOSTS } from '../src/data/ghosts.data';
import { MODIFIERS } from '../src/data/modifiers.data';
import { DEEP } from '../src/data/objectives.data';
import { DUNGEON } from '../src/data/dungeon.data';
import type { ObjectiveKind } from '../src/types/ids';

const target = { ghost: 'dalgyal' as const, level: 0 };
const planOf = (objective: ObjectiveKind, extra: Partial<Extract<FloorPlan, { kind: 'normal' }>> = {}) =>
  ({ ...clearPlan, objective, goal: true, brief: { target, shards: 1, time: 30 }, ...extra }) as Extract<FloorPlan, { kind: 'normal' }>;
const calm = (f: Floor) => f.enemies.forEach((e) => e.role === 'normal' && Object.assign(e, { x: 1.5, y: 1.5, state: 'idle', hp: 0 }));

describe('objectives: 현상수배', () => {
  it('a named elite stands in a side room; downing it opens the stairs and pays its shards', () => {
    const rng = new SeededRNG(7);
    const f = generateFloor(0, planOf('bounty'), rng, carry());
    const e = f.enemies.find((x) => x.role === 'bounty')!;
    expect(e.maxHp).toBe(GHOSTS.dalgyal.hp * OBJECTIVES.bounty.hpMult);
    expect(e.damageAdd).toBe(OBJECTIVES.bounty.damageAdd);
    expect(stairsOpen(f)).toBe(false);
    e.hp = 0;
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.objective?.done).toBe(true);
    expect(stairsOpen(f)).toBe(true);
    expect(f.shards).toBe(1);
  });

  it('a higher level is tougher', () => {
    const f = generateFloor(0, planOf('bounty', { brief: { target: { ghost: 'dalgyal', level: 2 }, shards: 3, time: 0 } }), new SeededRNG(7), carry());
    expect(f.enemies.find((x) => x.role === 'bounty')!.maxHp).toBe(GHOSTS.dalgyal.hp * (OBJECTIVES.bounty.hpMult + 2 * OBJECTIVES.bounty.hpPerLevel));
  });
});

describe('objectives: 추격', () => {
  it('the quarry bolts at a threshold: the stairs open, the run carries its HP to a nest where it sleeps and heals', () => {
    const floors = [planOf('chase'), planOf('chase'), planOf('chase')];
    const run = startRun({ offerId: 1, floors, fee: 100, weapon: 'newspaper_sword' });
    const rng = new SeededRNG(3);
    let f = enterFloor(run, rng);
    const q = f.enemies.find((x) => x.role === 'quarry')!;
    q.hp = q.maxHp * OBJECTIVES.chase.fleeAt[0]! - 1;
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.objective?.kind === 'chase' && f.objective.fled).toBe(true);
    expect(stairsOpen(f)).toBe(true);
    f.status = 'stairs';
    expect(goalReached(run, f)).toBe(false);
    expect(leaveFloor(run, f)).toBeNull();
    expect(run.quarry?.stage).toBe(1);
    f = enterFloor(run, rng);
    const q2 = f.enemies.find((x) => x.role === 'quarry')!;
    expect(q2.asleep).toBe(true);
    const hp = q2.hp;
    moveTo(f, { x: q2.x + 10, y: q2.y });
    for (let i = 0; i < 60; i++) stepFloor(f, NO_INPUT, DT, rng);
    expect(q2.hp).toBeGreaterThan(hp);
  });

  it('getting away on the last floor fails the night; catching it finishes the goal', () => {
    const rng = new SeededRNG(3);
    const last = generateFloor(0, planOf('chase'), rng, { ...carry(), last: true });
    const q = last.enemies.find((x) => x.role === 'quarry')!;
    q.hp = 1;
    stepFloor(last, NO_INPUT, DT, rng);
    expect(last.status).toBe('failed');
    const f = generateFloor(0, planOf('chase'), new SeededRNG(3), { ...carry(), quarry: { hp: 5, maxHp: 50, stage: 2, caught: false } });
    f.enemies.find((x) => x.role === 'quarry')!.hp = 0;
    stepFloor(f, NO_INPUT, DT, new SeededRNG(1));
    expect(f.objective?.done).toBe(true);
    expect(f.shards).toBe(1);
  });
});

describe('objectives: 결계', () => {
  it('standing in a circle fills it, walking out drains it; all three up opens the stairs', () => {
    const rng = new SeededRNG(9);
    const f = generateFloor(0, planOf('ward'), rng, carry());
    calm(f);
    f.player.iframes = 999;
    const o = f.objective!;
    if (o.kind !== 'ward') throw new Error('ward');
    expect(o.sites).toHaveLength(OBJECTIVES.ward.sites);
    moveTo(f, o.sites[0]!);
    for (let i = 0; i < 60 * 3; i++) stepFloor(f, NO_INPUT, DT, rng);
    const part = o.sites[0]!.progress;
    expect(part).toBeGreaterThan(0.2);
    expect(o.charging).toBe(true);
    moveTo(f, { x: o.sites[0]!.x + 6, y: o.sites[0]!.y });
    for (let i = 0; i < 60; i++) stepFloor(f, NO_INPUT, DT, rng);
    expect(o.sites[0]!.progress).toBeLessThan(part);
    for (const s of o.sites) s.progress = 1;
    stepFloor(f, NO_INPUT, DT, rng);
    expect(o.done).toBe(true);
    expect(stairsOpen(f)).toBe(true);
  });
});

describe('objectives: 첫차까지', () => {
  it('the stairs open when the time is up; ghosts keep walking in meanwhile', () => {
    const rng = new SeededRNG(4);
    const f = generateFloor(0, planOf('firsttrain', { enemies: 0, swarm: null }), rng, carry());
    f.player.iframes = 9999;
    expect(stairsOpen(f)).toBe(false);
    for (let i = 0; i < 60 * (OBJECTIVES.firsttrain.spawnEvery + 0.5); i++) stepFloor(f, NO_INPUT, DT, rng);
    expect(f.enemies.length).toBeGreaterThan(0);
    for (let i = 0; i < 60 * 20; i++) stepFloor(f, NO_INPUT, DT, rng);
    expect(f.objective?.done).toBe(true);
  });
});

describe('현장 변형 and deep floors', () => {
  it('괴이 소굴: a sleeping pack that does not count for 섬멸; walking in seals the doors until it is down', () => {
    let f: Floor | null = null;
    let rng = new SeededRNG(1);
    for (let seed = 1; seed < 30 && !f?.lair; seed++) {
      rng = new SeededRNG(seed);
      f = generateFloor(0, { ...clearPlan, mods: ['lair'] }, rng, carry());
    }
    const l = f!.lair!;
    const pack = f!.enemies.filter((e) => e.role === 'lair');
    expect(pack).toHaveLength(MODIFIERS.lair.lair!.pack);
    expect(pack.every((e) => e.asleep)).toBe(true);
    f!.enemies.filter((e) => e.role === 'normal').forEach((e) => (e.hp = 0));
    f!.player.iframes = 999;
    stepFloor(f!, NO_INPUT, DT, rng);
    expect(f!.objective?.done).toBe(true); // 섬멸 is done with the nest still asleep
    moveTo(f!, { x: l.room.x + l.room.w / 2, y: l.room.y + l.room.h / 2 });
    stepFloor(f!, NO_INPUT, DT, rng);
    expect(l.locked).toBe(true);
    for (const i of l.doors) expect(f!.tiles[i]).toBe('wall');
    f!.enemies.filter((e) => e.role === 'lair').forEach((e) => (e.hp = 0));
    stepFloor(f!, NO_INPUT, DT, rng);
    expect(l.cleared).toBe(true);
    for (const i of l.doors) expect(f!.tiles[i]).toBe('floor');
    expect(f!.pickups.filter((k) => k.value === MODIFIERS.lair.lair!.treasureValue).length).toBe(MODIFIERS.lair.lair!.treasure);
  });

  it('정전 darkens the whole floor', () => {
    const f = generateFloor(0, { ...clearPlan, mods: ['blackout'] }, new SeededRNG(2), carry());
    expect(f.vision).toBe(MODIFIERS.blackout.vision);
  });

  it('a deep last floor is richer and hides a 심연 파편', () => {
    const f = generateFloor(2, { ...clearPlan, deep: 2 }, new SeededRNG(2), { ...carry(), last: true });
    expect(f.pickups.some((k) => k.shard)).toBe(true);
    expect(Math.max(...f.pickups.map((k) => k.value))).toBe(Math.round(DUNGEON.treasureValue * (1 + DEEP.lootPerFloor * 2)));
  });

  it('a plain 섬멸 floor is unchanged by the new code paths (main-story maps stay the same)', () => {
    const a = generateFloor(0, clearPlan, new SeededRNG(11), carry());
    const b = generateFloor(0, { ...clearPlan, mods: [], deep: 0 }, new SeededRNG(11), carry());
    expect(b.tiles).toEqual(a.tiles);
    expect(b.enemies.map((e) => [e.x, e.y])).toEqual(a.enemies.map((e) => [e.x, e.y]));
  });
});

describe('현장 변형 (2026-10-27 batch): each one changes what its card says', () => {
  const on = (mods: Extract<FloorPlan, { kind: 'normal' }>['mods']) => generateFloor(0, { ...clearPlan, enemies: 3, mods }, new SeededRNG(5), carry());
  const plain = on([]);

  it('질긴 놈들 / 독한 원한 / 성급한 귀신 change the ghosts', () => {
    const tough = on(['tough']).enemies[0]!;
    expect(tough.maxHp).toBe(Math.round(plain.enemies[0]!.maxHp * MODIFIERS.tough.enemy!.hpMult!));
    expect(on(['lethal']).enemies[0]!.damageAdd).toBe(1);
    const fast = on(['haste']).enemies[0]!;
    expect(fast.speedMult).toBeCloseTo(1.2, 5);
    expect(fast.windupMult).toBeCloseTo(0.85, 5);
  });

  it('사무치는 원한: a ghost left alone heals', () => {
    const f = on(['regen']);
    const e = f.enemies[0]!;
    e.hp = 1;
    e.state = 'idle';
    f.player.iframes = 99;
    for (let i = 0; i < 60 * 5; i++) stepFloor(f, NO_INPUT, DT, new SeededRNG(1));
    expect(e.hp).toBeGreaterThan(1);
  });

  it('탁한 공기 halves healing; 맑은 밤 and 약점 노출 boost the director on this floor only', () => {
    expect(on(['lesshealing']).mods.healMult).toBe(0.5);
    expect(on(['clearnight']).stats.moveSpeed).toBeCloseTo(plain.stats.moveSpeed * 1.15, 5);
    expect(on(['weakspot']).stats.draw).toBeCloseTo(plain.stats.draw * 1.3, 5);
  });

  it('영력 풍년 makes floor spirit worth more', () => {
    const rich = on(['windfall']);
    expect(Math.max(...rich.pickups.map((k) => k.value))).toBe(Math.round(DUNGEON.treasureValue * 1.5));
  });
});
