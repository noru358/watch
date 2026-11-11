import Phaser from 'phaser';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { forgetFeature } from './app/features';
import { forgetScene } from './app/dialogue';
import { bindPhaseSwitch, input, requestPhase, store } from './app/services';
import { eventBus } from './core/EventBus';
import { PhaseController } from './core/phase';
import { PALETTE, SCREEN, UI_STAGE } from './data/feel.data';
import { HubScene } from './scenes/hub/HubScene';
import { RiftScene } from './scenes/rift/RiftScene';
import { TitleScene } from './scenes/title/TitleScene';
import { FeatureHost } from './ui/FeatureHost';

const dayEl = document.getElementById('day-root')!;
// Panels catch their own clicks; empty overlay space lets clicks through to the hub canvas.
dayEl.style.pointerEvents = 'none';
// The panels' stage: UI_STAGE pixels, scaled to fit the window and centred like the canvas.
const stage = document.createElement('div');
Object.assign(stage.style, { position: 'absolute', left: '50%', top: '50%', width: `${UI_STAGE.width}px`, height: `${UI_STAGE.height}px`, transformOrigin: 'center' });
dayEl.appendChild(stage);
const fitStage = () => {
  const k = Math.min(window.innerWidth / UI_STAGE.width, window.innerHeight / UI_STAGE.height);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
};
fitStage();
window.addEventListener('resize', fitStage);
const dayRoot = createRoot(stage);

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
game.scene.add('title', TitleScene, false);

const phases = new PhaseController({
  enterTitle() {
    input.resetContext('day');
    game.scene.start('title');
  },
  exitTitle() {
    game.scene.stop('title');
  },
  enterDay() {
    input.resetContext('day');
    game.scene.start('hub');
    dayEl.style.display = 'block';
    dayRoot.render(createElement(FeatureHost));
  },
  exitDay() {
    forgetFeature();
    forgetScene();
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

requestPhase('title');
