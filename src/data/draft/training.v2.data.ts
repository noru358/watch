import type { Stats } from '../../systems/rift';

// 트레이닝 v2 (DRAFT 2026-10-28, not wired). User: "스탯 더 다양하게, 쪼개고 촘촘하게".
// Same rule as today (one row = one line; price = cost × (rank + 1) × (1 + 0.02 × all bought)),
// but about twice the lines, half the step and twice the ranks: buying happens more often, the
// total power at the top stays near today's (slash +20 %, HP +4, move +10 %).
// Lines marked `new` need a Stats field that does not exist yet; NEW_STATS says the one place each
// would be applied (Rule 1: one number, one place).

export const NEW_STATS = {
  strongDamage: '강적에게 주는 피해 배율 — combat.hitEnemy (isStrong)',
  fodderDamage: '도깨비불에게 주는 피해 배율 — combat.hitEnemy (fodder)',
  bossDamage: '보스·이름 붙은 표적 피해 배율 — combat.hitEnemy (gumiho / role bounty·quarry)',
  attackMove: '휘두르는 중 이동 속도 배율 — player.ts 이동',
  damageTaken: '받는 피해 배율 — combat.hurtPlayer',
  poise: '맞아도 휘두르기가 안 끊길 확률 — combat.hurtPlayer',
  healMult: '회복량 배율 — cardEffects.heal (변형의 healMult와 곱)',
  focusGain: '진심 게이지 차는 양 배율 — player.ts 진심',
  critChance: '치명 확률 — combat.hitEnemy (onBeforeAttack 뒤)',
  critDamage: '치명 피해 배율 — combat.hitEnemy',
  spiritGain: '줍는 영력 배율 — rift 줍기',
  shardChance: '파편 확률 가산 — lair.ts / mapgen 보물 방',
  feeBonus: '수임료 가산 — run/settle.ts',
  wardSpeed: '결계 채우는 속도 배율 — objectives/ward.ts',
  survivorHp: '구조 의뢰인 체력 배율 — objectives/rescue.ts',
  trainTime: '첫차까지 시간 배율 — objectives/firsttrain.ts',
} as const;
export type NewStat = keyof typeof NEW_STATS;

export type GroupV2 = 'power' | 'hands' | 'feet' | 'nerve' | 'focus' | 'eye' | 'knack' | 'trade';
export const GROUPS_V2: Record<GroupV2, string> = {
  power: '완력', hands: '손놀림', feet: '몸놀림', nerve: '담력', focus: '진심', eye: '눈썰미', knack: '수완', trade: '전문',
};

export interface TrainingLineV2 {
  group: GroupV2;
  name: string;
  stat: keyof Stats | NewStat;
  op: 'mult' | 'add';
  per: number;
  max: number;
  cost: number;
  unit: 'pct' | 'sec' | 'tiles' | 'count';
  now?: string; // the line it replaces today (TrainingId), if any
}

