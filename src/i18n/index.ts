import { en } from './en';
import { ko, type TKey } from './ko';

export type Locale = 'ko' | 'en';
export type { TKey };

const TABLES: Record<Locale, Record<TKey, string>> = { ko, en };
let locale: Locale = 'ko';

export function setLocale(next: Locale): void {
  locale = next;
}

// Every key of a numbered table ('wanted.pre.' → wanted.pre.0, .1, …) in order. A table grows by
// adding lines to ko.ts / en.ts; nothing else counts them.
export function keysWith(prefix: string): TKey[] {
  const out: TKey[] = [];
  for (let i = 0; `${prefix}${i}` in ko; i++) out.push(`${prefix}${i}` as TKey);
  return out;
}

// t('hud.room', { current: 1, total: 7 }) → '방 1/7'
export function t(key: TKey, params?: Record<string, string | number>): string {
  let text = TABLES[locale][key];
  if (params) {
    for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}
