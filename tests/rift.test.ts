import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { CARDS } from '../src/data/cards.data';
import { BOSSES, GHOSTS } from '../src/data/ghosts.data';
import { EXORCISTS } from '../src/data/protagonist.data';
import { WEAPONS } from '../src/data/weapons.data';
import { answerPayphone, generateFloor, giveUp, isFloor, NO_INPUT, stepFloor, type Floor, type RiftInput } from '../src/systems/rift';
import { makeEnemy } from '../src/systems/rift/mapgen';
import { carry, DT, duel, floorWith } from './helpers';

const W = WEAPONS.newspaper_sword;
const MAX = EXORCISTS.director.maxHp;
const run = (f: Floor, rng: SeededRNG, seconds: number, input: Partial<RiftInput> = {}) => {
  for (let i = 0; i < Math.round(seconds / DT); i++) stepFloor(f, { ...NO_INPUT, ...input }, DT, rng);
};

function reachable(f: Floor, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const key = (x: number, y: number) => `${x},${y}`;
  const start = { x: Math.floor(from.x), y: Math.floor(from.y) };
  const seen = new Set([key(start.x, start.y)]);
  const q = [start];
  while (q.length) {
    const p = q.shift()!;
    if (p.x === Math.floor(to.x) && p.y === Math.floor(to.y)) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (!seen.has(key(n.x, n.y)) && isFloor(f, n.x, n.y)) {
        seen.add(key(n.x, n.y));
        q.push(n);
      }
    }
  }
  return false;
}

describe('floor generation', () => {
  it('stairs and every enemy are reachable from the start', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { f } = floorWith(seed);
      expect(reachable(f, f.player, f.stairs!)).toBe(true);
      for (const e of f.enemies) expect(reachable(f, f.player, e)).toBe(true);
    }
  });

  it('the boss floor is one room with the boss and no stairs', () => {
    const f = generateFloor(3, { kind: 'boss', boss: 'gumiho', swarm: null }, new SeededRNG(1), carry());
    expect(f.stairs).toBeNull();
    expect(f.enemies.map((e) => e.kind)).toEqual(['gumiho']);
  });
});

describe('movement', () => {
  it('walls block movement and the director slides along them', () => {
    const { f, rng } = duel();
    f.enemies = [];
    for (let y = 0; y < f.rows; y++) f.tiles[y * f.cols + 12] = 'wall';
    run(f, rng, 2, { moveX: 1, moveY: 0.3 });
    expect(f.player.x).toBeLessThan(12 - f.player.r + 0.01);
    expect(f.player.y).toBeGreaterThan(10.6);
  });

  it('pushing into a wall corner slides the director around it', () => {
    const { f, rng } = duel();
    f.enemies = [];
    // A wall tile right in front, with open floor just above it.
    f.tiles[10 * f.cols + 11] = 'wall';
    Object.assign(f.player, { x: 10.5, y: 10.05 }); // overlaps the wall's row by less than the nudge
    run(f, rng, 0.6, { moveX: 1 });
    expect(f.player.x).toBeGreaterThan(11.2);
  });

  it('a dash moves fast and grants brief invulnerability', () => {
    const { f, rng } = duel();
    f.enemies = [];
    stepFloor(f, { ...NO_INPUT, moveX: 1, dash: true }, DT, rng);
    expect(f.player.iframes).toBeGreaterThan(0);
    run(f, rng, EXORCISTS.director.dashTime);
    expect(f.player.x - 10.5).toBeGreaterThan(EXORCISTS.director.dashSpeed * EXORCISTS.director.dashTime * 0.7);
  });
});

