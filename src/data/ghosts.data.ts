import type { BossId, GhostId } from '../types/ids';

// Distances are in TILES, times in SECONDS. Two roles:
// - strong ghosts: every attack is telegraphed on the floor; only 'cone'/'circle' melee can be countered with 발도.
// - swarm fodder ('none' attack): weak, many, hurt by touch only. They come in waves (see contracts.data.ts).
export type AttackShape = 'cone' | 'circle' | 'line' | 'none';

// What makes a ghost more than "walks up and attacks": one row per trait, run by the part of the same
// name in src/systems/rift/traits/ (one file each). A new behaviour = a new member here + its part file.
export type GhostTrait =
  // Blocks blows that come from inside `arc` (radians) around where it faces; it turns `turn` rad/s while
  // chasing and is open while stunned or recovering. A 받아치기 / focus strike breaks the guard: `breakStun` s.
  | { part: 'guard'; arc: number; turn: number; breakStun: number }
  // Lies under for `under` s (cannot be hit), then marks a circle under the director (counterable at any
  // distance). Caught: `hold` s without walking or dashing (each swing frees `swingFree` s), pulled `pull`
  // tiles toward it. It stays up for its `recover` time (the only time it can be hit), then goes under.
  | { part: 'grab'; reach: number; windup: number; radius: number; hold: number; pull: number; swingFree: number; under: number }
  // Circles at `min`–`max` tiles; every `every` s it marks where the director stands and lands there.
  | { part: 'leap'; min: number; max: number; every: number; windup: number; radius: number }
  // Within `trigger` tiles it stops and blows up after `fuse` s (not counterable). Killed, it still blows
  // up after `deathFuse` s. The blast hurts ghosts too, × `ghostDamage`.
  | { part: 'burst'; trigger: number; fuse: number; radius: number; ghostDamage: number; deathFuse: number }
  // Keeps `keep` tiles away; every `every` s marks a thin line and fires a bullet (`speed` tiles/s, flies
  // `life` tiles). Walls stop bullets; a swing cuts them.
  | { part: 'shoot'; keep: number; range: number; every: number; windup: number; speed: number; life: number; width: number }
  // Keeps `keep` tiles away; every `every` s calls for `windup` s (a hit cuts the call and stuns it
  // `breakStun` s). Ghosts within `radius` get faster (× `speed`) with shorter warnings (× `windupMult`)
  // for `time` s, sleeping ones wake, and `count` × `summon` arrive.
  | { part: 'rally'; keep: number; every: number; windup: number; radius: number; time: number; speed: number; windupMult: number; summon: GhostId; count: number; breakStun: number }
  // Grows while the director aims at it (within `look` radians, `range` tiles, in sight) by `grow`/s,
  // shrinks by `shrink`/s otherwise, up to `max`. Each size: body and reach + `sizePer`, damage + `damagePer`.
  // Fully grown, its attacks cannot be countered.
  | { part: 'swell'; look: number; range: number; grow: number; shrink: number; max: number; sizePer: number; damagePer: number }
  // Marks a small circle around itself (counterable: nothing is taken). Caught, it takes the active skill
  // on L (no skill: `loot` of tonight's spirit) and runs (`flee` tiles/s). Killed: the skill comes back
  // ready with cooldowns × `boost` for the floor (spirit: × `lootDrop` dropped). After `escape` s it is
  // gone, and the skill with it for the rest of the night. One theft a floor.
  | { part: 'thief'; reach: number; windup: number; radius: number; flee: number; escape: number; boost: number; loot: number; lootDrop: number };

export interface GhostData {
  hp: number;
  damage: number;
  speed: number;
  radius: number;
  sight: number;
  drop: number; // spirit gained on kill
  attack: AttackShape;
  attackRange: number; // starts an attack when this close (line: dash length)
  attackSize: number; // cone/circle radius, or line width
  attackArc: number; // cone width in radians (0 for other shapes)
  windup: number; // telegraph time
  recover: number; // helpless time after attacking
  teleportEvery: number; // 0 = never
  teleportWarn: number;
  teleportBehind: number; // tiles behind the director it reappears
  teleportJitter: number; // random extra seconds between blinks
  dashSpeed: number;
  darkness: number; // seconds of darkened vision on hit
  contactDamage: number; // swarm fodder only: damage on touch
  fodder: boolean; // swarm fodder: no hit-stop on kill, counted against the swarm cap
  named: boolean; // can be a 현상수배 / 추격 target (not ones that hide, blow up or run off by themselves)
  traits: readonly GhostTrait[];
}

