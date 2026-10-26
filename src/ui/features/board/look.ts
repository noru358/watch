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
