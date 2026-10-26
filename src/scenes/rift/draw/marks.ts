import { OBJECTIVES } from '../../../data/objectives.data';
import { PALETTE } from '../../../data/feel.data';
import type { Enemy, Floor } from '../../../systems/rift';
import { lerp, T, type G } from '../../shared/draw/common';

// Floor marks that belong to objectives, modifiers and skills (shapes until real art):
// ward circles, salt and barrier zones, flying talismans, sealed lair doors, 심연 파편.

export function drawFloorMarks(g: G, f: Floor, clock: number): void {
  const o = f.objective;
  if (o?.kind === 'ward') {
    const r = OBJECTIVES.ward.radius * T;
    for (const s of o.sites) {
      const done = s.progress >= 1;
      g.lineStyle(2, PALETTE.barrier, done ? 0.9 : 0.5 + 0.2 * Math.sin(clock * 4)).strokeCircle(s.x * T, s.y * T, r);
      if (s.progress > 0 && !done) {
        g.lineStyle(4, PALETTE.barrier, 0.9).beginPath().arc(s.x * T, s.y * T, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * s.progress).strokePath();
      }
      g.fillStyle(done ? PALETTE.barrier : PALETTE.talisman, 1).fillRect(s.x * T - 3, s.y * T - 10, 6, 10);
    }
  }
  for (const z of f.zones) {
    const a = Math.min(1, z.t);
    if (z.kind === 'salt') g.fillStyle(PALETTE.salt, 0.5 * a).fillCircle(z.x * T, z.y * T, z.r * T * 0.6);
    else g.lineStyle(3, PALETTE.barrier, 0.9 * a).strokeCircle(z.x * T, z.y * T, z.r * T).fillStyle(PALETTE.barrier, 0.12 * a).fillCircle(z.x * T, z.y * T, z.r * T);
  }
  if (f.lair?.locked && !f.lair.cleared) {
    for (const i of f.lair.doors) {
      const x = (i % f.cols) * T;
      const y = Math.floor(i / f.cols) * T;
      g.fillStyle(PALETTE.lairDoor, 0.85).fillRect(x, y - 6, T, T + 6);
      g.lineStyle(1, PALETTE.fear, 0.6 + 0.4 * Math.sin(clock * 6)).strokeRect(x + 1, y - 5, T - 2, T + 4);
    }
  }
  for (const k of f.pickups) {
    if (!k.shard) continue;
    const px = k.x * T;
    const py = k.y * T - 4 + Math.sin(clock * 3) * 2;
    g.fillStyle(PALETTE.shard, 0.25).fillCircle(px, py, 9);
    g.fillStyle(PALETTE.shard, 1).fillTriangle(px, py - 7, px + 4, py, px - 4, py).fillTriangle(px, py + 7, px + 4, py, px - 4, py);
  }
}

// Flying talismans, drawn above bodies.
export function drawShots(g: G, f: Floor): void {
  for (const s of f.shots) {
    const a = Math.atan2(s.vy, s.vx);
    const x = s.x * T;
    const y = s.y * T;
    g.fillStyle(PALETTE.talisman, 1).fillPoints(
      [0, 1, 2, 3].map((k) => {
        const ang = a + [0.4, Math.PI - 0.4, Math.PI + 0.4, -0.4][k]!;
        return { x: x + Math.cos(ang) * 6, y: y + Math.sin(ang) * 4 };
      }),
      true,
    );
  }
}

// A named ghost (현상수배 / 추격) gets a red ring under it and a mark over its head; a sleeping one zzz.
export function drawEnemyMark(g: G, e: Enemy, alpha: number, clock: number): void {
  if (e.role !== 'bounty' && e.role !== 'quarry' && !e.asleep) return;
  const x = lerp(e.prevX, e.x, alpha) * T;
  const y = lerp(e.prevY, e.y, alpha) * T;
  if (e.role === 'bounty' || e.role === 'quarry') {
    g.lineStyle(2, PALETTE.bountyMark, 0.7 + 0.3 * Math.sin(clock * 5)).strokeEllipse(x, y, e.r * T * 3, e.r * T * 1.4);
    g.fillStyle(PALETTE.bountyMark, 1).fillTriangle(x, y - e.r * T - 26, x - 5, y - e.r * T - 34, x + 5, y - e.r * T - 34);
  }
  if (e.asleep) {
    const k = (clock * 0.8) % 1;
    g.fillStyle(0xffffff, 1 - k).fillRect(x + 8 + k * 6, y - 30 - k * 10, 5, 2);
  }
}
