import { useEffect, useSyncExternalStore, type ComponentType } from 'react';
import { closeFeature, openPanel } from '../app/features';
import { input } from '../app/services';
import { LOBBY_FEATURES } from '../data/lobby.data';
import { t } from '../i18n';
import type { LobbyFeatureId } from '../types/ids';
import { LedgerPanel } from './features/ledger/LedgerPanel';
import { panelCss as css } from './features/panel';
import { SortiePanel } from './features/sortie/SortiePanel';

const PANELS: Record<LobbyFeatureId, ComponentType> = {
  sortie: SortiePanel,
  ledger: LedgerPanel,
};

// Day overlay: shows the one open hub panel, or nothing (the hub canvas stays clickable).
export function FeatureHost() {
  const open = useSyncExternalStore(openPanel.subscribe, openPanel.get);

  useEffect(() => input.onAction((action, ctx) => ctx === 'modal' && action === 'pause' && closeFeature()), []);

  if (!open) return null;
  const Panel = PANELS[open];
  return (
    <div style={css.shade} onMouseDown={(e) => e.target === e.currentTarget && closeFeature()}>
      <div style={css.card}>
        <div style={css.head}>
          <h2 style={css.title}>{t(LOBBY_FEATURES[open].titleKey)}</h2>
          <span style={css.close}>{t('feature.close')}</span>
        </div>
        <Panel />
      </div>
    </div>
  );
}
