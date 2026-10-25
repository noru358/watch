import { FEEL, PALETTE } from '../../../data/feel.data';
import { DIRECTOR_SPRITE, type ComboStep } from '../../../data/sprites.data';
import { WEAPONS } from '../../../data/weapons.data';
import type { Floor, Player } from '../../../systems/rift';
import { T, type G } from '../../shared/draw/common';

// The sword is drawn separately from the body: a newspaper bundle, or a glowing blade while bare.
// At rest it hangs at a fixed angle from the facing (it does not track the aim, which made it twitch).
// A swing is carried by a smear (Soul Knight / pixel-art practice: the body keeps 2 facings, the
// smear and blade are rotated to the aim, so attacks read in every direction).

const bladeColor = (p: Player) => (p.bare > 0 ? PALETTE.bareBlade : 0xffffff);

// The angle the blade points at right now (hilt at the hand).
function bladeAngle(p: Player, f: Floor, step: ComboStep, flip: boolean): number {
  const w = WEAPONS[f.weapon];
  const S = DIRECTOR_SPRITE;
  if (p.swingFx < FEEL.swingTrailTime) {
    if (step.sweep === 0) return p.aim;
    const k = Math.min(1, p.swingFx / FEEL.swingSweepTime);
    return p.aim + step.sweep * (-w.arc / 2 + k * w.arc);
  }
  if (p.drawT <= 0 && p.drawFx - w.drawStartup < S.drawCutShow && p.drawFx >= w.drawStartup) return p.drawAim;
  const held = p.dashT > 0 ? S.swordDash : S.swordRest;
  return flip ? Math.PI - held : held;
}

export function drawSword(g: G, p: Player, f: Floor, step: ComboStep, hx: number, hy: number, flip: boolean): void {
  const a = bladeAngle(p, f, step, flip);
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
  // 발도 stance: a blinking glint where the thumb pushes the guard.
  if (p.drawT > 0 && Math.floor(p.drawFx / FEEL.drawGlint) % 2 === 0) g.fillStyle(0xffffff, 1).fillRect(hx - 1, hy - 1, 3, 3);
}

// The swing smear, centred on the body (cx, cy): a crescent thick at the leading edge and thin at
// the tail for forehand / backhand, a tapering streak for the finisher's thrust.
export function drawSmear(g: G, p: Player, f: Floor, step: ComboStep, cx: number, cy: number): void {
  const life = FEEL.swingTrailTime;
  if (p.swingFx >= life) return;
  const w = WEAPONS[f.weapon];
  const R = w.reach * T;
  const fade = 1 - p.swingFx / life;
  g.fillStyle(bladeColor(p), FEEL.smearAlpha * fade);
  const oy = cy - 4;
  if (step.sweep === 0) {
    const ux = Math.cos(p.aim);
    const uy = Math.sin(p.aim);
    const hw = FEEL.thrustWidth * fade;
    const reach = R * 1.15;
    g.fillTriangle(cx - uy * hw, oy + ux * hw, cx + uy * hw, oy - ux * hw, cx + ux * reach, oy + uy * reach);
    return;
  }
  const k = Math.min(1, p.swingFx / FEEL.swingSweepTime);
  const a0 = p.aim - (step.sweep * w.arc) / 2;
  const a1 = a0 + step.sweep * k * w.arc;
  const n = 10;
  const thick = R * FEEL.smearThickness;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push({ x: cx + Math.cos(a) * R, y: oy + Math.sin(a) * R });
  }
  for (let i = n; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / n;
    const r = R - thick * (i / n) * fade;
    pts.push({ x: cx + Math.cos(a) * r, y: oy + Math.sin(a) * r });
  }
  g.fillPoints(pts, true);
}

// 발도 readability: show the circle reach when the focus gauge is full (the next 발도 hits all around),
// and draw each landed 발도 as a big arc (plain slash) or ring (counter / focus strike).
export function drawDrawFx(g: G, p: Player, f: Floor, x: number, y: number, clock: number): void {
  const w = WEAPONS[f.weapon];
  const reach = w.drawReach * T;
  const burst = w.burstReach * T;
  if (p.focus >= f.stats.focusMax) {
    g.lineStyle(1, PALETTE.focus, 0.35 + 0.25 * Math.sin(clock * 6)).strokeCircle(x, y - 4, burst);
  }
  if (p.drawT > 0) return; // still in the stance: nothing has been cut yet
  const life = FEEL.drawFxTime;
  const since = p.drawFx - w.drawStartup;
  if (since < 0 || since >= life) return;
  const k = 1 - since / life;
  if (p.drawKind === 'slash') {
    g.fillStyle(PALETTE.bareBlade, 0.25 * k);
    g.slice(x, y - 4, reach, p.drawAim - w.drawArc / 2, p.drawAim + w.drawArc / 2).fillPath();
    g.lineStyle(2, 0xffffff, 0.8 * k);
    g.beginPath();
    g.arc(x, y - 4, reach, p.drawAim - w.drawArc / 2, p.drawAim + w.drawArc / 2);
    g.strokePath();
    // The flash cut: one straight white line through the aim, the instant of the draw.
    g.lineStyle(2, 0xffffff, k).lineBetween(x - Math.cos(p.drawAim) * 4, y - 4 - Math.sin(p.drawAim) * 4, x + Math.cos(p.drawAim) * reach, y - 4 + Math.sin(p.drawAim) * reach);
  } else {
    g.fillStyle(PALETTE.bareBlade, 0.3 * k).fillCircle(x, y - 4, burst);
    g.lineStyle(2, 0xffffff, 0.9 * k).strokeCircle(x, y - 4, burst);
  }
}
