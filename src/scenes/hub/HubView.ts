import type Phaser from 'phaser';
import { HUB_LOOK as L, PALETTE } from '../../data/feel.data';
import { HUB, HUB_SPOTS, type Rect } from '../../data/lobby.data';
import { DIRECTOR_SPRITE, type DirectorAnim } from '../../data/sprites.data';
import type { HubState } from '../../systems/hub';
import type { HubSpotId } from '../../types/ids';
import { lerp, shadow, T, type G } from '../rift/draw/common';
import { directorSprite } from '../rift/draw/directorFrames';
import { drawPixelSprite } from '../rift/draw/pixelSprite';

const px = (r: Rect) => ({ x: r.x * T, y: r.y * T, w: r.w * T, h: r.h * T });

// Draws the rooftop office: static backdrop once, then y-sorted furniture, people and the director.
export class HubView {
  private readonly back: G;
  private readonly g: G;

  constructor(private readonly scene: Phaser.Scene) {
    this.back = scene.add.graphics();
    this.g = scene.add.graphics();
    this.drawBackdrop();
  }

  private drawBackdrop(): void {
    const g = this.back;
    // Parapet around the whole roof, then the painted floor inside it.
    g.fillStyle(L.parapet).fillRect(0, 0, HUB.cols * T, HUB.rows * T);
    g.fillStyle(L.parapetTop).fillRect(0, HUB.rows * T - 4, HUB.cols * T, 4);
    const w = px(HUB.walk);
    g.fillStyle(L.roof).fillRect(w.x, w.y, w.w, w.h);
    for (let y = HUB.walk.y; y < HUB.walk.y + HUB.walk.h; y++) {
      for (let x = HUB.walk.x; x < HUB.walk.x + HUB.walk.w; x++) {
        if ((x + y) % 2 === 0) g.fillStyle(L.roofAlt).fillRect(x * T, y * T, T, Math.min(T, (HUB.walk.y + HUB.walk.h - y) * T));
      }
    }
    g.fillStyle(L.roofSeam);
    for (let y = HUB.walk.y; y < HUB.walk.y + HUB.walk.h; y += 2) g.fillRect(w.x, y * T, w.w, 1);
    // The rooftop room: wall, roof edge, a lit window and its own door.
    const hut = px(HUB.hut);
    g.fillStyle(L.hutRoof).fillRect(hut.x, hut.y, hut.w, 10);
    g.fillStyle(L.hutWall).fillRect(hut.x, hut.y + 10, hut.w, hut.h - 10);
    g.fillStyle(L.hutWallLo).fillRect(hut.x, hut.y + hut.h - 4, hut.w, 4);
    g.fillStyle(L.window).fillRect(hut.x + 2.5 * T, hut.y + 22, 2 * T, 26);
    g.fillStyle(L.hutWallLo).fillRect(hut.x + 3.5 * T - 1, hut.y + 22, 2, 26);
    g.fillStyle(L.hutRoof).fillRect(hut.x + 7 * T, hut.y + 18, T, hut.h - 18);
    // Stairwell housing with the iron door (the way out = 출동).
    const st = px(HUB.stairs);
    g.fillStyle(L.hutRoof).fillRect(st.x, st.y, st.w, 10);
    g.fillStyle(L.stairWall).fillRect(st.x, st.y + 10, st.w, st.h - 10);
    const d = HUB_SPOTS.door;
    g.fillStyle(L.ironDoor).fillRect(d.x * T - 13, st.y + 18, 26, st.h - 18);
    g.fillStyle(L.ironDoorHi).fillRect(d.x * T + 7, st.y + 40, 3, 3);
  }

  render(h: HubState, alpha: number, clock: number, unlocked: readonly HubSpotId[]): void {
    const g = this.g;
    g.clear();
    const draws: { y: number; fn: () => void }[] = HUB.solids.map((s, i) => ({ y: s.y + s.h, fn: () => this.drawSolid(i, s) }));
    if (unlocked.includes('bookkeeper')) draws.push({ y: HUB_SPOTS.bookkeeper.y, fn: () => this.drawBookkeeper(clock) });
    draws.push({ y: h.y, fn: () => this.drawDirector(h, alpha, clock) });
    draws.sort((a, b) => a.y - b.y).forEach((d) => d.fn());
  }

  private drawSolid(i: number, s: Rect): void {
    const g = this.g;
    const r = px(s);
    if (i === 0) {
      g.fillStyle(L.desk).fillRect(r.x, r.y - 6, r.w, r.h + 2);
      g.fillStyle(0xf4f0e0).fillRect(r.x + 10, r.y - 4, 12, 8); // ledger book
    } else if (i === 1) {
      g.fillStyle(L.bed).fillRect(r.x, r.y - 6, r.w, r.h);
      g.fillStyle(L.bedSlat);
      for (let x = r.x + 6; x < r.x + r.w; x += 8) g.fillRect(x, r.y - 6, 1, r.h);
      g.fillRect(r.x, r.y + r.h - 6, r.w, 6);
    } else if (i === 2) {
      g.fillStyle(L.pepper).fillCircle(r.x + r.w / 2, r.y, 9);
      g.fillStyle(L.pot).fillRect(r.x + 3, r.y + 2, r.w - 6, r.h - 2);
    } else {
      g.fillStyle(L.acUnit).fillRect(r.x, r.y - 8, r.w, r.h + 4);
      g.fillStyle(L.acFan).fillCircle(r.x + r.w / 2, r.y + r.h / 2 - 6, 9);
    }
  }

  // Placeholder figure until the bookkeeper's sprite exists.
  private drawBookkeeper(clock: number): void {
    const g = this.g;
    const s = HUB_SPOTS.bookkeeper;
    const x = s.x * T;
    const y = s.y * T + Math.round(Math.sin(clock * 2) * 0.5);
    shadow(g, x, y, 6);
    g.fillStyle(L.bookkeeperTop).fillRect(x - 6, y - 16, 12, 14);
    g.fillStyle(L.skin).fillCircle(x, y - 22, 7);
    g.fillStyle(L.bookkeeperHair).fillRect(x - 7, y - 30, 14, 6).fillRect(x - 7, y - 26, 3, 9).fillRect(x + 4, y - 26, 3, 9);
    g.fillStyle(PALETTE.gridWall).fillRect(x - 3, y - 22, 1, 2).fillRect(x + 2, y - 22, 1, 2);
  }

  private drawDirector(h: HubState, alpha: number, clock: number): void {
    const g = this.g;
    const x = lerp(h.prevX, h.x, alpha) * T;
    const y = lerp(h.prevY, h.y, alpha) * T;
    const S = DIRECTOR_SPRITE;
    const anim: DirectorAnim = h.moving ? 'walk' : 'idle';
    const list = S.frames[anim];
    const frame = list[Math.floor(clock * S.fps) % list.length] ?? list[0];
    const sprite = directorSprite(this.scene, anim, frame);
    shadow(g, x, y, 7);
    if (!sprite) {
      g.fillStyle(PALETTE.body).fillRect(x - 4, y - 12, 8, 11);
      return;
    }
    const lift = anim === 'idle' && clock % S.headBob.period < S.headBob.period / 2 ? 1 : 0;
    drawPixelSprite(g, sprite, x, y + 1, h.face < 0, 1, false, 1, S.headBob.rows, lift);
  }
}
