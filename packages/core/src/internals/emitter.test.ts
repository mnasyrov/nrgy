import { describe, expect, it, vi } from 'vitest';
import { Emitter } from './emitter';

describe('Emitter', () => {
  it('should emit values to subscribers', () => {
    const emitter = new Emitter<number>();
    const listener = vi.fn();
    emitter.subscribe(listener);

    emitter.emit(1);
    expect(listener).toHaveBeenCalledWith(1);

    emitter.emit(2);
    expect(listener).toHaveBeenCalledWith(2);
  });

  it('should unsubscribe', () => {
    const emitter = new Emitter<number>();
    const listener = vi.fn();
    const subscription = emitter.subscribe(listener);

    emitter.emit(1);
    expect(listener).toHaveBeenCalledWith(1);

    subscription.destroy();
    emitter.emit(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should clear all listeners on destroy', () => {
    const emitter = new Emitter<number>();
    const listeneration1 = vi.fn();
    const listeneration2 = vi.fn();
    emitter.subscribe(listeneration1);
    emitter.subscribe(listeneration2);

    emitter.emit(1);
    expect(listeneration1).toHaveBeenCalledWith(1);
    expect(listeneration2).toHaveBeenCalledWith(1);

    emitter.destroy();
    emitter.emit(2);
    expect(listeneration1).toHaveBeenCalledTimes(1);
    expect(listeneration2).toHaveBeenCalledTimes(1);
  });
});
