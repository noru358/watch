import { describe, expect, it } from 'vitest';
import { migrate, SAVE_VERSION } from '../src/core/SaveManager';
import { ACTIVES } from '../src/data/skills.data';
import { TRAINING } from '../src/data/training.data';
import { TRAUMA } from '../src/data/penalties.data';
import { WEAPONS } from '../src/data/weapons.data';
import { EXORCISTS } from '../src/data/protagonist.data';
import {
  activePassives,
  buildFacility,
  buyTraining,
  capitalTherapy,
  learnActive,
  loadoutOf,
  NO_FACILITIES,
  openSlot,
  packSupply,
  setSlotSide,
  slotOpenable,
  suppliesOffered,
  trainingPrice,
  traumaEffects,
  type GrowthState,
} from '../src/systems/growth';
import { makeEnemy, NO_INPUT, stepFloor, type Floor, type RiftInput } from '../src/systems/rift';
import { computeExorcistStats } from '../src/systems/run';
import { GameStore } from '../src/store/gameStore';
import type { TrainingId } from '../src/types/ids';
import { DT, duel } from './helpers';
import type { SeededRNG } from '../src/core/SeededRNG';

const g0 = (patch: Partial<GrowthState> = {}): GrowthState => ({
  money: 0, trauma: 0, shards: 0, training: {}, trainingBought: 0, facilities: { ...NO_FACILITIES }, supply: null, passives: {}, actives: [], active: null, rank: 4, ...patch,
});
const ALL = Object.keys(TRAINING) as TrainingId[];
const maxed = Object.fromEntries(ALL.map((id) => [id, TRAINING[id].max]));
const run = (f: Floor, rng: SeededRNG, seconds: number, input: Partial<RiftInput> = {}) => {
  for (let i = 0; i < Math.round(seconds / DT); i++) stepFloor(f, { ...NO_INPUT, ...input }, DT, rng);
};

describe('트레이닝', () => {
  it('prices rise with ranks in the line and with everything bought', () => {
    const g = g0({ money: 100000 });
    const first = trainingPrice(g, 'power_slash')!;
    expect(first).toBe(TRAINING.power_slash.cost);
    expect(buyTraining(g, 'power_slash')).toBe(first);
    expect(trainingPrice(g, 'power_slash')).toBe(Math.round((TRAINING.power_slash.cost * 2 * 1.02) / 10) * 10);
    expect(trainingPrice(g, 'feet_move')).toBe(Math.round((TRAINING.feet_move.cost * 1.02) / 10) * 10);
  });

  it('stops at the line maximum and needs the money', () => {
    const g = g0({ money: 100000 });
    for (let i = 0; i < 10; i++) buyTraining(g, 'focus_gauge');
    expect(g.training.focus_gauge).toBe(1);
    expect(trainingPrice(g, 'focus_gauge')).toBeNull();
    const poor = g0({ money: 10 });
    expect(buyTraining(poor, 'power_slash')).toBe(0);
    expect(poor.training.power_slash ?? 0).toBe(0);
  });

  it('everything maxed stays a modest gain (about +20 % damage, +33 % HP, +10 % speed)', () => {
    const base = computeExorcistStats('director', {}, [], 'newspaper_sword');
    const max = computeExorcistStats('director', maxed, [], 'newspaper_sword');
    expect(max.slash / base.slash).toBeCloseTo(1.2, 5);
    expect(max.maxHp).toBe(EXORCISTS.director.maxHp + 4);
    expect(max.moveSpeed / base.moveSpeed).toBeCloseTo(1.1, 5);
    expect(max.dashCooldown).toBeCloseTo(EXORCISTS.director.dashCooldown * 0.8, 5);
    expect(max.focusMax).toBe(WEAPONS.newspaper_sword.focusMax - 1);
  });

  it('keeps the damage order even fully trained: any normal hit < plain 발도 < counter', () => {
    const s = computeExorcistStats('director', maxed, [], 'newspaper_sword');
    const bestNormal = s.slash + s.comboBonus + s.bareSlashBonus;
    expect(bestNormal).toBeLessThan(s.drawSlash);
    expect(s.drawSlash).toBeLessThan(s.draw);
  });

  it('the whole tree costs weeks, not days (total price band)', () => {
    const g = g0({ money: 1e9 });
    let total = 0;
    for (let round = 0; round < 6; round++) for (const id of ALL) total += buyTraining(g, id);
    expect(g.trainingBought).toBe(ALL.reduce((n, id) => n + TRAINING[id].max, 0));
    expect(total).toBeGreaterThan(30000);
    expect(total).toBeLessThan(70000);
  });
});

