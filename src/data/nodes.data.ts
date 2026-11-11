import type { TKey } from '../i18n';
import type { FloorTheme, GhostId, NodeId } from '../types/ids';

// The Euljiro operations map (docs/design/4-day/contracts-map-ops.md). x/y are percent of the map
// card (0 = left/top; the card is 100 × 60, so y is scaled by 0.6 when drawn). Links are two-way and listed on both ends.
export interface NodeData {
  rank: number; // 평판 rank before the board posts here
  nameKey: TKey;
  x: number;
  y: number;
  links: readonly NodeId[];
  pool: readonly GhostId[]; // strong ghosts that haunt this spot
  themes: readonly FloorTheme[]; // floor looks a generated contract here cycles through
}

export const NODES: Record<NodeId, NodeData> = {
  alley: { rank: 0, nameKey: 'node.alley', x: 16, y: 26, links: ['printshop', 'arcade'], pool: ['cheonyeo', 'dalgyal', 'leaper'], themes: ['alley', 'basement'] },
  printshop: { rank: 0, nameKey: 'node.printshop', x: 46, y: 18, links: ['alley', 'station', 'motel', 'rooftop'], pool: ['dalgyal', 'shooter', 'burster'], themes: ['alley', 'basement'] },
  arcade: { rank: 0, nameKey: 'node.arcade', x: 24, y: 70, links: ['alley', 'station'], pool: ['cheonyeo', 'subway', 'grabber'], themes: ['arcade', 'basement'] },
  station: { rank: 0, nameKey: 'node.station', x: 56, y: 76, links: ['arcade', 'printshop', 'motel'], pool: ['subway', 'dalgyal', 'rallier'], themes: ['arcade', 'basement'] },
  motel: { rank: 1, nameKey: 'node.motel', x: 84, y: 52, links: ['printshop', 'station', 'rooftop'], pool: ['cheonyeo', 'dokkaebi', 'thief', 'sweller'], themes: ['basement', 'alley'] },
  rooftop: { rank: 2, nameKey: 'node.rooftop', x: 80, y: 14, links: ['printshop', 'motel'], pool: ['dokkaebi', 'leaper', 'shooter', 'sweller'], themes: ['rooftop', 'alley'] },
};
