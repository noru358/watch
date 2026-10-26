import { NODES } from '../../../data/nodes.data';
import { t } from '../../../i18n';
import type { ContractOffer, Contamination } from '../../../systems/office';
import type { NodeId } from '../../../types/ids';

// The Euljiro operations map: nodes coloured by contamination, links, a pin per offer.
// Presentation only: it reads state and reports clicks.

const HEAT = ['#3c6f8c', '#4f8a7a', '#b8a24a', '#d4813f', '#d9544f', '#ff3cac'];
const NODE_IDS = Object.keys(NODES) as NodeId[];

interface Props {
  contamination: Contamination;
  board: readonly ContractOffer[];
  selected: ContractOffer | null;
  onPick: (node: NodeId) => void;
}

export function OpsMap({ contamination, board, selected, onPick }: Props) {
  const links = NODE_IDS.flatMap((a) => NODES[a].links.filter((b) => a < b).map((b) => [a, b] as const));
  return (
    <svg viewBox="0 0 100 60" style={{ width: '100%', display: 'block', background: 'rgba(14,11,24,0.9)', borderRadius: 6 }}>
      {links.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y * 0.6} x2={NODES[b].x} y2={NODES[b].y * 0.6} stroke="#3b2f5c" strokeWidth={0.8} />
      ))}
      {NODE_IDS.map((id) => {
        const n = NODES[id];
        const c = contamination[id];
        const pins = board.filter((o) => o.node === id);
        const isSel = selected?.node === id;
        return (
          <g key={id} onClick={() => pins.length > 0 && onPick(id)} style={{ cursor: pins.length > 0 ? 'pointer' : 'default' }}>
            <circle cx={n.x} cy={n.y * 0.6} r={3 + c * 0.45} fill={HEAT[c] ?? HEAT[HEAT.length - 1]} opacity={0.9} />
            {isSel && <circle cx={n.x} cy={n.y * 0.6} r={6.2 + c * 0.45} fill="none" stroke="#41e0c8" strokeWidth={0.7} />}
            <text x={n.x} y={n.y * 0.6 + 0.9} textAnchor="middle" fontSize={2.6} fill="#14101f" fontWeight={700}>{c}</text>
            <text x={n.x} y={n.y * 0.6 + 7.4} textAnchor="middle" fontSize={2.6} fill="#c9bfe8">{t(n.nameKey)}</text>
            {pins.map((o, i) => (
              <rect key={o.id} x={n.x - (pins.length * 2.6) / 2 + i * 2.6 + 0.3} y={n.y * 0.6 - 7.6 - c * 0.45} width={2} height={2.6} rx={0.3}
                fill={o.kind === 'story' ? '#41e0c8' : o.kind === 'bounty' ? '#ff3b4f' : '#ffd166'} />
            ))}
          </g>
        );
      })}
      <text x={2} y={58} fontSize={2.4} fill="#9d8fc4">{t('board.mapLegend')}</text>
    </svg>
  );
}
