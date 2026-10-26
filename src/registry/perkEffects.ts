import { PASSIVES } from '../data/skills.data';
import { SUPPLIES } from '../data/facilities.data';
import type { PerkId } from '../types/ids';
import { cutAround, isStrong, stunEnemy, type Floor } from '../systems/rift';
import { heal } from './cardEffects';
import type { HookArgs, HookName } from './hookPoints';

// Behaviour of passive skills (기술) and supplies (보급품) by ID, on the same hook points as cards.
// Stat-only parts (double dash, shadow step, spirit eye) are in skills.data.ts `mods` and
// computeExorcistStats; HUD-only ones (ghost eye, map copy) are read by RiftHud.
export interface PerkData {
  amount: number;
  time: number;
}

type Hook<K extends HookName> = (f: Floor, data: PerkData, args: HookArgs[K]) => void;
export type PerkHooks = { [K in HookName]?: Hook<K> };

export function perkData(id: PerkId): PerkData {
  return id in PASSIVES ? PASSIVES[id as keyof typeof PASSIVES] : { amount: SUPPLIES[id as keyof typeof SUPPLIES].amount, time: 0 };
}

const once = (f: Floor, id: PerkId): boolean => {
  if (f.used.includes(id)) return false;
  f.used.push(id);
  return true;
};

const addFocus = (f: Floor, n: number) => (f.player.focus = Math.min(f.stats.focusMax, f.player.focus + n));

export const PERK_HOOKS: Record<PerkId, PerkHooks> = {
  // 검
  // Cuts toward where the dash went (not the mouse), and shows a swing so it reads as an attack.
  dash_cut: {
    onDashEnd(f, d, { rng }) {
      const p = f.player;
      const dir = Math.atan2(p.dashY, p.dashX);
      p.aim = dir;
      p.swingFx = 0;
      f.events.push({ type: 'slash', x: p.x, y: p.y });
      cutAround(f, rng, f.stats.reach + 0.3, 2.2, dir, f.stats.slash * d.amount, 'slash');
    },
  },
  finisher_wave: {
    onSwing(f, d, { heavy, damage, rng }) {
      if (heavy) cutAround(f, rng, f.stats.reach + 1, Math.PI * 2, 0, damage * d.amount);
    },
  },
  counter_focus: {
    onCounter(f, d) {
      addFocus(f, d.amount);
    },
  },
  draw_stun: {
    onHit(f, d, { enemy, kind }) {
      if (kind === 'draw' && f.player.drawKind === 'slash') stunEnemy(enemy, d.time);
    },
  },
  strike_refund: {
    onFocusStrike(f, d) {
      f.player.focus = Math.min(f.stats.focusMax, d.amount);
    },
  },
  bare_extend: {
    onHit(f, d) {
      if (f.player.bare > 0) f.player.bare = Math.min(f.stats.bareTime * 2, f.player.bare + d.time);
    },
  },
  // 발
  salt_trail: {
    onDashTick(f, d) {
      const p = f.player;
      const last = f.zones[f.zones.length - 1];
      if (last && last.kind === 'salt' && Math.hypot(last.x - p.x, last.y - p.y) < 0.5) return;
      f.zones.push({ kind: 'salt', x: p.x, y: p.y, r: 0.6, t: d.time });
    },
  },
  counter_dash: {
    onCounter(f) {
      f.player.dashCharges = f.stats.dashCharges;
      f.player.dashCd = 0;
    },
  },
  double_dash: {},
  shadow_step: {},
  dodge_focus: {
    onDodge(f, d) {
      addFocus(f, d.amount);
    },
  },
  sprint: {
    onMove(f, d, m) {
      const p = f.player;
      p.calmT = m.attacking || !m.moving ? 0 : p.calmT + m.dt;
      if (p.calmT >= d.time) m.mult *= 1 + d.amount;
    },
  },
  // 눈
  ghost_eye: {},
  spirit_eye: {},
  steady_breath: {
    onFloorEnd(f, d) {
      if (!f.player.hurtOnFloor) heal(f, d.amount);
    },
  },
  grudge_eater: {
    onKill(f, d, { enemy }) {
      if (isStrong(enemy)) heal(f, d.amount);
    },
  },
  last_breath: {
    onLethal(f, _d, args) {
      if (!args.prevent && once(f, 'last_breath')) args.prevent = true;
    },
  },
  greed: {
    onKill(f, d, { enemy }) {
      if (isStrong(enemy)) f.pickups.push({ x: enemy.x + 0.3, y: enemy.y, value: d.amount });
    },
  },
  // 보급품
  salt_pack: {
    onRoomEnter(f, d) {
      if (f.index === 0) f.player.shield = Math.max(f.player.shield, d.amount);
    },
  },
  bacchus: {
    onAfterHurt(f, d) {
      if (f.player.hp > 0 && f.player.hp < f.stats.maxHp / 2 && once(f, 'bacchus')) heal(f, d.amount);
    },
  },
  map_copy: {},
};
