import type { JoinState } from './BoardPanel';
import { NODES } from '../../../data/nodes.data';
import { t, type TKey } from '../../../i18n';
import { offerDifficulty, offerGoal, offerHeat, type ContractOffer, type GoalKind } from '../../../systems/office';
import { MODIFIERS } from '../../../data/modifiers.data';
import { offerBody, offerTitle, targetName } from './offerText';
import { BOARD_LOOK as L } from './look';

const MAX_DIFFICULTY = 5;
export const heatColor = (risk: number) => L.heat[Math.min(risk, L.heat.length - 1)]!;

// 난이도 as dots: the part the district's contamination adds is drawn in its heat colour (last dots).
export function DifficultyDots({ value, heat = 0, risk = 0, size = 16 }: { value: number; heat?: number; risk?: number; size?: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }} role="img" aria-label={`${t('board.difficulty')} ${value} / ${MAX_DIFFICULTY}`}>
      {Array.from({ length: MAX_DIFFICULTY }, (_, i) => {
        const on = i < value;
        const fromHeat = on && i >= value - heat;
        return <span key={i} style={{ width: size, height: size, borderRadius: '50% 50% 40% 40%', background: fromHeat ? heatColor(risk) : on ? L.paperInk : L.paperOff, boxShadow: fromHeat ? `0 0 0 1px ${L.paperInk}` : 'none' }} />;
      })}
      <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{t(`board.diffWord.${Math.max(1, Math.min(MAX_DIFFICULTY, value))}` as TKey)}</span>
    </span>
  );
}

// Stroke icons per objective (no emoji, drawn like the mockup).
function GoalIcon({ kind }: { kind: GoalKind }) {
  const common = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: L.paperInk, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (kind === 'rescue')
    return (
      <svg {...common}>
        <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M11 11.5V4a1.5 1.5 0 0 1 3 0v7.5" />
        <path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.3 14a1.5 1.5 0 0 1 2.5-1.7L8 15" />
      </svg>
    );
  if (kind === 'bounty')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    );
  if (kind === 'chase')
    return (
      <svg {...common}>
        <ellipse cx="8" cy="15" rx="2.6" ry="3.6" /><ellipse cx="16" cy="8" rx="2.6" ry="3.6" /><path d="M7 21h2M15 14h2" />
      </svg>
    );
  if (kind === 'ward')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" strokeDasharray="3 2" /><rect x="9" y="7" width="6" height="10" /><path d="M10.5 10h3M10.5 13h3" />
      </svg>
    );
  if (kind === 'timeattack')
    return (
      <svg {...common}>
        <circle cx="12" cy="13.5" r="7.5" /><path d="M12 13.5V9.5M12 13.5l3 2M10 3h4M12 3v3" />
      </svg>
    );
  if (kind === 'firsttrain')
    return (
      <svg {...common}>
        <rect x="5" y="4" width="14" height="13" rx="3" /><path d="M5 11h14M8 21l2-4M16 21l-2-4" /><circle cx="9" cy="14" r="0.8" /><circle cx="15" cy="14" r="0.8" />
      </svg>
    );
  if (kind === 'boss')
    return (
      <svg {...common}>
        <path d="M12 3c2 4 6 5 6 10a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 4 4 0-3-1-5 0-7z" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M4 20 16 8" /><path d="m14 6 4 4" /><path d="M16 4h4v4" />
    </svg>
  );
}

const cell = { background: L.paperCell, borderRadius: 4, padding: '6px 10px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', gap: 4, minWidth: 0, minHeight: 0, overflow: 'hidden' };
const small = { fontSize: 11, color: L.paperDim };

const SHEET_H = 452; // fixed: the board must not change size between offers (user, 2026-10-27)
const clamp2 = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' };

