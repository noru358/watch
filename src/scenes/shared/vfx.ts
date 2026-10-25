import Phaser from 'phaser';
import type { EventBus } from '../../core/EventBus';
import { FEEL, PALETTE } from '../../data/feel.data';
import { playSfx } from './sfx';

interface VfxHooks {
  freeze(seconds: number): void; // hit-stop: pauses the simulation clock briefly
  view: { flash(entityId: number): void; setNeon(on: boolean): void };
  layer: Phaser.GameObjects.Layer; // world layer: popups live in world space under the zoomed camera
}

let hooksRef: VfxHooks | null = null;

function popup(scene: Phaser.Scene, x: number, y: number, text: string, color: string, size = 18): void {
  const z = FEEL.zoom;
  const label = scene.add
    .text(x, y - 4, text, { fontFamily: PALETTE.font, fontSize: `${size / z}px`, color, stroke: '#000000', strokeThickness: 3 / z })
    .setResolution(z * 2)
    .setOrigin(0.5)
    .setDepth(40);
  hooksRef?.layer.add(label);
  scene.tweens.add({
    targets: label,
    y: y - 4 - FEEL.popupRise / z,
    alpha: 0,
    duration: FEEL.popupDuration,
    ease: 'Cubic.easeOut',
    onComplete: () => label.destroy(),
  });
}

function ring(scene: Phaser.Scene, x: number, y: number, radius: number, color: number): void {
  const c = scene.add.circle(x, y, radius * 0.4).setStrokeStyle(1.2, color, 1).setDepth(39);
  hooksRef?.layer.add(c);
  scene.tweens.add({ targets: c, scale: 2.5, alpha: 0, duration: 260, onComplete: () => c.destroy() });
}

// Presentation listeners for the night. Returns an unsubscribe function.
// Nothing here may change game state (Rule 3).
export function attachVfx(scene: Phaser.Scene, bus: EventBus, hooks: VfxHooks): () => void {
  hooksRef = hooks;
  const cam = scene.cameras.main;
  const offs = [
    bus.on('enemyHit', (e) => {
      hooks.view.flash(e.entityId);
      hooks.freeze(FEEL.hitStopHit);
      popup(scene, e.x, e.y, String(Math.max(1, Math.round(e.amount))), e.empowered ? PALETTE.healText : PALETTE.damageText, e.empowered ? 26 : 18);
      playSfx('hit');
    }),
    bus.on('enemyKilled', (e) => {
      hooks.freeze(FEEL.hitStopKill);
      cam.shake(FEEL.shakeKill.duration, FEEL.shakeKill.intensity);
      ring(scene, e.x, e.y, 14, PALETTE.pickup);
      playSfx('kill');
    }),
    bus.on('playerHurt', (e) => {
      hooks.freeze(FEEL.hitStopHurt);
      cam.shake(FEEL.shakeHurt.duration, FEEL.shakeHurt.intensity);
      cam.flash(120, 255, 60, 100);
      popup(scene, e.x, e.y, `-${e.amount}`, PALETTE.hurtText, 22);
      playSfx('hurt');
    }),
    bus.on('playerHealed', (e) => popup(scene, e.x, e.y, `+${e.amount}`, PALETTE.healText, 22)),
    bus.on('shieldBlocked', (e) => {
      ring(scene, e.x, e.y, 12, PALETTE.shield);
      playSfx('block');
    }),
    bus.on('pickupCollected', () => playSfx('pickup')),
    bus.on('slash', () => playSfx('slash')),
    bus.on('dash', (e) => {
      ring(scene, e.x, e.y + 4, 8, PALETTE.textDimHex);
      playSfx('dash');
    }),
    bus.on('enemyTeleport', (e) => ring(scene, e.x, e.y, 10, PALETTE.telegraph)),
    bus.on('bossPhase', () => {
      cam.shake(FEEL.shakeBossPhase.duration, FEEL.shakeBossPhase.intensity);
      cam.flash(300, 255, 60, 172);
      hooks.view.setNeon(true);
      playSfx('phase');
    }),
    bus.on('roomCleared', () => playSfx('clear')),
    bus.on('parry', (e) => {
      hooks.freeze(FEEL.hitStopParry);
      cam.flash(90, 160, 220, 255);
      cam.shake(FEEL.shakeKill.duration, FEEL.shakeKill.intensity * 2);
      ring(scene, e.x, e.y, 20, PALETTE.bareBlade);
      playSfx('parry');
    }),
  ];
  return () => {
    offs.forEach((off) => off());
    hooksRef = null;
  };
}
