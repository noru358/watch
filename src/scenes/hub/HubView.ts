import type Phaser from 'phaser';
import { PALETTE } from '../../data/feel.data';
import { HUB_LOOK as L } from '../../data/hubLook.data';
import { HUB, HUB_PROPS, HUB_SPOTS, type Rect } from '../../data/lobby.data';
import { DIRECTOR_SPRITE, type DirectorAnim } from '../../data/sprites.data';
import type { HubState } from '../../systems/hub';
import type { HubPropId, HubSpotId } from '../../types/ids';
import { lerp, shadow, T, type G } from '../shared/draw/common';
import { directorSprite } from '../shared/draw/directorFrames';
import { drawPixelSprite } from '../shared/draw/pixelSprite';

const px = (r: Rect) => ({ x: r.x * T, y: r.y * T, w: r.w * T, h: r.h * T });

// Draws the office interior: static room once, then y-sorted furniture, people and the director.
export class HubView {
  private readonly back: G;
  private readonly g: G;

  constructor(private readonly scene: Phaser.Scene) {
    this.back = scene.add.graphics();
    this.g = scene.add.graphics();
    this.drawRoom();
  }

  private drawRoom(): void {
    const g = this.back;
    const W = HUB.cols * T;
    const H = HUB.rows * T;
    const wallH = HUB.wall * T;
    // Wall tops all round, then the back wall (wallpaper over a wooden band) and the plank floor.
    g.fillStyle(L.wallTop).fillRect(0, 0, W, H);
    const w = px(HUB.walk);
    g.fillStyle(L.wallpaper).fillRect(w.x, 4, w.w, wallH - 4);
    g.fillStyle(L.wallpaperLo);
    for (let x = w.x + 6; x < w.x + w.w; x += 12) g.fillRect(x, 4, 1, wallH - 18);
    g.fillStyle(L.wainscot).fillRect(w.x, wallH - 14, w.w, 14);
    g.fillStyle(L.trim).fillRect(w.x, wallH - 15, w.w, 1).fillRect(w.x, wallH - 2, w.w, 2);
    g.fillStyle(L.floor).fillRect(w.x, w.y, w.w, w.h);
    for (let row = 0; row * 8 < w.h; row++) {
      const y = w.y + row * 8;
      if (row % 2) g.fillStyle(L.floorAlt).fillRect(w.x, y, w.w, Math.min(8, w.y + w.h - y));
      g.fillStyle(L.floorSeam).fillRect(w.x, y, w.w, 1);
      for (let x = w.x + ((row * 29) % 48); x < w.x + w.w; x += 48) g.fillRect(x, y, 1, Math.min(8, w.y + w.h - y));
    }
    this.drawWindow(g);
    // Clock above the director's desk, a talisman-yellow calendar, and the front door (the way out = 출동).
    const desk = px(HUB_PROPS.directorDesk);
    g.fillStyle(L.clock).fillCircle(desk.x + desk.w / 2, 18, 7);
    g.fillStyle(L.trim).fillRect(desk.x + desk.w / 2, 13, 1, 6).fillRect(desk.x + desk.w / 2, 18, 4, 1);
    g.fillStyle(L.poster).fillRect(8 * T, 12, 16, 22);
    g.fillStyle(L.trim).fillRect(8 * T + 3, 18, 10, 1).fillRect(8 * T + 3, 22, 10, 1).fillRect(8 * T + 3, 26, 7, 1);
    const d = HUB_SPOTS.door;
    g.fillStyle(L.trim).fillRect(d.x * T - 16, 10, 32, wallH - 10);
    g.fillStyle(L.door).fillRect(d.x * T - 13, 13, 26, wallH - 13);
    g.fillStyle(L.doorHi).fillRect(d.x * T - 10, 17, 20, 18);
    g.fillStyle(L.knob).fillRect(d.x * T + 7, 44, 3, 3);
  }

  // Back-wall window: a sunset over Euljiro roofs with Namsan tower.
  private drawWindow(g: G): void {
    const x0 = HUB.window.x * T;
    const ww = HUB.window.w * T;
    const top = 10;
    const hh = 38;
    const band = hh / L.sunset.length;
    L.sunset.forEach((c, i) => g.fillStyle(c).fillRect(x0, top + i * band, ww, band + 1));
    g.fillStyle(L.skyline);
    const roofs = [10, 6, 13, 8, 11, 5, 9, 12];
    roofs.forEach((h, i) => g.fillRect(x0 + i * (ww / roofs.length), top + hh - h, ww / roofs.length, h));
    const tx = x0 + ww * 0.7;
    g.fillRect(tx - 1, top + 8, 2, hh - 8).fillRect(tx - 3, top + 14, 6, 3).fillRect(tx - 5, top + hh - 14, 10, 14);
    g.fillStyle(L.windowFrame).fillRect(x0 - 2, top - 2, ww + 4, 2).fillRect(x0 - 2, top + hh, ww + 4, 3);
    g.fillRect(x0 - 2, top, 2, hh).fillRect(x0 + ww, top, 2, hh).fillRect(x0 + ww / 2 - 1, top, 2, hh);
  }

