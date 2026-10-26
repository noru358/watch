import { SCENES } from '../data/story.data';
import type { SceneId } from '../types/ids';
import { input, store } from './services';

// The story scene showing in the dialogue box, if any. Opening pushes the `modal` input context
// (the hub stops reading keys, Rule 4); the last line, or Esc, closes it and marks the scene seen.
type Listener = () => void;
export interface DialogueState {
  scene: SceneId;
  line: number;
}

let current: DialogueState | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((fn) => fn());

export const dialogue = {
  get: (): DialogueState | null => current,
  subscribe: (fn: Listener): (() => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function playScene(scene: SceneId): void {
  if (current) return;
  current = { scene, line: 0 };
  input.push('modal');
  notify();
}

export function nextLine(): void {
  if (!current) return;
  if (current.line + 1 < SCENES[current.scene].length) {
    current = { ...current, line: current.line + 1 };
    notify();
  } else endScene();
}

export function endScene(): void {
  if (!current) return;
  store.markSeen(current.scene);
  current = null;
  input.pop();
  (document.activeElement as HTMLElement | null)?.blur();
  notify();
}

// Phase switch only: the input stack is reset there, so nothing is popped.
export function forgetScene(): void {
  if (current) store.markSeen(current.scene);
  current = null;
  notify();
}
