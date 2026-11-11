import { useSyncExternalStore } from 'react';
import { store } from '../../../app/services';
import { closeFeature, openFeature } from '../../../app/features';
import { OFFICE } from '../../../data/office.data';
import { num, t, won, type TKey } from '../../../i18n';
import { NODES } from '../../../data/nodes.data';
import type { Morning } from '../../../store/staffDesk';
import { activeChapter, chapterStatus, type OfficeState } from '../../../systems/office';
import { CHAPTERS } from '../../../data/chapters.data';
import { FACILITIES, FACILITY_IDS } from '../../../data/facilities.data';
import { facilityPrice, facilityRankNeeded } from '../../../systems/growth';
import { toNextRank } from '../../../systems/reputation';
import { RANKS } from '../../../data/reputation.data';
import { rankUnlocks } from '../rankUnlocks';
import { outcomeLabel } from '../lastRun';
import { panelCss as css } from '../panel';
import { priceStyle, rowStyle, useNav } from '../useNav';
import { staffRows, type LedgerRow } from './staffRows';
import { staffName } from '../staffName';

// The staff's night and the wages, one line each (docs/rules/staff.md).
export function staffLines(m: Morning): string[] {
  const out: string[] = [];
  for (const l of m.staff ?? []) {
    const name = staffName(l);
    const offer = l.node ? `${t(NODES[l.node].nameKey)} ${l.objective ? t(`board.goal.${l.objective}` as TKey) : ''}`.trim() : '';
    if (l.offerId === null) continue; // resting is not news
    out.push(l.success ? t('staff.done', { name, offer, fee: l.fee }) : t('staff.failed', { name, offer, n: l.trauma }));
  }
  if (m.wages) out.push(t('staff.wages', { paid: m.wages }));
  if (m.quit && m.quit.length > 0) out.push(t('staff.quit', { names: m.quit.map(staffName).join(', ') }));
  return out;
}

// What the bookkeeper says this morning (rent, expired offers, the staff's night).
export function morningLines(m: Morning | null): string[] {
  if (!m) return [t('morning.quiet')];
  const lines: string[] = [];
  if (m.rentDue && m.debtAdded > 0) lines.push(t('morning.rentShort', { short: m.debtAdded }));
  else if (m.rentDue) lines.push(t('morning.rentPaid', { paid: m.rentPaid }));
  if (m.urgentMissed > 0) lines.push(t('morning.urgentMissed'));
  lines.push(...staffLines(m));
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

// The bookkeeper's books, two columns so the whole desk fits one screen: left the day, money, record
// and last night; right one list with one cursor — 직원, 구인, then 시설 공사.
export function LedgerPanel() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const rentIn = OFFICE.rentEvery - (s.day % OFFICE.rentEvery);
  return (
    <>
      <div style={{ fontSize: 15 }}>“{t('feature.ledger.line')} {morningLines(s.lastMorning).join(' ')}”</div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={css.box}>
            <div style={css.row}><span>{t('ledger.day')}</span><span>{t('board.day', { day: s.day })}</span></div>
            <div style={css.row}><span>{t('ledger.rent')}</span><span>{t('ledger.rentDue', { rent: OFFICE.rent, days: rentIn })}</span></div>
            {s.debt > 0 && <div style={{ ...css.row, color: '#ff5d7a' }}><span>{t('ledger.debt')}</span><span>{won(s.debt)}</span></div>}
            <div style={css.row}><span>{t('day.money')}</span><span>{won(s.money)}</span></div>
            <div style={css.row}><span>{t('day.trauma')}</span><span>{s.trauma}</span></div>
            <div style={css.row}><span>{t('ledger.shards')}</span><span>{num(s.shards)}</span></div>
            <div style={css.row}><span>{t('day.runs')}</span><span>{num(s.solved)}</span></div>
            <div style={css.row}><span>{t('ledger.story')}</span><span>{storyLine(s)}</span></div>
            <div style={css.row}><span>{t('ledger.rank')}</span><span>{t('ledger.rankLine', { name: t(RANKS[s.rankReached]!.nameKey), points: s.reputation })}</span></div>
            <div style={{ ...css.row, fontSize: 12, color: '#c9bfe8' }}><span />{rankNextLine(s)}</div>
          </div>
          {s.lastRun && (
            <div style={css.box}>
              <div style={{ ...css.row, ...css.dim }}>{t('day.lastResult')}</div>
              <div style={css.row}><span>{outcomeLabel(s.lastRun)}</span><span>+{won(s.lastRun.settlement.moneyDelta)}</span></div>
              <button style={{ ...css.chip, marginTop: 6 }} onClick={() => { closeFeature(); openFeature('morning'); }}>{t('morning.open')}</button>
            </div>
          )}
        </div>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <Desk />
        </div>
      </div>
    </>
  );
}

// 직원 and 구인 (docs/rules/staff.md), then 시설 공사 (docs/rules/growth.md): one list, one cursor.
function Desk() {
  const s = useSyncExternalStore(store.subscribe, store.getState);
  const crew = staffRows(s);
  const people = [...crew.roster, ...crew.hire];
  const act = (i: number) => (i < people.length ? people[i]!.act() : store.buildFacility(FACILITY_IDS[i - people.length]!));
  const [cursor, setCursor] = useNav(people.length + FACILITY_IDS.length, act);
  const head = (text: string) => <div style={{ ...css.row, ...css.dim, marginTop: 8 }}>{text}</div>;
  const row = (r: LedgerRow, i: number) => (
    <div key={r.key}>
      {r.head && head(r.head)}
      <div style={rowStyle(i === cursor)} data-cursor={i === cursor || undefined} onMouseMove={() => setCursor(i)} onClick={r.act}>
        <div style={{ flex: 1 }}>{r.body}</div>
        {r.price}
      </div>
    </div>
  );
  return (
    <div style={css.box}>
      {s.staff.length === 0 && <div style={{ ...css.row, ...css.dim }}>{t('staff.none')}</div>}
      {crew.roster.map((r, k) => row(r, k))}
      {head(crew.hireHead)}
      {crew.hireNote && <div style={{ fontSize: 12, color: '#c9bfe8', padding: '2px 0' }}>{crew.hireNote}</div>}
      {crew.hire.map((r, k) => row(r, crew.roster.length + k))}
      {head(t('ledger.facilities'))}
      {FACILITY_IDS.map((id, k) => {
        const i = people.length + k;
        const f = FACILITIES[id];
        const level = s.facilities[id];
        const price = facilityPrice(s, id);
        const next = f.levelKeys[level];
        const needRank = facilityRankNeeded(s, id);
        const locked = needRank !== null && needRank > s.rankReached;
        return (
          <div key={id} style={rowStyle(i === cursor)} data-cursor={i === cursor || undefined} onMouseMove={() => setCursor(i)} onClick={() => act(i)}>
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
