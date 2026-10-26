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
export type ContractKind = 'story' | 'general' | 'bounty'; // 의뢰판 종류 (docs/design/4-day/contracts-map-ops.md)
export type NodeId = 'alley' | 'printshop' | 'arcade' | 'station' | 'motel' | 'rooftop'; // 을지로 작전 지도 노드
export type RequestId = 'flicker' | 'footsteps' | 'cold_spot' | 'crying' | 'last_train' | 'faceless' | 'smoke' | 'missing'; // 일반 의뢰 사연 틀
export type ObjectiveKind = 'clear' | 'rescue'; // what opens a floor's stairs (docs/design/2-night/objectives.md)
export type FloorTheme = 'basement' | 'alley' | 'arcade' | 'rooftop' | 'lot';
export type SceneId = 'intro' | 'bookkeeper' | 'lights_out_done'; // story scenes in the dialogue box
export type Phase = 'title' | 'day' | 'night';
export type LobbyFeatureId = 'sortie' | 'ledger'; // hub panels (src/ui/features/<id>/)
export type HubSpotId = 'door' | 'bookkeeper'; // things in the hub you can walk up to and use
export type HubPropId = 'bookkeeperDesk' | 'directorDesk' | 'sofa' | 'cabinet' | 'plant' | 'water'; // office furniture (solid)
