import type { SeededRNG } from '../../core/SeededRNG';
import { DUNGEON } from '../../data/dungeon.data';
import { PROPS, ROOM_KINDS, type District, type PlaceRule, type PropArtId, type RoomKindId } from '../../data/districts.data';
import { angleDiff, dist } from './physics';
import { centre, corridor, distances, roomMid, type Room } from './layout';
import type { Floor, PropState, SignState, Tile } from './types';

// District rules (districts.data.ts) applied to a laid-out floor: loops, room kinds, neon signs; and the
// one thing props do in a fight — breaking. Rules: docs/rules/floor.md "동네 규칙".

const idx = (x: number, y: number) => y * DUNGEON.cols + x;
const isFloorAt = (tiles: Tile[], x: number, y: number) => x > 0 && y > 0 && x < DUNGEON.cols - 1 && y < DUNGEON.rows - 1 && tiles[idx(x, y)] === 'floor';

// Where a loop corridor leaves a room: a hand-made room's door nearest the other room, else its middle.
function door(r: Room, toward: Room) {
  const t = roomMid(toward);
  if (!r.tpl || r.tpl.doors.length === 0) return roomMid(r);
  return r.tpl.doors.reduce((best, d) => (Math.hypot(d.x - t.x, d.y - t.y) < Math.hypot(best.x - t.x, best.y - t.y) ? d : best), r.tpl.doors[0]!);
}

// Extra corridors between rooms that are near each other but not neighbours in the chain, so the floor
// has rounds: two ways into a room, a way back that is not the way you came.
export function addLoops(tiles: Tile[], rooms: Room[], d: District, rng: SeededRNG): void {
  const pairs: [Room, Room, number][] = [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 2; j < rooms.length; j++) {
      const span = dist(roomMid(rooms[i]!), roomMid(rooms[j]!));
      if (span <= d.loopReach) pairs.push([rooms[i]!, rooms[j]!, span]);
    }
  }
  pairs.sort((a, b) => a[2] - b[2]);
  const short = pairs.slice(0, d.loops * 2);
  for (let n = 0; n < d.loops && short.length > 0; n++) {
    const [a, b] = short.splice(rng.int(0, short.length - 1), 1)[0]!;
    corridor(tiles, door(a, b), door(b, a));
  }
}

// Every floor tile reachable from `from` (the start) — a prop that would cut some floor off is undone.
function connected(tiles: Tile[], from: { x: number; y: number }): boolean {
  const d = distances(tiles, from);
  for (let i = 0; i < tiles.length; i++) if (tiles[i] === 'floor' && d[i] === -1) return false;
  return true;
}

function weighted(kinds: District['kinds'], rng: SeededRNG): RoomKindId {
  let roll = rng.range(0, kinds.reduce((n, k) => n + k.weight, 0));
  for (const k of kinds) {
    roll -= k.weight;
    if (roll <= 0) return k.id;
  }
  return kinds[kinds.length - 1]!.id;
}

// Room kinds into plain rooms (never the start), and a hand-made room's 'p' cells as the district's prop.
// A furnished room lists its floor cells like a hand-made room, so things are only placed on floor.
export function furnish(tiles: Tile[], rooms: Room[], d: District, rng: SeededRNG): PropState[] {
  const props: PropState[] = [];
  const start = roomMid(rooms[0]!);
  let id = 1;
  const put = (art: PropArtId, x: number, y: number): boolean => {
    const def = PROPS[art];
    for (let j = y; j < y + def.h; j++) for (let i = x; i < x + def.w; i++) tiles[idx(i, j)] = 'wall';
    if (!connected(tiles, start)) {
      for (let j = y; j < y + def.h; j++) for (let i = x; i < x + def.w; i++) tiles[idx(i, j)] = 'floor';
      return false;
    }
    props.push({ id: id++, art, x, y, w: def.w, h: def.h, hp: def.hp });
    return true;
  };
  if (d.templateProp) {
    // (a corridor may have cut through a 'p' cell: that one stays floor, no prop)
    for (const r of rooms) for (const p of r.tpl?.props ?? []) if (tiles[idx(p.x, p.y)] === 'wall') props.push({ id: id++, art: d.templateProp, x: p.x, y: p.y, w: 1, h: 1, hp: null });
  }
  for (const r of rooms.slice(1)) {
    if (r.tpl || !rng.chance(d.kindChance)) continue;
    const fits = d.kinds.filter((k) => r.w >= ROOM_KINDS[k.id].min.w && r.h >= ROOM_KINDS[k.id].min.h);
    if (fits.length === 0) continue;
    const kind = weighted(fits, rng);
    for (const rule of ROOM_KINDS[kind].place) placeRule(r, rule, tiles, rng, put);
    const floor = [];
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (tiles[idx(x, y)] === 'floor') floor.push(centre(x, y));
    r.tpl = { id: kind, mirrored: false, floor, doors: [], spots: {}, props: [] };
  }
  return props;
}

