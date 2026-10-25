// Key bindings (KeyboardEvent.code). Touch/gamepad will map to the same actions.
export type Action = 'up' | 'down' | 'left' | 'right' | 'attack' | 'wait' | 'draw' | 'confirm' | 'choice1' | 'choice2' | 'choice3';

export const KEY_BINDINGS: Record<Action, readonly string[]> = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  attack: ['KeyJ'],
  wait: ['KeyK', 'Space'],
  draw: ['KeyL'],
  confirm: ['KeyJ', 'Enter'],
  choice1: ['Digit1'],
  choice2: ['Digit2'],
  choice3: ['Digit3'],
};
