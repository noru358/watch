import type Phaser from 'phaser';
import { DIRECTOR_SETS, DIRECTOR_SPRITE, type DirectorAnim, type DirectorFrame } from '../../../data/sprites.data';
import { bodyColumn, pixelSprite, stackSprites, type PixelSprite } from './pixelSprite';

// Frame files are bundled by Vite; keys are "director:<set>:<frame number>".
const files = import.meta.glob('../../../../assets/sprites/director-gemini-*/frame_*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const directorKey = (frame: DirectorFrame) => `director:${frame}`;

export function loadDirectorFrames(scene: Phaser.Scene): void {
  const S = DIRECTOR_SPRITE;
  const wanted = new Set<string>([...Object.values(S.frames).flat(), S.stableHead.from, S.back.strike]);
  for (const [path, url] of Object.entries(files)) {
    const m = /\/(director-gemini-[^/]+)\/frame_(\d+)\.png$/.exec(path);
    if (!m) continue;
    const set = (Object.keys(DIRECTOR_SETS) as (keyof typeof DIRECTOR_SETS)[]).find((k) => DIRECTOR_SETS[k] === m[1]);
    if (!set) continue;
    const frame = `${set}:${Number(m[2])}` as DirectorFrame;
    if (wanted.has(frame)) scene.load.image(directorKey(frame), url);
  }
}

// One frame as drawn: anchored on the body column, and for stable-head animations the shared head on top.
const built = new Map<string, PixelSprite>();
export function directorSprite(scene: Phaser.Scene, anim: DirectorAnim, frame: DirectorFrame): PixelSprite | null {
  const head = DIRECTOR_SPRITE.stableHead;
  const stable = (head.anims as readonly DirectorAnim[]).includes(anim) && frame !== head.from;
  const key = stable ? `${frame}+head` : frame;
  const hit = built.get(key);
  if (hit) return hit;
  const anchored = (f: DirectorFrame): PixelSprite | null => {
    const raw = pixelSprite(scene, directorKey(f));
    if (!raw) return null;
    const [from, to] = DIRECTOR_SPRITE.anchorRows;
    return { ...raw, anchorX: bodyColumn(raw, from, to) };
  };
  const body = anchored(frame);
  if (!body) return null;
  const top = stable ? anchored(head.from) : null;
  const sprite = top ? stackSprites(top, body, head.rows) : body;
  built.set(key, sprite);
  return sprite;
}
