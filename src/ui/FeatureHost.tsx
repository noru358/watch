import { useEffect, useSyncExternalStore, type ComponentType } from 'react';
import { closeFeature, openPanel } from '../app/features';
import { input } from '../app/services';
import { LOBBY_FEATURES } from '../data/lobby.data';
import { t } from '../i18n';
import type { LobbyFeatureId } from '../types/ids';
import { LedgerPanel } from './features/ledger/LedgerPanel';
import { panelCss as css } from './features/panel';
import { BoardPanel } from './features/board/BoardPanel';
import { BenchPanel } from './features/bench/BenchPanel';
import { SofaPanel } from './features/sofa/SofaPanel';
import { TrainingPanel } from './features/training/TrainingPanel';
import { MorningPanel } from './features/morning/MorningPanel';
import { DialogueBox } from './DialogueBox';
import { PhoneToast } from './PhoneToast';

const PANELS: Record<LobbyFeatureId, ComponentType> = {
  sortie: BoardPanel,
  ledger: LedgerPanel,
  training: TrainingPanel,
  sofa: SofaPanel,
  bench: BenchPanel,
  morning: MorningPanel,
};

// Day overlay: the story dialogue box, the one open hub panel, or nothing (the hub canvas stays clickable).
export function FeatureHost() {
  return (
    <>
      <Panels />
      <PhoneToast />
      <DialogueBox />
    </>
  );
}

function Panels() {
  const open = useSyncExternalStore(openPanel.subscribe, openPanel.get);

  useEffect(() => input.onAction((action, ctx) => ctx === 'modal' && action === 'pause' && closeFeature()), []);

  if (!open) return null;
  const Panel = PANELS[open];
  return (
    <div style={css.shade} onMouseDown={(e) => e.target === e.currentTarget && closeFeature()}>
      <div style={{ ...css.card, ...(LOBBY_FEATURES[open].wide ? css.cardWide : {}) }}>
        <div style={css.head}>
          <h2 style={css.title}>{t(LOBBY_FEATURES[open].titleKey)}</h2>
          <span style={css.close}>{t('feature.close')}</span>
        </div>
        <Panel />
      </div>
    </div>
  );
}
