import { PALETTE } from '../../../data/feel.data';
import { stairsOpen, type Floor } from '../../../systems/rift';
import { PAYPHONE_ART } from './art/propArt';
import { shadow, T, type G } from '../../shared/draw/common';
import { drawPixelSprite, gridSprite } from '../../shared/draw/pixelSprite';

// Things on the floor that are not bodies: stairs, the payphone, spirit pickups.
export function drawProps(g: G, f: Floor, clock: number): void {
  if (f.stairs) {
    const sx = f.stairs.x * T;
    const sy = f.stairs.y * T;
    const k = T / 16;
    const open = stairsOpen(f);
    if (open) g.fillStyle(PALETTE.stairs, 0.25 + 0.15 * Math.sin(clock * 3)).fillCircle(sx, sy, 9 * k);
    g.fillStyle(open ? PALETTE.stairs : PALETTE.wall).fillRect(sx - 6 * k, sy - 6 * k, 12 * k, 12 * k);
    g.fillStyle(PALETTE.background).fillRect(sx - 4 * k, sy - k, 8 * k, 3 * k);
    if (!open) {
      // sealed: a red talisman cross over the hatch
      g.fillStyle(PALETTE.unparriable, 0.85).fillRect(sx - 7 * k, sy - k * 0.5, 14 * k, k).fillRect(sx - k * 0.5, sy - 7 * k, k, 14 * k);
    }
  }
  if (f.payphone) {
    const sx = f.payphone.x * T;
    const sy = f.payphone.y * T;
    shadow(g, sx, sy, 7);
    drawPixelSprite(g, gridSprite(PAYPHONE_ART.rows, PAYPHONE_ART.pal), sx, sy + 1, false);
  }
  for (const k of f.pickups) {
    const px = k.x * T;
    const py = k.y * T - 3 + Math.sin(clock * 4 + k.x) * 1.5;
    g.fillStyle(PALETTE.pickup).fillTriangle(px, py - 4, px + 3, py, px - 3, py).fillTriangle(px, py + 4, px + 3, py, px - 3, py);
  }
}
