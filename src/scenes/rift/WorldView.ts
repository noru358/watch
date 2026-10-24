import Phaser from 'phaser';
import { COMBAT } from '../../data/combat.data';
import { ROOM_SIZE } from '../../data/contracts.data';
import { FEEL, PALETTE } from '../../data/feel.data';
import { ENEMIES } from '../../data/ghosts.data';
import { ROOM_CENTER, type EnemyState, type World } from '../../systems/combat';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Draws a room with plain shapes (Gate 1: no art). Reads the world, never writes it.
export class WorldView {
  private floor: Phaser.GameObjects.Graphics;
  private g: Phaser.GameObjects.Graphics;
  private dark: Phaser.GameObjects.Rectangle;
  private darkMask: Phaser.GameObjects.Graphics;
  private neon: Phaser.GameObjects.Rectangle;
  private flashes = new Map<number, number>(); // entityId → ms of white flash left

  constructor(scene: Phaser.Scene) {
    this.floor = scene.add.graphics();
    this.g = scene.add.graphics();
    this.neon = scene.add
      .rectangle(0, 0, ROOM_SIZE.width, ROOM_SIZE.height, PALETTE.neonPhase2, 0)
      .setOrigin(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.darkMask = scene.make.graphics({}, false);
    this.dark = scene.add.rectangle(0, 0, ROOM_SIZE.width, ROOM_SIZE.height, 0x000000, 0).setOrigin(0);
    const mask = this.darkMask.createGeometryMask();
    mask.setInvertAlpha(true);
    this.dark.setMask(mask);
  }

  flash(entityId: number): void {
    this.flashes.set(entityId, FEEL.flashDuration);
  }

  setNeon(on: boolean): void {
    this.neon.setFillStyle(PALETTE.neonPhase2, on ? FEEL.neonAlpha : 0);
  }

  drawRoom(world: World): void {
    const f = this.floor;
    const { width, height, wall } = ROOM_SIZE;
    f.clear();
    f.fillStyle(PALETTE.floor).fillRect(0, 0, width, height);
    f.lineStyle(1, PALETTE.floorLine, 1);
    for (let x = wall; x < width - wall; x += FEEL.floorGrid) f.lineBetween(x, wall, x, height - wall);
    for (let y = wall; y < height - wall; y += FEEL.floorGrid) f.lineBetween(wall, y, width - wall, y);
    f.fillStyle(PALETTE.wall);
    f.fillRect(0, 0, width, wall).fillRect(0, height - wall, width, wall);
    f.fillRect(0, 0, wall, height).fillRect(width - wall, 0, wall, height);
    if (world.roomKind === 'payphone') {
      f.fillStyle(PALETTE.payphone).fillRect(ROOM_CENTER.x - 14, ROOM_CENTER.y - 22, 28, 44);
      f.lineStyle(2, PALETTE.payphone, 0.4).strokeCircle(ROOM_CENTER.x, ROOM_CENTER.y, COMBAT.payphoneInteractRange);
    }
  }

  render(world: World, alpha: number, deltaMs: number): void {
    const g = this.g;
    g.clear();
    this.drawDoor(world);

    for (const z of world.zones) {
      g.fillStyle(PALETTE.ward, 0.12).fillCircle(z.x, z.y, z.radius);
      g.lineStyle(2, PALETTE.ward, 0.7).strokeCircle(z.x, z.y, z.radius);
    }
    for (const pk of world.pickups) {
      g.fillStyle(PALETTE.pickup).fillTriangle(pk.x, pk.y - 6, pk.x + 5, pk.y, pk.x - 5, pk.y);
      g.fillTriangle(pk.x, pk.y + 6, pk.x + 5, pk.y, pk.x - 5, pk.y);
    }
    for (const e of world.enemies) this.drawEnemy(e, alpha, deltaMs);
    for (const pr of world.projectiles) {
      const x = lerp(pr.prevX, pr.x, alpha);
      const y = lerp(pr.prevY, pr.y, alpha);
      if (pr.owner === 'player') {
        g.fillStyle(PALETTE.talisman).fillRect(x - pr.radius * 0.7, y - pr.radius, pr.radius * 1.4, pr.radius * 2);
      } else {
        g.fillStyle(PALETTE.enemyBullet).fillCircle(x, y, pr.radius);
      }
    }
    this.drawPlayer(world, alpha);
    this.drawDarkness(world, alpha);
  }

  private drawDoor(world: World): void {
    const open = world.status === 'cleared';
    const w = ROOM_SIZE.doorWidth;
    this.g.fillStyle(open ? PALETTE.doorOpen : PALETTE.doorClosed, open ? 0.9 : 1);
    this.g.fillRect(ROOM_CENTER.x - w / 2, 0, w, ROOM_SIZE.wall);
  }

  private drawPlayer(world: World, alpha: number): void {
    const p = world.player;
    const x = lerp(p.prevX, p.x, alpha);
    const y = lerp(p.prevY, p.y, alpha);
    const r = world.stats.radius;
    const blink = p.iframes > 0 && Math.floor(p.iframes * 20) % 2 === 0;
    if (blink && p.rollTime <= 0) return;
    this.g.fillStyle(p.rollTime > 0 ? PALETTE.playerRoll : PALETTE.player).fillCircle(x, y, r);
    this.g.fillStyle(PALETTE.background).fillCircle(x + p.facingX * r * 0.55, y + p.facingY * r * 0.55, 3);
    if (p.shield > 0) this.g.lineStyle(2, PALETTE.shield, 0.9).strokeCircle(x, y, r + 5);
  }

  private drawEnemy(e: EnemyState, alpha: number, deltaMs: number): void {
    const g = this.g;
    const data = ENEMIES[e.kind];
    const x = lerp(e.prevX, e.x, alpha);
    const y = lerp(e.prevY, e.y, alpha);
    const flashLeft = (this.flashes.get(e.id) ?? 0) - deltaMs;
    if (flashLeft > 0) this.flashes.set(e.id, flashLeft);
    else this.flashes.delete(e.id);
    const color = flashLeft > 0 ? 0xffffff : PALETTE[e.kind];
    const r = data.radius;

    if (e.mode === 'telegraph') {
      g.fillStyle(color, 0.25).fillCircle(x, y, r);
      g.lineStyle(2, PALETTE.telegraph, 0.9).strokeCircle(e.targetX, e.targetY, r + 4);
      return;
    }
    if (e.mode === 'windup') {
      g.lineStyle(3, PALETTE.telegraph, 0.7).lineBetween(x, y, x + e.dirX * FEEL.dashTelegraphLength, y + e.dirY * FEEL.dashTelegraphLength);
    }
    switch (e.kind) {
      case 'cheonyeo':
        g.fillStyle(color, 0.85).fillCircle(x, y, r);
        g.fillStyle(0x0b0a14).fillRect(x - r, y - r, r * 2, r * 0.9); // long black hair
        break;
      case 'dalgyal':
        g.fillStyle(color).fillEllipse(x, y, r * 1.7, r * 2.2);
        break;
      case 'subway':
        g.fillStyle(color, e.mode === 'dash' ? 1 : 0.8).fillRect(x - r, y - r, r * 2, r * 2);
        break;
      case 'printer':
        g.fillStyle(color).fillRoundedRect(x - r * 1.6, y - r, r * 3.2, r * 2, 8);
        g.fillStyle(0x0b0a14).fillRect(x - r * 1.2, y - 6, r * 2.4, 12);
        break;
    }
    if (e.stun > 0) g.lineStyle(2, PALETTE.talisman, 0.8).strokeCircle(x, y, r + 6);
    if (e.kind !== 'printer' && e.hp < e.maxHp) {
      g.fillStyle(PALETTE.hpBarBack).fillRect(x - r, y + r + 4, r * 2, 3);
      g.fillStyle(PALETTE.hpBar).fillRect(x - r, y + r + 4, (r * 2 * Math.max(0, e.hp)) / e.maxHp, 3);
    }
  }

  private drawDarkness(world: World, alpha: number): void {
    const p = world.player;
    const on = p.darkness > 0;
    this.dark.setFillStyle(0x000000, on ? FEEL.darknessAlpha : 0);
    if (!on) return;
    this.darkMask.clear();
    this.darkMask.fillStyle(0xffffff).fillCircle(lerp(p.prevX, p.x, alpha), lerp(p.prevY, p.y, alpha), FEEL.darknessVisionRadius);
  }
}
