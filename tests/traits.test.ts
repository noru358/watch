import { describe, expect, it } from 'vitest';
import { GHOSTS } from '../src/data/ghosts.data';
import { hitEnemy, NO_INPUT, stepFloor } from '../src/systems/rift';
import { DT, duel } from './helpers';

const guardRow = GHOSTS.dokkaebi.traits.find((t) => t.part === 'guard')!;
const FRONT = { x: 1, y: 0 }; // the director stands to the left of the ghost, so a blow travels right
const BACK = { x: -1, y: 0 };

// The ghost stands to the right of the director, facing them.
function facing() {
  const d = duel('dokkaebi', 1.2);
  d.e.aim = Math.PI;
  return d;
}

describe('도깨비 guard (ghost trait)', () => {
  it('turns away a blow from the front and says so', () => {
    const { f, e, rng, hp } = facing();
    hitEnemy(f, e, 'slash', 5, false, FRONT, rng);
    expect(e.hp).toBe(hp);
    expect(f.events.some((ev) => ev.type === 'enemyBlocked')).toBe(true);
    expect(f.events.some((ev) => ev.type === 'enemyHit')).toBe(false);
  });

  it('takes a blow from behind', () => {
    const { f, e, rng, hp } = facing();
    hitEnemy(f, e, 'slash', 5, false, BACK, rng);
    expect(e.hp).toBe(hp - 5);
  });

  it('a 받아치기 breaks the guard: the blow lands and the ghost is stunned', () => {
    const { f, e, rng, hp } = facing();
    hitEnemy(f, e, 'draw', 5, true, FRONT, rng);
    expect(e.hp).toBe(hp - 5);
    expect(e.state).toBe('stun');
    expect(e.timer).toBeCloseTo(guardRow.breakStun);
    hitEnemy(f, e, 'slash', 2, false, FRONT, rng); // open while stunned
    expect(e.hp).toBe(hp - 7);
  });

  it('a plain 발도 from the front is turned away too', () => {
    const { f, e, rng, hp } = facing();
    hitEnemy(f, e, 'draw', 5, false, FRONT, rng);
    expect(e.hp).toBe(hp);
  });

  it('is open while it recovers from its own swing', () => {
    const { f, e, rng, hp } = facing();
    e.state = 'recover';
    e.timer = 1;
    hitEnemy(f, e, 'slash', 5, false, FRONT, rng);
    expect(e.hp).toBe(hp - 5);
  });

  it('turns toward the director no faster than its turn rate', () => {
    const { f, e, rng } = duel('dokkaebi', 4);
    e.aim = 0; // facing away
    for (let i = 0; i < 6; i++) stepFloor(f, NO_INPUT, DT, rng);
    const turned = Math.PI - Math.abs(Math.atan2(Math.sin(Math.PI - e.aim), Math.cos(Math.PI - e.aim)));
    expect(turned).toBeGreaterThan(0);
    expect(turned).toBeLessThanOrEqual(guardRow.turn * DT * 6 + 1e-6);
  });

  it('ghosts without traits are hit as before', () => {
    const { f, e, rng, hp } = duel('dalgyal', 1.2);
    hitEnemy(f, e, 'slash', 5, false, FRONT, rng);
    expect(e.hp).toBe(hp - 5);
  });
});

// ---- role ghosts (2026-11-11) ----
import { counterable, makeEnemy, type Floor } from '../src/systems/rift';
import type { SeededRNG } from '../src/core/SeededRNG';
import type { RiftInput } from '../src/systems/rift';

const row = <P extends string>(kind: keyof typeof GHOSTS, part: P) => GHOSTS[kind].traits.find((t) => t.part === part) as Extract<(typeof GHOSTS)[keyof typeof GHOSTS]['traits'][number], { part: P }>;
const run = (f: Floor, rng: SeededRNG, sec: number, input: RiftInput = NO_INPUT, until?: () => boolean) => {
  for (let i = 0; i < Math.round(sec / DT); i++) {
    stepFloor(f, input, DT, rng);
    if (until?.()) return true;
  }
  return false;
};

