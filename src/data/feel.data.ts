// Presentation tuning (hit-stop, shake, popups, layout, colours). Read only by scenes/ and ui/.
export const SCREEN = { width: 960, height: 540 } as const;

export const FEEL = {
  tile: 30, // px per grid tile
  offsetY: 30, // HUD strip above the map
  moveRepeat: 0.13, // seconds between steps while a direction is held
  slideSpeed: 14, // display lerp factor per second (entities glide between tiles)
  hitStopHit: 0.035, // seconds the screen holds on a hit
  hitStopKill: 0.07,
  hitStopHurt: 0.1,
  hitStopParry: 0.12,
  shakeHurt: { duration: 160, intensity: 0.012 },
  shakeKill: { duration: 90, intensity: 0.005 },
  shakeBossPhase: { duration: 500, intensity: 0.02 },
  popupRise: 36, // px
  popupDuration: 600, // ms
  flashDuration: 70, // ms enemy white flash on hit
  darknessAlpha: 0.82,
  neonAlpha: 0.08, // boss phase-2 tint
} as const;

export const PALETTE = {
  background: 0x14101f,
  gridFloor: 0x342c5c,
  gridWall: 0x0d0b14,
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
  printer: 0xc77dff,
  neonPhase2: 0xff3cac,
  text: '#f6e7c1',
  textDim: '#9d8fc4',
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
