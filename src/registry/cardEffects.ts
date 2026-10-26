import type { CardData } from '../data/cards.data';
import type { CardId } from '../types/ids';
import type { Floor } from '../systems/rift';
import type { HookArgs, HookName } from './hookPoints';

// Hook points are shared with perks (hookPoints.ts).
export type CardHookArgs = HookArgs;
export type CardHookName = HookName;

type Hook<K extends CardHookName> = (f: Floor, data: CardData, args: CardHookArgs[K]) => void;
export type CardHooks = { [K in CardHookName]?: Hook<K> };

export function heal(f: Floor, amount: number): void {
  const p = f.player;
  const healed = Math.min(amount, f.stats.maxHp - p.hp);
  if (healed <= 0) return;
  p.hp += healed;
  f.events.push({ type: 'playerHealed', x: p.x, y: p.y, amount: healed });
}

// Behaviour of 강화 카드 by ID. Stat-only cards are handled by computeExorcistStats.
export const CARD_HOOKS: Record<CardId, CardHooks> = {
  tough: {},
  medicine: {}, // heal is applied when picked (systems/run)
  salt_ward: {
    onRoomEnter(f, data) {
      f.player.shield = data.amount;
    },
    onTakeDamage(f, _data, dmg) {
      const p = f.player;
      if (p.shield <= 0 || dmg.amount <= 0) return;
      p.shield -= 1;
      dmg.amount = 0;
      f.events.push({ type: 'shieldBlocked', x: p.x, y: p.y });
    },
  },
  grudge_drain: {
    onKill(f, data, { rng }) {
      if (rng.chance(data.chance)) heal(f, data.amount);
    },
  },
  spirit_nose: {
    onKill(f, data) {
      f.loot += data.amount;
    },
  },
  double_newspaper: {},
  blue_lightning: {},
  lazy_but_serious: {},
  torn_paper: {},
  third_strike: {},
};
