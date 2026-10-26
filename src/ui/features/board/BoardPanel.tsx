import { useEffect, useSyncExternalStore } from 'react';
import { input, requestPhase, store } from '../../../app/services';
import { NODES } from '../../../data/nodes.data';
import { OFFICE } from '../../../data/office.data';
import { t } from '../../../i18n';
import { activeChapter, bundleWith, chapterStatus, type ContractOffer, type OfficeState } from '../../../systems/office';
import { deskEffects, traumaEffects } from '../../../systems/growth';
import { SUPPLIES } from '../../../data/facilities.data';
import type { NodeId } from '../../../types/ids';
import { BOARD_LOOK as L } from './look';
import { OfferSheet } from './OfferSheet';
import { OpsMap } from './OpsMap';
import { CHAPTERS } from '../../../data/chapters.data';

// Navigation is by district (user, 2026-10-27): A / D step through districts that have offers
// (left to right on the map), W / S through that district's offers, soonest deadline first
// (main story, which has none, last).
const due = (o: ContractOffer) => o.deadline ?? Number.POSITIVE_INFINITY;
export function districtOffers(board: readonly ContractOffer[], node: NodeId): ContractOffer[] {
  return board.filter((o) => o.node === node).sort((a, b) => due(a) - due(b) || a.id - b.id);
}
function districts(board: readonly ContractOffer[]): NodeId[] {
  const ids = [...new Set(board.map((o) => o.node))];
  return ids.sort((a, b) => NODES[a].x - NODES[b].x || NODES[a].y - NODES[b].y);
}

// Too much trauma keeps the director in (docs/rules/growth.md).
function sortie(): void {
  if (traumaEffects(store.getState().trauma).grounded) return;
  if (store.nightPlan()) requestPhase('night');
}

const selected = () => {
  const s = store.getState();
  return s.board.find((o) => o.id === s.activeOfferId) ?? null;
};

// A / D: the next district with offers; its most urgent offer is chosen.
function stepDistrict(by: number): void {
  const board = store.getState().board;
  const list = districts(board);
  if (list.length === 0) return;
  const cur = selected();
  const i = cur ? list.indexOf(cur.node) : -1;
  const node = list[(i + by + list.length) % list.length]!;
  store.selectOffer(districtOffers(board, node)[0]!.id);
}

// W / S: the other offers in the same district.
function stepOffer(by: number): void {
  const cur = selected();
  if (!cur) return;
  const here = districtOffers(store.getState().board, cur.node);
  const i = here.findIndex((o) => o.id === cur.id);
  store.selectOffer(here[(i + by + here.length) % here.length]!.id);
}

const arrow = {
  flex: '0 0 52px', height: 52, boxSizing: 'border-box' as const, borderRadius: 6, border: `1px solid ${L.line}`, background: L.mapBg, color: L.ink,
  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 1, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
};

// The front door (mockup A, docs/design/1-foundation/ui.md): the Euljiro map on the left, the chosen
// offer as a sheet on a clipboard on the right, then ‹ 출동 ›.
// The chapter gathering clues right now, for the map (docs/rules/story.md).
function clueOf(s: Pick<OfficeState, 'chapters'>) {
  const id = activeChapter(s);
  if (!id || chapterStatus(s, id) !== 'gathering') return null;
  const ch = CHAPTERS[id];
  return { nodes: ch.clueNodes, have: s.chapters[id]?.clues ?? 0, need: ch.clues };
}

export function BoardPanel() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const sel = s.board.find((o) => o.id === s.activeOfferId) ?? null;
  const here = sel ? districtOffers(s.board, sel.node) : [];

  useEffect(() => {
    if (!selected()) stepDistrict(1);
    return input.onAction((action, ctx) => {
      if (ctx !== 'modal') return;
      if (action === 'confirm') sortie();
      if (action === 'left') stepDistrict(-1);
      if (action === 'right') stepDistrict(1);
      if (action === 'up') stepOffer(-1);
      if (action === 'down') stepOffer(1);
    });
  }, []);

  // Clicking a district picks its most urgent offer (clicking it again steps through the rest).
  const pickNode = (node: NodeId) => {
    if (sel?.node === node) return stepOffer(1);
    const first = districtOffers(s.board, node)[0];
    if (first) store.selectOffer(first.id);
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
            {s.supply && <span>{t('board.supply', { name: t(SUPPLIES[s.supply].nameKey) })}</span>}
            <span style={{ fontFamily: 'monospace', fontSize: 16, color: L.ink }}>₩ {s.money}</span>
          </span>
        </div>
        <OpsMap contamination={s.contamination} board={s.board} selected={sel} onPick={pickNode} clue={clueOf(s)} />
      </section>
      <section aria-label={t('board.pick')} style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sel ? (
          <OfferSheet offer={sel} day={s.day} known={s.known.includes(sel.node) || deskEffects(s).reveal} index={here.indexOf(sel)} count={here.length}
            bundle={bundle.length > 0 ? { count: bundle.length, fee: bundle.reduce((sum, o) => sum + o.fee, 0) } : null} />
        ) : (
          <div style={{ color: L.dim, padding: 20 }}>{t('board.pick')}</div>
        )}
        <div style={{ display: 'flex', gap: 8, height: 52 }}>
          <button style={arrow} onClick={() => stepDistrict(-1)} aria-label={t('board.prev')}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>‹</span><span style={{ fontSize: 10, color: L.dim, lineHeight: 1 }}>A</span>
          </button>
          <button onClick={sortie} disabled={!canGo}
            style={{ flex: 1, height: 52, boxSizing: 'border-box', borderRadius: 6, border: 'none', background: L.accent, color: '#14101f', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: canGo ? 'pointer' : 'default', opacity: canGo ? 1 : 0.5, fontFamily: 'inherit' }}>
            <span style={{ fontSize: grounded ? 14 : 19, fontWeight: 700 }}>{grounded ? t('board.grounded') : t('day.sortie')}</span>
            {!grounded && <span style={{ fontSize: 11, padding: '2px 6px', border: '1px solid rgba(20,16,31,0.45)', borderRadius: 3 }}>Enter</span>}
          </button>
          <button style={arrow} onClick={() => stepDistrict(1)} aria-label={t('board.next')}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>›</span><span style={{ fontSize: 10, color: L.dim, lineHeight: 1 }}>D</span>
          </button>
        </div>
      </section>
    </div>
  );
}
