import { useSyncExternalStore } from 'react';
import { store } from '../../../app/services';
import { ACTIVES, PASSIVES, SKILL_BRANCHES, SKILL_SLOTS } from '../../../data/skills.data';
import { t } from '../../../i18n';
import { slotOpenable, type GrowthState } from '../../../systems/growth';
import type { ActiveId, SkillSlotId } from '../../../types/ids';
import { panelCss as css } from '../panel';
import { rowStyle, useNav } from '../useNav';

const SLOTS = SKILL_BRANCHES.flatMap((b) => [1, 2, 3].map((n) => `${b}${n}` as SkillSlotId));
const ACTIVE_IDS = Object.keys(ACTIVES) as ActiveId[];

// 기술: 3 branches × 3 slots (A or B on), then the actives for L. Paid with 심연 파편.
export function SkillsTab() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const g = s as unknown as GrowthState;
  const count = SLOTS.length + ACTIVE_IDS.length;
  const act = (i: number) => {
    const slot = SLOTS[i];
    if (slot) {
      if (!s.passives[slot]) store.openSkill(slot);
      else store.setSkillSide(slot, s.passives[slot] === 'a' ? 'b' : 'a');
      return;
    }
    const id = ACTIVE_IDS[i - SLOTS.length]!;
    if (s.actives.includes(id)) store.equipActive(id);
    else store.learnActive(id);
  };
  const [cursor, setCursor] = useNav(count, act, (action, i) => {
    const slot = SLOTS[i];
    if (!slot || !store.getState().passives[slot]) return;
    if (action === 'left') store.setSkillSide(slot, 'a');
    if (action === 'right') store.setSkillSide(slot, 'b');
  });

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
        {SKILL_BRANCHES.map((b) => (
          <div key={b} style={{ ...css.box, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ ...css.dim, fontSize: 13, padding: '0 6px' }}>{t(`skill.branch.${b}`)}</div>
            {[1, 2, 3].map((n) => {
              const slot = `${b}${n}` as SkillSlotId;
              const i = SLOTS.indexOf(slot);
              const data = SKILL_SLOTS[slot];
              const on = s.passives[slot];
              const canOpen = slotOpenable(g, slot);
              const prevOpen = n === 1 || !!s.passives[`${b}${n - 1}` as SkillSlotId];
              return (
                <div key={slot} style={{ ...rowStyle(i === cursor), flexDirection: 'column', alignItems: 'stretch', gap: 4 }} onMouseEnter={() => setCursor(i)}>
                  {(['a', 'b'] as const).map((side) => {
                    const p = PASSIVES[data[side]];
                    const lit = on === side;
                    return (
                      <div key={side} onClick={() => (on ? store.setSkillSide(slot, side) : act(i))}
                        style={{ opacity: on && !lit ? 0.45 : on ? 1 : 0.7, borderLeft: `3px solid ${lit ? '#41e0c8' : 'transparent'}`, paddingLeft: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: lit ? 700 : 400 }}>{t(p.nameKey)}{lit ? ` · ${t('skill.on')}` : ''}</div>
                        <div style={{ fontSize: 12, color: '#c9bfe8' }}>{t(p.descKey)}</div>
                      </div>
                    );
                  })}
                  {!on && (
                    <div style={{ fontSize: 12, color: canOpen ? '#41e0c8' : '#7d6f9e', textAlign: 'right' }}>
                      {prevOpen ? t('skill.open', { cost: data.cost }) : t('skill.locked')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ ...css.box, padding: 8 }}>
        <div style={{ ...css.dim, fontSize: 13, padding: '0 6px 4px' }}>{t('skill.actives')}</div>
        {ACTIVE_IDS.map((id, k) => {
          const i = SLOTS.length + k;
          const a = ACTIVES[id];
          const learned = s.actives.includes(id);
          const equipped = s.active === id;
          return (
            <div key={id} style={rowStyle(i === cursor)} onMouseEnter={() => setCursor(i)} onClick={() => act(i)}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: equipped ? 700 : 400 }}>{t(a.nameKey)}</div>
                <div style={{ fontSize: 12, color: '#c9bfe8' }}>{t(a.descKey)}</div>
              </div>
              <span style={{ fontSize: 12, color: equipped ? '#41e0c8' : learned ? '#f6e7c1' : s.shards >= a.cost ? '#41e0c8' : '#7d6f9e', whiteSpace: 'nowrap' }}>
                {equipped ? t('skill.equipped') : learned ? t('skill.equip') : t('skill.learn', { cost: a.cost })}
              </span>
            </div>
          );
        })}
      </div>
      <div style={css.hint}>{t('skill.keys')}</div>
    </>
  );
}
