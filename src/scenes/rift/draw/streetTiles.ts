import { FEEL } from '../../../data/feel.data';
import type { FloorTheme } from '../../../types/ids';
import type { G } from '../../shared/draw/common';
import { T } from '../../shared/draw/common';

// Hand-painted tile looks for districts that have them (docs/design/5-business/art.md "개체별 규격":
// floor 24×24, wall top 24 + face 13). Every detail is placed from the tile coordinates, so a floor
// looks the same each time it is drawn. A theme without a painter keeps the plain slabs in tiles.ts.

export interface TilePainter {
  floor: (m: G, x: number, y: number) => void;
  wallTop: (m: G, x: number, y: number) => void;
  wallFace: (m: G, x: number, y: number) => void; // the front face under a wall that has floor below
}

// A small stable hash of a tile, 0..1.
const h = (x: number, y: number, salt = 0) => {
  let n = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

// 노포 골목: patched asphalt with manholes and drain grates; red brick walls, the odd roll shutter.
const ALLEY = {
  asphalt: 0x3e3a48,
  asphaltAlt: 0x423e4c,
  grit: 0x55506a,
  gritDark: 0x2f2b38,
  crack: 0x2a2632,
  patch: 0x36323f,
  patchEdge: 0x4a4658,
  iron: 0x2f3040,
  ironHi: 0x5a5c70,
  ironLo: 0x1f1f2a,
  roofTop: 0x2b2230,
  roofEdge: 0x45384a,
  roofTar: 0x231b28,
  brick: 0x8a4a46,
  brickHi: 0xa05a54,
  brickLo: 0x6a3836,
  mortar: 0x4e3036,
  shutter: 0x6c6878,
  shutterHi: 0x8d8c98,
  shutterLo: 0x4a4658,
  pipe: 0x5e6274,
  pipeHi: 0x8d92a3,
} as const;

const alley: TilePainter = {
  floor(m, x, y) {
    const c = ALLEY;
    const px = x * T;
    const py = y * T;
    m.fillStyle(h(x, y, 1) < 0.5 ? c.asphalt : c.asphaltAlt).fillRect(px, py, T, T);
    // grit: a few light and dark specks
    for (let k = 0; k < 6; k++) {
      const gx = Math.floor(h(x, y, 10 + k) * (T - 2));
      const gy = Math.floor(h(x, y, 20 + k) * (T - 2));
      m.fillStyle(k % 2 ? c.grit : c.gritDark).fillRect(px + gx, py + gy, k % 3 === 0 ? 2 : 1, 1);
    }
    const roll = h(x, y, 2);
    if (roll < 0.05) {
      // manhole cover
      const cx = px + T / 2;
      const cy = py + T / 2;
      m.fillStyle(c.ironLo).fillCircle(cx, cy + 1, 9);
      m.fillStyle(c.iron).fillCircle(cx, cy, 9);
      m.fillStyle(c.ironHi);
      for (let j = -6; j <= 6; j += 3) m.fillRect(cx - 6, cy + j, 12, 1);
      m.fillStyle(c.ironLo).fillRect(cx - 9, cy, 1, 1).fillRect(cx + 8, cy, 1, 1);
    } else if (roll < 0.09) {
      // drain grate
      m.fillStyle(c.ironLo).fillRect(px + 4, py + 7, 16, 10);
      m.fillStyle(c.iron).fillRect(px + 4, py + 7, 16, 9);
      m.fillStyle(c.ironLo);
      for (let i = 6; i < 19; i += 3) m.fillRect(px + i, py + 9, 1, 6);
      m.fillStyle(c.ironHi).fillRect(px + 4, py + 7, 16, 1);
    } else if (roll < 0.18) {
      // patched asphalt
      const w = 10 + Math.floor(h(x, y, 3) * 10);
      const hh = 8 + Math.floor(h(x, y, 4) * 10);
      const ox = Math.floor(h(x, y, 5) * (T - w));
      const oy = Math.floor(h(x, y, 6) * (T - hh));
      m.fillStyle(c.patch).fillRect(px + ox, py + oy, w, hh);
      m.fillStyle(c.patchEdge).fillRect(px + ox, py + oy, w, 1).fillRect(px + ox, py + oy, 1, hh);
    } else if (roll < 0.3) {
      // a crack that wanders across
      m.fillStyle(c.crack);
      let cx = Math.floor(h(x, y, 7) * 8) + 2;
      for (let j = 2; j < T - 2; j++) {
        m.fillRect(px + cx, py + j, 1, 1);
        if (h(x, y, 30 + j) < 0.35) cx += h(x, y, 60 + j) < 0.5 ? -1 : 1;
        cx = Math.max(1, Math.min(T - 2, cx));
      }
    }
  },
  wallTop(m, x, y) {
    const c = ALLEY;
    const px = x * T;
    const top = y * T - FEEL.wallFace;
    m.fillStyle(c.roofTop).fillRect(px, top, T, T);
    if (h(x, y, 8) < 0.3) m.fillStyle(c.roofTar).fillRect(px + 3 + Math.floor(h(x, y, 9) * 10), top + 4 + Math.floor(h(x, y, 11) * 10), 7, 3);
  },
  wallFace(m, x, y) {
    const c = ALLEY;
    const fh = FEEL.wallFace;
    const px = x * T;
    const face = y * T + T - fh;
    m.fillStyle(c.roofEdge).fillRect(px, face - 1, T, 1);
    const roll = h(x, y, 12);
    if (roll < 0.14) {
      // a roll shutter, ribbed
      m.fillStyle(c.shutter).fillRect(px, face, T, fh);
      m.fillStyle(c.shutterHi);
      for (let j = 1; j < fh; j += 2) m.fillRect(px, face + j, T, 1);
      m.fillStyle(c.shutterLo).fillRect(px, face + fh - 2, T, 2).fillRect(px + 10, face + fh - 4, 4, 2);
    } else {
      // brick: courses 3px high, bricks 8px long, every other course offset
      m.fillStyle(c.brick).fillRect(px, face, T, fh);
      m.fillStyle(c.mortar);
      for (let j = 0; j < fh; j += 3) {
        m.fillRect(px, face + j, T, 1);
        const off = (j / 3) % 2 ? 4 : 0;
        for (let i = off; i < T; i += 8) m.fillRect(px + i, face + j, 1, 3);
      }
      // a few lighter or darker bricks
      for (let k = 0; k < 3; k++) {
        const bx = Math.floor(h(x, y, 40 + k) * 3) * 8 + 1 + ((k % 2) * 4);
        const by = 1 + Math.floor(h(x, y, 50 + k) * 4) * 3;
        if (by + 2 > fh) continue;
        m.fillStyle(k === 1 ? c.brickLo : c.brickHi).fillRect(px + Math.min(bx, T - 7), face + by, 7, 2);
      }
      if (roll > 0.9) {
        // a drain pipe running down
        m.fillStyle(c.pipe).fillRect(px + 17, face, 3, fh);
        m.fillStyle(c.pipeHi).fillRect(px + 17, face, 1, fh);
      }
    }
    m.fillStyle(0x000000, 0.3).fillRect(px, y * T + T, T, 2);
  },
};

export const TILE_PAINTERS: Readonly<Partial<Record<FloorTheme, TilePainter>>> = { alley };
