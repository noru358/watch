import { DUNGEON } from '../../data/dungeon.data';
import type { Body, Floor, Pos, Telegraph } from './types';

export const dist = (a: Pos, b: Pos) => Math.hypot(a.x - b.x, a.y - b.y);

export function angleDiff(a: number, b: number): number {
  const d = (((a - b) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2);
  return Math.abs(d - Math.PI);
}

export function isFloor(f: Pick<Floor, 'cols' | 'rows' | 'tiles'>, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < f.cols && y < f.rows && f.tiles[y * f.cols + x] === 'floor';
}

function blockedBox(f: Floor, x: number, y: number, r: number): boolean {
  for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) {
    for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) if (!isFloor(f, tx, ty)) return true;
  }
  return false;
}

// Moves a body against the tile grid, one axis at a time so it slides along walls.
// Returns true if any axis was blocked.
export function moveBody(f: Floor, b: Body, dx: number, dy: number): boolean {
  let hit = false;
  if (dx !== 0) {
    if (!blockedBox(f, b.x + dx, b.y, b.r)) b.x += dx;
    else hit = true;
  }
  if (dy !== 0) {
    if (!blockedBox(f, b.x, b.y + dy, b.r)) b.y += dy;
    else hit = true;
  }
  return hit;
}

// Straight line clear of walls (sampled every losStep tiles).
export function lineOfSight(f: Floor, a: Pos, b: Pos): boolean {
  const d = dist(a, b);
  const n = Math.ceil(d / DUNGEON.losStep);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (!isFloor(f, Math.floor(a.x + (b.x - a.x) * t), Math.floor(a.y + (b.y - a.y) * t))) return false;
  }
  return true;
}

const tileIndex = (f: Floor, p: Pos) => Math.floor(p.y) * f.cols + Math.floor(p.x);

// BFS distance (in tiles) from the director, rebuilt when they change tile.
export function updateFlow(f: Floor): void {
  const from = tileIndex(f, f.player);
  if (from === f.flowFrom) return;
  f.flowFrom = from;
  f.flow.fill(-1);
  f.flow[from] = 0;
  const q = [from];
  for (let h = 0; h < q.length; h++) {
    const i = q[h]!;
    const x = i % f.cols;
    const y = (i - x) / f.cols;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as const) {
      if (!isFloor(f, nx, ny)) continue;
      const j = ny * f.cols + nx;
      if (f.flow[j] !== -1) continue;
      f.flow[j] = f.flow[i]! + 1;
      q.push(j);
    }
  }
}

// Direction an enemy should walk: straight at the director if visible, else downhill on the flow field.
export function steer(f: Floor, b: Body): Pos {
  const p = f.player;
  if (lineOfSight(f, b, p)) {
    const d = dist(b, p) || 1;
    return { x: (p.x - b.x) / d, y: (p.y - b.y) / d };
  }
  const x = Math.floor(b.x);
  const y = Math.floor(b.y);
  let best = { x: 0, y: 0 };
  let bestD = f.flow[y * f.cols + x] ?? -1;
  for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as const) {
    if (!isFloor(f, nx, ny)) continue;
    const d = f.flow[ny * f.cols + nx]!;
    if (d >= 0 && (bestD < 0 || d < bestD)) {
      bestD = d;
      best = { x: nx + 0.5 - b.x, y: ny + 0.5 - b.y };
    }
  }
  const len = Math.hypot(best.x, best.y) || 1;
  return { x: best.x / len, y: best.y / len };
}

// Is a point (with radius) inside a telegraphed area?
export function inTelegraph(t: Telegraph, p: Pos, r: number): boolean {
  const dx = p.x - t.x;
  const dy = p.y - t.y;
  switch (t.shape) {
    case 'circle':
      return Math.hypot(dx, dy) <= t.range + r;
    case 'cone':
      return Math.hypot(dx, dy) <= t.range + r && angleDiff(Math.atan2(dy, dx), t.angle) <= t.width / 2; // cone: width = arc in radians
    case 'line': {
      const along = dx * Math.cos(t.angle) + dy * Math.sin(t.angle);
      const across = -dx * Math.sin(t.angle) + dy * Math.cos(t.angle);
      return along >= -r && along <= t.range + r && Math.abs(across) <= t.width / 2 + r;
    }
    case 'band':
      return t.axis === 'row' ? Math.abs(dy) <= t.width / 2 + r : Math.abs(dx) <= t.width / 2 + r;
  }
}

export function savePrev(b: Body): void {
  b.prevX = b.x;
  b.prevY = b.y;
}
