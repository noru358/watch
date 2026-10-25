import Phaser from 'phaser';
import { PALETTE, SCREEN } from '../../data/feel.data';
import { t } from '../../i18n';
import { crisp } from './text';
import type { RunResult, Settlement } from '../../systems/run';

const W = SCREEN.width;
const H = SCREEN.height;
const TEXT = { fontFamily: PALETTE.font, color: PALETTE.text };

const crispText = (scene: Phaser.Scene, ...args: Parameters<Phaser.GameObjects.GameObjectFactory['text']>) => crisp(scene.add.text(...args));

// Canvas panels shown over the night: trait choice, run end, banners.
export class Overlay {
  private layer: Phaser.GameObjects.Container;
  private cards: Phaser.GameObjects.Rectangle[] = [];

  // `parent`: the UI layer (drawn by the unzoomed UI camera).
  constructor(
    private scene: Phaser.Scene,
    private parent: Phaser.GameObjects.Layer,
  ) {
    this.layer = scene.add.container(0, 0).setDepth(100).setVisible(false);
    parent.add(this.layer);
  }

  private reset(): void {
    this.layer.removeAll(true);
    this.cards = [];
    this.layer.add(this.scene.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0));
    this.layer.setVisible(true);
  }

  hide(): void {
    this.layer.removeAll(true);
    this.cards = [];
    this.layer.setVisible(false);
  }

  // Up to three numbered cards (강화 카드 or a choice prompt). Select with 1/2/3 or A/D + J.
  showCards(title: string, offer: readonly { name: string; desc: string }[], hint?: string): void {
    this.reset();
    this.layer.add(crispText(this.scene, W / 2, 90, title, { ...TEXT, fontSize: '24px' }).setOrigin(0.5));
    if (hint) this.layer.add(crispText(this.scene, W / 2, 420, hint, { ...TEXT, fontSize: '15px', color: PALETTE.textDim }).setOrigin(0.5));
    const cardW = 250;
    const gap = 24;
    const startX = W / 2 - (offer.length * cardW + (offer.length - 1) * gap) / 2;
    offer.forEach((card, i) => {
      const x = startX + i * (cardW + gap);
      const box = this.scene.add.rectangle(x, 150, cardW, 230, PALETTE.panel).setOrigin(0).setStrokeStyle(2, PALETTE.wall);
      this.cards.push(box);
      this.layer.add(box);
      this.layer.add(crispText(this.scene, x + 16, 166, `${i + 1}`, { ...TEXT, fontSize: '28px', color: PALETTE.damageText }));
      this.layer.add(crispText(this.scene, x + 16, 214, card.name, { ...TEXT, fontSize: '20px' }));
      this.layer.add(
        crispText(this.scene, x + 16, 254, card.desc, {
          ...TEXT,
          fontSize: '15px',
          color: PALETTE.textDim,
          wordWrap: { width: cardW - 32, useAdvancedWrap: true },
        }),
      );
    });
    this.select(0);
  }

  select(index: number): void {
    this.cards.forEach((c, i) => c.setStrokeStyle(i === index ? 4 : 2, i === index ? PALETTE.panelBorder : PALETTE.wall));
  }

  showEnd(result: RunResult, s: Settlement): void {
    this.reset();
    const title = result.outcome === 'success' ? t('end.success') : result.outcome === 'extracted' ? t('end.extracted') : t('end.died');
    const lines = [
      `${t('result.loot')}  ${s.lootKept}${s.lootLost > 0 ? `  (-${s.lootLost})` : ''}`,
      `${t('result.fee')}  ${s.fee}`,
      `${t('result.total')}  ${s.moneyDelta}`,
    ];
    if (s.traumaDelta > 0) lines.push(`${t('result.trauma')}  +${s.traumaDelta}`);
    this.layer.add(crispText(this.scene, W / 2, 150, title, { ...TEXT, fontSize: '36px' }).setOrigin(0.5));
    this.layer.add(crispText(this.scene, W / 2, 270, lines.join('\n'), { ...TEXT, fontSize: '20px', align: 'center', lineSpacing: 10 }).setOrigin(0.5));
    this.layer.add(crispText(this.scene, W / 2, 410, t('end.continue'), { ...TEXT, fontSize: '16px', color: PALETTE.textDim }).setOrigin(0.5));
  }

  banner(text: string): void {
    const label = this.scene.add
      .text(W / 2, H / 2, text, { ...TEXT, fontSize: '34px', stroke: '#000000', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(90);
    this.parent.add(label);
    this.scene.tweens.add({ targets: label, alpha: 0, delay: 900, duration: 600, onComplete: () => label.destroy() });
  }
}