export const GHOSTS: Record<GhostId, GhostData> = {
  // 처녀귀신: floats in, swipes with her hair (cone), sometimes blinks behind the director.
  cheonyeo: { hp: 9, damage: 2, speed: 2.4, radius: 0.38, sight: 9, drop: 3, attack: 'cone', attackRange: 1.1, attackSize: 1.5, attackArc: 1.6, windup: 0.6, recover: 0.6, teleportEvery: 6, teleportWarn: 0.6, teleportBehind: 1.3, teleportJitter: 1, dashSpeed: 0, darkness: 0, contactDamage: 0, fodder: false, named: true, traits: [] },
  // 달걀귀신: slow and tanky, a body slam around itself (circle); a hit darkens vision.
  dalgyal: { hp: 18, damage: 2, speed: 1.3, radius: 0.48, sight: 7, drop: 5, attack: 'circle', attackRange: 1.1, attackSize: 1.6, attackArc: 0, windup: 0.9, recover: 0.9, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 4, contactDamage: 0, fodder: false, named: true, traits: [] },
  // 지하철 망령: telegraphs a straight dash (line) — cannot be countered, only dodged.
  subway: { hp: 11, damage: 3, speed: 1.8, radius: 0.42, sight: 10, drop: 4, attack: 'line', attackRange: 6, attackSize: 0.9, attackArc: 0, windup: 0.7, recover: 1.0, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 14, darkness: 0, contactDamage: 0, fodder: false, named: true, traits: [] },
  // 도깨비불: swarm fodder. Fragile will-o'-wisps that rush in packs and burn on touch.
  dokkaebibul: { hp: 2, damage: 0, speed: 3.1, radius: 0.24, sight: 30, drop: 1, attack: 'none', attackRange: 0, attackSize: 0, attackArc: 0, windup: 0, recover: 0, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 0, contactDamage: 1, fodder: true, named: false, traits: [] },
  // 도깨비: walks in behind its club. Blows from the front bounce off; get behind it, hit it while it
  // recovers from its own swing, or break the guard with a 받아치기.
  // Role ghosts (2026-11-11): ids name the behaviour; names and looks are placeholders until the owner
  // picks their skins (docs/design/2-night/enemies.md "겉 목록").
  grabber: { hp: 14, damage: 2, speed: 0, radius: 0.42, sight: 8, drop: 6, attack: 'circle', attackRange: 0, attackSize: 1.4, attackArc: 0, windup: 0.7, recover: 2.5, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 0, contactDamage: 0, fodder: false, named: false, traits: [{ part: 'grab', reach: 2.2, windup: 0.7, radius: 1.4, hold: 1.2, pull: 1, swingFree: 0.3, under: 1.5 }] },
  leaper: { hp: 12, damage: 3, speed: 2.6, radius: 0.42, sight: 9, drop: 6, attack: 'cone', attackRange: 0.9, attackSize: 1.3, attackArc: 1.6, windup: 0.6, recover: 0.9, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 0, contactDamage: 0, fodder: false, named: true, traits: [{ part: 'leap', min: 3, max: 7, every: 3.5, windup: 0.55, radius: 1.3 }] },
  burster: { hp: 4, damage: 3, speed: 2.6, radius: 0.36, sight: 9, drop: 2, attack: 'circle', attackRange: 0, attackSize: 1.6, attackArc: 0, windup: 0.8, recover: 0.5, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 0, contactDamage: 0, fodder: false, named: false, traits: [{ part: 'burst', trigger: 1, fuse: 0.8, radius: 1.6, ghostDamage: 3, deathFuse: 0.5 }] },
  shooter: { hp: 8, damage: 2, speed: 1.6, radius: 0.38, sight: 10, drop: 4, attack: 'cone', attackRange: 0.9, attackSize: 1.2, attackArc: 1.4, windup: 0.6, recover: 0.7, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 0, contactDamage: 0, fodder: false, named: true, traits: [{ part: 'shoot', keep: 4.5, range: 7, every: 2.4, windup: 0.6, speed: 7, life: 9, width: 0.3 }] },
  rallier: { hp: 9, damage: 2, speed: 1.5, radius: 0.4, sight: 9, drop: 5, attack: 'cone', attackRange: 0.9, attackSize: 1.2, attackArc: 1.4, windup: 0.7, recover: 0.8, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 0, contactDamage: 0, fodder: false, named: true, traits: [{ part: 'rally', keep: 5, every: 7, windup: 1, radius: 5, time: 5, speed: 1.25, windupMult: 0.85, summon: 'dokkaebibul', count: 2, breakStun: 0.6 }] },
  sweller: { hp: 20, damage: 2, speed: 1.4, radius: 0.45, sight: 8, drop: 6, attack: 'circle', attackRange: 1.0, attackSize: 1.4, attackArc: 0, windup: 0.9, recover: 0.9, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 0, contactDamage: 0, fodder: false, named: true, traits: [{ part: 'swell', look: 1.2, range: 8, grow: 0.5, shrink: 0.35, max: 3, sizePer: 0.25, damagePer: 1 }] },
  thief: { hp: 7, damage: 1, speed: 2.8, radius: 0.36, sight: 10, drop: 5, attack: 'cone', attackRange: 0.4, attackSize: 1.0, attackArc: 1.4, windup: 0.5, recover: 0.6, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 0, contactDamage: 0, fodder: false, named: false, traits: [{ part: 'thief', reach: 1, windup: 0.5, radius: 1.1, flee: 3.6, escape: 9, boost: 0.5, loot: 0.3, lootDrop: 1.5 }] },
  dokkaebi: { hp: 16, damage: 2, speed: 1.7, radius: 0.46, sight: 8, drop: 6, attack: 'cone', attackRange: 1.2, attackSize: 1.7, attackArc: 1.4, windup: 0.75, recover: 1.1, teleportEvery: 0, teleportWarn: 0, teleportBehind: 0, teleportJitter: 0, dashSpeed: 0, darkness: 0, contactDamage: 0, fodder: false, named: true, traits: [{ part: 'guard', arc: 2.4, turn: 2.2, breakStun: 1.2 }] },
};

