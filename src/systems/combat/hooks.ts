import { TRAITS } from '../../data/traits.data';
import { TRAIT_HOOKS, type TraitHookArgs, type TraitHookName } from '../../registry/traitHooks';
import type { World } from './types';

// Calls the given hook for every trait the director holds, in pickup order.
export function runTraitHooks<K extends TraitHookName>(world: World, hook: K, args: TraitHookArgs[K]): void {
  for (const id of world.traits) {
    const fn = TRAIT_HOOKS[id][hook];
    if (fn) fn(world, TRAITS[id], args);
  }
}
