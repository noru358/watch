import { PALETTE } from '../../../data/feel.data';
import type { Floor } from '../../../systems/rift';
import { shadow, T, type G } from './common';

// Things on the floor that are not bodies: stairs, the payphone, spirit pickups.
export function drawProps(g: G, f: Floor, clock: number): void {
  if (f.stairs) {
    const sx = f.stairs.x * T;
    const sy = f.stairs.y * T;
    g.fillStyle(PALETTE.stairs, 0.25 + 0.15 * Math.sin(clock * 3)).fillCircle(sx, sy, 9);
    g.fillStyle(PALETTE.stairs).fillRect(sx - 6, sy - 6, 12, 12);
    g.fillStyle(PALETTE.background).fillRect(sx - 4, sy - 1, 8, 3);
  }
  if (f.payphone) {
    const sx = f.payphone.x * T;
    const sy = f.payphone.y * T;
    shadow(g, sx, sy, 5);
    g.fillStyle(PALETTE.payphone).fillRect(sx - 4, sy - 14, 8, 14);
    g.fillStyle(0x0b0a14).fillRect(sx - 2, sy - 11, 4, 4);
  }
  for (const k of f.pickups) {
    const px = k.x * T;
    const py = k.y * T - 3 + Math.sin(clock * 4 + k.x) * 1.5;
    g.fillStyle(PALETTE.pickup).fillTriangle(px, py - 4, px + 3, py, px - 3, py).fillTriangle(px, py + 4, px + 3, py, px - 3, py);
  }
}
