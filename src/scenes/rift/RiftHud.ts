import Phaser from 'phaser';
import { FEEL, PALETTE, SCREEN } from '../../data/feel.data';
import { ACTIVES } from '../../data/skills.data';
import { OBJECTIVES } from '../../data/objectives.data';
import { t, type TKey } from '../../i18n';
import { counterable, isStrong, strongStanding, survivorOf, type Floor, type Pos } from '../../systems/rift';
import { crisp } from '../shared/text';

const W = SCREEN.width;
const H = SCREEN.height;
const TEXT = { fontFamily: PALETTE.font, fontSize: '14px', color: PALETTE.text };
const NUM = { fontFamily: 'monospace', fontSize: '24px', color: PALETTE.text, fontStyle: 'bold' };
const GOAL_W = 320;
const SLOT = 50;
const DRAW_SLOT = 60;
const SLOT_GAP = 10;
const CRY_SHOW = 1.6; // seconds the cry arrow stays after a cry

export interface HudInfo {
  floor: number; // 1-based
  total: number;
  goalFloors: readonly number[]; // 1-based floors where an objective ends before the last floor
  targetName: string | null; // 현상수배 / 추격: the named ghost
}

type SlotId = 'attack' | 'dash' | 'draw' | 'skill';
const VIEW_TILES = { x: SCREEN.width / 2 / (FEEL.tile * FEEL.zoom), y: SCREEN.height / 2 / (FEEL.tile * FEEL.zoom) };

