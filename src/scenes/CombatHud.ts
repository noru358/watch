import Phaser from 'phaser';
import { ROOM_SIZE } from '../data/contracts.data';
import { PALETTE } from '../data/feel.data';
import { TOOLS } from '../data/tools.data';
import { t } from '../i18n';
import type { World } from '../systems/combat';
import { companionReadyRatio, type RunState } from '../systems/run';

const TEXT = { fontFamily: PALETTE.font, fontSize: '16px', color: PALETTE.text };

// Canvas HUD for the night (Rule: night UI is 100% Phaser).
export class CombatHud {
  private g: Phaser.GameObjects.Graphics;
  private roomText: Phaser.GameObjects.Text;
  private lootText: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private bossName: Phaser.GameObjects.Text;
  private slotLabels: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, world: World) {
    this.g = scene.add.graphics().setDepth(50);
    this.roomText = scene.add.text(ROOM_SIZE.width - 30, 30, '', TEXT).setOrigin(1, 0).setDepth(51);
    this.lootText = scene.add.text(30, 52, '', { ...TEXT, color: '#6ef0ff' }).setDepth(51);
    this.hint = scene.add
      .text(ROOM_SIZE.width / 2, ROOM_SIZE.height - 70, '', { ...TEXT, color: PALETTE.textDim })
      .setOrigin(0.5)
      .setDepth(51);
    this.bossName = scene.add.text(ROOM_SIZE.width / 2, 30, '', TEXT).setOrigin(0.5, 0).setDepth(51);
    const labels = [t('hud.tool'), ...world.companions.map((c) => t(`companion.${c.id}`))];
    labels.forEach((label, i) => {
      this.slotLabels.push(
        scene.add.text(30 + i * 120, ROOM_SIZE.height - 50, label, { ...TEXT, fontSize: '12px' }).setDepth(51),
      );
    });
  }

  render(world: World, run: RunState): void {
    const g = this.g;
    g.clear();
    const p = world.player;

    // HP pips
    for (let i = 0; i < world.stats.maxHp; i++) {
      g.fillStyle(i < p.hp ? PALETTE.hpBar : PALETTE.hpBarBack).fillRect(30 + i * 16, 30, 12, 14);
    }
    this.lootText.setText(t('hud.loot', { value: run.loot + world.loot }));
    this.roomText.setText(t('hud.room', { current: run.roomIndex + 1, total: run.plan.length }));

    // Tool + companion cooldown bars
    const tool = TOOLS[world.tool];
    const ratios = [1 - p.toolCd / tool.skillCooldown, ...world.companions.map(companionReadyRatio)];
    ratios.forEach((r, i) => {
      const x = 30 + i * 120;
      const y = ROOM_SIZE.height - 30;
      g.fillStyle(PALETTE.hpBarBack).fillRect(x, y, 100, 6);
      g.fillStyle(r >= 1 ? PALETTE.doorOpen : PALETTE.talisman).fillRect(x, y, 100 * Math.min(1, r), 6);
    });
    // Highlight which companion the call key will summon next.
    const nextLabel = this.slotLabels[1 + world.nextCompanion];
    this.slotLabels.forEach((l) => l.setColor(l === nextLabel ? PALETTE.damageText : PALETTE.text));

    // Boss bar
    const boss = world.enemies.find((e) => e.kind === 'printer');
    this.bossName.setText(boss ? t('hud.boss') : '');
    if (boss) {
      const w = 420;
      const x = ROOM_SIZE.width / 2 - w / 2;
      g.fillStyle(PALETTE.hpBarBack).fillRect(x, 52, w, 8);
      g.fillStyle(world.boss?.phase === 2 ? PALETTE.neonPhase2 : PALETTE.printer).fillRect(x, 52, (w * Math.max(0, boss.hp)) / boss.maxHp, 8);
    }

    let hint = '';
    if (world.roomKind === 'payphone') hint = t('room.payphone');
    else if (world.status === 'cleared') hint = t('room.cleared');
    this.hint.setText(hint);
  }
}
