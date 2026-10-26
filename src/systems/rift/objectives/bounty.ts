import { OBJECTIVES } from '../../../data/objectives.data';
import type { ObjectiveBrief } from '../../../data/contracts.data';
import { makeEnemy } from '../enemyFactory';
import type { Enemy, Floor, Pos } from '../types';
import type { ObjectiveState } from './types';

type Bounty = Extract<ObjectiveState, { kind: 'bounty' }>;

// The 현상수배 elite and the 추격 quarry: a strong ghost with multipliers (one data row each).
export function makeNamed(f: Floor, brief: ObjectiveBrief, at: Pos, rule: { hpMult: number; damageAdd: number; speedMult: number; windupMult: number }, role: Enemy['role'], extraHp = 0): Enemy {
  const ghost = brief.target?.ghost ?? 'cheonyeo';
  const e = makeEnemy(f, ghost, at);
  // On top of the floor's 현장 변형 (makeEnemy already applied them).
  e.maxHp = Math.round(e.maxHp * (rule.hpMult + extraHp));
  e.hp = e.maxHp;
  e.damageAdd += rule.damageAdd;
  e.speedMult *= rule.speedMult;
  e.windupMult *= rule.windupMult;
  e.warpTimer = 999; // a named ghost holds its ground (no blinking behind the director)
  e.role = role;
  return e;
}

export function setupBounty(f: Floor, brief: ObjectiveBrief, at: Pos): Bounty {
  const B = OBJECTIVES.bounty;
  const e = makeNamed(f, brief, at, B, 'bounty', B.hpPerLevel * (brief.target?.level ?? 0));
  return { kind: 'bounty', done: false, targetId: e.id, shards: brief.shards };
}

// Done the moment the named ghost falls; its 심연 파편 are banked on the floor.
export function updateBounty(f: Floor, o: Bounty): void {
  if (o.done) return;
  const e = f.enemies.find((x) => x.id === o.targetId);
  if (e && e.hp > 0) return;
  o.done = true;
  f.shards += o.shards;
  const at = e ?? f.player;
  f.events.push({ type: 'objectiveDone', x: at.x, y: at.y });
}
