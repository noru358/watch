import type Phaser from 'phaser';
import { DIRECTOR_SETS, DIRECTOR_SPRITE, type DirectorFrame } from '../../../data/sprites.data';

// Frame files are bundled by Vite; keys are "director:<set>:<frame number>".
const files = import.meta.glob('../../../../assets/sprites/director-gemini-*/frame_*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const directorKey = (frame: DirectorFrame) => `director:${frame}`;

export function loadDirectorFrames(scene: Phaser.Scene): void {
  const wanted = new Set<string>(Object.values(DIRECTOR_SPRITE.frames).flat());
  for (const [path, url] of Object.entries(files)) {
    const m = /\/(director-gemini-[^/]+)\/frame_(\d+)\.png$/.exec(path);
    if (!m) continue;
    const set = (Object.keys(DIRECTOR_SETS) as (keyof typeof DIRECTOR_SETS)[]).find((k) => DIRECTOR_SETS[k] === m[1]);
    if (!set) continue;
    const frame = `${set}:${Number(m[2])}` as DirectorFrame;
    if (wanted.has(frame)) scene.load.image(directorKey(frame), url);
  }
}
