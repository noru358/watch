// Key bindings (KeyboardEvent.code, or 'Mouse0'/'Mouse2' for mouse buttons). One keyboard key (+ one mouse
// button) per action, so the controls stay easy to remember. Touch/gamepad will map to the same actions.
export type Action = 'up' | 'down' | 'left' | 'right' | 'attack' | 'dash' | 'draw' | 'skill' | 'confirm' | 'choice1' | 'choice2' | 'choice3' | 'choice4' | 'pause' | 'interact';

export const KEY_BINDINGS: Record<Action, readonly string[]> = {
  up: ['KeyW'],
  down: ['KeyS'],
  left: ['KeyA'],
  right: ['KeyD'],
  attack: ['KeyJ', 'Mouse0'],
  dash: ['Space'],
  draw: ['KeyK', 'Mouse2'],
  skill: ['KeyL'], // the equipped active skill (4th combat button)
  confirm: ['KeyJ', 'Enter'],
  choice1: ['Digit1'],
  choice2: ['Digit2'],
  choice3: ['Digit3'],
  choice4: ['Digit4'],
  pause: ['Escape'],
  interact: ['KeyE'], // hub: talk / use (souls-style)
};