describe('ghost telegraphs', () => {
  it('a ghost in range telegraphs and the hit lands when the windup ends', () => {
    const { f, rng, e } = duel('cheonyeo');
    stepFloor(f, NO_INPUT, DT, rng);
    expect(e.state).toBe('windup');
    expect(e.teles[0]?.parriable).toBe(true);
    run(f, rng, GHOSTS.cheonyeo.windup);
    expect(f.player.hp).toBe(MAX - GHOSTS.cheonyeo.damage);
  });

  it('walking out of the telegraph dodges the hit', () => {
    const { f, rng } = duel('cheonyeo');
    stepFloor(f, NO_INPUT, DT, rng);
    run(f, rng, GHOSTS.cheonyeo.windup, { moveX: -1 });
    expect(f.player.hp).toBe(MAX);
  });

  it('발도 inside the parry window counters, stuns and bares the blade', () => {
    const { f, rng, e, hp } = duel('dalgyal');
    stepFloor(f, NO_INPUT, DT, rng);
    run(f, rng, GHOSTS.dalgyal.windup - W.parryWindow / 2);
    stepFloor(f, { ...NO_INPUT, draw: true, aim: 0 }, DT, rng);
    expect(e.hp).toBe(hp - W.draw);
    expect(e.state).toBe('stun');
    expect(f.player.bare).toBeGreaterThan(0);
    run(f, rng, 0.5);
    expect(f.player.hp).toBe(MAX);
  });

  it('a counter also cuts all around (wider than the plain slash), as hard as the focus strike', () => {
    const { f, rng } = duel('dalgyal');
    const behind = makeEnemy(f, 'dalgyal', { x: 10.5 - 3, y: 10.5 });
    stepFloor(f, NO_INPUT, DT, rng);
    run(f, rng, GHOSTS.dalgyal.windup - W.parryWindow / 2);
    stepFloor(f, { ...NO_INPUT, draw: true, aim: 0 }, DT, rng);
    expect(f.player.drawKind).toBe('counter');
    expect(behind.hp).toBe(GHOSTS.dalgyal.hp - W.draw);
    expect(W.burstReach).toBeGreaterThan(W.drawReach);
    expect(W.draw).toBeGreaterThan(W.drawSlash);
  });

  it('발도 too early is just a wide slash: no counter, the hit still lands, then a cooldown', () => {
    const { f, rng, e, hp } = duel('dalgyal');
    stepFloor(f, NO_INPUT, DT, rng);
    stepFloor(f, { ...NO_INPUT, draw: true, aim: 0 }, DT, rng);
    expect(e.hp).toBe(hp - W.drawSlash);
    expect(e.state).toBe('windup');
    expect(f.player.drawKind).toBe('slash');
    stepFloor(f, { ...NO_INPUT, draw: true, aim: 0 }, DT, rng); // on cooldown: nothing
    expect(e.hp).toBe(hp - W.drawSlash);
    run(f, rng, GHOSTS.dalgyal.windup);
    expect(f.player.hp).toBeLessThan(MAX);
  });

  it('a subway dash cannot be countered, only dodged', () => {
    const a = duel('subway', 4);
    stepFloor(a.f, NO_INPUT, DT, a.rng);
    expect(a.e.teles[0]?.shape).toBe('line');
    run(a.f, a.rng, GHOSTS.subway.windup - W.parryWindow / 2);
    stepFloor(a.f, { ...NO_INPUT, draw: true }, DT, a.rng);
    run(a.f, a.rng, 0.3);
    expect(a.f.player.hp).toBe(MAX - GHOSTS.subway.damage);

    const b = duel('subway', 4);
    stepFloor(b.f, NO_INPUT, DT, b.rng);
    run(b.f, b.rng, GHOSTS.subway.windup, { moveY: 1 });
    expect(b.f.player.hp).toBe(MAX);
  });
});

describe('swarm', () => {
  it('fodder arrive out of sight on a timer and never exceed the cap', () => {
    const { f, rng } = duel();
    f.enemies = [];
    f.swarm = { kind: 'dokkaebibul', every: 1, group: 5, cap: 7, near: 4, far: 8 };
    f.swarmTimer = 0;
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.enemies.length).toBe(5);
    for (const e of f.enemies) expect(Math.hypot(e.x - f.player.x, e.y - f.player.y)).toBeGreaterThan(3);
    run(f, rng, 1.1);
    expect(f.enemies.length).toBeLessThanOrEqual(7);
  });

  it('fodder hurt on touch and die in one or two hits', () => {
    const { f, rng, e } = duel('dokkaebibul', 0.4);
    stepFloor(f, NO_INPUT, DT, rng);
    expect(f.player.hp).toBe(MAX - GHOSTS.dokkaebibul.contactDamage);
    run(f, rng, 1);
    stepFloor(f, { ...NO_INPUT, attack: true, aim: Math.atan2(e.y - f.player.y, e.x - f.player.x) }, DT, rng);
    expect(f.enemies.length).toBe(0);
  });
});

describe('sword', () => {
  it('a swing hits enemies in the cone in front only', () => {
    const { f, rng, e, hp } = duel('dalgyal');
    stepFloor(f, { ...NO_INPUT, attack: true, aim: Math.PI }, DT, rng); // facing away
    expect(e.hp).toBe(hp);
    run(f, rng, W.swingTime + 0.01);
    stepFloor(f, { ...NO_INPUT, attack: true, aim: 0 }, DT, rng);
    expect(e.hp).toBe(hp - W.slash);
    expect(f.player.focus).toBe(1);
  });

  it('every 3rd swing of a combo is heavy', () => {
    const { f, rng, e } = duel('dalgyal');
    e.hp = 999;
    e.state = 'stun';
    e.timer = 99;
    for (let i = 0; i < W.comboEvery; i++) {
      stepFloor(f, { ...NO_INPUT, attack: true, aim: 0 }, DT, rng);
      Object.assign(e, { x: 11.7, y: 10.5, knockX: 0, knockY: 0 });
      run(f, rng, W.swingTime);
    }
    expect(999 - e.hp).toBe(W.slash * W.comboEvery + W.comboBonus);
  });

  it('a full focus gauge allows a free draw strike all around', () => {
    const { f, rng, e, hp } = duel('dalgyal');
    f.player.focus = f.stats.focusMax;
    stepFloor(f, { ...NO_INPUT, draw: true, aim: Math.PI }, DT, rng);
    expect(e.hp).toBe(hp - W.draw);
    expect(f.player.focus).toBe(0);
  });
});

