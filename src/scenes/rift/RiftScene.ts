import Phaser from 'phaser';
import { input, requestPhase, store } from '../../app/services';
import { eventBus } from '../../core/EventBus';
import { SeededRNG } from '../../core/SeededRNG';
import { PARTY } from '../../data/companions.data';
import { FEEL } from '../../data/feel.data';
import { t } from '../../i18n';
import type { TraitId } from '../../types/ids';
import { step, type InputFrame, type World } from '../../systems/combat';
import { enterRoom, leaveRoom, offerTraits, pickTrait, runResult, shouldOfferTraits, startRun, type RunState } from '../../systems/run';
import { CombatHud } from './CombatHud';
import { Overlay } from '../shared/Overlay';
import { attachVfx } from '../shared/vfx';
import { WorldView } from './WorldView';

type Mode = 'play' | 'offer' | 'end';
const END_INPUT_DELAY = 0.6; // seconds before the end panel accepts input

// Night: one contract run. Simulation runs on a fixed step; rendering interpolates (Rule 6).
export class RiftScene extends Phaser.Scene {
  private run!: RunState;
  private world!: World;
  private rng!: SeededRNG;
  private view!: WorldView;
  private hud!: CombatHud;
  private overlay!: Overlay;
  private mode: Mode = 'play';
  private acc = 0;
  private freezeLeft = 0;
  private offer: TraitId[] = [];
  private selected = 0;
  private endDelay = 0;

  constructor() {
    super('rift');
  }

  create(): void {
    this.mode = 'play';
    this.acc = 0;
    this.freezeLeft = 0;
    this.rng = new SeededRNG(store.takeRunSeed());
    this.run = startRun({ contractId: 'euljiro_printer', level: 1, tool: 'talisman', party: PARTY }, this.rng);
    this.view = new WorldView(this);
    this.overlay = new Overlay(this);
    const off = attachVfx(this, eventBus, {
      freeze: (s) => (this.freezeLeft = Math.max(this.freezeLeft, s)),
      view: this.view,
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    this.loadRoom();
    this.hud = new CombatHud(this, this.world);
    // Dev-only read access for automated play-testing; stripped from production builds.
    if (import.meta.env.DEV) (window as unknown as { __rift?: unknown }).__rift = this;
  }

  private loadRoom(): void {
    this.world = enterRoom(this.run, this.rng);
    this.view.drawRoom(this.world);
    this.view.setNeon(false);
    input.clearPressed();
    if (this.world.roomKind === 'boss') this.overlay.banner(t('room.bossIntro'));
  }

  private readInput(): InputFrame {
    const ctx = 'night';
    return {
      moveX: (input.isDown('right', ctx) ? 1 : 0) - (input.isDown('left', ctx) ? 1 : 0),
      moveY: (input.isDown('down', ctx) ? 1 : 0) - (input.isDown('up', ctx) ? 1 : 0),
      attack: input.isDown('attack', ctx),
      roll: input.consume('roll', ctx),
      tool: input.consume('tool', ctx),
      call: input.consume('call', ctx),
      interact: input.consume('confirm', ctx),
    };
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.1);
    if (this.mode === 'end' && this.updateEnd(dt)) {
      // Switching phase stops this scene immediately, so nothing may run after it.
      requestPhase('day');
      return;
    }
    if (this.mode === 'offer') this.updateOffer();
    else if (this.mode === 'play') this.simulate(dt);
    this.view.render(this.world, this.acc / FEEL.fixedStep, deltaMs);
    this.hud.render(this.world, this.run);
  }

  private simulate(dt: number): void {
    if (this.freezeLeft > 0) {
      this.freezeLeft -= dt; // hit-stop: the world holds still for a moment
      return;
    }
    this.acc = Math.min(this.acc + dt, FEEL.fixedStep * FEEL.maxStepsPerFrame);
    while (this.acc >= FEEL.fixedStep && this.mode === 'play') {
      step(this.world, this.readInput(), FEEL.fixedStep, this.rng);
      this.acc -= FEEL.fixedStep;
      const events = this.world.events;
      this.world.events = [];
      events.forEach((e) => eventBus.emitEvent(e));
      this.checkTransitions();
    }
  }

  private checkTransitions(): void {
    const w = this.world;
    if (shouldOfferTraits(this.run, w)) {
      this.offer = offerTraits(this.run, this.rng);
      if (this.offer.length > 0) {
        this.mode = 'offer';
        this.selected = 0;
        input.push('modal');
        this.overlay.showTraitOffer(this.offer);
      }
      return;
    }
    if (w.status === 'exited') {
      leaveRoom(this.run, w);
      this.loadRoom();
      this.acc = 0;
      return;
    }
    if (w.status === 'extracted' || w.status === 'dead' || w.status === 'bossDefeated') {
      leaveRoom(this.run, w);
      const result = runResult(this.run);
      const settlement = store.applyRunResult(result);
      this.mode = 'end';
      this.endDelay = END_INPUT_DELAY;
      input.push('modal');
      this.overlay.showEnd(result, settlement);
    }
  }

  private updateOffer(): void {
    const choices = ['choice1', 'choice2', 'choice3'] as const;
    let pick = choices.findIndex((c, i) => i < this.offer.length && input.consume(c, 'modal'));
    if (input.consume('left', 'modal')) this.selected = (this.selected + this.offer.length - 1) % this.offer.length;
    if (input.consume('right', 'modal')) this.selected = (this.selected + 1) % this.offer.length;
    this.overlay.select(this.selected);
    if (pick < 0 && input.consume('confirm', 'modal')) pick = this.selected;
    const id = this.offer[pick];
    if (!id) return;
    pickTrait(this.run, this.world, id);
    this.overlay.hide();
    input.pop();
    input.clearPressed();
    this.mode = 'play';
  }

  // Returns true when the player confirms leaving the night.
  private updateEnd(dt: number): boolean {
    this.endDelay -= dt;
    if (this.endDelay > 0) {
      input.clearPressed();
      return false;
    }
    return input.consume('confirm', 'modal');
  }
}
