// Key bindings (KeyboardEvent.code, or 'Mouse0'/'Mouse2' for mouse buttons). Touch/gamepad will map to the same actions.
export type Action = 'up' | 'down' | 'left' | 'right' | 'attack' | 'dash' | 'draw' | 'confirm' | 'choice1' | 'choice2' | 'choice3';

export const KEY_BINDINGS: Record<Action, readonly string[]> = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  attack: ['KeyJ', 'Mouse0'],
  dash: ['Space', 'KeyK'],
  draw: ['KeyL', 'Mouse2'],
  confirm: ['KeyJ', 'Enter'],
  choice1: ['Digit1'],
  choice2: ['Digit2'],
  choice3: ['Digit3'],
};
