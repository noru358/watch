import { DUNGEON } from '../../data/dungeon.data';
import { GHOSTS } from '../../data/ghosts.data';
import type { SeededRNG } from '../../core/SeededRNG';
import { updateEnemies } from './enemies';
import { dist, savePrev, updateFlow } from './physics';
import { updatePlayer } from './player';
import { updateSwarm } from './spawner';
import type { Floor, RiftInput } from './types';

function updatePickups(f: Floor, dt: number): void {
  const p = f.player;
  const keep = [];
  for (const k of f.pickups) {
    const d = dist(k, p);
    if (d <= p.r + 0.3) {
      f.loot += k.value;
      f.events.push({ type: 'pickupCollected', x: k.x, y: k.y, value: k.value });
      continue;
    }
    if (d <= DUNGEON.pickupMagnet) {
      k.x += ((p.x - k.x) / d) * DUNGEON.pickupSpeed * dt;
      k.y += ((p.y - k.y) / d) * DUNGEON.pickupSpeed * dt;
    }
    keep.push(k);
  }
  f.pickups = keep;
}

// Strong (non-fodder) ghosts still standing on this floor.
export function strongLeft(f: Floor): number {
  return f.enemies.filter((e) => e.hp > 0 && e.kind !== 'gumiho' && !GHOSTS[e.kind].fodder).length;
}

export function stairsOpen(f: Floor): boolean {
  return !f.seal || f.sealOpen;
}

// The seal breaks once the last strong ghost is down; an arena ends the night the same way.
function updateSeal(f: Floor): void {
  if (f.arena && strongLeft(f) === 0) {
    for (const k of f.pickups) f.loot += k.value;
    f.pickups = [];
    f.enemies.forEach((e) => (e.hp = 0));
    f.enemies = [];
    f.status = 'bossDefeated';
    f.events.push({ type: 'roomCleared', boss: true });
    return;
  }
  if (!f.seal || f.sealOpen || strongLeft(f) > 0) return;
  f.sealOpen = true;
  f.events.push({ type: 'roomCleared', boss: false });
}

function updateExits(f: Floor): void {
  const p = f.player;
  if (f.stairs && stairsOpen(f) && dist(p, f.stairs) <= DUNGEON.touchRange) f.status = 'stairs';
  if (!f.payphone) return;
  const d = dist(p, f.payphone);
  if (f.payphoneArmed && d <= DUNGEON.touchRange) {
    f.payphoneArmed = false;
    f.status = 'payphone';
  } else if (!f.payphoneArmed && d > DUNGEON.touchRange * 2) f.payphoneArmed = true;
}

// One fixed-step tick of a floor. Pure apart from mutating `f` and `rng`.
export function stepFloor(f: Floor, input: RiftInput, dt: number, rng: SeededRNG): void {
  if (f.status !== 'playing') return;
  f.time += dt;
  savePrev(f.player);
  for (const e of f.enemies) savePrev(e);
  updateFlow(f);
  updatePlayer(f, input, dt, rng);
  updateEnemies(f, dt, rng);
  if (f.status !== 'playing') return;
  updateSeal(f);
  if (f.status !== 'playing') return;
  updateSwarm(f, dt, rng);
  updatePickups(f, dt);
  updateExits(f);
}

// The director answered the payphone prompt.
// Giving up the contract from the pause menu counts as a failed night (same penalties as falling).
export function giveUp(f: Floor): void {
  if (f.status === 'playing') f.status = 'dead';
}

export function answerPayphone(f: Floor, goHome: boolean): void {
  if (f.status !== 'payphone') return;
  f.status = goHome ? 'extracted' : 'playing';
}
