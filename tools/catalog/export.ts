// Collects every game data table (src/data) into one JSON object for the 총괄 관리 page
// (tools/catalog/README.md). Nothing is copied by hand: the page always shows what the code has.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CARDS, CARD_OFFER_COUNT } from '../../src/data/cards.data';
import { CHAPTERS } from '../../src/data/chapters.data';
import { CONTRACTS } from '../../src/data/contracts.data';
import { DUNGEON } from '../../src/data/dungeon.data';
import { FACILITIES, FACILITY_EFFECTS, SUPPLIES } from '../../src/data/facilities.data';
import { DROPS, GEAR_ECONOMY, GEAR_SLOTS, GEAR_SPECIALS, GRADES, GRADE_WEIGHTS, SUB_OPTIONS } from '../../src/data/gear.data';
import { BOSSES, GHOSTS } from '../../src/data/ghosts.data';
import { MODIFIERS, MODIFIER_COUNT } from '../../src/data/modifiers.data';
import { NODES } from '../../src/data/nodes.data';
import { DEEP, GENERAL_OBJECTIVES, OBJECTIVES } from '../../src/data/objectives.data';
import { OFFICE } from '../../src/data/office.data';
import { RUN_PENALTIES, TRAUMA } from '../../src/data/penalties.data';
import { EXORCISTS } from '../../src/data/protagonist.data';
import { RANKS, REPUTATION } from '../../src/data/reputation.data';
import { REQUESTS } from '../../src/data/requests.data';
import { ACTIVES, DUOS, PASSIVES, SKILL_BRANCHES, SKILL_SLOTS, UPGRADES } from '../../src/data/skills.data';
import { CHATTER, RENT_TALK, SCENES, SPEAKERS } from '../../src/data/story.data';
import { TRAINING, TRAINING_GROUPS, TRAINING_PRICE } from '../../src/data/training.data';
import { WEAPONS } from '../../src/data/weapons.data';
import { ko } from '../../src/i18n/ko';
import { offerFee } from '../../src/systems/office';
import { fullEnhanceCost } from '../../src/systems/gear';
import type { ContractOffer } from '../../src/systems/office';
import type { ObjectiveKind } from '../../src/types/ids';

const ROOT = resolve(import.meta.dirname, '../..');

// The whole training tree bought cheapest-first (same order a player would).
function treeCost(): { total: number; ranks: number } {
  const lines = Object.values(TRAINING);
  const ranks = lines.map(() => 0);
  let bought = 0;
  let total = 0;
  for (;;) {
    let best = -1;
    let price = Infinity;
    lines.forEach((l, i) => {
      if (ranks[i]! >= l.max) return;
      const p = Math.round((l.cost * (ranks[i]! + 1) * (1 + TRAINING_PRICE.inflation * bought)) / 10) * 10;
      if (p < price) [price, best] = [p, i];
    });
    if (best < 0) return { total, ranks: bought };
    total += price;
    ranks[best]! += 1;
    bought += 1;
  }
}

// Example fees: each objective at contamination 0 and 3, 3 floors, no modifiers.
function feeExamples() {
  return (Object.keys(GENERAL_OBJECTIVES) as ObjectiveKind[]).map((objective) => {
    const at = (risk: number) => {
      const o: ContractOffer = { id: 0, kind: 'general', node: 'alley', story: null, objective, request: null, mods: [], target: null, pool: [...NODES.alley.pool], risk, floors: 3, goalFloor: 2, fee: 0, shards: 0, deadline: 1 };
      return offerFee(o);
    };
    return { objective, calm: at(0), hot: at(3) };
  });
}

// One line per effect part: its file name and the comment that says what it does.
function parts() {
  const dir = resolve(ROOT, 'src/registry/effects/parts');
  return readdirSync(dir).filter((f) => f !== 'common.ts').map((f) => {
    const src = readFileSync(resolve(dir, f), 'utf8');
    const line = src.split('\n').find((l) => l.startsWith('// '));
    return { id: f.replace('.ts', ''), what: line ? line.slice(3) : '' };
  });
}
function hooks() {
  const src = readFileSync(resolve(ROOT, 'src/registry/hookPoints.ts'), 'utf8');
  return [...src.matchAll(/^\s+(on[A-Za-z]+):[^;]*;(?:\s*\/\/\s*(.*))?$/gm)].map((m) => ({ id: m[1], what: m[2] ?? '' }));
}

export function exportCatalog() {
  return {
    at: new Date().toISOString(),
    t: ko,
    office: OFFICE,
    objectives: { general: GENERAL_OBJECTIVES, rules: OBJECTIVES, deep: DEEP, fees: feeExamples() },
    modifiers: { rows: MODIFIERS, count: MODIFIER_COUNT },
    requests: REQUESTS,
    nodes: NODES,
    ghosts: GHOSTS,
    bosses: BOSSES,
    contracts: CONTRACTS,
    chapters: CHAPTERS,
    story: { speakers: SPEAKERS, scenes: SCENES, rent: RENT_TALK, chatter: CHATTER },
    training: { lines: TRAINING, groups: TRAINING_GROUPS, price: TRAINING_PRICE, tree: treeCost() },
    skills: { passives: PASSIVES, slots: SKILL_SLOTS, branches: SKILL_BRANCHES, duos: DUOS, actives: ACTIVES, upgrades: UPGRADES },
    gear: { slots: GEAR_SLOTS, grades: GRADES, weights: GRADE_WEIGHTS, drops: DROPS, subs: SUB_OPTIONS, specials: GEAR_SPECIALS, economy: GEAR_ECONOMY, full: Object.fromEntries(Object.keys(GRADES).map((g) => [g, fullEnhanceCost(g as never)])) },
    facilities: { rows: FACILITIES, effects: FACILITY_EFFECTS, supplies: SUPPLIES },
    trauma: TRAUMA,
    penalties: RUN_PENALTIES,
    reputation: { ranks: RANKS, rules: REPUTATION },
    cards: { rows: CARDS, offer: CARD_OFFER_COUNT },
    weapons: WEAPONS,
    exorcists: EXORCISTS,
    dungeon: DUNGEON,
    effects: { parts: parts(), hooks: hooks() },
  };
}
