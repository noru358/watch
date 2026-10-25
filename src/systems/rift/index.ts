// Public API of the rift module (one floor of a night run, grid turn-based).
export { takeTurn, answerPayphone } from './turn';
export { generateFloor, isFloor, type FloorCarry } from './mapgen';
export { enemyAt } from './space';
export type { Floor, RiftAction, Enemy, Player, Stats, Pos, Dir, FloorStatus } from './types';
