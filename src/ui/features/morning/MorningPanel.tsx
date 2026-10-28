import { useEffect, useSyncExternalStore } from 'react';
import { closeFeature, openFeature } from '../../../app/features';
import { input, store } from '../../../app/services';
import { GEAR_SLOTS, GRADES } from '../../../data/gear.data';
import { NODES } from '../../../data/nodes.data';
import { OFFICE } from '../../../data/office.data';
import { t } from '../../../i18n';
import type { ContractOffer } from '../../../systems/office';
import { BOARD_LOOK as L } from '../board/look';
import { offerTitle, targetName } from '../board/offerText';
import { morningLines } from '../ledger/LedgerPanel';

// Small enough to sit in its own column of a row: never over another row or the fee.
const STAMP = { width: 40, height: 40, boxSizing: 'border-box' as const, borderRadius: '50%', border: `3px solid ${L.stamp}`, color: L.stamp, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, lineHeight: 1, opacity: 0.82, mixBlendMode: 'multiply' as const, pointerEvents: 'none' as const };
const label = { fontSize: 11, color: L.paperDim, letterSpacing: 3 };

// What one offer was, in a line: 의뢰인 · 목표 (+ 표적 이름).
function what(o: ContractOffer): string {
  const goal = o.kind === 'main' ? t('board.goal.boss') : t(`board.goal.${o.objective ?? 'clear'}`);
  const name = targetName(o.target);
  return `${goal}${name ? ` 「${name}」` : ''} · ${t(NODES[o.node].nameKey)}`;
}

// 아침 보고 (canvas MorningReport, user 2026-10-28 "가안 ㅇㅋ"): the bookkeeper's sheet the morning
// after a night — each offer taken (해결 stamp when it was finished and paid), what came home, and
// what today holds. Opens by itself once per morning; Enter goes on to the board.
export function MorningPanel() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const r = s.lastRun;
  const m = s.lastMorning;
  useEffect(() => {
    store.markReportShown();
    return input.onAction((action, ctx) => {
      if (ctx !== 'modal' || action !== 'confirm') return;
      closeFeature();
      openFeature('sortie');
    });
  }, []);
  const rentIn = OFFICE.rentEvery - (s.day % OFFICE.rentEvery);
  const died = r?.result.outcome === 'died';
  return (
    <>
      <div style={{ fontSize: 15 }}>“{morningLines(m).join(' ')}”</div>
      <article style={{ position: 'relative', background: L.paper, color: L.paperInk, borderRadius: 2, padding: '18px 22px 14px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 10px 24px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `2px solid ${L.paperInk}`, paddingBottom: 6 }}>
          <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>{t('morning.title')}</span>
          <span style={{ fontSize: 13, color: L.paperDim }}>{t('board.day', { day: s.day })}</span>
        </div>
        {r?.offers && r.offers.length > 0 && (
          <>
            <span style={label}>{t('morning.lastNight', { outcome: t(`result.${r.result.outcome}`) })}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {r.offers.map((o) => {
                const paid = r.paid?.[o.id];
                const done = paid !== undefined && !died;
                return (
                  <div key={o.id} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 44px 86px', gap: 10, padding: '6px 0', borderBottom: `1px dashed rgba(42,34,51,0.3)`, color: done ? L.paperInk : L.paperDim, alignItems: 'center' }}>
                    <span style={{ minWidth: 0 }}><b>{offerTitle(o)}</b> <span style={{ fontSize: 13, color: L.paperDim }}>· {what(o)}</span></span>
                    <span style={{ display: 'flex', justifyContent: 'center' }}>{done && <span style={{ ...STAMP, transform: `rotate(${(o.id % 5) * 5 - 10}deg)` }}>{t('morning.stamp')}</span>}</span>
                    <span style={{ textAlign: 'right', fontWeight: done ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{done ? `₩ ${paid}` : t('morning.noFee')}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', alignItems: 'center', fontSize: 14 }}>
              <span>{t('morning.loot', { loot: r.settlement.lootKept })}{r.settlement.lootLost > 0 ? ` (${t('morning.lootLost', { lost: r.settlement.lootLost })})` : ''}</span>
              {r.settlement.shards > 0 && <span style={{ color: L.shardInk, fontWeight: 700 }}>{t('result.shards', { shards: r.settlement.shards })}</span>}
              {(r.gear ?? []).map((g) => <span key={g.id}>{t('morning.gear', { name: `${t(GRADES[g.grade].nameKey)} ${t(GEAR_SLOTS[g.slot].nameKey)}` })}</span>)}
              {(r.gearMelted ?? 0) > 0 && <span style={{ color: L.paperDim }}>{t('morning.gearMelted', { money: r.gearMelted! })}</span>}
              {r.reputation ? <span>{t('morning.reputation', { n: r.reputation > 0 ? `+${r.reputation}` : r.reputation })}</span> : null}
              {r.clue && <span style={{ height: 24, padding: '0 8px', display: 'inline-flex', alignItems: 'center', border: `3px solid ${L.accentInk}`, color: L.accentInk, fontWeight: 900, transform: 'rotate(-4deg)' }}>{t('morning.clue')}</span>}
            </div>
          </>
        )}
        <span style={{ ...label, marginTop: 4 }}>{t('morning.today')}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 14 }}>
          <span>{m?.rentDue ? (m.debtAdded > 0 ? t('morning.rentShort', { short: m.debtAdded }) : t('morning.rentPaid', { paid: m.rentPaid })) : t('morning.rentIn', { rent: OFFICE.rent, days: rentIn })}</span>
          {m && m.worsened.length > 0 && <span>{t('morning.worse', { nodes: m.worsened.map((id) => t(NODES[id].nameKey)).join(', ') })}</span>}
          {m && m.overflowed?.length > 0 && <span style={{ color: L.stamp }}>{t('morning.overflow', { nodes: m.overflowed.map((id) => t(NODES[id].nameKey)).join(', ') })}</span>}
          {m && m.expired > 0 && <span>{t('morning.expired', { count: m.expired })}</span>}
          {m && m.newOffers > 0 && <span>{t('morning.newOffers', { count: m.newOffers })}{s.board.some((o) => o.urgent) ? ` · ${t('morning.urgent')}` : ''}</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `2px solid ${L.paperInk}`, paddingTop: 6 }}>
          <span style={{ fontSize: 12, color: L.paperDim }}>{t('morning.keys')}</span>
          <span style={{ fontSize: 13, color: L.paperDim }}>{t('morning.balance')} <b style={{ fontSize: 20, color: L.paperInk, fontVariantNumeric: 'tabular-nums' }}>₩ {s.money}</b></span>
        </div>
      </article>
    </>
  );
}
