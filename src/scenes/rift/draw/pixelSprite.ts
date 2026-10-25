import type Phaser from 'phaser';
import type { G } from './common';

// A sprite stored as horizontal runs of one colour, so it can be drawn into the same
// Graphics as everything else (one Graphics = one y-sorted draw order).
export interface PixelSprite {
  w: number;
  h: number;
  runs: { x: number; y: number; len: number; color: number }[];
}

const cache = new Map<string, PixelSprite>();

export function pixelSprite(scene: Phaser.Scene, key: string): PixelSprite | null {
  const hit = cache.get(key);
  if (hit) return hit;
  if (!scene.textures.exists(key)) return null;
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement;
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(src, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const at = (x: number, y: number) => {
    const i = (y * c.width + x) * 4;
    return (d[i + 3] ?? 0) < 128 ? -1 : ((d[i] ?? 0) << 16) | ((d[i + 1] ?? 0) << 8) | (d[i + 2] ?? 0);
  };
  const runs: PixelSprite['runs'] = [];
  for (let y = 0; y < c.height; y++) {
    let x = 0;
    while (x < c.width) {
      const color = at(x, y);
      let len = 1;
      while (x + len < c.width && at(x + len, y) === color) len++;
      if (color >= 0) runs.push({ x, y, len, color });
      x += len;
    }
  }
  const sprite = { w: c.width, h: c.height, runs };
  cache.set(key, sprite);
  return sprite;
}

// Builds a sprite from letter rows (tools/artlab format), cached per rows array.
const gridCache = new WeakMap<readonly string[], PixelSprite>();
export function gridSprite(rows: readonly string[], pal: Record<string, number>): PixelSprite {
  const hit = gridCache.get(rows);
  if (hit) return hit;
  const runs: PixelSprite['runs'] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x] ?? '.';
      let len = 1;
      while (row[x + len] === ch) len++;
      const color = pal[ch];
      if (ch !== '.' && color !== undefined) runs.push({ x, y, len, color });
      x += len;
    }
  });
  const sprite = { w: rows[0]?.length ?? 0, h: rows.length, runs };
  gridCache.set(rows, sprite);
  return sprite;
}

// Draws with the feet (bottom centre) at (fx, fy), each sprite pixel `scale` px wide.
// `white` paints every pixel white (hit flash).
export function drawPixelSprite(g: G, s: PixelSprite, fx: number, fy: number, flip: boolean, alpha = 1, white = false, scale = 1): void {
  const x0 = Math.round(fx - (s.w * scale) / 2);
  const y0 = Math.round(fy - s.h * scale);
  for (const r of s.runs) {
    g.fillStyle(white ? 0xffffff : r.color, alpha);
    const x = flip ? s.w - r.x - r.len : r.x;
    g.fillRect(x0 + x * scale, y0 + r.y * scale, r.len * scale, scale);
  }
}
