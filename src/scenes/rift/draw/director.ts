import { FEEL, PALETTE } from '../../../data/feel.data';
import { EXORCISTS } from '../../../data/protagonist.data';
import { DIRECTOR_SPRITE, type DirectorAnim, type DirectorFrame } from '../../../data/sprites.data';
import { WEAPONS } from '../../../data/weapons.data';
import type { Floor, Player } from '../../../systems/rift';
import { lerp, shadow, T, type G } from './common';
import { drawPixelSprite, type PixelSprite } from './pixelSprite';

type FrameLookup = (anim: DirectorAnim, frame: DirectorFrame) => PixelSprite | null;

// Which animation and frame to show, from the player's render hints. Attack and 발도 land on the
// key press, so their first frame is the strike and the second the recovery.
const nth = (list: readonly [DirectorFrame, ...DirectorFrame[]], i: number): DirectorFrame => list[i] ?? list[0];

function pickFrame(p: Player, clock: number): { anim: DirectorAnim; frame: DirectorFrame } {
  const S = DIRECTOR_SPRITE;
  const hurt = p.iframes > EXORCISTS.director.hurtIframes - S.hurtShow && p.dashT <= 0;
  if (p.hp <= 0) return { anim: 'ko', frame: S.frames.ko[0] };
  if (hurt) return { anim: 'hurt', frame: S.frames.hurt[0] };
  if (p.dashT > 0) return { anim: 'dash', frame: S.frames.dash[0] };
  if (p.drawFx < S.drawShow) return { anim: 'draw', frame: nth(S.frames.draw, p.drawFx < S.drawStrike ? 0 : 1) };
  if (p.swingFx < S.attackShow) return { anim: 'attack', frame: nth(S.frames.attack, p.swingFx < S.attackStrike ? 0 : 1) };
  const anim: DirectorAnim = p.moving ? 'walk' : 'idle';
  const list = S.frames[anim];
  return { anim, frame: nth(list, Math.floor(clock * S.fps) % list.length) };
}

// The director: body (pixel sprite when loaded, shapes otherwise), the separately drawn
// sword, and the 발도 range effects.
export function drawDirector(g: G, p: Player, f: Floor, alpha: number, clock: number, frames: FrameLookup): void {
  const x = lerp(p.prevX, p.x, alpha) * T;
  const y = lerp(p.prevY, p.y, alpha) * T;
  const { anim, frame } = pickFrame(p, clock);
  const sprite = frames(anim, frame);
  if (sprite) {
    const S = DIRECTOR_SPRITE;
    shadow(g, x, y, 7);
    // After a hit the body dims on off-beats instead of vanishing (a counter's i-frames do not blink).
    const blink = p.iframes > 0 && p.dashT <= 0 && p.drawFx >= S.drawShow && anim !== 'hurt' && anim !== 'ko' && Math.floor(clock * 12) % 2 === 0;
    const flip = Math.cos(p.aim) < 0;
    const swinging = p.swingFx < FEEL.swingTrailTime;
    const behind = swinging && Math.sin(p.aim) < -0.3;
    const hand = S.hands[frame as keyof typeof S.hands] ?? S.hand;
    const hx = x + (flip ? -hand.x : hand.x);
    const hy = y + 1 + hand.y;
    if (behind) drawSword(g, p, f, hx, hy, flip, x, y);
    drawPixelSprite(g, sprite, x, y + 1, flip, blink ? S.blinkAlpha : 1);
    if (!behind) drawSword(g, p, f, hx, hy, flip, x, y);
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
  const sword = () => drawSword(g, p, f, x, by - 7, face < 0, x, y);
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
// At rest it hangs at a fixed angle from the facing (it does not track the aim, which made it twitch);
// a swing sweeps across the arc, alternating direction through the combo; its trail is centred on the body (cx, cy).
function drawSword(g: G, p: Player, f: Floor, hx: number, hy: number, flip: boolean, cx: number, cy: number): void {
  const w = WEAPONS[f.weapon];
  const trail = FEEL.swingTrailTime;
  const swinging = p.swingFx < trail;
  const k = p.swingFx / trail;
  const dir = p.combo % 2 === 0 ? -1 : 1;
  const S = DIRECTOR_SPRITE;
  const held = p.dashT > 0 ? S.swordDash : S.swordRest; // angle from the facing when not cutting
  const a = swinging
    ? p.aim + dir * (-w.arc / 2 + k * w.arc)
    : p.drawFx < S.drawStrike
      ? p.aim // 발도 lunge: the blade points straight at the target
      : flip
        ? Math.PI - held
        : held;
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
    const from = p.aim - (dir * w.arc) / 2;
    g.arc(cx, cy - 4, w.reach * T, Math.min(from, from + dir * k * w.arc), Math.max(from, from + dir * k * w.arc));
    g.strokePath();
  }
}
