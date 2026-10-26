// Day hub look (inside the office in the evening, after work). Layout lives in lobby.data.ts.
// Shapes only until hub art exists.
export const HUB_LOOK = {
  zoom: 2,
  backdrop: 0x14101f, // camera background around the room
  wallTop: 0x2a2338, // tops of the side and front walls
  wallpaper: 0x8c9a86, // faded green wallpaper
  wallpaperLo: 0x7a8874,
  wainscot: 0x5e4a3a, // wooden lower band of the back wall
  trim: 0x3d2f26,
  floor: 0x7a5a44, // wooden floor planks
  floorAlt: 0x725340,
  floorSeam: 0x5e4434,
  sunset: [0xffb36b, 0xf08a6a, 0xb8607a, 0x6a4a86] as readonly number[], // window sky bands, top to bottom
  skyline: 0x3a2a4a, // roofs and Namsan tower outside
  windowFrame: 0xe8dcc4,
  door: 0x4a3a30,
  doorHi: 0x6a5444,
  knob: 0xd8b860,
  clock: 0xf4f0e0,
  poster: 0xd8c27a, // a talisman-yellow calendar
  desk: 0x8a6a4a,
  deskTop: 0xa07c56,
  paper: 0xf4f0e0,
  monitor: 0x2a3a4a,
  monitorGlow: 0x7ad8c8,
  talismanInk: 0xc0392b, // 부적 작업대 ink
  sofa: 0x7a3a34, // worn leather
  sofaHi: 0x92483f,
  cabinet: 0x8a8e98,
  cabinetLine: 0x5e626c,
  pot: 0x9a4a3a,
  leaf: 0x4f8a4a,
  water: 0xd8e4ec,
  waterJug: 0x7ab8e0,
  bookkeeperTop: 0xd88a9a, // pink cardigan (placeholder shapes until art)
  bookkeeperHair: 0x2a1a14,
  skin: 0xefd2b0,
  promptSize: 22, // px text size (drawn at half scale for crispness)
  sceneDelay: 400, // ms after arriving before a due story scene opens
  bubbleSize: 20, // chatter speech bubble text size (px, drawn at half scale)
  bubbleWidth: 300, // px before wrapping (at that text scale)
  bubbleBg: '#f6e7c1',
  bubbleInk: '#2a2233',
  hintSize: 18,
} as const;
