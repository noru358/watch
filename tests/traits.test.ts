import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../src/data/ghosts.data';
import { TOOLS } from '../src/data/tools.data';
import { TRAITS } from '../src/data/traits.data';
import { NO_INPUT, step } from '../src/systems/combat';
import { DT, makeWorld } from './helpers';

describe('trait hooks', () => {
  it('salt_ward blocks one hit per room', () => {
    const { world, rng } = makeWorld({ traits: ['salt_ward'], waves: [[{ ghost: 'subway', count: 1 }]] });
    expect(world.player.shield).toBe(TRAITS.salt_ward.amount);
    step(world, NO_INPUT, DT, rng);
    const e = world.enemies[0]!;
    e.x = world.player.x;
    e.y = world.player.y;
    step(world, NO_INPUT, DT, rng);
    expect(world.player.hp).toBe(world.stats.maxHp);
    expect(world.player.shield).toBe(0);
    expect(world.events.some((ev) => ev.type === 'shieldBlocked')).toBe(true);
  });

  it('roll_empower multiplies the first talisman after a roll', () => {
    const { world, rng } = makeWorld({ traits: ['roll_empower'], waves: [[{ ghost: 'dalgyal', count: 1 }]] });
    step(world, NO_INPUT, DT, rng);
    step(world, { ...NO_INPUT, roll: true }, DT, rng);
    for (let i = 0; i < 30; i++) step(world, NO_INPUT, DT, rng);
    step(world, { ...NO_INPUT, attack: true }, DT, rng);
    const shot = world.projectiles.find((p) => p.owner === 'player')!;
    expect(shot.damage).toBeCloseTo(TOOLS.talisman.attackDamage * TRAITS.roll_empower.amount);
    expect(shot.empowered).toBe(true);
    expect(world.player.rolledSinceAttack).toBe(false);
  });

  it('vampiric can heal on kill', () => {
    // Find a seed where the vampiric roll succeeds; the hook must then heal.
    let healed = false;
    for (let seed = 1; seed < 40 && !healed; seed++) {
      const { world, rng } = makeWorld({ seed, traits: ['vampiric'], waves: [[{ ghost: 'cheonyeo', count: 1 }]] });
      step(world, NO_INPUT, DT, rng);
      world.player.hp = 3;
      const e = world.enemies[0]!;
      e.hp = 0.1;
      e.x = world.player.x + 60;
      e.y = world.player.y - 60;
      world.player.iframes = 99;
      for (let i = 0; i < 30; i++) step(world, { ...NO_INPUT, attack: true }, DT, rng);
      healed = world.player.hp > 3;
    }
    expect(healed).toBe(true);
  });

  it('kills drop spirit worth the enemy drop value', () => {
    const { world, rng } = makeWorld({ waves: [[{ ghost: 'subway', count: 1 }]] });
    step(world, NO_INPUT, DT, rng);
    world.enemies[0]!.hp = 0.1;
    world.player.iframes = 99;
    for (let i = 0; i < 60 && world.pickups.length === 0 && world.loot === 0; i++) step(world, { ...NO_INPUT, attack: true }, DT, rng);
    expect(world.pickups.reduce((s, p) => s + p.value, 0) + world.loot).toBe(ENEMIES.subway.dropValue);
  });
});
