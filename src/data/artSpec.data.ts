// 개체별 그림 규격 (docs/design/5-business/art.md "개체별 규격"). Every drawing that goes into the game
// is made to one of these classes: canvas size, the anchor point where it stands, which way it faces,
// how many colours, and the frames it must have. One art pixel = one game pixel (no 2x drawings), so
// every class shares the director's pixel thickness. Files: assets/sprites/<entity>/<frame>.png, a
// frame with several pictures as <frame>_<n>.png from 0 (walk_0..walk_3). tests/artSpec.test.ts
// checks every folder that exists against this table.
import type { BossId, GhostId } from '../types/ids';
import type { SpeakerId } from './story.data';

export type ArtClass = 'person' | 'ghost' | 'fodder' | 'big' | 'boss' | 'tile' | 'wall' | 'prop' | 'propTall' | 'portrait';

export interface ArtClassSpec {
  w: number; // canvas px
  h: number;
  anchor: { x: number; y: number }; // px in the canvas that sits on the entity's floor position: for a
  //   standing thing the ground point (its lowest pixel row is anchor.y - 1, centred on anchor.x)
  facing: 'right' | 'none'; // 'right': drawn facing right, the game mirrors it for left
  maxColors: number; // opaque colours in one file (palette/master.gpl holds the shared set)
  frames: Readonly<Record<string, number>>; // frame name → pictures every entity of the class needs
}

// Floor tile 24 px (FEEL.tile). Bodies: a strong ghost's hit radius is 0.36..0.48 tiles (17..23 px
// across), drawn a little larger than the hitbox, about as tall as the director (~34 px).
export const ART_CLASSES: Readonly<Record<ArtClass, ArtClassSpec>> = {
  // the director, staff and story people
  person: { w: 32, h: 36, anchor: { x: 16, y: 34 }, facing: 'right', maxColors: 28, frames: { idle: 1, walk: 4, hurt: 1, ko: 1 } },
  // a strong ghost: floats or walks by code (bob, sway), so few pictures. windup = the pose while its
  // floor warning shows, strike = the hit. hurt is a white flash in code.
  ghost: { w: 32, h: 36, anchor: { x: 16, y: 34 }, facing: 'right', maxColors: 16, frames: { idle: 1, windup: 1, strike: 1 } },
  // swarm fodder (도깨비불): two pictures that flicker
  fodder: { w: 16, h: 16, anchor: { x: 8, y: 14 }, facing: 'none', maxColors: 8, frames: { idle: 2 } },
  // a heavy strong ghost (radius 0.45 and up, or one that grows)
  big: { w: 40, h: 44, anchor: { x: 20, y: 42 }, facing: 'right', maxColors: 16, frames: { idle: 1, windup: 1, strike: 1 } },
  // a boss: one big picture; patterns add their own windup poses (BOSS_ART below)
  boss: { w: 64, h: 64, anchor: { x: 32, y: 60 }, facing: 'none', maxColors: 24, frames: { idle: 1 } },
  // floor tile, top-down; a set is one folder per district theme (FLOOR_THEMES)
  tile: { w: 24, h: 24, anchor: { x: 0, y: 0 }, facing: 'none', maxColors: 12, frames: { floor: 4 } },
  // wall: the top (24) plus the front face seen in 3/4 view (FEEL.wallFace 13)
  wall: { w: 24, h: 37, anchor: { x: 0, y: 0 }, facing: 'none', maxColors: 12, frames: { top: 1, face: 2 } },
  // a prop on one tile (payphone, stairs, talisman bench, vending machine)
  prop: { w: 24, h: 32, anchor: { x: 12, y: 30 }, facing: 'none', maxColors: 12, frames: { idle: 1 } },
  // a prop two tiles tall (signboard, shelf, a door)
  propTall: { w: 24, h: 56, anchor: { x: 12, y: 54 }, facing: 'none', maxColors: 12, frames: { idle: 1 } },
  // dialogue box face: chest up, looking toward the box centre (right side mirrored)
  portrait: { w: 64, h: 64, anchor: { x: 0, y: 0 }, facing: 'right', maxColors: 24, frames: { calm: 1, smile: 1, upset: 1 } },
};

export interface EntityArt {
  class: ArtClass;
  extra?: Readonly<Record<string, number>>; // frames on top of the class's own
}

// The director: the class frames + the sword work. The sword and its smear are drawn apart and rotate
// to the aim (sword below), never baked into the body. Matches docs/design/5-business/art-pipeline.md.
export const DIRECTOR_ART: EntityArt = {
  class: 'person',
  extra: { combo: 3, recover: 3, drawStance: 1, drawCut: 1, dash: 1, backStrike: 1 }, // combo_0..2 strike poses
};

// Each ghost role: its class and the poses its trait needs (src/systems/rift/traits/). Ids are role
// names; the skin (name and look) changes, the frames do not.
export const GHOST_ART_SPEC: Readonly<Record<GhostId, EntityArt>> = {
  cheonyeo: { class: 'ghost', extra: { fade: 1 } }, // teleport: fading out / in
  dalgyal: { class: 'big' },
  subway: { class: 'ghost', extra: { dash: 1 } }, // the line rush
  dokkaebibul: { class: 'fodder' },
  dokkaebi: { class: 'big', extra: { guard: 1 } }, // front guard up
  grabber: { class: 'ghost', extra: { reach: 1, hold: 1 } }, // arm out, then holding the director
  leaper: { class: 'ghost', extra: { air: 1 } }, // mid-pounce
  burster: { class: 'ghost', extra: { lit: 2 } }, // fuse burning (flickers)
  shooter: { class: 'ghost', extra: { shoot: 1 } },
  rallier: { class: 'ghost', extra: { call: 1 } },
  sweller: { class: 'big', extra: { swell: 3 } }, // one picture per size step (no scaling of pixel art)
  thief: { class: 'ghost', extra: { carry: 1 } }, // running off with the loot
};

export const BOSS_ART_SPEC: Readonly<Record<BossId, EntityArt>> = {
  gumiho: { class: 'boss', extra: { slam: 1, sweep: 1, summon: 1 } }, // phase 2 = palette swap in code
};

// Story people's faces. The guest has no face (a silhouette in code).
export const PORTRAIT_SPEC: Readonly<Partial<Record<SpeakerId, EntityArt>>> = {
  director: { class: 'portrait' },
  bookkeeper: { class: 'portrait' },
};

// Separate pieces that rotate or are placed by code.
export const PIECE_SPEC = {
  sword: { w: 24, h: 8, grip: { x: 3, y: 4 }, maxColors: 8 }, // drawn pointing right, rotated to the aim
} as const;

// Folder name under assets/sprites for an entity: "<kind>-<id>", e.g. ghost-grabber, boss-gumiho.
export type ArtKind = 'director' | 'ghost' | 'boss' | 'portrait';
export function artFolder(kind: ArtKind, id?: string): string {
  return kind === 'director' ? 'director' : `${kind}-${id}`;
}

// Every frame file an entity needs: name → count (class frames + extras).
export function framesOf(e: EntityArt): Record<string, number> {
  return { ...ART_CLASSES[e.class].frames, ...e.extra };
}

// File names for one entity's frames: "<frame>.png" for a single picture, "<frame>_<n>.png" for more.
export function frameFiles(e: EntityArt): string[] {
  return Object.entries(framesOf(e)).flatMap(([name, n]) => (n === 1 ? [`${name}.png`] : Array.from({ length: n }, (_, i) => `${name}_${i}.png`)));
}
