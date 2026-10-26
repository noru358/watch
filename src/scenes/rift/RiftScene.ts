import Phaser from 'phaser';
import { input, requestPhase, store } from '../../app/services';
import { eventBus } from '../../core/EventBus';
import { SeededRNG } from '../../core/SeededRNG';
import { CARDS } from '../../data/cards.data';
import { FEEL, PALETTE, SCREEN } from '../../data/feel.data';
import { t } from '../../i18n';
import { CONTRACTS } from '../../data/contracts.data';
import type { GameEvent } from '../../types/events';
import type { CardId } from '../../types/ids';
import { answerPayphone, giveUp, stepFloor, type Floor, type RiftInput } from '../../systems/rift';
import { enterFloor, finishAtGoal, goalReached, leaveFloor, offerCards, pickCard, runResult, startRun, totalFloors, type RunOutcome, type RunState } from '../../systems/run';
import { settings, volumePercent } from '../../app/settings';
import { Overlay } from '../shared/Overlay';
import { RiftHud } from './RiftHud';
import { attachVfx } from '../shared/vfx';
import { RiftView, tileToPx } from './RiftView';
import { loadDirectorFrames } from '../shared/draw/directorFrames';
import { targetName } from '../../app/names';

type Mode = 'play' | 'cards' | 'payphone' | 'goal' | 'paused' | 'end';
const END_INPUT_DELAY = 0.6; // seconds before the end panel accepts input

function cardText(id: CardId): { name: string; desc: string } {
  const c = CARDS[id];
  const params = {
    hp: c.maxHp,
    heal: c.heal,
    slash: c.slash,
    draw: c.draw,
    focus: -c.focusMax,
    bare: c.bareTime,
    combo: c.comboBonus,
    chance: Math.round(c.chance * 100),
    amount: c.amount,
  };
  const deck = c.source === 'base' ? t('card.deck.base') : t(`weapon.${c.source}`);
  return { name: t(`card.${id}.name`), desc: `${t(`card.${id}.desc`, params)}\n\n[${deck}]` };
}

// Simulation events use tile coordinates; the presentation layer wants world pixels.
function toPixels(e: GameEvent): GameEvent {
  return 'x' in e ? { ...e, ...tileToPx(e.x, e.y) } : e;
}

// Night: one contract run, real-time top-down on a tile grid (Core Keeper style).
// Simulation runs on a fixed step; rendering interpolates (Rule 6).
export class RiftScene extends Phaser.Scene {
  private run!: RunState;
  private floor!: Floor;
  private rng!: SeededRNG;
  private view!: RiftView;
  private overlay!: Overlay;
  private worldLayer!: Phaser.GameObjects.Layer;
  private uiLayer!: Phaser.GameObjects.Layer;
  private uiCam!: Phaser.Cameras.Scene2D.Camera;
  private hud!: RiftHud;
  private hurtEdge!: Phaser.GameObjects.Rectangle;
  private mode: Mode = 'play';
  private acc = 0;
  private freezeLeft = 0;
  private sinceFreeze = 99; // seconds since the last hit-stop started
  private offer: CardId[] = [];
  private selected = 0;
  private endDelay = 0;
  private aim = -Math.PI / 2;
  private mouseMoves = -1;
  private mouseIdle = 99;
  private targetName: string | null = null; // 현상수배 / 추격 target on tonight's offer

  constructor() {
    super('rift');
  }

  preload(): void {
    loadDirectorFrames(this);
  }

