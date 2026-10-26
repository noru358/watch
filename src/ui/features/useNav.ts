import { useEffect, useRef, useState } from 'react';
import { input } from '../../app/services';
import type { Action } from '../../data/input.data';

// Keyboard for list panels, read through InputManager (Rule 4): W / S move the cursor,
// Enter acts on the row, other actions go to `extra`. The latest handlers are always used.
export function useNav(count: number, onConfirm: (i: number) => void, extra?: (action: Action, i: number) => void) {
  const [cursor, setCursor] = useState(0);
  const ref = useRef({ count, cursor, onConfirm, extra });
  ref.current = { count, cursor, onConfirm, extra };
  useEffect(
    () =>
      input.onAction((action, ctx) => {
        if (ctx !== 'modal') return;
        const r = ref.current;
        if (r.count <= 0) return;
        if (action === 'up') setCursor((c) => (c + r.count - 1) % r.count);
        else if (action === 'down') setCursor((c) => (c + 1) % r.count);
        else if (action === 'confirm') r.onConfirm(Math.min(r.cursor, r.count - 1));
        else r.extra?.(action, Math.min(r.cursor, r.count - 1));
      }),
    [],
  );
  return [Math.min(cursor, Math.max(0, count - 1)), setCursor] as const;
}

export const rowStyle = (on: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 5, cursor: 'pointer',
  background: on ? 'rgba(65,224,200,0.12)' : 'transparent', border: `1px solid ${on ? '#41e0c8' : 'transparent'}`,
});

export const priceStyle = (can: boolean): React.CSSProperties => ({
  minWidth: 74, textAlign: 'right', fontFamily: 'monospace', fontSize: 14, color: can ? '#41e0c8' : '#7d6f9e',
});
