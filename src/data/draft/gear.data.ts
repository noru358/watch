import type { EffectRow } from '../../registry/effects';
import type { Stats } from '../../systems/rift';
import type { NewStat } from './training.v2.data';

// 장신구 (DRAFT 2026-10-28, not wired). User decisions: 3 accessory slots, money raises the level
// (main option), 심연 파편 rerolls a sub option. Structure: Genshin artifacts (main option fixed by
// slot and grows with level, sub options random) + MapleStory (star force = level with money,
// cube = reroll) without destruction. A legendary piece adds one special written as 효과 부품 rows.

export type GearStat = keyof Stats | NewStat;
export type GearSlot = 'bracelet' | 'necklace' | 'keyring';
export type Grade = 'common' | 'rare' | 'epic' | 'legend';

export interface MainOption {
  stat: GearStat;
  op: 'add' | 'mult';
  base: number; // at level 0
  perLevel: number;
  weight: number;
}

export const GEAR_SLOTS: Record<GearSlot, { name: string; role: string; mains: readonly MainOption[] }> = {
  bracelet: {
    name: '염주 팔찌', role: '공격',
    mains: [
      { stat: 'slash', op: 'mult', base: 0.04, perLevel: 0.008, weight: 3 },
      { stat: 'drawSlash', op: 'mult', base: 0.04, perLevel: 0.008, weight: 2 },
      { stat: 'critChance', op: 'add', base: 0.03, perLevel: 0.004, weight: 1 },
    ],
  },
  necklace: {
    name: '호부 목걸이', role: '버티기',
    mains: [
      { stat: 'maxHp', op: 'add', base: 1, perLevel: 0.2, weight: 3 },
      { stat: 'damageTaken', op: 'add', base: -0.03, perLevel: -0.006, weight: 2 },
      { stat: 'healMult', op: 'add', base: 0.08, perLevel: 0.016, weight: 1 },
    ],
  },
  keyring: {
    name: '방울 키링', role: '몸놀림·살림',
    mains: [
      { stat: 'moveSpeed', op: 'mult', base: 0.02, perLevel: 0.004, weight: 2 },
      { stat: 'dashCooldown', op: 'mult', base: -0.03, perLevel: -0.006, weight: 2 },
      { stat: 'spiritGain', op: 'add', base: 0.05, perLevel: 0.01, weight: 2 },
    ],
  },
};
export const GEAR_SLOT_IDS: readonly GearSlot[] = ['bracelet', 'necklace', 'keyring'];

