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

export const DIRECTOR_SPRITE = {
  frames: {
    idle: ['v3:0', 'v3:1'],
    walk: ['v3:2', 'v3:3', 'v3:2', 'v3:4'],
    attack: ['v3:11', 'v3:12'], // arm pulled back → swung forward
    draw: ['v3:10', 'v3:8'], // 발도: crouch → lunge
    dash: ['v3:9'],
    hurt: ['v3:16'],
    ko: ['v1:21'], // knocked out (swirly eyes), shown when HP hits 0
  } satisfies Record<DirectorAnim, readonly [DirectorFrame, ...DirectorFrame[]]>,
  fps: 8, // walk / idle frame rate
  attackShow: 0.2, // seconds the attack pose shows after a swing starts (first half: wind-up frame)
  drawShow: 0.3, // seconds the 발도 pose shows (first 40%: crouch)
  hurtShow: 0.25, // seconds the hurt frame shows after a hit
  hand: { x: 6, y: -10 }, // sword grip at the hip, px from the feet (facing right)
  handReach: { x: 12, y: -14 }, // grip when the arm is extended (attack / 발도 follow-through)
  breathe: 1.6, // idle breathing speed (1px bob)
} as const;
