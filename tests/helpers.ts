import { SeededRNG } from '../src/core/SeededRNG';
import { computeExorcistStats, createWorld, NO_INPUT, step, type InputFrame, type World } from '../src/systems/combat';
import type { Wave } from '../src/data/contracts.data';
import type { RoomKind, TraitId } from '../src/types/ids';

export const DT = 1 / 60;

export function makeWorld(opts: { kind?: RoomKind; waves?: Wave[]; traits?: TraitId[]; seed?: number } = {}): {
  world: World;
  rng: SeededRNG;
} {
  const rng = new SeededRNG(opts.seed ?? 42);
  const traits = opts.traits ?? [];
  const stats = computeExorcistStats('director', 1, traits, 'talisman');
  const world = createWorld(
    {
      roomKind: opts.kind ?? 'combat',
      waves: opts.waves ?? [],
      tool: 'talisman',
      traits,
      stats,
      hp: stats.maxHp,
      companions: [
        { id: 'grandma_shaman', cooldown: 0 },
        { id: 'ex_detective', cooldown: 0 },
        { id: 'streamer', cooldown: 0 },
      ],
    },
    rng,
  );
  return { world, rng };
}

export function run(world: World, rng: SeededRNG, seconds: number, input: Partial<InputFrame> = {}): void {
  const frame = { ...NO_INPUT, ...input };
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) step(world, frame, DT, rng);
}