describe('grabber', () => {
  const t = row('grabber', 'grab');
  it('goes under, cannot be hit there, then marks the ground under the director', () => {
    const { f, e, rng, hp } = duel('grabber', 1.6);
    stepFloor(f, NO_INPUT, DT, rng);
    expect(e.state).toBe('warp');
    hitEnemy(f, e, 'slash', 5, false, FRONT, rng);
    expect(e.hp).toBe(hp);
    expect(run(f, rng, t.under + 0.2, NO_INPUT, () => e.state === 'windup')).toBe(true);
    const mark = e.teles[0]!;
    expect(mark.remote).toBe(true);
    expect(Math.hypot(mark.x - f.player.x, mark.y - f.player.y)).toBeLessThan(0.01);
  });

  it('a caught director cannot walk or dash for a while, swings free them sooner', () => {
    const { f, e, rng } = duel('grabber', 1.6);
    run(f, rng, t.under + 0.2, NO_INPUT, () => e.state === 'windup');
    run(f, rng, t.windup + 0.1, NO_INPUT, () => f.player.rooted > 0);
    expect(f.player.rooted).toBeGreaterThan(0);
    const x = f.player.x;
    run(f, rng, 0.2, { ...NO_INPUT, moveX: -1, dash: true });
    expect(f.player.x).toBeCloseTo(x, 5);
    const before = f.player.rooted;
    stepFloor(f, { ...NO_INPUT, attack: true }, DT, rng);
    expect(f.player.rooted).toBeLessThan(before - t.swingFree + 0.05);
  });

  it('can be countered from out of 발도 reach', () => {
    const { f, e, rng } = duel('grabber', 2.1);
    run(f, rng, t.under + 0.2, NO_INPUT, () => e.state === 'windup');
    e.teles[0]!.t = 0.05;
    expect(counterable(f)).toContain(e);
  });
});

describe('leaper', () => {
  const t = row('leaper', 'leap');
  it('keeps to its ring, then lands where the director stood', () => {
    const { f, e, rng } = duel('leaper', 5);
    e.vars.cd = 0;
    stepFloor(f, NO_INPUT, DT, rng);
    expect(e.state).toBe('windup');
    const mark = { x: e.teles[0]!.x, y: e.teles[0]!.y };
    run(f, rng, t.windup + 0.1, NO_INPUT, () => e.state !== 'windup');
    expect(Math.hypot(e.x - mark.x, e.y - mark.y)).toBeLessThan(0.01);
    expect(f.player.hp).toBeLessThan(EXP_HP(f));
  });
});
const EXP_HP = (f: Floor) => f.stats.maxHp;

describe('burster', () => {
  const t = row('burster', 'burst');
  it('stops next to the director and blows up, hurting ghosts too', () => {
    const { f, e, rng } = duel('burster', 1.0);
    const other = makeEnemy(f, 'dalgyal', { x: f.player.x + 1.2, y: f.player.y + 0.6 });
    other.state = 'stun';
    other.timer = 99;
    stepFloor(f, NO_INPUT, DT, rng);
    expect(e.state).toBe('windup');
    expect(e.teles[0]!.parriable).toBe(false);
    run(f, rng, t.fuse + 0.1, NO_INPUT, () => !f.enemies.includes(e));
    expect(f.enemies.includes(e)).toBe(false);
    expect(f.player.hp).toBeLessThan(f.stats.maxHp);
    expect(other.hp).toBeLessThan(other.maxHp);
  });

  it('killed, it still goes off a moment later', () => {
    const { f, e, rng } = duel('burster', 4);
    hitEnemy(f, e, 'slash', 99, false, FRONT, rng);
    expect(f.hazards).toHaveLength(1);
    f.player.x = e.x;
    f.player.y = e.y;
    run(f, rng, t.deathFuse + 0.1);
    expect(f.hazards).toHaveLength(0);
    expect(f.player.hp).toBeLessThan(f.stats.maxHp);
  });
});

describe('shooter', () => {
  const t = row('shooter', 'shoot');
  it('marks a harmless line, then a bullet flies and hits', () => {
    const { f, e, rng } = duel('shooter', 5);
    e.vars.cd = 0;
    stepFloor(f, NO_INPUT, DT, rng);
    expect(e.teles[0]!.effect?.kind).toBe('fire');
    run(f, rng, t.windup + 0.05, NO_INPUT, () => f.enemyShots.length > 0);
    expect(f.player.hp).toBe(f.stats.maxHp); // the line itself did nothing
    run(f, rng, 2, NO_INPUT, () => f.player.hp < f.stats.maxHp);
    expect(f.player.hp).toBeLessThan(f.stats.maxHp);
  });

  it('a swing cuts a bullet in front', () => {
    const { f, rng } = duel('shooter', 6);
    f.enemyShots = [{ x: f.player.x + 1, y: f.player.y, vx: -1, vy: 0, left: 5, damage: 2 }];
    stepFloor(f, { ...NO_INPUT, attack: true, aim: 0 }, DT, rng);
    expect(f.enemyShots).toHaveLength(0);
  });

  it('backs off when the director is close', () => {
    const { f, e, rng } = duel('shooter', 2);
    e.vars.cd = 99;
    const d0 = Math.hypot(e.x - f.player.x, e.y - f.player.y);
    run(f, rng, 0.5);
    expect(Math.hypot(e.x - f.player.x, e.y - f.player.y)).toBeGreaterThan(d0);
  });
});