  render(h: HubState, alpha: number, clock: number, unlocked: readonly HubSpotId[], props: readonly HubPropId[]): void {
    const g = this.g;
    g.clear();
    const draws: { y: number; fn: () => void }[] = props.map((id) => ({
      y: HUB_PROPS[id].y + HUB_PROPS[id].h,
      fn: () => PROP_DRAW[id](g, px(HUB_PROPS[id])),
    }));
    if (unlocked.includes('bookkeeper')) draws.push({ y: HUB_SPOTS.bookkeeper.y, fn: () => this.drawBookkeeper() });
    draws.push({ y: h.y, fn: () => this.drawDirector(h, alpha, clock) });
    draws.sort((a, b) => a.y - b.y).forEach((d) => d.fn());
  }

  // Placeholder figure until the bookkeeper's sprite exists.
  private drawBookkeeper(): void {
    const g = this.g;
    const s = HUB_SPOTS.bookkeeper;
    const x = s.x * T;
    const y = s.y * T;
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
    drawPixelSprite(g, sprite, x, y + 1, h.face < 0);
  }
}

type Px = ReturnType<typeof px>;

// One drawing per piece of furniture; the rect is its floor footprint, things stand up from it.
const PROP_DRAW: Record<HubPropId, (g: G, r: Px) => void> = {
  bookkeeperDesk: (g, r) => {
    g.fillStyle(L.desk).fillRect(r.x, r.y - 6, r.w, r.h + 4);
    g.fillStyle(L.deskTop).fillRect(r.x, r.y - 8, r.w, 4);
    g.fillStyle(L.paper).fillRect(r.x + 8, r.y - 11, 12, 5); // ledger
    g.fillStyle(L.trim).fillRect(r.x + 30, r.y - 12, 6, 6); // calculator
  },
  directorDesk: (g, r) => {
    g.fillStyle(L.desk).fillRect(r.x, r.y + 2, r.w, r.h - 2);
    g.fillStyle(L.deskTop).fillRect(r.x, r.y, r.w, 5);
    g.fillStyle(L.monitor).fillRect(r.x + 8, r.y - 14, 18, 14);
    g.fillStyle(L.monitorGlow).fillRect(r.x + 10, r.y - 12, 14, 9);
    g.fillStyle(L.paper).fillRect(r.x + 36, r.y - 3, 14, 4).fillRect(r.x + 38, r.y - 6, 12, 3); // case files
  },
  sofa: (g, r) => {
    g.fillStyle(L.desk).fillRect(r.x + 14, r.y - 18, r.w - 28, 8); // low table in front
    g.fillStyle(L.sofa).fillRect(r.x, r.y - 6, r.w, r.h + 6);
    g.fillStyle(L.sofaHi).fillRect(r.x + 4, r.y - 4, r.w - 8, 8);
    g.fillStyle(L.trim).fillRect(r.x + r.w / 2, r.y - 4, 1, 8);
  },
  cabinet: (g, r) => {
    g.fillStyle(L.cabinet).fillRect(r.x, r.y - 22, r.w, r.h + 22);
    g.fillStyle(L.cabinetLine).fillRect(r.x, r.y - 12, r.w, 1).fillRect(r.x, r.y - 2, r.w, 1);
    g.fillRect(r.x + r.w / 2 - 3, r.y - 18, 6, 2).fillRect(r.x + r.w / 2 - 3, r.y - 8, 6, 2);
  },
  plant: (g, r) => {
    g.fillStyle(L.leaf).fillCircle(r.x + r.w / 2, r.y - 4, 10);
    g.fillStyle(L.pot).fillRect(r.x + 4, r.y + 2, r.w - 8, r.h - 4);
  },
  water: (g, r) => {
    g.fillStyle(L.waterJug).fillRect(r.x + 5, r.y - 26, r.w - 10, 12);
    g.fillStyle(L.water).fillRect(r.x + 2, r.y - 14, r.w - 4, r.h + 12);
  },
  // 부적 작업대: a low table with yellow talisman paper and a red ink dish (shapes until art).
  bench: (g, r) => {
    g.fillStyle(L.desk).fillRect(r.x, r.y - 4, r.w, r.h + 2);
    g.fillStyle(L.deskTop).fillRect(r.x, r.y - 6, r.w, 4);
    g.fillStyle(L.poster).fillRect(r.x + 5, r.y - 10, 8, 11).fillRect(r.x + 15, r.y - 9, 8, 10);
    g.fillStyle(L.talismanInk).fillRect(r.x + 7, r.y - 7, 4, 1).fillRect(r.x + 17, r.y - 6, 4, 1).fillCircle(r.x + r.w - 7, r.y - 7, 3);
  },
};
