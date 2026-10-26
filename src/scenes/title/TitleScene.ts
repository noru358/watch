import Phaser from 'phaser';
import { input, requestPhase, startedWithSave, store } from '../../app/services';
import { settings, volumePercent } from '../../app/settings';
import { PALETTE, SCREEN } from '../../data/feel.data';
import { TITLE_LOOK as L } from '../../data/titleLook.data';
import { t } from '../../i18n';
import { crisp } from '../shared/text';

type Item = 'continue' | 'new' | 'settings';
const W = SCREEN.width;
const H = SCREEN.height;

// Title (merged mockup A+B): neon sign on a brick wall, a vertical menu under it.
// 이어하기 · 새로 시작 (asks before wiping a save) · 설정 (A / D volume).
export class TitleScene extends Phaser.Scene {
  private items: Item[] = [];
  private selected = 0;
  private confirming = false;
  private rows: { label: Phaser.GameObjects.Text; info: Phaser.GameObjects.Text; marker: Phaser.GameObjects.Text }[] = [];
  private hi!: Phaser.GameObjects.Rectangle;
  private sign!: Phaser.GameObjects.Container;
  private confirm!: Phaser.GameObjects.Container;
  private clock = 0;
  private leaving = false; // the phase switch stops this scene mid-update; touch nothing after it

  constructor() {
    super('title');
  }

  create(): void {
    this.items = startedWithSave ? ['continue', 'new', 'settings'] : ['new', 'settings'];
    this.selected = 0;
    this.confirming = false;
    this.clock = 0;
    this.leaving = false;
    this.drawWall();
    this.drawSign();
    this.drawMenu();
    this.drawConfirm();
    this.refresh();
    input.clearPressed();
  }

  private drawWall(): void {
    const g = this.add.graphics();
    g.fillStyle(L.wall).fillRect(0, 0, W, H);
    g.lineStyle(2, L.mortar, 0.9);
    for (let y = 0; y < H; y += L.brick.h) {
      g.lineBetween(0, y, W, y);
      const shift = (y / L.brick.h) % 2 === 0 ? 0 : L.brick.w / 2;
      for (let x = -shift; x < W; x += L.brick.w) g.lineBetween(x, y, x, y + L.brick.h);
    }
    for (let r = 0; r < 6; r++) g.fillStyle(L.glow, L.glowAlpha).fillEllipse(W / 2, L.sign.y + L.sign.h / 2, 280 + r * 90, 160 + r * 50);
    g.fillStyle(0x000000, 0.35).fillRect(0, H - 60, W, 60);
  }

  private drawSign(): void {
    const s = L.sign;
    const x = W / 2 - s.w / 2;
    const g = this.add.graphics();
    g.lineStyle(2, PALETTE.hudLine).lineBetween(W / 2 - 140, 20, W / 2 - 140, s.y).lineBetween(W / 2 + 140, 20, W / 2 + 140, s.y);
    for (let i = 4; i >= 1; i--) g.lineStyle(s.line + i * 4, L.neon, 0.08).strokeRoundedRect(x, s.y, s.w, s.h, s.radius);
    g.lineStyle(s.line, L.neon, 1).strokeRoundedRect(x, s.y, s.w, s.h, s.radius);
    const sub = crisp(this.add.text(W / 2, s.y + 30, t('title.sign'), { fontFamily: PALETTE.font, fontSize: '15px', color: L.teal })).setOrigin(0.5);
    sub.setShadow(0, 0, L.teal, 10, false, true);
    const name = crisp(this.add.text(W / 2, s.y + 92, t('game.title'), { fontFamily: PALETTE.font, fontSize: '66px', fontStyle: 'bold', color: L.neonText })).setOrigin(0.5);
    name.setShadow(0, 0, '#ff3cac', 18, false, true);
    this.sign = this.add.container(0, 0, [g, sub, name]);
  }

