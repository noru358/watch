import { useEffect, useSyncExternalStore } from 'react';
import { input, requestPhase, store } from '../../../app/services';
import { OFFICE } from '../../../data/office.data';
import { t } from '../../../i18n';
import { bundleWith, type ContractOffer } from '../../../systems/office';
import { deskEffects, traumaEffects } from '../../../systems/growth';
import { SUPPLIES } from '../../../data/facilities.data';
import type { NodeId } from '../../../types/ids';
import { BOARD_LOOK as L } from './look';
import { OfferSheet } from './OfferSheet';
import { OpsMap } from './OpsMap';

// 메인 스토리 first, then named targets, then the rest.
const rank = (o: ContractOffer) => (o.kind === 'main' ? 0 : o.target ? 1 : 2);
const sorted = (board: readonly ContractOffer[]) => [...board].sort((a, b) => rank(a) - rank(b) || a.id - b.id);

// Too much trauma keeps the director in (docs/rules/growth.md).
function sortie(): void {
  if (traumaEffects(store.getState().trauma).grounded) return;
  if (store.nightPlan()) requestPhase('night');
}

// Keyboard: A / D step through offers (InputManager, Rule 4); Enter goes.
function step(by: number): void {
  const list = sorted(store.getState().board);
  if (list.length === 0) return;
  const i = list.findIndex((o) => o.id === store.getState().activeOfferId);
  store.selectOffer(list[(i + by + list.length) % list.length]!.id);
}

const arrow = {
  flex: '0 0 52px', height: 52, boxSizing: 'border-box' as const, borderRadius: 6, border: `1px solid ${L.line}`, background: L.mapBg, color: L.ink,
  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 1, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
};

// The front door (mockup A, docs/design/1-foundation/ui.md): the Euljiro map on the left, the chosen
// offer as a sheet on a clipboard on the right, then ‹ 출동 ›.
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
  const grounded = traumaEffects(s.trauma).grounded;
  const canGo = !!sel && !grounded;

  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
      <section aria-label={t('board.mapTitle')} style={{ flex: '1 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: L.dim, gap: 12 }}>
          <span style={{ fontSize: 17, color: L.ink, fontWeight: 700 }}>{t('board.mapTitle')}</span>
          <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>{t('board.day', { day: s.day })}</span>
            <span style={{ color: L.general }}>{t('board.rentIn', { days: rentIn })}</span>
            {s.debt > 0 && <span style={{ color: L.bounty }}>{t('board.debt', { debt: s.debt })}</span>}
            {s.trauma > 0 && <span style={{ color: s.trauma >= 2 ? L.bounty : L.dim }}>{t('board.trauma', { trauma: s.trauma })}</span>}
            <span style={{ fontFamily: 'monospace', fontSize: 16, color: L.ink }}>₩ {s.money}</span>
          </span>
        </div>
        <OpsMap contamination={s.contamination} board={s.board} selected={sel} onPick={pickNode} />
      </section>
      <section aria-label={t('board.pick')} style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sel ? <OfferSheet offer={sel} day={s.day} known={s.known.includes(sel.node) || deskEffects(s).reveal} others={list.length - 1} /> : <div style={{ color: L.dim, padding: 20 }}>{t('board.pick')}</div>}
        {s.supply && <div style={{ fontSize: 13, color: L.dim }}>{t('board.supply', { name: t(SUPPLIES[s.supply].nameKey) })}</div>}
        {grounded && <div style={{ fontSize: 13, color: L.bounty }}>{t('board.grounded')}</div>}
        {bundle.length > 0 && (
          <div style={{ fontSize: 13, color: L.bundle }}>{t('board.bundle', { count: bundle.length, fee: bundle.reduce((sum, o) => sum + o.fee, 0) })}</div>
        )}
        <div style={{ display: 'flex', gap: 8, height: 52 }}>
          <button style={arrow} onClick={() => step(-1)} aria-label={t('board.prev')}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>‹</span><span style={{ fontSize: 10, color: L.dim, lineHeight: 1 }}>A</span>
          </button>
          <button onClick={sortie} disabled={!canGo}
            style={{ flex: 1, height: 52, boxSizing: 'border-box', borderRadius: 6, border: 'none', background: L.accent, color: '#14101f', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: canGo ? 'pointer' : 'default', opacity: canGo ? 1 : 0.5, fontFamily: 'inherit' }}>
            <span style={{ fontSize: 19, fontWeight: 700 }}>{t('day.sortie')}</span>
            <span style={{ fontSize: 11, padding: '2px 6px', border: '1px solid rgba(20,16,31,0.45)', borderRadius: 3 }}>Enter</span>
          </button>
          <button style={arrow} onClick={() => step(1)} aria-label={t('board.next')}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>›</span><span style={{ fontSize: 10, color: L.dim, lineHeight: 1 }}>D</span>
          </button>
        </div>
      </section>
    </div>
  );
}
