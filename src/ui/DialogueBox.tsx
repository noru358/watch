import { useEffect, useSyncExternalStore } from 'react';
import { dialogue, endScene, nextLine } from '../app/dialogue';
import { input } from '../app/services';
import { SCENES, SPEAKERS, type SpeakerId } from '../data/story.data';
import { t } from '../i18n';
import directorPortrait from '../../assets/master/director-master@8x.png';

// Story scenes (mockup A, docs/design/1-foundation/ui.md "대화창"): a box along the bottom with a
// name tag and a big portrait. Enter / J / click: next line. Esc: skip the scene.
const LOOK = {
  box: 'rgba(14,11,24,0.95)',
  accent: '#41e0c8',
  ink: '#f6e7c1',
  dim: '#9d8fc4',
  shade: 'rgba(10,8,18,0.45)',
  silhouette: '#1b1530',
} as const;

function Portrait({ speaker, active }: { speaker: SpeakerId; active: boolean }) {
  const side = SPEAKERS[speaker].side;
  const pos = side === 'left' ? { left: 28 } : { right: 28 };
  const style = { position: 'absolute' as const, bottom: 120, ...pos, opacity: active ? 1 : 0.45, transition: 'opacity 120ms' };
  if (speaker === 'director') return <img src={directorPortrait} alt="" style={{ ...style, width: 224, height: 252, imageRendering: 'pixelated' }} />;
  // Bookkeeper and Wolha have no portrait art yet: a silhouette holds the place.
  const tint = speaker === 'wolha' ? '#e8e8ff' : '#7d6a9e';
  return (
    <div aria-hidden="true" style={{ ...style, width: 170, height: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
      <div style={{ width: 84, height: 84, borderRadius: '50%', background: tint, opacity: 0.85 }} />
      <div style={{ width: 150, height: 130, marginTop: -6, borderRadius: '70px 70px 10px 10px', background: tint, opacity: 0.6 }} />
    </div>
  );
}

export function DialogueBox() {
  const d = useSyncExternalStore(dialogue.subscribe, dialogue.get);

  useEffect(
    () =>
      input.onAction((action, ctx) => {
        if (ctx !== 'modal' || !dialogue.get()) return;
        if (action === 'confirm') nextLine();
        if (action === 'pause') endScene();
      }),
    [],
  );

  if (!d) return null;
  const lines = SCENES[d.scene];
  const line = lines[d.line]!;
  const speakers = [...new Set(lines.map((l) => l.speaker))];
  return (
    <div onMouseDown={() => nextLine()} style={{ position: 'absolute', inset: 0, background: LOOK.shade, pointerEvents: 'auto', fontFamily: 'inherit', cursor: 'pointer' }}>
      {speakers.map((s) => <Portrait key={s} speaker={s} active={s === line.speaker} />)}
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 20, minHeight: 110, background: LOOK.box, border: `2px solid ${LOOK.accent}`, borderRadius: 8, padding: '24px 26px 12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', color: LOOK.ink }}>
        <span style={{ position: 'absolute', top: -16, [SPEAKERS[line.speaker].side]: 22, background: LOOK.accent, color: '#14101f', fontWeight: 700, fontSize: 18, padding: '2px 14px', borderRadius: 4 }}>
          {t(SPEAKERS[line.speaker].nameKey)}
        </span>
        <p style={{ margin: 0, fontSize: 19, lineHeight: 1.6 }}>{t(line.key)}</p>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: LOOK.dim, paddingTop: 8 }}>
          <span>{t('talk.keys')}</span>
          <span style={{ color: LOOK.accent, fontSize: 15 }}>{d.line + 1 < lines.length ? '▼' : '■'}</span>
        </div>
      </div>
    </div>
  );
}
