import type { TKey } from '../i18n';
import type { HubSpotId, LobbyFeatureId } from '../types/ids';

// The day hub: the rooftop office in tile units (same 24px tiles as the night), and the
// "registry row = one menu" table (docs/design/4-day/hub.md). New panel = one LOBBY_FEATURES row
// + one src/ui/features/<id>/ file; new thing to walk up to = one HUB_SPOTS row.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// When a spot appears in the hub. Story chapters will replace the solved count later.
export interface Unlock {
  solved: number; // contracts solved before it shows up (0 = from the start)
}

export interface HubSpotData {
  x: number; // where the person / object stands (tile units, feet)
  y: number;
  feature: LobbyFeatureId; // panel opened with E
  promptKey: TKey; // shown above it when in reach
  unlock: Unlock;
}

export interface LobbyFeatureData {
  titleKey: TKey;
}

export const HUB = {
  cols: 18,
  rows: 10,
  walk: { x: 1, y: 3, w: 16, h: 6.4 } satisfies Rect, // rooftop floor inside the parapet
  start: { x: 9, y: 7.5 }, // where the director appears after coming home
  speed: 4.5, // tiles per second (a bit slower than the night's 5.5: no hurry at home)
  bodyR: 0.3, // director body half-size for collisions
  reach: 1.6, // max distance to a spot for E to use it
  step: 1 / 60, // walking runs on the same fixed step as the night
  hut: { x: 1, y: 0, w: 10, h: 3 } satisfies Rect, // the rooftop room (front wall)
  stairs: { x: 13, y: 0, w: 4, h: 3 } satisfies Rect, // stairwell housing with the iron door
  solids: [
    { x: 4, y: 4.6, w: 2, h: 0.8 }, // bookkeeper's folding desk
    { x: 9, y: 5.6, w: 3, h: 1.4 }, // 평상 (wooden platform)
    { x: 1, y: 8.4, w: 1.2, h: 1 }, // pepper pots
    { x: 15.6, y: 5, w: 1.4, h: 1.6 }, // AC outdoor unit
  ] satisfies Rect[],
} as const;

export const HUB_SPOTS: Record<HubSpotId, HubSpotData> = {
  door: { x: 14.5, y: 3, feature: 'sortie', promptKey: 'hub.prompt.door', unlock: { solved: 0 } },
  bookkeeper: { x: 5, y: 4.5, feature: 'ledger', promptKey: 'hub.prompt.bookkeeper', unlock: { solved: 1 } },
};

export const LOBBY_FEATURES: Record<LobbyFeatureId, LobbyFeatureData> = {
  sortie: { titleKey: 'feature.sortie.title' },
  ledger: { titleKey: 'feature.ledger.title' },
};
