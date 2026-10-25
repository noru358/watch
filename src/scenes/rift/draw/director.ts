import { FEEL, PALETTE } from '../../../data/feel.data';
import { EXORCISTS } from '../../../data/protagonist.data';
import { DIRECTOR_SPRITE, type ComboStep, type DirectorAnim, type DirectorFrame } from '../../../data/sprites.data';
import { WEAPONS } from '../../../data/weapons.data';
import type { Floor, Player } from '../../../systems/rift';
import { lerp, shadow, T, type G } from '../../shared/draw/common';
import { drawPixelSprite, type PixelSprite } from '../../shared/draw/pixelSprite';
import { drawDrawFx, drawSmear, drawSword } from './sword';

type FrameLookup = (anim: DirectorAnim, frame: DirectorFrame) => PixelSprite | null;

const nth = (list: readonly [DirectorFrame, ...DirectorFrame[]], i: number): DirectorFrame => list[i] ?? list[0];

// The combo swing being shown (1st, 2nd or 3rd hit).
function comboStep(p: Player): ComboStep {
  const list = DIRECTOR_SPRITE.combo;
  return list[(Math.max(1, p.combo) - 1) % list.length]!;
}

interface Pose {
  anim: DirectorAnim;
  frame: DirectorFrame;
  back: boolean; // back view (aiming up): mirrored so the reaching arm points to the aim side
}

// Which animation and frame to show, from the player's render hints. Swings land on the press, so
// each combo step shows its strike pose first, then its recovery. 발도: stance → cut → sheathe.
function pickPose(p: Player, f: Floor, clock: number): Pose {
  const S = DIRECTOR_SPRITE;
  const up = (aim: number) => Math.sin(aim) < S.back.upAim;
  const side = (anim: DirectorAnim, frame: DirectorFrame): Pose => ({ anim, frame, back: false });
  const hurt = p.iframes > EXORCISTS.director.hurtIframes - S.hurtShow && p.dashT <= 0;
  if (p.hp <= 0) return side('ko', S.frames.ko[0]);
  if (hurt) return side('hurt', S.frames.hurt[0]);
  if (p.dashT > 0) return side('dash', S.frames.dash[0]);
  if (p.drawT > 0) return side('draw', nth(S.frames.draw, 0));
  const since = p.drawFx - WEAPONS[f.weapon].drawStartup;
  if (since >= 0 && since < S.drawCutShow) return up(p.drawAim) ? { anim: 'draw', frame: S.back.strike, back: true } : side('draw', nth(S.frames.draw, 1));
  if (since >= 0 && since < S.drawCutShow + S.drawSheatheShow) return side('draw', nth(S.frames.draw, 0));
  const step = comboStep(p);
  if (p.swingFx < step.strikeShow) return up(p.aim) ? { anim: 'attack', frame: S.back.strike, back: true } : side('attack', step.strike);
  if (p.swingFx < step.strikeShow + step.recoverShow) return side('attack', step.recover);
  const anim: DirectorAnim = p.moving ? 'walk' : 'idle';
  const list = S.frames[anim];
  return side(anim, nth(list, Math.floor(clock * S.fps) % list.length));
}

// The director: body (pixel sprite when loaded, shapes otherwise), the separately drawn
// sword and swing smear (sword.ts), and the 발도 range effects.
export function drawDirector(g: G, p: Player, f: Floor, alpha: number, clock: number, frames: FrameLookup): void {
  const x = lerp(p.prevX, p.x, alpha) * T;
  const y = lerp(p.prevY, p.y, alpha) * T;
  const pose = pickPose(p, f, clock);
  const sprite = frames(pose.anim, pose.frame);
  const step = comboStep(p);
  if (sprite) {
    const S = DIRECTOR_SPRITE;
    shadow(g, x, y, 7);
    // After a hit the body dims on off-beats instead of vanishing (a counter's i-frames do not blink).
    const blink = p.iframes > 0 && p.dashT <= 0 && p.drawFx >= S.drawCutShow + S.drawSheatheShow && pose.anim !== 'hurt' && pose.anim !== 'ko' && Math.floor(clock * 12) % 2 === 0;
    const right = Math.cos(pose.anim === 'draw' ? p.drawAim : p.aim) >= 0;
    const flip = pose.back ? (S.back.armLeft ? right : !right) : !right;
    // Aiming up, the blade and its smear are beyond the body: draw them first.
    const behind = pose.back || (p.swingFx < FEEL.swingTrailTime && Math.sin(p.aim) < -0.3);
    const hand = S.hands[pose.frame as keyof typeof S.hands] ?? S.hand;
    const hx = x + (flip ? -hand.x : hand.x);
    const hy = y + 1 + hand.y;
    if (behind) {
      drawSmear(g, p, f, step, x, y);
      drawSword(g, p, f, step, hx, hy, !right);
    }
    drawPixelSprite(g, sprite, x, y + 1, flip, blink ? S.blinkAlpha : 1);
    if (!behind) {
      drawSword(g, p, f, step, hx, hy, !right);
      drawSmear(g, p, f, step, x, y);
    }
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
  const sword = () => {
    drawSword(g, p, f, step, x, by - 7, face < 0);
    drawSmear(g, p, f, step, x, y);
  };
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
