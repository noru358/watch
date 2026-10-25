import { FEEL, PALETTE } from '../../../data/feel.data';
import type { Floor } from '../../../systems/rift';
import { T, type G } from './common';

// Floor and walls in the 3/4 view: wall tops are raised by `wallFace` px with a front face below.
export function drawTiles(m: G, f: Floor): void {
  const wall = (x: number, y: number) => !(x >= 0 && y >= 0 && x < f.cols && y < f.rows && f.tiles[y * f.cols + x] === 'floor');
  m.clear();
  m.fillStyle(PALETTE.gridWall).fillRect(-T * 4, -T * 4, (f.cols + 8) * T, (f.rows + 8) * T);
  for (let y = 0; y < f.rows; y++) {
    for (let x = 0; x < f.cols; x++) {
      if (wall(x, y)) continue;
      m.fillStyle((x + y) % 2 ? PALETTE.gridFloor : PALETTE.gridFloorAlt).fillRect(x * T, y * T, T, T);
    }
  }
  // Walls that border floor: raised top + front face where the floor is below.
  for (let y = 0; y < f.rows; y++) {
    for (let x = 0; x < f.cols; x++) {
      if (!wall(x, y)) continue;
      const nearFloor = !wall(x, y + 1) || !wall(x, y - 1) || !wall(x + 1, y) || !wall(x - 1, y);
      if (!nearFloor) continue;
      m.fillStyle(PALETTE.wallTop).fillRect(x * T, y * T - FEEL.wallFace, T, T);
      if (!wall(x, y + 1)) {
        m.fillStyle(PALETTE.wallFace).fillRect(x * T, y * T + T - FEEL.wallFace, T, FEEL.wallFace);
        m.fillStyle(0x000000, 0.25).fillRect(x * T, y * T + T, T, 2);
      }
    }
  }
}
