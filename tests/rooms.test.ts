import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { SeededRNG } from '../src/core/SeededRNG';
import { ROOMS, type RoomId } from '../src/data/rooms.data';
import { generateFloor, type Floor } from '../src/systems/rift';
import type { FloorTheme } from '../src/types/ids';
import { carry } from './helpers';

const IDS = Object.keys(ROOMS) as RoomId[];
const WALK = new Set(['.', '+', 'e', 't', 's', 'o', '~']);

// Walkable cells of a template ('?' counted as wall: the room must work even when every '?' is wall).
function walkable(rows: readonly string[]): [number, number][] {
  const out: [number, number][] = [];
  rows.forEach((r, y) => [...r].forEach((c, x) => WALK.has(c) && out.push([x, y])));
  return out;
}

describe('hand-made rooms (rooms.data.ts)', () => {
  for (const id of IDS) {
    const rows = ROOMS[id].rows as readonly string[];
    it(`${id}: shape, doors, spots, one connected floor`, () => {
      const w = rows[0]!.length;
      expect(rows.every((r) => r.length === w), 'every row the same length').toBe(true);
      expect(w).toBeGreaterThanOrEqual(7);
      expect(w).toBeLessThanOrEqual(15);
      expect(rows.length).toBeGreaterThanOrEqual(5);
      expect(rows.length).toBeLessThanOrEqual(11);
      expect(rows.every((r) => /^[#.+pets o~?]+$/.test(r)), 'only known letters').toBe(true);
      const doors: [number, number][] = [];
      rows.forEach((r, y) => [...r].forEach((c, x) => c === '+' && doors.push([x, y])));
      expect(doors.length).toBeGreaterThanOrEqual(2);
      for (const [x, y] of doors) expect(x === 0 || y === 0 || x === w - 1 || y === rows.length - 1, `door ${x},${y} on the edge`).toBe(true);
      expect(rows.join('').split('e').length - 1).toBeLessThanOrEqual(6);
      const cells = walkable(rows);
      const key = (x: number, y: number) => `${x},${y}`;
      const all = new Set(cells.map(([x, y]) => key(x, y)));
      const seen = new Set([key(...cells[0]!)]);
      const q = [cells[0]!];
      for (let h = 0; h < q.length; h++) {
        const [x, y] = q[h]!;
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as const) {
          if (all.has(key(nx, ny)) && !seen.has(key(nx, ny))) {
            seen.add(key(nx, ny));
            q.push([nx, ny]);
          }
        }
      }
      expect(seen.size, 'all floor joined').toBe(all.size);
    });
  }
});

// Walking distance (tiles) from the director's start.
function walk(f: Floor): Int32Array {
  const d = new Int32Array(f.cols * f.rows).fill(-1);
  const s = Math.floor(f.player.y) * f.cols + Math.floor(f.player.x);
  d[s] = 0;
  const q = [s];
  for (let h = 0; h < q.length; h++) {
    const i = q[h]!;
    for (const j of [i + 1, i - 1, i + f.cols, i - f.cols]) {
      if (j < 0 || j >= d.length || d[j] !== -1 || f.tiles[j] !== 'floor') continue;
      d[j] = d[i]! + 1;
      q.push(j);
    }
  }
  return d;
}
const plan = (theme: FloorTheme) => ({ kind: 'normal', enemies: 6, pool: ['cheonyeo', 'dalgyal'], payphone: true, swarm: null, objective: 'clear', goal: false, theme }) as const;

describe('floors with hand-made rooms', () => {
  it('200 floors: stairs, every ghost and every pickup can be walked to', () => {
    const themes: FloorTheme[] = ['alley', 'basement', 'arcade', 'rooftop'];
    let used = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const f = generateFloor(0, plan(themes[seed % 4]!), new SeededRNG(seed), carry());
      const d = walk(f);
      const at = (p: { x: number; y: number }) => d[Math.floor(p.y) * f.cols + Math.floor(p.x)]!;
      expect(at(f.stairs!), `seed ${seed} stairs`).toBeGreaterThan(0);
      for (const e of f.enemies) expect(at(e), `seed ${seed} ${e.kind}`).toBeGreaterThanOrEqual(0);
      for (const k of f.pickups) expect(at(k), `seed ${seed} pickup`).toBeGreaterThanOrEqual(0);
      if (f.payphone) expect(at(f.payphone), `seed ${seed} payphone`).toBeGreaterThan(0);
      used += f.tiles.length; // touch
    }
    expect(used).toBeGreaterThan(0);
  });

  it('a theme without hand-made rooms keeps exactly the maps it had', () => {
    // Recorded before hand-made rooms existed (2026-11-11).
    const before = '1:be935c5c6c7947af,2:70a3c52bf1dbbea4,3:189f1fb0ba0ba8d7,4:2d442863ce141445,5:71fb8a7275daf66d,6:986ba6e80752daf1,7:656ec081f6bd54e6,8:01fdf2bb856b000c';
    const now = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => {
      const f = generateFloor(0, plan('lot'), new SeededRNG(seed), carry());
      return `${seed}:${createHash('sha1').update(f.tiles.join('') + JSON.stringify(f.enemies.map((e) => [e.kind, e.x, e.y])) + JSON.stringify(f.stairs) + JSON.stringify(f.pickups)).digest('hex').slice(0, 16)}`;
    });
    expect(now.join(',')).toBe(before);
  });
});
