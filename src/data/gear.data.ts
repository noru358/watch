import type { TKey } from '../i18n';
import type { EffectRow } from '../registry/effects';
import type { Stats } from '../systems/rift';

// 장신구 (adopted 2026-10-28, user "ㅇㅋ 붙여"; docs/rules/growth.md). User decisions: 3 accessory slots, money raises the level
// (main option), 심연 파편 rerolls a sub option. Structure: Genshin artifacts (main option fixed by
// slot and grows with level, sub options random) + MapleStory (star force = level with money,
// cube = reroll) without destruction. A legendary piece adds one special written as 효과 부품 rows.

export type GearStat = keyof Stats;
export type GearSlot = 'bracelet' | 'necklace' | 'keyring';
export type Grade = 'common' | 'rare' | 'epic' | 'legend';

export interface MainOption {
  stat: GearStat;
  op: 'add' | 'mult';
  base: number; // at level 0
  perLevel: number;
  weight: number;
}

export const GEAR_SLOTS: Record<GearSlot, { nameKey: TKey; roleKey: TKey; mains: readonly MainOption[] }> = {
  bracelet: {
    nameKey: 'gear.bracelet', roleKey: 'gear.bracelet.role',
    mains: [
      { stat: 'slash', op: 'mult', base: 0.04, perLevel: 0.008, weight: 3 },
      { stat: 'drawSlash', op: 'mult', base: 0.04, perLevel: 0.008, weight: 2 },
      { stat: 'critChance', op: 'add', base: 0.03, perLevel: 0.004, weight: 1 },
    ],
  },
  necklace: {
    nameKey: 'gear.necklace', roleKey: 'gear.necklace.role',
    mains: [
      { stat: 'maxHp', op: 'add', base: 1, perLevel: 0.2, weight: 3 },
      { stat: 'damageTaken', op: 'add', base: -0.03, perLevel: -0.006, weight: 2 },
      { stat: 'healMult', op: 'add', base: 0.08, perLevel: 0.016, weight: 1 },
    ],
  },
  keyring: {
    nameKey: 'gear.keyring', roleKey: 'gear.keyring.role',
    mains: [
      { stat: 'moveSpeed', op: 'mult', base: 0.02, perLevel: 0.004, weight: 2 },
      { stat: 'dashCooldown', op: 'mult', base: -0.03, perLevel: -0.006, weight: 2 },
      { stat: 'spiritGain', op: 'add', base: 0.05, perLevel: 0.01, weight: 2 },
    ],
  },
};
export const GEAR_SLOT_IDS: readonly GearSlot[] = ['bracelet', 'necklace', 'keyring'];

export const GRADES: Record<Grade, { nameKey: TKey; subs: number; special: boolean; costMult: number }> = {
  common: { nameKey: 'gear.grade.common', subs: 0, special: false, costMult: 1 },
  rare: { nameKey: 'gear.grade.rare', subs: 1, special: false, costMult: 1.5 },
  epic: { nameKey: 'gear.grade.epic', subs: 2, special: false, costMult: 2.2 },
  legend: { nameKey: 'gear.grade.legend', subs: 3, special: true, costMult: 3 },
};
export const GRADE_IDS: readonly Grade[] = ['common', 'rare', 'epic', 'legend'];

// Grade weights by the night's 난이도 (1..5), then shifted up by the source.
export const GRADE_WEIGHTS: readonly (readonly [number, number, number, number])[] = [
  [70, 25, 5, 0],
  [60, 30, 9, 1],
  [45, 35, 17, 3],
  [35, 35, 23, 7],
  [25, 35, 28, 12],
];

export type DropSource = 'bounty' | 'lair' | 'deep' | 'boss';
export const DROPS: Record<DropSource, { nameKey: TKey; chance: number; shift: number; minGrade?: Grade }> = {
  bounty: { nameKey: 'gear.drop.bounty', chance: 1, shift: 1 },
  lair: { nameKey: 'gear.drop.lair', chance: 0.35, shift: 0 },
  deep: { nameKey: 'gear.drop.deep', chance: 0.5, shift: 0 },
  boss: { nameKey: 'gear.drop.boss', chance: 1, shift: 2, minGrade: 'epic' },
};

export interface SubOption {
  stat: GearStat;
  op: 'add' | 'mult';
  min: number;
  max: number;
  step: number;
  weight: number;
}