export const TRAINING_V2: Record<string, TrainingLineV2> = {
  // 완력
  slash: { group: 'power', name: '베기 피해', stat: 'slash', op: 'mult', per: 0.02, max: 10, cost: 60, unit: 'pct', now: 'power_slash' },
  draw: { group: 'power', name: '발도 피해', stat: 'drawSlash', op: 'mult', per: 0.02, max: 10, cost: 60, unit: 'pct', now: 'power_draw' },
  reach: { group: 'power', name: '베기 리치', stat: 'reach', op: 'add', per: 0.025, max: 6, cost: 100, unit: 'tiles', now: 'power_reach' },
  finisher: { group: 'power', name: '3타 막타 피해', stat: 'comboBonus', op: 'mult', per: 0.05, max: 6, cost: 50, unit: 'pct' },
  strong: { group: 'power', name: '강적 피해', stat: 'strongDamage', op: 'add', per: 0.02, max: 5, cost: 80, unit: 'pct' },
  fodder: { group: 'power', name: '도깨비불 피해', stat: 'fodderDamage', op: 'add', per: 0.05, max: 4, cost: 40, unit: 'pct' },
  boss: { group: 'power', name: '보스·표적 피해', stat: 'bossDamage', op: 'add', per: 0.02, max: 5, cost: 90, unit: 'pct' },
  // 손놀림
  swing: { group: 'hands', name: '휘두르기 간격', stat: 'swingTime', op: 'mult', per: -0.015, max: 10, cost: 70, unit: 'pct', now: 'hands_swing' },
  drawcd: { group: 'hands', name: '발도 재사용', stat: 'drawCooldown', op: 'mult', per: -0.025, max: 8, cost: 70, unit: 'pct', now: 'hands_drawcd' },
  recover: { group: 'hands', name: '3타 뒤 숨 고르기', stat: 'finisherRecovery', op: 'mult', per: -0.025, max: 6, cost: 60, unit: 'pct', now: 'hands_finisher' },
  attackMove: { group: 'hands', name: '공격 중 이동', stat: 'attackMove', op: 'add', per: 0.03, max: 5, cost: 60, unit: 'pct' },
  // 몸놀림
  move: { group: 'feet', name: '이동 속도', stat: 'moveSpeed', op: 'mult', per: 0.01, max: 10, cost: 60, unit: 'pct', now: 'feet_move' },
  dashcd: { group: 'feet', name: '돌진 재사용', stat: 'dashCooldown', op: 'mult', per: -0.02, max: 10, cost: 70, unit: 'pct', now: 'feet_dashcd' },
  dashlen: { group: 'feet', name: '돌진 거리', stat: 'dashSpeed', op: 'mult', per: 0.025, max: 4, cost: 70, unit: 'pct', now: 'feet_dashlen' },
  dashguard: { group: 'feet', name: '돌진 무적', stat: 'dashIframes', op: 'add', per: 0.01, max: 4, cost: 80, unit: 'sec' },
  // 담력
  hp: { group: 'nerve', name: '최대 체력', stat: 'maxHp', op: 'add', per: 1, max: 4, cost: 140, unit: 'count', now: 'nerve_hp' },
  parry: { group: 'nerve', name: '받아치기 여유', stat: 'parryWindow', op: 'add', per: 0.005, max: 6, cost: 120, unit: 'sec', now: 'nerve_parry' },
  iframes: { group: 'nerve', name: '맞은 뒤 무적', stat: 'hurtIframes', op: 'add', per: 0.025, max: 4, cost: 100, unit: 'sec', now: 'nerve_iframes' },
  guard: { group: 'nerve', name: '받는 피해 감소', stat: 'damageTaken', op: 'add', per: -0.02, max: 5, cost: 100, unit: 'pct' },
  poise: { group: 'nerve', name: '경직 저항', stat: 'poise', op: 'add', per: 0.05, max: 4, cost: 90, unit: 'pct' },
  heal: { group: 'nerve', name: '회복량', stat: 'healMult', op: 'add', per: 0.05, max: 4, cost: 60, unit: 'pct' },
  // 진심
  gauge: { group: 'focus', name: '진심 게이지 칸 수', stat: 'focusMax', op: 'add', per: -1, max: 1, cost: 490, unit: 'count', now: 'focus_gauge' },
  bare: { group: 'focus', name: '검신 노출 시간', stat: 'bareTime', op: 'add', per: 0.25, max: 4, cost: 70, unit: 'sec', now: 'focus_bare' },
  focusGain: { group: 'focus', name: '진심 차는 양', stat: 'focusGain', op: 'add', per: 0.05, max: 4, cost: 80, unit: 'pct' },
  // 눈썰미 (새 갈래: 치명)
  crit: { group: 'eye', name: '치명 확률', stat: 'critChance', op: 'add', per: 0.01, max: 10, cost: 60, unit: 'pct' },
  critDmg: { group: 'eye', name: '치명 피해', stat: 'critDamage', op: 'add', per: 0.05, max: 6, cost: 70, unit: 'pct' },
  // 수완
  magnet: { group: 'knack', name: '영력 끌어오기 범위', stat: 'magnet', op: 'mult', per: 0.05, max: 6, cost: 40, unit: 'pct', now: 'knack_magnet' },
  spirit: { group: 'knack', name: '영력 획득', stat: 'spiritGain', op: 'add', per: 0.02, max: 10, cost: 60, unit: 'pct' },
  shard: { group: 'knack', name: '파편 확률', stat: 'shardChance', op: 'add', per: 0.02, max: 5, cost: 130, unit: 'pct' },
  fee: { group: 'knack', name: '수임료', stat: 'feeBonus', op: 'add', per: 0.01, max: 10, cost: 80, unit: 'pct' },
  // 전문 (새 갈래: 의뢰 목표 특화)
  ward: { group: 'trade', name: '결계 채우기', stat: 'wardSpeed', op: 'add', per: 0.04, max: 5, cost: 50, unit: 'pct' },
  survivor: { group: 'trade', name: '구조 의뢰인 체력', stat: 'survivorHp', op: 'add', per: 0.06, max: 5, cost: 50, unit: 'pct' },
  train: { group: 'trade', name: '첫차까지 시간', stat: 'trainTime', op: 'add', per: -0.02, max: 5, cost: 50, unit: 'pct' },
};

// Four times the ranks would make today's 2 % inflation explode (×5 by the end), so v2 inflates
// slower. Whole tree ≈ 2× today's (more to buy, slower growth — user: slower than typical RPGs).
export const TRAINING_PRICE_V2 = { inflation: 0.005, roundTo: 10 } as const;
