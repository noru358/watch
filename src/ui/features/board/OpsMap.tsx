import { NODES } from '../../../data/nodes.data';
import { t, type TKey } from '../../../i18n';
import type { ContractOffer } from '../../../systems/office';
import type { NodeId } from '../../../types/ids';
import { BOARD_LOOK as L, MAP_PRINT } from './look';

// The Euljiro operations map (docs/design/1-foundation/ui.md "의뢰판"), drawn as a printed paper map
// (look.ts MAP_PRINT): districts with an offer are lit and clickable and carry one pin per offer; the
// rest are dimmed. (District contamination was removed 2026-11-11; the map now shows where the work
// is.) Presentation only: it reads state and reports clicks.

const NODE_IDS = Object.keys(NODES) as NodeId[];
const VIEW = { w: 100, h: 66 };

// 사건 파일 (canvas M2, user 2026-10-28): the chapter as a pinned photo card on the map with red string
// to each district where clues turn up. Ready = all clues found, the main contract is on the board.
export interface CaseFile {
  nameKey: TKey;
  nodes: readonly NodeId[];
  have: number;
  need: number;
  ready: boolean;
}
const CASE_AT = { x: 80, y: 44.5, left: '69%', top: '66%' }; // where the card's pin sits (view units / css)

interface Props {
  board: readonly ContractOffer[];
  selected: ContractOffer | null;
  onPick: (node: NodeId) => void;
  clue?: CaseFile | null; // 메인 스토리 사건 파일: the chapter, its clue districts, clues so far
  rank?: number; // 평판 rank: districts above it are locked
  day?: number;
}

export function OpsMap({ board, selected, onPick, clue, rank = 0 }: Props) {
  const P = MAP_PRINT;
  const links = NODE_IDS.flatMap((a) => NODES[a].links.filter((b) => a < b).map((b) => [a, b] as const));
  const y = (id: NodeId) => NODES[id].y * 0.6 + 3;
  const half = { w: P.block_w / 2, h: P.block_h / 2 };
  return (
    <div style={{ position: 'relative', background: P.paper, borderRadius: 2, overflow: 'hidden', boxShadow: '0 12px 26px rgba(0,0,0,0.55)', color: P.navy }}>
      <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} style={{ width: '100%', display: 'block' }} role="img" aria-label={t('board.mapTitle')}>
        {links.map(([a, b]) => (
          <g key={`${a}-${b}`}>
            <line x1={NODES[a].x} y1={y(a)} x2={NODES[b].x} y2={y(b)} stroke={P.navy} strokeWidth={2.2} strokeLinecap="round" opacity={0.55} />
            <line x1={NODES[a].x} y1={y(a)} x2={NODES[b].x} y2={y(b)} stroke={P.street} strokeWidth={1.7} strokeLinecap="round" />
          </g>
        ))}
        {clue?.nodes.map((id) => {
          const bx = NODES[id].x;
          const by = y(id) - half.h;
          return <path key={`str-${id}`} d={`M${CASE_AT.x} ${CASE_AT.y} Q ${(CASE_AT.x + bx) / 2} ${Math.max(CASE_AT.y, by) + 6} ${bx - 1.5} ${by}`} fill="none" stroke={L.stamp} strokeWidth={0.45} />;
        })}
        {NODE_IDS.map((id) => {
          const n = NODES[id];
          const pins = board.filter((o) => o.node === id);
          const live = pins.length > 0;
          const isSel = selected?.node === id;
          const cy = y(id);
          const locked = n.rank > rank;
          const urgent = pins.some((o) => o.urgent);
          const box = { x: n.x - half.w, y: cy - half.h };
          return (
            <g key={id} onClick={() => live && onPick(id)} style={{ cursor: live ? 'pointer' : 'default' }} opacity={live ? 1 : 0.42}>
              <rect x={box.x} y={box.y} width={P.block_w} height={P.block_h} fill={P.block} stroke={P.navy} strokeWidth={0.35} />
              {isSel && (
                <>
                  <ellipse cx={n.x} cy={cy} rx={half.w + 2.6} ry={half.h + 2.4} fill="none" stroke={P.glow} strokeWidth={2.2} opacity={0.22} />
                  <ellipse cx={n.x} cy={cy} rx={half.w + 2.6} ry={half.h + 2.4} fill="none" stroke={P.glow} strokeWidth={0.7} />
                </>
              )}
              {urgent && <ellipse cx={n.x} cy={cy} rx={half.w + 1.6} ry={half.h + 1.5} fill="none" stroke={P.pinUrgent} strokeWidth={0.5} strokeDasharray="1 0.8" />}
              <text x={n.x} y={cy - 0.2} textAnchor="middle" fontSize={2.8} fontWeight={900} fill={P.navy} stroke={P.paper} strokeWidth={0.8} paintOrder="stroke">{t(n.nameKey)}</text>
              {locked && <text x={n.x} y={cy + half.h + 2.8} textAnchor="middle" fontSize={2.1} fill={P.navy}>{t('board.locked', { rank: n.rank })}</text>}
              {clue?.nodes.includes(id) && <circle cx={n.x - 1.5} cy={box.y} r={1.1} fill={L.stamp} stroke="#7a1f28" strokeWidth={0.3} />}
              {pins.map((o, i) => (
                <circle key={o.id} cx={box.x + P.block_w - 1.2 - i * 2.6} cy={box.y - 0.6} r={1.05} strokeWidth={0.3}
                  fill={o.kind === 'main' ? P.pinMain : o.urgent ? P.pinUrgent : o.target ? P.pinBounty : P.pinWork} stroke={P.navy} />
              ))}
            </g>
          );
        })}
      </svg>
      {clue && (
        <div aria-label={t('board.caseFile')} style={{ position: 'absolute', left: CASE_AT.left, top: CASE_AT.top, width: 118, background: '#f4efe2', color: L.paperInk, borderRadius: 2, padding: '8px 8px 6px', transform: 'rotate(-4deg)', boxShadow: '0 8px 16px rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: 'none' }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: '50%', top: -6, width: 12, height: 12, marginLeft: -6, borderRadius: '50%', background: L.stamp, boxShadow: '0 2px 0 #7a1f28' }} />
          <span style={{ fontSize: 10, color: L.paperDim, letterSpacing: 2 }}>{t('board.caseFile')}</span>
          <span style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.25 }}>{t(clue.nameKey)}</span>
          <span style={{ fontSize: 11, color: clue.ready ? L.accentInk : L.stamp, fontWeight: 700 }}>{clue.ready ? t('board.caseReady') : t('board.clues', { have: clue.have, need: clue.need })}</span>
        </div>
      )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, flexWrap: 'wrap', padding: '6px 10px 8px', borderTop: `1px solid ${P.navy}` }}>
        {([['legendMain', P.pinMain], ['legendWork', P.pinWork], ['legendTarget', P.pinBounty], ['legendUrgent', P.pinUrgent]] as const).map(([k, fill]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: fill, border: `1px solid ${P.navy}` }} />
            {t(`board.${k}`)}
          </span>
        ))}
      </div>
    </div>
  );
}
