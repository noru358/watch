import { useEffect, useSyncExternalStore } from 'react';
import { input, requestPhase, store } from '../../../app/services';
import { NODES } from '../../../data/nodes.data';
import { OFFICE } from '../../../data/office.data';
import { t, type TKey } from '../../../i18n';
import { bundleWith, type ContractOffer } from '../../../systems/office';
import type { NodeId } from '../../../types/ids';
import { outcomeLabel } from '../lastRun';
import { panelCss as css } from '../panel';
import { kindLabel, offerBody, offerTitle } from './offerText';
import { OpsMap } from './OpsMap';

const ORDER: Record<ContractOffer['kind'], number> = { story: 0, bounty: 1, general: 2 };
const sorted = (board: readonly ContractOffer[]) => [...board].sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.id - b.id);

function sortie(): void {
  if (store.nightPlan()) requestPhase('night');
}

// Keyboard: A / D step through offers (InputManager, Rule 4); Enter goes.
function step(by: number): void {
  const list = sorted(store.getState().board);
  if (list.length === 0) return;
  const i = list.findIndex((o) => o.id === store.getState().activeOfferId);
  store.selectOffer(list[(i + by + list.length) % list.length]!.id);
}

const stars = (n: number) => '●'.repeat(n) + '○'.repeat(OFFICE.contamination.max - n);

// The front door: the contract board over the Euljiro operations map, then 출동.
export function BoardPanel() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const list = sorted(s.board);
  const sel = list.find((o) => o.id === s.activeOfferId) ?? null;

  useEffect(() => {
    if (store.getState().activeOfferId === null) step(1);
    return input.onAction((action, ctx) => {
      if (ctx !== 'modal') return;
      if (action === 'confirm') sortie();
      if (action === 'left') step(-1);
      if (action === 'right') step(1);
    });
  }, []);

  const pickNode = (node: NodeId) => {
    const here = list.filter((o) => o.node === node);
    const next = here.find((o) => o.id !== s.activeOfferId) ?? here[0];
    if (next) store.selectOffer(next.id);
  };
  const rentIn = OFFICE.rentEvery - (s.day % OFFICE.rentEvery);
  const bundle = sel ? bundleWith(s.board, sel).slice(1) : [];
  const known = sel ? s.known.includes(sel.node) : false;
  const pool = sel ? (sel.kind === 'story' ? null : sel.pool) : null;

  return (
    <>
      <div style={{ ...css.row, fontSize: 13 }}>
        <span>{t('board.day', { day: s.day })}</span>
        <span>{t('board.rentIn', { days: rentIn })}</span>
        {s.debt > 0 && <span style={{ color: '#ff5d7a' }}>{t('board.debt', { debt: s.debt })}</span>}
      </div>
      <OpsMap contamination={s.contamination} board={s.board} selected={sel} onPick={pickNode} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {list.map((o) => (
          <button key={o.id} onClick={() => store.selectOffer(o.id)} style={{
            ...css.chip, borderColor: o.id === sel?.id ? '#41e0c8' : '#3b2f5c', color: o.kind === 'bounty' ? '#ff8a9a' : o.kind === 'story' ? '#41e0c8' : '#f6e7c1',
          }}>
            {kindLabel(o)} · {t(NODES[o.node].nameKey)}
          </button>
        ))}
      </div>
      {sel ? (
        <div style={css.box}>
          <div style={{ ...css.row, ...css.dim }}><span>{kindLabel(sel)} · {offerTitle(sel)}</span><span>{t(NODES[sel.node].nameKey)}</span></div>
          <div style={{ fontSize: 15, margin: '6px 0 8px' }}>{offerBody(sel)}</div>
          <div style={css.row}><span>{t('board.risk')}</span><span>{stars(Math.min(sel.kind === 'story' ? s.contamination[sel.node] : sel.risk, OFFICE.contamination.max))}</span></div>
          <div style={css.row}><span>{t('board.floors', { floors: sel.floors })}</span><span>{sel.deadline === null ? t('board.noDeadline') : t('board.deadline', { days: sel.deadline - s.day })}</span></div>
          <div style={css.row}>
            <span>{t('board.ghosts')}</span>
            <span>{pool === null ? '—' : known ? pool.map((g) => t(`enemy.${g}` as TKey)).join(' · ') : t('board.unknown')}</span>
          </div>
          <div style={css.row}><span>{t('board.fee')}</span><span>{sel.fee}</span></div>
          {bundle.length > 0 && (
            <div style={{ fontSize: 13, color: '#7dffb0', marginTop: 6 }}>
              {t('board.bundle', { count: bundle.length, fee: bundle.reduce((sum, o) => sum + o.fee, 0) })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...css.box, ...css.dim }}>{t('board.pick')}</div>
      )}
      {s.lastRun && (
        <div style={{ ...css.row, ...css.dim, fontSize: 13 }}>
          <span>{t('day.lastResult')}: {outcomeLabel(s.lastRun)}</span><span>+{s.lastRun.settlement.moneyDelta}</span>
        </div>
      )}
      <button style={{ ...css.button, opacity: sel ? 1 : 0.5 }} onClick={sortie} disabled={!sel}>🌙 {t('day.sortie')}</button>
      <div style={css.hint}>{t('board.keys')}</div>
      <div style={{ ...css.hint, textAlign: 'left' }}>{t('day.controls')}: {t('day.controlsBody')}</div>
    </>
  );
}
