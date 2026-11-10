import type { GhostTrait } from './ghosts.data';

// What a named target's first word does (docs/design/2-night/enemies.md "수식어에 효과 붙이기").
// Keyed by the index of the word in the i18n table wanted.pre.N — saves keep that index, so a target
// keeps its effect across saves. A word with no row here is only a name. One row = one effect; the
// player-facing line is `affix.<N>` in ko.ts / en.ts. Multipliers go on top of the 현상수배 / 추격 rule.
export interface Affix {
  hpMult: number;
  speedMult: number;
  windupMult: number; // warnings × this (below 1 = quicker)
  damageAdd: number;
  reachMult: number; // its attack reach and size × this
  trait: GhostTrait | null; // a behaviour on top of its kind's (src/systems/rift/traits/)
}

const plain: Affix = { hpMult: 1, speedMult: 1, windupMult: 1, damageAdd: 0, reachMult: 1, trait: null };
const row = (a: Partial<Affix>): Affix => ({ ...plain, ...a });

export const AFFIXES: Readonly<Record<number, Affix>> = {
  0: row({ damageAdd: 1 }), // 붉은: hits harder
  1: row({ hpMult: 1.3, speedMult: 0.85 }), // 젖은: heavy, slow
  2: row({ windupMult: 0.85 }), // 웃는: quick to swing
  3: row({ trait: { part: 'guard', arc: 2.2, turn: 2.6, breakStun: 1 } }), // 굽은: guards its front
  4: row({ reachMult: 1.25 }), // 긴: reaches further
  5: row({ trait: { part: 'rally', keep: 4, every: 8, windup: 1, radius: 5, time: 5, speed: 1.25, windupMult: 0.85, summon: 'dokkaebibul', count: 2, breakStun: 0.6 } }), // 쉰 목소리: calls the others
  6: row({ hpMult: 1.2 }), // 창백한
  12: row({ trait: { part: 'deathBurst', radius: 1.8, fuse: 0.6, ghostDamage: 3 } }), // 타는: blows up when it falls
  13: row({ hpMult: 1.4, speedMult: 0.85 }), // 늙은
  14: row({ hpMult: 0.8, speedMult: 1.25 }), // 어린
  15: row({ trait: { part: 'leap', min: 2.5, max: 6, every: 4, windup: 0.6, radius: 1.3 } }), // 굶주린: pounces
  16: row({ speedMult: 1.2 }), // 잠 못 드는
  20: row({ windupMult: 1.15, hpMult: 1.3 }), // 얼어붙은: slow to swing, hard to break
  22: row({ trait: { part: 'swell', look: 1.2, range: 8, grow: 0.4, shrink: 0.35, max: 2, sizePer: 0.25, damagePer: 1 } }), // 검은: grows while looked at
};

export function affixOf(pre: number | undefined): Affix | null {
  return pre === undefined ? null : (AFFIXES[pre] ?? null);
}
