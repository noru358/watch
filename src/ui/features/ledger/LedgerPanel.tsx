import { useSyncExternalStore } from 'react';
import { store } from '../../../app/services';
import { NODES } from '../../../data/nodes.data';
import { OFFICE } from '../../../data/office.data';
import { t } from '../../../i18n';
import type { MorningReport } from '../../../systems/office';
import { outcomeLabel } from '../lastRun';
import { panelCss as css } from '../panel';

// What the bookkeeper says this morning (rent, the city, expired offers).
function morningLines(m: MorningReport | null): string[] {
  if (!m) return [t('morning.quiet')];
  const lines: string[] = [];
  if (m.rentDue && m.debtAdded > 0) lines.push(t('morning.rentShort', { short: m.debtAdded }));
  else if (m.rentDue) lines.push(t('morning.rentPaid', { paid: m.rentPaid }));
  if (m.worsened.length > 0) lines.push(t('morning.worse', { nodes: m.worsened.map((id) => t(NODES[id].nameKey)).join(', ') }));
  if (m.expired > 0) lines.push(t('morning.expired', { count: m.expired }));
  return lines.length > 0 ? lines : [t('morning.quiet')];
}

// The bookkeeper's books: the day, rent and debt, money, trauma, record, last night.
export function LedgerPanel() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const rentIn = OFFICE.rentEvery - (s.day % OFFICE.rentEvery);
  return (
    <>
      <div style={{ fontSize: 15 }}>“{t('feature.ledger.line')} {morningLines(s.lastMorning).join(' ')}”</div>
      <div style={css.box}>
        <div style={css.row}><span>{t('ledger.day')}</span><span>{t('board.day', { day: s.day })}</span></div>
        <div style={css.row}><span>{t('ledger.rent')}</span><span>{t('ledger.rentDue', { rent: OFFICE.rent, days: rentIn })}</span></div>
        {s.debt > 0 && <div style={{ ...css.row, color: '#ff5d7a' }}><span>{t('ledger.debt')}</span><span>{s.debt}</span></div>}
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
