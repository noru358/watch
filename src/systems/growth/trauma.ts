import { FACILITY_EFFECTS } from '../../data/facilities.data';
import { TRAUMA } from '../../data/penalties.data';
import type { GrowthState } from './types';

export interface TraumaEffects {
  cardOffer: number; // cards shown after each floor
  hpPenalty: number; // max HP lost for the night (the night starts that much lower)
  grounded: boolean; // too shaken to go out tonight
}

export function traumaEffects(trauma: number): TraumaEffects {
  const t = TRAUMA;
  return {
    cardOffer: trauma >= t.fewerCardsAt ? t.fewerCards : t.cards,
    hpPenalty: trauma >= t.weakAt ? t.weakHp : 0,
    grounded: trauma >= t.groundedAt,
  };
}

// 휴식하기: how much one day on the sofa takes off.
export function restAmount(g: Pick<GrowthState, 'facilities'>): number {
  return TRAUMA.rest + g.facilities.sofa * FACILITY_EFFECTS.sofa.restPerLevel;
}

// 자본 치료: money for trauma, the night stays open.
export function capitalTherapy(g: GrowthState): boolean {
  if (g.trauma <= 0 || g.money < TRAUMA.capitalCost) return false;
  g.money -= TRAUMA.capitalCost;
  g.trauma = Math.max(0, g.trauma - TRAUMA.capitalAmount);
  return true;
}
