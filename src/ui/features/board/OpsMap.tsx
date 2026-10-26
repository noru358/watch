import { NODES } from '../../../data/nodes.data';
import { OFFICE } from '../../../data/office.data';
import { t } from '../../../i18n';
import type { ContractOffer, Contamination } from '../../../systems/office';
import type { NodeId } from '../../../types/ids';
import { BOARD_LOOK as L } from './look';

// The Euljiro operations map (docs/design/1-foundation/ui.md "의뢰판"): a district's state is its
// colour only (no numbers, no "contamination" word). Districts with an offer are lit and clickable;
// the rest are dimmed. A district that may catch the spread from a neighbour tomorrow says so in
// words under its name. Presentation only: it reads state and reports clicks.

const NODE_IDS = Object.keys(NODES) as NodeId[];
const VIEW = { w: 100, h: 66 };

interface Props {
  contamination: Contamination;
  board: readonly ContractOffer[];
  selected: ContractOffer | null;
  onPick: (node: NodeId) => void;
}

// Can this district get worse tomorrow because a neighbour spreads? (office.data.ts contamination)
export const atRisk = (c: Contamination, id: NodeId) =>
  c[id] < OFFICE.contamination.max && NODES[id].links.some((n) => c[n] >= OFFICE.contamination.spreadAt);

export function OpsMap({ contamination, board, selected, onPick }: Props) {
  const links = NODE_IDS.flatMap((a) => NODES[a].links.filter((b) => a < b).map((b) => [a, b] as const));
  const y = (id: NodeId) => NODES[id].y * 0.6 + 3;
  return (
    <div style={{ position: 'relative', background: L.mapBg, border: `1px solid ${L.line}`, borderRadius: 6, overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} style={{ width: '100%', display: 'block' }} role="img" aria-label={t('board.mapTitle')}>
        {links.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={NODES[a].x} y1={y(a)} x2={NODES[b].x} y2={y(b)} stroke={L.line} strokeWidth={0.6} />
        ))}
        {NODE_IDS.map((id) => {
          const n = NODES[id];
          const c = contamination[id];
          const pins = board.filter((o) => o.node === id);
          const live = pins.length > 0;
          const isSel = selected?.node === id;
          const r = 2.6 + c * 0.55;
          const cy = y(id);
          const risk = atRisk(contamination, id);
          return (
            <g key={id} onClick={() => live && onPick(id)} style={{ cursor: live ? 'pointer' : 'default' }} opacity={live ? 1 : 0.32}>
              {live && <circle cx={n.x} cy={cy} r={r + 3.2} fill={L.heat[c] ?? L.heat[L.heat.length - 1]} opacity={0.14} />}
              <circle cx={n.x} cy={cy} r={r} fill={L.heat[c] ?? L.heat[L.heat.length - 1]} stroke={live ? L.ink : 'none'} strokeWidth={live ? 0.35 : 0} />
              {isSel && <circle cx={n.x} cy={cy} r={r + 1.8} fill="none" stroke={L.accent} strokeWidth={0.9} />}
              <text x={n.x} y={cy + r + 3.6} textAnchor="middle" fontSize={2.7} fill={isSel ? L.ink : live ? L.dim : L.off} fontWeight={isSel || live ? 700 : 400}>{t(n.nameKey)}</text>
              {risk && <text x={n.x} y={cy + r + 6.6} textAnchor="middle" fontSize={2.1} fill={L.spread}>{t('board.atRisk')}</text>}
              {pins.map((o, i) => (
                <rect key={o.id} x={n.x - (pins.length * 2.6) / 2 + i * 2.6 + 0.3} y={cy - r - 4.2} width={2} height={2.6} rx={0.3}
                  fill={o.kind === 'main' ? L.accent : o.target ? L.bounty : L.general} />
              ))}
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: L.dim, flexWrap: 'wrap', padding: '6px 10px 8px', borderTop: `1px solid ${L.line}` }}>
        <span>{t('board.legendCalm')}</span>
        <span style={{ display: 'flex', gap: 2 }} aria-hidden="true">
          {L.heat.map((h) => <span key={h} style={{ width: 14, height: 7, background: h }} />)}
        </span>
        <span>{t('board.legendHot')}</span>
        <span style={{ flexBasis: '100%', height: 0 }} />
        <span style={{ color: L.spread }}>{t('board.atRisk')}</span>
        <span>{t('board.legendRisk')}</span>
      </div>
    </div>
  );
}
