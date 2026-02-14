import { describe, expect, it, vi } from 'vitest';
import {
  atom,
  compute,
  effect,
  RUNTIME,
  syncEffect,
} from '../reactivity/reactivity';

import { batch } from './batch';
import { runEffects } from './runEffects';

describe('batch()', () => {
  it('should call the specified action', () => {
    const callback = vi.fn();
    batch(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle inner batch updates correctly', () => {
    const locks = [];

    locks.push(RUNTIME.batchLock);

    batch(() => {
      locks.push(RUNTIME.batchLock);

      batch(() => {
        locks.push(RUNTIME.batchLock);
      });

      locks.push(RUNTIME.batchLock);
    });

    locks.push(RUNTIME.batchLock);

    expect(locks).toEqual([0, 1, 2, 1, 0]);
  });

  it('should release lock on errors correctly', () => {
    const locks = [];

    locks.push(RUNTIME.batchLock);

    expect(() => {
      batch(() => {
        locks.push(RUNTIME.batchLock);

        batch(() => {
          locks.push(RUNTIME.batchLock);
          throw new Error();
        });

        locks.push(RUNTIME.batchLock);
      });
    }).toThrowError();

    locks.push(RUNTIME.batchLock);

    expect(locks).toEqual([0, 1, 2, 0]);
  });

  it('should defer all sync notifications of atoms until the action is finished', () => {
    const s1 = atom('foo');
    const s2 = atom('bar');
    const result = compute(() => `${s1()} ${s2()}`);

    const callback = vi.fn();
    syncEffect(result, callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('foo bar');

    callback.mockClear();
    batch(() => {
      s1.set('Hello');
      s2.set('world!');
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('Hello world!');
  });

  it('should defer all async notifications of atoms until the action is finished', async () => {
    const s1 = atom('foo');
    const s2 = atom('bar');
    const result = compute(() => `${s1()} ${s2()}`);

    const callback = vi.fn();
    effect(result, callback);
    runEffects();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('foo bar');

    callback.mockClear();
    batch(() => {
      s1.set('Hello');
      s2.set('world!');
    });
    runEffects();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('Hello world!');
  });
});
