import { useSyncExternalStore } from 'react';
import { store } from '../../../app/services';
import { SUPPLIES } from '../../../data/facilities.data';
import { t } from '../../../i18n';
import { suppliesOffered } from '../../../systems/growth';
import { panelCss as css } from '../panel';
import { priceStyle, rowStyle, useNav } from '../useNav';

// 부적 작업대: pack one supply for the next night (paid now; Enter on the packed one unpacks it).
export function BenchPanel() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const list = suppliesOffered(s);
  const pick = (i: number) => {
    const id = list[i];
    if (id) store.packSupply(store.getState().supply === id ? null : id);
  };
  const [cursor, setCursor] = useNav(list.length, pick);
  return (
    <>
      <div style={{ fontSize: 14, color: '#c9bfe8' }}>{s.supply ? t('bench.packed', { name: t(SUPPLIES[s.supply].nameKey) }) : t('bench.empty')}</div>
      <div style={css.box}>
        {list.map((id, i) => {
          const sup = SUPPLIES[id];
          const packed = s.supply === id;
          return (
            <div key={id} style={rowStyle(i === cursor)} data-cursor={i === cursor || undefined} onMouseEnter={() => setCursor(i)} onClick={() => pick(i)}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: packed ? 700 : 400 }}>{t(sup.nameKey)}{packed ? ` · ${t('bench.packedTag')}` : ''}</div>
                <div style={{ fontSize: 12, color: '#c9bfe8' }}>{t(sup.descKey)}</div>
              </div>
              <span style={priceStyle(packed || s.money >= sup.cost)}>₩{sup.cost}</span>
            </div>
          );
        })}
      </div>
      <div style={css.hint}>{t('list.keys')}</div>
    </>
  );
}
