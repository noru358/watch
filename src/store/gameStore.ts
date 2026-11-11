import type { SaveData } from '../core/SaveManager';
import { SeededRNG } from '../core/SeededRNG';
import * as desk from './staffDesk';
import type { ActiveId, FacilityId, Phase, SceneId, SkillSlotId, SupplyId, TrainingId, UpgradeId } from '../types/ids';
import { rollDrop, type GearItem } from '../systems/gear';
import * as growth from '../systems/growth';
import { computeExorcistStats, settleRun, type RunResult } from '../systems/run';
import { advanceDay, morningSeed, canJoin, nightDifficulty, refillBoard, resolveNight, type ContractOffer } from '../systems/office';
import { freshState, growthOf, office, planOf, toSave, type GameState, type NightPlan, type NightSettlement } from './state';

export type { GameState, LastRun, NightPlan, NightSettlement } from './state';

type Listener = () => void;

// Single source of truth shared by React (useSyncExternalStore) and Phaser (Rule 3).
export class GameStore {
  private state: GameState;
  private listeners = new Set<Listener>();

  constructor(initial: Partial<GameState> = {}) {
    this.state = freshState(initial);
  }

  // 새로 시작 (title screen): everything back to day 1 with a new base seed. The autosave
  // then overwrites the old save.
  newGame(seedBase: number): void {
    this.state = freshState({ seedBase, phase: this.state.phase });
    this.listeners.forEach((fn) => fn());
  }

