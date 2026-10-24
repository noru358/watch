// Presentation tuning (hit-stop, shake, popups, colours). Read only by scenes/.
export const FEEL = {
  fixedStep: 1 / 60,
  maxStepsPerFrame: 5,
  hitStopHit: 0.035, // seconds the simulation freezes on an enemy hit
  hitStopKill: 0.07,
  hitStopHurt: 0.1,
  shakeHurt: { duration: 160, intensity: 0.012 },
  shakeKill: { duration: 90, intensity: 0.005 },
  shakeBossPhase: { duration: 500, intensity: 0.02 },
  popupRise: 36, // px
  popupDuration: 600, // ms
  flashDuration: 70, // ms enemy white flash on hit
  floorGrid: 48,
  dashTelegraphLength: 260,
  darknessVisionRadius: 90,
  darknessAlpha: 0.82,
  neonAlpha: 0.07,
} as const;

export const PALETTE = {
  background: 0x14101f,
  floor: 0x1d1830,
  floorLine: 0x2a2342,
  wall: 0x3b2f5c,
  doorClosed: 0x5a2340,
  doorOpen: 0x41e0c8,
  player: 0xf6e7c1,
  playerRoll: 0x9ff3e6,
  playerHurt: 0xff5d7a,
  talisman: 0xffd166,
  ward: 0xffd166,
  enemyBullet: 0xff4fa3,
  cheonyeo: 0xe8e8ff,
  dalgyal: 0xf4f0d8,
  subway: 0x7fb7ff,
  printer: 0xc77dff,
  telegraph: 0xff4fa3,
  pickup: 0x6ef0ff,
  payphone: 0x41e0c8,
  neonPhase2: 0xff3cac,
  text: '#f6e7c1',
  textDim: '#9d8fc4',
  damageText: '#ffd166',
  hurtText: '#ff5d7a',
  healText: '#7dffb0',
  hpBar: 0xff5d7a,
  hpBarBack: 0x3b2f5c,
  shield: 0xe8f4ff,
  panel: 0x1d1830,
  panelBorder: 0x41e0c8,
  font: "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif",
} as const;
