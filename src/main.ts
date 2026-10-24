import Phaser from 'phaser';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { bindPhaseSwitch, getNightMode, input, store } from './app/services';
import { eventBus } from './core/EventBus';
import { PhaseController } from './core/phase';
import { ROOM_SIZE } from './data/contracts.data';
import { PALETTE } from './data/feel.data';
import { GridScene } from './scenes/grid/GridScene';
import { RiftScene } from './scenes/rift/RiftScene';
import { OfficeApp } from './ui/OfficeApp';

const dayEl = document.getElementById('day-root')!;
const dayRoot = createRoot(dayEl);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: ROOM_SIZE.width,
  height: ROOM_SIZE.height,
  backgroundColor: PALETTE.background,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  // Phaser must not grab the keyboard; InputManager owns it (Rule 4).
  input: { keyboard: false },
  scene: [],
});
game.scene.add('rift', RiftScene, false);
game.scene.add('grid', GridScene, false);

const phases = new PhaseController({
  enterDay() {
    input.resetContext('day');
    dayEl.style.display = 'block';
    dayRoot.render(createElement(OfficeApp));
  },
  exitDay() {
    dayRoot.render(null); // React overlay is unmounted at night
    dayEl.style.display = 'none';
    // Drop focus from the clicked button so Space/Enter can't re-trigger it.
    (document.activeElement as HTMLElement | null)?.blur();
  },
  enterNight() {
    input.resetContext('night');
    game.scene.start(getNightMode() === 'grid' ? 'grid' : 'rift');
  },
  exitNight() {
    game.scene.stop('rift');
    game.scene.stop('grid');
  },
});

bindPhaseSwitch((phase) => {
  phases.setPhase(phase);
  store.setPhase(phase);
  eventBus.emit('phaseChanged', { phase });
});

phases.setPhase('day');
