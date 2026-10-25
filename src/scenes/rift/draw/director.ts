import { FEEL, PALETTE } from '../../../data/feel.data';
import { EXORCISTS } from '../../../data/protagonist.data';
import { DIRECTOR_SPRITE, type DirectorAnim } from '../../../data/sprites.data';
import { WEAPONS } from '../../../data/weapons.data';
import type { Floor, Player } from '../../../systems/rift';
import { lerp, shadow, T, type G } from './common';
import { drawPixelSprite, type PixelSprite } from './pixelSprite';

type FrameLookup = (frame: number) => PixelSprite | null;

// Which animation and frame to show, from the player's render hints.
function pickFrame(p: Player, clock: number): { anim: DirectorAnim; frame: number } {
  const up = Math.sin(p.aim) < -0.3;
  const hurt = p.iframes > EXORCISTS.director.hurtIframes - DIRECTOR_SPRITE.hurtShow && p.dashT <= 0;
  const anim: DirectorAnim = hurt ? 'hurt' : p.dashT > 0 ? 'dash' : up ? (p.moving ? 'upWalk' : 'upIdle') : p.moving ? 'walk' : 'idle';
  const list = DIRECTOR_SPRITE.frames[anim];
  return { anim, frame: list[Math.floor(clock * DIRECTOR_SPRITE.fps) % list.length] ?? list[0] ?? 0 };
}

// The director: body (pixel sprite when loaded, shapes otherwise), the separately drawn
// sword, and the 발도 range effects.
export function drawDirector(g: G, p: Player, f: Floor, alpha: number, clock: number, frames: FrameLookup): void {
  const x = lerp(p.prevX, p.x, alpha) * T;
  const y = lerp(p.prevY, p.y, alpha) * T;
  const { anim, frame } = pickFrame(p, clock);
  const sprite = frames(frame);
  if (sprite) {
    shadow(g, x, y, 7);
    const blink = p.iframes > 0 && p.dashT <= 0 && anim !== 'hurt' && Math.floor(clock * 20) % 2 === 0;
    const flip = Math.cos(p.aim) < 0;
    const behind = Math.sin(p.aim) < -0.3;
    const breathe = anim === 'idle' || anim === 'upIdle' ? Math.round((Math.sin(clock * DIRECTOR_SPRITE.breathe * Math.PI) + 1) / 2) : 0;
    const hx = x + (flip ? -DIRECTOR_SPRITE.hand.x : DIRECTOR_SPRITE.hand.x);
    const hy = y + DIRECTOR_SPRITE.hand.y;
    if (behind) drawSword(g, p, f, hx, hy);
    if (!blink) drawPixelSprite(g, sprite, x, y + 1 + breathe, flip);
    if (!behind) drawSword(g, p, f, hx, hy);
    if (p.shield > 0) g.lineStyle(1, PALETTE.shield, 0.9).strokeCircle(x, y - sprite.h / 2, sprite.h / 2 + 2);
    drawDrawFx(g, p, f, x, y, clock);
    return;
  }
  shadow(g, x, y, 5);
  if (p.iframes > 0 && p.dashT <= 0 && Math.floor(clock * 20) % 2 === 0) return;
  const hop = p.moving ? Math.abs(Math.sin(clock * 14)) * FEEL.bobHeight : 0;
  const by = y - hop;
  const face = Math.cos(p.aim) >= 0 ? 1 : -1;
  const behind = Math.sin(p.aim) < -0.3;
  const sword = () => drawSword(g, p, f, x, by - 7);
  if (behind) sword();
  g.fillStyle(PALETTE.body).fillRect(x - 4, by - 10, 8, 9); // coat
  g.fillStyle(PALETTE.skin).fillCircle(x, by - 13, 3.6); // head
  g.fillStyle(PALETTE.hair).fillRect(x - 3.8 - face * 0.5, by - 17, 7.6, 3); // messy hair
  if (!behind) {
    g.fillStyle(0x1a1410).fillRect(x + face * 1.4 - 0.5, by - 13.5, 1.2, 1.2); // eye
    sword();
  }
  if (p.shield > 0) g.lineStyle(1, PALETTE.shield, 0.9).strokeCircle(x, by - 8, 10);
  drawDrawFx(g, p, f, x, y, clock);
}

// 발도 readability: show the circle reach when the focus gauge is full (the next 발도 hits all around),
// and draw each 발도 as a big arc (plain slash) or ring (counter / focus strike).
function drawDrawFx(g: G, p: Player, f: Floor, x: number, y: number, clock: number): void {
  const w = WEAPONS[f.weapon];
  const reach = w.drawReach * T;
  const burst = w.burstReach * T;
  if (p.focus >= f.stats.focusMax) {
    g.lineStyle(1, PALETTE.focus, 0.35 + 0.25 * Math.sin(clock * 6)).strokeCircle(x, y - 4, burst);
  }
  const life = FEEL.drawFxTime;
  if (p.drawFx >= life) return;
  const k = 1 - p.drawFx / life;
  if (p.drawKind === 'slash') {
    g.fillStyle(PALETTE.bareBlade, 0.25 * k);
    g.slice(x, y - 4, reach, p.aim - w.drawArc / 2, p.aim + w.drawArc / 2).fillPath();
    g.lineStyle(2, 0xffffff, 0.8 * k);
    g.beginPath();
    g.arc(x, y - 4, reach, p.aim - w.drawArc / 2, p.aim + w.drawArc / 2);
    g.strokePath();
  } else {
    g.fillStyle(PALETTE.bareBlade, 0.3 * k).fillCircle(x, y - 4, burst);
    g.lineStyle(2, 0xffffff, 0.9 * k).strokeCircle(x, y - 4, burst);
  }
}

// The sword is a separate "sprite": a newspaper bundle, or a glowing blade while bare.
function drawSword(g: G, p: Player, f: Floor, hx: number, hy: number): void {
  const w = WEAPONS[f.weapon];
  const trail = FEEL.swingTrailTime;
  const swinging = p.swingFx < trail;
  // During a swing the blade sweeps across the arc; at rest it points along the aim.
  const sweep = swinging ? -w.arc / 2 + (p.swingFx / trail) * w.arc : 0.35;
  const a = p.aim + sweep;
  const len = 12;
  const ex = hx + Math.cos(a) * len;
  const ey = hy + Math.sin(a) * len * 0.8;
  if (p.bare > 0) {
    g.lineStyle(4, PALETTE.bareBlade, 0.35).lineBetween(hx, hy, ex, ey);
    g.lineStyle(2, 0xe8ffff, 1).lineBetween(hx, hy, ex, ey);
  } else {
    g.lineStyle(3, PALETTE.newspaper, 1).lineBetween(hx, hy, ex, ey);
    g.lineStyle(1, 0x6a6458, 1).lineBetween(hx + (ex - hx) * 0.3, hy + (ey - hy) * 0.3, hx + (ex - hx) * 0.55, hy + (ey - hy) * 0.55);
  }
  if (swinging) {
    g.lineStyle(2, p.bare > 0 ? PALETTE.bareBlade : 0xffffff, 0.5 * (1 - p.swingFx / trail));
    g.beginPath();
    g.arc(hx, hy + 6, w.reach * T, p.aim - w.arc / 2, p.aim - w.arc / 2 + (p.swingFx / trail) * w.arc);
    g.strokePath();
  }
}
