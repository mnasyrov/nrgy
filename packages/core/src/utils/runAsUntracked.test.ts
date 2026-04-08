import { describe, expect, it, vi } from 'vitest';

import {
  atom,
  compute,
  effect,
  runAsUntracked,
  runEffects,
  syncEffect,
} from '../index';

describe('runAsUntracked()', () => {
  it('should call the specified action and return its result', () => {
    const callback = vi.fn(() => 'result');

    expect(runAsUntracked(callback)).toBe('result');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not subscribe the current reactive context to atoms read inside the callback', () => {
    const a = atom(1);
    const b = atom(10);
    const c = atom(100);

    const result = compute(() => {
      const trackedA = a();
      const untrackedB = runAsUntracked(() => b());
      const trackedC = c();
      return trackedA + untrackedB + trackedC;
    });

    const history: number[] = [];
    effect(result, (value) => history.push(value));
    runEffects();

    expect(history).toEqual([111]);

    b.set(11);
    runEffects();
    expect(history).toEqual([111]);

    c.set(101);
    runEffects();
    expect(history).toEqual([111, 113]);
  });

  it('should restore the tracked context after the callback finishes', () => {
    const a = atom(1);
    const b = atom(10);
    const c = atom(100);

    const result = compute(() => {
      const trackedA = a();
      runAsUntracked(() => b());
      const trackedC = c();
      return trackedA + trackedC;
    });

    const spy = vi.fn();
    effect(result, spy);
    runEffects();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(101);

    b.set(11);
    runEffects();
    expect(spy).toHaveBeenCalledTimes(1);

    c.set(101);
    runEffects();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(102);
  });

  it('should allow updating atoms from an otherwise tracked context', () => {
    const a = atom(1);
    const b = atom(0);

    const mirrored = compute(() => {
      const value = a();
      runAsUntracked(() => b.set(value));
      return value;
    });

    const onError = vi.fn();
    const history: number[] = [];

    effect(mirrored, (value) => history.push(value), { onError });
    runEffects();

    expect(history).toEqual([1]);
    expect(b()).toBe(1);
    expect(onError).toHaveBeenCalledTimes(0);

    a.set(2);
    runEffects();

    expect(history).toEqual([1, 2]);
    expect(b()).toBe(2);
    expect(onError).toHaveBeenCalledTimes(0);
  });

  it('should work in sync effects without tracking nested reads', () => {
    const source = atom(0);
    const nested = atom(10);

    const sourceHistory: number[] = [];
    syncEffect(source, (value) => {
      sourceHistory.push(value);

      runAsUntracked(() => {
        nested();
      });
    });

    expect(sourceHistory).toEqual([0]);

    nested.set(11);
    expect(sourceHistory).toEqual([0]);

    source.set(1);
    expect(sourceHistory).toEqual([0, 1]);
  });
});
