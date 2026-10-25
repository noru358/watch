import { CARDS } from '../../data/cards.data';
import { EXORCISTS } from '../../data/protagonist.data';
import { WEAPONS } from '../../data/weapons.data';
import type { CardId, ExorcistId, WeaponId } from '../../types/ids';
import type { Stats } from '../rift';

// Final stats are always derived, never stored (Rule 7).
export function computeExorcistStats(exorcist: ExorcistId, level: number, cards: readonly CardId[], weapon: WeaponId): Stats {
  const base = EXORCISTS[exorcist];
  const w = WEAPONS[weapon];
  const s: Stats = {
    maxHp: base.maxHp + base.levelHpBonus * Math.max(0, level - 1),
    slash: w.slash,
    drawSlash: w.drawSlash,
    draw: w.draw,
    focusMax: w.focusMax,
    bareTime: w.bareTime,
    bareSlashBonus: w.bareSlashBonus,
    comboEvery: w.comboEvery,
    comboBonus: w.comboBonus,
  };
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
  return s;
}
