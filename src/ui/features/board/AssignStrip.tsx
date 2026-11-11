import { store } from '../../../app/services';
import { t } from '../../../i18n';
import { assignable, type Staff } from '../../../systems/staff';
import type { ContractOffer } from '../../../systems/office';
import { oddsFor } from '../../../store/staffDesk';
import { BOARD_LOOK as L } from './look';
import { staffName } from '../staffName';

// "오늘 밤 배정" under the offer sheet (docs/design/4-day/economy.md "경영 뼈대 설계"): who takes
// this offer tonight and their chance, R to change. The director's own offer is not shown here.
export function AssignStrip({ offer, staff, assign }: { offer: ContractOffer; staff: readonly Staff[]; assign: Readonly<Record<number, number>> }) {
  const here = oddsFor(staff, assign, offer);
  const free = assignable(offer);
  const total = Object.keys(assign).length;
  const line = !free ? t('staff.notHere') : staff.length === 0 ? t('staff.noStaff') : here ? `${staffName(here.staff)} · ${t('staff.odds', { pct: Math.round(here.odds * 100) })}` : t('staff.assignNone');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, border: `1px solid ${L.line}`, background: L.mapBg, color: L.ink, fontSize: 13 }}>
      <span style={{ color: L.dim, whiteSpace: 'nowrap' }}>{t('staff.assign')}{total > 0 ? ` ${total}` : ''}</span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: here ? (here.odds >= 0.5 ? L.accent : L.general) : L.dim }}>{line}</span>
      {free && staff.length > 0 && (
        <button onClick={() => store.cycleAssign(offer.id)} style={{ fontSize: 11, padding: '2px 6px', border: `1px solid ${L.accent}`, borderRadius: 3, background: 'transparent', color: L.accent, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          {t('staff.assignKey')}
        </button>
      )}
    </div>
  );
}
