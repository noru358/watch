import { PALETTE } from '../../data/feel.data';

// Shared look for hub panels (one panel at a time, centred over the hub).
export const panelCss = {
  shade: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(11,10,20,0.55)', color: PALETTE.text, fontFamily: PALETTE.font, pointerEvents: 'auto',
  },
  card: {
    width: 'min(520px, calc(100% - 32px))', maxHeight: 'calc(100% - 32px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14,
    background: 'rgba(29,24,48,0.96)', border: '1px solid #41e0c8', borderRadius: 8, padding: 20, boxSizing: 'border-box',
  },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  title: { margin: 0, fontSize: 20 },
  close: { fontSize: 12, color: PALETTE.textDim, whiteSpace: 'nowrap' },
  box: { background: 'rgba(20,16,31,0.8)', border: '1px solid #3b2f5c', borderRadius: 6, padding: 14 },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: 15, padding: '2px 0' },
  dim: { color: PALETTE.textDim },
  button: {
    padding: '12px 0', fontSize: 18, fontWeight: 700, color: '#14101f', background: '#41e0c8',
    border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: PALETTE.font,
  },
  chip: { padding: '5px 9px', fontSize: 12, background: 'rgba(20,16,31,0.8)', border: '1px solid #3b2f5c', borderRadius: 4, cursor: 'pointer', fontFamily: PALETTE.font },
  cardWide: { width: 'min(720px, calc(100% - 32px))' },
  hint: { textAlign: 'center', fontSize: 12, color: PALETTE.textDim },
} satisfies Record<string, React.CSSProperties>;
