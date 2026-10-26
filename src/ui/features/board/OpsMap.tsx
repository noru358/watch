import { NODES } from '../../../data/nodes.data';
import { OFFICE } from '../../../data/office.data';
import { t } from '../../../i18n';
import type { ContractOffer, Contamination } from '../../../systems/office';
import type { NodeId } from '../../../types/ids';
import { BOARD_LOOK as L } from './look';

// The Euljiro operations map (docs/design/1-foundation/ui.md "의뢰판"): a district's state is its
// colour only (no numbers, no "contamination" word); links that are about to carry it blink.
// Presentation only: it reads state and reports clicks. Only districts with an offer are clickable.

const NODE_IDS = Object.keys(NODES) as NodeId[];
const VIEW = { w: 100, h: 66 };

interface Props {
  contamination: Contamination;
  board: readonly ContractOffer[];
  selected: ContractOffer | null;
  onPick: (node: NodeId) => void;
}

// A link "spreads" when one end is bad enough to spread and the other can still get worse.
const spreading = (c: Contamination, a: NodeId, b: NodeId) =>
  (c[a] >= OFFICE.contamination.spreadAt && c[b] < OFFICE.contamination.max) || (c[b] >= OFFICE.contamination.spreadAt && c[a] < OFFICE.contamination.max);

export function OpsMap({ contamination, board, selected, onPick }: Props) {
  const links = NODE_IDS.flatMap((a) => NODES[a].links.filter((b) => a < b).map((b) => [a, b] as const));
  const y = (id: NodeId) => NODES[id].y * 0.6 + 3;
  return (
    <div style={{ position: 'relative', background: L.mapBg, border: `1px solid ${L.line}`, borderRadius: 6, overflow: 'hidden' }}>
      <style>{'@keyframes nwBlink{0%,100%{opacity:.25}50%{opacity:1}}'}</style>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} style={{ width: '100%', display: 'block' }} role="img" aria-label={t('board.mapTitle')}>
        {links.map(([a, b]) => {
          const hot = spreading(contamination, a, b);
          return (
            <line key={`${a}-${b}`} x1={NODES[a].x} y1={y(a)} x2={NODES[b].x} y2={y(b)} stroke={hot ? L.spread : L.line} strokeWidth={hot ? 0.8 : 0.6}
              strokeDasharray={hot ? '1.8 1.4' : undefined} style={hot ? { animation: 'nwBlink 1.4s ease-in-out infinite' } : undefined} />
          );
        })}
        {NODE_IDS.map((id) => {
          const n = NODES[id];
          const c = contamination[id];
          const pins = board.filter((o) => o.node === id);
          const isSel = selected?.node === id;
          const r = 2.6 + c * 0.55;
          const cy = y(id);
          return (
            <g key={id} onClick={() => pins.length > 0 && onPick(id)} style={{ cursor: pins.length > 0 ? 'pointer' : 'default' }}>
              {c >= OFFICE.contamination.spreadAt && <circle cx={n.x} cy={cy} r={r + 5} fill={L.spread} opacity={0.08} />}
              <circle cx={n.x} cy={cy} r={r} fill={L.heat[c] ?? L.heat[L.heat.length - 1]} />
              {isSel && <circle cx={n.x} cy={cy} r={r + 1.6} fill="none" stroke={L.accent} strokeWidth={0.7} />}
              <text x={n.x} y={cy + r + 3.6} textAnchor="middle" fontSize={2.6} fill={isSel ? L.ink : L.dim} fontWeight={isSel ? 700 : 400}>{t(n.nameKey)}</text>
              {pins.map((o, i) => (
                <rect key={o.id} x={n.x - (pins.length * 2.6) / 2 + i * 2.6 + 0.3} y={cy - r - 4.2} width={2} height={2.6} rx={0.3}
                  fill={o.kind === 'story' ? L.accent : o.kind === 'bounty' ? L.bounty : L.general} />
              ))}
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', left: 10, bottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: L.dim }}>
        <span>{t('board.legendCalm')}</span>
        <span style={{ display: 'flex', gap: 2 }} aria-hidden="true">
          {L.heat.map((h) => <span key={h} style={{ width: 14, height: 7, background: h }} />)}
        </span>
        <span>{t('board.legendHot')}</span>
        <span style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span aria-hidden="true" style={{ width: 18, borderTop: `2px dashed ${L.spread}` }} />{t('board.legendSpread')}
        </span>
      </div>
    </div>
  );
}
