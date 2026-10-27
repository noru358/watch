import type { TKey } from '../i18n';
import type { EffectRow } from '../registry/effects';
import type { ActiveId, DuoId, PassiveId, SkillSlotId, UpgradeId } from '../types/ids';
import type { Stats } from '../systems/rift';

// 기술 (docs/rules/growth.md), written as rows of 효과 부품 (registry/effects; adopted 2026-10-28 from
// the draft, user "ㅇㅋ 붙여"). Bought with 심연 파편.
//   Passives: blade / step / eye × tiers 1–4 and craft × 1–2; each slot has 2–4 sides, one on at a
//     time (swap freely in the office — Hades' Mirror of Night). Tier N needs tier N-1 of its branch.
//   Duos: on by themselves while both named passives are on (Hades duo boons).
//   Actives: learned with shards; one on L. Upgrades: one per active, changes it (MapleStory hyper skills).
// Adding a skill = one row here + its id + two i18n lines; no code unless it needs a new 효과 부품.

export type StatMod = { stat: keyof Stats; op: 'add' | 'mult'; value: number };

export interface SkillData {
  nameKey: TKey;
  descKey: TKey;
  mods: readonly StatMod[]; // always on (stat-only part)
  rows: readonly EffectRow[];
  hud?: 'ghostEye' | 'mapFirst' | 'mapAll'; // drawn by the HUD
  ref: string; // the game it comes from
}
export interface ActiveData extends SkillData {
  cost: number;
  cooldown: number;
}
export interface UpgradeData extends SkillData {
  of: ActiveId;
  cost: number;
  patch: { cooldownMult?: number; radiusAdd?: number; pierce?: boolean }; // changes to the active's own rows
}
export interface DuoData extends SkillData {
  requires: readonly [PassiveId, PassiveId];
}

const S = (id: string, ref: string, rows: readonly EffectRow[] = [], mods: readonly StatMod[] = [], hud?: SkillData['hud']): SkillData => ({
  nameKey: `skill.${id}.name` as TKey, descKey: `skill.${id}.desc` as TKey, mods, rows, ref, ...(hud ? { hud } : {}),
});

