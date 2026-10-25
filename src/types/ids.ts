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
export type ContractId = 'lights_out';
export type Phase = 'day' | 'night';
export type LobbyFeatureId = 'sortie' | 'ledger'; // hub panels (src/ui/features/<id>/)
export type HubSpotId = 'door' | 'bookkeeper'; // things in the hub you can walk up to and use
export type HubPropId = 'bookkeeperDesk' | 'directorDesk' | 'sofa' | 'cabinet' | 'plant' | 'water'; // office furniture (solid)
