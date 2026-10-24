import type { Phase } from '../types/ids';

export interface PhaseHandlers {
  enterDay(): void;
  exitDay(): void;
  enterNight(): void;
  exitNight(): void;
}

// The only place that switches between Day (React) and Night (Phaser) (Rule 4).
export class PhaseController {
  private current: Phase | null = null;

  constructor(private readonly handlers: PhaseHandlers) {}

  get phase(): Phase | null {
    return this.current;
  }

  setPhase(next: Phase): void {
    if (this.current === next) return;
    if (this.current === 'day') this.handlers.exitDay();
    if (this.current === 'night') this.handlers.exitNight();
    this.current = next;
    if (next === 'day') this.handlers.enterDay();
    else this.handlers.enterNight();
  }
}
