import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../src/data/ghosts.data';
import { EXORCISTS } from '../src/data/protagonist.data';
import { TOOLS } from '../src/data/tools.data';
import { TRAITS } from '../src/data/traits.data';
import { computeExorcistStats, step, NO_INPUT } from '../src/systems/combat';
import { DT, makeWorld, run } from './helpers';

describe('computeExorcistStats', () => {
  it('derives stats from level, traits and tool', () => {
    const base = computeExorcistStats('director', 1, [], 'talisman');
    expect(base.maxHp).toBe(EXORCISTS.director.maxHp);
    const buffed = computeExorcistStats('director', 3, ['thick_skin', 'swift', 'sharp_talisman'], 'talisman');
    expect(buffed.maxHp).toBe(EXORCISTS.director.maxHp + 2 * EXORCISTS.director.levelHpBonus + TRAITS.thick_skin.maxHpBonus);
    expect(buffed.moveSpeed).toBeCloseTo(EXORCISTS.director.moveSpeed * TRAITS.swift.moveSpeedMult);
    expect(buffed.attackDamage).toBeCloseTo(TOOLS.talisman.attackDamage * TRAITS.sharp_talisman.damageMult);
  });
});

describe('combat step', () => {
  it('moves the director and keeps them inside the room', () => {
    const { world, rng } = makeWorld({ kind: 'payphone' });
    const x0 = world.player.x;
    run(world, rng, 0.5, { moveX: 1 });
    expect(world.player.x).toBeGreaterThan(x0);
    run(world, rng, 10, { moveX: 1 });
    expect(world.player.x).toBeLessThan(960);
  });

  it('spawns waves, kills ghosts with talismans and clears the room', () => {
    const { world, rng } = makeWorld({ waves: [[{ ghost: 'cheonyeo', count: 1 }], [{ ghost: 'cheonyeo', count: 1 }]] });
    step(world, NO_INPUT, DT, rng);
    expect(world.enemies).toHaveLength(1);
    let cleared = false;
    for (let i = 0; i < 60 * 30 && !cleared; i++) {
      step(world, { ...NO_INPUT, attack: true }, DT, rng);
      cleared = world.status === 'cleared';
      if (world.status === 'dead') break;
    }
    expect(world.status).toBe('cleared');
    expect(world.waveIndex).toBe(2);
    run(world, rng, 3); // pickups fly to the director once the room is clear
    expect(world.loot).toBe(ENEMIES.cheonyeo.dropValue * 2);
  });

  it('rolling grants invulnerability; contact damage hurts otherwise', () => {
    const { world, rng } = makeWorld({ waves: [[{ ghost: 'dalgyal', count: 1 }]] });
    step(world, NO_INPUT, DT, rng);
    const e = world.enemies[0]!;
    e.x = world.player.x;
    e.y = world.player.y;
    step(world, { ...NO_INPUT, roll: true }, DT, rng);
    expect(world.player.hp).toBe(world.stats.maxHp);

    const fresh = makeWorld({ waves: [[{ ghost: 'dalgyal', count: 1 }]] });
    step(fresh.world, NO_INPUT, DT, fresh.rng);
    const g = fresh.world.enemies[0]!;
    g.x = fresh.world.player.x;
    g.y = fresh.world.player.y;
    step(fresh.world, NO_INPUT, DT, fresh.rng);
    expect(fresh.world.player.hp).toBe(fresh.world.stats.maxHp - ENEMIES.dalgyal.contactDamage);
    expect(fresh.world.player.darkness).toBeGreaterThan(0);
  });

  it('the director dies at 0 HP', () => {
    const { world, rng } = makeWorld({ waves: [[{ ghost: 'subway', count: 1 }]] });
    step(world, NO_INPUT, DT, rng);
    world.player.hp = 1;
    const e = world.enemies[0]!;
    e.x = world.player.x;
    e.y = world.player.y;
    step(world, NO_INPUT, DT, rng);
    expect(world.status).toBe('dead');
  });

  it('talisman ward damages ghosts inside it', () => {
    const { world, rng } = makeWorld({ waves: [[{ ghost: 'dalgyal', count: 1 }]] });
    step(world, NO_INPUT, DT, rng);
    const e = world.enemies[0]!;
    step(world, { ...NO_INPUT, tool: true }, DT, rng);
    expect(world.zones).toHaveLength(1);
    e.x = world.zones[0]!.x + 30;
    e.y = world.zones[0]!.y - 60;
    world.player.iframes = 99;
    const hp0 = e.hp;
    run(world, rng, TOOLS.talisman.wardTickInterval * 2);
    expect(e.hp).toBeLessThan(hp0);
  });

  it('companion calls rotate and go on cooldown', () => {
    const { world, rng } = makeWorld({ waves: [[{ ghost: 'dalgyal', count: 2 }]] });
    step(world, NO_INPUT, DT, rng);
    world.player.hp = 5;
    world.player.iframes = 99;
    step(world, { ...NO_INPUT, call: true }, DT, rng);
    expect(world.player.hp).toBeGreaterThan(5); // grandma heals first
    expect(world.companions[0]!.cooldown).toBeGreaterThan(0);
    step(world, { ...NO_INPUT, call: true }, DT, rng);
    expect(world.companions[1]!.cooldown).toBeGreaterThan(0);
  });

  it('payphone extraction only works near the phone', () => {
    const { world, rng } = makeWorld({ kind: 'payphone' });
    step(world, { ...NO_INPUT, interact: true }, DT, rng);
    expect(world.status).toBe('cleared');
    world.player.x = 480;
    world.player.y = 270;
    step(world, { ...NO_INPUT, interact: true }, DT, rng);
    expect(world.status).toBe('extracted');
  });

  it('leaving through the door requires a cleared room', () => {
    const { world, rng } = makeWorld({ kind: 'payphone' });
    world.player.x = 480;
    run(world, rng, 3, { moveY: -1 });
    expect(world.status).toBe('exited');
  });

  it('boss enters phase 2 and its death purifies the room', () => {
    const { world, rng } = makeWorld({ kind: 'boss' });
    const boss = world.enemies[0]!;
    expect(boss.kind).toBe('printer');
    world.player.iframes = 9999;
    boss.hp = boss.maxHp * 0.4;
    run(world, rng, 3);
    expect(world.boss?.phase).toBe(2);
    expect(world.projectiles.some((p) => p.owner === 'enemy') || world.enemies.length > 1).toBe(true);
    boss.hp = 0.5;
    for (let i = 0; i < 600 && world.status !== 'bossDefeated'; i++) {
      world.player.iframes = 9999;
      step(world, { ...NO_INPUT, attack: true }, DT, rng);
    }
    expect(world.status).toBe('bossDefeated');
    expect(world.enemies).toHaveLength(0);
  });

  it('is deterministic for the same seed and inputs', () => {
    const a = makeWorld({ waves: [[{ ghost: 'cheonyeo', count: 3 }]], seed: 9 });
    const b = makeWorld({ waves: [[{ ghost: 'cheonyeo', count: 3 }]], seed: 9 });
    run(a.world, a.rng, 4, { attack: true, moveX: 0.5 });
    run(b.world, b.rng, 4, { attack: true, moveX: 0.5 });
    expect(a.world.enemies.map((e) => [e.x, e.y, e.hp])).toEqual(b.world.enemies.map((e) => [e.x, e.y, e.hp]));
  });
});
