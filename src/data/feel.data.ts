// Presentation tuning (hit-stop, shake, popups, layout, colours). Read only by scenes/ and ui/.
export const SCREEN = { width: 960, height: 540 } as const;

export const FEEL = {
  fixedStep: 1 / 60, // simulation tick (seconds)
  maxStepsPerFrame: 5,
  // 24px tiles at 1.75x zoom (was 16px at 2.5x): about the same number of tiles on screen, but the
  // ~37px director sprite is ~1.5 tiles tall instead of 2.3, so bodies match attack ranges (2026-10-25).
  tile: 24, // px per tile
  zoom: 1.75, // world camera zoom
  wallFace: 13, // px height of a wall's front face (3/4 view)
  cameraLerp: 10, // camera follow speed per second
  mouseAimTimeout: 1.5, // seconds without mouse movement before aim falls back to keyboard aim
  keyboardSnapRange: 3, // keyboard aim: when standing still, face the nearest ghost within this many tiles
  uiTextResolution: 3, // UI text is rendered at this resolution so it stays crisp when the canvas is scaled
  bobHeight: 1.5, // px hop while walking
  ghostFloat: 2, // px ghost float amplitude
  hitStopHit: 0.012, // seconds the screen holds on a normal hit (short: frequent hits must not stutter)
  hitStopHeavy: 0.04, // 3rd combo hit / draw strike
  hitStopKill: 0.03, // strong ghosts only; swarm kills don't freeze
  hitStopHurt: 0.035,
  hitStopParry: 0.12,
  hitStopCooldown: 0.15, // a new small hit-stop is ignored this soon after the last one
  // Kept deliberately quiet: the user found hit effects too busy (2026-10-25).
  shakeHurt: { duration: 70, intensity: 0.0015 },
  shakeKill: { duration: 60, intensity: 0.002 }, // strong ghosts only
  shakeParry: { duration: 80, intensity: 0.004 },
  shakeBossPhase: { duration: 350, intensity: 0.008 },
  hurtFlashAlpha: 0.18, // brief red screen edge on hurt (no full-screen flash)
  popupRise: 24, // px
  popupDuration: 450, // ms
  popupSize: 20, // px on screen, normal hit numbers
  popupSizeSmall: 16, // px, hits on swarm fodder
  popupSizeBig: 26, // heavy hits, counters, damage taken
  flashDuration: 70, // ms enemy white flash on hit
  drawFxTime: 0.3, // seconds a 발도's range arc/ring stays visible
  swingTrailTime: 0.14, // seconds the swing trail sweeps
  darknessAlpha: 0.82,
  neonAlpha: 0.08, // boss phase-2 tint
  telegraphFill: [0.12, 0.4], // telegraph fill alpha from start to strike
  // Night lighting: the world is multiplied by `nightAmbient`, then light pools are added in
  // `lightBands` hard-edged rings (pixel look, no soft gradient). Radius in tiles.
  lightBands: 3,
  lights: {
    director: { radius: 3.2, color: 0xffe6c4, alpha: 0.05 },
    wisp: { radius: 1.8, color: 0x4aa8ff, alpha: 0.09 },
    cheonyeo: { radius: 1.6, color: 0xcfd0ff, alpha: 0.06 },
    stairs: { radius: 2.2, color: 0x2fd8c8, alpha: 0.08 },
    payphone: { radius: 2, color: 0x9be0c0, alpha: 0.08 },
  },
} as const;

export const PALETTE = {
  background: 0x14101f,
  // Euljiro basement tileset (art lab sample, 2026-10-25): concrete floor, plaster + green paint walls
  gridFloor: 0x4f4866,
  gridFloorAlt: 0x575070,
  floorSeam: 0x3d3754,
  floorSpeck: 0x6a6386,
  floorCrack: 0x36304a,
  gridWall: 0x0d0b14,
  wallTop: 0x2a2338,
  wallTopEdge: 0x3b3352,
  wallFace: 0x3f7a5c, // green waterproof paint
  wallFaceHi: 0x4f9271,
  wallFaceLo: 0x2f5e47,
  plaster: 0x8f8aa0,
  wallTrim: 0x24202e,
  body: 0x2f3a56, // director's coat
  skin: 0xefd2b0,
  hair: 0x3a2a20,
  newspaper: 0xc9c2a8,
  wall: 0x3b2f5c,
  stairs: 0x41e0c8,
  player: 0xf6e7c1,
  bareBlade: 0x9ff3e6, // ring while the sword is unwrapped
  telegraph: 0xff4fa3,
  pickup: 0x6ef0ff,
  payphone: 0x41e0c8,
  shield: 0xe8f4ff,
  cheonyeo: 0xe8e8ff,
  dalgyal: 0xf4f0d8,
  subway: 0x7fb7ff,
  dokkaebibul: 0x6ad8ff,
  gumiho: 0xf4f1ff, // white fur
  gumihoFire: 0x6fe3ff, // tail-tip fox fire (phase 2 uses neonPhase2)
  neonPhase2: 0xff3cac,
  nightAmbient: 0x9a8cd0, // multiply colour for the whole floor at night
  text: '#f6e7c1',
  textDim: '#9d8fc4',
  textDimHex: 0x9d8fc4,
  parriable: 0xffd166, // telegraph you can counter with 발도
  unparriable: 0xff3b4f, // telegraph you must dodge
  damageText: '#ffd166',
  hurtText: '#ff5d7a',
  healText: '#7dffb0',
  hpBar: 0xff5d7a,
  hurtEdge: 0xff3b4f,
  hpBarBack: 0x3b2f5c,
  focus: 0x9ff3e6,
  panel: 0x1d1830,
  panelBorder: 0x41e0c8,
  font: "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif",
} as const;
