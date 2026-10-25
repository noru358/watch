// Sprite animation tables (frames are files in assets/sprites/, numbered by tools/spritekit).
// Two facings for now (2026-10-25): frames face right; left is a mirror. No back view yet.

export type DirectorAnim = 'idle' | 'walk' | 'dash' | 'hurt';

export const DIRECTOR_SPRITE = {
  folder: 'director-gemini-v1',
  frames: {
    idle: [19],
    walk: [5, 6, 5, 7],
    dash: [10, 13],
    hurt: [20],
  } satisfies Record<DirectorAnim, readonly number[]>,
  fps: 8, // walk / dash frame rate
  hurtShow: 0.25, // seconds the hurt frame shows after a hit
  hand: { x: 5, y: -15 }, // sword grip, px from the feet (facing right)
  breathe: 1.6, // idle breathing speed (1px bob)
} as const;
