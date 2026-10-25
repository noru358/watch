import { useEffect, useSyncExternalStore } from 'react';
import { input, requestPhase, store } from '../../../app/services';
import { CONTRACTS } from '../../../data/contracts.data';
import { t } from '../../../i18n';
import { outcomeLabel } from '../lastRun';
import { panelCss as css } from '../panel';

function sortie(): void {
  requestPhase('night');
}

// The iron door: tonight's contract and the way out (출동).
export function SortiePanel() {
  const s = useSyncExternalStore(store.subscribe, store.getState);

  // Keyboard goes through InputManager (Rule 4), never a React key handler.
  useEffect(() => input.onAction((action, ctx) => ctx === 'modal' && action === 'confirm' && sortie()), []);

  return (
    <>
      <div style={css.box}>
        <div style={{ ...css.row, ...css.dim }}>{t('day.contractTitle')}</div>
        <div style={{ fontSize: 16, margin: '6px 0' }}>{t('day.contractName')}</div>
        <div style={css.row}><span>{t('day.contractFee')}</span><span>{CONTRACTS.lights_out.fee}</span></div>
      </div>
      {s.lastRun && (
        <div style={css.box}>
          <div style={{ ...css.row, ...css.dim }}>{t('day.lastResult')}</div>
          <div style={css.row}><span>{outcomeLabel(s.lastRun)}</span><span>+{s.lastRun.settlement.moneyDelta}</span></div>
        </div>
      )}
      <button style={css.button} onClick={sortie}>🌙 {t('day.sortie')}</button>
      <div style={css.hint}>{t('day.sortieHint')}</div>
      <div style={{ ...css.box, fontSize: 13 }}>
        <div style={{ ...css.dim, marginBottom: 4 }}>{t('day.controls')}</div>
        {t('day.controlsBody')}
        <div style={{ ...css.dim, marginTop: 6 }}>{t('day.controlsTip')}</div>
      </div>
    </>
  );
}
