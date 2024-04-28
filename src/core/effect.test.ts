import { flushMicrotasks } from '../test/testUtils';

import { atom, AtomUpdateError } from './atom';
import { compute } from './compute';
import {
  effect,
  isForcedSyncSource,
  selectScheduler,
  syncEffect,
} from './effect';
import { ENERGY_RUNTIME } from './runtime';
import { getSignalNode, signal } from './signal';

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

    expect(onResult).toHaveBeenLastCalledWith(1);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(syncOnDestroy).toHaveBeenCalledTimes(0);
    expect(asyncOnDestroy).toHaveBeenCalledTimes(0);

    source.destroy();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(syncOnDestroy).toHaveBeenCalledTimes(1);

    // onDestory is a signal which is forced to be synchronous
    expect(asyncOnDestroy).toHaveBeenCalledTimes(1);
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

describe('isForcedSyncSource()', () => {
  it('should return true if the source is a signal with forced "sync" option', () => {
    expect(isForcedSyncSource(signal({ sync: true }))).toBe(true);
    expect(isForcedSyncSource(signal({ sync: false }))).toBe(false);
    expect(isForcedSyncSource(signal())).toBe(false);
    expect(isForcedSyncSource('some value')).toBe(false);
  });
});

describe('selectScheduler()', () => {
  it('should return a scheduler specified by the options', () => {
    const scheduler1 = selectScheduler(signal(), {
      scheduler: ENERGY_RUNTIME.syncScheduler,
    });
    expect(scheduler1).toBe(ENERGY_RUNTIME.syncScheduler);

    const scheduler2 = selectScheduler(signal(), {
      scheduler: ENERGY_RUNTIME.asyncScheduler,
    });
    expect(scheduler2).toBe(ENERGY_RUNTIME.asyncScheduler);
  });

  it('should return a scheduler specified by the "sync" option', () => {
    const scheduler1 = selectScheduler(signal(), {
      sync: true,
    });
    expect(scheduler1).toBe(ENERGY_RUNTIME.syncScheduler);

    const scheduler2 = selectScheduler(signal(), undefined);
    expect(scheduler2).toBe(ENERGY_RUNTIME.asyncScheduler);
  });

  it('should return a scheduler specified by the "sync" option of the signal', () => {
    expect(selectScheduler(atom(1), undefined)).toBe(
      ENERGY_RUNTIME.asyncScheduler,
    );

    expect(selectScheduler(signal(), undefined)).toBe(
      ENERGY_RUNTIME.asyncScheduler,
    );

    expect(selectScheduler(signal({ sync: true }), undefined)).toBe(
      ENERGY_RUNTIME.syncScheduler,
    );
  });
});

describe('Effect with a primitive value', () => {
  it('should trigger the syncEffect', () => {
    const source = atom(false);
    const callback = jest.fn();

    syncEffect(source, callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(false);

    callback.mockClear();
    source.set(true);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(true);
  });

  it('should trigger the effect', async () => {
    const source = atom(false);
    const callback = jest.fn();

    effect(source, callback);

    await flushMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(false);

    callback.mockClear();
    source.set(true);

    await flushMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(true);
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
    expect(callback).toHaveBeenCalledWith(42);
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
    expect(signalCallback).toHaveBeenCalledWith(2);

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
    expect(signalCallback).toHaveBeenCalledWith(1);

    signalCallback.mockClear();
    a.set(2);
    await flushMicrotasks();
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(2);

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
    expect(errorCallback).toHaveBeenNthCalledWith(1, new AtomUpdateError('b'));
    expect(errorCallback).toHaveBeenNthCalledWith(2, new AtomUpdateError('b'));
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
    expect(signalCallback).toHaveBeenCalledWith(1);

    signalCallback.mockClear();
    a.set(2);
    await flushMicrotasks();
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(2);

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
