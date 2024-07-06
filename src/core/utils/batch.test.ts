import { expectEffectContext } from '../../test/matchers';
import { flushMicrotasks } from '../../test/testUtils';
import { compute } from '../atoms/compute';
import { atom } from '../atoms/writableAtom';
import { effect, syncEffect } from '../effects/effect';
import { RUNTIME } from '../internals/runtime';
import { signal } from '../signals/signal';

import { batch } from './batch';

describe('batch()', () => {
  it('should call the specified action', () => {
    const callback = jest.fn();
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

    const callback = jest.fn();
    syncEffect(result, callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('foo bar', expectEffectContext());

    callback.mockClear();
    batch(() => {
      s1.set('Hello');
      s2.set('world!');
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      'Hello world!',
      expectEffectContext(),
    );
  });

  it('should defer all async notifications of atoms until the action is finished', async () => {
    const s1 = atom('foo');
    const s2 = atom('bar');
    const result = compute(() => `${s1()} ${s2()}`);

    const callback = jest.fn();
    effect(result, callback);
    await flushMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('foo bar', expectEffectContext());

    callback.mockClear();
    batch(() => {
      s1.set('Hello');
      s2.set('world!');
    });
    await flushMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      'Hello world!',
      expectEffectContext(),
    );
  });

  it('should defer all sync notifications of signals until the action is finished', () => {
    const signal1 = signal<number>();
    const callback = jest.fn();

    syncEffect(signal1, callback);

    batch(() => {
      signal1(1);
      expect(callback).toHaveBeenCalledTimes(0);

      signal1(2);
      expect(callback).toHaveBeenCalledTimes(0);

      signal1(3);
      expect(callback).toHaveBeenCalledTimes(0);
    });

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(1, expectEffectContext());
    expect(callback).toHaveBeenCalledWith(2, expectEffectContext());
    expect(callback).toHaveBeenCalledWith(3, expectEffectContext());
  });

  it('should defer all async notifications of signals until the action is finished', async () => {
    const signal1 = signal<number>();
    const callback = jest.fn();

    effect(signal1, callback);

    batch(() => {
      signal1(1);
      signal1(2);
      signal1(3);
    });

    await flushMicrotasks();

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(1, expectEffectContext());
    expect(callback).toHaveBeenCalledWith(2, expectEffectContext());
    expect(callback).toHaveBeenCalledWith(3, expectEffectContext());
  });

  it('should allow to create syncEffect and subscribe on its onResult signal', () => {
    const history: number[] = [];
    const source = atom(1);

    batch(() => {
      const fx = syncEffect(source, (v) => v + 10);
      syncEffect(fx.onResult, (r) => history.push(r));
    });

    source.set(2);

    expect(history).toEqual([11, 12]);
  });
});
