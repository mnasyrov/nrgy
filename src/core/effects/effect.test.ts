import { expectEffectContext } from '../../test/matchers';
import { flushMicrotasks, promiseTimeout } from '../../test/testUtils';
import { AtomUpdateError } from '../atoms/atom';
import { compute } from '../atoms/compute';
import { atom } from '../atoms/writableAtom';
import { getSignalNode } from '../signals/common';
import { signal } from '../signals/signal';
import { keepLastValue } from '../utils/keepLastValue';

import { effect, syncEffect } from './effect';

describe('effect()', () => {
  it('should subscribe to a signal', async () => {
    const emitter = signal<number>();

    let result = 0;
    const fx = effect(emitter, (value) => (result = value));

    await flushMicrotasks();
    expect(result).toBe(0);

    emitter(1);
    await flushMicrotasks();
    expect(result).toBe(1);

    fx.destroy();
    emitter(2);
    await flushMicrotasks();
    expect(result).toBe(1);
  });

  it('should subscribe to an atom', async () => {
    const a = atom(1);

    let result = 0;
    const fx = effect(a, (value) => (result = value));
    await flushMicrotasks();
    expect(result).toBe(1);

    a.set(2);
    await flushMicrotasks();
    expect(result).toBe(2);

    fx.destroy();
    a.set(3);
    await flushMicrotasks();
    expect(result).toBe(2);
  });

  it('should subscribe to a compute', async () => {
    const a = atom(1);
    const b = atom(2);

    let result = 0;
    const fx = effect(
      compute(() => a() + b()),
      (value) => (result = value),
    );

    await flushMicrotasks();
    expect(result).toBe(3);

    a.set(2);
    await flushMicrotasks();
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    await flushMicrotasks();
    expect(result).toBe(4);
  });

  it('should handle a computing function', async () => {
    const a = atom(1);
    const b = atom(2);

    let result = 0;
    const fx = effect([a, b], ([a, b]) => (result = a + b));

    await flushMicrotasks();
    expect(result).toBe(3);

    a.set(2);
    await flushMicrotasks();
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    await flushMicrotasks();
    expect(result).toBe(4);
  });

  it('should not lost its subscription context', async () => {
    const a = atom(0);

    const results: number[] = [];
    effect(a, (value) => results.push(value));
    await flushMicrotasks();

    a.set(1);
    a.set(2);
    await flushMicrotasks();
    expect(results).toEqual([0, 2]);

    a.set(3);
    a.set(4);
    expect(a()).toEqual(4);

    await flushMicrotasks();
    expect(results).toEqual([0, 2, 4]);
  });

  it('should be destroyed when a source atom is destroyed', async () => {
    const source = atom(1);
    const fx = effect(source, (value) => value * value);

    const onResult = jest.fn();
    const syncOnDestroy = jest.fn();
    const asyncOnDestroy = jest.fn();

    effect(fx.onResult, onResult);
    syncEffect(fx.onDestroy, syncOnDestroy);
    effect(fx.onDestroy, asyncOnDestroy);

    await flushMicrotasks();

    expect(onResult).toHaveBeenLastCalledWith(1, expectEffectContext());
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(syncOnDestroy).toHaveBeenCalledTimes(0);
    expect(asyncOnDestroy).toHaveBeenCalledTimes(0);

    source.destroy();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(syncOnDestroy).toHaveBeenCalledTimes(1);

    // onDestory is a signal which is forced to be synchronous
    expect(asyncOnDestroy).toHaveBeenCalledTimes(1);
  });

  it('should be destroyed when a computed atom is destroyed #2', () => {
    const source = atom(1);
    const fx = syncEffect(source, () => {});
    source.destroy();
    expect(getSignalNode(fx.onDestroy).isDestroyed).toBe(true);
  });

  it('should be destroyed when a source computed atom is destroyed', () => {
    const source = atom(1);
    const computed = compute(() => source());
    const fx = syncEffect(computed, () => {});
    source.destroy();
    expect(getSignalNode(fx.onDestroy).isDestroyed).toBe(true);
  });

  it('should be destroyed without errors even if a the reference to the source signal is lost', async () => {
    const source = signal();

    const node = getSignalNode(source);
    let refValue: any = node;
    (node as any).ref = {
      deref: () => refValue,
    };

    const fx = effect(source, () => {});

    const onDestroy = jest.fn();

    syncEffect(fx.onDestroy, onDestroy);
    expect(onDestroy).toHaveBeenCalledTimes(0);

    refValue = undefined;
    expect(() => fx.destroy()).not.toThrow();
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });
});

