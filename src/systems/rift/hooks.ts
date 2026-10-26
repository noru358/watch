import { CARDS } from '../../data/cards.data';
import { CARD_HOOKS } from '../../registry/cardEffects';
import type { HookArgs, HookName } from '../../registry/hookPoints';
import { PERK_HOOKS, perkData } from '../../registry/perkEffects';
import type { Floor } from './types';

// Calls the given hook for every card the director holds (pickup order), then every perk
// (passive skills, then the supply).
export function runHooks<K extends HookName>(f: Floor, hook: K, args: HookArgs[K]): void {
  for (const id of f.cards) {
    const fn = CARD_HOOKS[id][hook];
    if (fn) fn(f, CARDS[id], args);
  }
  for (const id of f.perks) {
    const fn = PERK_HOOKS[id][hook];
    if (fn) fn(f, perkData(id), args);
  }
}

export const runCardHooks = runHooks;
