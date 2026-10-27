import { MODIFIERS } from '../../../data/modifiers.data';
import { NODES } from '../../../data/nodes.data';
import { t } from '../../../i18n';
import { nightDifficulty, planNight, type ContractOffer } from '../../../systems/office';
import { DifficultyDots } from './OfferSheet';
import { targetName } from './offerText';
import { BOARD_LOOK as L } from './look';

// One line of the slip: floors (one or a range), what happens there, what it pays.
interface SlipRow {
  from: number;
  to: number;
  what: string;
  mods: string[];
  fee: number | null;
  dim: boolean;
}

// Tonight's floors in order: each objective on its floor, the floors walked through, the deep floors.
export function slipRows(offers: readonly ContractOffer[]): SlipRow[] {
  if (offers.length === 0) return [];
  const first = offers[0]!;
  if (first.kind === 'main') return [{ from: 0, to: first.floors - 1, what: t('board.slipStory'), mods: [], fee: first.fee, dim: false }];
  const plan = planNight(offers);
  const rows: SlipRow[] = [];
  const goalAt = (floor: number) => plan.goals.filter((g) => g.floor === floor || g.floor === -1 && floor === 0);
  const last = Math.max(...plan.goals.map((g) => g.floor));
  for (let i = 0; i < plan.floors.length; i++) {
    const here = goalAt(i);
    if (here.length > 0) {
      for (const g of here) {
        const o = offers.find((x) => x.id === g.offerId)!;
        const name = targetName(o.target);
        const what = `${t(`board.goal.${o.objective ?? 'clear'}`)}${name ? ` 「${name}」` : ''}`;
        rows.push({ from: g.floor === -1 ? -1 : i, to: g.floor === -1 ? -1 : i, what, mods: o.mods.map((m) => t(MODIFIERS[m].nameKey)), fee: g.fee, dim: false });
      }
      continue;
    }
    const what = i > last ? t('board.slipDeep') : t('board.slipPass');
    const prev = rows[rows.length - 1];
    if (prev && prev.fee === null && prev.what === what && prev.to === i - 1) prev.to = i;
    else rows.push({ from: i, to: i, what, mods: [], fee: null, dim: true });
  }
  return rows;
}

const floorLabel = (r: SlipRow) => (r.from === -1 ? t('board.slipAny') : r.from === r.to ? t('board.slipFloor', { floor: r.from + 1 }) : t('board.slipRange', { from: r.from + 1, to: r.to + 1 }));

// 출동 전표 (canvas A3, user 2026-10-28): what tonight is, floor by floor, under the map — pinned
// paper, objective rows with their fee, walked-through and deep floors dimmed, then the overall
// 난이도 (hardest offer; the part from contamination in heat colour) and the total.
export function SortieSlip({ offers }: { offers: readonly ContractOffer[] }) {
  if (offers.length === 0) return null;
  const rows = slipRows(offers);
  const difficulty = nightDifficulty(offers);
  const general = offers.every((o) => o.kind === 'general');
  const heat = { dots: general ? difficulty - nightDifficulty(offers.map((o) => ({ ...o, risk: 0 }))) : 0, risk: Math.max(...offers.map((o) => o.risk)) };
  const floors = offers[0]!.kind === 'main' ? offers[0]!.floors : planNight(offers).floors.length;
  const total = offers.reduce((n, o) => n + o.fee, 0);
  return (
    <div style={{ position: 'relative', padding: '12px 6px 0' }}>
      <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 4, width: 14, height: 14, marginLeft: -7, borderRadius: '50%', background: L.stamp, boxShadow: '0 2px 0 #7a1f28', zIndex: 1 }} />
      <div style={{ background: L.paper, color: L.paperInk, borderRadius: 2, padding: '12px 16px 10px', display: 'flex', flexDirection: 'column', gap: 5, transform: 'rotate(-0.6deg)', boxShadow: '0 6px 14px rgba(0,0,0,0.4)', fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: L.paperDim, letterSpacing: 2 }}>
          <span>{t('board.slip')} · {t(NODES[offers[0]!.node].nameKey)}</span>
          <span>{t('board.slipFloors', { floors })}</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '52px minmax(0, 1fr) 64px', gap: 6, color: r.dim ? '#8d849a' : L.paperInk }}>
            <span style={{ fontWeight: 800 }}>{floorLabel(r)}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.what}
              {r.mods.map((m) => <span key={m} style={{ marginLeft: 6, color: L.stamp, fontSize: 11 }}>{m}</span>)}
            </span>
            <span style={{ fontFamily: 'monospace', textAlign: 'right' }}>{r.fee === null ? '—' : r.fee}</span>
          </div>
        ))}
        <div style={{ borderTop: `1px dashed #8d849a`, paddingTop: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: L.paperDim }}>{t('board.slipTotal')}</span>
            <DifficultyDots value={difficulty} heat={heat.dots} risk={heat.risk} size={12} />
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800 }}>₩ {total}</span>
        </div>
      </div>
    </div>
  );
}