describe('floor exits and cards', () => {
  it('kills drop spirit that flies to the director; stairs end the floor', () => {
    const { f, rng, e } = duel('cheonyeo');
    e.hp = 1;
    stepFloor(f, { ...NO_INPUT, attack: true, aim: 0 }, DT, rng);
    run(f, rng, 1);
    expect(f.loot).toBe(GHOSTS.cheonyeo.drop);
    f.stairs = { x: f.player.x, y: f.player.y + 1 };
    run(f, rng, 0.5, { moveY: 1 });
    expect(f.status).toBe('stairs');
  });

  it('the payphone pauses the floor until answered, and re-arms after walking away', () => {
    const { f, rng } = duel();
    f.enemies = [];
    f.payphone = { x: 10.5, y: 11.5 };
    run(f, rng, 0.4, { moveY: 1 });
    expect(f.status).toBe('payphone');
    answerPayphone(f, false);
    run(f, rng, 0.2);
    expect(f.status).toBe('playing');
    run(f, rng, 0.6, { moveY: -1 });
    run(f, rng, 0.6, { moveY: 1 });
    expect(f.status).toBe('payphone');
    answerPayphone(f, true);
    expect(f.status).toBe('extracted');
  });

  it('salt_ward blocks one hit per floor', () => {
    const { f, rng } = duel('cheonyeo', 1.2, ['salt_ward']);
    f.player.shield = CARDS.salt_ward.amount;
    stepFloor(f, NO_INPUT, DT, rng);
    run(f, rng, GHOSTS.cheonyeo.windup + 0.05);
    expect(f.player.hp).toBe(f.stats.maxHp);
    expect(f.player.shield).toBe(0);
  });
});

describe('boss', () => {
  function bossFloor() {
    const rng = new SeededRNG(4);
    const f = generateFloor(3, { kind: 'boss', boss: 'gumiho', swarm: null }, rng, carry());
    return { f, rng, boss: f.enemies[0]! };
  }

  it('sweeps the director\'s row; it cannot be countered, leaving the row dodges it', () => {
    const { f, rng, boss } = bossFloor();
    f.boss!.sweepTimer = 0;
    stepFloor(f, NO_INPUT, DT, rng);
    expect(boss.teles[0]?.shape).toBe('band');
    expect(boss.teles[0]?.parriable).toBe(false);
    run(f, rng, BOSSES.gumiho.sweepWindup, { moveY: -1 });
    expect(f.player.hp).toBe(MAX);
  });

  it('scatters a group of fox-fire wisps when it summons', () => {
    const { f, rng } = bossFloor();
    Object.assign(f.boss!, { summonTimer: 0, sweepTimer: 99 });
    const before = f.enemies.filter((e) => e.kind === BOSSES.gumiho.summon).length;
    stepFloor(f, NO_INPUT, DT, rng);
    const after = f.enemies.filter((e) => e.kind === BOSSES.gumiho.summon).length;
    expect(after - before).toBe(BOSSES.gumiho.summonCount);
  });

  it('enters phase 2 at half HP and its death ends the floor', () => {
    const { f, rng, boss } = bossFloor();
    Object.assign(f.player, { x: boss.x, y: boss.y + 1.6 });
    boss.state = 'stun';
    boss.timer = 99;
    boss.hp = boss.maxHp * BOSSES.gumiho.phase2Ratio + 1;
    stepFloor(f, { ...NO_INPUT, attack: true, aim: -Math.PI / 2 }, DT, rng);
    expect(f.boss?.phase).toBe(2);
    boss.hp = 1;
    run(f, rng, W.swingTime + 0.02, { attack: true, aim: -Math.PI / 2 });
    expect(f.status).toBe('bossDefeated');
  });
});

describe('pause menu', () => {
  it('giving up ends the floor as a failure, only while playing', () => {
    const { f } = duel();
    giveUp(f);
    expect(f.status).toBe('dead');
    const { f: g } = duel();
    g.status = 'payphone';
    giveUp(g);
    expect(g.status).toBe('payphone');
  });
});
