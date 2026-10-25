import type { CardId, CardSource } from '../types/ids';

// 강화 카드: picked one of three after each floor. Numbers here; behaviour in registry/cardEffects.ts.
export interface CardData {
  source: CardSource; // which deck the card belongs to
  maxHp: number;
  heal: number;
  slash: number;
  draw: number;
  focusMax: number; // negative = gauge fills sooner
  bareTurns: number;
  comboBonus: number;
  chance: number;
  amount: number;
}

const NONE = { maxHp: 0, heal: 0, slash: 0, draw: 0, focusMax: 0, bareTurns: 0, comboBonus: 0, chance: 0, amount: 0 };

export const CARDS: Record<CardId, CardData> = {
  // Base deck
  tough: { ...NONE, source: 'base', maxHp: 4, heal: 4 },
  medicine: { ...NONE, source: 'base', heal: 8 },
  salt_ward: { ...NONE, source: 'base', amount: 1 }, // shield charges on floor enter
  grudge_drain: { ...NONE, source: 'base', chance: 0.35, amount: 1 }, // heal on kill
  spirit_nose: { ...NONE, source: 'base', amount: 2 }, // extra spirit per kill
  // Weapon deck: 신문지 사인검
  double_newspaper: { ...NONE, source: 'newspaper_sword', slash: 1 },
  blue_lightning: { ...NONE, source: 'newspaper_sword', draw: 4 },
  lazy_but_serious: { ...NONE, source: 'newspaper_sword', focusMax: -1 },
  torn_paper: { ...NONE, source: 'newspaper_sword', bareTurns: 2 },
  third_strike: { ...NONE, source: 'newspaper_sword', comboBonus: 2 },
};

export const CARD_OFFER_COUNT = 3;