  getState = (): GameState => this.state;

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private set(patch: Partial<GameState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  // What goes into the save file (long-lived office state only).
  toSave(): SaveData {
    return toSave(this.state);
  }

  // ---- growth (systems/growth does the rules; the store only applies the result) ----

  private grow(fn: (g: growth.GrowthState) => unknown): boolean {
    const g = growthOf(this.state);
    const ok = fn(g);
    if (!ok) return false;
    const { rank: _rank, ...rest } = g;
    this.set(rest);
    return true;
  }

  train(id: TrainingId): boolean {
    return this.grow((g) => growth.buyTraining(g, id) > 0);
  }

  openSkill(slot: SkillSlotId): boolean {
    return this.grow((g) => growth.openSlot(g, slot));
  }

  setSkillSide(slot: SkillSlotId, side: number): void {
    this.grow((g) => (growth.setSlotSide(g, slot, side), true));
  }

  learnActive(id: ActiveId): boolean {
    return this.grow((g) => growth.learnActive(g, id));
  }

  equipActive(id: ActiveId): void {
    this.grow((g) => (growth.equipActive(g, id), true));
  }

  chooseUpgrade(id: UpgradeId): boolean {
    return this.grow((g) => growth.chooseUpgrade(g, id));
  }

  // ---- 장신구 ----
  toggleWear(id: number): boolean {
    return this.grow((g) => growth.toggleWear(g, id));
  }

  enhanceGear(id: number): boolean {
    return this.grow((g) => growth.enhanceGear(g, id) > 0);
  }

  rerollGear(id: number, sub: number): boolean {
    return this.grow((g) => growth.rerollGear(g, id, sub, this.state.seedBase ^ this.state.runCounter));
  }

  meltGear(id: number): boolean {
    return this.grow((g) => growth.meltGear(g, id) > 0);
  }

  // A bigger 경리 책상 shows at once: the extra offer is posted now, not next morning.
  buildFacility(id: FacilityId): boolean {
    if (!this.grow((g) => growth.buildFacility(g, id) > 0)) return false;
    if (id === 'desk') {
      const o = office(this.state);
      refillBoard(o, new SeededRNG(morningSeed(this.state.seedBase, o.day) ^ 0x5eed));
      this.set({ ...o });
    }
    return true;
  }

  packSupply(id: SupplyId | null): boolean {
    return this.grow((g) => growth.packSupply(g, id));
  }

  capitalTherapy(): boolean {
    return this.grow((g) => growth.capitalTherapy(g));
  }

  // ---- staff (rules in systems/staff, wiring in staffDesk.ts) ----

  hireStaff(index: number): boolean {
    const patch = desk.hire(this.state, index);
    if (patch) this.set(patch);
    return !!patch;
  }

  trainStaff(id: number): boolean {
    const patch = desk.train(this.state, id);
    if (patch) this.set(patch);
    return !!patch;
  }

  // R on the board: the next free staff member on this offer, then nobody.
  cycleAssign(offerId: number): void {
    const offer = this.state.board.find((x) => x.id === offerId);
    const assign = offer ? desk.cycleAssign(this.state, offerId, offer) : null;
    if (assign) this.set({ assign });
  }

  // 휴식하기: no night out; the day passes (rent, the city, deadlines) and trauma comes down.
  restToday(): void {
    const o = office(this.state);
    const crew = desk.staffNight(this.state, o, [], this.state.facilities.sofa);
    const morning = advanceDay(o, new SeededRNG(morningSeed(this.state.seedBase, o.day + 1)));
    const paid = desk.staffMorning(crew.staff, o, morning);
    this.set({
      ...o,
      staff: paid.staff,
      assign: {},
      trauma: Math.max(0, this.state.trauma - growth.restAmount(this.state)),
      activeOfferId: null,
      joined: [],
      lastRun: null,
      lastMorning: { ...morning, rankUp: crew.rankUp ?? morning.rankUp, staff: crew.lines, ...paid.report },
    });
  }

  // The night starts: tonight's seed and loadout; the packed supply is used up.
  startNight(): { seed: number; loadout: growth.Loadout } {
    const loadout = growth.loadoutOf(growthOf(this.state));
    const seed = this.takeRunSeed();
    if (this.state.supply) this.set({ supply: null });
    return { seed, loadout };
  }

  // ---- actions ----

  markSeen(id: SceneId): void {
    if (this.state.seen.includes(id)) return;
    this.set({ seen: [...this.state.seen, id] });
  }

  setPhase(phase: Phase): void {
    this.set({ phase });
  }

  selectOffer(id: number | null): void {
    if (id !== null && !this.state.board.some((o) => o.id === id)) return;
    const node = this.state.board.find((o) => o.id === id)?.node;
    // Tonight's set lives in one district: choosing elsewhere clears it.
    const joined = this.state.joined.filter((j) => this.state.board.find((o) => o.id === j)?.node === node);
    this.set({ activeOfferId: id, joined });
  }

  // 합동 출동: put the chosen offer into tonight's set, or take it out. False if it cannot join.
  toggleJoin(): boolean {
    const id = this.state.activeOfferId;
    if (id === null) return false;
    if (this.state.joined.includes(id)) {
      this.set({ joined: this.state.joined.filter((j) => j !== id) });
      return true;
    }
    const next = [...this.state.joined, id];
    if (!canJoin(next.map((j) => this.state.board.find((o) => o.id === j)!))) return false;
    this.set({ joined: next });
    return true;
  }

  // The offers tonight is for: what the board shows goes out. The set, when the sheet on top is
  // one of its offers; otherwise just that sheet (a main story or 추격 sheet never takes the set).
  tonightOffers(): ContractOffer[] {
    const sel = this.state.activeOfferId;
    const ids = sel !== null && this.state.joined.includes(sel) ? this.state.joined : sel !== null ? [sel] : [];
    return ids.map((id) => this.state.board.find((o) => o.id === id)).filter((o): o is ContractOffer => !!o);
  }

  // Tonight as a night plan (null if nothing valid is chosen).
  nightPlan(): NightPlan | null {
    const offers = this.tonightOffers();
    if (offers.length === 0) return null;
    return planOf(offers);
  }

  // Fallback when nothing is chosen (e.g. dev reload straight into the night): the first offer.
  firstPlan(): NightPlan {
    return planOf([this.state.board[0]!]);
  }

  // Seed for the next night; advances the counter so every run differs.
  takeRunSeed(): number {
    const seed = (this.state.seedBase * 7919 + this.state.runCounter * 104729) >>> 0;
    this.set({ runCounter: this.state.runCounter + 1 });
    return seed;
  }

  // The morning report was opened (it opens by itself once per morning).
  markReportShown(): void {
    if (this.state.lastRun && !this.state.lastRun.shown) this.set({ lastRun: { ...this.state.lastRun, shown: true } });
  }

  // Night over: settle the contract (and its bundle), pay out, then it is the next morning.
  applyRunResult(result: RunResult): NightSettlement {
    const taken = result.offers.map((id) => this.state.board.find((x) => x.id === id)).filter((x): x is ContractOffer => !!x);
    const difficulty = nightDifficulty(taken);
    const o = office(this.state);
    const night = resolveNight(o, { offers: result.offers, completed: result.completed, reached: result.reached, outcome: result.outcome });
    // 수임료 (training / gear feeBonus) — the one place it is applied.
    const loadout = growth.loadoutOf(growthOf(this.state));
    const feeBonus = computeExorcistStats('director', loadout.training, [], 'newspaper_sword', loadout.perks, loadout.gear).feeBonus;
    const settlement = settleRun({ ...result, fee: Math.round(night.fee * (1 + feeBonus)) }, this.state.money);
    // 장신구 that fell tonight are rolled now (seeded by the save and the day: a reload replays it).
    const g = growthOf(this.state);
    g.money = this.state.money + settlement.moneyDelta;
    const rng = new SeededRNG(morningSeed(this.state.seedBase, o.day) ^ 0x6ea4);
    let nextGearId = this.state.nextGearId;
    const rolled = result.drops.map((src) => rollDrop(rng, src, difficulty, nextGearId++)).filter((x): x is GearItem => !!x);
    const stowed = growth.stowDrops(g, rolled);
    o.money = g.money;
    const crew = desk.staffNight(this.state, o, result.offers, this.state.facilities.sofa);
    const morning = advanceDay(o, new SeededRNG(morningSeed(this.state.seedBase, o.day + 1)));
    const paid = desk.staffMorning(crew.staff, o, morning);
    this.set({
      ...o,
      staff: paid.staff,
      assign: {},
      gear: g.gear,
      nextGearId,
      trauma: this.state.trauma + settlement.traumaDelta,
      shards: this.state.shards + settlement.shards,
      solved: this.state.solved + night.completed.length,
      activeOfferId: null,
      joined: [],
      lastRun: {
        result, settlement, completed: night.completed.length, clue: night.clue,
        offers: taken, paid: Object.fromEntries(night.completed.map((id) => [id, Math.round((taken.find((x) => x.id === id)?.fee ?? 0) * (1 + feeBonus))])),
        reputation: night.reputation, gear: stowed.kept, gearMelted: stowed.melted, shown: false,
      },
      lastMorning: { ...morning, rankUp: night.rankUp ?? crew.rankUp, staff: crew.lines, ...paid.report },
    });
    return { ...settlement, clue: night.clue, completed: night.completed.length, reputation: night.reputation, gear: stowed.kept, gearMelted: stowed.melted };
  }
}
