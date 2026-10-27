import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { SKILLS_V2 } from '../src/data/draft/skills.v2.data';
import { castActive, effectState, PARTS, runEffects, tickEffects, type EffectRow } from '../src/registry/effects';
import { makeEnemy } from '../src/systems/rift';
import { duel } from './helpers';

// 효과 부품 draft (registry/effects, not wired into the game): every part does its one thing, rows
// never loop, and every draft skill row runs.
const src = (id: string, rows: EffectRow[]) => ({ id, rows });
const hitArgs = (e: ReturnType<typeof duel>['e'], rng: SeededRNG, damage = 3) => ({ enemy: e, damage, kind: 'slash' as const, rng });

describe('효과 부품', () => {
  it('hit (target) lands once more on the hit ghost, and parts never trigger parts', () => {
    const { f, rng, e } = duel('dalgyal', 1.2);
    e.hp = 100;
    const rows: EffectRow[] = [{ when: 'onHit', do: 'hit', with: { shape: 'target', range: 0, mult: 1, of: 'hit' } }];
    runEffects(f, 'onHit', hitArgs(e, rng, 3), [src('x', rows)]);
    expect(e.hp).toBe(97);
  });

  it('status: stun, slow (wears off), curse (burns), mark → marked hit', () => {
    const { f, rng, e } = duel('dalgyal', 1.2);
    e.hp = 100;
    runEffects(f, 'onHit', hitArgs(e, rng), [src('a', [{ when: 'onHit', do: 'status', with: { kind: 'stun', sec: 1 } }])]);
    expect(e.state).toBe('stun');
    const speed = e.speedMult;
    runEffects(f, 'onHit', hitArgs(e, rng), [src('b', [{ when: 'onHit', do: 'status', with: { kind: 'slow', sec: 1, power: 0.5 } }])]);
    expect(e.speedMult).toBeCloseTo(speed * 0.5);
    f.time += 2;
    tickEffects(f, 1 / 60, rng);
    expect(e.speedMult).toBeCloseTo(speed);
    runEffects(f, 'onHit', hitArgs(e, rng), [src('c', [{ when: 'onHit', do: 'status', with: { kind: 'curse', sec: 4, power: 2, max: 3 } }])]);
    tickEffects(f, 1, rng);
    expect(e.hp).toBe(98);
    const mark = src('d', [
      { when: 'onHit', do: 'status', with: { kind: 'mark', sec: 5 } },
      { when: 'onHit', if: [{ marked: true }], do: 'hit', with: { shape: 'target', range: 0, mult: 10, of: 'hit', consumeMark: true } },
    ]);
    runEffects(f, 'onHit', hitArgs(e, rng, 1), [mark]); // marks (the cash-in row ran before the mark existed)
    const before = e.hp;
    runEffects(f, 'onHit', hitArgs(e, rng, 1), [mark]); // cashes in, then marks again
    expect(before - e.hp).toBe(10);
  });

  it('gain, buff (reverts), scale, stack/spend, echo, save', () => {
    const { f, rng, e } = duel('dalgyal', 1.2);
    e.hp = 100;
    runEffects(f, 'onCounter', {}, [src('g', [{ when: 'onCounter', do: 'gain', with: { res: 'focus', amount: 2 } }])]);
    expect(f.player.focus).toBe(2);
    const slash = f.stats.slash;
    runEffects(f, 'onAfterHurt', {}, [src('v', [{ when: 'onAfterHurt', do: 'buff', with: { stat: 'slash', op: 'mult', value: 1.5, sec: 3 } }])]);
    expect(f.stats.slash).toBeCloseTo(slash * 1.5);
    f.time += 4;
    tickEffects(f, 1 / 60, rng);
    expect(f.stats.slash).toBeCloseTo(slash);
    const atk = { damage: 10, kind: 'slash' as const };
    runEffects(f, 'onBeforeAttack', atk, [src('s', [{ when: 'onBeforeAttack', do: 'scale', with: { arg: 'damage', by: 1.3 } }])]);
    expect(atk.damage).toBeCloseTo(13);
    const mom = src('m', [{ when: 'onHit', do: 'stack', with: { key: 'momentum', add: 1, max: 5, decay: 3, stat: 'slash', per: 0.03 } }]);
    for (let i = 0; i < 7; i++) runEffects(f, 'onHit', hitArgs(e, rng), [mom]);
    expect(effectState(f).stacks.get('momentum')?.n).toBe(5);
    expect(f.stats.slash).toBeCloseTo(slash * 1.15);
    castActive(f, src('r', [{ when: 'onCast', do: 'spend', with: { key: 'momentum', shape: 'around', range: 3, multPerStack: 1 } }]), rng);
    expect(effectState(f).stacks.has('momentum')).toBe(false);
    expect(f.stats.slash).toBeCloseTo(slash);
    castActive(f, src('e', [{ when: 'onCast', do: 'echo', with: { sec: 5, mult: 0.5 } }]), rng);
    const hp = e.hp;
    runEffects(f, 'onHit', hitArgs(e, rng, 4), []);
    expect(hp - e.hp).toBe(2);
    const lethal = { prevent: false };
    const lb = src('lb', [{ when: 'onLethal', if: [{ once: 'night' }], do: 'save', with: { hp: 1 } }]);
    runEffects(f, 'onLethal', lethal, [lb]);
    expect(lethal.prevent).toBe(true);
    const again = { prevent: false };
    runEffects(f, 'onLethal', again, [lb]);
    expect(again.prevent).toBe(false);
  });

  it('shot, zone, cleanse, blink, burst', () => {
    const { f, rng } = duel('cheonyeo', 6);
    castActive(f, src('t', [{ when: 'onCast', do: 'shot', with: { speed: 14, range: 8, mult: 2, stun: 1, count: 3, spread: 0.6 } }]), rng);
    expect(f.shots).toHaveLength(3);
    castActive(f, src('z', [{ when: 'onCast', do: 'zone', with: { kind: 'barrier', radius: 2, sec: 2 } }]), rng);
    expect(f.zones.some((z) => z.kind === 'barrier')).toBe(true);
    for (let i = 0; i < 3; i++) makeEnemy(f, 'dokkaebibul', { x: 11 + i * 0.3, y: 11 });
    castActive(f, src('c', [{ when: 'onCast', do: 'cleanse', with: { radius: 3.5 } }]), rng);
    expect(f.enemies.filter((x) => x.kind === 'dokkaebibul' && x.hp > 0)).toHaveLength(0);
    f.player.aim = Math.PI;
    const x = f.player.x;
    castActive(f, src('b', [{ when: 'onCast', do: 'blink', with: { range: 3 } }]), rng);
    expect(f.player.x).toBeCloseTo(x - 3);
    const e2 = makeEnemy(f, 'dalgyal', { x: f.player.x + 1, y: f.player.y });
    e2.hp = 100;
    f.pickups = [{ x: f.player.x + 1, y: f.player.y, value: 4 }];
    castActive(f, src('s', [{ when: 'onCast', do: 'burst', with: { radius: 4, mult: 0.5 } }]), rng);
    expect(f.pickups).toHaveLength(0);
    expect(e2.hp).toBeLessThan(100);
  });

  it('cooldowns and chances: a row with cd fires once per window', () => {
    const { f, rng, e } = duel('dalgyal', 1.2);
    e.hp = 100;
    const s = src('cd', [{ when: 'onHit', do: 'hit', with: { shape: 'target', range: 0, mult: 1, of: 'hit' }, cd: 1 }]);
    runEffects(f, 'onHit', hitArgs(e, rng, 1), [s]);
    runEffects(f, 'onHit', hitArgs(e, rng, 1), [s]);
    expect(e.hp).toBe(99);
    f.time += 1.1;
    runEffects(f, 'onHit', hitArgs(e, rng, 1), [s]);
    expect(e.hp).toBe(98);
  });
});

describe('기술 v2 draft', () => {
  it('every row names a real part, and every skill runs on a floor without breaking', () => {
    for (const [id, sk] of Object.entries(SKILLS_V2)) {
      const { f, rng, e } = duel('dalgyal', 1.2);
      e.hp = 1000;
      for (const row of sk.rows) {
        expect(PARTS[row.do], `${id} ${row.do}`).toBeTypeOf('function');
        if (row.when === 'onCast') castActive(f, { id, rows: [row] }, rng);
        else runEffects(f, row.when, { enemy: e, damage: 2, kind: 'slash', heavy: true, rng, prevent: false, mult: 1, amount: 1 } as never, [{ id, rows: [row] }]);
      }
      tickEffects(f, 1, rng);
    }
  });

  it('today’s skills keep their numbers when written as rows', () => {
    const count = Object.values(SKILLS_V2).filter((s) => s.now).length;
    expect(count).toBe(21);
    const { f, rng, e } = duel('dalgyal', 1.2);
    f.player.hp = 3;
    runEffects(f, 'onKill', { enemy: e, rng }, [{ id: 'grudge_eater', rows: SKILLS_V2.grudge_eater!.rows }]);
    expect(f.player.hp).toBe(4);
  });
});