describe('syncEffect()', () => {
  it('should subscribe to a signal', () => {
    const emitter = signal<number>();

    let result = 0;
    const fx = syncEffect(emitter, (value) => (result = value));
    expect(result).toBe(0);

    emitter(1);
    expect(result).toBe(1);

    fx.destroy();
    emitter(2);
    expect(result).toBe(1);
  });

  it('should subscribe to an atom', () => {
    const a = atom(1);

    let result = 0;
    const fx = syncEffect(a, (value) => (result = value));
    expect(result).toBe(1);

    a.set(2);
    expect(result).toBe(2);

    fx.destroy();
    a.set(3);
    expect(result).toBe(2);
  });

  it('should subscribe to a compute', () => {
    const a = atom(1);
    const b = atom(2);

    let result = 0;
    const fx = syncEffect(
      compute(() => a() + b()),
      (value) => (result = value),
    );
    expect(result).toBe(3);

    a.set(2);
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    expect(result).toBe(4);
  });

  it('should handle a computing function', () => {
    const a = atom(1);
    const b = atom(2);

    let result = 0;
    const fx = syncEffect([a, b], ([a, b]) => (result = a + b));
    expect(result).toBe(3);

    a.set(2);
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    expect(result).toBe(4);
  });
});

describe('Effect with a primitive value', () => {
  it('should trigger the syncEffect', () => {
    const source = atom(false);
    const callback = jest.fn();

    syncEffect(source, callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(false, expectEffectContext());

    callback.mockClear();
    source.set(true);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(true, expectEffectContext());
  });

  it('should trigger the effect', async () => {
    const source = atom(false);
    const callback = jest.fn();

    effect(source, callback);

    await flushMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(false, expectEffectContext());

    callback.mockClear();
    source.set(true);

    await flushMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(true, expectEffectContext());
  });

  it('should chain signals', async () => {
    const signal1 = signal<number>();
    const signal2 = signal<number>();

    const callback = jest.fn();
    effect(signal1, callback);
    effect(signal2, signal1);

    signal2(42);

    await flushMicrotasks();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(42, expectEffectContext());
  });
});

describe('Untracked context in the signal effect', () => {
  it('should be possible to update other atoms', async () => {
    const s1 = signal<number>();
    const b = atom(0);

    const fx = effect(s1, (value) => b.set(value));

    const errorCallback = jest.fn();
    effect(fx.onError, errorCallback);

    await flushMicrotasks();
    expect(b()).toBe(0);

    s1(2);
    await flushMicrotasks();
    expect(b()).toBe(2);

    expect(errorCallback).toHaveBeenCalledTimes(0);
  });

  it('should be possible to notify signals', async () => {
    const s1 = signal<number>();
    const s2 = signal<number>();

    const signalCallback = jest.fn();
    effect(s2, signalCallback);

    const fx = effect(s1, (value) => s2(value));

    const errorCallback = jest.fn();
    effect(fx.onError, errorCallback);

    await flushMicrotasks();
    expect(signalCallback).toHaveBeenCalledTimes(0);

    signalCallback.mockClear();
    s1(2);
    await flushMicrotasks();
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(2, expectEffectContext());

    expect(errorCallback).toHaveBeenCalledTimes(0);
  });
});

describe('Untracked context in the atom effect with the explicit dependency', () => {
  it('should be possible to update other atoms', async () => {
    const a = atom(1);
    const b = atom(0);

    const fx = effect(a, (value) => b.set(value));

    const errorCallback = jest.fn();
    effect(fx.onError, errorCallback);

    await flushMicrotasks();
    expect(b()).toBe(1);

    a.set(2);
    await flushMicrotasks();
    expect(b()).toBe(2);

    expect(errorCallback).toHaveBeenCalledTimes(0);
  });

  it('should be possible to notify signals', async () => {
    const a = atom(1);
    const s = signal<number>();

    const signalCallback = jest.fn();
    effect(s, signalCallback);

    const fx = effect(a, (value) => s(value));

    const errorCallback = jest.fn();
    effect(fx.onError, errorCallback);

    await flushMicrotasks();
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(1, expectEffectContext());

    signalCallback.mockClear();
    a.set(2);
    await flushMicrotasks();
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(2, expectEffectContext());

    expect(errorCallback).toHaveBeenCalledTimes(0);
  });
});

describe('Tracked context in the effect with implicit dependencies', () => {
  it('should be NOT possible to update any atoms', async () => {
    const a = atom(1, { name: 'a' });
    const b = atom(0, { name: 'b' });

    const fx = effect(
      compute(() => {
        const value = a();
        b.set(value);
      }),
      () => {},
    );

    const errorCallback = jest.fn();
    effect(fx.onError, errorCallback);

    await flushMicrotasks();
    expect(b()).toBe(0);

    a.set(2);
    await flushMicrotasks();
    expect(b()).toBe(0);

    expect(errorCallback).toHaveBeenCalledTimes(2);
    expect(errorCallback).toHaveBeenNthCalledWith(
      1,
      new AtomUpdateError('b'),
      expectEffectContext(),
    );
    expect(errorCallback).toHaveBeenNthCalledWith(
      2,
      new AtomUpdateError('b'),
      expectEffectContext(),
    );
  });

  it('should be possible to notify signals', async () => {
    const a = atom(1);
    const s = signal<number>();

    const signalCallback = jest.fn();
    effect(s, signalCallback);

    const fx = effect(a, (value) => {
      return s(value);
    });

    const errorCallback = jest.fn();
    effect(fx.onError, errorCallback);

    await flushMicrotasks();
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(1, expectEffectContext());

    signalCallback.mockClear();
    a.set(2);
    await flushMicrotasks();
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(2, expectEffectContext());

    expect(errorCallback).toHaveBeenCalledTimes(0);
  });
});

describe('@regression Cycled effect on reading and updating the same atom', () => {
  it('should not trigger an infinite loop', async () => {
    const inputs = atom<string[]>([]);
    const store = atom<{ [key: string]: number }>({});

    effect(inputs, (items) => {
      const prevState = store();

      const nextState = { ...prevState };

      items.forEach((item) => {
        nextState[item] = (nextState[item] || 0) + 1;
      });

      const set = new Set(items);
      Object.keys(nextState).forEach((key) => {
        if (!set.has(key)) {
          delete nextState[key];
        }
      });

      store.set(nextState);
    });

    await flushMicrotasks();
    expect(store()).toEqual({});

    inputs.set(['a']);
    await flushMicrotasks();
    expect(store()).toEqual({ a: 1 });

    inputs.set(['a', 'b']);
    await flushMicrotasks();
    expect(store()).toEqual({ a: 2, b: 1 });

    inputs.set(['b', 'c']);
    await flushMicrotasks();
    expect(store()).toEqual({ b: 2, c: 1 });
  });

  it('should not trigger an infinite loop with signals', async () => {
    type State = { [key: string]: number };

    const inputs = atom<string[]>([]);
    const store = atom<State>({});

    const updateStore = signal<State>();
    effect(updateStore, (state) => store.set(state));

    effect(inputs, (items) => {
      const prevState = store();

      const nextState = { ...prevState };

      items.forEach((item) => {
        nextState[item] = (nextState[item] || 0) + 1;
      });

      const set = new Set(items);
      Object.keys(nextState).forEach((key) => {
        if (!set.has(key)) {
          delete nextState[key];
        }
      });

      updateStore(nextState);
    });

    await flushMicrotasks();
    expect(store()).toEqual({});

    inputs.set(['a']);
    await flushMicrotasks();
    expect(store()).toEqual({ a: 1 });

    inputs.set(['a', 'b']);
    await flushMicrotasks();
    expect(store()).toEqual({ a: 2, b: 1 });

    inputs.set(['b', 'c']);
    await flushMicrotasks();
    expect(store()).toEqual({ b: 2, c: 1 });
  });
});

describe('Explicit dependencies in the effect', () => {
  it('should be possible specify explicit Atom dependencies', async () => {
    const atomA = atom(1);
    const atomB = atom(0);
    const store = atom(0);

    effect([atomA, atomB], ([a, b]) => {
      store.update((prev) => prev + a + b);
    });

    await flushMicrotasks();
    expect(store()).toBe(1);

    atomA.set(2);
    await flushMicrotasks();
    expect(store()).toBe(3);

    atomB.set(3);
    await flushMicrotasks();
    expect(store()).toBe(8);
  });
});

describe('Returning a promise by the action', () => {
  it('should allow to use a promise inside effect callback', async () => {
    const isPending = atom(false);
    const source = signal<number>();

    const pendingCallback = jest.fn();
    syncEffect(isPending, (value) => pendingCallback(value));

    const fx = effect<number, number>(source, async (value) => {
      isPending.set(true);

      await promiseTimeout(0);
      isPending.set(false);

      return value * value;
    });

    const result = keepLastValue(fx.onResult);

    source(3);
    await promiseTimeout(50);

    expect(pendingCallback).toHaveBeenCalledTimes(3);
    expect(pendingCallback).toHaveBeenNthCalledWith(1, false);
    expect(pendingCallback).toHaveBeenNthCalledWith(2, true);
    expect(pendingCallback).toHaveBeenNthCalledWith(3, false);

    expect(result()).toBe(9);
  });

  it('should pass a resolved value to onResult of the effect from the signal', async () => {
    const source = signal<number>();
    const fx = effect(source, async (x) => x + 10);

    const results: number[] = [];
    syncEffect(fx.onResult, (x) => results.push(x));

    source(2);
    await promiseTimeout(50);

    expect(results).toEqual([12]);
  });

  it('should pass a rejected error to onError of the effect from the signal', async () => {
    const source = signal<number>();
    const fx = effect(source, () => Promise.reject('error'));

    const results: number[] = [];
    const errors: any[] = [];
    syncEffect(fx.onResult, (x) => results.push(x));
    syncEffect(fx.onError, (x) => errors.push(x));

    source(2);
    await promiseTimeout(50);

    expect(results).toEqual([]);
    expect(errors).toEqual(['error']);
  });

  it('should pass a resolved value to onResult of the effect from the atom', async () => {
    const source = atom<number>(1);
    const fx = effect(source, async (x) => x + 10);

    const results: number[] = [];
    syncEffect(fx.onResult, (x) => results.push(x));

    await promiseTimeout(50);
    source.set(2);

    await promiseTimeout(50);
    expect(results).toEqual([11, 12]);
  });

  it('should pass a rejected error to onError of the effect from the signal', async () => {
    const source = atom<number>(1);
    const fx = effect(source, () => Promise.reject('error'));

    const results: number[] = [];
    const errors: any[] = [];
    syncEffect(fx.onResult, (x) => results.push(x));
    syncEffect(fx.onError, (x) => errors.push(x));

    source.set(2);
    await promiseTimeout(50);

    expect(results).toEqual([]);
    expect(errors).toEqual(['error']);
  });
});