describe('기술', () => {
  it('slots open in tier order for shards, one side on, swapping is free', () => {
    const g = g0({ shards: 10 });
    expect(slotOpenable(g, 'blade2')).toBe(false);
    expect(openSlot(g, 'blade1')).toBe(true);
    expect(g.shards).toBe(9);
    expect(activePassives(g)).toEqual(['dash_cut']);
    setSlotSide(g, 'blade1', 'b');
    expect(activePassives(g)).toEqual(['finisher_wave']);
    expect(g.shards).toBe(9);
    expect(openSlot(g, 'blade2')).toBe(true);
    expect(openSlot(g, 'blade3')).toBe(true);
    expect(g.shards).toBe(4);
    expect(openSlot(g, 'eye3')).toBe(false);
  });

  it('actives are learned with shards; the first one goes on L', () => {
    const g = g0({ shards: ACTIVES.talisman.cost });
    expect(learnActive(g, 'talisman')).toBe(true);
    expect(g.active).toBe('talisman');
    expect(learnActive(g, 'barrier')).toBe(false);
  });

  it('a stat passive changes the stats (two dashes, a dash you cannot be hit in)', () => {
    const s = computeExorcistStats('director', {}, [], 'newspaper_sword', ['double_dash', 'shadow_step']);
    expect(s.dashCharges).toBe(2);
    expect(s.dashIframes).toBe(s.dashTime);
  });
});

describe('perks in the night', () => {
  it('두 번 돌진: two dashes back to back, then the cooldown', () => {
    const { f, rng } = duel('cheonyeo', 6, [], { perks: ['double_dash'] });
    run(f, rng, DT, { dash: true, moveX: -1 });
    run(f, rng, 0.25);
    expect(f.player.dashCharges).toBe(1);
    run(f, rng, DT, { dash: true, moveX: -1 });
    run(f, rng, 0.25);
    expect(f.player.dashCharges).toBe(0);
  });

  it('마지막 숨 keeps the director at 1 HP once a night', () => {
    const { f, rng, e } = duel('dalgyal', 1.0, [], { perks: ['last_breath'] });
    f.player.hp = 1;
    e.state = 'chase';
    for (let i = 0; i < 400 && !f.used.includes('last_breath'); i++) run(f, rng, DT);
    expect(f.used).toContain('last_breath');
    expect(f.player.hp).toBe(1);
    expect(f.status).toBe('playing');
    run(f, rng, 6);
    expect(f.status).toBe('dead');
  });

  it('박카스 heals once when HP first drops below half', () => {
    const { f, rng } = duel('dalgyal', 1.0, [], { perks: ['bacchus'] });
    const max = f.stats.maxHp;
    f.player.hp = Math.floor(max / 2);
    run(f, rng, 4);
    expect(f.used).toContain('bacchus');
  });

  it('부적 던지기 flies along the aim, hits the first ghost and stuns it', () => {
    const { f, rng, e } = duel('dalgyal', 4, [], { active: 'talisman' });
    const hp = e.hp;
    run(f, rng, DT, { skill: true, aim: 0 });
    run(f, rng, 0.5, { aim: 0 });
    expect(e.hp).toBe(hp - ACTIVES.talisman.damage);
    expect(e.state).toBe('stun');
    expect(f.skillCd).toBeGreaterThan(0);
  });

  it('소금 뿌리기 clears the wisps around', () => {
    const { f, rng } = duel('cheonyeo', 6, [], { active: 'salt_burst' });
    for (let i = 0; i < 4; i++) makeEnemy(f, 'dokkaebibul', { x: 10.5 + (i % 2 ? 1.5 : -1.5), y: 10.5 + (i < 2 ? 1 : -1) });
    run(f, rng, DT, { skill: true });
    expect(f.enemies.filter((x) => x.kind === 'dokkaebibul')).toHaveLength(0);
  });
});

