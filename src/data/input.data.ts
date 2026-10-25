// Key bindings (KeyboardEvent.code, or 'Mouse0'/'Mouse2' for mouse buttons). Touch/gamepad will map to the same actions.
export type Action = 'up' | 'down' | 'left' | 'right' | 'attack' | 'dash' | 'draw' | 'confirm' | 'choice1' | 'choice2' | 'choice3';

export const KEY_BINDINGS: Record<Action, readonly string[]> = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  attack: ['KeyJ', 'KeyZ', 'Mouse0'],
  dash: ['Space', 'KeyK', 'KeyX'],
  draw: ['KeyL', 'KeyC', 'ShiftLeft', 'ShiftRight', 'Mouse2'],
  confirm: ['KeyJ', 'KeyZ', 'Enter'],
  choice1: ['Digit1'],
  choice2: ['Digit2'],
  choice3: ['Digit3'],
};
