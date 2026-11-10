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
