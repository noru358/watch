import { HUB, HUB_PROPS, HUB_SPOTS, type Rect } from '../../data/lobby.data';
import type { HubSpotId } from '../../types/ids';

// The director walking around the office. Pure: no Phaser, no React.

export interface HubState {
  x: number;
  y: number;
  prevX: number; // position before the last step (rendering interpolates)
  prevY: number;
  face: 1 | -1; // 1 = right
  moving: boolean;
}

export interface HubInput {
  moveX: number; // -1..1
  moveY: number;
}

export interface HubProgress {
  solved: number;
}

export function newHub(): HubState {
  const { x, y } = HUB.start;
  return { x, y, prevX: x, prevY: y, face: 1, moving: false };
}

const overlaps = (x: number, y: number, r: number, b: Rect) => x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h;

function blocked(x: number, y: number): boolean {
  const r = HUB.bodyR;
  const w = HUB.walk;
  if (x - r < w.x || x + r > w.x + w.w || y - r < w.y || y + r > w.y + w.h) return true;
  return Object.values(HUB_PROPS).some((s) => overlaps(x, y, r, s));
}

// One fixed step. Axes move separately so the director slides along walls and furniture.
export function stepHub(h: HubState, input: HubInput, dt: number): void {
  h.prevX = h.x;
  h.prevY = h.y;
  const len = Math.hypot(input.moveX, input.moveY);
  h.moving = len > 0;
  if (!h.moving) return;
  const dx = (input.moveX / len) * HUB.speed * dt;
  const dy = (input.moveY / len) * HUB.speed * dt;
  if (!blocked(h.x + dx, h.y)) h.x += dx;
  if (!blocked(h.x, h.y + dy)) h.y += dy;
  if (input.moveX !== 0) h.face = input.moveX > 0 ? 1 : -1;
}

export function unlockedSpots(progress: HubProgress): HubSpotId[] {
  return (Object.keys(HUB_SPOTS) as HubSpotId[]).filter((id) => progress.solved >= HUB_SPOTS[id].unlock.solved);
}

// The nearest unlocked spot within reach, i.e. what E would use right now.
export function spotInReach(h: HubState, progress: HubProgress): HubSpotId | null {
  let best: HubSpotId | null = null;
  let bestD: number = HUB.reach;
  for (const id of unlockedSpots(progress)) {
    const s = HUB_SPOTS[id];
    const d = Math.hypot(s.x - h.x, s.y - h.y);
    if (d <= bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}
