import { describe, expect, it } from 'vitest';
import { HUB, HUB_PROPS, HUB_SPOTS } from '../src/data/lobby.data';
import { newHub, spotInReach, stepHub, unlockedSpots } from '../src/systems/hub';

const walk = (h: ReturnType<typeof newHub>, moveX: number, moveY: number, seconds: number) => {
  for (let i = 0; i < Math.round(seconds / HUB.step); i++) stepHub(h, { moveX, moveY }, HUB.step);
};

describe('hub walking', () => {
  it('moves at the hub speed and faces the way it walks', () => {
    const h = newHub();
    walk(h, -1, 0, 0.5);
    expect(h.x).toBeCloseTo(HUB.start.x - HUB.speed * 0.5, 1);
    expect(h.face).toBe(-1);
    expect(h.moving).toBe(true);
    stepHub(h, { moveX: 0, moveY: 0 }, HUB.step);
    expect(h.moving).toBe(false);
  });

  it('stays inside the office walls and out of furniture', () => {
    const h = newHub();
    walk(h, 0, 1, 5);
    expect(h.y + HUB.bodyR).toBeLessThanOrEqual(HUB.walk.y + HUB.walk.h);
    walk(h, 0, -1, 5);
    expect(h.y - HUB.bodyR).toBeGreaterThanOrEqual(HUB.walk.y);
    Object.assign(h, { x: 8.5, y: 5 }); // above the sofa
    walk(h, 0, 1, 3);
    expect(h.y + HUB.bodyR).toBeLessThanOrEqual(HUB_PROPS.sofa.y + 1e-9);
  });

  it('slides along a wall when moving diagonally into it', () => {
    const h = newHub();
    walk(h, 0, 1, 5);
    const x = h.x;
    walk(h, 1, 1, 0.3);
    expect(h.x).toBeGreaterThan(x);
  });
});

describe('hub spots', () => {
  it('shows the bookkeeper only after the first solved contract', () => {
    expect(unlockedSpots({ solved: 0 })).toEqual(['door']);
    expect(unlockedSpots({ solved: 1 })).toContain('bookkeeper');
  });

  it('finds the door when standing in front of it, nothing where the director comes in', () => {
    const h = newHub();
    expect(spotInReach(h, { solved: 5 })).toBeNull();
    Object.assign(h, { x: HUB_SPOTS.door.x, y: HUB_SPOTS.door.y + 0.6 });
    expect(spotInReach(h, { solved: 0 })).toBe('door');
  });

  it('ignores a locked spot even in reach', () => {
    const h = newHub();
    Object.assign(h, { x: HUB_SPOTS.bookkeeper.x, y: HUB_SPOTS.bookkeeper.y + 1.2 });
    expect(spotInReach(h, { solved: 0 })).toBeNull();
    expect(spotInReach(h, { solved: 1 })).toBe('bookkeeper');
  });
});