export const PASSIVES: Record<PassiveId, SkillData> = {
  // 검 — how hits land
  dash_cut: S('dash_cut', '할로우 나이트 샤프 섀도', [{ when: 'onDashEnd', do: 'hit', with: { shape: 'front', range: 1.9, mult: 1, of: 'slash', dir: 'dash' } }]),
  finisher_wave: S('finisher_wave', '하데스 아레스', [{ when: 'onSwing', if: [{ heavy: true }], do: 'hit', with: { shape: 'around', range: 2.6, mult: 0.5, of: 'hit' } }]),
  counter_focus: S('counter_focus', '세키로 간파', [{ when: 'onCounter', do: 'gain', with: { res: 'focus', amount: 2 } }]),
  draw_stun: S('draw_stun', '하데스 포세이돈', [{ when: 'onHit', if: [{ plainDraw: true }], do: 'status', with: { kind: 'stun', sec: 0.6 } }]),
  strike_refund: S('strike_refund', '데드 셀', [{ when: 'onFocusStrike', do: 'gain', with: { res: 'focus', amount: 2 } }]),
  bare_extend: S('bare_extend', '하데스 분노', [{ when: 'onHit', if: [{ bare: true }], do: 'gain', with: { res: 'bare', amount: 0.3 } }]),
  final_blow: S('final_blow', '메이플 파이널 어택', [{ when: 'onSwing', if: [{ chance: 0.25 }], do: 'hit', with: { shape: 'front', range: 1.8, mult: 0.6, of: 'hit' } }]),
  momentum: S('momentum', '메이플 콤보 어택', [{ when: 'onHit', if: [{ attack: 'slash' }], do: 'stack', with: { key: 'momentum', add: 1, max: 5, decay: 3, stat: 'slash', per: 0.03 } }]),
  curse_cut: S('curse_cut', '하데스 디오니소스', [{ when: 'onHit', if: [{ attack: 'slash' }], do: 'status', with: { kind: 'curse', sec: 4, power: 1, max: 3 } }]),
  // 발 — how the director moves
  salt_trail: S('salt_trail', 'RoR2 가솔린', [{ when: 'onDashTick', do: 'zone', with: { kind: 'salt', radius: 0.6, sec: 1.5, spacing: 0.5 } }]),
  counter_dash: S('counter_dash', '데드 셀 회피', [{ when: 'onCounter', do: 'gain', with: { res: 'dash', amount: 9 } }]),
  double_dash: S('double_dash', '하데스 거울', [], [{ stat: 'dashCharges', op: 'add', value: 1 }]),
  shadow_step: S('shadow_step', '메이플 다크 사이트', [], [{ stat: 'dashIframes', op: 'add', value: 0.08 }]),
  dodge_focus: S('dodge_focus', '베요네타 위치 타임', [{ when: 'onDodge', do: 'gain', with: { res: 'focus', amount: 2 } }]),
  sprint: S('sprint', '하데스 헤르메스', [{ when: 'onMove', if: [{ calm: 1 }], do: 'scale', with: { arg: 'mult', by: 1.15 } }]),
  frost_salt: S('frost_salt', '하데스 데메테르', [{ when: 'onHit', if: [{ attack: 'draw' }], do: 'status', with: { kind: 'slow', sec: 2, power: 0.3 } }]),
  edge_dash: S('edge_dash', '할로우 나이트 샤프 섀도', [{ when: 'onDashTick', do: 'hit', with: { shape: 'around', range: 0.8, mult: 0.3, of: 'slash' }, cd: 0.2 }]),
  iron_body: S('iron_body', '메이플 파워 스탠스', [], [{ stat: 'damageTaken', op: 'add', value: -0.2 }, { stat: 'moveSpeed', op: 'mult', value: 0.95 }]),
  // 눈 — what the director notices
  ghost_eye: S('ghost_eye', '딥 락 스캐너', [], [], 'ghostEye'),
  spirit_eye: S('spirit_eye', '뱀서 어트랙토브', [], [{ stat: 'magnet', op: 'mult', value: 2 }]),
  steady_breath: S('steady_breath', '하데스 아테나', [{ when: 'onFloorEnd', if: [{ unhurt: true }], do: 'gain', with: { res: 'hp', amount: 2 } }]),
  grudge_eater: S('grudge_eater', '데드 셀 강령술', [{ when: 'onKill', if: [{ target: 'strong' }], do: 'gain', with: { res: 'hp', amount: 1 } }]),
  last_breath: S('last_breath', '하데스 죽음 저항', [{ when: 'onLethal', if: [{ once: 'night' }], do: 'save', with: { hp: 1 } }]),
  greed: S('greed', '메이플 픽파킷', [{ when: 'onKill', if: [{ target: 'strong' }], do: 'gain', with: { res: 'spirit', amount: 3 } }]),
  cliff_edge: S('cliff_edge', '할로우 나이트 분노한 자의 분노', [{ when: 'onBeforeAttack', if: [{ hpBelow: 0.25 }], do: 'scale', with: { arg: 'damage', by: 1.3 } }]),
  vengeance: S('vengeance', '데드 셀 복수', [{ when: 'onAfterHurt', do: 'buff', with: { stat: 'slash', op: 'mult', value: 1.2, sec: 3 } }]),
  grudge_pop: S('grudge_pop', 'RoR2 윌오위스프', [{ when: 'onKill', if: [{ target: 'strong' }], do: 'hit', with: { shape: 'chain', range: 1.5, mult: 1, of: 'slash', count: 3 } }]),
  pickpocket: S('pickpocket', '메이플 픽파킷', [{ when: 'onHit', if: [{ chance: 0.1 }, { target: 'strong' }], do: 'gain', with: { res: 'spirit', amount: 1 } }]),
  // 솜씨 — the job, not the fight
  door_magnet: S('door_magnet', '뱀서 진공', [{ when: 'onFloorEnd', do: 'collect', with: {} }]),
  shortcut_nose: S('shortcut_nose', '딥 락 지형 스캐너', [], [], 'mapAll'),
  ward_hands: S('ward_hands', '딥 락 미션 특화', [], [{ stat: 'wardSpeed', op: 'add', value: 0.15 }]),
  escort_care: S('escort_care', '불가사의 던전', [], [{ stat: 'survivorHp', op: 'add', value: 0.3 }]),
  early_bird: S('early_bird', '딥 락 미션 특화', [], [{ stat: 'trainTime', op: 'add', value: -0.15 }]),
};

