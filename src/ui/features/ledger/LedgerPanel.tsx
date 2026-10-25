import { useSyncExternalStore } from 'react';
import { store } from '../../../app/services';
import { t } from '../../../i18n';
import { outcomeLabel } from '../lastRun';
import { panelCss as css } from '../panel';

// The bookkeeper's books: money, trauma, record, last night. (Rent and the contract board come later.)
export function LedgerPanel() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  return (
    <>
      <div style={{ fontSize: 15 }}>“{t('feature.ledger.line')}”</div>
      <div style={css.box}>
        <div style={css.row}><span>{t('day.money')}</span><span>{s.money}</span></div>
        <div style={css.row}><span>{t('day.trauma')}</span><span>{s.trauma}</span></div>
        <div style={css.row}><span>{t('day.runs')}</span><span>{s.solved}</span></div>
      </div>
      {s.lastRun && (
        <div style={css.box}>
          <div style={{ ...css.row, ...css.dim }}>{t('day.lastResult')}</div>
          <div style={css.row}><span>{outcomeLabel(s.lastRun)}</span><span>+{s.lastRun.settlement.moneyDelta}</span></div>
        </div>
      )}
    </>
  );
}
