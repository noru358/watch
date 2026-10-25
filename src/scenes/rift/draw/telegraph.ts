import { FEEL, PALETTE } from '../../../data/feel.data';
import { WEAPONS } from '../../../data/weapons.data';
import type { Floor, Telegraph } from '../../../systems/rift';
import { T, type G } from '../../shared/draw/common';

// Floor warnings: yellow = counter with 발도, red = dodge. The fill grows until the strike.
export function drawTelegraph(g: G, t: Telegraph, f: Floor): void {
  const progress = 1 - Math.max(0, t.t) / t.total;
  const [a0, a1] = FEEL.telegraphFill;
  const col = t.parriable ? PALETTE.parriable : PALETTE.unparriable;
  // In the parry window the edge turns white: that is the cue to press 발도.
  const window = t.parriable && t.t <= WEAPONS[f.weapon].parryWindow;
  g.fillStyle(col, a0 + (a1 - a0) * progress);
  g.lineStyle(window ? 2 : 1, window ? 0xffffff : col, 0.9);
  const x = t.x * T;
  const y = t.y * T;
  switch (t.shape) {
    case 'circle':
      g.fillCircle(x, y, t.range * T * progress).strokeCircle(x, y, t.range * T);
      break;
    case 'cone':
      g.slice(x, y, t.range * T * progress, t.angle - t.width / 2, t.angle + t.width / 2).fillPath();
      g.slice(x, y, t.range * T, t.angle - t.width / 2, t.angle + t.width / 2).strokePath();
      break;
    case 'line': {
      const c = Math.cos(t.angle);
      const s = Math.sin(t.angle);
      const w = (t.width / 2) * T;
      const L = t.range * T;
      const pts = [
        { x: x - s * w, y: y + c * w },
        { x: x + c * L * progress - s * w, y: y + s * L * progress + c * w },
        { x: x + c * L * progress + s * w, y: y + s * L * progress - c * w },
        { x: x + s * w, y: y - c * w },
      ];
      g.fillPoints(pts, true);
      g.strokeRect(Math.min(x, x + c * L) - w, Math.min(y, y + s * L) - w, Math.abs(c * L) + w * 2, Math.abs(s * L) + w * 2);
      break;
    }
    case 'band':
      if (t.axis === 'row') g.fillRect(0, y - (t.width / 2) * T, f.cols * T, t.width * T).strokeRect(0, y - (t.width / 2) * T, f.cols * T, t.width * T);
      else g.fillRect(x - (t.width / 2) * T, 0, t.width * T, f.rows * T).strokeRect(x - (t.width / 2) * T, 0, t.width * T, f.rows * T);
      break;
  }
}