export const SKILL_BRANCHES = ['blade', 'step', 'eye', 'craft'] as const;

// Which passives share a slot (one on), and what opening the slot costs (shards).
export const SKILL_SLOTS: Record<SkillSlotId, { sides: readonly PassiveId[]; cost: number }> = {
  blade1: { sides: ['dash_cut', 'finisher_wave'], cost: 1 },
  blade2: { sides: ['counter_focus', 'draw_stun'], cost: 2 },
  blade3: { sides: ['strike_refund', 'bare_extend'], cost: 3 },
  blade4: { sides: ['final_blow', 'momentum', 'curse_cut'], cost: 4 },
  step1: { sides: ['salt_trail', 'counter_dash'], cost: 1 },
  step2: { sides: ['double_dash', 'shadow_step'], cost: 2 },
  step3: { sides: ['dodge_focus', 'sprint'], cost: 3 },
  step4: { sides: ['frost_salt', 'edge_dash', 'iron_body'], cost: 4 },
  eye1: { sides: ['ghost_eye', 'spirit_eye'], cost: 1 },
  eye2: { sides: ['steady_breath', 'grudge_eater'], cost: 2 },
  eye3: { sides: ['last_breath', 'greed'], cost: 3 },
  eye4: { sides: ['cliff_edge', 'vengeance', 'grudge_pop', 'pickpocket'], cost: 4 },
  craft1: { sides: ['door_magnet', 'shortcut_nose'], cost: 1 },
  craft2: { sides: ['ward_hands', 'escort_care', 'early_bird'], cost: 2 },
};

export const DUOS: Record<DuoId, DuoData> = {
  duo_salt_frost_trail: { ...S('duo_salt_frost_trail', '하데스 듀오 축복', [{ when: 'onDashTick', do: 'status', with: { kind: 'slow', sec: 1.5, power: 0.3, radius: 1 }, cd: 0.3 }]), requires: ['salt_trail', 'frost_salt'] },
  duo_momentum_echo: { ...S('duo_momentum_echo', '하데스 듀오 축복', [{ when: 'onHit', if: [{ stacks: { key: 'momentum', atLeast: 5 } }], do: 'hit', with: { shape: 'target', range: 0, mult: 0.3, of: 'hit' } }]), requires: ['momentum', 'final_blow'] },
  duo_curse_pop: { ...S('duo_curse_pop', '하데스 듀오 축복', [{ when: 'onKill', do: 'status', with: { kind: 'curse', sec: 4, power: 1, max: 3, radius: 2 } }]), requires: ['curse_cut', 'grudge_pop'] },
};

const A = (id: ActiveId, ref: string, cost: number, cooldown: number, rows: readonly EffectRow[]): ActiveData => ({
  nameKey: `active.${id}.name` as TKey, descKey: `active.${id}.desc` as TKey, mods: [], rows, ref, cost, cooldown,
});

