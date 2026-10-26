import { describe, expect, it } from 'vitest';
import type { SeededRNG } from '../src/core/SeededRNG';
import { GHOSTS } from '../src/data/ghosts.data';
import { ACTIVES, PASSIVES } from '../src/data/skills.data';
import { SUPPLIES } from '../src/data/facilities.data';
import { WEAPONS } from '../src/data/weapons.data';
import { makeEnemy, NO_INPUT, stepFloor, type Floor, type RiftInput } from '../src/systems/rift';
import { DT, duel } from './helpers';

// Every passive skill, active skill and supply actually does what its card says (2026-10-27 check).
const W = WEAPONS.newspaper_sword;
const run = (f: Floor, rng: SeededRNG, seconds: number, input: Partial<RiftInput> = {}) => {
  for (let i = 0; i < Math.round(seconds / DT); i++) stepFloor(f, { ...NO_INPUT, ...input }, DT, rng);
};
const freeze = (e: { state: string; timer: number; warpTimer: number }) => Object.assign(e, { state: 'stun', timer: 99, warpTimer: 999 });

// Waits for the ghost's next melee telegraph to be inside the parry window, then presses 발도.
function counterOnce(f: Floor, rng: SeededRNG): void {
  for (let i = 0; i < 600; i++) {
    const t = f.enemies.flatMap((e) => e.teles).find((x) => x.parriable && x.t <= W.parryWindow / 2);
    if (t) break;
    stepFloor(f, NO_INPUT, DT, rng);
  }
  stepFloor(f, { ...NO_INPUT, draw: true, aim: 0 }, DT, rng);
}

describe('passives: 검', () => {
  it('돌진 베기 cuts what is in front where the dash ends, whatever the mouse aims at', () => {
    const { f, rng, e, hp } = duel('dalgyal', 4, [], { perks: ['dash_cut'] });
    freeze(e);
    run(f, rng, DT, { dash: true, moveX: 1, aim: Math.PI });
    run(f, rng, 0.3, { aim: Math.PI });
    expect(e.hp).toBeLessThan(hp);
    const { f: f2, rng: r2, e: e2, hp: hp2 } = duel('dalgyal', 4);
    freeze(e2);
    run(f2, r2, DT, { dash: true, moveX: 1 });
    run(f2, r2, 0.3);
    expect(e2.hp).toBe(hp2);
  });

  it('3타 파문 also cuts behind on the finisher, at half damage', () => {
    const { f, rng, e } = duel('dalgyal', 1.2, [], { perks: ['finisher_wave'] });
    freeze(e);
    e.hp = 999;
    const behind = makeEnemy(f, 'dalgyal', { x: 10.5 - 1.5, y: 10.5 });
    freeze(behind);
    for (let i = 0; i < W.comboEvery; i++) {
      stepFloor(f, { ...NO_INPUT, attack: true, aim: 0 }, DT, rng);
      Object.assign(e, { x: 11.7, y: 10.5, knockX: 0, knockY: 0 });
      Object.assign(behind, { x: 9, y: 10.5, knockX: 0, knockY: 0 });
      run(f, rng, W.swingTime);
    }
    expect(behind.hp).toBe(GHOSTS.dalgyal.hp - (W.slash + W.comboBonus) * PASSIVES.finisher_wave.amount);
  });

  it('받아친 기세 adds focus on a counter', () => {
    const { f, rng } = duel('dalgyal', 1.2, [], { perks: ['counter_focus'] });
    counterOnce(f, rng);
    expect(f.player.drawKind).toBe('counter');
    expect(f.player.focus).toBe(PASSIVES.counter_focus.amount);
  });

  it('칼집 소리: a plain 발도 freezes what it cuts', () => {
    const { f, rng, e } = duel('dalgyal', 2, [], { perks: ['draw_stun'] });
    e.state = 'chase';
    stepFloor(f, { ...NO_INPUT, draw: true, aim: 0 }, DT, rng);
    run(f, rng, W.drawStartup + DT);
    expect(f.player.drawKind).toBe('slash');
    expect(e.state).toBe('stun');
  });

  it('남은 진심 leaves focus after a focus strike', () => {
    const { f, rng } = duel('dalgyal', 4, [], { perks: ['strike_refund'] });
    f.player.focus = f.stats.focusMax;
    stepFloor(f, { ...NO_INPUT, draw: true }, DT, rng);
    expect(f.player.drawKind).toBe('strike');
    expect(f.player.focus).toBe(PASSIVES.strike_refund.amount);
  });

  it('벗겨진 신문 keeps the blade bare longer while it keeps hitting', () => {
    const { f, rng, e } = duel('dalgyal', 1.2, [], { perks: ['bare_extend'] });
    freeze(e);
    e.hp = 999;
    f.player.bare = 1;
    stepFloor(f, { ...NO_INPUT, attack: true, aim: 0 }, DT, rng);
    expect(f.player.bare).toBeGreaterThan(1);
  });
});

