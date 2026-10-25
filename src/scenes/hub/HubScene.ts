import Phaser from 'phaser';
import { input, store } from '../../app/services';
import { openFeature } from '../../app/features';
import { HUB_LOOK, PALETTE } from '../../data/feel.data';
import { HUB, HUB_SPOTS } from '../../data/lobby.data';
import { t } from '../../i18n';
import { newHub, spotInReach, stepHub, unlockedSpots, type HubState } from '../../systems/hub';
import type { HubSpotId } from '../../types/ids';
import { T } from '../rift/draw/common';
import { loadDirectorFrames } from '../rift/draw/directorFrames';
import { crisp } from '../shared/text';
import { HubView } from './HubView';

// Day: the rooftop office you walk around in (souls-style). E on someone opens their panel;
// the iron door opens tonight's contract. Panels are React; while one is open the input
// context is `modal`, so this scene reads no keys (Rule 4).
export class HubScene extends Phaser.Scene {
  private hub!: HubState;
  private view!: HubView;
  private prompt!: Phaser.GameObjects.Text;
  private acc = 0;
  private clock = 0;

  constructor() {
    super('hub');
  }

  preload(): void {
    loadDirectorFrames(this);
  }

  create(): void {
    this.hub = newHub();
    this.acc = 0;
    this.clock = 0;
    this.cameras.main.setZoom(HUB_LOOK.zoom).setBackgroundColor(HUB_LOOK.sky).centerOn((HUB.cols * T) / 2, (HUB.rows * T) / 2);
    this.view = new HubView(this);
    const text = (size: number) =>
      crisp(this.add.text(0, 0, '', { fontFamily: PALETTE.font, fontSize: `${size}px`, color: PALETTE.text, backgroundColor: '#1d1830cc', padding: { x: 6, y: 3 } }))
        .setScale(1 / HUB_LOOK.zoom)
        .setOrigin(0.5, 1);
    this.prompt = text(HUB_LOOK.promptSize).setVisible(false);
    text(HUB_LOOK.hintSize).setText(t('hub.hint')).setPosition((HUB.cols * T) / 2, HUB.rows * T + 14).setColor(PALETTE.textDim);
    input.clearPressed();
    // Dev-only read access for automated play-testing; stripped from production builds.
    if (import.meta.env.DEV) (window as unknown as { __hub?: unknown }).__hub = this;
  }

  private progress() {
    return { solved: store.getState().solved };
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.1);
    this.clock += dt;
    const ctx = 'day';
    const move = {
      moveX: (input.isDown('right', ctx) ? 1 : 0) - (input.isDown('left', ctx) ? 1 : 0),
      moveY: (input.isDown('down', ctx) ? 1 : 0) - (input.isDown('up', ctx) ? 1 : 0),
    };
    this.acc = Math.min(this.acc + dt, HUB.step * 5);
    while (this.acc >= HUB.step) {
      stepHub(this.hub, move, HUB.step);
      this.acc -= HUB.step;
    }
    const near = spotInReach(this.hub, this.progress());
    if (near && input.consume('interact', ctx)) openFeature(HUB_SPOTS[near].feature);
    this.showPrompt(input.context === ctx ? near : null);
    this.view.render(this.hub, this.acc / HUB.step, this.clock, unlockedSpots(this.progress()));
  }

  private showPrompt(spot: HubSpotId | null): void {
    this.prompt.setVisible(spot !== null);
    if (!spot) return;
    const s = HUB_SPOTS[spot];
    this.prompt.setText(t(s.promptKey)).setPosition(s.x * T, s.y * T - 34);
  }
}
