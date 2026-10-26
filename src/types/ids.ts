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
export type ContractId = 'lights_out'; // hand-written story contracts
export type ContractKind = 'main' | 'general'; // 메인 스토리 (hand-written, required to progress) / 일반 의뢰 (generated)
export type NodeId = 'alley' | 'printshop' | 'arcade' | 'station' | 'motel' | 'rooftop'; // 을지로 작전 지도 노드
// 일반 의뢰 사연 틀 (each belongs to one objective, src/data/requests.data.ts)
export type RequestId =
  | 'flicker' | 'smoke' | 'karaoke'
  | 'crying' | 'missing'
  | 'faceless' | 'poster'
  | 'footsteps' | 'snatcher'
  | 'cold_spot' | 'shrine'
  | 'last_train' | 'taxi';
// What opens a floor's stairs (docs/design/2-night/objectives.md). A general contract has exactly one
// main objective (not 'clear' on its goal floor unless it is a 섬멸 contract); other floors are 'clear'.
export type ObjectiveKind = 'clear' | 'rescue' | 'bounty' | 'chase' | 'ward' | 'firsttrain';
// 현장 변형 (src/data/modifiers.data.ts): warnings make the night harder (and pay more), boons help.
export type ModifierId = 'blackout' | 'lair' | 'surge' | 'regen' | 'lethal' | 'haste' | 'tough' | 'lesshealing' | 'subwayline' | 'windfall' | 'clearnight' | 'weakspot';
export type FloorTheme = 'basement' | 'alley' | 'arcade' | 'rooftop' | 'lot';
export type SceneId = 'intro' | 'bookkeeper' | 'lights_out_done'; // story scenes in the dialogue box
export type Phase = 'title' | 'day' | 'night';
export type LobbyFeatureId = 'sortie' | 'ledger' | 'training' | 'sofa' | 'bench'; // hub panels (src/ui/features/<id>/)
export type HubSpotId = 'door' | 'bookkeeper' | 'directorDesk' | 'sofa' | 'bench'; // things in the hub you can walk up to and use
export type HubPropId = 'bookkeeperDesk' | 'directorDesk' | 'sofa' | 'cabinet' | 'plant' | 'water' | 'bench'; // office furniture (solid)

// Growth (docs/design/3-growth/progression.md, numbers in docs/rules/growth.md)
export type TrainingGroup = 'power' | 'hands' | 'feet' | 'nerve' | 'focus' | 'knack';
export type TrainingId =
  | 'power_slash' | 'power_draw' | 'power_reach'
  | 'hands_swing' | 'hands_drawcd' | 'hands_finisher'
  | 'feet_move' | 'feet_dashcd' | 'feet_dashlen'
  | 'nerve_hp' | 'nerve_parry' | 'nerve_iframes'
  | 'focus_gauge' | 'focus_bare'
  | 'knack_magnet';
export type FacilityId = 'desk' | 'bench' | 'sofa';
export type SupplyId = 'salt_pack' | 'bacchus' | 'map_copy'; // 보급품 (one per night, from the 부적 작업대)
export type SkillBranch = 'blade' | 'step' | 'eye';
export type SkillSlotId = `${SkillBranch}${1 | 2 | 3}`; // 기술 칸: branch × tier, each with an A and a B side
export type PassiveId =
  | 'dash_cut' | 'finisher_wave'
  | 'counter_focus' | 'draw_stun'
  | 'strike_refund' | 'bare_extend'
  | 'salt_trail' | 'counter_dash'
  | 'double_dash' | 'shadow_step'
  | 'dodge_focus' | 'sprint'
  | 'ghost_eye' | 'spirit_eye'
  | 'steady_breath' | 'grudge_eater'
  | 'last_breath' | 'greed';
export type ActiveId = 'talisman' | 'barrier' | 'salt_burst'; // 액티브 기술 (L key)
export type PerkId = PassiveId | SupplyId; // what a night carries besides cards (registry/perkEffects.ts)
