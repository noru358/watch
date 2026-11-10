import { FEEL, PALETTE } from '../../../data/feel.data';
import type { Enemy } from '../../../systems/rift';
import { GHOST_ART, GUMIHO_ART } from './art/ghostArt';
import { lerp, shadow, T, type G } from '../../shared/draw/common';
import { drawPixelSprite, gridSprite } from '../../shared/draw/pixelSprite';

// One case per ghost kind. A new ghost in ghosts.data.ts needs one case here.
// `flashing`: the white hit flash (timed by RiftView).
export function drawGhost(g: G, e: Enemy, alpha: number, clock: number, flashing: boolean, phase2 = false): void {
  const x = lerp(e.prevX, e.x, alpha) * T;
  const y = lerp(e.prevY, e.y, alpha) * T;
  const r = e.r * T;
  const col = flashing ? 0xffffff : PALETTE[e.kind];
  const float = Math.sin(clock * 3 + e.id) * FEEL.ghostFloat;
  const fade = e.state === 'warp' ? 0.25 : 0.88 + 0.12 * Math.sin(clock * 5 + e.id);
  const art = e.kind === 'gumiho' ? GUMIHO_ART[phase2 ? 2 : 1] : GHOST_ART[e.kind];
  if (art) {
    const s = gridSprite(art.rows, art.pal);
    const flick = e.kind === 'dokkaebibul' ? 0.75 + 0.25 * Math.sin(clock * 18 + e.id) : fade;
    shadow(g, x, y, (s.w * art.scale) / 3);
    const top = y - 3 + float - s.h * art.scale;
    drawPixelSprite(g, s, x, y - 3 + float, e.face < 0, flick, flashing, art.scale);
    if (e.state === 'stun') g.lineStyle(1, PALETTE.parriable, 0.9).strokeCircle(x, top - 3, 3);
    if (e.kind !== 'gumiho' && e.hp < e.maxHp) {
      g.fillStyle(PALETTE.hpBarBack).fillRect(x - r, y + 3, r * 2, 2);
      g.fillStyle(PALETTE.hpBar).fillRect(x - r, y + 3, (r * 2 * Math.max(0, e.hp)) / e.maxHp, 2);
    }
    return;
  }
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
    case 'grabber': {
      // Placeholder: a dark puddle that is always there; a hand rises out of it when it is up.
      g.fillStyle(PALETTE.puddle, 0.9).fillEllipse(x, y, r * 3, r * 1.3);
      if (e.state !== 'warp') {
        g.fillStyle(col, fade).fillRect(x - r * 0.3, fy - r * 0.4, r * 0.6, r * 1.2);
        g.fillStyle(col, fade).fillCircle(x, fy - r * 0.5, r * 0.45);
      }
      break;
    }
    case 'leaper':
      g.fillStyle(col, fade).fillTriangle(x - r * 1.1, fy + r * 0.8, x + r * 1.1, fy + r * 0.8, x, fy - r * 0.9); // crouched
      g.fillStyle(0x0b0a14, fade).fillCircle(x - r * 0.3, fy, r * 0.15).fillCircle(x + r * 0.3, fy, r * 0.15);
      break;
    case 'burster': {
      const fuse = e.teles[0];
      const swell = fuse ? 1 + 0.6 * (1 - Math.max(0, fuse.t) / fuse.total) : 1;
      g.fillStyle(col, fade).fillCircle(x, fy, r * swell);
      g.fillStyle(0xffffff, 0.6 * fade).fillCircle(x - r * 0.3 * swell, fy - r * 0.3 * swell, r * 0.25 * swell);
      break;
    }
    case 'shooter':
      g.fillStyle(col, fade).fillRect(x - r * 0.45, fy - r, r * 0.9, r * 2);
      g.fillStyle(col, fade).fillRect(x + (e.face > 0 ? r * 0.45 : -r * 1.2), fy - r * 0.3, r * 0.75, r * 0.3); // the throwing hand
      break;
    case 'rallier':
      g.fillStyle(col, fade).fillTriangle(x - r * 0.4, fy - r * 0.4, x - r * 0.4, fy + r * 0.4, x + r, fy); // a horn
      g.fillStyle(col, fade).fillRect(x - r, fy - r * 0.3, r * 0.6, r * 0.6);
      break;
    case 'sweller':
      g.fillStyle(col, 0.9).fillCircle(x, fy, r);
      g.fillStyle(0xffffff, 0.8).fillCircle(x - r * 0.3, fy - r * 0.2, Math.max(1, r * 0.12)).fillCircle(x + r * 0.3, fy - r * 0.2, Math.max(1, r * 0.12));
      break;
    case 'thief':
      g.fillStyle(col, fade).fillEllipse(x, fy, r * 1.6, r * 1.4);
      if (e.vars.carry) g.fillStyle(PALETTE.accent, 1).fillRect(x - r * 0.3, fy - r * 1.4, r * 0.6, r * 0.6); // what it took
      break;
    case 'dokkaebi': {
      // Placeholder: a squat body with one horn; the club points where it guards.
      g.fillStyle(col, fade).fillRect(x - r * 0.8, fy - r * 0.7, r * 1.6, r * 1.7);
      g.fillStyle(col, fade).fillTriangle(x - r * 0.25, fy - r * 0.7, x + r * 0.25, fy - r * 0.7, x, fy - r * 1.4);
      g.lineStyle(3, 0x5a3a22, fade).lineBetween(x, fy + r * 0.2, x + Math.cos(e.aim) * r * 1.6, fy + r * 0.2 + Math.sin(e.aim) * r * 1.6);
      break;
    }
    case 'dokkaebibul': {
      // A will-o'-wisp: flickering blue flame, no body.
      const flick = 0.75 + 0.25 * Math.sin(clock * 18 + e.id);
      g.fillStyle(col, 0.35 * flick).fillCircle(x, fy, r * 1.6);
      g.fillStyle(col, flick).fillTriangle(x - r, fy + r * 0.6, x + r, fy + r * 0.6, x, fy - r * 1.6);
      g.fillStyle(0xffffff, 0.8 * flick).fillCircle(x, fy + r * 0.1, r * 0.4);
      break;
    }
  }
  if (e.state === 'stun') g.lineStyle(1, PALETTE.parriable, 0.9).strokeCircle(x, fy - r - 3, 3);
  if (e.hp < e.maxHp) {
    g.fillStyle(PALETTE.hpBarBack).fillRect(x - r, y + 3, r * 2, 2);
    g.fillStyle(PALETTE.hpBar).fillRect(x - r, y + 3, (r * 2 * Math.max(0, e.hp)) / e.maxHp, 2);
  }
}
