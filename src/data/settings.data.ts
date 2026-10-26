// Player settings, kept apart from the game save (a new game never resets them).
export const SETTINGS = {
  key: 'seoul-nightwatch.settings',
  defaults: { volume: 0.8 },
  volumeSteps: [1, 0.8, 0.6, 0.4, 0.2, 0], // the pause menu cycles through these; the title steps with A / D
} as const;

export interface Settings {
  volume: number; // 0..1, master volume for every sound
}
