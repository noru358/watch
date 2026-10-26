import { t, type TKey } from '../i18n';
import type { OfferTarget } from '../systems/office';

// "붉은 댕기" — a 현상수배 / 추격 target's name from the two tables.
export function targetName(target: OfferTarget | null): string | null {
  if (!target) return null;
  return `${t(`wanted.pre.${target.name[0]}` as TKey)} ${t(`wanted.suf.${target.name[1]}` as TKey)}`;
}