describe('passives: 발', () => {
  it('소금 자국 leaves salt along the dash that burns wisps', () => {
    const { f, rng } = duel('dalgyal', 8, [], { perks: ['salt_trail'] });
    run(f, rng, DT, { dash: true, moveX: 1 });
    run(f, rng, 0.2);
    expect(f.zones.filter((z) => z.kind === 'salt').length).toBeGreaterThan(1);
    const z = f.zones[0]!;
    const wisp = makeEnemy(f, 'dokkaebibul', { x: z.x, y: z.y });
    stepFloor(f, NO_INPUT, DT, rng);
    expect(wisp.hp).toBeLessThanOrEqual(0);
  });

  it('되받아 빠지기 refills the dash on a counter', () => {
    const { f, rng } = duel('dalgyal', 1.2, [], { perks: ['counter_dash'] });
    f.player.dashCharges = 0;
    f.player.dashCd = 5;
    counterOnce(f, rng);
    expect(f.player.dashCharges).toBe(f.stats.dashCharges);
  });

  it('그림자 걸음: the whole dash is untouchable', () => {
    const { f } = duel('dalgyal', 4, [], { perks: ['shadow_step'] });
    expect(f.stats.dashIframes).toBe(f.stats.dashTime);
  });

  it('스치기: a hit that passes through the dash fills focus', () => {
    const { f, rng, e } = duel('dalgyal', 1.2, [], { perks: ['dodge_focus'] });
    e.state = 'chase';
    for (let i = 0; i < 600 && !e.teles.some((t) => t.t <= 0.05); i++) stepFloor(f, NO_INPUT, DT, rng);
    stepFloor(f, { ...NO_INPUT, dash: true, moveY: 0.01, moveX: 0 }, DT, rng);
    run(f, rng, 0.1);
    expect(f.player.focus).toBe(PASSIVES.dodge_focus.amount);
  });

  it('질주: after a second of running without attacking, the director is faster', () => {
    const plain = duel('dalgyal', 12);
    const fast = duel('dalgyal', 12, [], { perks: ['sprint'] });
    for (const d of [plain, fast]) {
      d.f.enemies = [];
      run(d.f, d.rng, 2, { moveY: 1 });
    }
    expect(fast.f.player.y - plain.f.player.y).toBeGreaterThan(0.3);
  });
});

describe('passives: 눈', () => {
  it('영력 눈 pulls spirit from twice as far', () => {
    const { f } = duel('dalgyal', 4, [], { perks: ['spirit_eye'] });
    const { f: plain } = duel('dalgyal', 4);
    expect(f.stats.magnet).toBeCloseTo(plain.stats.magnet * 2, 5);
  });

  it('숨 고르기 heals on the stairs when the floor went without a hit', () => {
    const { f, rng } = duel('dalgyal', 4, [], { perks: ['steady_breath'] });
    f.enemies = [];
    f.player.hp = 5;
    f.objective = null;
    Object.assign(f.player, { x: f.stairs!.x, y: f.stairs!.y });
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.status).toBe('stairs');
    expect(f.player.hp).toBe(5 + PASSIVES.steady_breath.amount);
  });

  it('원한 먹기 heals on a strong kill (not on wisps)', () => {
    const { f, rng, e } = duel('dalgyal', 1.2, [], { perks: ['grudge_eater'] });
    freeze(e);
    f.player.hp = 5;
    e.hp = 1;
    stepFloor(f, { ...NO_INPUT, attack: true, aim: 0 }, DT, rng);
    expect(f.player.hp).toBe(6);
  });

  it('욕심 drops extra spirit from strong ghosts', () => {
    const { f, rng, e } = duel('dalgyal', 1.2, [], { perks: ['greed'] });
    freeze(e);
    e.hp = 1;
    stepFloor(f, { ...NO_INPUT, attack: true, aim: 0 }, DT, rng);
    expect(f.pickups.map((k) => k.value)).toEqual(expect.arrayContaining([GHOSTS.dalgyal.drop, PASSIVES.greed.amount]));
  });
});

describe('actives and supplies', () => {
  it('결계 펴기: untouchable for its time and wisps in the circle burn', () => {
    const { f, rng } = duel('dalgyal', 6, [], { active: 'barrier' });
    run(f, rng, DT, { skill: true });
    expect(f.player.iframes).toBeGreaterThanOrEqual(ACTIVES.barrier.time - DT * 2);
    const wisp = makeEnemy(f, 'dokkaebibul', { x: f.player.x + 1, y: f.player.y });
    stepFloor(f, NO_INPUT, DT, rng);
    expect(wisp.hp).toBeLessThanOrEqual(0);
  });

  it('소금 한 봉: two blocked hits on the first floor', () => {
    const { f } = duel('dalgyal', 4, [], { perks: ['salt_pack'] });
    expect(f.player.shield).toBe(SUPPLIES.salt_pack.amount);
  });
});
