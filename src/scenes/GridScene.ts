import Phaser from 'phaser';
import { input, requestPhase, store } from '../app/services';
import { eventBus } from '../core/EventBus';
import { SeededRNG } from '../core/SeededRNG';
import { PALETTE } from '../data/feel.data';
import { GRID_CARDS, GRID_FEEL } from '../data/grid.data';
import { t } from '../i18n';
import type { GameEvent } from '../types/events';
import type { GridCardId } from '../types/ids';
import {
  enterFloor,
  gridResult,
  leaveFloor,
  offerGridCards,
  pickGridCard,
  takeTurn,
  totalFloors,
  type Dir,
  type GridAction,
  type GridFloor,
  type GridRun,
  startGridRun,
} from '../systems/grid';
import { Overlay } from './Overlay';
import { attachVfx } from './vfx';
import { GridView, tileToPx } from './GridView';

type Mode = 'play' | 'offer' | 'end';
const END_INPUT_DELAY = 0.6;
const TEXT = { fontFamily: PALETTE.font, fontSize: '15px', color: PALETTE.text };

const DIR_ACTIONS = [
  ['up', { x: 0, y: -1 }],
  ['down', { x: 0, y: 1 }],
  ['left', { x: -1, y: 0 }],
  ['right', { x: 1, y: 0 }],
] as const satisfies readonly (readonly ['up' | 'down' | 'left' | 'right', Dir])[];

function cardText(id: GridCardId): { name: string; desc: string } {
  const c = GRID_CARDS[id];
  const params = { hp: c.maxHp, heal: c.heal, slash: c.slash, draw: c.draw, focus: -c.focusMax };
  return { name: t(`grid.card.${id}.name`), desc: t(`grid.card.${id}.desc`, params) };
}

// Simulation events use tile coordinates; the presentation layer wants pixels.
function toPixels(e: GameEvent): GameEvent {
  if (!('x' in e)) return e;
  return { ...e, ...tileToPx(e.x, e.y) };
}

// Night, grid turn-based prototype (Mystery Dungeon style) for comparison with RiftScene.
export class GridScene extends Phaser.Scene {
  private run!: GridRun;
  private floor!: GridFloor;
  private rng!: SeededRNG;
  private view!: GridView;
  private overlay!: Overlay;
  private hud!: Phaser.GameObjects.Text;
  private focusLabel!: Phaser.GameObjects.Text;
  private hudG!: Phaser.GameObjects.Graphics;
  private mode: Mode = 'play';
  private repeat = 0;
  private freezeLeft = 0;
  private offer: GridCardId[] = [];
  private selected = 0;
  private endDelay = 0;

  constructor() {
    super('grid');
  }

  create(): void {
    this.mode = 'play';
    this.freezeLeft = 0;
    this.rng = new SeededRNG(store.takeRunSeed());
    this.run = startGridRun();
    this.view = new GridView(this);
    this.overlay = new Overlay(this);
    this.hudG = this.add.graphics().setDepth(50);
    this.hud = this.add.text(12, 6, '', TEXT).setDepth(51);
    this.focusLabel = this.add.text(636, 6, t('grid.focus'), TEXT).setOrigin(1, 0).setDepth(51);
    const off = attachVfx(this, eventBus, { freeze: (s) => (this.freezeLeft = Math.max(this.freezeLeft, s)), view: this.view });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    this.loadFloor();
    if (import.meta.env.DEV) (window as unknown as { __grid?: unknown }).__grid = this;
  }

  private loadFloor(): void {
    this.floor = enterFloor(this.run, this.rng);
    this.view.drawMap(this.floor);
    input.clearPressed();
  }

  private readAction(dt: number): GridAction | null {
    const ctx = 'night';
    if (input.consume('attack', ctx)) return { kind: 'slash' };
    if (input.consume('tool', ctx)) return { kind: 'draw' };
    if (input.consume('roll', ctx)) return { kind: 'wait' };
    for (const [action, dir] of DIR_ACTIONS) {
      if (input.consume(action, ctx)) {
        this.repeat = GRID_FEEL.moveRepeat * 2; // a short pause before auto-repeat kicks in
        return { kind: 'move', dir };
      }
    }
    this.repeat -= dt;
    if (this.repeat > 0) return null;
    for (const [action, dir] of DIR_ACTIONS) {
      if (input.isDown(action, ctx)) {
        this.repeat = GRID_FEEL.moveRepeat;
        return { kind: 'move', dir };
      }
    }
    return null;
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.1);
    if (this.mode === 'end') {
      this.endDelay -= dt;
      if (this.endDelay > 0) input.clearPressed();
      else if (input.consume('confirm', 'modal')) {
        requestPhase('day'); // stops this scene immediately; nothing may run after it
        return;
      }
    } else if (this.mode === 'offer') this.updateOffer();
    else if (this.freezeLeft > 0) this.freezeLeft -= dt;
    else this.play(dt);
    this.view.render(this.floor, dt);
    this.renderHud();
  }

  private play(dt: number): void {
    const action = this.readAction(dt);
    if (!action || !takeTurn(this.floor, action, this.rng)) return;
    const events = this.floor.events;
    this.floor.events = [];
    events.forEach((e) => eventBus.emitEvent(toPixels(e)));
    if (this.floor.status === 'playing') return;
    const outcome = leaveFloor(this.run, this.floor);
    if (outcome) {
      const result = gridResult(this.run);
      const settlement = store.applyRunResult(result);
      this.mode = 'end';
      this.endDelay = END_INPUT_DELAY;
      input.push('modal');
      this.overlay.showEnd(result, settlement);
      return;
    }
    this.offer = offerGridCards(this.rng);
    this.selected = 0;
    this.mode = 'offer';
    input.push('modal');
    this.overlay.showCards(this.offer.map(cardText));
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
    pickGridCard(this.run, id);
    this.overlay.hide();
    input.pop();
    this.mode = 'play';
    this.loadFloor();
  }

  private renderHud(): void {
    const f = this.floor;
    const p = f.player;
    const g = this.hudG;
    g.clear();
    for (let i = 0; i < f.stats.maxHp; i++) g.fillStyle(i < p.hp ? PALETTE.hpBar : PALETTE.hpBarBack).fillRect(300 + i * 12, 9, 9, 12);
    for (let i = 0; i < f.stats.focusMax; i++) g.fillStyle(i < p.focus ? PALETTE.playerRoll : PALETTE.hpBarBack).fillRect(640 + i * 16, 9, 13, 12);
    this.hud.setText(`${t('grid.floor', { current: this.run.floorIndex + 1, total: totalFloors() })}   ${t('hud.loot', { value: f.loot })}`);
    this.focusLabel.setColor(p.focus >= f.stats.focusMax ? PALETTE.healText : PALETTE.text);
  }
}
