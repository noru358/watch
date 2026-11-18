import type { InputManager, InputContext } from '../../core/InputManager';
import { TOUCH, type TouchButton, type TouchLayout } from '../../data/input.data';
import { t } from '../../i18n';

// On-screen controls for phones and tablets: a floating stick on the left half, round buttons on
// the right. Plain DOM with native touch listeners (React's are passive and cannot stop the
// browser's mouse emulation). Holds no game rules: every button presses a bound key code through
// InputManager, so screens cannot tell touch from the keyboard (Rule 4).
export type TouchMode = 'off' | 'day' | 'night';

const DIGITAL = { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS' } as const;

export class TouchControls {
  private root = document.createElement('div');
  private base = document.createElement('div');
  private knob = document.createElement('div');
  private hint = document.createElement('div');
  private mode: TouchMode = 'off';
  private layout: TouchLayout | null = null;
  private seen = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  private stickId: number | null = null;
  private origin = { x: 0, y: 0 };
  private heldDigital = new Set<string>();
  private heldButtons = new Map<number, string>(); // touch id → key code

  constructor(private input: InputManager) {
    Object.assign(this.root.style, { position: 'absolute', inset: '0', zIndex: '20', display: 'none', touchAction: 'none', userSelect: 'none', webkitUserSelect: 'none' });
    for (const el of [this.base, this.knob]) {
      Object.assign(el.style, { position: 'absolute', borderRadius: '50%', pointerEvents: 'none', display: 'none', transform: 'translate(-50%, -50%)' });
    }
    const d = TOUCH.stickRadius * 2;
    Object.assign(this.base.style, { width: `${d}px`, height: `${d}px`, background: TOUCH.look.fill, border: `2px solid ${TOUCH.look.ring}` });
    Object.assign(this.knob.style, { width: `${d * 0.45}px`, height: `${d * 0.45}px`, background: TOUCH.look.held });
    Object.assign(this.hint.style, { position: 'absolute', inset: '0', display: 'none', alignItems: 'center', justifyContent: 'center', color: TOUCH.look.ink, background: 'rgba(0,0,0,0.75)', fontSize: '20px', pointerEvents: 'none', zIndex: '30' });
    this.hint.textContent = t('touch.rotate');
    this.root.append(this.base, this.knob);
    document.body.append(this.root, this.hint);

    this.root.addEventListener('touchstart', (e) => this.onStart(e), { passive: false });
    this.root.addEventListener('touchmove', (e) => this.onMove(e), { passive: false });
    this.root.addEventListener('touchend', (e) => this.onEnd(e), { passive: false });
    this.root.addEventListener('touchcancel', (e) => this.onEnd(e), { passive: false });
    // The first touch anywhere turns the controls on (desktop browsers never show them).
    window.addEventListener('touchstart', () => this.markSeen(), { passive: true, capture: true });
    window.addEventListener('resize', () => this.refresh());
    input.onContextChange((ctx) => this.refresh(ctx));
    if (this.seen) input.useTouch();
  }

  // Called by the phase switch: which phase is on screen.
  setMode(mode: TouchMode): void {
    this.mode = mode;
    this.refresh();
  }

  private markSeen(): void {
    if (this.seen) return;
    this.seen = true;
    this.input.useTouch();
    this.refresh();
  }

  private pick(ctx: InputContext): TouchLayout | null {
    if (!this.seen) return null;
    if (this.mode === 'night') return ctx === 'night' ? 'night' : 'menu';
    // Day: only the walkable hub; open panels and dialogue are tapped directly.
    if (this.mode === 'day' && ctx === 'day') return 'hub';
    return null;
  }

  private refresh(ctx: InputContext = this.input.context): void {
    const portrait = window.innerHeight > window.innerWidth;
    this.hint.style.display = this.seen && TOUCH.rotateHint && portrait && this.mode !== 'off' ? 'flex' : 'none';
    const next = this.pick(ctx);
    if (next === this.layout) return;
    this.releaseAll();
    this.layout = next;
    for (const el of [...this.root.querySelectorAll('[data-code]')]) el.remove();
    this.root.style.display = next ? 'block' : 'none';
    if (next) for (const b of TOUCH.layouts[next]) this.root.append(this.button(b));
  }

  private button(b: TouchButton): HTMLElement {
    const el = document.createElement('div');
    el.dataset.code = b.code;
    el.textContent = t(b.labelKey);
    const d = b.r * 2;
    const edge = (n: number, side: 'right' | 'bottom' | 'top') => `calc(${n}px + env(safe-area-inset-${side}, 0px))`;
    Object.assign(el.style, {
      position: 'absolute', width: `${d}px`, height: `${d}px`, borderRadius: '50%', right: edge(b.right, 'right'),
      ...(b.top !== undefined ? { top: edge(b.top, 'top') } : { bottom: edge(b.bottom ?? 0, 'bottom') }),
      display: 'flex', alignItems: 'center', justifyContent: 'center', background: TOUCH.look.fill,
      border: `2px solid ${TOUCH.look.ring}`, color: TOUCH.look.ink, fontSize: `${TOUCH.look.font}px`, fontWeight: '700',
    });
    return el;
  }

  private onStart(e: TouchEvent): void {
    e.preventDefault(); // no emulated mouse events: they would move the mouse aim and press Mouse0
    for (const touch of [...e.changedTouches]) {
      const code = (touch.target as HTMLElement).dataset?.code;
      if (code) {
        this.heldButtons.set(touch.identifier, code);
        (touch.target as HTMLElement).style.background = TOUCH.look.held;
        this.input.pressCode(code);
      } else if (this.stickId === null && touch.clientX < window.innerWidth * TOUCH.stickZone) {
        this.stickId = touch.identifier;
        this.origin = { x: touch.clientX, y: touch.clientY };
        this.place(this.base, this.origin.x, this.origin.y);
        this.place(this.knob, this.origin.x, this.origin.y);
      }
    }
  }

  private onMove(e: TouchEvent): void {
    e.preventDefault();
    for (const touch of [...e.changedTouches]) {
      if (touch.identifier !== this.stickId) continue;
      let dx = (touch.clientX - this.origin.x) / TOUCH.stickRadius;
      let dy = (touch.clientY - this.origin.y) / TOUCH.stickRadius;
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      this.place(this.knob, this.origin.x + dx * TOUCH.stickRadius, this.origin.y + dy * TOUCH.stickRadius);
      const on = Math.min(len, 1) >= TOUCH.stickDead;
      this.input.setStick(on ? dx : 0, on ? dy : 0);
      this.setDigital(on ? dx : 0, on ? dy : 0);
    }
  }

  private onEnd(e: TouchEvent): void {
    e.preventDefault();
    for (const touch of [...e.changedTouches]) {
      const code = this.heldButtons.get(touch.identifier);
      if (code) {
        this.heldButtons.delete(touch.identifier);
        this.input.releaseCode(code);
        const el = this.root.querySelector<HTMLElement>(`[data-code="${code}"]`);
        if (el) el.style.background = TOUCH.look.fill;
      }
      if (touch.identifier === this.stickId) this.dropStick();
    }
  }

  // The stick also holds W/A/S/D past a threshold, for the hub walk and menu selection.
  private setDigital(x: number, y: number): void {
    const k = TOUCH.stickDigital;
    const want = new Set<string>();
    if (x <= -k) want.add(DIGITAL.left);
    if (x >= k) want.add(DIGITAL.right);
    if (y <= -k) want.add(DIGITAL.up);
    if (y >= k) want.add(DIGITAL.down);
    for (const code of this.heldDigital) if (!want.has(code)) this.input.releaseCode(code);
    for (const code of want) if (!this.heldDigital.has(code)) this.input.pressCode(code);
    this.heldDigital = want;
  }

  private dropStick(): void {
    this.stickId = null;
    this.input.setStick(0, 0);
    this.setDigital(0, 0);
    this.base.style.display = 'none';
    this.knob.style.display = 'none';
  }

  private releaseAll(): void {
    for (const code of this.heldButtons.values()) this.input.releaseCode(code);
    this.heldButtons.clear();
    this.dropStick();
  }

  private place(el: HTMLElement, x: number, y: number): void {
    Object.assign(el.style, { display: 'block', left: `${x}px`, top: `${y}px` });
  }
}
