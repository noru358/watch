import Phaser from 'phaser';
import { EXORCISTS } from '../../data/protagonist.data';
import { FEEL, PALETTE } from '../../data/feel.data';
import type { Floor } from '../../systems/rift';

const T = FEEL.tile;
export const tileToPx = (x: number, y: number) => ({ x: x * T + T / 2, y: y * T + T / 2 + FEEL.offsetY });

// Draws a rift floor with plain shapes (Gate 1: no art). Entities glide between tiles.
export class RiftView {
  private map: Phaser.GameObjects.Graphics;
  private g: Phaser.GameObjects.Graphics;
  private fog: Phaser.GameObjects.Graphics;
  private neon: Phaser.GameObjects.Rectangle;
  private marks: Phaser.GameObjects.Text[] = [];
  private shown = new Map<number, { x: number; y: number }>(); // entity id → displayed px (director = 0)
  private flashes = new Map<number, number>();

  constructor(private scene: Phaser.Scene) {
    this.map = scene.add.graphics();
    this.g = scene.add.graphics();
    this.neon = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, PALETTE.neonPhase2, 0).setOrigin(0).setDepth(18);
    this.neon.setBlendMode(Phaser.BlendModes.ADD);
    this.fog = scene.add.graphics().setDepth(20);
  }

  flash(entityId: number): void {
    this.flashes.set(entityId, FEEL.flashDuration);
  }

  setNeon(on: boolean): void {
    this.neon.setFillStyle(PALETTE.neonPhase2, on ? FEEL.neonAlpha : 0);
  }

  drawMap(f: Floor): void {
    this.shown.clear();
    this.setNeon(false);
    const m = this.map;
    m.clear();
    m.fillStyle(PALETTE.gridWall).fillRect(0, 0, f.cols * T, f.rows * T + FEEL.offsetY);
    for (let y = 0; y < f.rows; y++) {
      for (let x = 0; x < f.cols; x++) {
        if (f.tiles[y * f.cols + x] === 'wall') continue;
        m.fillStyle(PALETTE.gridFloor).fillRect(x * T + 1, y * T + 1 + FEEL.offsetY, T - 2, T - 2);
      }
    }
  }

  private slide(id: number, x: number, y: number, dt: number): { x: number; y: number } {
    const target = tileToPx(x, y);
    const cur = this.shown.get(id) ?? target;
    const k = Math.min(1, FEEL.slideSpeed * dt);
    const next = { x: cur.x + (target.x - cur.x) * k, y: cur.y + (target.y - cur.y) * k };
    this.shown.set(id, next);
    return next;
  }

  private mark(x: number, y: number, text: string, color: string): void {
    this.marks.push(
      this.scene.add
        .text(x, y, text, { fontFamily: PALETTE.font, fontSize: '20px', color, stroke: '#000', strokeThickness: 3 })
        .setOrigin(0.5)
        .setDepth(15),
    );
  }

  render(f: Floor, dt: number): void {
    const g = this.g;
    g.clear();
    this.marks.forEach((m) => m.destroy());
    this.marks = [];

    if (f.stairs) {
      const s = tileToPx(f.stairs.x, f.stairs.y);
      g.fillStyle(PALETTE.stairs).fillRect(s.x - 10, s.y - 10, 20, 20);
      g.fillStyle(PALETTE.background).fillRect(s.x - 6, s.y - 2, 12, 4);
    }
    if (f.payphone) {
      const s = tileToPx(f.payphone.x, f.payphone.y);
      g.fillStyle(PALETTE.payphone).fillRect(s.x - 7, s.y - 12, 14, 24);
      this.mark(s.x, s.y - T * 0.8, '☎', PALETTE.text);
    }
    for (const k of f.pickups) {
      const p = tileToPx(k.x, k.y);
      g.fillStyle(PALETTE.pickup).fillTriangle(p.x, p.y - 6, p.x + 5, p.y, p.x - 5, p.y);
      g.fillTriangle(p.x, p.y + 6, p.x + 5, p.y, p.x - 5, p.y);
    }

    // Telegraphed tiles first, so entities draw on top.
    for (const e of f.enemies) {
      for (const t of e.windup ?? []) {
        const p = tileToPx(t.x, t.y);
        g.fillStyle(PALETTE.telegraph, 0.35).fillRect(p.x - T / 2 + 1, p.y - T / 2 + 1, T - 2, T - 2);
      }
    }
    for (const e of f.enemies) {
      const p = this.slide(e.id, e.x, e.y, dt);
      const flashLeft = (this.flashes.get(e.id) ?? 0) - dt * 1000;
      if (flashLeft > 0) this.flashes.set(e.id, flashLeft);
      else this.flashes.delete(e.id);
      const color = flashLeft > 0 ? 0xffffff : PALETTE[e.kind];
      const r = T * 0.38;
      if (e.kind === 'printer') {
        g.fillStyle(color).fillRoundedRect(p.x - T * 0.8, p.y - T * 0.55, T * 1.6, T * 1.1, 6);
        g.fillStyle(0x0b0a14).fillRect(p.x - T * 0.6, p.y - 3, T * 1.2, 6);
      } else if (e.kind === 'dalgyal') g.fillStyle(color).fillEllipse(p.x, p.y, r * 1.6, r * 2);
      else if (e.kind === 'subway') g.fillStyle(color).fillRect(p.x - r, p.y - r, r * 2, r * 2);
      else {
        g.fillStyle(color, 0.9).fillCircle(p.x, p.y, r);
        g.fillStyle(0x0b0a14).fillRect(p.x - r, p.y - r, r * 2, r * 0.9);
      }
      if (e.kind !== 'printer' && e.hp < e.maxHp) {
        g.fillStyle(PALETTE.hpBarBack).fillRect(p.x - r, p.y + r + 2, r * 2, 3);
        g.fillStyle(PALETTE.hpBar).fillRect(p.x - r, p.y + r + 2, (r * 2 * Math.max(0, e.hp)) / e.maxHp, 3);
      }
      if (e.windup) this.mark(p.x, p.y - T * 0.75, '!', '#ff4fa3');
    }

    const pl = f.player;
    const pp = this.slide(0, pl.x, pl.y, dt);
    g.fillStyle(PALETTE.player).fillCircle(pp.x, pp.y, T * 0.4);
    // The sword: a dark newspaper bundle normally, a glowing blade while bare.
    const bx = pp.x + pl.facing.x * T * 0.45;
    const by = pp.y + pl.facing.y * T * 0.45;
    g.lineStyle(pl.bare > 0 ? 4 : 3, pl.bare > 0 ? PALETTE.bareBlade : 0x8a8a8a, 1).lineBetween(pp.x, pp.y, bx, by);
    if (pl.focus >= f.stats.focusMax) g.lineStyle(2, PALETTE.focus, 0.9).strokeCircle(pp.x, pp.y, T * 0.5);
    if (pl.shield > 0) g.lineStyle(2, PALETTE.shield, 0.9).strokeCircle(pp.x, pp.y, T * 0.58);

    this.fog.clear();
    if (pl.darkness > 0) {
      this.fog.fillStyle(0x000000, FEEL.darknessAlpha);
      const vision = EXORCISTS.director.darknessVision;
      for (let y = 0; y < f.rows; y++) {
        for (let x = 0; x < f.cols; x++) {
          if (Math.abs(x - pl.x) + Math.abs(y - pl.y) > vision) this.fog.fillRect(x * T, y * T + FEEL.offsetY, T, T);
        }
      }
    }
  }
}
