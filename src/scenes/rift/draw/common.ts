import type Phaser from 'phaser';
import { FEEL } from '../../../data/feel.data';

// Shared helpers for the draw/ files. Each draw file is one "skin": when real art
// arrives, the shapes in that file are replaced by sprites without touching the others.
export type G = Phaser.GameObjects.Graphics;
export const T = FEEL.tile;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function shadow(g: G, x: number, y: number, r: number): void {
  g.fillStyle(0x000000, 0.3).fillEllipse(x, y + 1, r * 2.2, r * 0.9);
}
