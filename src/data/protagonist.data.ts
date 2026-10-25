import type { ExorcistId } from '../types/ids';

export interface ExorcistBaseData {
  maxHp: number;
  levelHpBonus: number; // max HP per level above 1
  darknessVision: number; // tiles visible while darkened
}

export const EXORCISTS: Record<ExorcistId, ExorcistBaseData> = {
  director: { maxHp: 12, levelHpBonus: 1, darknessVision: 3 },
};
