import Phaser from 'phaser';
import { EXORCISTS } from '../../data/protagonist.data';
import { FEEL, PALETTE } from '../../data/feel.data';
import { survivorOf, type Floor } from '../../systems/rift';
import { T } from '../shared/draw/common';
import { drawDirector } from './draw/director';
import { directorSprite } from '../shared/draw/directorFrames';
import { drawGhost } from './draw/ghosts';
import { drawSurvivor } from './draw/survivor';
import { drawProps } from './draw/props';
import { drawTelegraph } from './draw/telegraph';
import { drawTiles } from './draw/tiles';

export const tileToPx = (x: number, y: number) => ({ x: x * T, y: y * T });

// Draws a rift floor in a 3/4 top-down view (japda conventions). This file only decides
// the layers and the draw order; what each thing looks like lives in draw/ (one file per
// kind of thing), so real art can replace the shapes one file at a time.
export class RiftView {
  private map: Phaser.GameObjects.Graphics;
  private g: Phaser.GameObjects.Graphics;
  private shade: Phaser.GameObjects.Graphics; // night ambient (multiply)
  private glow: Phaser.GameObjects.Graphics; // light pools (add)
  private tele: Phaser.GameObjects.Graphics; // floor warnings stay unlit so they read clearly
  private fog: Phaser.GameObjects.Graphics;
  private neon: Phaser.GameObjects.Rectangle;
  private flashes = new Map<number, number>();
  private clock = 0;

  constructor(private readonly scene: Phaser.Scene, layer: Phaser.GameObjects.Layer) {
    this.map = scene.add.graphics();
    this.g = scene.add.graphics();
    this.shade = scene.add.graphics().setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.glow = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.tele = scene.add.graphics();
    this.neon = scene.add.rectangle(0, 0, 1, 1, PALETTE.neonPhase2, 0).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD);
    this.fog = scene.add.graphics();
    layer.add([this.map, this.g, this.shade, this.glow, this.tele, this.neon, this.fog]);
  }

  flash(entityId: number): void {
    this.flashes.set(entityId, FEEL.flashDuration);
  }

  setNeon(on: boolean): void {
    this.neon.setFillStyle(PALETTE.neonPhase2, on ? FEEL.neonAlpha : 0);
  }

  drawMap(f: Floor): void {
    this.setNeon(false);
    this.neon.setSize(f.cols * T, f.rows * T);
    drawTiles(this.map, f);
  }

  // Counts down an enemy's white hit flash; true while it should be drawn white.
  private flashing(id: number, dt: number): boolean {
    const left = (this.flashes.get(id) ?? 0) - dt * 1000;
    if (left > 0) this.flashes.set(id, left);
    else this.flashes.delete(id);
    return left > 0;
  }

  // Night: darken everything, then add banded light pools around glowing things.
  private drawLights(f: Floor, alpha: number): void {
    this.shade.clear().fillStyle(PALETTE.nightAmbient).fillRect(-T * 4, -T * 4, (f.cols + 8) * T, (f.rows + 8) * T);
    const gl = this.glow.clear();
    const pool = (x: number, y: number, l: { radius: number; color: number; alpha: number }) => {
      for (let b = 1; b <= FEEL.lightBands; b++) gl.fillStyle(l.color, l.alpha).fillCircle(x * T, y * T, (l.radius * T * b) / FEEL.lightBands);
    };
    const p = f.player;
    pool(p.prevX + (p.x - p.prevX) * alpha, p.prevY + (p.y - p.prevY) * alpha - 0.6, FEEL.lights.director);
    for (const e of f.enemies) {
      if (e.kind === 'dokkaebibul') pool(e.x, e.y - 0.5, FEEL.lights.wisp);
      if (e.kind === 'cheonyeo') pool(e.x, e.y - 1, FEEL.lights.cheonyeo);
    }
    if (f.stairs) pool(f.stairs.x, f.stairs.y, FEEL.lights.stairs);
    if (f.payphone) pool(f.payphone.x, f.payphone.y - 0.5, FEEL.lights.payphone);
    const s = survivorOf(f);
    if (s) pool(s.x, s.y - 0.5, FEEL.lights.survivor);
  }

  render(f: Floor, alpha: number, dt: number): void {
    const g = this.g;
    this.clock += dt;
    g.clear();
    drawProps(g, f, this.clock);
    this.tele.clear();
    for (const e of f.enemies) for (const t of e.teles) drawTelegraph(this.tele, t, f);

    // y-sort: whoever stands lower on screen is drawn in front.
    const draws: { y: number; fn: () => void }[] = f.enemies.map((e) => ({
      y: e.y,
      fn: () => drawGhost(g, e, alpha, this.clock, this.flashing(e.id, dt), f.boss?.phase === 2),
    }));
    const s = survivorOf(f);
    if (s) draws.push({ y: s.y, fn: () => drawSurvivor(g, s, alpha, this.clock) });
    draws.push({ y: f.player.y, fn: () => drawDirector(g, f.player, f, alpha, this.clock, (anim, n) => directorSprite(this.scene, anim, n)) });
    draws.sort((a, b) => a.y - b.y).forEach((d) => d.fn());

    this.drawLights(f, alpha);
    this.fog.clear();
    const p = f.player;
    if (p.darkness > 0) {
      this.fog.fillStyle(0x000000, FEEL.darknessAlpha);
      const vision = EXORCISTS.director.darknessVision;
      for (let y = 0; y < f.rows; y++) {
        for (let x = 0; x < f.cols; x++) {
          if (Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) > vision) this.fog.fillRect(x * T, y * T - FEEL.wallFace, T, T);
        }
      }
    }
  }
}
