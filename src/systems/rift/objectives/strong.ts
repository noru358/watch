import { GHOSTS } from '../../../data/ghosts.data';
import type { Floor } from '../types';

// Strong (non-fodder) ghosts still standing on this floor that 섬멸 and 속전속결 ask for. A 괴이 소굴
// pack is optional (you may walk past the nest), so it does not count.
export function strongLeft(f: Floor): number {
  return f.enemies.filter((e) => e.hp > 0 && e.kind !== 'gumiho' && !GHOSTS[e.kind].fodder && e.role !== 'lair').length;
}
