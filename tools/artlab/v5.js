// Director v5 (2026-10-25): from reference 4 (Soul Knight) measured at native pixels:
// slim short legs (3px each, 1px gap, 3px shoes), thick 3px upper lash over a 3x2 eye with
// white on the outer side, layered hair with diagonal highlight strands and side locks,
// no shading under the face (it read as a beard), sword held in hand.
const PAL5 = {
  O: '#0e0a10', H: '#2e1f1b', h: '#4a3029', i: '#6b4535', l: '#8f604a',
  S: '#ffe0cc', p: '#f4a19a', m: '#d98c86', E: '#2d3f7a', e: '#5b8ad6', w: '#ffffff',
  T: '#1d1b26', J: '#3b3e5a', j: '#2a2c40', k: '#565a80', 1: '#4a90ff', 2: '#f4f4f0',
  8: '#e8d9ba', 9: '#c2ae8b', a: '#f0ece4', g: '#8f8a80',
  N: '#e2d9b8', n: '#b0a684', x: '#7b7262', A: '#5a3a2a',
};

const V5 = [
  '.........OOOOOOOO.........',
  '.......OOhhhhhhhhOO.......',
  '......OhhhhhiihhhhhO......',
  '.....OhhhhhiilhhhhhhO.....',
  '....OHhhhhiilhhhhhhhhO....',
  '...OHhhhhiilhhhhhihhhHO...',
  '..OHHhhhhiilhhhhhihhhhHO..',
  '..OHHhhhhilhhhhhhihhhhHO..',
  '..OHhHhhhihhhhhihhhhHhHO..',
  '..OHhiHhhShhhhhShhhHihHO..',
  '..OhHiHSShSSShSSShSHiHhO..',
  '..OhHihSOOOSSSSOOOShiHhO..',
  '..OHhihSwEESSSSEEwShihHO..',
  '..OHhHhSSweSSSSewSShHhHO..',
  '.OhHiHhSppSSSSSSppShHiHhO.',
  'OhOHiHhhSSSSSmSSSShhHiHOhO',
  '...OhHiHHOOTTTTOOHHiHhO...',
  '..OhiHHhOJJ1TT1JJOhHHihO..',
  '...OhO.OkJJJ11JJJkO.OhO...',
  '......OkjJJJ22JJJjkO......',
  '......OSjJJJJJJJJjSO......',
  '.......OjjjjjjjjjjO.......',
  '........O889O988O.........',
  '........O889O988O.........',
  '........OaaaOaaaO.........',
  '........OgggOgggO.........',
  '.........OOO.OOO..........',
];

const SWORD_HAND = [
  '.OO.',
  'ONnO',
  'ONxO',
  'ONNO',
  'OxNO',
  'ONnO',
  'ONxO',
  'ONNO',
  '.OO.',
  '.OAO',
  '.OO.',
];


// v6: long straight hair (user photo), drawn in the 3/4 front-diagonal facing down-right.
// Plan: 2 drawings (front-diagonal, back-diagonal) + horizontal flips = 4 facings.
const V6 = [
  '........OOOOOO........',
  '......OOhhhhhhOO......',
  '.....OhhhhhhhiihO.....',
  '....OhhiiiiihhhihO....',
  '....OhhhhhhiiiihihO...',
  '....OhhhhhhhhhhhiihO..',
  '...OHhhhhhhhhhhhhhihO.',
  '...OHhhhhhhhhhhhhhihO.',
  '...OHhhhhhhhhhSSSShhO.',
  '...OHhhhhhhSSSSSSSShO.',
  '...OHhhhhhSOOSSOOOShO.',
  '...OHhhihhSwESSEEwShO.',
  '...OHhhihhSSeSSeeSShO.',
  '...OHhhihhSpSSmSppShO.',
  '...OHhhihhOSSSSSSOhhO.',
  '...OHhhihhOOTTTTOhhO..',
  '...OHhihOJJ1TT1JJhhO..',
  '...OHhihOkJJ11JJJhhO..',
  '..OHhihOkJJJ22JJJhO...',
  '...OhihOSjJJJJJJjSO...',
  '....OhOOjjjjjjjjO.....',
  '........O889O988O.....',
  '........O889O988O.....',
  '........OaaaOaaaO.....',
  '........OgggOgggO.....',
  '.........OOO.OOO......',
];

export const V5_SPRITES = {
  v5: { pal: PAL5, rows: V5 },
  swordHand: { pal: PAL5, rows: SWORD_HAND },
  v5s: { base: 'v5', over: [['swordHand', 19, 13]] },
  v6: { pal: { ...PAL5, H: '#1f1716', h: '#3a2a26', i: '#5e463d' }, rows: V6 },
  v6s: { base: 'v6', over: [['swordHand', 18, 14]] },
};
