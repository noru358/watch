import { NODES } from '../../../data/nodes.data';
import { t } from '../../../i18n';
import { overflowTargets, type ContractOffer, type Contamination } from '../../../systems/office';
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
  clue?: { nodes: readonly NodeId[]; have: number; need: number } | null; // 메인 스토리 단서를 모으는 동네
  rank?: number; // 평판 rank: districts above it are locked
  day?: number;
}

// 넘침 (docs/rules/office.md): a district with a 긴급 의뢰 on the board, and where it spills if missed.
// Drawn like Helldivers supply lines / a Pandemic outbreak: dashed arrows to each neighbour, "+1" on it.
function overflows(board: readonly ContractOffer[], contamination: Contamination, rank: number) {
  return board.filter((o) => o.urgent).map((o) => ({ from: o.node, to: overflowTargets({ contamination, rankReached: rank }, o.node), left: o.deadline }));
}

export function OpsMap({ contamination, board, selected, onPick, clue, rank = 0, day = 0 }: Props) {
  const spill = overflows(board, contamination, rank);
  const hit = new Set(spill.flatMap((x) => x.to));
  const links = NODE_IDS.flatMap((a) => NODES[a].links.filter((b) => a < b).map((b) => [a, b] as const));
  const y = (id: NodeId) => NODES[id].y * 0.6 + 3;
  return (
    <div style={{ position: 'relative', background: L.mapBg, border: `1px solid ${L.line}`, borderRadius: 6, overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} style={{ width: '100%', display: 'block' }} role="img" aria-label={t('board.mapTitle')}>
        {links.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={NODES[a].x} y1={y(a)} x2={NODES[b].x} y2={y(b)} stroke={L.line} strokeWidth={0.6} />
        ))}
        <defs>
          <marker id="spill-head" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill={L.spread} /></marker>
        </defs>
        {spill.flatMap((x) => x.to.map((to) => <SpillArrow key={`${x.from}-${to}`} from={x.from} to={to} y={y} r={(id) => 2.6 + contamination[id] * 0.55} />))}
        {NODE_IDS.map((id) => {
          const n = NODES[id];
          const c = contamination[id];
          const pins = board.filter((o) => o.node === id);
          const live = pins.length > 0;
          const isSel = selected?.node === id;
          const r = 2.6 + c * 0.55;
          const cy = y(id);
          const locked = n.rank > rank;
          const urgent = spill.some((x) => x.from === id);
          return (
            <g key={id} onClick={() => live && onPick(id)} style={{ cursor: live ? 'pointer' : 'default' }} opacity={live ? 1 : 0.32}>
              {live && <circle cx={n.x} cy={cy} r={r + 3.2} fill={L.heat[c] ?? L.heat[L.heat.length - 1]} opacity={0.14} />}
              <circle cx={n.x} cy={cy} r={r} fill={L.heat[c] ?? L.heat[L.heat.length - 1]} stroke={live ? L.ink : 'none'} strokeWidth={live ? 0.35 : 0} />
              {isSel && <circle cx={n.x} cy={cy} r={r + 1.8} fill="none" stroke={L.accent} strokeWidth={0.9} />}
              <text x={n.x} y={cy + r + 3.6} textAnchor="middle" fontSize={2.7} fill={isSel ? L.ink : live ? L.dim : L.off} fontWeight={isSel || live ? 700 : 400}>{t(n.nameKey)}</text>
              {urgent && <circle cx={n.x} cy={cy} r={r + 1.6} fill="none" stroke={L.spread} strokeWidth={0.5} strokeDasharray="1 0.8" />}
              {hit.has(id) && (
                <g aria-hidden="true">
                  <rect x={n.x + r - 0.5} y={cy - r - 4.6} width={6} height={3.4} rx={1.7} fill={L.spread} />
                  <text x={n.x + r + 2.5} y={cy - r - 2.2} textAnchor="middle" fontSize={2.3} fontWeight={700} fill={L.paperInk}>+1</text>
                </g>
              )}
              {locked && <text x={n.x} y={cy + r + 6.6} textAnchor="middle" fontSize={2.1} fill={L.dim}>{t('board.locked', { rank: n.rank })}</text>}
              {clue?.nodes.includes(id) && (
                <text x={n.x} y={cy + r + 6.6} textAnchor="middle" fontSize={2.1} fill={L.accent}>{t('board.clues', { have: clue.have, need: clue.need })}</text>
              )}
              {pins.map((o, i) => (
                <rect key={o.id} x={n.x - (pins.length * 2.6) / 2 + i * 2.6 + 0.3} y={cy - r - 4.2} width={2} height={2.6} rx={0.3}
                  fill={o.kind === 'main' ? L.accent : o.urgent ? L.spread : o.target ? L.bounty : L.general} />
              ))}
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: L.dim, flexWrap: 'wrap', padding: '6px 10px 8px', borderTop: `1px solid ${L.line}` }}>
        <span>{t('board.legendGhosts')}</span>
        <span style={{ display: 'flex', gap: 2 }}>
          {L.heat.map((h, i) => (
            <span key={h} style={{ minWidth: 34, textAlign: 'center', background: h, color: i >= 2 ? L.paperInk : L.ink }}>
              {i < L.heat.length - 1 ? `+${i}` : t('board.legendOverflow')}
            </span>
          ))}
        </span>
        <span>{t('board.legendFee')}</span>
      </div>
      {spill.length > 0 && (
        <div style={{ position: 'absolute', right: 10, top: 10, background: '#2a1534', border: `1px solid ${L.spread}`, borderRadius: 6, padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 170 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: L.spread }}>{(spill[0]!.left ?? day) - day > 0 ? t('board.urgentLeft', { days: (spill[0]!.left ?? day) - day }) : t('board.urgentToday')}</span>
          <span style={{ fontSize: 11, color: L.ink }}>{t('board.urgentHint')}</span>
        </div>
      )}
    </div>
  );
}

// One dashed arrow from an overflowing district toward a neighbour it would spill into.
function SpillArrow({ from, to, y, r }: { from: NodeId; to: NodeId; y: (id: NodeId) => number; r: (id: NodeId) => number }) {
  const a = { x: NODES[from].x, y: y(from) };
  const b = { x: NODES[to].x, y: y(to) };
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  const s = { x: a.x + ux * (r(from) + 1.8), y: a.y + uy * (r(from) + 1.8) };
  const e = { x: b.x - ux * (r(to) + 1.6), y: b.y - uy * (r(to) + 1.6) };
  const bend = { x: (s.x + e.x) / 2 - uy * 3, y: (s.y + e.y) / 2 + ux * 3 };
  return <path d={`M${s.x} ${s.y} Q ${bend.x} ${bend.y} ${e.x} ${e.y}`} fill="none" stroke={L.spread} strokeWidth={0.7} strokeDasharray="1.6 1" markerEnd="url(#spill-head)" />;
}