export const GRADES: Record<Grade, { name: string; subs: number; special: boolean; costMult: number }> = {
  common: { name: '흔함', subs: 0, special: false, costMult: 1 },
  rare: { name: '드묾', subs: 1, special: false, costMult: 1.5 },
  epic: { name: '귀함', subs: 2, special: false, costMult: 2.2 },
  legend: { name: '전설', subs: 3, special: true, costMult: 3 },
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
export const DROPS: Record<DropSource, { name: string; chance: number; shift: number; minGrade?: Grade }> = {
  bounty: { name: '현상수배 표적', chance: 1, shift: 1 },
  lair: { name: '괴이 소굴 보물', chance: 0.35, shift: 0 },
  deep: { name: '깊은 층 보물 방', chance: 0.5, shift: 0 },
  boss: { name: '메인 스토리 보스', chance: 1, shift: 2, minGrade: 'epic' },
};

export interface SubOption {
  stat: GearStat;
  op: 'add' | 'mult';
  min: number;
  max: number;
  step: number;
  weight: number;
  name: string;
}

export const SUB_OPTIONS: readonly SubOption[] = [
  { name: '베기 피해', stat: 'slash', op: 'mult', min: 0.01, max: 0.03, step: 0.005, weight: 3 },
  { name: '발도 피해', stat: 'drawSlash', op: 'mult', min: 0.01, max: 0.03, step: 0.005, weight: 3 },
  { name: '치명 확률', stat: 'critChance', op: 'add', min: 0.01, max: 0.03, step: 0.005, weight: 3 },
  { name: '치명 피해', stat: 'critDamage', op: 'add', min: 0.03, max: 0.08, step: 0.01, weight: 3 },
  { name: '강적 피해', stat: 'strongDamage', op: 'add', min: 0.02, max: 0.05, step: 0.01, weight: 2 },
  { name: '도깨비불 피해', stat: 'fodderDamage', op: 'add', min: 0.05, max: 0.12, step: 0.01, weight: 2 },
  { name: '보스·표적 피해', stat: 'bossDamage', op: 'add', min: 0.02, max: 0.05, step: 0.01, weight: 2 },
  { name: '최대 체력', stat: 'maxHp', op: 'add', min: 1, max: 1, step: 1, weight: 1 },
  { name: '받는 피해 감소', stat: 'damageTaken', op: 'add', min: -0.03, max: -0.01, step: 0.005, weight: 2 },
  { name: '경직 저항', stat: 'poise', op: 'add', min: 0.03, max: 0.08, step: 0.01, weight: 2 },
  { name: '회복량', stat: 'healMult', op: 'add', min: 0.04, max: 0.1, step: 0.01, weight: 2 },
  { name: '이동 속도', stat: 'moveSpeed', op: 'mult', min: 0.01, max: 0.03, step: 0.005, weight: 2 },
  { name: '돌진 재사용', stat: 'dashCooldown', op: 'mult', min: -0.05, max: -0.02, step: 0.01, weight: 2 },
  { name: '진심 차는 양', stat: 'focusGain', op: 'add', min: 0.03, max: 0.08, step: 0.01, weight: 2 },
  { name: '영력 획득', stat: 'spiritGain', op: 'add', min: 0.03, max: 0.08, step: 0.01, weight: 2 },
  { name: '파편 확률', stat: 'shardChance', op: 'add', min: 0.01, max: 0.03, step: 0.005, weight: 1 },
  { name: '결계 채우기', stat: 'wardSpeed', op: 'add', min: 0.04, max: 0.1, step: 0.01, weight: 1 },
  { name: '구조 의뢰인 체력', stat: 'survivorHp', op: 'add', min: 0.05, max: 0.12, step: 0.01, weight: 1 },
  { name: '첫차까지 시간', stat: 'trainTime', op: 'add', min: -0.05, max: -0.02, step: 0.01, weight: 1 },
];

// Legendary specials: the same 효과 부품 rows as skills, so gear never needs its own code.
export const GEAR_SPECIALS: Record<string, { name: string; desc: string; rows: readonly EffectRow[] }> = {
  grudge_pop: { name: '원혼 폭발', desc: '강적을 쓰러뜨리면 그 자리가 터진다(베기 ×1, 1.5칸).', rows: [{ when: 'onKill', if: [{ target: 'strong' }], do: 'hit', with: { shape: 'chain', range: 1.5, mult: 1, of: 'slash', count: 3 } }] },
  trailing_blade: { name: '뒤따르는 칼', desc: '휘두를 때 20% 확률로 앞을 50% 위력으로 한 번 더.', rows: [{ when: 'onSwing', if: [{ chance: 0.2 }], do: 'hit', with: { shape: 'front', range: 1.8, mult: 0.5, of: 'hit' } }] },
  frost_bell: { name: '서리 방울', desc: '맞힌 괴이가 1.5초 25% 느려진다(1초마다).', rows: [{ when: 'onHit', do: 'status', with: { kind: 'slow', sec: 1.5, power: 0.25 }, cd: 1 }] },
  cliff_edge: { name: '벼랑 끝', desc: '체력 1/4 아래면 주는 피해 ×1.25.', rows: [{ when: 'onBeforeAttack', if: [{ hpBelow: 0.25 }], do: 'scale', with: { arg: 'damage', by: 1.25 } }] },
  pickpocket: { name: '영력 털기', desc: '강적을 맞힐 때 8% 확률로 영력 1.', rows: [{ when: 'onHit', if: [{ chance: 0.08 }, { target: 'strong' }], do: 'gain', with: { res: 'spirit', amount: 1 } }] },
  vengeance: { name: '복수', desc: '맞으면 3초 동안 베기 피해 ×1.15.', rows: [{ when: 'onAfterHurt', do: 'buff', with: { stat: 'slash', op: 'mult', value: 1.15, sec: 3 } }] },
  curse_bead: { name: '부정 구슬', desc: '베기에 맞은 괴이에 부정(초당 1, 3초, 최대 2스택).', rows: [{ when: 'onHit', if: [{ attack: 'slash' }], do: 'status', with: { kind: 'curse', sec: 3, power: 1, max: 2 } }] },
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
