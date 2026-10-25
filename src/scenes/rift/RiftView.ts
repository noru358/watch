import Phaser from 'phaser';
import { EXORCISTS } from '../../data/protagonist.data';
import { FEEL, PALETTE } from '../../data/feel.data';
import { WEAPONS } from '../../data/weapons.data';
import type { Enemy, Floor, Player, Telegraph } from '../../systems/rift';

const T = FEEL.tile;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const tileToPx = (x: number, y: number) => ({ x: x * T, y: y * T });

// Draws a rift floor with plain shapes in a 3/4 top-down view (japda conventions):
// wall tops are raised by `wallFace` px with a front face below, bodies cast a shadow,
// are y-sorted, and the sword is drawn separately from the body at the aim angle.
export class RiftView {
  private map: Phaser.GameObjects.Graphics;
  private g: Phaser.GameObjects.Graphics;
  private fog: Phaser.GameObjects.Graphics;
  private neon: Phaser.GameObjects.Rectangle;
  private flashes = new Map<number, number>();
  private clock = 0;

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer) {
    this.map = scene.add.graphics();
    this.g = scene.add.graphics();
    this.neon = scene.add.rectangle(0, 0, 1, 1, PALETTE.neonPhase2, 0).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD);
    this.fog = scene.add.graphics();
    layer.add([this.map, this.g, this.neon, this.fog]);
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
    const m = this.map;
    const wall = (x: number, y: number) => !(x >= 0 && y >= 0 && x < f.cols && y < f.rows && f.tiles[y * f.cols + x] === 'floor');
    m.clear();
    m.fillStyle(PALETTE.gridWall).fillRect(-T * 4, -T * 4, (f.cols + 8) * T, (f.rows + 8) * T);
    for (let y = 0; y < f.rows; y++) {
      for (let x = 0; x < f.cols; x++) {
        if (wall(x, y)) continue;
        m.fillStyle((x + y) % 2 ? PALETTE.gridFloor : PALETTE.gridFloorAlt).fillRect(x * T, y * T, T, T);
      }
    }
    // Walls that border floor: raised top + front face where the floor is below.
    for (let y = 0; y < f.rows; y++) {
      for (let x = 0; x < f.cols; x++) {
        if (!wall(x, y)) continue;
        const nearFloor = !wall(x, y + 1) || !wall(x, y - 1) || !wall(x + 1, y) || !wall(x - 1, y);
        if (!nearFloor) continue;
        m.fillStyle(PALETTE.wallTop).fillRect(x * T, y * T - FEEL.wallFace, T, T);
        if (!wall(x, y + 1)) {
          m.fillStyle(PALETTE.wallFace).fillRect(x * T, y * T + T - FEEL.wallFace, T, FEEL.wallFace);
          m.fillStyle(0x000000, 0.25).fillRect(x * T, y * T + T, T, 2);
        }
      }
    }
  }

  private telegraph(t: Telegraph, f: Floor): void {
    const g = this.g;
    const progress = 1 - Math.max(0, t.t) / t.total;
    const [a0, a1] = FEEL.telegraphFill;
    const col = t.parriable ? PALETTE.parriable : PALETTE.unparriable;
    // In the parry window the edge turns white: that is the cue to press 발도.
    const window = t.parriable && t.t <= WEAPONS[f.weapon].parryWindow;
    g.fillStyle(col, a0 + (a1 - a0) * progress);
    g.lineStyle(window ? 2 : 1, window ? 0xffffff : col, 0.9);
    const x = t.x * T;
    const y = t.y * T;
    switch (t.shape) {
      case 'circle':
        g.fillCircle(x, y, t.range * T * progress).strokeCircle(x, y, t.range * T);
        break;
      case 'cone':
        g.slice(x, y, t.range * T * progress, t.angle - t.width / 2, t.angle + t.width / 2).fillPath();
        g.slice(x, y, t.range * T, t.angle - t.width / 2, t.angle + t.width / 2).strokePath();
        break;
      case 'line': {
        const c = Math.cos(t.angle);
        const s = Math.sin(t.angle);
        const w = (t.width / 2) * T;
        const L = t.range * T;
        const pts = [
          { x: x - s * w, y: y + c * w },
          { x: x + c * L * progress - s * w, y: y + s * L * progress + c * w },
          { x: x + c * L * progress + s * w, y: y + s * L * progress - c * w },
          { x: x + s * w, y: y - c * w },
        ];
        g.fillPoints(pts, true);
        g.strokeRect(Math.min(x, x + c * L) - w, Math.min(y, y + s * L) - w, Math.abs(c * L) + w * 2, Math.abs(s * L) + w * 2);
        break;
      }
      case 'band':
        if (t.axis === 'row') g.fillRect(0, y - (t.width / 2) * T, f.cols * T, t.width * T).strokeRect(0, y - (t.width / 2) * T, f.cols * T, t.width * T);
        else g.fillRect(x - (t.width / 2) * T, 0, t.width * T, f.rows * T).strokeRect(x - (t.width / 2) * T, 0, t.width * T, f.rows * T);
        break;
    }
  }

  private shadow(x: number, y: number, r: number): void {
    this.g.fillStyle(0x000000, 0.3).fillEllipse(x, y + 1, r * 2.2, r * 0.9);
  }

  private drawPlayer(p: Player, f: Floor, alpha: number): void {
    const g = this.g;
    const x = lerp(p.prevX, p.x, alpha) * T;
    const y = lerp(p.prevY, p.y, alpha) * T;
    this.shadow(x, y, 5);
    if (p.iframes > 0 && p.dashT <= 0 && Math.floor(this.clock * 20) % 2 === 0) return;
    const hop = p.moving ? Math.abs(Math.sin(this.clock * 14)) * FEEL.bobHeight : 0;
    const by = y - hop;
    const face = Math.cos(p.aim) >= 0 ? 1 : -1;
    const behind = Math.sin(p.aim) < -0.3;
    const sword = () => this.drawSword(p, f, x, by - 7);
    if (behind) sword();
    g.fillStyle(PALETTE.body).fillRect(x - 4, by - 10, 8, 9); // coat
    g.fillStyle(PALETTE.skin).fillCircle(x, by - 13, 3.6); // head
    g.fillStyle(PALETTE.hair).fillRect(x - 3.8 - face * 0.5, by - 17, 7.6, 3); // messy hair
    if (!behind) {
      g.fillStyle(0x1a1410).fillRect(x + face * 1.4 - 0.5, by - 13.5, 1.2, 1.2); // eye
      sword();
    }
    if (p.shield > 0) g.lineStyle(1, PALETTE.shield, 0.9).strokeCircle(x, by - 8, 10);
    if (p.focus >= f.stats.focusMax) g.lineStyle(1, PALETTE.focus, 0.6 + 0.4 * Math.sin(this.clock * 10)).strokeCircle(x, by - 8, 12);
  }

  // The sword is a separate "sprite": a newspaper bundle, or a glowing blade while bare.
  private drawSword(p: Player, f: Floor, hx: number, hy: number): void {
    const g = this.g;
    const w = WEAPONS[f.weapon];
    const swinging = p.swingFx < 0.14;
    // During a swing the blade sweeps across the arc; at rest it points along the aim.
    const sweep = swinging ? -w.arc / 2 + (p.swingFx / 0.14) * w.arc : 0.35;
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
      g.lineStyle(2, p.bare > 0 ? PALETTE.bareBlade : 0xffffff, 0.5 * (1 - p.swingFx / 0.14));
      g.beginPath();
      g.arc(hx, hy + 6, w.reach * T, p.aim - w.arc / 2, p.aim - w.arc / 2 + (p.swingFx / 0.14) * w.arc);
      g.strokePath();
    }
  }

  private drawEnemy(e: Enemy, alpha: number, dt: number): void {
    const g = this.g;
    const x = lerp(e.prevX, e.x, alpha) * T;
    const y = lerp(e.prevY, e.y, alpha) * T;
    const r = e.r * T;
    const flashLeft = (this.flashes.get(e.id) ?? 0) - dt * 1000;
    if (flashLeft > 0) this.flashes.set(e.id, flashLeft);
    else this.flashes.delete(e.id);
    const col = flashLeft > 0 ? 0xffffff : PALETTE[e.kind];
    const float = Math.sin(this.clock * 3 + e.id) * FEEL.ghostFloat;
    const fade = e.state === 'warp' ? 0.25 : 0.88 + 0.12 * Math.sin(this.clock * 5 + e.id);
    this.shadow(x, y, r * 0.8);
    const fy = y - r - 3 + float;
    switch (e.kind) {
      case 'cheonyeo':
        g.fillStyle(col, fade).fillTriangle(x - r, fy + r, x + r, fy + r, x, fy - r * 0.6); // white dress
        g.fillStyle(PALETTE.skin, fade).fillCircle(x, fy - r * 0.6, r * 0.45);
        g.fillStyle(0x0b0a14, fade).fillRect(x - r * 0.55, fy - r * 1.1, r * 1.1, r * 1.3); // long hair over the face
        break;
      case 'dalgyal':
        g.fillStyle(col, fade).fillEllipse(x, fy, r * 1.7, r * 2.1); // a featureless egg face
        break;
      case 'subway':
        g.fillStyle(col, fade).fillRect(x - r, fy - r, r * 2, r * 1.6);
        g.fillStyle(0xfff3b0, fade * 0.8).fillRect(x - r * 0.7, fy - r * 0.6, r * 0.5, r * 0.4).fillRect(x + r * 0.2, fy - r * 0.6, r * 0.5, r * 0.4);
        break;
      case 'dokkaebibul': {
        // A will-o'-wisp: flickering blue flame, no body.
        const flick = 0.75 + 0.25 * Math.sin(this.clock * 18 + e.id);
        g.fillStyle(col, 0.35 * flick).fillCircle(x, fy, r * 1.6);
        g.fillStyle(col, flick).fillTriangle(x - r, fy + r * 0.6, x + r, fy + r * 0.6, x, fy - r * 1.6);
        g.fillStyle(0xffffff, 0.8 * flick).fillCircle(x, fy + r * 0.1, r * 0.4);
        break;
      }
      case 'printer': {
        g.fillStyle(col, 1).fillRoundedRect(x - r * 1.2, fy - r * 0.9, r * 2.4, r * 1.6, 4);
        const roll = (this.clock * 6) % 1;
        g.fillStyle(0x0b0a14, 1).fillRect(x - r, fy - 2, r * 2, 4);
        g.fillStyle(0xf4f0d8, 1).fillRect(x - r + roll * r * 1.6, fy - 1, r * 0.4, 2); // paper rolling out
        break;
      }
    }
    if (e.state === 'stun') g.lineStyle(1, PALETTE.parriable, 0.9).strokeCircle(x, fy - r - 3, 3);
    if (e.kind !== 'printer' && e.hp < e.maxHp) {
      g.fillStyle(PALETTE.hpBarBack).fillRect(x - r, y + 3, r * 2, 2);
      g.fillStyle(PALETTE.hpBar).fillRect(x - r, y + 3, (r * 2 * Math.max(0, e.hp)) / e.maxHp, 2);
    }
  }

  render(f: Floor, alpha: number, dt: number): void {
    const g = this.g;
    this.clock += dt;
    g.clear();
    if (f.stairs) {
      const sx = f.stairs.x * T;
      const sy = f.stairs.y * T;
      g.fillStyle(PALETTE.stairs, 0.25 + 0.15 * Math.sin(this.clock * 3)).fillCircle(sx, sy, 9);
      g.fillStyle(PALETTE.stairs).fillRect(sx - 6, sy - 6, 12, 12);
      g.fillStyle(PALETTE.background).fillRect(sx - 4, sy - 1, 8, 3);
    }
    if (f.payphone) {
      const sx = f.payphone.x * T;
      const sy = f.payphone.y * T;
      this.shadow(sx, sy, 5);
      g.fillStyle(PALETTE.payphone).fillRect(sx - 4, sy - 14, 8, 14);
      g.fillStyle(0x0b0a14).fillRect(sx - 2, sy - 11, 4, 4);
    }
    for (const k of f.pickups) {
      const px = k.x * T;
      const py = k.y * T - 3 + Math.sin(this.clock * 4 + k.x) * 1.5;
      g.fillStyle(PALETTE.pickup).fillTriangle(px, py - 4, px + 3, py, px - 3, py).fillTriangle(px, py + 4, px + 3, py, px - 3, py);
    }
    for (const e of f.enemies) for (const t of e.teles) this.telegraph(t, f);

    // y-sort: whoever stands lower on screen is drawn in front.
    const draws: { y: number; fn: () => void }[] = f.enemies.map((e) => ({ y: e.y, fn: () => this.drawEnemy(e, alpha, dt) }));
    draws.push({ y: f.player.y, fn: () => this.drawPlayer(f.player, f, alpha) });
    draws.sort((a, b) => a.y - b.y).forEach((d) => d.fn());

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
