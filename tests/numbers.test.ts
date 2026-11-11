// Every number shown goes through num(): money as ₩ with thousands separators, in t() params too.
import { describe, expect, it } from 'vitest';
import { num, t, won } from '../src/i18n';

describe('numbers on screen', () => {
  it('groups thousands and marks money', () => {
    expect(num(9992838)).toBe('9,992,838');
    expect(num(450)).toBe('450');
    expect(won(9992838)).toBe('₩9,992,838');
    expect(won(0)).toBe('₩0');
  });

  it('t() formats number params the same way, strings untouched', () => {
    expect(t('training.money', { money: 1234567 })).toBe('잔고 ₩1,234,567');
    expect(t('training.money', { money: '1234567' })).toBe('잔고 ₩1234567');
  });
});
