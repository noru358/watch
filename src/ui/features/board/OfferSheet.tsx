import type { JoinState } from './BoardPanel';
import { NODES } from '../../../data/nodes.data';
import { t, type TKey } from '../../../i18n';
import { offerDifficulty, offerGoal, type ContractOffer, type GoalKind } from '../../../systems/office';
import { MODIFIERS } from '../../../data/modifiers.data';
import { offerBody, offerTitle, targetName } from './offerText';
import { BOARD_LOOK as L } from './look';

const MAX_DIFFICULTY = 5;

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

const cell = { background: L.paperCell, borderRadius: 4, padding: '6px 10px', display: 'flex', flexDirection: 'column' as const, gap: 4, minWidth: 0 };
const small = { fontSize: 11, color: L.paperDim };

const SHEET_H = 452; // fixed: the board must not change size between offers (user, 2026-10-27)
const clamp2 = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' };

// One offer as a sheet of paper on the clipboard, always the same size: who asks, what they saw,
// the named target (if any), then three rows of cells — objective · difficulty, length · fee
// (+ shards, + what gets finished together), modifiers · ghosts. The district counter ("1 / 2")
// says how many offers this district has (W / S).
export function OfferSheet({ offer, day, known, index, count, join, onJoin }: {
  offer: ContractOffer;
  day: number;
  known: boolean;
  index: number;
  count: number;
  join: JoinState;
  onJoin: () => void;
}) {
  const goal = offerGoal(offer);
  const difficulty = offerDifficulty(offer);
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
            <span style={{ border: `2px solid ${L.stamp}`, color: L.stamp, fontSize: 15, fontWeight: 700, padding: '2px 8px', transform: 'rotate(-8deg)', whiteSpace: 'nowrap' }}>
              {t('board.stamp', { days: Math.max(0, offer.deadline - day) })}
            </span>
          ) : (
            <span style={{ border: `2px solid ${L.accentInk}`, color: L.accentInk, fontSize: 14, fontWeight: 700, padding: '2px 8px', transform: 'rotate(-6deg)', whiteSpace: 'nowrap' }}>
              {t('board.main')}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#3b3140', height: 39, ...clamp2 }}>“{offerBody(offer)}”</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13, height: 20 }}>
          {name && (
            <>
              <span style={{ color: L.stamp, fontWeight: 700, fontSize: 16 }}>{t('board.target', { name })}</span>
              <span style={small}>{t(`enemy.${offer.target!.ghost}` as TKey)}</span>
              {offer.target!.level > 0 && <span style={{ ...small, color: L.stamp }}>{t('board.level', { level: offer.target!.level })}</span>}
            </>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: '64px 86px 1fr', gap: 9, flex: 1, minHeight: 0 }}>
          <div style={{ ...cell, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <GoalIcon kind={goal.kind} />
            <div style={{ display: 'flex', flexDirection: 'column' }}><span style={small}>{t('board.goal')}</span><span style={{ fontWeight: 700, fontSize: 15 }}>{t(`board.goal.${goal.kind}`)}</span></div>
          </div>
          <div style={cell}>
            <span style={small}>{t('board.difficulty')}</span>
            <span style={{ display: 'flex', gap: 3 }} role="img" aria-label={`${t('board.difficulty')} ${difficulty} / ${MAX_DIFFICULTY}`}>
              {Array.from({ length: MAX_DIFFICULTY }, (_, i) => <span key={i} style={{ width: 16, height: 16, borderRadius: '50% 50% 40% 40%', background: i < difficulty ? L.paperInk : L.paperOff }} />)}
            </span>
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
            {offer.shards > 0 && <span style={{ fontSize: 12, color: L.shardInk, fontWeight: 700 }}>+ {t('board.shards', { shards: offer.shards })}</span>}
            {join && (
              <span onClick={join === 'in' || join === 'can' ? onJoin : undefined}
                style={{ fontSize: 11, fontWeight: 700, cursor: join === 'in' || join === 'can' ? 'pointer' : 'default', color: join === 'in' ? L.bundleInk : join === 'can' ? L.paperInk : L.paperDim }}>
                {t(join === 'in' ? 'board.joined' : join === 'can' ? 'board.joinHint' : join === 'full' ? 'board.joinFull' : 'board.joinSolo')}
              </span>
            )}
          </div>
          <div style={{ ...cell, justifyContent: 'flex-start' }}>
            <span style={small}>{t('board.mods')}</span>
            {offer.kind === 'main' || offer.mods.length === 0 ? (
              <span style={{ color: L.paperDim, fontSize: 13 }}>{t('board.noMods')}</span>
            ) : (
              offer.mods.map((m) => (
                <div key={m} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: MODIFIERS[m].kind === 'boon' ? L.bundleInk : L.paperInk }}>{t(MODIFIERS[m].nameKey)} <span style={{ fontWeight: 400, fontSize: 11, color: L.paperDim }}>{MODIFIERS[m].kind === 'boon' ? t('board.boon') : `+${Math.round(MODIFIERS[m].feeBonus * 100)}%`}</span></span>
                  <span style={{ fontSize: 11, color: '#4a3f52', lineHeight: 1.35, ...clamp2 }}>{t(MODIFIERS[m].descKey)}</span>
                </div>
              ))
            )}
          </div>
          <div style={{ ...cell, justifyContent: 'flex-start' }}>
            <span style={small}>{t('board.ghosts')}</span>
            {ghosts.map((g) => <span key={g} style={{ fontWeight: 700, fontSize: 15 }}>{g}</span>)}
          </div>
        </div>
      </article>
    </div>
  );
}
