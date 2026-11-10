import { affixOf } from '../../data/affixes.data';
import type { Enemy } from './types';

// Puts a word's effect on a ghost (affixes.data.ts): a named target's first word, a mid-boss's two
// words, or a deep floor's ordinary strong ghost. False when the word has no effect.
export function applyAffix(e: Enemy, word: number | undefined): boolean {
  const a = affixOf(word);
  if (!a) return false;
  e.maxHp = Math.round(e.maxHp * a.hpMult);
  e.hp = e.maxHp;
  e.damageAdd += a.damageAdd;
  e.speedMult *= a.speedMult;
  e.windupMult *= a.windupMult;
  e.reachMult *= a.reachMult;
  if (a.trait && !e.traits.some((t) => t.part === a.trait!.part)) e.traits = [...e.traits, a.trait];
  return true;
}
