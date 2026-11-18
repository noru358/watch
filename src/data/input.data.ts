// Key bindings (KeyboardEvent.code, or 'Mouse0'/'Mouse2' for mouse buttons). One keyboard key (+ one mouse
// button) per action, so the controls stay easy to remember. Touch/gamepad will map to the same actions.
export type Action = 'up' | 'down' | 'left' | 'right' | 'attack' | 'dash' | 'draw' | 'skill' | 'confirm' | 'choice1' | 'choice2' | 'choice3' | 'choice4' | 'pause' | 'interact' | 'mark' | 'assign';

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
  mark: ['KeyF'], // board: put the offer into tonight's joint sortie
  assign: ['KeyR'], // board: change which staff member takes this offer tonight
};

// Touch controls (phones/tablets). A virtual stick on the left half and round buttons on the right.
// Each button presses one bound key code, so every screen hears touch exactly like the keyboard.
// Positions are CSS pixels from the right edge and from the bottom (or top) edge, inside the safe area; r = radius.
export type TouchLayout = 'night' | 'menu' | 'hub';

export interface TouchButton {
  code: string; // a code from KEY_BINDINGS
  labelKey: 'touch.attack' | 'touch.dash' | 'touch.draw' | 'touch.skill' | 'touch.pause' | 'touch.interact' | 'touch.confirm';
  right: number;
  bottom?: number;
  top?: number; // used instead of bottom (the pause button sits top-right)
  r: number;
}

export const TOUCH = {
  stickZone: 0.5, // the left share of the screen that starts the stick
  stickRadius: 64, // px the thumb travels for a full push
  stickDead: 0.2, // share of the radius ignored around the centre
  stickDigital: 0.45, // share of a full push that also counts as W/A/S/D (hub, menus)
  rotateHint: true, // show "turn the phone sideways" in portrait
  look: { fill: 'rgba(20, 16, 31, 0.45)', ring: 'rgba(255, 214, 120, 0.55)', held: 'rgba(255, 214, 120, 0.35)', ink: '#f3e9d2', font: 15 },
  layouts: {
    night: [
      { code: 'KeyJ', labelKey: 'touch.attack', right: 40, bottom: 44, r: 46 },
      { code: 'Space', labelKey: 'touch.dash', right: 140, bottom: 26, r: 34 },
      { code: 'KeyK', labelKey: 'touch.draw', right: 28, bottom: 148, r: 34 },
      { code: 'KeyL', labelKey: 'touch.skill', right: 122, bottom: 118, r: 30 },
      { code: 'Escape', labelKey: 'touch.pause', right: 24, top: 20, r: 22 },
    ],
    menu: [
      { code: 'KeyJ', labelKey: 'touch.confirm', right: 40, bottom: 44, r: 46 },
      { code: 'Escape', labelKey: 'touch.pause', right: 24, top: 20, r: 22 },
    ],
    hub: [{ code: 'KeyE', labelKey: 'touch.interact', right: 40, bottom: 44, r: 46 }],
  } satisfies Record<TouchLayout, readonly TouchButton[]>,
} as const;
