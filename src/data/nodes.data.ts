import type { TKey } from '../i18n';
import type { FloorTheme, GhostId, NodeId } from '../types/ids';

// The Euljiro operations map (docs/design/4-day/contracts-map-ops.md). x/y are percent of the map
// card (0 = left/top; the card is 100 × 60, so y is scaled by 0.6 when drawn). Links are two-way and listed on both ends; contamination spreads along them.
export interface NodeData {
  nameKey: TKey;
  x: number;
  y: number;
  links: readonly NodeId[];
  pool: readonly GhostId[]; // strong ghosts that haunt this spot
  themes: readonly FloorTheme[]; // floor looks a generated contract here cycles through
  startContamination: number;
}

export const NODES: Record<NodeId, NodeData> = {
  alley: { nameKey: 'node.alley', x: 16, y: 26, links: ['printshop', 'arcade'], pool: ['cheonyeo', 'dalgyal'], themes: ['alley', 'basement'], startContamination: 2 },
  printshop: { nameKey: 'node.printshop', x: 46, y: 18, links: ['alley', 'station', 'motel', 'rooftop'], pool: ['dalgyal', 'cheonyeo'], themes: ['alley', 'basement'], startContamination: 1 },
  arcade: { nameKey: 'node.arcade', x: 24, y: 70, links: ['alley', 'station'], pool: ['cheonyeo', 'subway'], themes: ['arcade', 'basement'], startContamination: 1 },
  station: { nameKey: 'node.station', x: 56, y: 76, links: ['arcade', 'printshop', 'motel'], pool: ['subway', 'dalgyal'], themes: ['arcade', 'basement'], startContamination: 0 },
  motel: { nameKey: 'node.motel', x: 84, y: 52, links: ['printshop', 'station', 'rooftop'], pool: ['cheonyeo', 'dalgyal', 'subway'], themes: ['basement', 'alley'], startContamination: 0 },
  rooftop: { nameKey: 'node.rooftop', x: 80, y: 14, links: ['printshop', 'motel'], pool: ['dalgyal', 'cheonyeo'], themes: ['rooftop', 'alley'], startContamination: 0 },
};
