import { FEEL, FLOOR_THEMES, PALETTE } from '../../../data/feel.data';
import type { Floor } from '../../../systems/rift';
import { T, type G } from '../../shared/draw/common';
import { TILE_PAINTERS } from './streetTiles';

// Floor and walls in the 3/4 view: wall tops are raised by `wallFace` px with a front face below.
// A prop's tiles are solid for walking but drawn as floor (the prop stands on them, draw/props.ts).
// A district with its own tile look paints through TILE_PAINTERS; the rest keep the plain slabs.
export function drawTiles(m: G, f: Floor): void {
  const propCell = new Set<number>();
  for (const p of f.props) for (let j = p.y; j < p.y + p.h; j++) for (let i = p.x; i < p.x + p.w; i++) propCell.add(j * f.cols + i);
  const wall = (x: number, y: number) => !(x >= 0 && y >= 0 && x < f.cols && y < f.rows && (f.tiles[y * f.cols + x] === 'floor' || propCell.has(y * f.cols + x)));
  const c = FLOOR_THEMES[f.theme];
  const paint = TILE_PAINTERS[f.theme];
  m.clear();
  m.fillStyle(PALETTE.gridWall).fillRect(-T * 4, -T * 4, (f.cols + 8) * T, (f.rows + 8) * T);
  for (let y = 0; y < f.rows; y++) {
    for (let x = 0; x < f.cols; x++) {
      if (wall(x, y)) continue;
      if (paint) {
        paint.floor(m, x, y);
        continue;
      }
      const px = x * T;
      const py = y * T;
      // concrete slab with a seam, a speck and the odd crack (positions from the tile coords, so stable)
      m.fillStyle((x + y) % 2 ? c.floor : c.floorAlt).fillRect(px, py, T, T);
      m.fillStyle(c.seam).fillRect(px + T - 1, py, 1, T).fillRect(px, py + T - 1, T, 1);
      m.fillStyle(c.speck).fillRect(px + ((x * 7 + y * 3) % 11) + 2, py + ((x * 5 + y * 9) % 10) + 2, 2, 1);
      if ((x * 3 + y) % 7 === 0) {
        m.fillStyle(c.crack);
        for (const [i, j] of [[3, 4], [4, 5], [5, 5], [6, 6], [6, 7], [7, 8], [9, 8]] as const) m.fillRect(px + i, py + j, 1, 1);
      }
    }
  }
  // Walls that border floor: raised top + front face (plaster above, green paint below) where the floor is below.
  const fh = FEEL.wallFace;
  for (let y = 0; y < f.rows; y++) {
    for (let x = 0; x < f.cols; x++) {
      if (!wall(x, y)) continue;
      const nearFloor = !wall(x, y + 1) || !wall(x, y - 1) || !wall(x + 1, y) || !wall(x - 1, y);
      if (!nearFloor) continue;
      const px = x * T;
      const top = y * T - fh;
      if (paint) {
        paint.wallTop(m, x, y);
        if (!wall(x, y + 1)) paint.wallFace(m, x, y);
        continue;
      }
      m.fillStyle(c.wallTop).fillRect(px, top, T, T);
      if (!wall(x, y + 1)) {
        const face = y * T + T - fh;
        m.fillStyle(c.wallTopEdge).fillRect(px, face - 1, T, 1);
        m.fillStyle(c.plaster).fillRect(px, face, T, 3);
        m.fillStyle(c.trim).fillRect(px, face + 3, T, 1);
        m.fillStyle(c.face).fillRect(px, face + 4, T, fh - 4);
        m.fillStyle(c.faceHi).fillRect(px, face + 4, T, 1);
        m.fillStyle(c.faceLo).fillRect(px, face + fh - 1, T, 1);
        m.fillStyle(0x000000, 0.3).fillRect(px, y * T + T, T, 2);
      }
    }
  }
  // where props were broken: a scatter of scraps
  for (const d of f.debris) {
    const px = d.x * T;
    const py = d.y * T;
    for (const [i, j, w] of [[-7, 2, 3], [-2, 5, 2], [4, 1, 3], [6, 6, 2], [-5, -3, 2], [1, -2, 1]] as const) {
      m.fillStyle(0x2a2632).fillRect(px + i, py + j + 1, w, 1);
      m.fillStyle(0x6c6878).fillRect(px + i, py + j, w, 1);
    }
  }
}
