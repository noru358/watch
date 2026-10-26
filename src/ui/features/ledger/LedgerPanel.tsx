import { useSyncExternalStore } from 'react';
import { store } from '../../../app/services';
import { NODES } from '../../../data/nodes.data';
import { OFFICE } from '../../../data/office.data';
import { t } from '../../../i18n';
import type { MorningReport } from '../../../systems/office';
import { FACILITIES, FACILITY_IDS } from '../../../data/facilities.data';
import { facilityPrice } from '../../../systems/growth';
import { outcomeLabel } from '../lastRun';
import { panelCss as css } from '../panel';
import { priceStyle, rowStyle, useNav } from '../useNav';

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
        <div style={css.row}><span>{t('ledger.shards')}</span><span>{s.shards}</span></div>
        <div style={css.row}><span>{t('day.runs')}</span><span>{s.solved}</span></div>
      </div>
      <Facilities />
      {s.lastRun && (
        <div style={css.box}>
          <div style={{ ...css.row, ...css.dim }}>{t('day.lastResult')}</div>
          <div style={css.row}><span>{outcomeLabel(s.lastRun)}</span><span>+{s.lastRun.settlement.moneyDelta}</span></div>
        </div>
      )}
    </>
  );
}

// 시설 공사: every office facility is ordered here (docs/rules/growth.md).
function Facilities() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const build = (i: number) => store.buildFacility(FACILITY_IDS[i]!);
  const [cursor, setCursor] = useNav(FACILITY_IDS.length, build);
  return (
    <div style={css.box}>
      <div style={{ ...css.row, ...css.dim }}>{t('ledger.facilities')}</div>
      {FACILITY_IDS.map((id, i) => {
        const f = FACILITIES[id];
        const level = s.facilities[id];
        const price = facilityPrice(s, id);
        const next = f.levelKeys[level];
        return (
          <div key={id} style={rowStyle(i === cursor)} onMouseEnter={() => setCursor(i)} onClick={() => build(i)}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15 }}>{t(f.nameKey)} <span style={{ fontSize: 12, color: '#c9bfe8' }}>{level > 0 ? t('facility.level', { level }) : t('facility.none')}</span></div>
              <div style={{ fontSize: 12, color: '#c9bfe8' }}>{next ? `→ ${t(next)}` : t('facility.done')}</div>
            </div>
            <span style={priceStyle(price !== null && s.money >= price)}>{price === null ? '' : t('facility.build', { cost: price })}</span>
          </div>
        );
      })}
      <div style={{ ...css.hint, marginTop: 6 }}>{t('list.keys')}</div>
    </div>
  );
}