  create(): void {
    this.mode = 'play';
    this.acc = 0;
    this.freezeLeft = 0;
    // Tonight's seed and what the office sends along (training, skills, supply, trauma).
    const night = store.startNight();
    this.rng = new SeededRNG(night.seed);
    // The offer chosen on the contract board (the board always has one selected before 출동).
    const plan = store.nightPlan() ?? store.firstPlan();
    this.run = startRun({ ...plan, weapon: 'newspaper_sword', loadout: night.loadout });
    const offer = store.getState().board.find((o) => o.id === plan.offerId);
    const story = offer?.kind === 'main' && offer.story ? CONTRACTS[offer.story].targetNameKey : undefined;
    this.targetName = story ? t(story) : targetName(offer?.target ?? null);

    // Two cameras: the zoomed world camera follows the director; the UI camera stays 1:1.
    this.worldLayer = this.add.layer();
    this.uiLayer = this.add.layer().setDepth(100);
    this.uiCam = this.cameras.add(0, 0, SCREEN.width, SCREEN.height);
    this.cameras.main.setZoom(FEEL.zoom).setBackgroundColor(PALETTE.gridWall);
    this.cameras.main.ignore(this.uiLayer);
    this.uiCam.ignore(this.worldLayer);

    this.view = new RiftView(this, this.worldLayer);
    this.overlay = new Overlay(this, this.uiLayer);
    this.hud = new RiftHud(this, this.uiLayer);
    // Hurt feedback: a faint red frame around the screen instead of a full-screen flash.
    this.hurtEdge = this.add.rectangle(0, 0, SCREEN.width, SCREEN.height).setOrigin(0).setStrokeStyle(14, PALETTE.hurtEdge, 1).setAlpha(0);
    this.uiLayer.add(this.hurtEdge);

    const off = attachVfx(this, eventBus, {
      freeze: (s) => this.freeze(s),
      view: this.view,
      layer: this.worldLayer,
      hurtTint: (alpha) => {
        this.hurtEdge.setAlpha(alpha);
        this.tweens.add({ targets: this.hurtEdge, alpha: 0, duration: 260 });
      },
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    this.loadFloor();
    // Dev-only read access for automated play-testing; stripped from production builds.
    if (import.meta.env.DEV) (window as unknown as { __rift?: unknown }).__rift = this;
  }

  // Hit-stop with a cooldown: frequent small hits must not make movement feel sticky.
  // Big moments (hurt, parry, heavy hits) always freeze.
  private freeze(seconds: number): void {
    if (seconds <= FEEL.hitStopHit && this.sinceFreeze < FEEL.hitStopCooldown) return;
    this.sinceFreeze = 0;
    this.freezeLeft = Math.max(this.freezeLeft, seconds);
  }

  private loadFloor(): void {
    this.floor = enterFloor(this.run, this.rng);
    this.view.drawMap(this.floor);
    const cam = this.cameras.main;
    cam.setBounds(-FEEL.tile * 2, -FEEL.tile * 2, (this.floor.cols + 4) * FEEL.tile, (this.floor.rows + 4) * FEEL.tile);
    cam.centerOn(this.floor.player.x * FEEL.tile, this.floor.player.y * FEEL.tile);
    if (this.floor.boss) this.overlay.banner(t('rift.bossIntro'));
    else if (this.floor.vision !== null) this.overlay.banner(t('rift.blackout'));
    input.clearPressed();
    this.acc = 0;
  }

  // Mouse aim while the mouse is in use; otherwise aim follows movement (keyboard play).
  private updateAim(dt: number, moveX: number, moveY: number): void {
    const ptr = input.pointer();
    if (ptr.moves !== this.mouseMoves) {
      this.mouseMoves = ptr.moves;
      this.mouseIdle = 0;
    } else this.mouseIdle += dt;
    if (this.mouseIdle < FEEL.mouseAimTimeout) {
      const rect = this.game.canvas.getBoundingClientRect();
      const gx = ((ptr.x - rect.left) * SCREEN.width) / rect.width;
      const gy = ((ptr.y - rect.top) * SCREEN.height) / rect.height;
      const world = this.cameras.main.getWorldPoint(gx, gy);
      const p = this.floor.player;
      this.aim = Math.atan2(world.y / FEEL.tile - (p.y - 0.5), world.x / FEEL.tile - p.x);
    } else if (moveX || moveY) this.aim = Math.atan2(moveY, moveX);
    else {
      // Keyboard play, standing still: face the nearest ghost in range.
      const p = this.floor.player;
      let best: number = FEEL.keyboardSnapRange;
      for (const e of this.floor.enemies) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < best) {
          best = d;
          this.aim = Math.atan2(e.y - p.y, e.x - p.x);
        }
      }
    }
  }

