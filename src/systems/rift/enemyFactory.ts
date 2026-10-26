import { BOSSES, GHOSTS } from '../../data/ghosts.data';
import type { EnemyId } from '../../types/ids';
import type { Enemy, Floor, Pos } from './types';

export function makeEnemy(f: Floor, kind: EnemyId, at: Pos): Enemy {
  const boss = kind === 'gumiho';
  const hp = boss ? BOSSES[kind].hp : GHOSTS[kind].hp;
  const e: Enemy = {
    id: f.nextId++,
    kind,
    x: at.x,
    y: at.y,
    prevX: at.x,
    prevY: at.y,
    r: boss ? BOSSES[kind].radius : GHOSTS[kind].radius,
    hp,
    maxHp: hp,
    state: boss ? 'chase' : 'idle',
    timer: 0,
    teles: [],
    warpTimer: boss ? 0 : GHOSTS[kind].teleportEvery,
    warpTo: null,
    knockX: 0,
    knockY: 0,
    face: 1,
    speedMult: 1,
    damageAdd: 0,
    windupMult: 1,
    role: 'normal',
    asleep: false,
    regen: 0,
    sinceHit: 0,
  };
  // 현장 변형 on every ghost but the boss (fodder keeps its HP: one-hit wisps stay one-hit).
  if (!boss) {
    const m = f.mods;
    if (!GHOSTS[kind].fodder) e.maxHp = e.hp = Math.round(hp * m.hpMult);
    e.damageAdd = m.damageAdd;
    e.speedMult = m.speedMult;
    e.windupMult = m.windupMult;
    e.regen = m.regen;
  }
  f.enemies.push(e);
  return e;
}

