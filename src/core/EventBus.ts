import type { GameEvent, GameEventMap, GameEventName } from '../types/events';

type Listener<K extends GameEventName> = (payload: GameEventMap[K]) => void;

// Typed presentation bus. Listeners must not mutate game state (Rule 3).
export class EventBus {
  private listeners: { [K in GameEventName]?: Set<Listener<K>> } = {};

  on<K extends GameEventName>(name: K, fn: Listener<K>): () => void {
    let set = this.listeners[name] as Set<Listener<K>> | undefined;
    if (!set) {
      set = new Set();
      (this.listeners as Record<K, Set<Listener<K>>>)[name] = set;
    }
    set.add(fn);
    return () => set.delete(fn);
  }

  emit<K extends GameEventName>(name: K, payload: GameEventMap[K]): void {
    const set = this.listeners[name] as Set<Listener<K>> | undefined;
    set?.forEach((fn) => fn(payload));
  }

  // Emits a tagged event from the simulation's queue.
  emitEvent(event: GameEvent): void {
    const { type, ...payload } = event;
    this.emit(type, payload as GameEventMap[typeof type]);
  }

  clear(): void {
    this.listeners = {};
  }
}

export const eventBus = new EventBus();
