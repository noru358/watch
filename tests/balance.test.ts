import { describe, expect, it } from 'vitest';
import { TRAINING } from '../src/data/training.data';
import { EMPTY_LOADOUT } from '../src/systems/growth';
import type { TrainingId } from '../src/types/ids';
import { naive, playNight, skilled } from './bots';
import { storySetup } from './helpers';

// Acceptance check from docs/design/2-night/combat.md: standing and swinging must not be
// enough; reading telegraphs (dodge / 발도) must be.
describe('balance (bots, 8 seeds)', () => {
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
  const naiveRuns = seeds.map((s) => playNight(s, naive));
  const skilledRuns = seeds.map((s) => playNight(s, skilled));
  const wins = (r: typeof naiveRuns) => r.filter((x) => x.outcome === 'success').length;

  it('a stand-and-swing bot mostly fails', () => {
    expect(wins(naiveRuns), JSON.stringify(naiveRuns)).toBeLessThanOrEqual(2);
  });

  it('a bot that reads telegraphs mostly clears', () => {
    expect(wins(skilledRuns), JSON.stringify(skilledRuns)).toBeGreaterThanOrEqual(6);
  });
});

// 트레이닝 must help without carrying a player who does not read telegraphs (docs/rules/growth.md).
describe('balance: fully trained (bots, 8 seeds)', () => {
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
  const maxed = Object.fromEntries((Object.keys(TRAINING) as TrainingId[]).map((id) => [id, TRAINING[id].max]));
  const setup = { ...storySetup, loadout: { ...EMPTY_LOADOUT, training: maxed } };
  const naiveRuns = seeds.map((s) => playNight(s, naive, setup));
  const skilledRuns = seeds.map((s) => playNight(s, skilled, setup));
  const wins = (r: typeof naiveRuns) => r.filter((x) => x.outcome === 'success').length;
  const avg = (r: typeof naiveRuns) => r.reduce((n, x) => n + x.seconds, 0) / r.length;
  const untrained = seeds.map((s) => playNight(s, skilled));

  it('standing and swinging still fails most nights', () => {
    expect(wins(naiveRuns), JSON.stringify(naiveRuns)).toBeLessThanOrEqual(3);
  });

  it('a good player clears, a bit faster than untrained', () => {
    expect(wins(skilledRuns)).toBeGreaterThanOrEqual(7);
    expect(avg(skilledRuns)).toBeLessThan(avg(untrained));
  });
});