// Night HUD (docs/design/1-foundation/ui.md "밤 HUD"): objective on top, floor and loot top-right,
// health and focus bottom-left, the four action slots bottom-right. No key legend: that lives in the pause menu.
export class RiftHud {
  private g: Phaser.GameObjects.Graphics;
  private goalText: Phaser.GameObjects.Text;
  private floorText: Phaser.GameObjects.Text;
  private lootText: Phaser.GameObjects.Text;
  private hpLabel: Phaser.GameObjects.Text;
  private focusLabel: Phaser.GameObjects.Text;
  private bareText: Phaser.GameObjects.Text;
  private cryText: Phaser.GameObjects.Text;
  private slotLabels: Record<SlotId, Phaser.GameObjects.Text>;
  private clock = 0;

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer) {
    const text = (x: number, y: number, s = '', style: Phaser.Types.GameObjects.Text.TextStyle = TEXT) => crisp(scene.add.text(x, y, s, style));
    this.g = scene.add.graphics();
    this.goalText = text(W / 2 - GOAL_W / 2 + 34, 20);
    this.floorText = text(W - 18, 12, '', NUM).setOrigin(1, 0);
    this.lootText = text(W - 18, 52, '', { ...TEXT, fontSize: '12px', color: PALETTE.lootText }).setOrigin(1, 0);
    this.hpLabel = text(30, H - 66, t('hud.hp'), { ...TEXT, fontSize: '11px', color: PALETTE.textDim });
    this.focusLabel = text(30, H - 42, t('rift.focus'), { ...TEXT, fontSize: '11px', color: PALETTE.textDim });
    this.bareText = text(18, H - 104, t('rift.bare'), { ...TEXT, fontSize: '12px', color: PALETTE.accentText });
    this.cryText = text(0, 0, t('hud.cry'), { ...TEXT, fontSize: '12px', color: PALETTE.fearText }).setOrigin(0.5);
    this.slotLabels = {
      attack: text(0, 0, t('hud.slot.attack'), { ...TEXT, fontSize: '10px', color: PALETTE.textDim }).setOrigin(0.5, 0),
      dash: text(0, 0, t('hud.slot.dash'), { ...TEXT, fontSize: '10px', color: PALETTE.textDim }).setOrigin(0.5, 0),
      draw: text(0, 0, t('hud.slot.draw'), { ...TEXT, fontSize: '10px', color: PALETTE.textDim }).setOrigin(0.5, 0),
      skill: text(0, 0, '', { ...TEXT, fontSize: '10px', color: PALETTE.textDim }).setOrigin(0.5, 0),
    };
    layer.add([this.g, this.goalText, this.floorText, this.lootText, this.hpLabel, this.focusLabel, this.bareText, this.cryText, ...Object.values(this.slotLabels)]);
  }

  render(f: Floor, info: HudInfo, dt: number): void {
    this.clock += dt;
    this.g.clear();
    this.renderGoal(f, info);
    this.renderFloor(f, info);
    this.renderVitals(f);
    this.renderSlots(f);
    this.renderCry(f);
    this.renderPointers(f);
  }

  // An arrow on the screen edge toward a spot off screen (nothing when it is on screen).
  private edgeArrow(f: Floor, at: Pos, color: number, alpha = 1, always = false): { x: number; y: number; a: number } | null {
    const p = f.player;
    const dx = at.x - p.x;
    const dy = at.y - p.y;
    if (!always && Math.abs(dx) < VIEW_TILES.x - 0.5 && Math.abs(dy) < VIEW_TILES.y - 0.5) return null;
    const a = Math.atan2(dy, dx);
    const rx = W / 2 - 46;
    const ry = H / 2 - 46;
    const k = Math.min(rx / Math.abs(Math.cos(a) || 1e-6), ry / Math.abs(Math.sin(a) || 1e-6));
    const ax = W / 2 + Math.cos(a) * k;
    const ay = H / 2 + Math.sin(a) * k;
    const tip = { x: ax + Math.cos(a) * 16, y: ay + Math.sin(a) * 16 };
    const l = { x: ax + Math.cos(a + 2.4) * 14, y: ay + Math.sin(a + 2.4) * 14 };
    const r = { x: ax + Math.cos(a - 2.4) * 14, y: ay + Math.sin(a - 2.4) * 14 };
    this.g.fillStyle(color, alpha).fillTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
    return { x: ax, y: ay, a };
  }

  // Edge arrows the objective and perks give: the named target, unfinished ward sites, the stairs
  // on the first floor (지도 사본), strong ghosts off screen (귀신 눈).
  private renderPointers(f: Floor): void {
    const o = f.objective;
    if ((o?.kind === 'bounty' || o?.kind === 'chase') && !o.done) {
      const e = f.enemies.find((x) => x.id === (o.kind === 'bounty' ? o.targetId : o.targetId) && x.hp > 0);
      if (e) this.edgeArrow(f, e, PALETTE.bountyMark, 0.9);
    }
    if (o?.kind === 'ward' && !o.done) {
      for (const site of o.sites) if (site.progress < 1) this.edgeArrow(f, site, PALETTE.accent, 0.8);
    }
    const open = !o || (o.kind === 'chase' ? o.done || o.fled : o.kind === 'rescue' ? o.survivor.state === 'following' : o.done);
    if (f.stairs && (open || (f.index === 0 && f.perks.includes('map_copy')))) this.edgeArrow(f, f.stairs, PALETTE.textDimHex, 0.7);
    if (f.perks.includes('ghost_eye')) for (const e of f.enemies) if (e.hp > 0 && isStrong(e)) this.edgeArrow(f, e, PALETTE.parriable, 0.45);
  }

  // Top centre: one line saying what opens the way, plus a gauge when the objective has one.
  private renderGoal(f: Floor, info: HudInfo): void {
    const g = this.g;
    const x = W / 2 - GOAL_W / 2;
    let line = t('hud.obj.free');
    let gauge: { value: number; color: number; label: string; ticks?: number[] } | null = null;
    const boss = f.boss && f.enemies.find((e) => e.id === f.boss!.id);
    const o = f.objective;
    const name = info.targetName ?? '';
    let open = true;
    if (boss) {
      open = false;
      line = t(`enemy.${boss.kind}` as TKey);
      gauge = { value: Math.max(0, boss.hp) / boss.maxHp, color: f.boss!.phase === 2 ? PALETTE.neonPhase2 : PALETTE.gumihoFire, label: '' };
    } else if (o?.kind === 'clear') {
      open = o.done;
      line = o.done ? t('rift.sealOpen') : t('rift.sealed', { count: strongStanding(f) });
    } else if (o?.kind === 'rescue') {
      const s = o.survivor;
      open = s.state === 'following';
      line = s.state === 'hidden' ? t('hud.obj.find') : t('hud.obj.lead');
      gauge = s.state === 'hidden' ? { value: o.fear, color: PALETTE.fear, label: t('hud.fear') } : { value: s.hp / s.maxHp, color: PALETTE.survivor, label: t('hud.survivor') };
    } else if (o?.kind === 'bounty') {
      open = o.done;
      const e = f.enemies.find((x) => x.id === o.targetId);
      line = o.done ? t('hud.obj.bountyDone') : t('hud.obj.bounty', { name });
      if (e && !o.done) gauge = { value: e.hp / e.maxHp, color: PALETTE.bountyMark, label: '' };
    } else if (o?.kind === 'chase') {
      open = o.done || o.fled;
      const e = f.enemies.find((x) => x.id === o.targetId && x.hp > 0);
      line = o.done ? t('hud.obj.chaseDone') : o.fled ? t('hud.obj.chaseFled') : e?.asleep ? t('hud.obj.chaseNest', { name }) : t('hud.obj.chase', { name });
      if (e && !o.done && !o.fled) gauge = { value: e.hp / e.maxHp, color: PALETTE.bountyMark, label: '', ticks: [...OBJECTIVES.chase.fleeAt] };
    } else if (o?.kind === 'ward') {
      open = o.done;
      const finished = o.sites.filter((s) => s.progress >= 1).length;
      line = o.done ? t('hud.obj.wardDone') : t('hud.obj.ward', { done: finished, total: o.sites.length });
      const live = o.sites.find((s) => s.progress > 0 && s.progress < 1);
      if (!o.done) gauge = { value: live ? live.progress : 0, color: PALETTE.accent, label: o.charging ? t('hud.obj.wardCharging') : '' };
    } else if (o?.kind === 'firsttrain') {
      open = o.done;
      const left = Math.ceil(o.left);
      line = o.done ? t('hud.obj.trainDone') : t('hud.obj.train', { time: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` });
      if (!o.done) gauge = { value: 1 - o.left / o.total, color: PALETTE.accent, label: '' };
    }
    const h = gauge ? 54 : 36;
    g.fillStyle(PALETTE.hudPanel, 0.82).fillRoundedRect(x, 10, GOAL_W, h, 8);
    g.lineStyle(1, PALETTE.hudLine, 1).strokeRoundedRect(x, 10, GOAL_W, h, 8);
    // Icon: a small diamond, accent when the way is open.
    g.fillStyle(open ? PALETTE.accent : PALETTE.parriable, 1).fillTriangle(x + 18, 20, x + 26, 28, x + 18, 36).fillTriangle(x + 18, 20, x + 10, 28, x + 18, 36);
    this.goalText.setText(gauge?.label ? `${line}   ·   ${gauge.label}` : line);
    if (!gauge) return;
    const gx = x + 34;
    const gw = GOAL_W - 48;
    g.fillStyle(PALETTE.hudLine, 1).fillRect(gx, 46, gw, 8);
    g.fillStyle(gauge.color, 1).fillRect(gx, 46, gw * Math.max(0, Math.min(1, gauge.value)), 8);
    for (const k of gauge.ticks ?? []) g.fillStyle(0xffffff, 0.8).fillRect(gx + gw * k - 1, 44, 2, 12);
  }

  // Top right: floor counter, a bar per floor (goal floor marked), spirit collected.
  private renderFloor(f: Floor, info: HudInfo): void {
    const g = this.g;
    this.floorText.setText(t('hud.floor', { current: info.floor, total: info.total }));
    const seg = 16;
    const gap = 3;
    const x0 = W - 18 - info.total * (seg + gap) + gap;
    for (let i = 1; i <= info.total; i++) {
      const x = x0 + (i - 1) * (seg + gap);
      const color = i === info.floor ? PALETTE.accent : i < info.floor ? PALETTE.textDimHex : PALETTE.hudLine;
      g.fillStyle(color, 1).fillRect(x, 42, seg, 5);
      if (info.goalFloors.includes(i)) g.lineStyle(1, PALETTE.fear, 1).strokeRect(x - 1, 41, seg + 2, 7);
    }
    this.lootText.setText(t('rift.loot', { value: f.loot }));
  }

  // Bottom left: health pips and the focus gauge in one panel.
  private renderVitals(f: Floor): void {
    const g = this.g;
    const p = f.player;
    const pip = 10;
    const panelW = Math.max(200, 70 + f.stats.maxHp * (pip + 3));
    g.fillStyle(PALETTE.hudPanel, 0.82).fillRoundedRect(18, H - 76, panelW, 60, 8);
    g.lineStyle(1, PALETTE.hudLine, 1).strokeRoundedRect(18, H - 76, panelW, 60, 8);
    for (let i = 0; i < f.stats.maxHp; i++) g.fillStyle(i < p.hp ? PALETTE.hpBar : PALETTE.hudLine, 1).fillRect(64 + i * (pip + 3), H - 66, pip, 14);
    const full = p.focus >= f.stats.focusMax;
    for (let i = 0; i < f.stats.focusMax; i++) {
      const x = 66 + i * 26;
      g.fillStyle(i < p.focus ? PALETTE.focus : PALETTE.hudLine, full ? 0.75 + 0.25 * Math.sin(this.clock * 8) : 1);
      g.fillPoints([{ x: x + 4, y: H - 40 }, { x: x + 24, y: H - 40 }, { x: x + 20, y: H - 30 }, { x, y: H - 30 }], true);
    }
    this.focusLabel.setColor(full ? PALETTE.healText : PALETTE.textDim);
    this.bareText.setVisible(p.bare > 0);
  }

  // Bottom right: 베기 · 돌진 · 발도 (shows what a press would do) · L 액티브 기술 (dashed when none).
  private renderSlots(f: Floor): void {
    const g = this.g;
    const p = f.player;
    const cue = counterable(f).length > 0;
    const full = p.focus >= f.stats.focusMax;
    const sizes: Record<SlotId, number> = { attack: SLOT, dash: SLOT, draw: DRAW_SLOT, skill: SLOT };
    const order: SlotId[] = ['attack', 'dash', 'draw', 'skill'];
    let x = W - 18 - order.reduce((sum, id) => sum + sizes[id], 0) - SLOT_GAP * (order.length - 1);
    const base = H - 34;
    for (const id of order) {
      const s = sizes[id];
      const top = base - s;
      const cx = x + s / 2;
      const cy = top + s / 2;
      this.slotLabels[id].setPosition(cx, base + 4);
      if (id === 'skill' && f.active) {
        const ready = f.skillCd <= 0;
        g.fillStyle(PALETTE.hudPanel, 0.85).fillRoundedRect(x, top, s, s, 8);
        g.lineStyle(2, ready ? PALETTE.accent : PALETTE.slotIdle, 1).strokeRoundedRect(x, top, s, s, 8);
        g.lineStyle(2, ready ? PALETTE.accent : PALETTE.slotIdle, 1);
        if (f.active === 'talisman') g.strokeRect(cx - 6, cy - 11, 12, 22).lineBetween(cx - 3, cy - 4, cx + 3, cy - 4).lineBetween(cx - 3, cy + 2, cx + 3, cy + 2);
        if (f.active === 'barrier') g.strokeCircle(cx, cy, 13).strokeCircle(cx, cy, 6);
        if (f.active === 'salt_burst') for (let k = 0; k < 6; k++) g.fillStyle(ready ? PALETTE.accent : PALETTE.slotIdle, 1).fillCircle(cx + Math.cos(k * 1.05) * 10, cy + Math.sin(k * 1.05) * 10, 2.5);
        const cd = f.skillCd / ACTIVES[f.active].cooldown;
        if (cd > 0) g.fillStyle(0x000000, 0.6).fillRoundedRect(x, top + s * (1 - Math.min(1, cd)), s, s * Math.min(1, cd), 8);
        this.slotLabels.skill.setText(`L ${t(ACTIVES[f.active].nameKey)}`);
        x += s + SLOT_GAP;
        continue;
      }
      if (id === 'skill') {
        this.slotLabels.skill.setText(t('hud.slot.skillNone'));
        g.lineStyle(2, PALETTE.hudLine, 1);
        for (let k = 0; k < s; k += 8) {
          g.lineBetween(x + k, top, x + Math.min(s, k + 4), top).lineBetween(x + k, top + s, x + Math.min(s, k + 4), top + s);
          g.lineBetween(x, top + k, x, top + Math.min(s, k + 4)).lineBetween(x + s, top + k, x + s, top + Math.min(s, k + 4));
        }
        x += s + SLOT_GAP;
        continue;
      }
      const lit = id === 'draw' && (cue || full);
      const edge = id === 'draw' ? (cue ? 0xffffff : full ? PALETTE.accent : PALETTE.slotIdle) : id === 'dash' ? PALETTE.textDimHex : PALETTE.slotIdle;
      g.fillStyle(PALETTE.hudPanel, 0.85).fillRoundedRect(x, top, s, s, 8);
      g.lineStyle(lit ? 3 : 2, edge, cue ? 0.6 + 0.4 * Math.sin(this.clock * 30) : 1).strokeRoundedRect(x, top, s, s, 8);
      g.lineStyle(2, edge, 1);
      if (id === 'attack') g.lineBetween(cx - 11, cy + 11, cx + 9, cy - 9).lineBetween(cx + 5, cy - 11, cx + 11, cy - 5);
      if (id === 'dash') g.lineBetween(cx - 12, cy, cx + 6, cy).lineBetween(cx, cy - 7, cx + 7, cy).lineBetween(cx, cy + 7, cx + 7, cy).lineBetween(cx + 11, cy - 9, cx + 11, cy + 9);
      if (id === 'draw') g.strokeCircle(cx, cy, 13).lineBetween(cx - 12, cy + 12, cx + 12, cy - 12);
      const cd = id === 'dash' ? (p.dashCharges > 0 ? 0 : p.dashCd / (f.stats.dashCooldown + f.stats.dashTime)) : id === 'draw' ? p.drawCd / f.stats.drawCooldown : 0;
      if (cd > 0) g.fillStyle(0x000000, 0.6).fillRoundedRect(x, top + s * (1 - Math.min(1, cd)), s, s * Math.min(1, cd), 8);
      x += s + SLOT_GAP;
    }
    const drawLabel = this.slotLabels.draw;
    drawLabel.setText(cue ? t('hud.draw.now') : full ? t('hud.draw.full') : t('hud.slot.draw'));
    drawLabel.setColor(cue ? '#ffffff' : full ? PALETTE.accentText : PALETTE.textDim);
  }

  // Rescue: after each cry, an arrow at the screen edge points toward the hidden person.
  private renderCry(f: Floor): void {
    const s = survivorOf(f);
    const o = f.objective;
    const show = s && o?.kind === 'rescue' && s.state === 'hidden' && o.sinceCry < CRY_SHOW;
    this.cryText.setVisible(!!show);
    if (!show || !s || o?.kind !== 'rescue') return;
    const alpha = 1 - o.sinceCry / CRY_SHOW;
    const at = this.edgeArrow(f, s, PALETTE.fear, alpha, true);
    if (at) this.cryText.setPosition(at.x - Math.cos(at.a) * 26, at.y - Math.sin(at.a) * 26).setAlpha(alpha);
  }
}
