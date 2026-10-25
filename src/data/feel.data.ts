// Presentation tuning (hit-stop, shake, popups, layout, colours). Read only by scenes/ and ui/.
export const SCREEN = { width: 960, height: 540 } as const;

export const FEEL = {
  fixedStep: 1 / 60, // simulation tick (seconds)
  maxStepsPerFrame: 5,
  tile: 16, // px per tile (japda convention)
  zoom: 2.5, // world camera zoom
  wallFace: 9, // px height of a wall's front face (3/4 view)
  cameraLerp: 10, // camera follow speed per second
  mouseAimTimeout: 1.5, // seconds without mouse movement before aim falls back to keyboard aim
  keyboardSnapRange: 3, // keyboard aim: when standing still, face the nearest ghost within this many tiles
  uiTextResolution: 3, // UI text is rendered at this resolution so it stays crisp when the canvas is scaled
  bobHeight: 1.5, // px hop while walking
  ghostFloat: 2, // px ghost float amplitude
  hitStopHit: 0.012, // seconds the screen holds on a normal hit (short: frequent hits must not stutter)
  hitStopHeavy: 0.04, // 3rd combo hit / draw strike
  hitStopKill: 0.03, // strong ghosts only; swarm kills don't freeze
  hitStopHurt: 0.06,
  hitStopParry: 0.12,
  hitStopCooldown: 0.15, // a new small hit-stop is ignored this soon after the last one
  shakeHurt: { duration: 160, intensity: 0.012 },
  shakeKill: { duration: 90, intensity: 0.005 },
  shakeBossPhase: { duration: 500, intensity: 0.02 },
  popupRise: 36, // px
  popupDuration: 600, // ms
  flashDuration: 70, // ms enemy white flash on hit
  darknessAlpha: 0.82,
  neonAlpha: 0.08, // boss phase-2 tint
  telegraphFill: [0.12, 0.4], // telegraph fill alpha from start to strike
} as const;

export const PALETTE = {
  background: 0x14101f,
  gridFloor: 0x342c5c,
  gridFloorAlt: 0x3a3266,
  gridWall: 0x0d0b14,
  wallTop: 0x2a2244,
  wallFace: 0x5a4a86,
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
  printer: 0xc77dff,
  neonPhase2: 0xff3cac,
  text: '#f6e7c1',
  textDim: '#9d8fc4',
  textDimHex: 0x9d8fc4,
  parriable: 0xffd166, // telegraph you can counter with 발도
  unparriable: 0xff3b4f, // telegraph you must dodge
  damageText: '#ffd166',
  hurtText: '#ff5d7a',
  healText: '#7dffb0',
  hpBar: 0xff5d7a,
  hpBarBack: 0x3b2f5c,
  focus: 0x9ff3e6,
  panel: 0x1d1830,
  panelBorder: 0x41e0c8,
  font: "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif",
} as const;