export interface BossData {
  hp: number;
  damage: number;
  speed: number;
  radius: number;
  drop: number;
  slamRange: number; // close-range pounce (parriable circle)
  slamTrigger: number; // starts a slam when the director is this close (edge to edge)
  slamWindup: number;
  sweepEvery: number; // tail sweep: a band across the room (cannot be countered)
  sweepWindup: number;
  sweepWidth: number;
  sweepDamage: number;
  summonEvery: number;
  summon: GhostId;
  summonCount: number; // ghosts per summon
  summonSpread: number; // ± tiles sideways from the boss
  summonBelow: readonly [number, number]; // tiles below the boss
  recover: number;
  phase2Ratio: number;
  phase2Mult: number; // phase 2 timers × this (faster)
}

export const BOSSES: Record<BossId, BossData> = {
  // 구미호: nine tails sweep a row (phase 2: row + column), pounces up close, scatters fox-fire wisps.
  gumiho: {
    hp: 120,
    damage: 3,
    speed: 1.1,
    radius: 0.9,
    drop: 40,
    slamRange: 1.9,
    slamTrigger: 1.3,
    slamWindup: 0.8,
    sweepEvery: 4.5,
    sweepWindup: 1.0,
    sweepWidth: 1.3,
    sweepDamage: 3,
    summonEvery: 8,
    summon: 'dokkaebibul',
    summonCount: 3,
    summonSpread: 2,
    summonBelow: [1, 2.5],
    recover: 0.9,
    phase2Ratio: 0.5,
    phase2Mult: 0.7,
  },
};
