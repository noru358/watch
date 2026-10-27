import type { EffectRow } from '../../registry/effects';
import type { StatMod } from '../skills.data';

// 기술 v2 (DRAFT 2026-10-28, not wired): every skill is written as rows of 효과 부품
// (registry/effects). Names and lines are inline Korean for review; on adoption they move to i18n.
// The first 21 rows are today's skills rewritten as rows (behaviour must not change); the rest are
// new candidates from MapleStory / Hades / Hollow Knight / Dead Cells / Risk of Rain 2.
// References: docs/design/3-growth/content-proposal.md §1.

export type SkillKind = 'passive' | 'active' | 'upgrade' | 'utility' | 'duo';
export type Branch = 'blade' | 'step' | 'eye' | 'craft';

export interface SkillV2 {
  name: string;
  desc: string;
  kind: SkillKind;
  branch?: Branch;
  tier?: 1 | 2 | 3 | 4; // passive slot tier (cost 1 / 2 / 3 / 4 shards)
  cooldown?: number; // active: seconds
  upgrades?: string; // upgrade: the active it changes
  requires?: readonly [string, string]; // duo: both must be on
  mods?: readonly StatMod[];
  rows: readonly EffectRow[];
  hud?: 'ghostEye' | 'mapCopy'; // drawn by the HUD, no rows
  ref: string;
  now?: true; // exists in the game today (rewritten as rows)
}