describe('rallier', () => {
  const t = row('rallier', 'rally');
  it('a finished call speeds up ghosts nearby, wakes them, and brings wisps', () => {
    const { f, e, rng } = duel('rallier', 5);
    const sleeper = makeEnemy(f, 'dalgyal', { x: e.x + 1, y: e.y });
    sleeper.asleep = true;
    e.vars.cd = 0;
    const n = f.enemies.length;
    stepFloor(f, NO_INPUT, DT, rng);
    run(f, rng, t.windup + 0.1, NO_INPUT, () => sleeper.buffT > 0);
    expect(sleeper.buffT).toBeGreaterThan(0);
    expect(sleeper.asleep).toBe(false);
    expect(f.enemies.length).toBeGreaterThan(n);
  });

  it('a hit cuts the call', () => {
    const { f, e, rng } = duel('rallier', 5);
    const near = makeEnemy(f, 'dalgyal', { x: e.x + 1, y: e.y });
    e.vars.cd = 0;
    stepFloor(f, NO_INPUT, DT, rng);
    hitEnemy(f, e, 'skill', 1, false, FRONT, rng);
    expect(e.state).toBe('stun');
    run(f, rng, t.windup + 0.1);
    expect(near.buffT).toBe(0);
  });
});

describe('sweller', () => {
  const t = row('sweller', 'swell');
  it('grows while looked at, shrinks when not, and cannot be countered fully grown', () => {
    const { f, e, rng } = duel('sweller', 4);
    e.state = 'stun';
    e.timer = 99;
    const r0 = e.r;
    run(f, rng, t.max / t.grow + 0.5, { ...NO_INPUT, aim: 0 });
    expect(e.vars.size).toBeCloseTo(t.max);
    expect(e.r).toBeGreaterThan(r0);
    expect(e.parryable).toBe(false);
    run(f, rng, 1, { ...NO_INPUT, aim: Math.PI });
    expect(e.vars.size).toBeLessThan(t.max);
    expect(e.parryable).toBe(true);
  });
});

describe('thief', () => {
  const t = row('thief', 'thief');
  const caught = () => {
    const d = duel('thief', 0.9, [], { active: 'talisman' });
    run(d.f, d.rng, 2, NO_INPUT, () => d.f.stolen != null);
    return d;
  };
  it('takes the active on a hit and runs', () => {
    const { f, e } = caught();
    expect(f.active).toBe(null);
    expect(f.stolen).toMatchObject({ by: e.id, active: 'talisman', state: 'carried' });
  });

  it('killed, it gives the skill back ready and sharper', () => {
    const { f, e, rng } = caught();
    hitEnemy(f, e, 'slash', 99, false, FRONT, rng);
    expect(f.active).toBe('talisman');
    expect(f.skillCd).toBe(0);
    expect(f.skillBoost).toBe(t.boost);
    expect(f.stolen?.state).toBe('recovered');
  });

  it('given time, it is gone with the skill, and the night keeps it gone', () => {
    const { f, e, rng } = caught();
    run(f, rng, t.escape + 1, NO_INPUT, () => !f.enemies.includes(e));
    expect(f.stolen?.state).toBe('escaped');
    expect(f.active).toBe(null);
  });

  it('a counter saves the skill', () => {
    const d = duel('thief', 0.9, [], { active: 'talisman' });
    run(d.f, d.rng, 2, NO_INPUT, () => d.e.state === 'windup');
    run(d.f, d.rng, 1, NO_INPUT, () => d.e.teles[0] !== undefined && d.e.teles[0].t <= d.f.stats.parryWindow - 0.02);
    stepFloor(d.f, { ...NO_INPUT, draw: true, aim: 0 }, DT, d.rng);
    run(d.f, d.rng, 0.5);
    expect(d.f.active).toBe('talisman');
  });
});