export const SUB_OPTIONS: readonly SubOption[] = [
  { stat: 'slash', op: 'mult', min: 0.01, max: 0.03, step: 0.005, weight: 3 },
  { stat: 'drawSlash', op: 'mult', min: 0.01, max: 0.03, step: 0.005, weight: 3 },
  { stat: 'critChance', op: 'add', min: 0.01, max: 0.03, step: 0.005, weight: 3 },
  { stat: 'critDamage', op: 'add', min: 0.03, max: 0.08, step: 0.01, weight: 3 },
  { stat: 'strongDamage', op: 'add', min: 0.02, max: 0.05, step: 0.01, weight: 2 },
  { stat: 'fodderDamage', op: 'add', min: 0.05, max: 0.12, step: 0.01, weight: 2 },
  { stat: 'bossDamage', op: 'add', min: 0.02, max: 0.05, step: 0.01, weight: 2 },
  { stat: 'maxHp', op: 'add', min: 1, max: 1, step: 1, weight: 1 },
  { stat: 'damageTaken', op: 'add', min: -0.03, max: -0.01, step: 0.005, weight: 2 },
  { stat: 'darkResist', op: 'add', min: 0.04, max: 0.1, step: 0.01, weight: 1 },
  { stat: 'healMult', op: 'add', min: 0.04, max: 0.1, step: 0.01, weight: 2 },
  { stat: 'moveSpeed', op: 'mult', min: 0.01, max: 0.03, step: 0.005, weight: 2 },
  { stat: 'dashCooldown', op: 'mult', min: -0.05, max: -0.02, step: 0.01, weight: 2 },
  { stat: 'focusGain', op: 'add', min: 0.03, max: 0.08, step: 0.01, weight: 2 },
  { stat: 'spiritGain', op: 'add', min: 0.03, max: 0.08, step: 0.01, weight: 2 },
  { stat: 'shardChance', op: 'add', min: 0.01, max: 0.03, step: 0.005, weight: 1 },
  { stat: 'wardSpeed', op: 'add', min: 0.04, max: 0.1, step: 0.01, weight: 1 },
  { stat: 'survivorHp', op: 'add', min: 0.05, max: 0.12, step: 0.01, weight: 1 },
  { stat: 'trainTime', op: 'add', min: -0.05, max: -0.02, step: 0.01, weight: 1 },
];

// Legendary specials: the same 효과 부품 rows as skills, so gear never needs its own code.
export const GEAR_SPECIALS: Record<string, { nameKey: TKey; descKey: TKey; rows: readonly EffectRow[] }> = {
  grudge_pop: { nameKey: 'gear.special.grudge_pop.name', descKey: 'gear.special.grudge_pop.desc', rows: [{ when: 'onKill', if: [{ target: 'strong' }], do: 'hit', with: { shape: 'chain', range: 1.5, mult: 1, of: 'slash', count: 3 } }] },
  trailing_blade: { nameKey: 'gear.special.trailing_blade.name', descKey: 'gear.special.trailing_blade.desc', rows: [{ when: 'onSwing', if: [{ chance: 0.2 }], do: 'hit', with: { shape: 'front', range: 1.8, mult: 0.5, of: 'hit' } }] },
  frost_bell: { nameKey: 'gear.special.frost_bell.name', descKey: 'gear.special.frost_bell.desc', rows: [{ when: 'onHit', do: 'status', with: { kind: 'slow', sec: 1.5, power: 0.25 }, cd: 1 }] },
  cliff_edge: { nameKey: 'gear.special.cliff_edge.name', descKey: 'gear.special.cliff_edge.desc', rows: [{ when: 'onBeforeAttack', if: [{ hpBelow: 0.25 }], do: 'scale', with: { arg: 'damage', by: 1.25 } }] },
  pickpocket: { nameKey: 'gear.special.pickpocket.name', descKey: 'gear.special.pickpocket.desc', rows: [{ when: 'onHit', if: [{ chance: 0.08 }, { target: 'strong' }], do: 'gain', with: { res: 'spirit', amount: 1 } }] },
  vengeance: { nameKey: 'gear.special.vengeance.name', descKey: 'gear.special.vengeance.desc', rows: [{ when: 'onAfterHurt', do: 'buff', with: { stat: 'slash', op: 'mult', value: 1.15, sec: 3 } }] },
  curse_bead: { nameKey: 'gear.special.curse_bead.name', descKey: 'gear.special.curse_bead.desc', rows: [{ when: 'onHit', if: [{ attack: 'slash' }], do: 'status', with: { kind: 'curse', sec: 3, power: 1, max: 2 } }] },
};

export const GEAR_ECONOMY = {
  maxLevel: 10,
  // 강화(돈): cost of level n → n+1 = round10(enhanceBase × (n+1)^enhancePow × grade costMult). Never fails.
  enhanceBase: 60,
  enhancePow: 1.4,
  // 다시 굴리기(파편): 1 + times this piece was rerolled, at most rerollMax.
  rerollMax: 3,
  // 녹이기(돈): round10(dismantleBase × grade costMult × (1 + 0.5 × level)).
  dismantleBase: 40,
  bag: 8, // pieces kept (more with the 경리 책상 later)
} as const;