// Inside a room, off its outer ring; a scattered prop keeps one free tile all round.
function placeRule(r: Room, rule: PlaceRule, tiles: Tile[], rng: SeededRNG, put: (art: PropArtId, x: number, y: number) => boolean): void {
  const def = PROPS[rule.art];
  const n = rng.int(rule.count[0], rule.count[1]);
  const x0 = r.x + 1;
  const x1 = r.x + r.w - 1 - def.w; // last top-left x that keeps the ring free
  const y0 = r.y + 1;
  const y1 = r.y + r.h - 1 - def.h;
  if (x1 < x0 || y1 < y0) return;
  const clear = (x: number, y: number, pad: number) => {
    for (let j = y - pad; j < y + def.h + pad; j++) for (let i = x - pad; i < x + def.w + pad; i++) if (!isFloorAt(tiles, i, j)) return false;
    return true;
  };
  if (rule.arrange === 'centre') {
    const x = r.x + Math.floor((r.w - def.w) / 2);
    const y = r.y + Math.floor((r.h - def.h) / 2);
    if (clear(x, y, 1)) put(rule.art, x, y);
    return;
  }
  if (rule.arrange === 'row') {
    const y = r.y + Math.floor((r.h - def.h) / 2) + rng.int(-1, 0);
    const step = def.w + 1 + rng.int(0, 1);
    let x = x0 + rng.int(0, 1);
    for (let k = 0; k < n && x <= x1; k++, x += step) if (clear(x, y, 0)) put(rule.art, x, y);
    return;
  }
  for (let k = 0, tries = 0; k < n && tries < 30; tries++) {
    const x = rng.int(x0, x1);
    const y = rng.int(y0, y1);
    if (clear(x, y, 1) && put(rule.art, x, y)) k++;
  }
}

// Neon signs on wall faces (a wall tile with floor right below it), spread `signGap` tiles apart.
// A prop's tiles are solid too but are not walls: no sign on them.
export function hangSigns(tiles: Tile[], props: PropState[], d: District, rng: SeededRNG): SignState[] {
  const onProp = new Set<number>();
  for (const p of props) for (let j = p.y; j < p.y + p.h; j++) for (let i = p.x; i < p.x + p.w; i++) onProp.add(idx(i, j));
  const faces: { x: number; y: number }[] = [];
  for (let y = 1; y < DUNGEON.rows - 1; y++) {
    for (let x = 1; x < DUNGEON.cols - 1; x++) {
      if (tiles[idx(x, y)] !== 'wall' || onProp.has(idx(x, y)) || onProp.has(idx(x, y - 1)) || !isFloorAt(tiles, x, y + 1)) continue;
      if (!isFloorAt(tiles, x - 1, y + 1) || !isFloorAt(tiles, x + 1, y + 1)) continue; // not in a 1-tile notch
      faces.push({ x, y });
    }
  }
  const signs: SignState[] = [];
  for (let tries = 0; tries < 60 && signs.length < d.signs && faces.length > 0; tries++) {
    const f = rng.pick(faces);
    if (signs.some((s) => Math.hypot(s.x - f.x, s.y - f.y) < d.signGap)) continue;
    signs.push({ ...f, art: rng.pick(d.signArts) });
  }
  return signs;
}

// The prop under a solid tile, if any.
export const propAt = (f: Floor, x: number, y: number) => f.props.find((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);

// A swing (reach, arc around aim) lands on breakable props whose nearest point is inside it: one blow
// each, whatever the damage. A broken prop frees its tiles, leaves debris and drops its spirit.
export function cutProps(f: Floor, reach: number, arc: number, aim: number): void {
  const p = f.player;
  for (const prop of [...f.props]) {
    if (prop.hp === null) continue;
    const nx = Math.max(prop.x, Math.min(p.x, prop.x + prop.w));
    const ny = Math.max(prop.y, Math.min(p.y, prop.y + prop.h));
    const mid = { x: prop.x + prop.w / 2, y: prop.y + prop.h / 2 };
    if (Math.hypot(nx - p.x, ny - p.y) > reach || angleDiff(Math.atan2(mid.y - p.y, mid.x - p.x), aim) > arc / 2 + 0.35) continue;
    prop.hp -= 1;
    f.events.push({ type: 'propHit', x: mid.x, y: mid.y, id: prop.id });
    if (prop.hp > 0) continue;
    f.props.splice(f.props.indexOf(prop), 1);
    for (let j = prop.y; j < prop.y + prop.h; j++) for (let i = prop.x; i < prop.x + prop.w; i++) f.tiles[idx(i, j)] = 'floor';
    f.flowFrom = -1; // ghosts path through the gap now
    f.debris.push(mid);
    const drop = PROPS[prop.art].drop;
    for (let k = 0; k < (drop?.count ?? 0); k++) {
      const a = (k / Math.max(1, drop!.count)) * Math.PI * 2 + prop.id;
      f.pickups.push({ x: mid.x + Math.cos(a) * 0.5, y: mid.y + Math.sin(a) * 0.4, value: Math.round(drop!.value * f.mods.pickupMult) });
    }
    f.events.push({ type: 'propBroken', x: mid.x, y: mid.y });
  }
}
