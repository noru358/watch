// All game IDs are string-literal unions (ARCHITECTURE Rule 1).

export type ExorcistId = 'director';
export type CompanionId = 'grandma_shaman' | 'ex_detective' | 'streamer';
export type GhostId = 'cheonyeo' | 'dalgyal' | 'subway';
export type BossId = 'printer';
export type EnemyId = GhostId | BossId;
export type ToolId = 'talisman';
export type TraitId =
  | 'ricochet'
  | 'roll_empower'
  | 'vampiric'
  | 'thick_skin'
  | 'swift'
  | 'sharp_talisman'
  | 'salt_ward';
export type ContractId = 'euljiro_printer';
export type RoomKind = 'combat' | 'payphone' | 'boss';
export type Phase = 'day' | 'night';
export type NightMode = 'action' | 'grid'; // prototype comparison (action vs grid turn-based)
export type GridCardId = 'tough' | 'sharp' | 'focus' | 'medicine' | 'lightning';
