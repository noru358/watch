// Sprite animation tables. Frames are files in assets/sprites/<folder>/frame_NN.png (numbered by
// tools/spritekit); a frame is written "<set>:<number>", e.g. "v3:12".
// Two facings for now (2026-10-25): frames face right; left is a mirror. No back view yet.

export type DirectorAnim = 'idle' | 'walk' | 'attack' | 'draw' | 'dash' | 'hurt' | 'ko';

export const DIRECTOR_SETS = {
  v1: 'director-gemini-v1', // first sheet: design master (KO frame still used)
  v3: 'director-gemini-v3', // extra frames: empty-hand idle, attack, 발도 stance
} as const;
export type DirectorSet = keyof typeof DIRECTOR_SETS;
export type DirectorFrame = `${DirectorSet}:${number}`;

type Px = { x: number; y: number };

export const DIRECTOR_SPRITE = {
  frames: {
    // One idle frame: the AI frames are each redrawn, so swapping two of them shimmers (2026-10-25 feedback).
    idle: ['v3:0'],
    walk: ['v3:2', 'v3:3', 'v3:2', 'v3:4'],
    attack: ['v3:12', 'v3:11'], // the hit lands on the press: arm swung forward → pulled back to guard
    draw: ['v3:8', 'v3:10'], // 발도 lands on the press: lunge → hand back on the hilt (납도)
    dash: ['v3:9'],
    hurt: ['v3:16'],
    ko: ['v1:21'], // knocked out (swirly eyes), shown when HP hits 0
  } satisfies Record<DirectorAnim, readonly [DirectorFrame, ...DirectorFrame[]]>,
  fps: 8, // walk frame rate
  // Walk frames keep the idle frame's head (top rows), so only legs and arms move.
  stableHead: { from: 'v3:0', rows: 18, anims: ['walk'] } satisfies { from: DirectorFrame; rows: number; anims: readonly DirectorAnim[] },
  anchorRows: [9, 16], // rows above the feet whose centre is the body column (frames differ in width)
  attackShow: 0.26, // seconds the attack pose shows after a swing (≤ swingTime so held attack never pops to idle)
  attackStrike: 0.14, // first part of attackShow: arm forward
  drawShow: 0.32, // seconds the 발도 pose shows
  drawStrike: 0.2, // first part of drawShow: lunge
  hurtShow: 0.25, // seconds the hurt frame shows after a hit
  // Sword grip, px from the body column at the feet (facing right), measured from the fists in each frame.
  hand: { x: 7, y: -8 } satisfies Px, // at the hip (idle, walk, others)
  hands: {
    'v3:12': { x: 14, y: -17 },
    'v3:11': { x: -3, y: -12 },
    'v3:8': { x: 13, y: -16 },
    'v3:10': { x: 6, y: -11 },
    'v3:9': { x: 10, y: -11 },
  } satisfies Partial<Record<DirectorFrame, Px>>,
  swordRest: 1.0, // radians below the facing direction while not swinging (does not follow the aim)
  swordDash: 2.5, // while dashing the sword trails down and behind
  headBob: { rows: 18, period: 2.6 }, // idle: only the head rows rise 1px, once per period (s); feet stay planted
  blinkAlpha: 0.45, // sprite alpha on the off-beats while invulnerable after a hit (no full disappearing)
} as const;
