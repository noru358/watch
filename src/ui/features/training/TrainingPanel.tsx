import { useEffect, useState, useSyncExternalStore } from 'react';
import { input, store } from '../../../app/services';
import { t } from '../../../i18n';
import { panelCss as css } from '../panel';
import { SkillsTab } from './SkillsTab';
import { TrainingTab } from './TrainingTab';

// The director's desk: 트레이닝 (money) and 기술 (심연 파편). 1 / 2 switch tabs.
export function TrainingPanel() {
  const [tab, setTab] = useState<'training' | 'skills'>('training');
  const s = useSyncExternalStore(store.subscribe, store.getState);
  useEffect(
    () =>
      input.onAction((action, ctx) => {
        if (ctx !== 'modal') return;
        if (action === 'choice1') setTab('training');
        if (action === 'choice2') setTab('skills');
      }),
    [],
  );
  const tabStyle = (on: boolean): React.CSSProperties => ({
    ...css.chip, fontSize: 14, padding: '6px 14px', color: on ? '#14101f' : '#f6e7c1', background: on ? '#41e0c8' : css.chip.background,
  });
  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button style={tabStyle(tab === 'training')} onClick={() => setTab('training')}>1 {t('training.tab.training')}</button>
        <button style={tabStyle(tab === 'skills')} onClick={() => setTab('skills')}>2 {t('training.tab.skills')}</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 15 }}>
          {tab === 'training' ? t('training.money', { money: s.money }) : t('skill.shards', { shards: s.shards })}
        </span>
      </div>
      {tab === 'training' ? <TrainingTab key="t" /> : <SkillsTab key="s" />}
    </>
  );
}
