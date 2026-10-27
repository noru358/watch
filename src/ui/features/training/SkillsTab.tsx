import { useSyncExternalStore } from 'react';
import { store } from '../../../app/services';
import { ACTIVE_IDS, ACTIVES, DUOS, PASSIVES, SKILL_BRANCHES, SKILL_SLOTS, UPGRADE_IDS, UPGRADES } from '../../../data/skills.data';
import { t } from '../../../i18n';
import { activeDuos, slotOpenable, type GrowthState } from '../../../systems/growth';
import type { DuoId, SkillSlotId } from '../../../types/ids';
import { panelCss as css } from '../panel';
import { rowStyle, useNav } from '../useNav';

// Slots in panel order: each branch top to bottom (tiers come from SKILL_SLOTS, so a new tier is data only).
const SLOTS = SKILL_BRANCHES.flatMap((b) => (Object.keys(SKILL_SLOTS) as SkillSlotId[]).filter((id) => id.slice(0, -1) === b));
const DUO_IDS = Object.keys(DUOS) as DuoId[];

// 기술 (docs/rules/growth.md): passive slots (one side on, A / D to switch), duos (on by themselves),
// actives for L and the 개조 of the one on L. Paid with 심연 파편.
export function SkillsTab() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const g = { ...s, rank: s.rankReached } as unknown as GrowthState;
  const upgrades = s.active ? UPGRADE_IDS.filter((u) => UPGRADES[u].of === s.active) : [];
  const count = SLOTS.length + ACTIVE_IDS.length + upgrades.length;
  const act = (i: number) => {
    const slot = SLOTS[i];
    if (slot) {
      if (s.passives[slot] === undefined) store.openSkill(slot);
      else store.setSkillSide(slot, (s.passives[slot]! + 1) % SKILL_SLOTS[slot].sides.length);
      return;
    }
    const id = ACTIVE_IDS[i - SLOTS.length];
    if (id) {
      if (s.actives.includes(id)) store.equipActive(id);
      else store.learnActive(id);
      return;
    }
    const u = upgrades[i - SLOTS.length - ACTIVE_IDS.length];
    if (u) store.chooseUpgrade(u);
  };
  const [cursor, setCursor] = useNav(count, act, (action, i) => {
    const slot = SLOTS[i];
    const on = slot ? store.getState().passives[slot] : undefined;
    if (!slot || on === undefined) return;
    const n = SKILL_SLOTS[slot].sides.length;
    if (action === 'left') store.setSkillSide(slot, (on + n - 1) % n);
    if (action === 'right') store.setSkillSide(slot, (on + 1) % n);
  });
  const duosOn = activeDuos(g);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
        {SKILL_BRANCHES.map((b) => (
          <div key={b} style={{ ...css.box, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ ...css.dim, fontSize: 13, padding: '0 6px' }}>{t(`skill.branch.${b}`)}</div>
            {SLOTS.filter((slot) => slot.startsWith(b)).map((slot) => {
              const i = SLOTS.indexOf(slot);
              const data = SKILL_SLOTS[slot];
              const on = s.passives[slot];
              const tier = Number(slot.slice(-1));
              const prevOpen = tier === 1 || s.passives[`${b}${tier - 1}` as SkillSlotId] !== undefined;
              return (
                <div key={slot} style={{ ...rowStyle(i === cursor), flexDirection: 'column', alignItems: 'stretch', gap: 4 }} data-cursor={i === cursor || undefined} onMouseEnter={() => setCursor(i)}>
                  {data.sides.map((id, side) => {
                    const p = PASSIVES[id];
                    const lit = on === side;
                    return (
                      <div key={id} onClick={() => (on !== undefined ? store.setSkillSide(slot, side) : act(i))}
                        style={{ opacity: on !== undefined && !lit ? 0.45 : on !== undefined ? 1 : 0.7, borderLeft: `3px solid ${lit ? '#41e0c8' : 'transparent'}`, paddingLeft: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: lit ? 700 : 400 }}>{t(p.nameKey)}{lit ? ` · ${t('skill.on')}` : ''}</div>
                        <div style={{ fontSize: 12, color: '#c9bfe8' }}>{t(p.descKey)}</div>
                      </div>
                    );
                  })}
                  {on === undefined && (
                    <div style={{ fontSize: 12, color: slotOpenable(g, slot) ? '#41e0c8' : '#7d6f9e', textAlign: 'right' }}>
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
        <div style={{ ...css.dim, fontSize: 13, padding: '0 6px 4px' }}>{t('skill.duos')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 6 }}>
          {DUO_IDS.map((id) => (
            <div key={id} style={{ padding: '4px 8px', opacity: duosOn.includes(id) ? 1 : 0.55, borderLeft: `3px solid ${duosOn.includes(id) ? '#41e0c8' : 'transparent'}` }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t(DUOS[id].nameKey)} <span style={{ fontSize: 11, fontWeight: 400, color: '#c9bfe8' }}>{duosOn.includes(id) ? t('skill.duoOn') : t('skill.duoOff')}</span></div>
              <div style={{ fontSize: 12, color: '#c9bfe8' }}>{t(DUOS[id].descKey)}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...css.box, padding: 8 }}>
        <div style={{ ...css.dim, fontSize: 13, padding: '0 6px 4px' }}>{t('skill.actives')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
          {ACTIVE_IDS.map((id, k) => {
            const i = SLOTS.length + k;
            const a = ACTIVES[id];
            const learned = s.actives.includes(id);
            const equipped = s.active === id;
            return (
              <div key={id} style={rowStyle(i === cursor)} data-cursor={i === cursor || undefined} onMouseEnter={() => setCursor(i)} onClick={() => act(i)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: equipped ? 700 : 400 }}>{t(a.nameKey)}{s.upgrades[id] ? <span style={{ fontSize: 11, color: '#41e0c8' }}> · {t(UPGRADES[s.upgrades[id]!].nameKey)}</span> : null}</div>
                  <div style={{ fontSize: 12, color: '#c9bfe8' }}>{t(a.descKey)}</div>
                </div>
                <span style={{ fontSize: 12, color: equipped ? '#41e0c8' : learned ? '#f6e7c1' : s.shards >= a.cost ? '#41e0c8' : '#7d6f9e', whiteSpace: 'nowrap' }}>
                  {equipped ? t('skill.equipped') : learned ? t('skill.equip') : t('skill.learn', { cost: a.cost })}
                </span>
              </div>
            );
          })}
        </div>
        {upgrades.length > 0 && (
          <>
            <div style={{ ...css.dim, fontSize: 13, padding: '8px 6px 4px' }}>{t('skill.upgrades')}</div>
            {upgrades.map((u, k) => {
              const i = SLOTS.length + ACTIVE_IDS.length + k;
              const on = s.upgrades[UPGRADES[u].of] === u;
              return (
                <div key={u} style={rowStyle(i === cursor)} data-cursor={i === cursor || undefined} onMouseEnter={() => setCursor(i)} onClick={() => act(i)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: on ? 700 : 400 }}>{t(UPGRADES[u].nameKey)}</div>
                    <div style={{ fontSize: 12, color: '#c9bfe8' }}>{t(UPGRADES[u].descKey)}</div>
                  </div>
                  <span style={{ fontSize: 12, color: on ? '#41e0c8' : s.shards >= UPGRADES[u].cost ? '#f6e7c1' : '#7d6f9e' }}>{on ? t('skill.upgradeOn') : t('skill.learn', { cost: UPGRADES[u].cost })}</span>
                </div>
              );
            })}
          </>
        )}
      </div>
      <div style={css.hint}>{t('skill.keys2')}</div>
    </>
  );
}
