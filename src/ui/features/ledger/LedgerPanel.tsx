import { useSyncExternalStore } from 'react';
import { store } from '../../../app/services';
import { NODES } from '../../../data/nodes.data';
import { OFFICE } from '../../../data/office.data';
import { t } from '../../../i18n';
import { activeChapter, chapterStatus, type MorningReport, type OfficeState } from '../../../systems/office';
import { CHAPTERS } from '../../../data/chapters.data';
import { FACILITIES, FACILITY_IDS } from '../../../data/facilities.data';
import { facilityPrice, facilityRankNeeded } from '../../../systems/growth';
import { toNextRank } from '../../../systems/reputation';
import { RANKS } from '../../../data/reputation.data';
import { rankUnlocks } from '../rankUnlocks';
import { outcomeLabel } from '../lastRun';
import { panelCss as css } from '../panel';
import { priceStyle, rowStyle, useNav } from '../useNav';

// What the bookkeeper says this morning (rent, the city, expired offers).
function morningLines(m: MorningReport | null): string[] {
  if (!m) return [t('morning.quiet')];
  const lines: string[] = [];
  if (m.rentDue && m.debtAdded > 0) lines.push(t('morning.rentShort', { short: m.debtAdded }));
  else if (m.rentDue) lines.push(t('morning.rentPaid', { paid: m.rentPaid }));
  if (m.worsened.length > 0) lines.push(t('morning.worse', { nodes: m.worsened.map((id) => t(NODES[id].nameKey)).join(', ') }));
  if (m.overflowed?.length) lines.push(t('morning.overflow', { nodes: m.overflowed.map((id) => t(NODES[id].nameKey)).join(', ') }));
  if (m.expired > 0) lines.push(t('morning.expired', { count: m.expired }));
  if (m.rankUp !== null && m.rankUp !== undefined) lines.push(t('morning.rankUp', { name: t(RANKS[m.rankUp]!.nameKey) }));
  return lines.length > 0 ? lines : [t('morning.quiet')];
}

// 메인 스토리: which chapter, and how far its clues are.
function storyLine(s: Pick<OfficeState, 'chapters'>): string {
  const id = activeChapter(s);
  if (!id) return t('ledger.storyWait');
  const chapter = t(CHAPTERS[id].nameKey);
  if (chapterStatus(s, id) === 'ready') return t('ledger.storyReady', { chapter });
  return t('ledger.storyGather', { chapter, have: s.chapters[id]?.clues ?? 0, need: CHAPTERS[id].clues });
}

// What the next 평판 rank opens (or that this is the top).
function rankNextLine(s: { reputation: number; rankReached: number }): string {
  const next = toNextRank(s);
  if (!next) return t('ledger.rankTop');
  return t('ledger.rankNext', { need: next.need, unlocks: rankUnlocks(next.next).join(', ') });
}

// The bookkeeper's books: the day, rent and debt, money, trauma, record, last night.
export function LedgerPanel() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const rentIn = OFFICE.rentEvery - (s.day % OFFICE.rentEvery);
  return (
    <>
      <div style={{ fontSize: 15 }}>“{t('feature.ledger.line')} {morningLines(s.lastMorning).join(' ')}”</div>
      <div style={css.box}>
        <div style={css.row}><span>{t('ledger.day')}</span><span>{t('board.day', { day: s.day })}</span></div>
        <div style={css.row}><span>{t('ledger.rent')}</span><span>{t('ledger.rentDue', { rent: OFFICE.rent, days: rentIn })}</span></div>
        {s.debt > 0 && <div style={{ ...css.row, color: '#ff5d7a' }}><span>{t('ledger.debt')}</span><span>{s.debt}</span></div>}
        <div style={css.row}><span>{t('day.money')}</span><span>{s.money}</span></div>
        <div style={css.row}><span>{t('day.trauma')}</span><span>{s.trauma}</span></div>
        <div style={css.row}><span>{t('ledger.shards')}</span><span>{s.shards}</span></div>
        <div style={css.row}><span>{t('day.runs')}</span><span>{s.solved}</span></div>
        <div style={css.row}><span>{t('ledger.story')}</span><span>{storyLine(s)}</span></div>
        <div style={css.row}><span>{t('ledger.rank')}</span><span>{t('ledger.rankLine', { name: t(RANKS[s.rankReached]!.nameKey), points: s.reputation })}</span></div>
        <div style={{ ...css.row, fontSize: 12, color: '#c9bfe8' }}><span />{rankNextLine(s)}</div>
      </div>
      <Facilities />
      {s.lastRun && (
        <div style={css.box}>
          <div style={{ ...css.row, ...css.dim }}>{t('day.lastResult')}</div>
          <div style={css.row}><span>{outcomeLabel(s.lastRun)}</span><span>+{s.lastRun.settlement.moneyDelta}</span></div>
        </div>
      )}
    </>
  );
}

// 시설 공사: every office facility is ordered here (docs/rules/growth.md).
function Facilities() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const build = (i: number) => store.buildFacility(FACILITY_IDS[i]!);
  const [cursor, setCursor] = useNav(FACILITY_IDS.length, build);
  return (
    <div style={css.box}>
      <div style={{ ...css.row, ...css.dim }}>{t('ledger.facilities')}</div>
      {FACILITY_IDS.map((id, i) => {
        const f = FACILITIES[id];
        const level = s.facilities[id];
        const price = facilityPrice(s, id);
        const next = f.levelKeys[level];
        const needRank = facilityRankNeeded(s, id);
        const locked = needRank !== null && needRank > s.rankReached;
        return (
          <div key={id} style={rowStyle(i === cursor)} data-cursor={i === cursor || undefined} onMouseEnter={() => setCursor(i)} onClick={() => build(i)}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15 }}>{t(f.nameKey)} <span style={{ fontSize: 12, color: '#c9bfe8' }}>{level > 0 ? t('facility.level', { level }) : t('facility.none')}</span></div>
              <div style={{ fontSize: 12, color: '#c9bfe8' }}>{next ? `→ ${t(next)}` : t('facility.done')}</div>
            </div>
            {locked ? (
              <span style={{ ...priceStyle(false), fontFamily: 'inherit', fontSize: 12 }}>{t('facility.needRank', { rank: needRank })}</span>
            ) : (
              <span style={priceStyle(price !== null && s.money >= price)}>{price === null ? '' : t('facility.build', { cost: price })}</span>
            )}
          </div>
        );
      })}
      <div style={{ ...css.hint, marginTop: 6 }}>{t('list.keys')}</div>
    </div>
  );
}
