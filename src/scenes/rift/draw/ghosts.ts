import { FEEL, PALETTE } from '../../../data/feel.data';
import type { Enemy } from '../../../systems/rift';
import { lerp, shadow, T, type G } from './common';

// One case per ghost kind. A new ghost in ghosts.data.ts needs one case here.
// `flashing`: the white hit flash (timed by RiftView).
export function drawGhost(g: G, e: Enemy, alpha: number, clock: number, flashing: boolean): void {
  const x = lerp(e.prevX, e.x, alpha) * T;
  const y = lerp(e.prevY, e.y, alpha) * T;
  const r = e.r * T;
  const col = flashing ? 0xffffff : PALETTE[e.kind];
  const float = Math.sin(clock * 3 + e.id) * FEEL.ghostFloat;
  const fade = e.state === 'warp' ? 0.25 : 0.88 + 0.12 * Math.sin(clock * 5 + e.id);
  shadow(g, x, y, r * 0.8);
  const fy = y - r - 3 + float;
  switch (e.kind) {
    case 'cheonyeo':
      g.fillStyle(col, fade).fillTriangle(x - r, fy + r, x + r, fy + r, x, fy - r * 0.6); // white dress
      g.fillStyle(PALETTE.skin, fade).fillCircle(x, fy - r * 0.6, r * 0.45);
      g.fillStyle(0x0b0a14, fade).fillRect(x - r * 0.55, fy - r * 1.1, r * 1.1, r * 1.3); // long hair over the face
      break;
    case 'dalgyal':
      g.fillStyle(col, fade).fillEllipse(x, fy, r * 1.7, r * 2.1); // a featureless egg face
      break;
    case 'subway':
      g.fillStyle(col, fade).fillRect(x - r, fy - r, r * 2, r * 1.6);
      g.fillStyle(0xfff3b0, fade * 0.8).fillRect(x - r * 0.7, fy - r * 0.6, r * 0.5, r * 0.4).fillRect(x + r * 0.2, fy - r * 0.6, r * 0.5, r * 0.4);
      break;
    case 'dokkaebibul': {
      // A will-o'-wisp: flickering blue flame, no body.
      const flick = 0.75 + 0.25 * Math.sin(clock * 18 + e.id);
      g.fillStyle(col, 0.35 * flick).fillCircle(x, fy, r * 1.6);
      g.fillStyle(col, flick).fillTriangle(x - r, fy + r * 0.6, x + r, fy + r * 0.6, x, fy - r * 1.6);
      g.fillStyle(0xffffff, 0.8 * flick).fillCircle(x, fy + r * 0.1, r * 0.4);
      break;
    }
    case 'printer': {
      g.fillStyle(col, 1).fillRoundedRect(x - r * 1.2, fy - r * 0.9, r * 2.4, r * 1.6, 4);
      const roll = (clock * 6) % 1;
      g.fillStyle(0x0b0a14, 1).fillRect(x - r, fy - 2, r * 2, 4);
      g.fillStyle(0xf4f0d8, 1).fillRect(x - r + roll * r * 1.6, fy - 1, r * 0.4, 2); // paper rolling out
      break;
    }
  }
  if (e.state === 'stun') g.lineStyle(1, PALETTE.parriable, 0.9).strokeCircle(x, fy - r - 3, 3);
  if (e.kind !== 'printer' && e.hp < e.maxHp) {
    g.fillStyle(PALETTE.hpBarBack).fillRect(x - r, y + 3, r * 2, 2);
    g.fillStyle(PALETTE.hpBar).fillRect(x - r, y + 3, (r * 2 * Math.max(0, e.hp)) / e.maxHp, 2);
  }
}
