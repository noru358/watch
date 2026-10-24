import { en } from './en';
import { ko, type TKey } from './ko';

export type Locale = 'ko' | 'en';
export type { TKey };

const TABLES: Record<Locale, Record<TKey, string>> = { ko, en };
let locale: Locale = 'ko';

export function setLocale(next: Locale): void {
  locale = next;
}

// t('hud.room', { current: 1, total: 7 }) → '방 1/7'
export function t(key: TKey, params?: Record<string, string | number>): string {
  let text = TABLES[locale][key];
  if (params) {
    for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}