  private drawMenu(): void {
    const m = L.menu;
    const x = W / 2 - m.w / 2;
    this.hi = this.add.rectangle(x, m.y, m.w, m.row - 4, L.rowHi, 0.1).setOrigin(0);
    this.rows = this.items.map((item, i) => {
      const y = m.y + i * m.row + (m.row - 4) / 2;
      const marker = crisp(this.add.text(x + 14, y, '▶', { fontFamily: PALETTE.font, fontSize: '16px', color: L.teal })).setOrigin(0, 0.5);
      const label = crisp(this.add.text(x + 40, y, t(`title.${item}`), { fontFamily: PALETTE.font, fontSize: '20px', color: L.dim })).setOrigin(0, 0.5);
      const info = crisp(this.add.text(x + m.w - 14, y, '', { fontFamily: PALETTE.font, fontSize: '13px', color: L.dim })).setOrigin(1, 0.5);
      label.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (this.confirming || this.leaving) return;
        this.selected = i;
        this.choose();
      });
      return { label, info, marker };
    });
    crisp(this.add.text(W / 2, H - 30, t('title.keys'), { fontFamily: PALETTE.font, fontSize: '12px', color: L.dim })).setOrigin(0.5);
  }

  private drawConfirm(): void {
    const bg = this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setInteractive();
    const box = this.add.rectangle(W / 2, H / 2, 480, 150, PALETTE.hudPanel, 0.96).setStrokeStyle(2, L.neon);
    const q = crisp(this.add.text(W / 2, H / 2 - 22, t('title.confirmNew'), { fontFamily: PALETTE.font, fontSize: '18px', color: L.ink })).setOrigin(0.5);
    const keys = crisp(this.add.text(W / 2, H / 2 + 28, t('title.confirmKeys'), { fontFamily: PALETTE.font, fontSize: '13px', color: L.dim })).setOrigin(0.5);
    this.confirm = this.add.container(0, 0, [bg, box, q, keys]).setVisible(false).setDepth(10);
  }

  private refresh(): void {
    const s = store.getState();
    this.rows.forEach((r, i) => {
      const on = i === this.selected;
      r.marker.setVisible(on);
      r.label.setColor(on ? L.ink : L.dim).setFontStyle(on ? 'bold' : 'normal');
      const item = this.items[i];
      r.info.setText(item === 'continue' ? t('title.continueInfo', { day: s.day, money: s.money }) : item === 'settings' ? t('title.settingsInfo', { volume: volumePercent() }) : '');
    });
    this.hi.setY(L.menu.y + this.selected * L.menu.row);
  }

  private choose(): void {
    const item = this.items[this.selected];
    if (item === 'continue') this.leave();
    if (item === 'new') {
      if (startedWithSave) this.setConfirm(true);
      else this.startNew();
    }
  }

  private setConfirm(on: boolean): void {
    this.confirming = on;
    this.confirm.setVisible(on);
  }

  private startNew(): void {
    // The wall clock only picks the new base seed; gameplay uses SeededRNG from it (Rule 6).
    store.newGame(Date.now() >>> 0);
    this.leave();
  }

  private leave(): void {
    this.leaving = true;
    requestPhase('day');
  }

  update(_time: number, deltaMs: number): void {
    if (this.leaving) return;
    this.clock += deltaMs / 1000;
    const phase = this.clock % L.buzzEvery;
    this.sign.setAlpha(phase > 3.6 && phase < 3.66 ? 0.35 : phase > 3.75 && phase < 3.8 ? 0.6 : 1);
    const ctx = 'day';
    if (this.confirming) {
      if (input.consume('confirm', ctx)) this.startNew();
      else if (input.consume('pause', ctx)) this.setConfirm(false);
      return;
    }
    const n = this.items.length;
    if (input.consume('up', ctx)) this.selected = (this.selected + n - 1) % n;
    if (input.consume('down', ctx)) this.selected = (this.selected + 1) % n;
    if (this.items[this.selected] === 'settings') {
      if (input.consume('left', ctx)) settings.stepVolume(-1, false);
      if (input.consume('right', ctx)) settings.stepVolume(1, false);
    }
    if (input.consume('confirm', ctx)) this.choose();
    if (!this.leaving) this.refresh();
  }
}
