import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import type { FloorPlan } from '../src/data/contracts.data';
import { OBJECTIVES } from '../src/data/objectives.data';
import { generateFloor, NO_INPUT, stairsOpen, stepFloor, survivorOf, type Floor } from '../src/systems/rift';
import { finishAtGoal, goalReached, leaveFloor, runResult, settleRun, startRun } from '../src/systems/run';
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
    const run = startRun({ offerId: 1, floors, fee: 200, level: 1, weapon: 'newspaper_sword' });
    run.floorIndex = 1;
    const { f } = rescueFloor();
    f.status = 'stairs';
    expect(goalReached(run, f)).toBe(true);
    f.loot = 40;
    expect(finishAtGoal(run, f)).toBe('success');
    expect(runResult(run)).toMatchObject({ outcome: 'success', fee: 200, loot: 40 });
  });

  it('keeping going simply moves to the next floor', () => {
    const run = startRun({ offerId: 1, floors, fee: 200, level: 1, weapon: 'newspaper_sword' });
    run.floorIndex = 1;
    const { f } = rescueFloor();
    f.status = 'stairs';
    expect(leaveFloor(run, f)).toBeNull();
    expect(run.floorIndex).toBe(2);
  });

  it('a lost objective is a failed night: no fee, loot kept, trauma', () => {
    const run = startRun({ offerId: 1, floors, fee: 200, level: 1, weapon: 'newspaper_sword' });
    const { f } = rescueFloor();
    f.status = 'failed';
    f.loot = 30;
    expect(leaveFloor(run, f)).toBe('failed');
    const s = settleRun(runResult(run), 0);
    expect(s).toMatchObject({ fee: 0, lootKept: 30, traumaDelta: 1 });
  });
});
