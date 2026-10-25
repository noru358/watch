import { describe, expect, it, vi } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { EventBus } from '../src/core/EventBus';
import { InputManager } from '../src/core/InputManager';
import { PhaseController } from '../src/core/phase';
import { ko } from '../src/i18n/ko';
import { en } from '../src/i18n/en';
import { t } from '../src/i18n';

describe('SeededRNG', () => {
  it('is deterministic for the same seed', () => {
    const a = new SeededRNG(7);
    const b = new SeededRNG(7);
    for (let i = 0; i < 20; i++) expect(a.next()).toBe(b.next());
  });
  it('stays within ranges and samples distinct items', () => {
    const r = new SeededRNG(1);
    for (let i = 0; i < 200; i++) {
      const n = r.int(2, 4);
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(4);
    }
    const s = r.sample([1, 2, 3, 4, 5], 3);
    expect(new Set(s).size).toBe(3);
  });
});

describe('EventBus', () => {
  it('delivers typed payloads and unsubscribes', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    const off = bus.on('enemyKilled', fn);
    bus.emitEvent({ type: 'enemyKilled', x: 1, y: 2, kind: 'cheonyeo', entityId: 3 });
    expect(fn).toHaveBeenCalledWith({ x: 1, y: 2, kind: 'cheonyeo', entityId: 3 });
    off();
    bus.emit('enemyKilled', { x: 0, y: 0, kind: 'cheonyeo', entityId: 1 });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

class FakeWindow {
  handlers: Record<string, ((e: any) => void)[]> = {};
  addEventListener(type: string, fn: (e: any) => void) {
    (this.handlers[type] ??= []).push(fn);
  }
  fire(type: string, code = '', repeat = false) {
    const e = { code, repeat, preventDefault: vi.fn() };
    this.handlers[type]?.forEach((fn) => fn(e));
    return e;
  }
}

describe('InputManager', () => {
  it('only the top context receives input', () => {
    const w = new FakeWindow();
    const input = new InputManager(w);
    input.resetContext('night');
    w.fire('keydown', 'KeyW');
    expect(input.isDown('up', 'night')).toBe(true);
    input.push('modal');
    expect(input.isDown('up', 'night')).toBe(false);
    input.pop();
    expect(input.isDown('up', 'night')).toBe(true);
  });
  it('a press is consumed once and ignores key repeat', () => {
    const w = new FakeWindow();
    const input = new InputManager(w);
    input.resetContext('night');
    w.fire('keydown', 'KeyK');
    w.fire('keydown', 'KeyK', true);
    expect(input.consume('dash', 'night')).toBe(true);
    expect(input.consume('dash', 'night')).toBe(false);
  });
  it('keys work immediately after closing a modal (no click needed)', () => {
    const w = new FakeWindow();
    const input = new InputManager(w);
    input.resetContext('night');
    input.push('modal');
    input.pop();
    w.fire('keydown', 'KeyJ');
    expect(input.consume('attack', 'night')).toBe(true);
  });
  it('mouse buttons act like keys and the pointer is tracked', () => {
    const w = new FakeWindow();
    const input = new InputManager(w);
    input.resetContext('night');
    w.handlers['mousemove']?.forEach((fn) => fn({ clientX: 12, clientY: 34 }));
    w.handlers['mousedown']?.forEach((fn) => fn({ button: 2, clientX: 12, clientY: 34, preventDefault() {} }));
    expect(input.consume('draw', 'night')).toBe(true);
    expect(input.pointer()).toMatchObject({ x: 12, y: 34, moves: 1 });
    w.handlers['mouseup']?.forEach((fn) => fn({ button: 2 }));
    expect(input.isDown('draw', 'night')).toBe(false);
  });

  it('clears held keys on window blur', () => {
    const w = new FakeWindow();
    const input = new InputManager(w);
    input.resetContext('night');
    w.fire('keydown', 'KeyD');
    w.fire('blur');
    expect(input.isDown('right', 'night')).toBe(false);
  });
});

describe('PhaseController', () => {
  it('runs exit then enter handlers once per change', () => {
    const calls: string[] = [];
    const pc = new PhaseController({
      enterDay: () => calls.push('enterDay'),
      exitDay: () => calls.push('exitDay'),
      enterNight: () => calls.push('enterNight'),
      exitNight: () => calls.push('exitNight'),
    });
    pc.setPhase('day');
    pc.setPhase('day');
    pc.setPhase('night');
    expect(calls).toEqual(['enterDay', 'exitDay', 'enterNight']);
  });
});

describe('i18n', () => {
  it('en has exactly the ko key set', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ko).sort());
  });
  it('fills params', () => {
    expect(t('rift.floor', { current: 2, total: 3 })).toBe('2층 / 3');
  });
});
