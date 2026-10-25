import { describe, expect, it } from 'vitest';
import { naive, playNight, skilled } from './bots';

// Acceptance check from docs/design/combat.md: standing and swinging must not be
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
