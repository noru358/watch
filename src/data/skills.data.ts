import type { TKey } from '../i18n';
import type { ActiveId, PassiveId, SkillBranch, SkillSlotId } from '../types/ids';
import type { Stats } from '../systems/rift';

// 기술 (docs/rules/growth.md): bought with 심연 파편, not money.
// Passives: 3 branches × 3 tiers; each slot has an A and a B side and only one is on at a time
// (swap freely in the office — Hades' Mirror of Night). Opening a slot costs shards once; tier N
// needs tier N-1 of the same branch. Stat-only parts live here; behaviour is in registry/perkEffects.ts.
// Actives: one equipped on the L key (the 4th combat button, ARCHITECTURE Rule 4), each with a cooldown.

export type StatMod = { stat: keyof Stats; op: 'add' | 'mult'; value: number };

export interface PassiveData {
  nameKey: TKey;
  descKey: TKey;
  mods: readonly StatMod[];
  amount: number; // behaviour parameter (meaning per passive, see perkEffects.ts)
  time: number;
}

const P = (id: string, amount = 0, time = 0, mods: readonly StatMod[] = []): PassiveData => ({
  nameKey: `skill.${id}.name` as TKey,
  descKey: `skill.${id}.desc` as TKey,
  mods,
  amount,
  time,
});

export const PASSIVES: Record<PassiveId, PassiveData> = {
  // 검 — how hits land
  dash_cut: P('dash_cut', 1), // a small cut at the end of every dash (× slash)
  finisher_wave: P('finisher_wave', 0.5, 0, []), // the combo finisher also hits a ring around (× damage), +1 tile
  counter_focus: P('counter_focus', 2), // a counter fills the focus gauge by 2
  draw_stun: P('draw_stun', 0, 0.6), // the plain 발도 stuns what it cuts
  strike_refund: P('strike_refund', 2), // a focus strike leaves 2 focus behind
  bare_extend: P('bare_extend', 0, 0.3), // each hit with the bared blade keeps it bare a little longer
  // 발 — how the director moves
  salt_trail: P('salt_trail', 0, 1.5), // a dash leaves salt; wisps that touch it vanish
  counter_dash: P('counter_dash'), // a counter refills the dash
  double_dash: P('double_dash', 0, 0, [{ stat: 'dashCharges', op: 'add', value: 1 }]),
  shadow_step: P('shadow_step', 0, 0, [{ stat: 'dashIframes', op: 'add', value: 0.08 }]), // the whole dash is untouchable
  dodge_focus: P('dodge_focus', 2), // a hit dodged by dashing fills focus by 2
  sprint: P('sprint', 0.15, 1), // after 1 s of moving without attacking, +15 % speed until the next attack
  // 눈 — what the director notices
  ghost_eye: P('ghost_eye'), // strong ghosts off screen are marked on the screen edge
  spirit_eye: P('spirit_eye', 0, 0, [{ stat: 'magnet', op: 'mult', value: 2 }]),
  steady_breath: P('steady_breath', 2), // leaving a floor without being hurt on it heals 2
  grudge_eater: P('grudge_eater', 1), // killing a strong ghost heals 1
  last_breath: P('last_breath', 1), // once a night, a lethal hit leaves 1 HP
  greed: P('greed', 3), // strong ghosts drop 3 more spirit
};

export const SKILL_BRANCHES: readonly SkillBranch[] = ['blade', 'step', 'eye'];

// Which two passives sit in each slot, and what opening the slot costs (shards).
export const SKILL_SLOTS: Record<SkillSlotId, { a: PassiveId; b: PassiveId; cost: number }> = {
  blade1: { a: 'dash_cut', b: 'finisher_wave', cost: 1 },
  blade2: { a: 'counter_focus', b: 'draw_stun', cost: 2 },
  blade3: { a: 'strike_refund', b: 'bare_extend', cost: 3 },
  step1: { a: 'salt_trail', b: 'counter_dash', cost: 1 },
  step2: { a: 'double_dash', b: 'shadow_step', cost: 2 },
  step3: { a: 'dodge_focus', b: 'sprint', cost: 3 },
  eye1: { a: 'ghost_eye', b: 'spirit_eye', cost: 1 },
  eye2: { a: 'steady_breath', b: 'grudge_eater', cost: 2 },
  eye3: { a: 'last_breath', b: 'greed', cost: 3 },
};

export interface ActiveData {
  nameKey: TKey;
  descKey: TKey;
  cost: number; // shards to learn
  cooldown: number; // seconds
  damage: number;
  range: number; // tiles
  stun: number; // seconds
  time: number; // seconds (barrier length)
  speed: number; // tiles / s (talisman flight)
}

export const ACTIVES: Record<ActiveId, ActiveData> = {
  // 부적 던지기: a paper charm flies along the aim and sticks to the first ghost (damage + stun).
  talisman: { nameKey: 'active.talisman.name', descKey: 'active.talisman.desc', cost: 2, cooldown: 6, damage: 4, range: 8, stun: 1.5, time: 0, speed: 14 },
  // 결계 펴기: a circle on the floor; for its time nothing hurts the director and wisps inside burn away.
  barrier: { nameKey: 'active.barrier.name', descKey: 'active.barrier.desc', cost: 2, cooldown: 14, damage: 0, range: 2, stun: 0, time: 2, speed: 0 },
  // 소금 뿌리기: every wisp around vanishes, strong ghosts flinch.
  salt_burst: { nameKey: 'active.salt_burst.name', descKey: 'active.salt_burst.desc', cost: 2, cooldown: 10, damage: 0, range: 3.5, stun: 0.6, time: 0, speed: 0 },
};
