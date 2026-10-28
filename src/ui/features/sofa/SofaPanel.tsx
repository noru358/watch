import { useState, useSyncExternalStore } from 'react';
import { store } from '../../../app/services';
import { TRAUMA } from '../../../data/penalties.data';
import { t } from '../../../i18n';
import { restAmount, traumaEffects } from '../../../systems/growth';
import { panelCss as css } from '../panel';
import { priceStyle, rowStyle, useNav } from '../useNav';

// The worn sofa: 휴식하기 (skip tonight, the day passes), 자본 치료 (money), 진정제 사용 (needs an item: not yet).
export function SofaPanel() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const [note, setNote] = useState('');
  const fx = traumaEffects(s.trauma);
  const options = [
    { key: 'rest', name: t('sofa.rest'), desc: t('sofa.restDesc', { amount: restAmount(s) }), price: '', can: true },
    { key: 'capital', name: t('sofa.capital'), desc: t('sofa.capitalDesc', { amount: TRAUMA.capitalAmount }), price: `₩${TRAUMA.capitalCost}`, can: s.trauma > 0 && s.money >= TRAUMA.capitalCost },
    { key: 'sedative', name: t('sofa.sedative'), desc: t('sofa.sedativeDesc'), price: '', can: false },
  ] as const;
  const pick = (i: number) => {
    const o = options[i]!;
    if (o.key === 'rest') {
      store.restToday();
      setNote(t('sofa.rested', { day: store.getState().day }));
    }
    if (o.key === 'capital' && store.capitalTherapy()) setNote(t('sofa.treated'));
  };
  const [cursor, setCursor] = useNav(options.length, pick);
  const effects = [
    fx.cardOffer < TRAUMA.cards ? t('sofa.fxCards', { cards: fx.cardOffer }) : null,
    fx.hpPenalty > 0 ? t('sofa.fxHp', { hp: fx.hpPenalty }) : null,
    fx.grounded ? t('sofa.fxGrounded') : null,
  ].filter(Boolean);
  return (
    <>
      <div style={css.box}>
        <div style={css.row}><span>{t('day.trauma')}</span><span>{s.trauma}</span></div>
        <div style={{ fontSize: 13, color: effects.length ? '#ff8fa3' : '#c9bfe8', marginTop: 4 }}>{effects.length ? effects.join(' · ') : t('sofa.fxNone')}</div>
      </div>
      <div style={css.box}>
        {options.map((o, i) => (
          <div key={o.key} style={{ ...rowStyle(i === cursor), opacity: o.can ? 1 : 0.5 }} data-cursor={i === cursor || undefined} onMouseMove={() => setCursor(i)} onClick={() => pick(i)}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15 }}>{o.name}</div>
              <div style={{ fontSize: 12, color: '#c9bfe8' }}>{o.desc}</div>
            </div>
            <span style={priceStyle(o.can)}>{o.price}</span>
          </div>
        ))}
      </div>
      {note && <div style={{ fontSize: 14, color: '#41e0c8' }}>{note}</div>}
      <div style={css.hint}>{t('list.keys')}</div>
    </>
  );
}
