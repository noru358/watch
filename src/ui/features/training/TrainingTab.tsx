import { useSyncExternalStore } from 'react';
import { store } from '../../../app/services';
import { TRAINING, TRAINING_GROUPS, type TrainingLine } from '../../../data/training.data';
import { t } from '../../../i18n';
import { trainingCapped, trainingPrice, trainingRank, type GrowthState } from '../../../systems/growth';
import { trainingCap, trainingCapRaisedAt } from '../../../systems/reputation';
import type { TrainingId } from '../../../types/ids';
import { panelCss as css } from '../panel';
import { priceStyle, rowStyle, useNav } from '../useNav';

const ORDER = TRAINING_GROUPS.flatMap((g) => (Object.keys(TRAINING) as TrainingId[]).filter((id) => TRAINING[id].group === g));

// Total effect of a line at a rank, as the panel shows it ("+8%", "−0.10초", "+2").
export function effectText(line: TrainingLine, rank: number): string {
  const v = line.per * rank;
  const sign = v > 0 ? '+' : v < 0 ? '−' : '±';
  const abs = Math.abs(v);
  if (line.unit === 'pct') return `${sign}${Math.round(abs * 100)}%`;
  if (line.unit === 'sec') return `${sign}${abs.toFixed(2)}${t('unit.sec')}`;
  if (line.unit === 'tiles') return `${sign}${abs.toFixed(2)}${t('unit.tiles')}`;
  return `${sign}${abs}`;
}

export function TrainingTab() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const g = { ...s, rank: s.rankReached } as unknown as GrowthState;
  const buy = (i: number) => store.train(ORDER[i]!);
  const [cursor, setCursor] = useNav(ORDER.length, buy);
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 10 }}>
        {TRAINING_GROUPS.map((group) => (
          <div key={group} style={{ ...css.box, padding: 8 }}>
            <div style={{ ...css.dim, fontSize: 13, padding: '0 10px 4px' }}>{t(`training.group.${group}`)}</div>
            {ORDER.filter((id) => TRAINING[id].group === group).map((id) => {
              const i = ORDER.indexOf(id);
              const line = TRAINING[id];
              const rank = trainingRank(g, id);
              const price = trainingPrice(g, id);
              return (
                <div key={id} style={rowStyle(i === cursor)} data-cursor={i === cursor || undefined} onMouseMove={() => setCursor(i)} onClick={() => buy(i)}>
                  <span style={{ flex: 1, fontSize: 15 }}>{t(line.nameKey)}</span>
                  <span style={{ display: 'flex', gap: 3 }} aria-label={t('training.rank', { rank, max: line.max })}>
                    {Array.from({ length: line.max }, (_, k) => (
                      <span key={k} style={{ width: 8, height: 12, borderRadius: 2, boxSizing: 'border-box', background: k < rank ? '#41e0c8' : k < trainingCap(g.rank, id) ? 'rgba(157,143,196,0.25)' : 'transparent', border: k >= trainingCap(g.rank, id) && k >= rank ? '1px dashed rgba(157,143,196,0.45)' : 'none' }} />
                    ))}
                  </span>
                  <span style={{ minWidth: 64, textAlign: 'right', fontSize: 13, color: '#c9bfe8' }}>{rank > 0 ? effectText(line, rank) : ''}</span>
                  {trainingCapped(g, id) ? (
                    <span style={{ ...priceStyle(false), fontFamily: 'inherit', fontSize: 12 }}>{t('training.capped', { rank: trainingCapRaisedAt(g.rank, id) ?? 0 })}</span>
                  ) : (
                    <span style={priceStyle(price !== null && s.money >= price)}>{price === null ? t('training.max') : t('training.buy', { cost: price })}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={css.hint}>{t('training.keys')}</div>
    </>
  );
}
