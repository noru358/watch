// Sprite animation tables (frames are files in assets/sprites/, numbered by tools/spritekit).
// Facing: 'down' frames face the lower right, 'up' frames the upper right; left is a mirror.

export type DirectorAnim = 'idle' | 'walk' | 'dash' | 'hurt' | 'upIdle' | 'upWalk';

export const DIRECTOR_SPRITE = {
  folder: 'director-gemini-v1',
  frames: {
    idle: [19],
    walk: [5, 6, 5, 7],
    dash: [10, 13],
    hurt: [20],
    upIdle: [8],
    upWalk: [8, 9],
  } satisfies Record<DirectorAnim, readonly number[]>,
  fps: 8, // walk / dash frame rate
  hurtShow: 0.25, // seconds the hurt frame shows after a hit
  hand: { x: 5, y: -15 }, // sword grip, px from the feet (facing right)
  breathe: 1.6, // idle breathing speed (1px bob)
} as const;
