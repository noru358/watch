import { CARDS } from '../../data/cards.data';
import { CARD_HOOKS, type CardHookArgs, type CardHookName } from '../../registry/cardEffects';
import type { Floor } from './types';

// Calls the given hook for every card the director holds, in pickup order.
export function runCardHooks<K extends CardHookName>(f: Floor, hook: K, args: CardHookArgs[K]): void {
  for (const id of f.cards) {
    const fn = CARD_HOOKS[id][hook];
    if (fn) fn(f, CARDS[id], args);
  }
}
