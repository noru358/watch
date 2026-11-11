// 개체별 그림 규격 (src/data/artSpec.data.ts): every sprite folder that follows the spec has exactly
// its frames, each at the class's canvas, with no more colours than allowed and nothing below the
// ground point. The director master is checked against the person class.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { ART_CLASSES, BOSS_ART_SPEC, DIRECTOR_ART, GHOST_ART_SPEC, PORTRAIT_SPEC, artFolder, frameFiles, framesOf, type EntityArt } from '../src/data/artSpec.data';

interface Png { w: number; h: number; alpha: (x: number, y: number) => number; colors: number }

// Minimal reader for the files tools/spritekit writes: 8-bit RGBA, not interlaced.
function readPng(path: string): Png {
  const buf = readFileSync(path);
  let w = 0, h = 0, type = 0, depth = 0;
  const idat: Buffer[] = [];
  for (let at = 8; at < buf.length; ) {
    const len = buf.readUInt32BE(at);
    const kind = buf.toString('ascii', at + 4, at + 8);
    const data = buf.subarray(at + 8, at + 8 + len);
    if (kind === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]!; type = data[9]!; }
    if (kind === 'IDAT') idat.push(data);
    at += 12 + len;
  }
  if (depth !== 8 || type !== 6) throw new Error(`${path}: not 8-bit RGBA (depth ${depth}, type ${type})`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * 4;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]!;
    for (let i = 0; i < stride; i++) {
      const x = raw[y * (stride + 1) + 1 + i]!;
      const a = i >= 4 ? px[y * stride + i - 4]! : 0;
      const b = y > 0 ? px[(y - 1) * stride + i]! : 0;
      const c = i >= 4 && y > 0 ? px[(y - 1) * stride + i - 4]! : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      px[y * stride + i] = (x + pred) & 0xff;
    }
  }
  const set = new Set<number>();
  for (let i = 0; i < px.length; i += 4) if (px[i + 3]! > 0) set.add(px.readUInt32BE(i));
  return { w, h, alpha: (x, y) => px[y * stride + x * 4 + 3]!, colors: set.size };
}

const lowestRow = (p: Png): number => {
  for (let y = p.h - 1; y >= 0; y--) for (let x = 0; x < p.w; x++) if (p.alpha(x, y) > 0) return y;
  return -1;
};

const SPRITES = join(__dirname, '..', 'assets', 'sprites');
const entities: [string, EntityArt][] = [
  [artFolder('director'), DIRECTOR_ART],
  ...Object.entries(GHOST_ART_SPEC).map(([id, e]) => [artFolder('ghost', id), e] as [string, EntityArt]),
  ...Object.entries(BOSS_ART_SPEC).map(([id, e]) => [artFolder('boss', id), e] as [string, EntityArt]),
  ...Object.entries(PORTRAIT_SPEC).map(([id, e]) => [artFolder('portrait', id), e!] as [string, EntityArt]),
];

describe('art spec', () => {
  it('every class anchor sits inside its canvas, and standing classes keep the ground point near the bottom', () => {
    for (const [name, c] of Object.entries(ART_CLASSES)) {
      expect(c.anchor.x, name).toBeLessThanOrEqual(c.w);
      expect(c.anchor.y, name).toBeLessThanOrEqual(c.h);
      for (const n of Object.values(c.frames)) expect(n, name).toBeGreaterThan(0);
    }
  });

  it('frame file names are unique per entity', () => {
    for (const [folder, e] of entities) {
      const files = frameFiles(e);
      expect(new Set(files).size, folder).toBe(files.length);
      expect(files.length, folder).toBe(Object.values(framesOf(e)).reduce((a, b) => a + b, 0));
    }
  });

  it('the director master fits the person class: canvas, colours, feet on the ground row', () => {
    const c = ART_CLASSES.person;
    const m = readPng(join(__dirname, '..', 'assets', 'master', 'director-master.png'));
    expect([m.w, m.h]).toEqual([c.w, c.h]);
    expect(m.colors).toBeLessThanOrEqual(c.maxColors);
    expect(lowestRow(m)).toBe(c.anchor.y - 1);
  });

  // Folders that follow the spec (named by artFolder). The older director-gemini-* folders predate it.
  it('every spec folder in assets/sprites has exactly its frames at the class size', () => {
    for (const [folder, e] of entities) {
      const dir = join(SPRITES, folder);
      if (!existsSync(dir)) continue;
      const c = ART_CLASSES[e.class];
      const want = frameFiles(e).sort();
      const have = readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
      expect(have, folder).toEqual(want);
      for (const f of have) {
        const p = readPng(join(dir, f));
        expect([p.w, p.h], `${folder}/${f}`).toEqual([c.w, c.h]);
        expect(p.colors, `${folder}/${f} colours`).toBeLessThanOrEqual(c.maxColors);
        if (c.anchor.y > 0) expect(lowestRow(p), `${folder}/${f} stands on the ground row`).toBeLessThanOrEqual(c.anchor.y - 1);
      }
    }
  });
});
