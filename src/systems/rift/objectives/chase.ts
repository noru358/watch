import { OBJECTIVES } from '../../../data/objectives.data';
import type { ObjectiveBrief } from '../../../data/contracts.data';
import { dist } from '../physics';
import type { Floor, Pos } from '../types';
import { makeNamed } from './bounty';
import type { ObjectiveState, QuarryCarry } from './types';

type Chase = Extract<ObjectiveState, { kind: 'chase' }>;
const C = OBJECTIVES.chase;

// 추격 (docs/rules/floor.md): the quarry fights where it stands; each time its HP drops past the next
// threshold it bolts down the stairs (the stairs open: follow it). On the next floor it sleeps in a
// nest room and heals until found. Get away on the last floor = the night is failed.
export function setupChase(f: Floor, brief: ObjectiveBrief, carry: QuarryCarry | null, at: Pos, nest: Pos, last: boolean): Chase {
  if (carry?.caught) return { kind: 'chase', done: true, targetId: null, fled: false, quarry: carry, shards: 0, last };
  const first = !carry;
  const e = makeNamed(f, brief, first ? at : nest, C, 'quarry');
  const quarry: QuarryCarry = carry ?? { hp: e.maxHp, maxHp: e.maxHp, stage: 0, caught: false };
  e.maxHp = quarry.maxHp;
  e.hp = quarry.hp;
  e.asleep = !first;
  return { kind: 'chase', done: false, targetId: e.id, fled: false, quarry, shards: brief.shards, last };
}

export function updateChase(f: Floor, o: Chase, dt: number): void {
  if (o.done || o.fled) return;
  const e = f.enemies.find((x) => x.id === o.targetId);
  if (!e || e.hp <= 0) {
    o.done = true;
    o.quarry = { ...o.quarry, hp: 0, caught: true };
    f.shards += o.shards;
    const at = e ?? f.player;
    f.events.push({ type: 'objectiveDone', x: at.x, y: at.y });
    return;
  }
  if (e.asleep) {
    e.hp = Math.min(e.maxHp, e.hp + C.regenPerSecond * e.maxHp * dt);
    if (dist(e, f.player) <= C.wakeRange) e.asleep = false;
  }
  o.quarry = { ...o.quarry, hp: e.hp };
  const threshold = C.fleeAt[o.quarry.stage];
  if (threshold === undefined || e.hp > e.maxHp * threshold) return;
  // It bolts: gone from this floor, the stairs open behind it.
  o.quarry = { ...o.quarry, stage: o.quarry.stage + 1 };
  o.fled = true;
  e.hp = 0;
  e.teles = [];
  f.events.push({ type: 'quarryFled', x: e.x, y: e.y });
  if (o.last) f.status = 'failed';
}
