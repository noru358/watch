import Phaser from 'phaser';
import { EXORCISTS } from '../../data/protagonist.data';
import { WEAPONS } from '../../data/weapons.data';
import { PALETTE, SCREEN } from '../../data/feel.data';
import { t, type TKey } from '../../i18n';
import { counterable, type Floor } from '../../systems/rift';
import { crisp } from '../shared/text';

const TEXT = { fontFamily: PALETTE.font, fontSize: '15px', color: PALETTE.text };
const SLOT_W = 170;
const LEGEND_W = 230;
const GAP = 8;
const SLOT_H = 46;

interface Slot {
  keys: TKey;
  name: TKey;
}

// Bottom action bar: what each key does, plus live state (dash cooldown, 발도 cue).
const SLOTS: readonly Slot[] = [
  { keys: 'hud.key.attack', name: 'hud.act.attack' },
  { keys: 'hud.key.dash', name: 'hud.act.dash' },
  { keys: 'hud.key.draw', name: 'hud.act.draw' },
];

// Night HUD on the UI layer (1:1 camera, not zoomed).
export class RiftHud {
  private g: Phaser.GameObjects.Graphics;
  private top: Phaser.GameObjects.Text;
  private focusLabel: Phaser.GameObjects.Text;
  private drawState: Phaser.GameObjects.Text;
  private clock = 0;
  // The legend sits at the left edge, the key slots right after it.
  private readonly barX = 6 + LEGEND_W + GAP;
  private readonly barY = SCREEN.height - SLOT_H - 12;

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer) {
    this.g = scene.add.graphics();
    this.top = crisp(scene.add.text(12, 8, '', TEXT));
    this.focusLabel = crisp(scene.add.text(636, 8, t('rift.focus'), TEXT).setOrigin(1, 0));
    const objs: Phaser.GameObjects.GameObject[] = [this.g, this.top, this.focusLabel];
    SLOTS.forEach((s, i) => {
      const x = this.barX + i * (SLOT_W + GAP);
      objs.push(crisp(scene.add.text(x + 8, this.barY + 5, t(s.keys), { ...TEXT, fontSize: '12px', color: PALETTE.textDim })));
      objs.push(crisp(scene.add.text(x + 8, this.barY + 22, t(s.name), { ...TEXT, fontSize: '16px' })));
    });
    this.drawState = crisp(scene.add.text(this.barX + 2 * (SLOT_W + GAP) + SLOT_W - 8, this.barY + 24, '', { ...TEXT, fontSize: '12px' }).setOrigin(1, 0));
    objs.push(this.drawState);
    objs.push(crisp(scene.add.text(12, this.barY + 5, t('hud.key.move'), { ...TEXT, fontSize: '12px', color: PALETTE.textDim })));
    objs.push(crisp(scene.add.text(12, this.barY + 22, t('hud.legend'), { ...TEXT, fontSize: '12px', color: PALETTE.textDim })));
    layer.add(objs);
  }

  render(f: Floor, floorText: string, dt: number): void {
    this.clock += dt;
    const g = this.g;
    const p = f.player;
    g.clear();
    for (let i = 0; i < f.stats.maxHp; i++) g.fillStyle(i < p.hp ? PALETTE.hpBar : PALETTE.hpBarBack).fillRect(300 + i * 12, 11, 9, 12);
    for (let i = 0; i < f.stats.focusMax; i++) g.fillStyle(i < p.focus ? PALETTE.focus : PALETTE.hpBarBack).fillRect(640 + i * 16, 11, 13, 12);
    const boss = f.boss && f.enemies.find((e) => e.id === f.boss!.id);
    if (boss) {
      g.fillStyle(PALETTE.hpBarBack).fillRect(780, 13, 160, 8);
      g.fillStyle(f.boss!.phase === 2 ? PALETTE.neonPhase2 : PALETTE.gumihoFire).fillRect(780, 13, (160 * Math.max(0, boss.hp)) / boss.maxHp, 8);
    }
    this.top.setText(`${floorText}   ${t('rift.loot', { value: f.loot })}${p.bare > 0 ? `   ${t('rift.bare')}` : ''}`);
    this.focusLabel.setColor(p.focus >= f.stats.focusMax ? PALETTE.healText : PALETTE.text);

    // Action bar.
    const d = EXORCISTS.director;
    const w = WEAPONS[f.weapon];
    g.fillStyle(PALETTE.panel, 0.85).fillRoundedRect(6, this.barY, LEGEND_W, SLOT_H, 6);
    const cue = counterable(f).length > 0;
    const full = p.focus >= f.stats.focusMax;
    SLOTS.forEach((_, i) => {
      const x = this.barX + i * (SLOT_W + GAP);
      const lit = i === 2 && (cue || full);
      g.fillStyle(PALETTE.panel, 0.85).fillRoundedRect(x, this.barY, SLOT_W, SLOT_H, 6);
      g.lineStyle(cue && i === 2 ? 2 : 1, lit ? (cue ? 0xffffff : PALETTE.focus) : PALETTE.wall, 1).strokeRoundedRect(x, this.barY, SLOT_W, SLOT_H, 6);
      const cd = i === 1 ? p.dashCd / (d.dashCooldown + d.dashTime) : i === 2 ? p.drawCd / w.drawCooldown : 0;
      if (cd > 0) g.fillStyle(0x000000, 0.55).fillRoundedRect(x, this.barY, SLOT_W * Math.min(1, cd), SLOT_H, 6);
    });
    this.drawState.setText(cue ? t('hud.draw.now') : full ? t('hud.draw.full') : t('hud.draw.plain'));
    this.drawState.setColor(cue ? '#ffffff' : full ? PALETTE.healText : PALETTE.textDim);
    this.drawState.setAlpha(cue ? 0.6 + 0.4 * Math.sin(this.clock * 30) : 1);
  }
}
