import { SETTINGS, type Settings } from '../data/settings.data';

// Player settings (volume). Stored under their own key so a new game keeps them.
// Presentation reads them (sfx); game rules never do.
type Listener = () => void;
const listeners = new Set<Listener>();

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function load(): Settings {
  try {
    const raw = storage()?.getItem(SETTINGS.key);
    const parsed = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
    const volume = typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 1 ? parsed.volume : SETTINGS.defaults.volume;
    return { volume };
  } catch {
    return { ...SETTINGS.defaults };
  }
}

let current: Settings = load();

export const settings = {
  get: (): Settings => current,
  subscribe: (fn: Listener): (() => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  set(patch: Partial<Settings>): void {
    current = { ...current, ...patch };
    try {
      storage()?.setItem(SETTINGS.key, JSON.stringify(current));
    } catch {
      // private mode: keep it for this session only
    }
    listeners.forEach((fn) => fn());
  },
  // Next / previous volume step (wraps in the pause menu, clamps on the title screen).
  stepVolume(by: 1 | -1, wrap: boolean): void {
    const steps = [...SETTINGS.volumeSteps].sort((a, b) => a - b);
    const i = steps.findIndex((v) => v >= current.volume - 1e-6);
    let next = (i < 0 ? steps.length - 1 : i) + by;
    if (wrap) next = (next + steps.length) % steps.length;
    else next = Math.max(0, Math.min(steps.length - 1, next));
    this.set({ volume: steps[next]! });
  },
};

export const volumePercent = (): number => Math.round(current.volume * 100);
