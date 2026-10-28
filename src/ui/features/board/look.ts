// Colours of the contract board (docs/design/1-foundation/ui.md "의뢰판", mockup A).
export const BOARD_LOOK = {
  mapBg: '#1b1530',
  line: '#3b2f5c',
  ink: '#f6e7c1',
  dim: '#c9bfe8',
  off: '#6b6290', // districts with nothing posted
  accent: '#41e0c8',
  spread: '#ff3cac',
  bounty: '#ff3b4f',
  general: '#ffd166',
  heat: ['#3c6f8c', '#4f8a7a', '#b8a24a', '#d4813f', '#d9544f', '#ff3cac'], // contamination 0..5
  paper: '#efe4c8',
  paperBack: ['#d6c9a6', '#e2d6b4'],
  paperInk: '#2a2233',
  paperDim: '#6b5f73',
  paperCell: 'rgba(42,34,51,0.07)',
  paperOff: 'rgba(42,34,51,0.18)',
  stamp: '#c2333f',
  clip: '#8f8aa0',
  bundle: '#7dffb0',
  accentInk: '#1f7f72', // 메인 스토리 stamp on paper
  shardInk: '#5b3fc4', // 심연 파편 on paper
  bundleInk: '#1f7a4c', // what gets finished together, on paper
} as const;

// The provisional printed-paper map (canvas MapHybrid, user 2026-10-28 "가안 ㅇㅋ"): city blocks printed in
// navy on aged paper, contamination as red hatching (denser = more ghosts per floor), neon only on what
// is lit (the chosen district's teal ring, an urgent district's pink pin and arrows).
export const MAP_PRINT = {
  paper: '#e9dfc4',
  block: '#ddd1b0',
  navy: '#23345e',
  street: '#f7f1e1',
  // Contamination 0..5, read two ways at once (user 2026-10-29 "빗금은 잘 안 들어옴"): the block's ink
  // gets redder (Plague Inc / choropleth), and a row of 5 cubes under the name counts it (Pandemic
  // disease cubes, XCOM 2 panic pips). 5 = overflow.
  heat: ['#e6dcbf', '#ecd2b0', '#e8b393', '#dd8a70', '#c9584f', '#a82a3a'],
  pip: '#23345e', // filled cube = the navy print ink (readable on every block colour)
  pips: 5,
  block_w: 19,
  block_h: 10,
  glow: '#41e0c8',
  pinWork: '#e0a92e',
  pinBounty: '#c2333f',
  pinMain: '#1f7f72',
  pinUrgent: '#ff3cac',
} as const;
