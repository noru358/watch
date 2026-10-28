// All game IDs are string-literal unions (ARCHITECTURE Rule 1).

export type ExorcistId = 'director';
export type WeaponId = 'newspaper_sword'; // weapon B 'label_gun' arrives in Gate 2
export type GhostId = 'cheonyeo' | 'dalgyal' | 'subway' | 'dokkaebibul';
export type BossId = 'gumiho';
export type EnemyId = GhostId | BossId;
export type BaseCardId = 'tough' | 'medicine' | 'salt_ward' | 'grudge_drain' | 'spirit_nose';
export type WeaponCardId = 'double_newspaper' | 'blue_lightning' | 'lazy_but_serious' | 'torn_paper' | 'third_strike';
export type CardId = BaseCardId | WeaponCardId; // 강화 카드 (per-run upgrade)
export type CardSource = 'base' | WeaponId;
export type ContractId = 'lights_out' | 'last_line'; // hand-written main story contracts
export type ChapterId = 'ch1' | 'ch2'; // 메인 스토리 장 (src/data/chapters.data.ts)
export type ContractKind = 'main' | 'general'; // 메인 스토리 (hand-written, required to progress) / 일반 의뢰 (generated)
export type NodeId = 'alley' | 'printshop' | 'arcade' | 'station' | 'motel' | 'rooftop'; // 을지로 작전 지도 노드
// 일반 의뢰 사연 틀 (each belongs to one objective, src/data/requests.data.ts)
export type { RequestId } from '../data/requests.data';
// What opens a floor's stairs (docs/design/2-night/objectives.md). A general contract has exactly one
// main objective (not 'clear' on its goal floor unless it is a 섬멸 contract); other floors are 'clear'.
export type ObjectiveKind = 'clear' | 'rescue' | 'bounty' | 'chase' | 'ward' | 'firsttrain' | 'timeattack';
// 현장 변형 (src/data/modifiers.data.ts): warnings make the night harder (and pay more), boons help.
export type ModifierId = 'blackout' | 'lair' | 'surge' | 'regen' | 'lethal' | 'haste' | 'tough' | 'lesshealing' | 'subwayline' | 'windfall' | 'clearnight' | 'weakspot';
export type FloorTheme = 'basement' | 'alley' | 'arcade' | 'rooftop' | 'lot';
export type SceneId = 'intro' | 'bookkeeper' | 'lights_out_done' | 'ch2_start' | 'ch2_ready' | 'ch2_done'; // story scenes in the dialogue box
export type Phase = 'title' | 'day' | 'night';
export type LobbyFeatureId = 'sortie' | 'ledger' | 'training' | 'sofa' | 'bench'; // hub panels (src/ui/features/<id>/)
export type HubSpotId = 'door' | 'bookkeeper' | 'directorDesk' | 'sofa' | 'bench'; // things in the hub you can walk up to and use
export type HubPropId = 'bookkeeperDesk' | 'directorDesk' | 'sofa' | 'cabinet' | 'plant' | 'water' | 'bench'; // office furniture (solid)

// Growth (docs/design/3-growth/progression.md, numbers in docs/rules/growth.md)
export type TrainingGroup = 'power' | 'hands' | 'feet' | 'nerve' | 'focus' | 'eye' | 'knack' | 'trade';
export type TrainingId = 'slash' | 'draw' | 'reach' | 'finisher' | 'strong' | 'fodder' | 'boss' | 'swing' | 'drawcd' | 'recover' | 'attackMove' | 'move' | 'dashcd' | 'dashlen' | 'dashguard' | 'hp' | 'parry' | 'iframes' | 'guard' | 'dark' | 'heal' | 'gauge' | 'bare' | 'focusGain' | 'crit' | 'critDmg' | 'magnet' | 'spirit' | 'shard' | 'fee' | 'ward' | 'survivor' | 'train';
export type FacilityId = 'desk' | 'bench' | 'sofa';
export type SupplyId = 'salt_pack' | 'bacchus' | 'map_copy'; // 보급품 (one per night, from the 부적 작업대)
export type SkillBranch = 'blade' | 'step' | 'eye' | 'craft';
// 기술 칸: branch × tier; each slot has 2–4 sides and one is on (skills.data.ts SKILL_SLOTS).
export type SkillSlotId = `${'blade' | 'step' | 'eye'}${1 | 2 | 3 | 4}` | `craft${1 | 2}`;
export type PassiveId =
  | 'dash_cut' | 'finisher_wave'
  | 'counter_focus' | 'draw_stun'
  | 'strike_refund' | 'bare_extend'
  | 'final_blow' | 'momentum' | 'curse_cut'
  | 'salt_trail' | 'counter_dash'
  | 'double_dash' | 'shadow_step'
  | 'dodge_focus' | 'sprint'
  | 'frost_salt' | 'edge_dash' | 'iron_body'
  | 'ghost_eye' | 'spirit_eye'
  | 'steady_breath' | 'grudge_eater'
  | 'last_breath' | 'greed'
  | 'cliff_edge' | 'vengeance' | 'grudge_pop' | 'pickpocket'
  | 'door_magnet' | 'shortcut_nose'
  | 'ward_hands' | 'escort_care' | 'early_bird';
export type ActiveId = 'talisman' | 'barrier' | 'salt_burst' | 'shadow_double' | 'spirit_burst' | 'shrink_step' | 'chain_charm' | 'smoke' | 'momentum_release' | 'grudge_chain'; // 액티브 기술 (L key)
export type UpgradeId = 'talisman_pierce' | 'talisman_triple' | 'talisman_quick' | 'barrier_wide' | 'barrier_heal' | 'barrier_blast' | 'salt_frost' | 'salt_wide' | 'salt_focus'; // 액티브 개조
export type DuoId = 'duo_salt_frost_trail' | 'duo_momentum_echo' | 'duo_curse_pop'; // on when both of its passives are on
export type PerkId = PassiveId | DuoId | SupplyId; // what a night carries besides cards: rows of 효과 부품 (registry/effects)
