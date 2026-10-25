// Ghost pixel art (from tools/artlab, one letter = one pixel, '.' = transparent).
// Drawn at 2x so a strong ghost stands about as tall as the director (1.5 tiles at 24px tiles);
// hitboxes stay smaller than the drawings. Kinds without art fall back to shapes.
import type { EnemyId } from '../../../../types/ids';

export interface GridArt {
  pal: Record<string, number>;
  rows: readonly string[];
  scale: number;
}

const O = 0x2b1e2f;

export const GHOST_ART: Partial<Record<EnemyId, GridArt>> = {
  cheonyeo: {
    scale: 2,
    pal: { O, K: 0x1a1424, F: 0xe9e6f5, D: 0xf2f2ff, d: 0xb9bde4 },
    rows: [
      '....OOOOOO....',
      '...OKKKKKKO...',
      '..OKKKKKKKKO..',
      '..OKKKKKKKKO..',
      '..OKKKFKKKKO..',
      '..OKKKFFKKKO..',
      '..OKKKKKKKKO..',
      '.OKKOODDOOKKO.',
      '.OKODDDDDDOKO.',
      '.OKODDDDDDOKO.',
      '.OKODDdDDDOKO.',
      '..OODDdDDDOO..',
      '..ODDDDdDDDO..',
      '.ODDdDDDDDdDO.',
      '.ODDDDDDDDDDO.',
      '.OdDDOdDDOdDO.',
      '..OO.ODO.OO...',
      '......O.......',
    ],
  },
  dokkaebibul: {
    scale: 2,
    pal: { O, b: 0x1b3b80, B: 0x3a9cf0, l: 0x9fe6ff, w: 0xffffff },
    rows: [
      '....bb....',
      '...bBb....',
      '...bBBb...',
      '..bBlBb...',
      '..bBllBb..',
      '.bBlwwlBb.',
      '.bBOwwOBb.',
      '.bBlwwlBb.',
      '..bBBBBb..',
      '...bbbb...',
    ],
  },
  dalgyal: {
    scale: 2,
    pal: { O, D: 0xf4f0d8, d: 0xc9c2a2 },
    rows: [
      '....OOOOOO....',
      '..OODDDDDDOO..',
      '.ODDDDDDDDDDO.',
      '.ODDDDDDDDDdO.',
      'ODDDDDDDDDDDdO',
      'ODDDDDDDDDDDdO',
      'ODDDDDDDDDDddO',
      'ODDDDDDDDDDddO',
      'ODdDDDDDDDDddO',
      '.ODdDDDDDDddO.',
      '.ODddDDDDdddO.',
      '..ODddddddDO..',
      '...OOddddOO...',
      '.....OOOO.....',
    ],
  },
};
