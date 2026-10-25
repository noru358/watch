import Phaser from 'phaser';
import { input, requestPhase, store } from '../../app/services';
import { eventBus } from '../../core/EventBus';
import { SeededRNG } from '../../core/SeededRNG';
import { CARDS } from '../../data/cards.data';
import { FEEL, PALETTE } from '../../data/feel.data';
import { t } from '../../i18n';
import type { GameEvent } from '../../types/events';
import type { CardId } from '../../types/ids';
import { answerPayphone, takeTurn, type Dir, type Floor, type RiftAction } from '../../systems/rift';
import { enterFloor, leaveFloor, offerCards, pickCard, runResult, startRun, totalFloors, type RunState } from '../../systems/run';
import { Overlay } from '../shared/Overlay';
import { attachVfx } from '../shared/vfx';
import { RiftView, tileToPx } from './RiftView';

type Mode = 'play' | 'cards' | 'payphone' | 'end';
const END_INPUT_DELAY = 0.6; // seconds before the end panel accepts input
const TEXT = { fontFamily: PALETTE.font, fontSize: '15px', color: PALETTE.text };

const DIR_ACTIONS = [
  ['up', { x: 0, y: -1 }],
  ['down', { x: 0, y: 1 }],
  ['left', { x: -1, y: 0 }],
  ['right', { x: 1, y: 0 }],
] as const satisfies readonly (readonly ['up' | 'down' | 'left' | 'right', Dir])[];

function cardText(id: CardId): { name: string; desc: string } {
  const c = CARDS[id];
  const params = {
    hp: c.maxHp,
    heal: c.heal,
    slash: c.slash,
    draw: c.draw,
    focus: -c.focusMax,
    bare: c.bareTurns,
    combo: c.comboBonus,
    chance: Math.round(c.chance * 100),
    amount: c.amount,
  };
  const deck = c.source === 'base' ? t('card.deck.base') : t(`weapon.${c.source}`);
  return { name: t(`card.${id}.name`), desc: `${t(`card.${id}.desc`, params)}\n\n[${deck}]` };
}

// Simulation events use tile coordinates; the presentation layer wants pixels.
function toPixels(e: GameEvent): GameEvent {
  return 'x' in e ? { ...e, ...tileToPx(e.x, e.y) } : e;
}

// Night: one contract run, Mystery-Dungeon style (one action = one turn).
export class RiftScene extends Phaser.Scene {
  private run!: RunState;
  private floor!: Floor;
  private rng!: SeededRNG;
  private view!: RiftView;
  private overlay!: Overlay;
  private hud!: Phaser.GameObjects.Text;
  private focusLabel!: Phaser.GameObjects.Text;
  private hudG!: Phaser.GameObjects.Graphics;
  private mode: Mode = 'play';
  private repeat = 0;
  private freezeLeft = 0;
  private offer: CardId[] = [];
  private selected = 0;
  private endDelay = 0;

  constructor() {
    super('rift');
  }

  create(): void {
    this.mode = 'play';
    this.freezeLeft = 0;
    this.rng = new SeededRNG(store.takeRunSeed());
    this.run = startRun({ contractId: 'euljiro_printer', level: 1, weapon: 'newspaper_sword' });
    this.view = new RiftView(this);
    this.overlay = new Overlay(this);
    this.hudG = this.add.graphics().setDepth(50);
    this.hud = this.add.text(12, 6, '', TEXT).setDepth(51);
    this.focusLabel = this.add.text(636, 6, t('rift.focus'), TEXT).setOrigin(1, 0).setDepth(51);
    const off = attachVfx(this, eventBus, { freeze: (s) => (this.freezeLeft = Math.max(this.freezeLeft, s)), view: this.view });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    this.loadFloor();
    // Dev-only read access for automated play-testing; stripped from production builds.
    if (import.meta.env.DEV) (window as unknown as { __rift?: unknown }).__rift = this;
  }

  private loadFloor(): void {
    this.floor = enterFloor(this.run, this.rng);
    this.view.drawMap(this.floor);
    if (this.floor.boss) this.overlay.banner(t('rift.bossIntro'));
    input.clearPressed();
  }

  private readAction(dt: number): RiftAction | null {
    const ctx = 'night';
    if (input.consume('attack', ctx)) return { kind: 'slash' };
    if (input.consume('draw', ctx)) return { kind: 'draw' };
    if (input.consume('wait', ctx)) return { kind: 'wait' };
    for (const [action, dir] of DIR_ACTIONS) {
      if (input.consume(action, ctx)) {
        this.repeat = FEEL.moveRepeat * 2; // a short pause before auto-repeat kicks in
        return { kind: 'move', dir };
      }
    }
    this.repeat -= dt;
    if (this.repeat > 0) return null;
    for (const [action, dir] of DIR_ACTIONS) {
      if (input.isDown(action, ctx)) {
        this.repeat = FEEL.moveRepeat;
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
    } else if (this.mode === 'cards') this.updateCards();
    else if (this.mode === 'payphone') this.updatePayphone();
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
    if (events.some((e) => e.type === 'bossPhase')) this.view.setNeon(true);
    this.afterTurn();
  }

  private afterTurn(): void {
    const f = this.floor;
    if (f.status === 'playing') return;
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
    const outcome = leaveFloor(this.run, f);
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

  // Shared 1/2/3 + A/D + J selection for overlay cards. Returns the chosen index or -1.
  private choose(count: number): number {
    const choices = ['choice1', 'choice2', 'choice3'] as const;
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

  private updatePayphone(): void {
    const pick = this.choose(2);
    if (pick < 0) return;
    this.overlay.hide();
    input.pop();
    this.mode = 'play';
    answerPayphone(this.floor, pick === 0);
    this.afterTurn();
  }

  private renderHud(): void {
    const f = this.floor;
    const p = f.player;
    const g = this.hudG;
    g.clear();
    for (let i = 0; i < f.stats.maxHp; i++) g.fillStyle(i < p.hp ? PALETTE.hpBar : PALETTE.hpBarBack).fillRect(300 + i * 12, 9, 9, 12);
    for (let i = 0; i < f.stats.focusMax; i++) g.fillStyle(i < p.focus ? PALETTE.focus : PALETTE.hpBarBack).fillRect(640 + i * 16, 9, 13, 12);
    const boss = f.boss && f.enemies.find((e) => e.id === f.boss!.id);
    if (boss) {
      g.fillStyle(PALETTE.hpBarBack).fillRect(780, 11, 160, 8);
      g.fillStyle(f.boss!.phase === 2 ? PALETTE.neonPhase2 : PALETTE.printer).fillRect(780, 11, (160 * Math.max(0, boss.hp)) / boss.maxHp, 8);
    }
    const floorText = f.boss ? t('rift.bossFloor') : t('rift.floor', { current: f.index + 1, total: totalFloors(this.run) - 1 });
    this.hud.setText(`${floorText}   ${t('rift.loot', { value: f.loot })}${p.bare > 0 ? `   ${t('rift.bare')}` : ''}`);
    this.focusLabel.setColor(p.focus >= f.stats.focusMax ? PALETTE.healText : PALETTE.text);
  }
}
