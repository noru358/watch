import type { TKey } from '../i18n';
import type { FacilityId, HubPropId, HubSpotId, LobbyFeatureId } from '../types/ids';

// The day hub: inside the office (a rooftop room in Euljiro) in tile units (same 24px tiles as the night), and the
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
  facility?: FacilityId; // …and this facility is built (level ≥ 1)
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
  wide: boolean; // wider card (the contract board's map)
}

export const HUB = {
  cols: 18,
  rows: 10,
  walk: { x: 1, y: 3, w: 16, h: 6.4 } satisfies Rect, // office floor between the walls
  wall: 3, // rows of back wall (window, door, posters) above the floor
  window: { x: 3, w: 4 }, // back-wall window onto the sunset roofs and Namsan tower (tiles)
  start: { x: 13, y: 5.5 }, // a few steps in from the front door, where the director comes home
  speed: 4.5, // tiles per second (a bit slower than the night's 5.5: no hurry at home)
  bodyR: 0.3, // director body half-size for collisions
  reach: 1.6, // max distance to a spot for E to use it
  step: 1 / 60, // walking runs on the same fixed step as the night
} as const;

// Furniture you bump into (tile units, the rect is the floor footprint).
export const HUB_PROPS: Record<HubPropId, Rect> = {
  bookkeeperDesk: { x: 4, y: 4.6, w: 2, h: 0.8 },
  directorDesk: { x: 9.5, y: 3, w: 2.5, h: 1 }, // against the back wall, under the clock
  sofa: { x: 7, y: 7.4, w: 3.4, h: 1.2 }, // worn leather sofa + low table in front
  cabinet: { x: 1, y: 3, w: 1.2, h: 0.8 }, // filing cabinet of old case files
  plant: { x: 1, y: 8.4, w: 1, h: 1 },
  water: { x: 16, y: 6, w: 1, h: 0.8 }, // water dispenser
  bench: { x: 14.8, y: 7.8, w: 1.6, h: 0.8 }, // 부적 작업대 (only once built: HUB_PROP_NEEDS)
};

// Furniture that only exists once a facility is built (no collision before that either).
export const HUB_PROP_NEEDS: Partial<Record<HubPropId, FacilityId>> = { bench: 'bench' };

export const HUB_SPOTS: Record<HubSpotId, HubSpotData> = {
  door: { x: 14.5, y: 3, feature: 'sortie', promptKey: 'hub.prompt.door', unlock: { solved: 0 } },
  bookkeeper: { x: 5, y: 4.5, feature: 'ledger', promptKey: 'hub.prompt.bookkeeper', unlock: { solved: 1 } },
  directorDesk: { x: 10.75, y: 4.4, feature: 'training', promptKey: 'hub.prompt.directorDesk', unlock: { solved: 0 } },
  sofa: { x: 8.7, y: 8.2, feature: 'sofa', promptKey: 'hub.prompt.sofa', unlock: { solved: 0 } },
  bench: { x: 15.6, y: 8.2, feature: 'bench', promptKey: 'hub.prompt.bench', unlock: { solved: 0, facility: 'bench' } },
};

export const LOBBY_FEATURES: Record<LobbyFeatureId, LobbyFeatureData> = {
  sortie: { titleKey: 'feature.sortie.title', wide: true },
  ledger: { titleKey: 'feature.ledger.title', wide: false },
  training: { titleKey: 'feature.training.title', wide: true },
  sofa: { titleKey: 'feature.sofa.title', wide: false },
  bench: { titleKey: 'feature.bench.title', wide: false },
  morning: { titleKey: 'feature.morning.title', wide: false }, // 아침 보고: opens by itself the morning after a night
};