// One offer as a sheet of paper on the clipboard, always the same size: who asks, what they saw,
// the named target (if any), then three rows of cells — objective · difficulty, length · fee
// (+ shards, + what gets finished together), modifiers · ghosts. The district counter ("1 / 2")
// says how many offers this district has (W / S).
export function OfferSheet({ offer, day, known, index, count, join, onJoin, linked = false }: {
  offer: ContractOffer;
  day: number;
  known: boolean;
  index: number;
  count: number;
  join: JoinState;
  onJoin: () => void;
  linked?: boolean; // in a district the 사건 파일 points at
}) {
  const goal = offerGoal(offer);
  const difficulty = offerDifficulty(offer);
  const heat = offerHeat(offer);
  const stampBox = { height: 30, boxSizing: 'border-box' as const, display: 'flex', alignItems: 'center', padding: '0 9px', fontWeight: 700, whiteSpace: 'nowrap' as const, lineHeight: 1 };
  const early = goal.floor < offer.floors - 1;
  const ghosts = offer.kind === 'main' ? ['—'] : known ? offer.pool.map((g) => t(`enemy.${g}` as TKey)) : [t('board.unknown')];
  const name = targetName(offer.target);
  // 현상수배 says only which floor; 추격 cannot say (it ends wherever the quarry is caught).
  const lengthLabel =
    offer.objective === 'chase' ? t('board.whereAny') : offer.objective === 'bounty' ? t('board.where', { floor: goal.floor + 1 }) : early ? t('board.length', { floor: goal.floor + 1 }) : t('board.lengthAll', { floors: offer.floors });
  return (
    <div style={{ position: 'relative', paddingTop: 10 }}>
      {count > 1 && <div aria-hidden="true" style={{ position: 'absolute', left: 16, right: -4, top: 22, bottom: 0, background: L.paperBack[0], borderRadius: 4, transform: 'rotate(2.5deg)' }} />}
      {count > 2 && <div aria-hidden="true" style={{ position: 'absolute', left: 8, right: 2, top: 16, bottom: 0, background: L.paperBack[1], borderRadius: 4, transform: 'rotate(1deg)' }} />}
      <article style={{ position: 'relative', background: L.paper, color: L.paperInk, borderRadius: 4, padding: '22px 18px 14px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 10px 24px rgba(0,0,0,0.45)', height: SHEET_H, boxSizing: 'border-box' }}>
        <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: -12, width: 88, height: 24, marginLeft: -44, background: L.clip, borderRadius: 5, border: '2px solid #5d5870' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ ...small, letterSpacing: 1, whiteSpace: 'nowrap' }}>
              {t(NODES[offer.node].nameKey)} · {t('board.client')}
              {count > 1 && <span style={{ marginLeft: 8, color: L.paperInk, fontWeight: 700 }}>{t('board.districtCount', { index: index + 1, count })}</span>}
            </span>
            <span style={{ fontSize: 21, fontWeight: 700 }}>{offerTitle(offer)}</span>
          </div>
          {offer.deadline !== null ? (
            <span style={{ ...stampBox, border: `2px solid ${L.stamp}`, color: L.stamp, fontSize: 15, transform: 'rotate(-7deg)', marginTop: 4 }}>
              {offer.urgent ? t('board.urgentStamp') + ' ' : ''}{t('board.stamp', { days: Math.max(0, offer.deadline - day) })}
            </span>
          ) : (
            <span style={{ ...stampBox, border: `2px solid ${L.accentInk}`, color: L.accentInk, fontSize: 15, transform: 'rotate(-7deg)', marginTop: 4 }}>
              {t('board.main')}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#3b3140', height: 39, ...clamp2 }}>“{offerBody(offer)}”</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13, height: 20, whiteSpace: 'nowrap' }}>
          {name && (
            <>
              <span style={{ color: L.stamp, fontWeight: 700, fontSize: 16 }}>{t('board.target', { name })}</span>
              <span style={small}>{t(`enemy.${offer.target!.ghost}` as TKey)}</span>
              {offer.target!.level > 0 && <span style={{ ...small, color: L.stamp }}>{t('board.level', { level: offer.target!.level })}</span>}
            </>
          )}
          {linked && <span style={{ fontSize: 11, fontWeight: 700, color: L.stamp }}>{t('board.caseLinked')}</span>}
          {join && join !== 'in' && (
            <span onClick={join === 'can' ? onJoin : undefined}
              style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, cursor: join === 'can' ? 'pointer' : 'default', color: join === 'can' ? L.bundleInk : L.paperDim }}>
              {t(join === 'can' ? 'board.joinHint' : join === 'full' ? 'board.joinFull' : 'board.joinSolo')}
            </span>
          )}
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(3, minmax(0, 1fr))', gap: 8, flex: 1, minHeight: 0 }}>
          <div style={{ ...cell, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <GoalIcon kind={goal.kind} />
            <div style={{ display: 'flex', flexDirection: 'column' }}><span style={small}>{t('board.goal')}</span><span style={{ fontWeight: 700, fontSize: 15 }}>{t(`board.goal.${goal.kind}`)}</span></div>
          </div>
          <div style={cell}>
            <span style={small}>{t('board.difficulty')}</span>
            <DifficultyDots value={difficulty} heat={heat.dots} risk={heat.risk} size={14} />
            {heat.dots > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: L.paperInk }}><span style={{ display: 'inline-block', width: 8, height: 8, marginRight: 4, background: heatColor(heat.risk), outline: `1px solid ${L.paperInk}` }} />{t('board.heatDots', { dots: heat.dots })}</span>}
          </div>
          <div style={cell}>
            <span style={small}>{lengthLabel}</span>
            <span style={{ display: 'flex', gap: 3 }} aria-hidden="true">
              {Array.from({ length: offer.floors }, (_, i) => (
                <span key={i} style={{ flex: 1, height: 12, boxSizing: 'border-box', background: i <= goal.floor ? L.paperInk : 'transparent', border: i <= goal.floor ? 'none' : `1px dashed ${L.paperDim}`, outline: i === goal.floor && early ? `2px solid ${L.stamp}` : 'none', outlineOffset: 1 }} />
              ))}
            </span>
          </div>
          <div style={cell}>
            <span style={small}>{t('board.reward')}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, lineHeight: 1 }}>₩ {offer.fee}</span>
            <span style={{ display: 'flex', gap: 8, fontSize: 12, fontWeight: 700 }}>
              {offer.shards > 0 && <span style={{ color: L.shardInk }}>+ {t('board.shards', { shards: offer.shards })}</span>}
              {heat.fee > 0 && <span style={{ color: L.paperInk }}><span style={{ display: 'inline-block', width: 8, height: 8, marginRight: 4, background: heatColor(heat.risk), outline: `1px solid ${L.paperInk}` }} />{t('board.heatFee', { fee: heat.fee })}</span>}
            </span>
          </div>
          <div style={cell}>
            <span style={small}>{t('board.mods')}</span>
            {offer.kind === 'main' || offer.mods.length === 0 ? (
              <span style={{ color: L.paperDim, fontSize: 13 }}>{t('board.noMods')}</span>
            ) : (
              offer.mods.map((m) => (
                <div key={m} title={t(MODIFIERS[m].descKey)} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: MODIFIERS[m].kind === 'boon' ? L.bundleInk : L.paperInk }}>{t(MODIFIERS[m].nameKey)} <span style={{ fontWeight: 400, fontSize: 11, color: L.paperDim }}>{MODIFIERS[m].kind === 'boon' ? t('board.boon') : `+${Math.round(MODIFIERS[m].feeBonus * 100)}%`}</span></span>
                  {offer.mods.length === 1 && <span style={{ fontSize: 11, color: '#4a3f52', lineHeight: 1.35, ...clamp2 }}>{t(MODIFIERS[m].descKey)}</span>}
                </div>
              ))
            )}
          </div>
          <div style={cell}>
            <span style={small}>{t('board.ghosts')}</span>
            <span style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{ghosts.join(' · ')}</span>
            {heat.ghosts > 0 && <span style={{ fontSize: 11, fontWeight: 700 }}><span style={{ display: 'inline-block', width: 8, height: 8, marginRight: 4, background: heatColor(heat.risk), outline: `1px solid ${L.paperInk}` }} />{t('board.heatGhosts', { n: heat.ghosts })}</span>}
          </div>
          {join === 'in' && (
            <div aria-label={t('board.joined')} onClick={onJoin}
              style={{ position: 'absolute', right: -6, top: '50%', marginTop: -46, width: 92, height: 92, boxSizing: 'border-box', border: `4px double ${L.bundleInk}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-16deg)', color: L.bundleInk, fontWeight: 900, fontSize: 24, letterSpacing: 3, opacity: 0.8, cursor: 'pointer', mixBlendMode: 'multiply' }}>
              {t('board.stampJoined')}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