export const ACTIVES: Record<ActiveId, ActiveData> = {
  talisman: A('talisman', '메이플 표창', 2, 6, [{ when: 'onCast', do: 'shot', with: { speed: 14, range: 8, mult: 2, stun: 1.5 } }]),
  barrier: A('barrier', '메이플 스모크 쉘', 2, 14, [{ when: 'onCast', do: 'zone', with: { kind: 'barrier', radius: 2, sec: 2 } }]),
  salt_burst: A('salt_burst', '하데스 데메테르', 2, 10, [{ when: 'onCast', do: 'cleanse', with: { radius: 3.5 } }, { when: 'onCast', do: 'status', with: { kind: 'stun', sec: 0.6, radius: 3.5 } }]),
  shadow_double: A('shadow_double', '메이플 섀도우 파트너', 4, 30, [{ when: 'onCast', do: 'echo', with: { sec: 12, mult: 0.6 } }]),
  spirit_burst: A('spirit_burst', '메이플 메소 익스플로전', 3, 8, [{ when: 'onCast', do: 'burst', with: { radius: 4, mult: 0.5 } }]),
  shrink_step: A('shrink_step', '메이플 텔레포트', 3, 7, [{ when: 'onCast', do: 'blink', with: { range: 5 } }, { when: 'onCast', do: 'hit', with: { shape: 'around', range: 1.6, mult: 1.5, of: 'slash' } }]),
  chain_charm: A('chain_charm', '메이플 체인 라이트닝 · 하데스 제우스', 3, 9, [
    { when: 'onCast', do: 'shot', with: { speed: 16, range: 9, mult: 1.5, stun: 0.3 } },
    { when: 'onHit', if: [{ attack: 'skill' }], do: 'hit', with: { shape: 'chain', range: 3, mult: 0.8, of: 'hit', count: 3 }, cd: 0.5 },
  ]),
  smoke: A('smoke', '메이플 스모크 쉘', 3, 18, [{ when: 'onCast', do: 'zone', with: { kind: 'barrier', radius: 2.5, sec: 3 } }]),
  momentum_release: A('momentum_release', '메이플 콤보 어택 마무리', 3, 6, [{ when: 'onCast', do: 'spend', with: { key: 'momentum', shape: 'around', range: 2.2, multPerStack: 0.8 } }]),
  grudge_chain: A('grudge_chain', '하데스 아레스 파멸', 3, 12, [
    { when: 'onCast', do: 'status', with: { kind: 'mark', sec: 6, radius: 3 } },
    { when: 'onHit', if: [{ marked: true }], do: 'hit', with: { shape: 'target', range: 0, mult: 3, of: 'slash', consumeMark: true } },
  ]),
};

const U = (id: UpgradeId, of: ActiveId, ref: string, patch: UpgradeData['patch'], rows: readonly EffectRow[] = []): UpgradeData => ({ ...S(id, ref, rows), of, cost: 1, patch });

export const UPGRADES: Record<UpgradeId, UpgradeData> = {
  talisman_pierce: U('talisman_pierce', 'talisman', '메이플 하이퍼 엑스트라 타겟', { pierce: true }),
  talisman_triple: U('talisman_triple', 'talisman', '메이플 트리플 스로우', {}, [{ when: 'onCast', do: 'shot', with: { speed: 14, range: 7, mult: 1.2, stun: 0.8, count: 2, spread: 0.6 } }]),
  talisman_quick: U('talisman_quick', 'talisman', '메이플 하이퍼 쿨타임 리듀스', { cooldownMult: 0.7 }),
  barrier_wide: U('barrier_wide', 'barrier', '메이플 하이퍼', { radiusAdd: 1 }),
  barrier_heal: U('barrier_heal', 'barrier', '메이플 홀리 심볼', {}, [{ when: 'onCast', do: 'gain', with: { res: 'hp', amount: 2 } }]),
  barrier_blast: U('barrier_blast', 'barrier', '하데스 포세이돈', {}, [{ when: 'onCast', do: 'hit', with: { shape: 'around', range: 2, mult: 2, of: 'slash' } }]),
  salt_frost: U('salt_frost', 'salt_burst', '하데스 데메테르', {}, [{ when: 'onCast', do: 'status', with: { kind: 'slow', sec: 3, power: 0.4, radius: 3.5 } }]),
  salt_wide: U('salt_wide', 'salt_burst', '뱀서 캔들라브라도', { radiusAdd: 1.5 }),
  salt_focus: U('salt_focus', 'salt_burst', '데드 셀', {}, [{ when: 'onCast', do: 'gain', with: { res: 'focus', amount: 2 } }]),
};

export const ACTIVE_IDS = Object.keys(ACTIVES) as ActiveId[];
export const UPGRADE_IDS = Object.keys(UPGRADES) as UpgradeId[];
