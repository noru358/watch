import { PROPS, SIGN_LIGHT, SIGNS } from '../../../data/districts.data';
import type { Floor, PropState, SignState } from '../../../systems/rift';
import { shadow, T, type G } from '../../shared/draw/common';
import { drawPixelSprite, gridSprite } from '../../shared/draw/pixelSprite';
import { PROP_ART, SIGN_ART } from './art/streetArt';

// District street furniture (districts.data.ts): props stand on the bottom edge of their tiles and are
// y-sorted with bodies; neon signs hang on wall faces and flicker now and then.

export function drawStreetProp(g: G, p: PropState, hit: boolean): void {
  const art = PROP_ART[p.art];
  const cx = (p.x + p.w / 2) * T + (hit ? 1 : 0);
  const by = (p.y + p.h) * T;
  shadow(g, cx, by - 2, (p.w * T) / 2.4);
  drawPixelSprite(g, gridSprite(art.rows, art.pal), cx, by, false, 1, hit);
}

// A sign is dark for a moment every SIGN_LIGHT.flickerEvery seconds, each sign at its own offset.
export function signLit(s: SignState, i: number, clock: number): boolean {
  const t = (clock + i * 2.3 + s.x * 0.37) % SIGN_LIGHT.flickerEvery;
  return !(t < 0.12 || (t > 0.2 && t < 0.28));
}

export function drawSigns(g: G, f: Floor, clock: number): void {
  f.signs.forEach((s, i) => {
    const art = SIGN_ART[s.art];
    const sprite = gridSprite(art.rows, art.pal);
    drawPixelSprite(g, sprite, s.x * T + T / 2, s.y * T + T - 2, false, signLit(s, i, clock) ? 1 : 0.3);
  });
}

// Light pools of the street: lit props and lit signs (added by RiftView.drawLights).
export function streetLights(f: Floor, clock: number, pool: (x: number, y: number, l: { radius: number; color: number; alpha: number }) => void): void {
  for (const p of f.props) {
    const l = PROPS[p.art].light;
    if (l) pool(p.x + p.w / 2, p.y + p.h / 2, l);
  }
  f.signs.forEach((s, i) => {
    if (signLit(s, i, clock)) pool(s.x + 0.5, s.y + 1.5, { radius: SIGN_LIGHT.radius, color: SIGNS[s.art].color, alpha: SIGN_LIGHT.alpha });
  });
}
