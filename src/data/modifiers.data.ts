import type { TKey } from '../i18n';
import type { GhostId, ModifierId } from '../types/ids';

// 현장 변형 (docs/rules/floor.md): 0–2 per generated contract, on top of its one objective, on every
// floor of it. Warnings (경고) make the night harder and pay more; boons (이로움) help and pay nothing
// extra. References: Deep Rock Galactic warnings / anomalies, Hades Pact of Punishment.
// Adding one = a row here + its ModifierId + two i18n keys. The fields say what it changes, and each
// field is applied in one place (named per field below); no modifier is special-cased in code.
export interface ModifierData {
  nameKey: TKey;
  descKey: TKey;
  kind: 'warning' | 'boon';
  weight: number;
  feeBonus: number; // added up, then × fee (boons: 0)
  difficulty: number; // added to the 난이도 score
  vision?: number; // tiles visible on the whole floor — mapgen.ts → f.vision → RiftView
  swarm?: { everyMult: number; capMult: number }; // office/contracts.ts swarmFor
  lair?: { pack: number; treasure: number; treasureValue: number; shardChance: number }; // lair.ts
  pool?: readonly GhostId[]; // replaces the strong-ghost list — office/contracts.ts offerFloors
  enemy?: { hpMult?: number; damageAdd?: number; speedMult?: number; windupMult?: number; regen?: number }; // enemyFactory.ts (every ghost but the boss)
  player?: { moveMult?: number; drawMult?: number; healMult?: number }; // mapgen.ts floor stats / heal()
  loot?: { pickupMult?: number; fodderDrop?: number }; // mapgen.ts pickups, combat.ts drops
}

export const MODIFIERS: Record<ModifierId, ModifierData> = {
  // ---- 경고 ----
  // 정전: the whole floor is dark beyond a few tiles.
  blackout: { nameKey: 'mod.blackout.name', descKey: 'mod.blackout.desc', kind: 'warning', weight: 1, feeBonus: 0.25, difficulty: 3, vision: 4.5 },
  // 괴이 소굴: one side room is a nest; walk in and the doors seal until the pack is down, then a heap of spirit.
  lair: { nameKey: 'mod.lair.name', descKey: 'mod.lair.desc', kind: 'warning', weight: 1, feeBonus: 0.2, difficulty: 3, lair: { pack: 5, treasure: 6, treasureValue: 8, shardChance: 0.35 } },
  // 물결 폭증 (DRG Swarmageddon): wisps come much more often and in larger numbers.
  surge: { nameKey: 'mod.surge.name', descKey: 'mod.surge.desc', kind: 'warning', weight: 1, feeBonus: 0.25, difficulty: 3, swarm: { everyMult: 0.6, capMult: 1.5 } },
  // 사무치는 원한 (DRG Regenerative Bugs): a ghost left alone for 3 s heals 5 % of its HP per second.
  regen: { nameKey: 'mod.regen.name', descKey: 'mod.regen.desc', kind: 'warning', weight: 1, feeBonus: 0.15, difficulty: 2, enemy: { regen: 0.05 } },
  // 독한 원한 (DRG Lethal Enemies, Hades Hard Labor): every ghost hits 1 harder.
  lethal: { nameKey: 'mod.lethal.name', descKey: 'mod.lethal.desc', kind: 'warning', weight: 1, feeBonus: 0.25, difficulty: 4, enemy: { damageAdd: 1 } },
  // 성급한 귀신 (Hades Forced Overtime): ghosts move 20 % faster and wind up 15 % sooner.
  haste: { nameKey: 'mod.haste.name', descKey: 'mod.haste.desc', kind: 'warning', weight: 1, feeBonus: 0.25, difficulty: 4, enemy: { speedMult: 1.2, windupMult: 0.85 } },
  // 질긴 놈들 (Hades Calisthenics Program): strong ghosts have 40 % more HP.
  tough: { nameKey: 'mod.tough.name', descKey: 'mod.tough.desc', kind: 'warning', weight: 1, feeBonus: 0.2, difficulty: 3, enemy: { hpMult: 1.4 } },
  // 탁한 공기 (Hades Lasting Consequences): healing is halved.
  lesshealing: { nameKey: 'mod.lesshealing.name', descKey: 'mod.lesshealing.desc', kind: 'warning', weight: 0.8, feeBonus: 0.15, difficulty: 2, player: { healMult: 0.5 } },
  // 망령 행렬 (DRG Mactera Plague): the strong ghosts are almost all subway wraiths (dodge, don't parry).
  subwayline: { nameKey: 'mod.subwayline.name', descKey: 'mod.subwayline.desc', kind: 'warning', weight: 0.8, feeBonus: 0.2, difficulty: 3, pool: ['subway', 'subway', 'subway', 'cheonyeo'] },
  // ---- 이로움 ----
  // 영력 풍년 (DRG Golden Bugs / Mineral Mania): spirit on the floor is worth 50 % more, wisps drop spirit too.
  windfall: { nameKey: 'mod.windfall.name', descKey: 'mod.windfall.desc', kind: 'boon', weight: 0.8, feeBonus: 0, difficulty: 0, loot: { pickupMult: 1.5, fodderDrop: 1 } },
  // 맑은 밤 (DRG Rich Atmosphere): the director moves 15 % faster.
  clearnight: { nameKey: 'mod.clearnight.name', descKey: 'mod.clearnight.desc', kind: 'boon', weight: 0.6, feeBonus: 0, difficulty: 0, player: { moveMult: 1.15 } },
  // 약점 노출 (DRG Critical Weakness): every 발도 cuts 30 % harder.
  weakspot: { nameKey: 'mod.weakspot.name', descKey: 'mod.weakspot.desc', kind: 'boon', weight: 0.6, feeBonus: 0, difficulty: 0, player: { drawMult: 1.3 } },
};

// How many modifiers a contract gets: chance of 0, 1, 2.
export const MODIFIER_COUNT = [0.4, 0.42, 0.18] as const;
