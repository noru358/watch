import { useEffect, useSyncExternalStore } from 'react';
import { input, requestPhase, store } from '../app/services';
import { CONTRACTS } from '../data/contracts.data';
import { PALETTE } from '../data/feel.data';
import { t } from '../i18n';
import type { LastRun } from '../store/gameStore';

const css = {
  page: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(180deg, #2a1846 0%, #14101f 70%)', color: PALETTE.text, fontFamily: PALETTE.font,
  },
  card: { width: 'min(560px, calc(100% - 32px))', display: 'flex', flexDirection: 'column', gap: 16 },
  title: { margin: 0, fontSize: 28, letterSpacing: 1 },
  sub: { margin: 0, color: PALETTE.textDim, fontSize: 14 },
  box: { background: 'rgba(29,24,48,0.9)', border: '1px solid #3b2f5c', borderRadius: 8, padding: 16 },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: 15, padding: '2px 0' },
  sortie: {
    marginTop: 4, padding: '14px 0', fontSize: 20, fontWeight: 700, color: '#14101f', background: '#41e0c8',
    border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: PALETTE.font,
  },
  hint: { textAlign: 'center', fontSize: 12, color: PALETTE.textDim },
} satisfies Record<string, React.CSSProperties>;

function outcomeLabel(last: LastRun): string {
  const o = last.result.outcome;
  return o === 'success' ? t('result.success') : o === 'extracted' ? t('result.extracted') : t('result.died');
}

function sortie(): void {
  requestPhase('night');
}

// Gate 1 placeholder Day screen: one office card and the 출동 button.
export function OfficeApp() {
  const s = useSyncExternalStore(store.subscribe, store.getState);

  // Keyboard goes through InputManager (Rule 4), never a React key handler.
  useEffect(() => input.onAction((action, ctx) => ctx === 'day' && action === 'confirm' && sortie()), []);

  return (
    <div style={css.page}>
      <div style={css.card}>
        <div>
          <h1 style={css.title}>{t('game.title')}</h1>
          <p style={css.sub}>{t('day.office')}</p>
        </div>
        <div style={css.box}>
          <div style={css.row}><span>{t('day.money')}</span><span>{s.money}</span></div>
          <div style={css.row}><span>{t('day.trauma')}</span><span>{s.trauma}</span></div>
          <div style={css.row}><span>{t('day.runs')}</span><span>{s.solved}</span></div>
        </div>
        {s.lastRun && (
          <div style={css.box}>
            <div style={{ ...css.row, color: PALETTE.textDim }}>{t('day.lastResult')}</div>
            <div style={css.row}><span>{outcomeLabel(s.lastRun)}</span><span>+{s.lastRun.settlement.moneyDelta}</span></div>
          </div>
        )}
        <div style={css.box}>
          <div style={{ ...css.row, color: PALETTE.textDim }}>{t('day.contractTitle')}</div>
          <div style={{ fontSize: 16, margin: '6px 0' }}>{t('day.contractName')}</div>
          <div style={css.row}><span>{t('day.contractFee')}</span><span>{CONTRACTS.euljiro_printer.fee}</span></div>
        </div>
        <button style={css.sortie} onClick={sortie}>🌙 {t('day.sortie')}</button>
        <div style={css.hint}>{t('day.sortieHint')}</div>
        <div style={{ ...css.box, fontSize: 13 }}>
          <div style={{ color: PALETTE.textDim, marginBottom: 4 }}>{t('day.controls')}</div>
          {t('day.controlsBody')}
          <div style={{ color: PALETTE.textDim, marginTop: 6 }}>{t('day.controlsTip')}</div>
        </div>
        <div style={css.hint}>{t('day.placeholder')}</div>
      </div>
    </div>
  );
}
