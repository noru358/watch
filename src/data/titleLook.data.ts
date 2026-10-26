// Title screen look (docs/design/1-foundation/ui.md "타이틀": B's neon sign over a brick wall,
// A's vertical menu with the save's day and money beside 이어하기). Pixels at 960×540.
export const TITLE_LOOK = {
  wall: 0x1a1220,
  mortar: 0x0d0910,
  brick: { w: 56, h: 28 },
  glow: 0xff3cac,
  glowAlpha: 0.05, // per ring; a few rings make the soft pink haze behind the sign
  sign: { y: 54, w: 560, h: 150, radius: 16, line: 4 },
  neon: 0xff3cac,
  neonText: '#ffe3f3',
  teal: '#41e0c8',
  ink: '#f6e7c1',
  dim: '#9d8fc4',
  rowHi: 0x41e0c8,
  menu: { y: 276, w: 340, row: 40 },
  buzzEvery: 4, // seconds; the sign flickers briefly once per cycle
} as const;