describe('트라우마', () => {
  it('effects come in steps: fewer cards, weaker start, grounded', () => {
    expect(traumaEffects(0)).toEqual({ cardOffer: TRAUMA.cards, hpPenalty: 0, grounded: false });
    expect(traumaEffects(TRAUMA.fewerCardsAt).cardOffer).toBe(TRAUMA.fewerCards);
    expect(traumaEffects(TRAUMA.weakAt).hpPenalty).toBe(TRAUMA.weakHp);
    expect(traumaEffects(TRAUMA.groundedAt).grounded).toBe(true);
  });

  it('자본 치료 costs money; 휴식하기 passes a day and heals more with a better sofa', () => {
    const g = g0({ money: TRAUMA.capitalCost, trauma: 3 });
    expect(capitalTherapy(g)).toBe(true);
    expect(g.trauma).toBe(3 - TRAUMA.capitalAmount);
    expect(capitalTherapy(g)).toBe(false);
    const store = new GameStore({ trauma: 5, facilities: { desk: 0, bench: 0, sofa: 1 } });
    const day = store.getState().day;
    store.restToday();
    expect(store.getState().day).toBe(day + 1);
    expect(store.getState().trauma).toBe(5 - TRAUMA.rest - 1);
  });

  it('a weak night starts below max HP', () => {
    const l = loadoutOf(g0({ trauma: TRAUMA.weakAt }));
    expect(l.hpPenalty).toBe(TRAUMA.weakHp);
    expect(l.cardOffer).toBe(TRAUMA.fewerCards);
  });
});

describe('시설 · 보급품', () => {
  it('facilities level up for rising prices; the bench offers more supplies per level', () => {
    const g = g0({ money: 10000 });
    expect(suppliesOffered(g)).toEqual([]);
    expect(buildFacility(g, 'bench')).toBe(500);
    expect(suppliesOffered(g)).toEqual(['salt_pack']);
    buildFacility(g, 'bench');
    buildFacility(g, 'bench');
    expect(suppliesOffered(g)).toEqual(['salt_pack', 'bacchus', 'map_copy']);
    expect(buildFacility(g, 'bench')).toBe(0);
  });

  it('one supply at a time: switching refunds, the night uses it up', () => {
    const g = g0({ money: 500, facilities: { desk: 0, bench: 3, sofa: 0 } });
    expect(packSupply(g, 'salt_pack')).toBe(true);
    expect(g.money).toBe(440);
    expect(packSupply(g, 'map_copy')).toBe(true);
    expect(g.money).toBe(380);
    expect(loadoutOf(g).perks).toContain('map_copy');
    const store = new GameStore({ money: 500, facilities: { desk: 0, bench: 1, sofa: 0 } });
    store.packSupply('salt_pack');
    const night = store.startNight();
    expect(night.loadout.perks).toContain('salt_pack');
    expect(store.getState().supply).toBeNull();
  });
});

describe('save v4', () => {
  it('a v3 save comes up with nothing grown and a board to refill', () => {
    const v3 = {
      schemaVersion: 3, money: 50, trauma: 1, solved: 2, seedBase: 4, runCounter: 3, day: 5, debt: 0,
      contamination: null, known: [], board: [{ id: 1 }], nextOfferId: 2, storyDone: [], seen: ['intro'],
    };
    const v = migrate(v3)!;
    expect(v.schemaVersion).toBe(SAVE_VERSION);
    expect(v.board).toEqual([]);
    expect(v.training).toEqual({});
    expect(v.facilities).toEqual({ desk: 0, bench: 0, sofa: 0 });
    expect(v.shards).toBe(0);
    expect(v.wanted).toEqual([]);
    const store = new GameStore(v);
    expect(store.getState().board.length).toBeGreaterThan(0);
  });
});

describe('경리 책상 upgrade', () => {
  it('posts the extra offer at once', () => {
    const store = new GameStore({ money: 5000 });
    const before = store.getState().board.filter((o) => o.kind === 'general').length;
    store.buildFacility('desk');
    expect(store.getState().board.filter((o) => o.kind === 'general').length).toBe(before + 1);
  });
});
