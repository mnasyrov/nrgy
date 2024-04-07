import { flushMicrotasks } from '../test/testUtils';

import { atom } from './atom';
import { batchUpdate } from './batchUpdate';
import { compute } from './compute';
import { effect, syncEffect } from './effect';
import { ENERGY_RUNTIME } from './runtime';
import { signal } from './signal';

describe('batchUpdate()', () => {
  it('should call the specified action', () => {
    const callback = jest.fn();
    batchUpdate(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle inner batch updates correctly', () => {
    const locks = [];

    locks.push(ENERGY_RUNTIME.getBatchUpdateLock());

    batchUpdate(() => {
      locks.push(ENERGY_RUNTIME.getBatchUpdateLock());

      batchUpdate(() => {
        locks.push(ENERGY_RUNTIME.getBatchUpdateLock());
      });

      locks.push(ENERGY_RUNTIME.getBatchUpdateLock());
    });

    locks.push(ENERGY_RUNTIME.getBatchUpdateLock());

    expect(locks).toEqual([0, 1, 2, 1, 0]);
  });

  it('should release lock on errors correctly', () => {
    const locks = [];

    locks.push(ENERGY_RUNTIME.getBatchUpdateLock());

    expect(() => {
      batchUpdate(() => {
        locks.push(ENERGY_RUNTIME.getBatchUpdateLock());

        batchUpdate(() => {
          locks.push(ENERGY_RUNTIME.getBatchUpdateLock());
          throw new Error();
        });

        locks.push(ENERGY_RUNTIME.getBatchUpdateLock());
      });
    }).toThrowError();

    locks.push(ENERGY_RUNTIME.getBatchUpdateLock());

    expect(locks).toEqual([0, 1, 2, 0]);
  });

  it('should defer all sync notifications of atoms until the action is finished', () => {
    const s1 = atom('foo');
    const s2 = atom('bar');
    const result = compute(() => `${s1()} ${s2()}`);

    const callback = jest.fn();
    syncEffect(result, callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('foo bar');

    callback.mockClear();
    batchUpdate(() => {
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

    const callback = jest.fn();
    effect(result, callback);
    await flushMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('foo bar');

    callback.mockClear();
    batchUpdate(() => {
      s1.set('Hello');
      s2.set('world!');
    });
    await flushMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('Hello world!');
  });

  it('should defer all sync notifications of signals until the action is finished', () => {
    const signal1 = signal<number>();
    const callback = jest.fn();

    syncEffect(signal1, callback);

    batchUpdate(() => {
      signal1(1);
      expect(callback).toHaveBeenCalledTimes(0);

      signal1(2);
      expect(callback).toHaveBeenCalledTimes(0);

      signal1(3);
      expect(callback).toHaveBeenCalledTimes(0);
    });

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(1);
    expect(callback).toHaveBeenCalledWith(2);
    expect(callback).toHaveBeenCalledWith(3);
  });

  it('should defer all async notifications of signals until the action is finished', async () => {
    const signal1 = signal<number>();
    const callback = jest.fn();

    effect(signal1, callback);

    batchUpdate(() => {
      signal1(1);
      signal1(2);
      signal1(3);
    });

    await flushMicrotasks();

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(1);
    expect(callback).toHaveBeenCalledWith(2);
    expect(callback).toHaveBeenCalledWith(3);
  });
});
