import { KEY_BINDINGS, type Action } from '../data/input.data';

export type InputContext = 'night' | 'day' | 'modal';

interface KeyEventLike {
  code: string;
  repeat?: boolean;
  preventDefault(): void;
}

interface MouseEventLike {
  button: number;
  clientX: number;
  clientY: number;
  preventDefault(): void;
}

type InputEventType = 'keydown' | 'keyup' | 'blur' | 'mousedown' | 'mouseup' | 'mousemove' | 'contextmenu';

interface KeySource {
  addEventListener(type: InputEventType, fn: (e: KeyEventLike & MouseEventLike) => void): void;
}

// Mouse buttons are bound like keys: 'Mouse0' = left, 'Mouse2' = right.
const mouseCode = (button: number) => `Mouse${button}`;

// Single owner of keyboard and mouse input, read from `window` (Rule 4). Only the
// top of the context stack receives actions; everything else reads as idle.
export class InputManager {
  private stack: InputContext[] = ['day'];
  private down = new Set<string>();
  private pressed = new Set<Action>();
  private codeToActions = new Map<string, Action[]>();
  private actionListeners = new Set<(action: Action, context: InputContext) => void>();
  private pointerPos = { x: 0, y: 0 }; // client (CSS) pixels
  private pointerMoves = 0; // increments on every mouse move, so callers can tell the mouse is in use

  constructor(source: KeySource) {
    for (const [action, codes] of Object.entries(KEY_BINDINGS) as [Action, readonly string[]][]) {
      for (const code of codes) {
        const list = this.codeToActions.get(code) ?? [];
        list.push(action);
        this.codeToActions.set(code, list);
      }
    }
    source.addEventListener('keydown', (e) => this.onKeyDown(e));
    source.addEventListener('keyup', (e) => this.down.delete(e.code));
    // Prevents stuck keys when the window loses focus mid-press.
    source.addEventListener('blur', () => this.down.clear());
    source.addEventListener('mousemove', (e) => {
      this.pointerPos = { x: e.clientX, y: e.clientY };
      this.pointerMoves += 1;
    });
    source.addEventListener('mousedown', (e) => {
      this.pointerPos = { x: e.clientX, y: e.clientY };
      this.onKeyDown({ code: mouseCode(e.button), preventDefault: () => e.preventDefault() });
    });
    source.addEventListener('mouseup', (e) => this.down.delete(mouseCode(e.button)));
    // Right-click is a game action at night, not a browser menu.
    source.addEventListener('contextmenu', (e) => {
      if (this.context !== 'day') e.preventDefault();
    });
  }

  // Last known pointer position in client pixels, and a counter of mouse moves.
  pointer(): { x: number; y: number; moves: number } {
    return { ...this.pointerPos, moves: this.pointerMoves };
  }

  get context(): InputContext {
    return this.stack[this.stack.length - 1] ?? 'day';
  }

  // Replaces the whole stack; used only by the phase switch.
  resetContext(base: InputContext): void {
    this.stack = [base];
    this.down.clear();
    this.pressed.clear();
  }

  push(context: InputContext): void {
    this.stack.push(context);
    this.pressed.clear();
  }

  pop(): void {
    if (this.stack.length > 1) this.stack.pop();
    this.pressed.clear();
  }

  // Drops unconsumed presses, e.g. so an attack press doesn't confirm a menu
  // that opens a moment later.
  clearPressed(): void {
    this.pressed.clear();
  }

  // Notifies on each fresh press, tagged with the context that owns it. Used by
  // React screens, which must not attach their own key listeners.
  onAction(fn: (action: Action, context: InputContext) => void): () => void {
    this.actionListeners.add(fn);
    return () => this.actionListeners.delete(fn);
  }

  isDown(action: Action, context: InputContext): boolean {
    if (this.context !== context) return false;
    return KEY_BINDINGS[action].some((code) => this.down.has(code));
  }

  // True once per physical press; consumes the press.
  consume(action: Action, context: InputContext): boolean {
    if (this.context !== context) return false;
    return this.pressed.delete(action);
  }

  private onKeyDown(e: KeyEventLike): void {
    const actions = this.codeToActions.get(e.code);
    if (!actions) return;
    if (this.context !== 'day') e.preventDefault(); // stop Space/arrows scrolling the page
    if (e.repeat || this.down.has(e.code)) return;
    this.down.add(e.code);
    for (const a of actions) this.pressed.add(a);
    const ctx = this.context;
    for (const a of actions) this.actionListeners.forEach((fn) => fn(a, ctx));
  }
}
