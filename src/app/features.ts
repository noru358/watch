import type { LobbyFeatureId } from '../types/ids';
import { input } from './services';

// Which hub panel is open. The only way to open or close one (Rule 4): opening pushes the
// `modal` input context so the hub stops reading keys; closing pops it and drops DOM focus
// so keys work again at once, without a click.
type Listener = () => void;
let open: LobbyFeatureId | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((fn) => fn());

export const openPanel = {
  get: (): LobbyFeatureId | null => open,
  subscribe: (fn: Listener): (() => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function openFeature(id: LobbyFeatureId): void {
  if (open) return;
  open = id;
  input.push('modal');
  notify();
}

export function closeFeature(): void {
  if (!open) return;
  open = null;
  input.pop();
  (document.activeElement as HTMLElement | null)?.blur();
  notify();
}

// Phase switch only: the input stack is reset there, so nothing is popped here.
export function forgetFeature(): void {
  open = null;
  notify();
}
