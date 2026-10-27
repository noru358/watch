import { BOSSES } from '../../data/ghosts.data';
import { DUNGEON } from '../../data/dungeon.data';
import { MODIFIERS } from '../../data/modifiers.data';
import { DEEP } from '../../data/objectives.data';
import { EXORCISTS } from '../../data/protagonist.data';
import type { FloorPlan } from '../../data/contracts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { ActiveId, UpgradeId, CardId, PerkId, WeaponId } from '../../types/ids';
import { runHooks } from './hooks';
import { makeEnemy } from './enemyFactory';
import { setupLair } from './lair';
import { foldMods, NO_MODS, type FloorMods } from './modifiers';
import { setupObjective, type QuarryCarry } from './objectives';
import { assignRoles, bigRoom, centre, distances, randomRooms, roomTile, type Room } from './layout';
import { isFloor } from './physics';
import type { Floor, Pos, Stats, Tile } from './types';
import type { EffectRow } from '../../registry/effects';

export { isFloor };
export { makeEnemy };

export interface FloorCarry {
  hp: number;
  focus: number;
  loot: number;
  weapon: WeaponId;
  stats: Stats;
  cards: CardId[];
  perks: PerkId[];
  used: PerkId[];
  active: ActiveId | null;
  upgrade?: UpgradeId | null; // the active's chosen 개조
  gearRows?: readonly EffectRow[]; // 장신구 specials (효과 부품 rows)
  quarry?: QuarryCarry | null; // 추격: the quarry as it left the previous floor
  last?: boolean; // this is the contract's last floor
}

// 현장 변형 that act on the director for this floor only (the run's stats stay as they are).
function modStats(s: Stats, m: FloorMods): Stats {
  if (m.moveMult === 1 && m.drawMult === 1) return s;
  return { ...s, moveSpeed: s.moveSpeed * m.moveMult, drawSlash: s.drawSlash * m.drawMult, draw: s.draw * m.drawMult };
}

function baseFloor(index: number, tiles: Tile[], start: Pos, carry: FloorCarry, plan: FloorPlan): Floor {
  const d = EXORCISTS.director;
  return {
    index,
    cols: DUNGEON.cols,
    rows: DUNGEON.rows,
    tiles,
    theme: plan.theme,
    stairs: null,
    objective: null,
    goal: plan.kind === 'normal' && plan.goal,
    lair: null,
    payphone: null,
    payphoneArmed: true,
    player: {
      ...start,
      prevX: start.x,
      prevY: start.y,
      r: d.radius,
      hp: carry.hp,
      aim: -Math.PI / 2,
      moving: false,
      swingT: 0,
      swingFx: 99,
      combo: 0,
      comboT: 0,
      dashT: 0,
      dashCd: 0,
      dashX: 0,
      dashY: 0,
      iframes: 0,
      drawCd: 0,
      drawFx: 99,
      drawKind: 'slash',
      drawT: 0,
      drawAim: 0,
      countered: [],
      focus: carry.focus,
      bare: 0,
      shield: 0,
      dashCharges: carry.stats.dashCharges,
      darkness: 0,
      hurtOnFloor: false,
      calmT: 0,
      hurtCarry: 0,
      dodged: false,
    },
    enemies: [],
    pickups: [],
    boss: null,
    swarm: plan.swarm ? { ...plan.swarm } : null,
    swarmTimer: plan.swarm ? plan.swarm.every / 2 : 0,
    weapon: carry.weapon,
    stats: modStats(carry.stats, plan.kind === 'normal' ? foldMods(plan.mods ?? []) : NO_MODS),
    cards: [...carry.cards],
    perks: [...carry.perks],
    used: [...carry.used],
    active: carry.active,
    upgrade: carry.upgrade ?? null,
    gearRows: [...(carry.gearRows ?? [])],
    skillCd: 0,
    zones: [],
    shots: [],
    vision: null,
    mods: plan.kind === 'normal' ? foldMods(plan.mods ?? []) : NO_MODS,
    time: 0,
    loot: carry.loot,
    shards: 0,
    drops: [],
    bossShards: plan.kind === 'boss' ? (plan.shards ?? 0) : 0,
    status: 'playing',
    nextId: 1,
    flow: new Int16Array(DUNGEON.cols * DUNGEON.rows).fill(-1),
    flowFrom: -1,
    events: [],
  };
}

