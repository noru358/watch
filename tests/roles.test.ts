import { describe, expect, it } from 'vitest';
import { playNight, skilled } from './bots';
import type { GhostId } from '../src/types/ids';

// Every role ghost must be beatable by reading its warnings (docs/design/2-night/enemies.md "역할 8종"):
// a bot that reads telegraphs clears three 섬멸 floors of that ghost (+ 달걀귀신) on most seeds.
const plan = (pool: GhostId[], goal: boolean) => ({ kind: 'normal' as const, enemies: 6, pool, payphone: false, swarm: null, objective: 'clear' as const, goal, theme: 'basement' as const });
const setup = (pool: GhostId[]) => ({ offerId: 0, floors: [plan(pool, false), plan(pool, false), plan(pool, true)], fee: 100, weapon: 'newspaper_sword' as const });
const ROLES: GhostId[] = ['dokkaebi', 'grabber', 'leaper', 'burster', 'shooter', 'rallier', 'sweller', 'thief'];

describe('role ghosts are readable (skilled bot, 8 seeds)', () => {
  for (const kind of ROLES) {
    it(kind, () => {
      const runs = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => playNight(seed, skilled, setup([kind, 'dalgyal'])));
      expect(runs.filter((r) => r.outcome === 'success').length, JSON.stringify(runs)).toBeGreaterThanOrEqual(6);
    });
  }
});
