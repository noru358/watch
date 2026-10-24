// Synthesised placeholder sounds (no audio files in Gate 1).
export interface ToneData {
  wave: OscillatorType;
  from: number; // Hz at start
  to: number; // Hz at end
  duration: number; // seconds
  volume: number;
  noise: boolean; // add a white-noise burst
}

export type SfxId = 'hit' | 'kill' | 'pickup' | 'hurt' | 'roll' | 'throw' | 'call' | 'ward' | 'phase' | 'block' | 'clear' | 'parry';

export const SFX: Record<SfxId, ToneData> = {
  hit: { wave: 'square', from: 880, to: 440, duration: 0.06, volume: 0.08, noise: false },
  kill: { wave: 'sawtooth', from: 520, to: 90, duration: 0.18, volume: 0.1, noise: true },
  pickup: { wave: 'triangle', from: 1200, to: 1800, duration: 0.09, volume: 0.09, noise: false },
  hurt: { wave: 'sawtooth', from: 200, to: 70, duration: 0.22, volume: 0.14, noise: true },
  roll: { wave: 'sine', from: 300, to: 150, duration: 0.1, volume: 0.05, noise: true },
  throw: { wave: 'triangle', from: 1400, to: 1000, duration: 0.03, volume: 0.03, noise: false },
  call: { wave: 'triangle', from: 660, to: 990, duration: 0.25, volume: 0.1, noise: false },
  ward: { wave: 'sine', from: 330, to: 660, duration: 0.3, volume: 0.09, noise: false },
  phase: { wave: 'sawtooth', from: 110, to: 40, duration: 0.8, volume: 0.16, noise: true },
  block: { wave: 'square', from: 1500, to: 1500, duration: 0.08, volume: 0.07, noise: false },
  parry: { wave: 'square', from: 2200, to: 600, duration: 0.25, volume: 0.12, noise: true },
  clear: { wave: 'triangle', from: 523, to: 1046, duration: 0.4, volume: 0.1, noise: false },
};
