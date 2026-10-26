import { t } from '../../i18n';
import type { LastRun } from '../../store/gameStore';

export function outcomeLabel(last: LastRun): string {
  return t(`result.${last.result.outcome}`);
}
