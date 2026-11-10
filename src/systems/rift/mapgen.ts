import { BOSSES } from '../../data/ghosts.data';
import { DUNGEON } from '../../data/dungeon.data';
import { MODIFIERS } from '../../data/modifiers.data';
import { DEEP } from '../../data/objectives.data';
import { OFFICE } from '../../data/office.data';
import { AFFIXES } from '../../data/affixes.data';
import { EXORCISTS } from '../../data/protagonist.data';
import type { FloorPlan } from '../../data/contracts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import type { ActiveId, UpgradeId, CardId, PerkId, WeaponId } from '../../types/ids';
import { runHooks } from './hooks';
import { applyAffix } from './affix';
import { makeEnemy } from './enemyFactory';
import { setupLair } from './lair';
import { foldMods, NO_MODS, type FloorMods } from './modifiers';
import { setupObjective, type QuarryCarry } from './objectives';
import { assignRoles, bigRoom, centre, distances, randomRooms, roomMid, roomTile, type Room, type SpotMark } from './layout';
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
  stolen?: boolean; // the active was stolen earlier tonight (`active` is then null)
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
      rooted: 0,
      rootBreak: 0,
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
    hazards: [],
    enemyShots: [],
    stolen: null,
    activeStolen: carry.stolen ?? false,
    skillBoost: 1,
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
  const { tiles, rooms } = randomRooms(rng, plan.theme);
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
  // A hand-made room's own spot for this thing (its letter). Rooms are picked as before (so things stay
  // spread over rooms); in a hand-made room the free spot nearest `near` (else any) is used. When no room
  // here is hand-made this is exactly `free`, so plain floors keep their maps.
  const spot = (from: Room[], mark: SpotMark, near?: Pos): Pos => {
    if (!from.some((r) => r.tpl)) return free(from);
    const room = rng.pick(from);
    const open = (room.tpl?.spots[mark] ?? []).filter((p) => !used.has(`${p.x},${p.y}`));
    if (open.length === 0) return free([room]);
    const p = near ? open.reduce((a, q) => (Math.hypot(q.x - near.x, q.y - near.y) < Math.hypot(a.x - near.x, a.y - near.y) ? q : a)) : rng.pick(open);
    used.add(`${p.x},${p.y}`);
    return p;
  };
  let quiet = side.filter((r) => r !== treasure);
  // 괴이 소굴 takes one quiet side room for itself (decided first so nothing else is put there).
  // (A hand-made room cannot be the lair: the lair seals the gaps in a plain room's outline.)
  const lairable = quiet.filter((r) => !r.tpl);
  const lairRoom = mods.includes('lair') && quiet.length > 1 && lairable.length > 0 ? rng.pick(lairable) : null;
  if (lairRoom) quiet = quiet.filter((r) => r !== lairRoom);
  const spread = side.filter((r) => r !== lairRoom);
  const f = baseFloor(index, tiles, start, carry, plan);
  f.stairs = spot([exit], 's');
  if (plan.payphone) f.payphone = free(spread);
  for (let i = 0; i < plan.enemies; i++) makeEnemy(f, rng.pick(plan.pool), i < DUNGEON.exitGuards ? spot([exit], 'e', f.stairs) : spot(spread, 'e'));
  // Deep 원정 floors: some ordinary strong ghosts carry a word too (no dice drawn on other floors).
  if (plan.affixChance) {
    const words = Object.keys(AFFIXES).map(Number);
    for (const e of f.enemies) if (rng.chance(plan.affixChance)) applyAffix(e, rng.pick(words));
  }
  if (plan.objective) {
    const pool = quiet.length > 0 ? quiet : spread;
    const dist = distances(tiles, start);
    const walk = (r: Room) => {
      const m = roomMid(r);
      return dist[Math.floor(m.y) * f.cols + Math.floor(m.x)] ?? -1;
    };
    const nest = pool.reduce((best, r) => (walk(r) > walk(best) ? r : best), pool[0]!);
    // n spots in different rooms, at least `gap` tiles from each other where the map allows (결계 sites).
    const apart = (n: number, gap: number): Pos[] => {
      const rooms = [...pool, ...rooms_.filter((r) => !pool.includes(r) && r !== exit && r !== lairRoom && r !== rooms_[0])];
      const out: Pos[] = [];
      const left = [...rooms];
      const room0 = (p: Pos) => out.reduce((m, q) => Math.min(m, Math.hypot(q.x - p.x, q.y - p.y)), Infinity);
      for (let k = 0; k < n; k++) {
        // Try rooms not used yet; if none is far enough, keep the farthest try (not just the last one).
        let best: Pos | null = null;
        let bestRoom: Room | null = null;
        for (let tries = 0; tries < 30 && left.length > 0; tries++) {
          const room = left[rng.int(0, left.length - 1)]!;
          const p = roomTile(room, rng);
          if (!best || room0(p) > room0(best)) {
            best = p;
            bestRoom = room;
          }
          if (room0(p) >= gap) break;
        }
        if (bestRoom) left.splice(left.indexOf(bestRoom), 1);
        if (!best) {
          // Every room is taken: the farthest of a few tiles anywhere in them.
          for (let tries = 0; tries < 30; tries++) {
            const p = roomTile(rng.pick(rooms.length > 0 ? rooms : pool), rng);
            if (!best || room0(p) > room0(best)) best = p;
          }
        }
        out.push(best ?? free(pool));
      }
      return out;
    };
    f.objective = setupObjective(f, plan, { quiet: () => free(pool), nest: () => free([nest]), apart, quarry: carry.quarry ?? null, last: carry.last ?? false, rng });
  }
  const depth = Math.max(0, (plan.depth ?? 0) - OFFICE.depth.from); // floors past the 4th of a long contract
  const value = (v: number) => Math.round(v * (1 + DEEP.lootPerFloor * deep) * (1 + OFFICE.depth.lootPerFloor * depth) * f.mods.pickupMult);
  for (let i = 0; i < DUNGEON.spiritPickupsPerFloor; i++) f.pickups.push({ ...free(rooms), value: value(DUNGEON.spiritPickupValue) });
  if (treasure) for (let i = 0; i < DUNGEON.treasurePickups; i++) f.pickups.push({ ...spot([treasure], 't'), value: value(DUNGEON.treasureValue) });
  if (treasure && deep > 0 && carry.last) {
    for (let i = 0; i < DEEP.shardOnLast; i++) f.pickups.push({ ...free([treasure]), value: 0, shard: true });
    f.drops.push('deep'); // the deep treasure room (rolled at settlement; may come up empty)
  }
  // The end of a 보통 / 원정: shards in the treasure room (or anywhere, if the floor has none).
  for (let i = 0; i < (plan.bonusShards ?? 0); i++) f.pickups.push({ ...(treasure ? spot([treasure], 't') : free(rooms)), value: 0, shard: true });
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
