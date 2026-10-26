import { CARDS } from '../../data/cards.data';
import { EXORCISTS } from '../../data/protagonist.data';
import { PASSIVES, type StatMod } from '../../data/skills.data';
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
// exorcist + weapon base → training (permanent) → passive skills → cards (this night).
export function computeExorcistStats(
  exorcist: ExorcistId,
  training: TrainingLevels,
  cards: readonly CardId[],
  weapon: WeaponId,
  perks: readonly PerkId[] = [],
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
  };
  for (const id of Object.keys(training) as TrainingId[]) {
    const rank = training[id] ?? 0;
    const line = TRAINING[id];
    if (!line || rank <= 0) continue;
    const r = Math.min(rank, line.max);
    for (const stat of line.stats) s[stat] = line.op === 'add' ? s[stat] + line.per * r : s[stat] * (1 + line.per * r);
  }
  for (const id of perks) {
    const p = PASSIVES[id as keyof typeof PASSIVES];
    if (p) p.mods.forEach((m) => apply(s, m));
  }
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
