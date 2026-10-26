import { useSyncExternalStore } from 'react';
import { phoneText } from '../app/toast';

// The director's phone lights up in the corner with a text (rent day, …). Never takes input.
export function PhoneToast() {
  const m = useSyncExternalStore(phoneText.subscribe, phoneText.get);
  if (!m) return null;
  return (
    <div key={m.id} style={{ position: 'absolute', right: 18, bottom: 54, width: 250, pointerEvents: 'none', animation: 'nwPhoneIn 260ms ease-out' }}>
      <style>{'@keyframes nwPhoneIn{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}'}</style>
      <div style={{ background: '#f4f1ea', color: '#1d1830', borderRadius: 14, padding: '10px 12px', boxShadow: '0 8px 20px rgba(0,0,0,0.45)', border: '3px solid #2a2440' }}>
        <div style={{ fontSize: 11, color: '#6b5f73', display: 'flex', justifyContent: 'space-between' }}>
          <span>✉ {m.from}</span>
          <span>08:12</span>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.45, marginTop: 4 }}>{m.body}</div>
      </div>
    </div>
  );
}
