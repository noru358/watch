import type { FloorTheme } from '../types/ids';

// Hand-made rooms as text (docs/design/2-night/objectives.md "글자 틀 방"). No map tool: a room is a
// grid of characters. The generator (rift/layout.ts) stitches them into a floor, mirrored or not.
//   #  wall          .  floor        +  door (on the edge; corridors join here)
//   p  prop (counter, pillar, shelf — solid; drawn as wall for now)
//   e  a strong ghost's spot   t  treasure / spirit spot   s  stairs spot
//   o  objective spot (ward circle, missing person)        ~  water (a grabber's spot)
//   ?  wall or floor, half and half
// Every row of a room has the same length; width 7–15, height 5–11 (tests/rooms.test.ts checks).
// A room can land anywhere but the start room. Its spots are used for whatever the floor puts in it:
// if it turns out to be the exit room, the stairs go on its `s`; if the treasure room, the heap on its `t`.

export interface RoomTemplate {
  themes: readonly FloorTheme[];
  weight: number;
  mirror: boolean; // also used flipped left–right
  rows: readonly string[];
}

export const ROOMS = {
  // ── 골목 ──
  stall_row: {
    themes: ['alley'], weight: 1, mirror: false,
    rows: [
      '#####+#####',
      '#.........#',
      '#.e.....e.#',
      '+.ppppppp.+',
      '#.........#',
      '#..t...e..#',
      '#####+#####',
    ],
  },
  dead_end: {
    themes: ['alley'], weight: 1, mirror: true,
    rows: [
      '#####+#####',
      '+.........#',
      '#.e.....e.#',
      '####...####',
      '####...####',
      '####.t.####',
      '####...####',
      '####.s.####',
      '###########',
    ],
  },
  pole_yard: {
    themes: ['alley', 'rooftop'], weight: 1, mirror: true,
    rows: [
      '##+#######',
      '#........#',
      '#.p....p.#',
      '#...e....+',
      '#....e...#',
      '#.p....p.#',
      '#..t.....#',
      '#######+##',
    ],
  },
  bottleneck: {
    themes: ['alley'], weight: 1, mirror: true,
    rows: [
      '############',
      '+...##..##.#',
      '#.e.##..##e#',
      '#..........+',
      '#...##..##s#',
      '#...##..##.#',
      '######+#####',
    ],
  },
  // ── 지하 ──
  boiler_room: {
    themes: ['basement'], weight: 1, mirror: false,
    rows: [
      '#####+#####',
      '#.........#',
      '#.pp...pp.#',
      '#.pp.e.pp.#',
      '+.........+',
      '#.pp.e.pp.#',
      '#.pp...pp.#',
      '#....t....#',
      '###########',
    ],
  },
  shelf_store: {
    themes: ['basement'], weight: 1, mirror: true,
    rows: [
      '######+#####',
      '#..........#',
      '#.p..p..p..#',
      '#.p..p..p.e#',
      '#.p..p..p..#',
      '#.p..p..p..#',
      '#.e........+',
      '#..t....s..#',
      '############',
    ],
  },
  u_corridor: {
    themes: ['basement'], weight: 1, mirror: true,
    rows: [
      '#####+#####',
      '#.........#',
      '#.e.......#',
      '#.#######.#',
      '#.#######.#',
      '#.#######.+',
      '#.........#',
      '#..t...e..#',
      '###########',
    ],
  },
  wet_corner: {
    themes: ['basement'], weight: 1, mirror: true,
    rows: [
      '####+#####',
      '#........#',
      '#.e....~~#',
      '#......~~#',
      '+...p..~~#',
      '#......e.#',
      '#..t.....#',
      '##########',
    ],
  },
  // ── 지하상가 ──
  shop_hall: {
    themes: ['arcade'], weight: 1, mirror: false,
    rows: [
      '##############',
      '#.#..#..#..#.#',
      '#.#e.#..#.e#.#',
      '+............+',
      '#.#..#..#..#.#',
      '#.#.t#..#..#.#',
      '##############',
    ],
  },
  fountain: {
    themes: ['arcade'], weight: 1, mirror: false,
    rows: [
      '#####++#####',
      '#..........#',
      '#.e......e.#',
      '#...pppp...#',
      '+...pppp...+',
      '#...pppp...#',
      '#.t......e.#',
      '#..........#',
      '#####++#####',
    ],
  },
  shutters: {
    themes: ['arcade'], weight: 1, mirror: true,
    rows: [
      '#############',
      '#.?.?.?.?.?.#',
      '#.#.#.#.#.#.#',
      '+...........+',
      '#.#.#.#.#.#.#',
      '#.?e?.?.?t?.#',
      '#############',
    ],
  },
  escalators: {
    themes: ['arcade'], weight: 1, mirror: true,
    rows: [
      '#####+######',
      '#..........#',
      '#.pppp.....#',
      '#......e...#',
      '+....pppp..+',
      '#.e........#',
      '#.....pppp.#',
      '#..t.....s.#',
      '######+#####',
    ],
  },
  // ── 옥상 ──
  water_tank: {
    themes: ['rooftop'], weight: 1, mirror: false,
    rows: [
      '#####+#####',
      '#.........#',
      '#..ppppp..#',
      '#.ep...pe.#',
      '+..p.t.p..+',
      '#..pp.pp..#',
      '#.........#',
      '#..t...e..#',
      '###########',
    ],
  },
  laundry: {
    themes: ['rooftop'], weight: 1, mirror: true,
    rows: [
      '######+#####',
      '#..........#',
      '#.pppp.ppp.#',
      '#..........#',
      '+.ppp.pppp.+',
      '#....e.....#',
      '#.pppp.ppp.#',
      '#..t....e..#',
      '############',
    ],
  },
  platform: {
    themes: ['rooftop'], weight: 1, mirror: true,
    rows: [
      '####+#####',
      '#........#',
      '#.pppp.e.#',
      '+.pppp...+',
      '#........#',
      '#.e...t..#',
      '##########',
    ],
  },
  parapet_ring: {
    themes: ['rooftop'], weight: 1, mirror: true,
    rows: [
      '#####+######',
      '#..........#',
      '#.########.#',
      '#.#......#.#',
      '+.#..e.s.#.+',
      '#.#......#.#',
      '#.####.###.#',
      '#..t.....e.#',
      '############',
    ],
  },
} as const satisfies Record<string, RoomTemplate>;

export type RoomId = keyof typeof ROOMS;