export const SKILLS_V2: Record<string, SkillV2> = {
  // ===== 지금 있는 기술을 부품으로 다시 쓴 것 =====
  dash_cut: { now: true, name: '돌진 베기', desc: '돌진이 끝나면 돌진한 쪽을 한 번 벤다.', kind: 'passive', branch: 'blade', tier: 1, ref: '할로우 나이트 샤프 섀도', rows: [{ when: 'onDashEnd', do: 'hit', with: { shape: 'front', range: 1.9, mult: 1, of: 'slash', dir: 'dash' } }] },
  finisher_wave: { now: true, name: '3타 파문', desc: '3타 막타가 주변 한 바퀴도 절반 피해로 벤다.', kind: 'passive', branch: 'blade', tier: 1, ref: '하데스 아레스', rows: [{ when: 'onSwing', if: [{ heavy: true }], do: 'hit', with: { shape: 'around', range: 2.6, mult: 0.5, of: 'hit' } }] },
  counter_focus: { now: true, name: '받아친 기세', desc: '받아치기에 성공하면 진심 게이지 2칸.', kind: 'passive', branch: 'blade', tier: 2, ref: '세키로 간파', rows: [{ when: 'onCounter', do: 'gain', with: { res: 'focus', amount: 2 } }] },
  draw_stun: { now: true, name: '칼집 소리', desc: '그냥 발도에 맞은 괴이가 0.6초 굳는다.', kind: 'passive', branch: 'blade', tier: 2, ref: '하데스 포세이돈', rows: [{ when: 'onHit', if: [{ plainDraw: true }], do: 'status', with: { kind: 'stun', sec: 0.6 } }] },
  strike_refund: { now: true, name: '남은 진심', desc: '일섬 뒤 진심 게이지가 2칸 남는다.', kind: 'passive', branch: 'blade', tier: 3, ref: '데드 셀', rows: [{ when: 'onFocusStrike', do: 'gain', with: { res: 'focus', amount: 2 } }] },
  bare_extend: { now: true, name: '벗겨진 신문', desc: '검신 노출 중 맞힐 때마다 노출 +0.3초(최대 2배).', kind: 'passive', branch: 'blade', tier: 3, ref: '하데스 분노', rows: [{ when: 'onHit', if: [{ bare: true }], do: 'gain', with: { res: 'bare', amount: 0.3 } }] },
  salt_trail: { now: true, name: '소금 자국', desc: '돌진한 자리에 1.5초 소금, 도깨비불이 닿으면 사라진다.', kind: 'passive', branch: 'step', tier: 1, ref: 'RoR2 가솔린', rows: [{ when: 'onDashTick', do: 'zone', with: { kind: 'salt', radius: 0.6, sec: 1.5, spacing: 0.5 } }] },
  counter_dash: { now: true, name: '되받아 빠지기', desc: '받아치기에 성공하면 돌진이 바로 다시 찬다.', kind: 'passive', branch: 'step', tier: 1, ref: '데드 셀 회피', rows: [{ when: 'onCounter', do: 'gain', with: { res: 'dash', amount: 9 } }] },
  double_dash: { now: true, name: '두 번 돌진', desc: '돌진을 두 번까지 모아 둔다.', kind: 'passive', branch: 'step', tier: 2, ref: '하데스 거울', mods: [{ stat: 'dashCharges', op: 'add', value: 1 }], rows: [] },
  shadow_step: { now: true, name: '그림자 걸음', desc: '돌진 내내 맞지 않는다.', kind: 'passive', branch: 'step', tier: 2, ref: '메이플 다크 사이트', mods: [{ stat: 'dashIframes', op: 'add', value: 0.08 }], rows: [] },
  dodge_focus: { now: true, name: '스치기', desc: '돌진으로 공격을 흘리면 진심 게이지 2칸.', kind: 'passive', branch: 'step', tier: 3, ref: '베요네타 위치 타임', rows: [{ when: 'onDodge', do: 'gain', with: { res: 'focus', amount: 2 } }] },
  sprint: { now: true, name: '질주', desc: '공격 없이 1초 넘게 달리면 다음 공격까지 15% 빨라진다.', kind: 'passive', branch: 'step', tier: 3, ref: '하데스 헤르메스', rows: [{ when: 'onMove', if: [{ calm: 1 }], do: 'scale', with: { arg: 'mult', by: 1.15 } }] },
  ghost_eye: { now: true, name: '귀신 눈', desc: '화면 밖 강적이 가장자리 화살표로 보인다.', kind: 'passive', branch: 'eye', tier: 1, ref: '딥 락 스캐너', hud: 'ghostEye', rows: [] },
  spirit_eye: { now: true, name: '영력 눈', desc: '영력을 두 배 멀리서 끌어온다.', kind: 'passive', branch: 'eye', tier: 1, ref: '뱀서 어트랙토브', mods: [{ stat: 'magnet', op: 'mult', value: 2 }], rows: [] },
  steady_breath: { now: true, name: '숨 고르기', desc: '한 번도 안 맞고 층을 넘기면 체력 2.', kind: 'passive', branch: 'eye', tier: 2, ref: '하데스 아테나', rows: [{ when: 'onFloorEnd', if: [{ unhurt: true }], do: 'gain', with: { res: 'hp', amount: 2 } }] },
  grudge_eater: { now: true, name: '원한 먹기', desc: '강적을 쓰러뜨리면 체력 1.', kind: 'passive', branch: 'eye', tier: 2, ref: '데드 셀 강령술', rows: [{ when: 'onKill', if: [{ target: 'strong' }], do: 'gain', with: { res: 'hp', amount: 1 } }] },
  last_breath: { now: true, name: '마지막 숨', desc: '하룻밤 한 번, 쓰러질 공격을 체력 1로 버틴다.', kind: 'passive', branch: 'eye', tier: 3, ref: '하데스 죽음 저항', rows: [{ when: 'onLethal', if: [{ once: 'night' }], do: 'save', with: { hp: 1 } }] },
  greed: { now: true, name: '욕심', desc: '강적이 영력을 3 더 떨어뜨린다.', kind: 'passive', branch: 'eye', tier: 3, ref: '메이플 픽파킷', rows: [{ when: 'onKill', if: [{ target: 'strong' }], do: 'gain', with: { res: 'spirit', amount: 3 } }] },
  talisman: { now: true, name: '부적 던지기', desc: '조준 방향으로 부적. 처음 맞은 괴이에 피해와 1.5초 기절.', kind: 'active', cooldown: 6, ref: '메이플 표창', rows: [{ when: 'onCast', do: 'shot', with: { speed: 14, range: 8, mult: 2, stun: 1.5 } }] },
  barrier: { now: true, name: '결계 펴기', desc: '2초 무적 + 반지름 2칸 원, 원 안 도깨비불이 탄다.', kind: 'active', cooldown: 14, ref: '메이플 스모크 쉘', rows: [{ when: 'onCast', do: 'zone', with: { kind: 'barrier', radius: 2, sec: 2 } }] },
  salt_burst: { now: true, name: '소금 뿌리기', desc: '3.5칸 안 도깨비불 전부 정화, 강적 0.6초 굳음.', kind: 'active', cooldown: 10, ref: '하데스 데메테르', rows: [{ when: 'onCast', do: 'cleanse', with: { radius: 3.5 } }, { when: 'onCast', do: 'status', with: { kind: 'stun', sec: 0.6, radius: 3.5 } }] },

  // ===== 새 액티브 (L) =====
  shadow_double: { name: '그림자 분신', desc: '12초 동안 모든 타격이 60% 위력으로 한 번 더.', kind: 'active', cooldown: 30, ref: '메이플 섀도우 파트너', rows: [{ when: 'onCast', do: 'echo', with: { sec: 12, mult: 0.6 } }] },
  spirit_burst: { name: '영력 터뜨리기', desc: '4칸 안 바닥 영력을 전부 터뜨린다. 돈 대신 화력.', kind: 'active', cooldown: 8, ref: '메이플 메소 익스플로전', rows: [{ when: 'onCast', do: 'burst', with: { radius: 4, mult: 0.5 } }] },
  shrink_step: { name: '축지법', desc: '조준 방향 5칸 순간이동, 도착한 자리 주변을 벤다.', kind: 'active', cooldown: 7, ref: '메이플 텔레포트', rows: [{ when: 'onCast', do: 'blink', with: { range: 5 } }, { when: 'onCast', do: 'hit', with: { shape: 'around', range: 1.6, mult: 1.5, of: 'slash' } }] },
  chain_charm: { name: '연쇄 부적', desc: '조준 방향 부적이 맞은 괴이에서 셋까지 번개처럼 튄다.', kind: 'active', cooldown: 9, ref: '메이플 체인 라이트닝 · 하데스 제우스', rows: [{ when: 'onCast', do: 'shot', with: { speed: 16, range: 9, mult: 1.5, stun: 0.3 } }] },
  smoke: { name: '연막', desc: '3초 동안 반지름 2.5칸 안에서 맞지 않는다.', kind: 'active', cooldown: 18, ref: '메이플 스모크 쉘', rows: [{ when: 'onCast', do: 'zone', with: { kind: 'barrier', radius: 2.5, sec: 3 } }] },
  momentum_release: { name: '기세 해방', desc: '모은 기세를 한 번에: 기세당 베기 피해 ×0.8로 주변을 벤다.', kind: 'active', cooldown: 6, ref: '메이플 콤보 어택 마무리', rows: [{ when: 'onCast', do: 'spend', with: { key: 'momentum', shape: 'around', range: 2.2, multPerStack: 0.8 } }] },
  grudge_chain: { name: '원혼 사슬', desc: '주변 괴이에 표식, 표식 맞은 괴이를 다음에 때리면 베기 ×3.', kind: 'active', cooldown: 12, ref: '하데스 아레스 파멸', rows: [{ when: 'onCast', do: 'status', with: { kind: 'mark', sec: 6, radius: 3 } }, { when: 'onHit', if: [{ marked: true }], do: 'hit', with: { shape: 'target', range: 0, mult: 3, of: 'slash', consumeMark: true } }] },

  // ===== 새 패시브 =====
  final_blow: { name: '뒤따르는 칼', desc: '휘두를 때 25% 확률로 앞을 60% 위력으로 한 번 더.', kind: 'passive', branch: 'blade', tier: 4, ref: '메이플 파이널 어택', rows: [{ when: 'onSwing', if: [{ chance: 0.25 }], do: 'hit', with: { shape: 'front', range: 1.8, mult: 0.6, of: 'hit' } }] },
  momentum: { name: '기세', desc: '맞힐 때마다 기세 +1(최대 5), 기세당 베기 피해 +3%. 3초 안 때리면 사라짐.', kind: 'passive', branch: 'blade', tier: 4, ref: '메이플 콤보 어택', rows: [{ when: 'onHit', if: [{ attack: 'slash' }], do: 'stack', with: { key: 'momentum', add: 1, max: 5, decay: 3, stat: 'slash', per: 0.03 } }] },
  curse_cut: { name: '부정 타기', desc: '베기에 맞은 괴이가 부정 1스택(초당 1, 최대 3스택, 4초).', kind: 'passive', branch: 'blade', tier: 4, ref: '하데스 디오니소스', rows: [{ when: 'onHit', if: [{ attack: 'slash' }], do: 'status', with: { kind: 'curse', sec: 4, power: 1, max: 3 } }] },
  frost_salt: { name: '서리 소금', desc: '발도에 맞은 괴이가 2초 30% 느려진다.', kind: 'passive', branch: 'step', tier: 4, ref: '하데스 데메테르', rows: [{ when: 'onHit', if: [{ attack: 'draw' }], do: 'status', with: { kind: 'slow', sec: 2, power: 0.3 } }] },
  edge_dash: { name: '날 선 돌진', desc: '돌진이 닿는 괴이를 베기 30%로 벤다(0.2초마다).', kind: 'passive', branch: 'step', tier: 4, ref: '할로우 나이트 샤프 섀도', rows: [{ when: 'onDashTick', do: 'hit', with: { shape: 'around', range: 0.8, mult: 0.3, of: 'slash' }, cd: 0.2 }] },
  cliff_edge: { name: '벼랑 끝', desc: '체력이 1/4 아래면 주는 피해 ×1.3.', kind: 'passive', branch: 'eye', tier: 4, ref: '할로우 나이트 분노한 자의 분노', rows: [{ when: 'onBeforeAttack', if: [{ hpBelow: 0.25 }], do: 'scale', with: { arg: 'damage', by: 1.3 } }] },
  vengeance: { name: '복수', desc: '맞으면 3초 동안 베기 피해 ×1.2.', kind: 'passive', branch: 'eye', tier: 4, ref: '데드 셀 복수', rows: [{ when: 'onAfterHurt', do: 'buff', with: { stat: 'slash', op: 'mult', value: 1.2, sec: 3 } }] },
  grudge_pop: { name: '원혼 폭발', desc: '강적을 쓰러뜨리면 그 자리 1.5칸이 베기 ×1로 터진다.', kind: 'passive', branch: 'eye', tier: 4, ref: 'RoR2 윌오위스프', rows: [{ when: 'onKill', if: [{ target: 'strong' }], do: 'hit', with: { shape: 'chain', range: 1.5, mult: 1, of: 'slash', count: 3 } }] },
  pickpocket: { name: '영력 털기', desc: '맞힐 때 10% 확률로 영력 1이 튄다.', kind: 'passive', branch: 'eye', tier: 4, ref: '메이플 픽파킷', rows: [{ when: 'onHit', if: [{ chance: 0.1 }, { target: 'strong' }], do: 'gain', with: { res: 'spirit', amount: 1 } }] },
  iron_body: { name: '버티기', desc: '받는 피해 −20%, 대신 이동 −5%.', kind: 'passive', branch: 'step', tier: 4, ref: '메이플 파워 스탠스 · 아킬레스', mods: [{ stat: 'moveSpeed', op: 'mult', value: 0.95 }], rows: [{ when: 'onTakeDamage', do: 'scale', with: { arg: 'amount', by: 0.8 } }] },

  // ===== 강화형 패시브 (액티브 개조, 하이퍼 스킬식: 액티브마다 하나 고름) =====
  talisman_pierce: { name: '부적: 관통', desc: '부적이 괴이를 뚫고 끝까지 난다.', kind: 'upgrade', upgrades: 'talisman', ref: '메이플 하이퍼 엑스트라 타겟', rows: [] },
  talisman_triple: { name: '부적: 세 갈래', desc: '부적 세 장이 부채꼴로.', kind: 'upgrade', upgrades: 'talisman', ref: '메이플 트리플 스로우', rows: [{ when: 'onCast', do: 'shot', with: { speed: 14, range: 7, mult: 1.2, stun: 0.8, count: 2, spread: 0.6 } }] },
  talisman_quick: { name: '부적: 빠른 손', desc: '재사용 −30%.', kind: 'upgrade', upgrades: 'talisman', ref: '메이플 하이퍼 쿨타임 리듀스', rows: [] },
  barrier_wide: { name: '결계: 넓게', desc: '원 반지름 +1칸.', kind: 'upgrade', upgrades: 'barrier', ref: '메이플 하이퍼', rows: [] },
  barrier_heal: { name: '결계: 쉼터', desc: '결계를 펼 때 체력 2.', kind: 'upgrade', upgrades: 'barrier', ref: '메이플 홀리 심볼', rows: [{ when: 'onCast', do: 'gain', with: { res: 'hp', amount: 2 } }] },
  barrier_blast: { name: '결계: 터뜨리기', desc: '결계를 펼 때 주변을 베기 ×2로 밀어낸다.', kind: 'upgrade', upgrades: 'barrier', ref: '하데스 포세이돈', rows: [{ when: 'onCast', do: 'hit', with: { shape: 'around', range: 2, mult: 2, of: 'slash' } }] },
  salt_frost: { name: '소금: 얼음 소금', desc: '굳은 강적이 3초 느려진다.', kind: 'upgrade', upgrades: 'salt_burst', ref: '하데스 데메테르', rows: [{ when: 'onCast', do: 'status', with: { kind: 'slow', sec: 3, power: 0.4, radius: 3.5 } }] },
  salt_wide: { name: '소금: 한 줌 더', desc: '범위 +1.5칸.', kind: 'upgrade', upgrades: 'salt_burst', ref: '뱀서 캔들라브라도', rows: [{ when: 'onCast', do: 'cleanse', with: { radius: 5 } }] },
  salt_focus: { name: '소금: 정신 차리기', desc: '뿌리면 진심 게이지 2칸.', kind: 'upgrade', upgrades: 'salt_burst', ref: '데드 셀', rows: [{ when: 'onCast', do: 'gain', with: { res: 'focus', amount: 2 } }] },

  // ===== 유틸 (의뢰 목표·사무소 쪽) =====
  door_magnet: { name: '문턱 자석', desc: '층을 넘길 때 바닥 영력을 다 주워 간다.', kind: 'utility', branch: 'craft', ref: '뱀서 진공', rows: [] },
  shortcut_nose: { name: '지름길 냄새', desc: '모든 층 계단 쪽 화살표(지도 사본 상시판).', kind: 'utility', branch: 'craft', hud: 'mapCopy', ref: '딥 락 지형 스캐너', rows: [] },
  ward_hands: { name: '결계 솜씨', desc: '결계 의뢰의 원이 15% 빨리 찬다.', kind: 'utility', branch: 'craft', ref: '딥 락 미션 특화', rows: [] },
  escort_care: { name: '보살핌', desc: '구조 의뢰인 체력 +30%.', kind: 'utility', branch: 'craft', ref: '불가사의 던전', rows: [] },
  second_supply: { name: '보급 둘', desc: '보급품을 두 개 챙긴다.', kind: 'utility', branch: 'craft', ref: '다키스트 던전 보급', rows: [] },

  // ===== 듀오 (두 기술이 켜져 있으면 열림) =====
  duo_salt_frost_trail: { name: '서리 자국', desc: '소금 자국을 밟은 괴이가 느려진다.', kind: 'duo', requires: ['salt_trail', 'frost_salt'], ref: '하데스 듀오 축복', rows: [{ when: 'onDashTick', do: 'status', with: { kind: 'slow', sec: 1.5, power: 0.3, radius: 1 }, cd: 0.3 }] },
  duo_momentum_echo: { name: '기세의 그림자', desc: '기세 5스택이면 맞힐 때 그림자가 한 번 더(30%).', kind: 'duo', requires: ['momentum', 'final_blow'], ref: '하데스 듀오 축복', rows: [{ when: 'onHit', if: [{ stacks: { key: 'momentum', atLeast: 5 } }], do: 'hit', with: { shape: 'target', range: 0, mult: 0.3, of: 'hit' } }] },
  duo_curse_pop: { name: '부정 터짐', desc: '부정 걸린 괴이를 쓰러뜨리면 주변으로 부정이 옮는다.', kind: 'duo', requires: ['curse_cut', 'grudge_pop'], ref: '하데스 듀오 축복', rows: [{ when: 'onKill', do: 'status', with: { kind: 'curse', sec: 4, power: 1, max: 3, radius: 2 } }] },
};
