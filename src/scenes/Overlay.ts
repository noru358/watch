import Phaser from 'phaser';
import { ROOM_SIZE } from '../data/contracts.data';
import { PALETTE } from '../data/feel.data';
import { TRAITS } from '../data/traits.data';
import { t } from '../i18n';
import type { TraitId } from '../types/ids';
import type { RunResult, Settlement } from '../systems/run';

const W = ROOM_SIZE.width;
const H = ROOM_SIZE.height;
const TEXT = { fontFamily: PALETTE.font, color: PALETTE.text };

function traitParams(id: TraitId): Record<string, number> {
  const d = TRAITS[id];
  return {
    chance: Math.round(d.chance * 100),
    amount: d.amount,
    hp: d.maxHpBonus,
    speed: Math.round((d.moveSpeedMult - 1) * 100),
    damage: Math.round((d.damageMult - 1) * 100),
  };
}

// Canvas panels shown over the night: trait choice, run end, banners.
export class Overlay {
  private layer: Phaser.GameObjects.Container;
  private cards: Phaser.GameObjects.Rectangle[] = [];

  constructor(private scene: Phaser.Scene) {
    this.layer = scene.add.container(0, 0).setDepth(100).setVisible(false);
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

  showTraitOffer(offer: readonly TraitId[]): void {
    this.showCards(offer.map((id) => ({ name: t(`trait.${id}.name`), desc: t(`trait.${id}.desc`, traitParams(id)) })));
  }

  showCards(offer: readonly { name: string; desc: string }[]): void {
    this.reset();
    this.layer.add(this.scene.add.text(W / 2, 90, t('trait.pick'), { ...TEXT, fontSize: '24px' }).setOrigin(0.5));
    const cardW = 250;
    const gap = 24;
    const startX = W / 2 - (offer.length * cardW + (offer.length - 1) * gap) / 2;
    offer.forEach((card, i) => {
      const x = startX + i * (cardW + gap);
      const box = this.scene.add.rectangle(x, 150, cardW, 230, PALETTE.panel).setOrigin(0).setStrokeStyle(2, PALETTE.wall);
      this.cards.push(box);
      this.layer.add(box);
      this.layer.add(this.scene.add.text(x + 16, 166, `${i + 1}`, { ...TEXT, fontSize: '28px', color: PALETTE.damageText }));
      this.layer.add(this.scene.add.text(x + 16, 214, card.name, { ...TEXT, fontSize: '20px' }));
      this.layer.add(
        this.scene.add.text(x + 16, 254, card.desc, {
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
    this.layer.add(this.scene.add.text(W / 2, 150, title, { ...TEXT, fontSize: '36px' }).setOrigin(0.5));
    this.layer.add(this.scene.add.text(W / 2, 270, lines.join('\n'), { ...TEXT, fontSize: '20px', align: 'center', lineSpacing: 10 }).setOrigin(0.5));
    this.layer.add(this.scene.add.text(W / 2, 410, t('end.continue'), { ...TEXT, fontSize: '16px', color: PALETTE.textDim }).setOrigin(0.5));
  }

  banner(text: string): void {
    const label = this.scene.add
      .text(W / 2, H / 2, text, { ...TEXT, fontSize: '34px', stroke: '#000000', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(90);
    this.scene.tweens.add({ targets: label, alpha: 0, delay: 900, duration: 600, onComplete: () => label.destroy() });
  }
}
