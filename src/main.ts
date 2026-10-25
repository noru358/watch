import Phaser from 'phaser';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { forgetFeature } from './app/features';
import { bindPhaseSwitch, input, store } from './app/services';
import { eventBus } from './core/EventBus';
import { PhaseController } from './core/phase';
import { PALETTE, SCREEN } from './data/feel.data';
import { HubScene } from './scenes/hub/HubScene';
import { RiftScene } from './scenes/rift/RiftScene';
import { FeatureHost } from './ui/FeatureHost';

const dayEl = document.getElementById('day-root')!;
const dayRoot = createRoot(dayEl);
// Panels catch their own clicks; empty overlay space lets clicks through to the hub canvas.
dayEl.style.pointerEvents = 'none';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: SCREEN.width,
  height: SCREEN.height,
  backgroundColor: PALETTE.background,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  // Phaser must not grab the keyboard; InputManager owns it (Rule 4).
  input: { keyboard: false },
  scene: [],
});
game.scene.add('rift', RiftScene, false);
game.scene.add('hub', HubScene, false);

const phases = new PhaseController({
  enterDay() {
    input.resetContext('day');
    game.scene.start('hub');
    dayEl.style.display = 'block';
    dayRoot.render(createElement(FeatureHost));
  },
  exitDay() {
    forgetFeature();
    game.scene.stop('hub');
    dayRoot.render(null); // React overlay is unmounted at night
    dayEl.style.display = 'none';
    // Drop focus from the clicked button so Space/Enter can't re-trigger it.
    (document.activeElement as HTMLElement | null)?.blur();
  },
  enterNight() {
    input.resetContext('night');
    game.scene.start('rift');
  },
  exitNight() {
    game.scene.stop('rift');
  },
});

bindPhaseSwitch((phase) => {
  phases.setPhase(phase);
  store.setPhase(phase);
  eventBus.emit('phaseChanged', { phase });
});

phases.setPhase('day');
