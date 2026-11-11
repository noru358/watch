import { store } from '../../../app/services';
import { t, type TKey } from '../../../i18n';
import { canWork, hireCap, trainPrice, wageOf, type Staff, type StaffCandidate } from '../../../systems/staff';
import { poolFor } from '../../../store/staffDesk';
import type { GameState } from '../../../store/gameStore';
import { staffName } from '../staffName';
import { priceStyle } from '../useNav';

// The 직원 part of the bookkeeper's list (docs/rules/staff.md): one row per staff member (Enter =
// train), then this week's 구인 (Enter = hire). Rows share the ledger's one keyboard cursor.
export interface LedgerRow {
  key: string;
  head?: string; // a section title shown above this row
  act: () => void;
  body: React.ReactNode;
  price: React.ReactNode;
}

const knackName = (k: Staff['knack']) => (k ? t('staff.knack', { name: t(`board.goal.${k}` as TKey) }) : t('staff.noKnack'));
const facts = (st: Staff | StaffCandidate) => [t('staff.grade', { grade: st.grade }), t('staff.power', { power: st.power }), knackName(st.knack), t('staff.wage', { wage: wageOf(st) })].join(' · ');

export function staffRows(s: GameState): LedgerRow[] {
  const rows: LedgerRow[] = [];
  s.staff.forEach((st, i) => {
    const price = trainPrice(st);
    rows.push({
      key: `st-${st.id}`,
      head: i === 0 ? t('staff.roster') : undefined,
      act: () => store.trainStaff(st.id),
      body: (
        <>
          <div style={{ fontSize: 15 }}>{staffName(st)} <span style={{ fontSize: 12, color: st.trauma > 0 ? '#ff5d7a' : '#c9bfe8' }}>{t('staff.trauma', { n: st.trauma })}{canWork(st) ? '' : ` · ${t('staff.blocked')}`}</span></div>
          <div style={{ fontSize: 12, color: '#c9bfe8' }}>{facts(st)}</div>
        </>
      ),
      price: <span style={priceStyle(price !== null && s.money >= price)}>{price === null ? t('staff.trainDone') : t('staff.train', { cost: price })}</span>,
    });
  });
  const cap = hireCap(s.rankReached);
  const full = s.staff.length >= cap;
  poolFor(s).list.forEach((c, i) => {
    rows.push({
      key: `hire-${i}`,
      head: i === 0 ? `${t('staff.hire')}${full ? ` · ${t('staff.full', { n: cap })}` : ''}` : undefined,
      act: () => store.hireStaff(i),
      body: (
        <>
          <div style={{ fontSize: 15 }}>{staffName(c)}</div>
          <div style={{ fontSize: 12, color: '#c9bfe8' }}>{facts(c)}</div>
        </>
      ),
      price: <span style={priceStyle(!full && s.money >= wageOf(c))}>{t('staff.hireCost', { cost: wageOf(c) })}</span>,
    });
  });
  return rows;
}

