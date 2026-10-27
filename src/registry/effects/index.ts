import type { SeededRNG } from '../../core/SeededRNG';
import { hitEnemy, type Enemy, type Floor } from '../../systems/rift';
import type { HookArgs, HookName } from '../hookPoints';
import { holds } from './conditions';
import { blink } from './parts/blink';
import { buff } from './parts/buff';
import { burst } from './parts/burst';
import { cleanse } from './parts/cleanse';
import { echo } from './parts/echo';
import { gain } from './parts/gain';
import { hit } from './parts/hit';
import { save } from './parts/save';
import { scale } from './parts/scale';
import { shot } from './parts/shot';
import { spend, stack } from './parts/stack';
import { status } from './parts/status';
import { zone } from './parts/zone';
import { collect } from './parts/collect';
import { effectState } from './state';
import type { EffectCtx, EffectRow, EffectTrigger, PartFn, PartId } from './types';

// 효과 부품 registry (draft, not wired — see types.ts). One part = one file in parts/; adding a
// part = its file + one line here + its numbers in types.ts PartParams.
export const PARTS: { [P in PartId]: PartFn<P> } = { hit, status, shot, zone, gain, buff, scale, cleanse, stack, spend, echo, blink, burst, save, collect };

export type { EffectRow, Cond, PartId, PartParams, EffectTrigger } from './types';
export { effectState } from './state';

// Something that carries rows: a skill, a piece of gear, a card.
export interface EffectSource {
  id: string;
  rows: readonly EffectRow[];
}

function fire(f: Floor, source: EffectSource, when: EffectTrigger, args: Record<string, unknown>): void {
  const s = effectState(f);
  const enemy = (args.enemy as Enemy | undefined) ?? null;
  const rng = (args.rng as SeededRNG | undefined) ?? s.rng;
  source.rows.forEach((row, i) => {
    if (row.when !== when) return;
    const key = `${source.id}#${i}`;
    if ((s.ready.get(key) ?? -1) > f.time) return;
    const ctx: EffectCtx = { f, args, enemy, rng, source: source.id };
    if (row.if && !row.if.every((c) => holds(c, ctx, key))) return;
    (PARTS[row.do] as PartFn<PartId>)(ctx, row.with as never);
    if (row.cd) s.ready.set(key, f.time + row.cd);
  });
}

// What the rift's runHooks would call for these sources (cards / perks stay as they are).
// Parts never trigger parts: anything a part does (an extra hit, a kill) runs at depth 1 and fires
// no rows — the "proc" rule of Risk of Rain 2, so two skills can never loop.
export function runEffects<K extends HookName>(f: Floor, hook: K, args: HookArgs[K], sources: readonly EffectSource[]): void {
  const s = effectState(f);
  if (s.depth > 0) return;
  s.depth += 1;
  try {
    for (const src of sources) fire(f, src, hook, args as unknown as Record<string, unknown>);
    // 그림자 분신: a landed hit repeats once at the echo's share.
    if (hook === 'onHit' && s.echo.until > f.time) {
      const a = args as unknown as HookArgs['onHit'];
      if (a.enemy.hp > 0) hitEnemy(f, a.enemy, 'skill', a.damage * s.echo.mult, false, { x: 0, y: 0 }, a.rng);
    }
  } finally {
    s.depth -= 1;
  }
}

// An active skill on L: its 'onCast' rows.
export function castActive(f: Floor, source: EffectSource, rng: SeededRNG): void {
  const s = effectState(f);
  s.depth += 1;
  try {
    fire(f, source, 'onCast', { rng });
  } finally {
    s.depth -= 1;
  }
}

// Every tick: timers run out (buffs, slows, marks, stacks) and curses burn.
export function tickEffects(f: Floor, dt: number, rng: SeededRNG): void {
  const s = effectState(f);
  for (const b of [...s.buffs]) {
    if (b.until > f.time) continue;
    f.stats[b.stat] = b.op === 'add' ? f.stats[b.stat] - b.value : f.stats[b.stat] / b.value;
    s.buffs.splice(s.buffs.indexOf(b), 1);
  }
  for (const [id, sl] of s.slows) {
    if (sl.until > f.time) continue;
    const e = f.enemies.find((x) => x.id === id);
    if (e) e.speedMult /= sl.factor;
    s.slows.delete(id);
  }
  for (const [id, m] of s.marks) if (m.until <= f.time) s.marks.delete(id);
  for (const [key, st] of s.stacks) {
    if (st.until > f.time) continue;
    if (st.stat && st.per) f.stats[st.stat] /= 1 + st.per * st.n;
    s.stacks.delete(key);
  }
  s.depth += 1;
  try {
    for (const [id, c] of s.curses) {
      const e = f.enemies.find((x) => x.id === id);
      if (!e || e.hp <= 0 || c.until <= f.time) {
        s.curses.delete(id);
        continue;
      }
      c.acc += c.dps * c.stacks * dt;
      if (c.acc >= 1) {
        const n = Math.floor(c.acc);
        c.acc -= n;
        hitEnemy(f, e, 'skill', n, false, { x: 0, y: 0 }, rng);
      }
    }
  } finally {
    s.depth -= 1;
  }
}
