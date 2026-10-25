import type Phaser from 'phaser';
import { DIRECTOR_SPRITE } from '../../../data/sprites.data';

// Frame files are bundled by Vite; keys are "director:<frame number>".
const files = import.meta.glob('../../../../assets/sprites/director-gemini-v1/frame_*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const directorKey = (frame: number) => `director:${frame}`;

export function loadDirectorFrames(scene: Phaser.Scene): void {
  const wanted = new Set(Object.values(DIRECTOR_SPRITE.frames).flat());
  for (const [path, url] of Object.entries(files)) {
    const n = Number(/frame_(\d+)\.png$/.exec(path)?.[1]);
    if (wanted.has(n)) scene.load.image(directorKey(n), url);
  }
}
