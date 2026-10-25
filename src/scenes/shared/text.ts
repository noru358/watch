import type Phaser from 'phaser';
import { FEEL } from '../../data/feel.data';

// UI text rendered at a higher resolution so it stays sharp when the canvas is scaled to the window.
export function crisp<T extends Phaser.GameObjects.Text>(text: T): T {
  return text.setResolution(FEEL.uiTextResolution);
}
