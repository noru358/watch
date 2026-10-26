// A text message popping up on the director's phone (bottom right) — e.g. the landlady on rent
// day. Presentation only; it never blocks input and hides itself.
type Listener = () => void;
export interface PhoneText {
  from: string;
  body: string;
  id: number;
}

let current: PhoneText | null = null;
let nextId = 1;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((fn) => fn());

export const phoneText = {
  get: (): PhoneText | null => current,
  subscribe: (fn: Listener): (() => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function showPhoneText(from: string, body: string, seconds = 6): void {
  const id = nextId++;
  current = { from, body, id };
  notify();
  setTimeout(() => {
    if (current?.id !== id) return;
    current = null;
    notify();
  }, seconds * 1000);
}
