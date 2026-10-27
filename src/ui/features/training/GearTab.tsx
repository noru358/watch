import { useState, useSyncExternalStore } from 'react';
import { store } from '../../../app/services';
import { GEAR_ECONOMY, GEAR_SLOT_IDS, GEAR_SLOTS, GEAR_SPECIALS, GRADES } from '../../../data/gear.data';
import { t, type TKey } from '../../../i18n';
import { dismantleValue, enhanceCost, itemMods, rerollCost, type GearItem, type GearMod } from '../../../systems/gear';
import { panelCss as css } from '../panel';
import { rowStyle, useNav } from '../useNav';

const GRADE_COLOR: Record<string, string> = { common: '#c9bfe8', rare: '#6fc3ff', epic: '#b39cff', legend: '#ffb454' };

// "+4%", "+1", "−3%": a gear number as the player reads it.
export function modText(m: GearMod): string {
  const name = t(`stat.${m.stat}` as TKey);
  const whole = m.stat === 'maxHp';
  const v = whole ? Math.round(m.value * 10) / 10 : Math.round(m.value * 1000) / 10;
  return `${name} ${v > 0 ? '+' : '−'}${Math.abs(v)}${whole ? '' : '%'}`;
}

// 장신구 (docs/rules/growth.md): three worn slots, the bag; money raises a piece's level (its main
// option), 심연 파편 rerolls one sub option, melting gives money back.
export function GearTab() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const bag = s.gear;
  const [sub, setSub] = useState(0);
  const [melt, setMelt] = useState<number | null>(null);
  const pick = (i: number) => bag[i];
  const [cursor, setCursor] = useNav(bag.length, (i) => pick(i) && store.toggleWear(pick(i)!.id), (action, i) => {
    const it = pick(i);
    if (!it) return;
    if (action === 'mark') store.enhanceGear(it.id);
    if (action === 'skill') store.rerollGear(it.id, Math.min(sub, Math.max(0, it.subs.length - 1)));
    if (action === 'left') setSub((v) => Math.max(0, v - 1));
    if (action === 'right') setSub((v) => Math.min(Math.max(0, it.subs.length - 1), v + 1));
    if (action === 'draw') {
      if (melt === it.id) {
        store.meltGear(it.id);
        setMelt(null);
      } else setMelt(it.id);
    }
  });
  const sel = bag[cursor] ?? null;
  const wornId = (slot: string) => s.equipped[slot as keyof typeof s.equipped];

  return (
    <>
      <div style={{ ...css.box, padding: 8 }}>
        <div style={{ ...css.dim, fontSize: 13, padding: '0 6px 6px' }}>{t('gear.worn')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {GEAR_SLOT_IDS.map((slot) => {
            const it = bag.find((x) => x.id === wornId(slot));
            return (
              <div key={slot} style={{ border: '1px solid #3b2f5c', borderRadius: 6, padding: 8, minHeight: 64 }}>
                <div style={{ fontSize: 12, color: '#c9bfe8' }}>{t(GEAR_SLOTS[slot].nameKey)} · {t(GEAR_SLOTS[slot].roleKey)}</div>
                {it ? <ItemLine it={it} /> : <div style={{ fontSize: 13, color: '#7d6f9e' }}>{t('gear.empty')}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }}>
        <div style={{ ...css.box, padding: 8 }}>
          <div style={{ ...css.dim, fontSize: 13, padding: '0 6px 6px' }}>{t('gear.bag', { count: bag.length, max: GEAR_ECONOMY.bag })}</div>
          {bag.length === 0 && <div style={{ fontSize: 13, color: '#c9bfe8', padding: 6 }}>{t('gear.bagEmpty')}</div>}
          {bag.map((it, i) => (
            <div key={it.id} style={rowStyle(i === cursor)} data-cursor={i === cursor || undefined} onMouseEnter={() => setCursor(i)} onClick={() => store.toggleWear(it.id)}>
              <ItemLine it={it} worn={wornId(it.slot) === it.id} />
            </div>
          ))}
        </div>
        <div style={{ ...css.box, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sel ? (
            <>
              <ItemLine it={sel} worn={wornId(sel.slot) === sel.id} />
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {itemMods(sel).map((m, k) => (
                  <li key={k} style={{ color: k > 0 && k - 1 === Math.min(sub, sel.subs.length - 1) ? '#41e0c8' : '#f6e7c1' }}>
                    {k === 0 ? `${t('gear.main')} · ` : ''}{modText(m)}
                  </li>
                ))}
              </ul>
              {sel.special && <div style={{ fontSize: 13, color: GRADE_COLOR.legend }}>{t(GEAR_SPECIALS[sel.special]!.nameKey)} — {t(GEAR_SPECIALS[sel.special]!.descKey)}</div>}
              <button style={css.chip} onClick={() => store.enhanceGear(sel.id)} disabled={enhanceCost(sel) === null}>
                F · {enhanceCost(sel) === null ? t('gear.enhanceMax') : t('gear.enhance', { cost: enhanceCost(sel)! })}
              </button>
              {sel.subs.length > 0 && (
                <button style={css.chip} onClick={() => store.rerollGear(sel.id, Math.min(sub, sel.subs.length - 1))}>L · {t('gear.reroll', { cost: rerollCost(sel) })}</button>
              )}
              <button style={css.chip} onClick={() => (melt === sel.id ? (store.meltGear(sel.id), setMelt(null)) : setMelt(sel.id))}>
                K · {melt === sel.id ? t('gear.meltConfirm') : t('gear.melt', { value: dismantleValue(sel) })}
              </button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#7d6f9e' }}>{t('gear.bagEmpty')}</div>
          )}
        </div>
      </div>
      <div style={css.hint}>{t('gear.keys')}</div>
    </>
  );
}

function ItemLine({ it, worn = false }: { it: GearItem; worn?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 700 }}>
        <span style={{ color: GRADE_COLOR[it.grade] }}>{t(GRADES[it.grade].nameKey)}</span> {t(GEAR_SLOTS[it.slot].nameKey)} {t('gear.level', { level: it.level })}
        {worn ? <span style={{ fontSize: 11, color: '#41e0c8' }}> · {t('gear.wearing')}</span> : null}
      </span>
      <span style={{ fontSize: 12, color: '#c9bfe8' }}>{modText(itemMods(it)[0]!)}</span>
    </div>
  );
}
