import { CARDS } from '../../data/cards.data';
import { ACTIVES, DUOS, PASSIVES, UPGRADES } from '../../data/skills.data';
import { SUPPLIES } from '../../data/facilities.data';
import { CARD_HOOKS } from '../../registry/cardEffects';
import { runEffects, type EffectRow, type EffectSource } from '../../registry/effects';
import type { HookArgs, HookName } from '../../registry/hookPoints';
import type { ActiveId, PerkId, UpgradeId } from '../../types/ids';
import type { Floor } from './types';

// The 효과 부품 rows a perk id carries (passive skill, duo, or supply).
export function perkRows(id: PerkId): readonly EffectRow[] {
  if (id in PASSIVES) return PASSIVES[id as keyof typeof PASSIVES].rows;
  if (id in DUOS) return DUOS[id as keyof typeof DUOS].rows;
  return SUPPLIES[id as keyof typeof SUPPLIES].rows;
}

// What a perk draws on the HUD (ghost eye, stairs arrow), if anything.
export function perkHud(id: PerkId): 'ghostEye' | 'mapFirst' | 'mapAll' | undefined {
  if (id in PASSIVES) return PASSIVES[id as keyof typeof PASSIVES].hud;
  if (id in SUPPLIES) return SUPPLIES[id as keyof typeof SUPPLIES].hud;
  return undefined;
}

// The active on L with its 개조 folded in: extra rows, a wider radius, piercing shots.
export function activeSource(active: ActiveId, upgrade: UpgradeId | null): EffectSource {
  const u = upgrade && UPGRADES[upgrade].of === active ? UPGRADES[upgrade] : null;
  const rows = ACTIVES[active].rows.map((r): EffectRow => {
    if (!u) return r;
    if (r.do === 'zone' && u.patch.radiusAdd) return { ...r, with: { ...r.with, radius: r.with.radius + u.patch.radiusAdd } };
    if (r.do === 'cleanse' && u.patch.radiusAdd) return { ...r, with: { radius: r.with.radius + u.patch.radiusAdd } };
    if (r.do === 'shot' && u.patch.pierce) return { ...r, with: { ...r.with, pierce: true } };
    return r;
  });
  return { id: active, rows: [...rows, ...(u ? u.rows : [])] };
}

const sourcesCache = new WeakMap<Floor, EffectSource[]>();
function sourcesOf(f: Floor): EffectSource[] {
  let s = sourcesCache.get(f);
  if (!s) {
    s = f.perks.map((id) => ({ id, rows: perkRows(id) }));
    if (f.active) s.push(activeSource(f.active, f.upgrade));
    if (f.gearRows.length > 0) s.push({ id: 'gear', rows: f.gearRows });
    sourcesCache.set(f, s);
  }
  return s;
}

// Calls the given hook for every card the director holds (pickup order), then every 효과 부품 row
// the night carries: passive skills, duos, the supply, the active (and its 개조), 장신구 specials.
export function runHooks<K extends HookName>(f: Floor, hook: K, args: HookArgs[K]): void {
  for (const id of f.cards) {
    const fn = CARD_HOOKS[id][hook];
    if (fn) fn(f, CARDS[id], args);
  }
  runEffects(f, hook, args, sourcesOf(f));
}

export const runCardHooks = runHooks;
