import { CARDS } from '../../data/cards.data';
import { EXORCISTS } from '../../data/protagonist.data';
import { DUOS, PASSIVES, type StatMod } from '../../data/skills.data';
import type { GearMod } from '../gear';
import { TRAINING } from '../../data/training.data';
import { WEAPONS } from '../../data/weapons.data';
import { DUNGEON } from '../../data/dungeon.data';
import type { CardId, ExorcistId, PerkId, TrainingId, WeaponId } from '../../types/ids';
import type { Stats } from '../rift';

export type TrainingLevels = Partial<Record<TrainingId, number>>;

function apply(s: Stats, m: StatMod): void {
  s[m.stat] = m.op === 'add' ? s[m.stat] + m.value : s[m.stat] * m.value;
}

// Final stats are always derived, never stored (Rule 7):
// exorcist + weapon base → training (permanent) → passive skills → 장신구 → cards (this night).
export function computeExorcistStats(
  exorcist: ExorcistId,
  training: TrainingLevels,
  cards: readonly CardId[],
  weapon: WeaponId,
  perks: readonly PerkId[] = [],
  gear: readonly GearMod[] = [],
): Stats {
  const base = EXORCISTS[exorcist];
  const w = WEAPONS[weapon];
  const s: Stats = {
    maxHp: base.maxHp,
    slash: w.slash,
    drawSlash: w.drawSlash,
    draw: w.draw,
    focusMax: w.focusMax,
    bareTime: w.bareTime,
    bareSlashBonus: w.bareSlashBonus,
    comboEvery: w.comboEvery,
    comboBonus: w.comboBonus,
    reach: w.reach,
    swingTime: w.swingTime,
    finisherRecovery: w.finisherRecovery,
    drawCooldown: w.drawCooldown,
    parryWindow: w.parryWindow,
    moveSpeed: base.moveSpeed,
    dashSpeed: base.dashSpeed,
    dashTime: base.dashTime,
    dashIframes: base.dashIframes,
    dashCooldown: base.dashCooldown,
    dashCharges: 1,
    hurtIframes: base.hurtIframes,
    magnet: DUNGEON.pickupMagnet,
    strongDamage: 0, fodderDamage: 0, bossDamage: 0, critChance: 0, critDamage: 0, attackMove: 0, damageTaken: 0, darkResist: 0,
    healMult: 0, focusGain: 0, spiritGain: 0, shardChance: 0, feeBonus: 0, wardSpeed: 0, survivorHp: 0, trainTime: 0,
  };
  for (const id of Object.keys(training) as TrainingId[]) {
    const rank = training[id] ?? 0;
    const line = TRAINING[id];
    if (!line || rank <= 0) continue;
    const r = Math.min(rank, line.max);
    for (const stat of line.stats) s[stat] = line.op === 'add' ? s[stat] + line.per * r : s[stat] * (1 + line.per * r);
  }
  for (const id of perks) {
    const p = PASSIVES[id as keyof typeof PASSIVES] ?? DUOS[id as keyof typeof DUOS];
    if (p) p.mods.forEach((m) => apply(s, m));
  }
  // 장신구: a 'mult' option is a fraction (+0.04 = ×1.04), an 'add' one is added.
  for (const m of gear) s[m.stat] = m.op === 'mult' ? s[m.stat] * (1 + m.value) : s[m.stat] + m.value;
  s.dashIframes = Math.min(s.dashIframes, s.dashTime);
  for (const id of cards) {
    const c = CARDS[id];
    s.maxHp += c.maxHp;
    s.slash += c.slash;
    s.drawSlash += c.draw; // 발도 cards raise every 발도, so the damage order holds
    s.draw += c.draw;
    s.focusMax = Math.max(1, s.focusMax + c.focusMax);
    s.bareTime += c.bareTime;
    s.comboBonus += c.comboBonus;
  }
  s.maxHp = Math.round(s.maxHp);
  s.focusMax = Math.max(1, Math.round(s.focusMax));
  return s;
}
