import Phaser from 'phaser';
import { input, store } from '../../app/services';
import { openFeature } from '../../app/features';
import { playScene } from '../../app/dialogue';
import { nextScene } from '../../systems/story';
import { chapterStatus } from '../../systems/office';
import { CHAPTER_IDS } from '../../data/chapters.data';
import { PALETTE } from '../../data/feel.data';
import { HUB_LOOK } from '../../data/hubLook.data';
import { HUB, HUB_SPOTS } from '../../data/lobby.data';
import { t } from '../../i18n';
import { newHub, propsPresent, spotInReach, stepHub, unlockedSpots, type HubState } from '../../systems/hub';
import type { HubSpotId } from '../../types/ids';
import { T } from '../shared/draw/common';
import { loadDirectorFrames } from '../shared/draw/directorFrames';
import { crisp } from '../shared/text';
import { HubView } from './HubView';
import { CHATTER, RENT_TALK } from '../../data/story.data';
import { OFFICE } from '../../data/office.data';
import { showPhoneText } from '../../app/toast';

let rentTextDay = -1; // the landlady texts once per rent morning

// Day: inside the office, walked around souls-style. E on someone opens their panel;
// the front door opens tonight's contract. Panels are React; while one is open the input
// context is `modal`, so this scene reads no keys (Rule 4).
export class HubScene extends Phaser.Scene {
  private hub!: HubState;
  private view!: HubView;
  private prompt!: Phaser.GameObjects.Text;
  private bubble!: Phaser.GameObjects.Text;
  private chatterT: number = CHATTER.firstAfter;
  private chatterLine = 0;
  private calendar!: Phaser.GameObjects.Text;
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
    this.cameras.main.setZoom(HUB_LOOK.zoom).setBackgroundColor(HUB_LOOK.backdrop).centerOn((HUB.cols * T) / 2, (HUB.rows * T) / 2);
    this.view = new HubView(this);
    const text = (size: number) =>
      crisp(this.add.text(0, 0, '', { fontFamily: PALETTE.font, fontSize: `${size}px`, color: PALETTE.text, backgroundColor: '#1d1830cc', padding: { x: 6, y: 3 } }))
        .setScale(1 / HUB_LOOK.zoom)
        .setOrigin(0.5, 1);
    this.prompt = text(HUB_LOOK.promptSize).setVisible(false);
    this.bubble = crisp(
      this.add.text(0, 0, '', {
        fontFamily: PALETTE.font,
        fontSize: `${HUB_LOOK.bubbleSize}px`,
        color: HUB_LOOK.bubbleInk,
        backgroundColor: HUB_LOOK.bubbleBg,
        padding: { x: 10, y: 6 },
        wordWrap: { width: HUB_LOOK.bubbleWidth, useAdvancedWrap: true },
      }),
    )
      .setScale(1 / HUB_LOOK.zoom)
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.chatterT = CHATTER.firstAfter;
    text(HUB_LOOK.hintSize).setText(t('hub.hint')).setPosition((HUB.cols * T) / 2, HUB.rows * T + 14).setColor(PALETTE.textDim);
    input.clearPressed();
    // A story scene that is due plays as soon as the director is home (once each).
    const s = store.getState();
    this.calendar = crisp(this.add.text(HUB_LOOK.calendar.x * T, HUB_LOOK.calendar.y, '', { fontFamily: PALETTE.font, fontSize: '22px', fontStyle: 'bold', color: '#c0392b' }))
      .setScale(1 / HUB_LOOK.zoom)
      .setOrigin(0.5, 0);
    this.updateCalendar();
    const m = s.lastMorning;
    if (m?.rentDue && rentTextDay !== s.day) {
      rentTextDay = s.day;
      const key = m.debtAdded > 0 ? RENT_TALK.short[s.day % RENT_TALK.short.length]! : m.rentPaid > OFFICE.rent ? RENT_TALK.cleared : RENT_TALK.paid[s.day % RENT_TALK.paid.length]!;
      this.time.delayedCall(HUB_LOOK.rentTextDelay, () => showPhoneText(t(RENT_TALK.from), t(key, { paid: m.rentPaid, debt: store.getState().debt })));
    }
    const chapters = Object.fromEntries(CHAPTER_IDS.map((id) => [id, chapterStatus(s, id)]));
    const scene = nextScene({ seen: s.seen, solved: s.solved, chapters });
    if (scene) this.time.delayedCall(HUB_LOOK.sceneDelay, () => playScene(scene));
    // Dev-only read access for automated play-testing; stripped from production builds.
    if (import.meta.env.DEV) (window as unknown as { __hub?: unknown }).__hub = this;
  }

  private progress() {
    const s = store.getState();
    return { solved: s.solved, facilities: s.facilities };
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
      stepHub(this.hub, move, HUB.step, this.progress());
      this.acc -= HUB.step;
    }
    const near = spotInReach(this.hub, this.progress());
    if (near && input.consume('interact', ctx)) openFeature(HUB_SPOTS[near].feature);
    this.showPrompt(input.context === ctx ? near : null);
    this.updateChatter(dt, input.context === ctx);
    this.view.render(this.hub, this.acc / HUB.step, this.clock, unlockedSpots(this.progress()), propsPresent(this.progress()));
  }

  // Mockup B: the bookkeeper now and then says one short line above her desk (only while the office
  // is idle; never the same line twice in a row).
  private updateChatter(dt: number, idle: boolean): void {
    const here = unlockedSpots(this.progress()).includes('bookkeeper');
    if (!here || !idle) {
      this.bubble.setVisible(false);
      return;
    }
    this.chatterT -= dt;
    if (this.chatterT > 0) {
      if (this.chatterT < CHATTER.every - CHATTER.show) this.bubble.setVisible(false);
      return;
    }
    this.chatterT = CHATTER.every;
    const lines = CHATTER.bookkeeper;
    // The day before rent, the first thing she says is about rent.
    const rentTomorrow = this.rentIn() === 1 && this.chatterLine === 0;
    const key = rentTomorrow ? RENT_TALK.reminder : lines[this.chatterLine % lines.length]!;
    this.chatterLine += 1;
    const spot = HUB_SPOTS.bookkeeper;
    this.bubble.setText(t(key)).setPosition(spot.x * T, spot.y * T - 40).setVisible(true);
  }

  private rentIn(): number {
    return OFFICE.rentEvery - (store.getState().day % OFFICE.rentEvery);
  }

  // The wall calendar: days to rent, red and loud the day before.
  private updateCalendar(): void {
    const d = this.rentIn();
    this.calendar.setText(d === 1 ? t('hub.calendar.tomorrow') : t('hub.calendar.days', { days: d }));
    this.calendar.setFontSize(d === 1 ? 18 : 22); // "내일!" is wider than "D-3"; keep it on the page
  }

  private showPrompt(spot: HubSpotId | null): void {
    this.prompt.setVisible(spot !== null);
    if (!spot) return;
    const s = HUB_SPOTS[spot];
    this.prompt.setText(t(s.promptKey)).setPosition(s.x * T, s.y * T - 34);
  }
}
