import Phaser from 'phaser';
import { FEEL, PALETTE } from '../data/feel.data';
import { GRID_FEEL, GRID_PLAYER } from '../data/grid.data';
import type { GridFloor } from '../systems/grid';

const T = GRID_FEEL.tile;
export const tileToPx = (x: number, y: number) => ({ x: x * T + T / 2, y: y * T + T / 2 + GRID_FEEL.offsetY });

// Draws the grid prototype with plain shapes. Entities slide between tiles for an action-like feel.
export class GridView {
  private map: Phaser.GameObjects.Graphics;
  private g: Phaser.GameObjects.Graphics;
  private fog: Phaser.GameObjects.Graphics;
  private marks: Phaser.GameObjects.Text[] = [];
  private shown = new Map<number, { x: number; y: number }>(); // entity id → displayed px (player = 0)
  private flashes = new Map<number, number>();

  constructor(private scene: Phaser.Scene) {
    this.map = scene.add.graphics();
    this.g = scene.add.graphics();
    this.fog = scene.add.graphics().setDepth(20);
  }

  flash(entityId: number): void {
    this.flashes.set(entityId, FEEL.flashDuration);
  }

  setNeon(_on: boolean): void {}

  drawMap(f: GridFloor): void {
    this.shown.clear();
    const m = this.map;
    m.clear();
    m.fillStyle(PALETTE.gridWall).fillRect(0, 0, f.cols * T, f.rows * T + GRID_FEEL.offsetY);
    for (let y = 0; y < f.rows; y++) {
      for (let x = 0; x < f.cols; x++) {
        if (f.tiles[y * f.cols + x] === 'wall') continue;
        m.fillStyle(PALETTE.gridFloor).fillRect(x * T + 1, y * T + 1 + GRID_FEEL.offsetY, T - 2, T - 2);
      }
    }
  }

  private slide(id: number, x: number, y: number, dt: number): { x: number; y: number } {
    const target = tileToPx(x, y);
    const cur = this.shown.get(id) ?? target;
    const k = Math.min(1, GRID_FEEL.slideSpeed * dt);
    const next = { x: cur.x + (target.x - cur.x) * k, y: cur.y + (target.y - cur.y) * k };
    this.shown.set(id, next);
    return next;
  }

  render(f: GridFloor, dt: number): void {
    const g = this.g;
    g.clear();
    this.marks.forEach((m) => m.destroy());
    this.marks = [];

    const s = tileToPx(f.stairs.x, f.stairs.y);
    g.fillStyle(PALETTE.doorOpen).fillRect(s.x - 10, s.y - 10, 20, 20);
    g.fillStyle(PALETTE.background).fillRect(s.x - 6, s.y - 2, 12, 4);
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
      if (e.kind === 'dalgyal') g.fillStyle(color).fillEllipse(p.x, p.y, r * 1.6, r * 2);
      else if (e.kind === 'subway') g.fillStyle(color).fillRect(p.x - r, p.y - r, r * 2, r * 2);
      else {
        g.fillStyle(color, 0.9).fillCircle(p.x, p.y, r);
        g.fillStyle(0x0b0a14).fillRect(p.x - r, p.y - r, r * 2, r * 0.9);
      }
      if (e.windup) {
        this.marks.push(
          this.scene.add
            .text(p.x, p.y - T * 0.75, '!', { fontFamily: PALETTE.font, fontSize: '20px', color: '#ff4fa3', stroke: '#000', strokeThickness: 3 })
            .setOrigin(0.5)
            .setDepth(15),
        );
      }
    }

    const pl = f.player;
    const pp = this.slide(0, pl.x, pl.y, dt);
    g.fillStyle(PALETTE.player).fillCircle(pp.x, pp.y, T * 0.4);
    g.fillStyle(PALETTE.background).fillCircle(pp.x + pl.facing.x * T * 0.22, pp.y + pl.facing.y * T * 0.22, 3);
    if (pl.focus >= f.stats.focusMax) g.lineStyle(2, PALETTE.playerRoll, 0.9).strokeCircle(pp.x, pp.y, T * 0.5);

    this.fog.clear();
    if (pl.darkness > 0) {
      this.fog.fillStyle(0x000000, FEEL.darknessAlpha);
      for (let y = 0; y < f.rows; y++) {
        for (let x = 0; x < f.cols; x++) {
          if (Math.abs(x - pl.x) + Math.abs(y - pl.y) > GRID_PLAYER.darknessVision) {
            this.fog.fillRect(x * T, y * T + GRID_FEEL.offsetY, T, T);
          }
        }
      }
    }
  }
}
