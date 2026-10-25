// Director v4: re-drawn by rules measured from Soul Knight sprites (2026-10-25):
// pure-dark 1px outline, head/hair ~60% of height, small face window framed by thick hair,
// 2x2 eyes (white + dark, iris below), one accent colour across the body, ~16 colours.
// Each entry: { pal, rows } or { base, under: [[name, dx, dy]], pal } for composites.

const PAL4 = {
  O: '#120d16', H: '#33221f', h: '#4f342b', i: '#76503f',
  S: '#f7d6b8', s: '#e2ab90', p: '#ef9c94', E: '#1c1a30', e: '#3f6fc0', w: '#ffffff',
  T: '#1a1822', J: '#3a3d58', j: '#282a3e', k: '#575b80', 1: '#4a90ff', 2: '#f4f4f0',
  8: '#e6d6b6', 9: '#bfac8a', a: '#eee9e0', g: '#9c968a',
  N: '#e2d9b8', n: '#b0a684', x: '#7b7262', A: '#5a3a2a',
};

const V4 = [
  '........OOOOOOOO........',
  '......OOhhhhhhhhOO......',
  '.....OhhhiihhhhhhhO.....',
  '....OhhhiiihhhhhhhhO....',
  '...OHhhhhhhhhhhhhhhHO...',
  '...OHhhhhHhhhhHhhhhHO...',
  '..OHHhhhHhhhhHhhHhhHHO..',
  '..OHHHhhHhhhHhhhHhhHHO..',
  '..OHHHHHhhhHhhhHhHHHHO..',
  '..OHHHHSShhHhhhHhHHHHO..',
  '..OHHHHSSSSShhhhSHHHHO..',
  '..OHHHHSwESSSSEwSHHHHO..',
  '..OHHHHSSeSSSSeSSHHHHO..',
  '..OHHHHSpSSSSSSpSHHHHO..',
  '..OHHHHHsSSSSSSsHHHHHO..',
  '.OhHHHHHHOTTTTOHHHHHHhO.',
  'OhHHHHOjJJ1TT1JJjOHHHHhO',
  '.OhO.OkJJJJ11JJJJkO.OhO.',
  '.....OkJJJJ22JJJJkO.....',
  '.....OSjJJJJJJJJjSO.....',
  '......OjjjjjjjjjjO......',
  '......O8898888988O......',
  '......O8898OO8988O......',
  '......OaagO..OgaaO......',
  '......OOOOO..OOOOO......',
];

const SWORD_BACK = [
  '............OO',
  '...........OAO',
  '..........OAAO',
  '.........OAAO.',
  '........ONNO..',
  '.......ONxNO..',
  '......ONNnO...',
  '.....ONxNO....',
  '....ONNnO.....',
  '...ONxNO......',
  '..ONNnO.......',
  '.ONxNO........',
  'ONnnO.........',
  'OOOO..........',
];

export const V4_SPRITES = {
  v4a: { pal: PAL4, rows: V4 },
  swordBack: { pal: PAL4, rows: SWORD_BACK },
  v4b: { base: 'v4a', under: [['swordBack', 12, -7]] },
  v4c: { pal: { ...PAL4, H: '#17141f', h: '#272538', i: '#3d4c70', e: '#d08a2a' }, rows: V4, under: [['swordBack', 12, -7]] },
};
