import type { FloorTheme } from '../types/ids';

// How each district (floor theme) builds its floors beyond the bare rooms (docs/rules/floor.md "동네 규칙").
// A district without rules here builds exactly as before (same random draws, same maps). Three layers:
//   loops   — extra corridors between rooms that are close but not yet joined, so the floor has rounds
//             and two ways to a room instead of one chain
//   kinds   — 방 종류: a plain room may become one of these; a kind is a set of props laid out by a rule
//   signs   — neon signs hung on wall faces; each one throws a coloured light pool on the floor

export type PropArtId = 'stall' | 'press' | 'paper' | 'bags' | 'lamp' | 'crates';
export type SignArtId = 'cup' | 'heart' | 'open24' | 'arrow';
export type RoomKindId = 'pocha' | 'printshop' | 'lampyard' | 'backlot';

export interface LightDef {
  radius: number; // tiles
  color: number;
  alpha: number;
}

// A prop stands on whole tiles (w × h), is solid (walls for walking, shots and sight) and is drawn by
// the art of the same id (scenes/rift/draw/art/streetArt.ts). hp: blows to break it (null = cannot);
// a broken prop leaves its tiles as floor, some debris, and `drop` spirit pickups of `value` each.
export interface PropDef {
  w: number;
  h: number;
  hp: number | null;
  drop: { count: number; value: number } | null;
  light: LightDef | null; // throws light at night (a bulb, a lamp)
}

export const PROPS: Readonly<Record<PropArtId, PropDef>> = {
  // 포장마차: orange tarp tent over a counter, two bulbs; breaks into spirit (owners long gone)
  stall: { w: 2, h: 1, hp: 3, drop: { count: 2, value: 4 }, light: { radius: 2.4, color: 0xffa040, alpha: 0.05 } },
  // 인쇄기: heavy iron press, solid cover
  press: { w: 2, h: 1, hp: null, drop: null, light: null },
  // 종이 더미: a bundle of flyers, one blow
  paper: { w: 1, h: 1, hp: 1, drop: { count: 1, value: 3 }, light: null },
  // 쓰레기 봉투 더미: one blow
  bags: { w: 1, h: 1, hp: 1, drop: { count: 1, value: 2 }, light: null },
  // 가로등: the one bright place in the yard
  lamp: { w: 1, h: 1, hp: null, drop: null, light: { radius: 4.2, color: 0xfff0c0, alpha: 0.08 } },
  // 상자 더미: what a hand-made room's 'p' cells become in this district (rooms.data.ts)
  crates: { w: 1, h: 1, hp: null, drop: null, light: null },
};

export const SIGNS: Readonly<Record<SignArtId, { color: number }>> = {
  cup: { color: 0x4fe0d0 }, // 다방 cup
  heart: { color: 0xff5fa8 },
  open24: { color: 0xff6a4a },
  arrow: { color: 0x7fb4ff },
};
export const SIGN_LIGHT = { radius: 1.8, alpha: 0.055, flickerEvery: 7 }; // seconds between flickers (per sign, offset)

// One placing rule of a room kind: `art` props, a count in [min, max], laid out as
//   'row'     one line across the room's middle, a walkable gap between each
//   'scatter' anywhere inside, never touching another prop (one free tile around)
//   'centre'  one at the room's middle
// Props never sit on the room's outer ring, and one that would cut any floor off is not placed.
export interface PlaceRule {
  art: PropArtId;
  count: readonly [number, number];
  arrange: 'row' | 'scatter' | 'centre';
}

export interface RoomKind {
  min: { w: number; h: number }; // smallest plain room it fits in
  place: readonly PlaceRule[];
}

export const ROOM_KINDS: Readonly<Record<RoomKindId, RoomKind>> = {
  // 포장마차 거리: a row of tents to fight around; cutting them open pays
  pocha: { min: { w: 8, h: 6 }, place: [{ art: 'stall', count: [2, 3], arrange: 'row' }, { art: 'bags', count: [0, 2], arrange: 'scatter' }] },
  // 인쇄소 뒷마당: iron presses as hard cover, paper bundles in between
  printshop: { min: { w: 7, h: 7 }, place: [{ art: 'press', count: [2, 4], arrange: 'scatter' }, { art: 'paper', count: [1, 3], arrange: 'scatter' }] },
  // 가로등 공터: one lamp in the middle lights the yard; rubbish piled around
  lampyard: { min: { w: 6, h: 6 }, place: [{ art: 'lamp', count: [1, 1], arrange: 'centre' }, { art: 'bags', count: [2, 4], arrange: 'scatter' }] },
  // 가게 뒤 적치장: beer crates (hard) and bags (break) in a small room — stops a small room being empty
  backlot: { min: { w: 5, h: 5 }, place: [{ art: 'crates', count: [1, 3], arrange: 'scatter' }, { art: 'bags', count: [1, 2], arrange: 'scatter' }] },
};

export interface District {
  loops: number; // extra corridors (0 = the old single chain)
  loopReach: number; // only between rooms whose middles are at most this far apart (tiles)
  kindChance: number; // chance a plain room (not the start) becomes a room kind
  kinds: readonly { id: RoomKindId; weight: number }[];
  signs: number; // neon signs per floor
  signGap: number; // tiles between two signs at least
  signArts: readonly SignArtId[];
  templateProp: PropArtId | null; // what a hand-made room's 'p' cells are drawn as (null = wall)
}

export const DISTRICTS: Readonly<Partial<Record<FloorTheme, District>>> = {
  // 노포 골목 (2026-11-12 시제품): the first district with rules
  alley: {
    loops: 2,
    loopReach: 20,
    kindChance: 0.85,
    kinds: [{ id: 'pocha', weight: 3 }, { id: 'printshop', weight: 2 }, { id: 'lampyard', weight: 2 }, { id: 'backlot', weight: 1 }],
    signs: 7,
    signGap: 6,
    signArts: ['cup', 'heart', 'open24', 'arrow'],
    templateProp: 'crates',
  },
};