// Rooms with roles (layout.ts), then what stands in them: stairs and 2 guards in the exit room,
// a payphone and the other strong ghosts in side rooms, the objective (quiet side rooms), a spirit
// heap in the treasure room. Modifiers and "deep" floors (past the goal) add on top; a plain clear
// floor draws exactly the same RNG as before, so main-story maps stay the same for a given seed.
function normalFloor(index: number, plan: Extract<FloorPlan, { kind: 'normal' }>, rng: SeededRNG, carry: FloorCarry): Floor {
  const { tiles, rooms } = randomRooms(rng);
  const rooms_ = rooms;
  const { start, exit, treasure, side } = assignRoles(tiles, rooms, rng);
  const mods = plan.mods ?? [];
  const deep = plan.deep ?? 0;
  const used = new Set<string>([`${start.x},${start.y}`]);
  const free = (from: Room[]): Pos => {
    for (let i = 0; i < 50; i++) {
      const p = roomTile(rng.pick(from), rng);
      if (!used.has(`${p.x},${p.y}`)) {
        used.add(`${p.x},${p.y}`);
        return p;
      }
    }
    return roomTile(rng.pick(from), rng);
  };
  let quiet = side.filter((r) => r !== treasure);
  // 괴이 소굴 takes one quiet side room for itself (decided first so nothing else is put there).
  const lairRoom = mods.includes('lair') && quiet.length > 1 ? rng.pick(quiet) : null;
  if (lairRoom) quiet = quiet.filter((r) => r !== lairRoom);
  const spread = side.filter((r) => r !== lairRoom);
  const f = baseFloor(index, tiles, start, carry, plan);
  f.stairs = free([exit]);
  if (plan.payphone) f.payphone = free(spread);
  for (let i = 0; i < plan.enemies; i++) makeEnemy(f, rng.pick(plan.pool), free(i < DUNGEON.exitGuards ? [exit] : spread));
  if (plan.objective) {
    const pool = quiet.length > 0 ? quiet : spread;
    const dist = distances(tiles, start);
    const walk = (r: Room) => dist[Math.floor(r.y + r.h / 2) * f.cols + Math.floor(r.x + r.w / 2)] ?? -1;
    const nest = pool.reduce((best, r) => (walk(r) > walk(best) ? r : best), pool[0]!);
    // n spots in different rooms, at least `gap` tiles from each other where the map allows (결계 sites).
    const apart = (n: number, gap: number): Pos[] => {
      const rooms = [...pool, ...rooms_.filter((r) => !pool.includes(r) && r !== exit && r !== lairRoom && r !== rooms_[0])];
      const out: Pos[] = [];
      const left = [...rooms];
      for (let k = 0; k < n; k++) {
        let best: Pos | null = null;
        for (let tries = 0; tries < 30 && left.length > 0; tries++) {
          const room = left[rng.int(0, left.length - 1)]!;
          const p = roomTile(room, rng);
          const far = out.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= gap);
          if (far || tries === 29) {
            best = p;
            left.splice(left.indexOf(room), 1);
            break;
          }
        }
        out.push(best ?? free(pool));
      }
      return out;
    };
    f.objective = setupObjective(f, plan, { quiet: () => free(pool), nest: () => free([nest]), apart, quarry: carry.quarry ?? null, last: carry.last ?? false, rng });
  }
  const value = (v: number) => Math.round(v * (1 + DEEP.lootPerFloor * deep) * f.mods.pickupMult);
  for (let i = 0; i < DUNGEON.spiritPickupsPerFloor; i++) f.pickups.push({ ...free(rooms), value: value(DUNGEON.spiritPickupValue) });
  if (treasure) for (let i = 0; i < DUNGEON.treasurePickups; i++) f.pickups.push({ ...free([treasure]), value: value(DUNGEON.treasureValue) });
  if (treasure && deep > 0 && carry.last) {
    for (let i = 0; i < DEEP.shardOnLast; i++) f.pickups.push({ ...free([treasure]), value: 0, shard: true });
    f.drops.push('deep'); // the deep treasure room (rolled at settlement; may come up empty)
  }
  if (lairRoom) f.lair = setupLair(f, lairRoom, plan.pool, rng);
  const vision = mods.map((m) => MODIFIERS[m].vision).find((v) => v !== undefined);
  if (vision !== undefined) f.vision = vision;
  return f;
}

// One big room: the director enters at the bottom, the source waits at the top.
function bossFloor(index: number, plan: Extract<FloorPlan, { kind: 'boss' }>, carry: FloorCarry): Floor {
  const { tiles, room } = bigRoom(DUNGEON.bossRoom);
  const cx = room.x + Math.floor(room.w / 2);
  const f = baseFloor(index, tiles, centre(cx, room.y + room.h - 2), carry, plan);
  const boss = makeEnemy(f, plan.boss, centre(cx, room.y + 2));
  const data = BOSSES[plan.boss];
  f.boss = { id: boss.id, phase: 1, sweepTimer: data.sweepEvery, summonTimer: data.summonEvery };
  return f;
}

export function generateFloor(index: number, plan: FloorPlan, rng: SeededRNG, carry: FloorCarry): Floor {
  const f = plan.kind === 'boss' ? bossFloor(index, plan, carry) : normalFloor(index, plan, rng, carry);
  runHooks(f, 'onRoomEnter', {});
  return f;
}