  private readInput(): RiftInput {
    const ctx = 'night';
    return {
      moveX: (input.isDown('right', ctx) ? 1 : 0) - (input.isDown('left', ctx) ? 1 : 0),
      moveY: (input.isDown('down', ctx) ? 1 : 0) - (input.isDown('up', ctx) ? 1 : 0),
      aim: this.aim,
      attack: input.isDown('attack', ctx),
      dash: input.consume('dash', ctx),
      draw: input.consume('draw', ctx),
      skill: input.consume('skill', ctx),
    };
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.1);
    this.sinceFreeze += dt;
    if (this.mode === 'end') {
      this.endDelay -= dt;
      if (this.endDelay > 0) input.clearPressed();
      else if (input.consume('confirm', 'modal')) {
        requestPhase('day'); // stops this scene immediately; nothing may run after it
        return;
      }
    } else if (this.mode === 'cards') this.updateCards();
    else if (this.mode === 'payphone') this.updatePayphone();
    else if (this.mode === 'goal') this.updateGoal();
    else if (this.mode === 'paused') this.updatePause();
    else if (input.consume('pause', 'night')) this.openPause();
    else if (this.freezeLeft > 0) this.freezeLeft -= dt; // hit-stop
    else this.simulate(dt);
    this.followCamera(dt);
    this.view.render(this.floor, this.acc / FEEL.fixedStep, dt);
    const goal = this.run.floors.findIndex((p) => p.kind === 'normal' && p.goal);
    this.hud.render(this.floor, { floor: this.floor.index + 1, total: totalFloors(this.run), goalFloor: goal >= 0 ? goal + 1 : null, targetName: this.targetName }, dt);
  }

  private simulate(dt: number): void {
    this.acc = Math.min(this.acc + dt, FEEL.fixedStep * FEEL.maxStepsPerFrame);
    while (this.acc >= FEEL.fixedStep && this.mode === 'play') {
      const frame = this.readInput();
      this.updateAim(FEEL.fixedStep, frame.moveX, frame.moveY);
      frame.aim = this.aim;
      stepFloor(this.floor, frame, FEEL.fixedStep, this.rng);
      this.acc -= FEEL.fixedStep;
      const events = this.floor.events;
      this.floor.events = [];
      events.forEach((e) => eventBus.emitEvent(toPixels(e)));
      if (events.some((e) => e.type === 'bossPhase')) this.view.setNeon(true);
      if (events.some((e) => e.type === 'survivorFound')) this.overlay.banner(t('rift.found'));
      if (events.some((e) => e.type === 'quarryFled')) this.overlay.banner(t('rift.quarryFled'));
      if (events.some((e) => e.type === 'wardSealed')) this.overlay.banner(t('rift.wardSealed'));
      // A 괴이 소굴 sealed or opened its doors: the tiles changed, redraw the map.
      if (events.some((e) => e.type === 'lairLocked')) {
        this.view.drawMap(this.floor);
        this.overlay.banner(t('rift.lairLocked'));
      }
      if (events.some((e) => e.type === 'lairOpened')) {
        this.view.drawMap(this.floor);
        this.overlay.banner(t('rift.lairOpened'));
      }
      if (this.floor.status !== 'playing') this.afterFloorChange();
    }
  }

  private followCamera(dt: number): void {
    const cam = this.cameras.main;
    const p = this.floor.player;
    const tx = p.x * FEEL.tile;
    const ty = p.y * FEEL.tile;
    const k = Math.min(1, FEEL.cameraLerp * dt);
    cam.centerOn(cam.midPoint.x + (tx - cam.midPoint.x) * k, cam.midPoint.y + (ty - cam.midPoint.y) * k);
  }

  private afterFloorChange(): void {
    const f = this.floor;
    if (f.status === 'payphone') {
      this.mode = 'payphone';
      this.selected = 0;
      input.push('modal');
      this.overlay.showCards(t('rift.payphoneTitle'), [
        { name: t('rift.payphoneHome'), desc: t('rift.payphoneHomeDesc') },
        { name: t('rift.payphoneStay'), desc: t('rift.payphoneStayDesc') },
      ]);
      return;
    }
    // The contract's goal is done before the last floor: go home with the fee, or keep going.
    if (goalReached(this.run, f)) {
      this.mode = 'goal';
      this.selected = 0;
      input.push('modal');
      this.overlay.showCards(t('rift.goalTitle'), [
        { name: t('rift.goalHome'), desc: t('rift.goalHomeDesc') },
        { name: t('rift.goalStay'), desc: t('rift.goalStayDesc') },
      ]);
      return;
    }
    this.nextFloor(leaveFloor(this.run, f));
  }

  // After a floor: the night ends (outcome) or the next floor follows a card pick.
  private nextFloor(outcome: RunOutcome | null): void {
    if (outcome) {
      const result = runResult(this.run);
      const settlement = store.applyRunResult(result);
      this.mode = 'end';
      this.endDelay = END_INPUT_DELAY;
      input.push('modal');
      this.overlay.showEnd(result, settlement);
      return;
    }
    this.offer = offerCards(this.run, this.rng);
    if (this.offer.length === 0) {
      this.loadFloor();
      return;
    }
    this.selected = 0;
    this.mode = 'cards';
    input.push('modal');
    this.overlay.showCards(t('rift.cardPick'), this.offer.map(cardText));
  }

  // Shared 1/2/3 + A/D + J/Enter selection for overlay cards. Returns the chosen index or -1.
  private choose(count: number): number {
    const choices = ['choice1', 'choice2', 'choice3', 'choice4'] as const;
    let pick = choices.findIndex((c, i) => i < count && input.consume(c, 'modal'));
    if (input.consume('left', 'modal')) this.selected = (this.selected + count - 1) % count;
    if (input.consume('right', 'modal')) this.selected = (this.selected + 1) % count;
    this.overlay.select(this.selected);
    if (pick < 0 && input.consume('confirm', 'modal')) pick = this.selected;
    return pick;
  }

  private updateCards(): void {
    const id = this.offer[this.choose(this.offer.length)];
    if (!id) return;
    pickCard(this.run, id);
    this.overlay.hide();
    input.pop();
    this.mode = 'play';
    this.loadFloor();
  }

  // Pause menu: the simulation simply doesn't step while it is open.
  private openPause(): void {
    this.mode = 'paused';
    this.selected = 0;
    input.push('modal');
    this.showPause();
  }

  private showPause(): void {
    this.overlay.showCards(t('pause.title'), [
      { name: t('pause.resume'), desc: t('pause.resumeDesc') },
      { name: t('pause.controls'), desc: t('pause.controlsDesc') },
      { name: t('pause.sound'), desc: t('pause.soundDesc', { volume: volumePercent() }) },
      { name: t('pause.giveUp'), desc: t('pause.giveUpDesc') },
    ], t('pause.hint'));
    this.overlay.select(this.selected);
  }

  private closePause(): void {
    this.overlay.hide();
    input.pop();
    this.mode = 'play';
  }

  private updatePause(): void {
    if (input.consume('pause', 'modal')) return this.closePause();
    const pick = this.choose(4);
    if (pick === 0) this.closePause();
    if (pick === 2) {
      this.selected = 2;
      settings.stepVolume(-1, true);
      this.showPause();
    }
    if (pick === 3) {
      this.closePause();
      giveUp(this.floor);
      this.afterFloorChange();
    }
  }

  private updateGoal(): void {
    const pick = this.choose(2);
    if (pick < 0) return;
    this.overlay.hide();
    input.pop();
    this.mode = 'play';
    this.nextFloor(pick === 0 ? finishAtGoal(this.run, this.floor) : leaveFloor(this.run, this.floor));
  }

  private updatePayphone(): void {
    const pick = this.choose(2);
    if (pick < 0) return;
    this.overlay.hide();
    input.pop();
    this.mode = 'play';
    answerPayphone(this.floor, pick === 0);
    if (this.floor.status !== 'playing') this.afterFloorChange();
  }

}
