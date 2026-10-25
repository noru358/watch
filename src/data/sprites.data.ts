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

// One swing of the 3-hit combo: its own strike pose, recovery pose and blade path.
// sweep: 1 = forehand (top → bottom on a right-facing swing), -1 = backhand, 0 = thrust (straight stab).
export interface ComboStep {
  strike: DirectorFrame;
  recover: DirectorFrame;
  strikeShow: number; // seconds the strike pose holds after the press
  recoverShow: number; // then the recovery pose
  sweep: 1 | -1 | 0;
}

export const DIRECTOR_SPRITE = {
  frames: {
    // One still idle frame: the AI frames are each redrawn, so swapping two of them shimmers, and a
    // head-only breathing lift stretched the chin (both rejected 2026-10-25).
    idle: ['v3:0'],
    walk: ['v3:2', 'v3:3', 'v3:2', 'v3:4'],
    attack: ['v3:12', 'v3:11', 'v3:7', 'v3:8', 'v3:10'], // every pose the combo uses (see `combo`)
    draw: ['v3:10', 'v3:8'], // 발도: stance (hand on the hilt) → cut → back to the stance pose to sheathe
    dash: ['v3:9'],
    hurt: ['v3:16'],
    ko: ['v1:21'], // knocked out (swirly eyes), shown when HP hits 0
  } satisfies Record<DirectorAnim, readonly [DirectorFrame, ...DirectorFrame[]]>,
  fps: 8, // walk frame rate
  // Walk frames keep the idle frame's head (top rows), so only legs and arms move.
  stableHead: { from: 'v3:0', rows: 18, anims: ['walk'] } satisfies { from: DirectorFrame; rows: number; anims: readonly DirectorAnim[] },
  anchorRows: [9, 16], // rows above the feet whose centre is the body column (frames differ in width)
  // 3-hit combo (2026-10-25, "same swing repeated looks like 휙휙휙"): forehand, backhand, lunging thrust.
  // The finisher holds longer and the weapon's finisherRecovery gives the combo its breath.
  combo: [
    { strike: 'v3:12', recover: 'v3:11', strikeShow: 0.12, recoverShow: 0.14, sweep: 1 },
    { strike: 'v3:7', recover: 'v3:11', strikeShow: 0.12, recoverShow: 0.14, sweep: -1 },
    { strike: 'v3:8', recover: 'v3:10', strikeShow: 0.2, recoverShow: 0.2, sweep: 0 },
  ] satisfies ComboStep[],
  // Aiming up (sin(aim) below upAim): attacks and the 발도 cut use the back view, mirrored so the
  // reaching arm points to the aim side (the side view stays for idle / walk; no back walk frames yet).
  back: { strike: 'v3:14', upAim: -0.5, armLeft: true } satisfies { strike: DirectorFrame; upAim: number; armLeft: boolean },
  drawCutShow: 0.14, // after the stance: the cut pose
  drawSheatheShow: 0.16, // then back to the stance pose (sheathing)
  hurtShow: 0.25, // seconds the hurt frame shows after a hit
  // Sword grip, px from the body column at the feet (facing right), measured from the fists in each frame.
  hand: { x: 7, y: -8 } satisfies Px, // at the hip (idle, walk, others)
  hands: {
    'v3:12': { x: 14, y: -17 },
    'v3:11': { x: -3, y: -12 },
    'v3:7': { x: 14, y: -17 },
    'v3:8': { x: 13, y: -16 },
    'v3:10': { x: 6, y: -11 },
    'v3:9': { x: 10, y: -11 },
    'v3:14': { x: -10, y: -16 },
  } satisfies Partial<Record<DirectorFrame, Px>>,
  swordRest: 1.0, // radians below the facing direction while not swinging (does not follow the aim)
  swordDash: 2.5, // while dashing the sword trails down and behind
  blinkAlpha: 0.45, // sprite alpha on the off-beats while invulnerable after a hit (no full disappearing)
} as const;
