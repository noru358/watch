import { t } from '../../i18n';
import type { LastRun } from '../../store/gameStore';

export function outcomeLabel(last: LastRun): string {
  const o = last.result.outcome;
  return o === 'success' ? t('result.success') : o === 'extracted' ? t('result.extracted') : t('result.died');
}
